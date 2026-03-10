# URGENT: ProfileSignal → EvaluationMetric Bridge Gap

**Date**: 2026-03-10
**Priority**: CRITICAL — Must be built before Results Dashboard
**Status**: BRIDGE BUILT ✅ (2026-03-10) — Audit pending, then Results Dashboard

---

## 0. CURRENT SESSION STATE (READ THIS FIRST IF COMPRESSED)

**Branch**: `claude/build-results-dashboard-dBiO7`
**Last commit**: `daef09b` — Build ProfileSignal → EvaluationMetric bridge + 5-LLM city recommendation

### What was built this session (8 new files, 1,898 lines):
| File | Purpose |
|------|---------|
| `src/lib/profileSignalBridge.ts` | ProfileSignal[] → EvaluationMetric[] converter + merge with Gemini metrics |
| `src/lib/cityRecommendationOrchestrator.ts` | 5-LLM city recommendation with consensus voting (NOT Gemini-only) |
| `src/lib/evaluationPipeline.ts` | Single entry point: auto-detects data path, wires bridge → cities → evaluation |
| `api/recommend-sonnet.ts` | Claude Sonnet 4.6 city recommender |
| `api/recommend-gemini.ts` | Gemini 3.1 Pro Preview city recommender (Google Search grounding) |
| `api/recommend-gpt54.ts` | GPT-5.4 city recommender |
| `api/recommend-grok.ts` | Grok 4.1 Fast Reasoning city recommender |
| `api/recommend-perplexity.ts` | Sonar Reasoning Pro High city recommender (native web search) |

### Zero existing files were modified.

### What's next (IN ORDER):
1. **AUDIT** — Full codebase audit from conv 1-2 through current. Bug report table created, awaiting owner review.
2. **FIX BUGS** — Only after owner approves which bugs to fix.
3. **BUILD RESULTS DASHBOARD** — The UI that calls `runPipeline()` and displays results from any entry point.
4. **UPDATE BUILD_SCHEDULE.md** — Section 8 "LAST COMPLETED"

---

## 1. THE PROBLEM

The CLUES app is designed as a **step-in/step-out at any point** system. A user can:

- Do ONLY the Paragraphical (30 paragraphs) → get a report (high MOE)
- Do ONLY the Main Module (200 questions) → get a report (high MOE)
- Do ONLY a la carte Mini Modules → get a report (high MOE)
- Do Paragraphical + Main Module → better report (lower MOE)
- Do Paragraphical + Main Module + recommended Mini Modules → best report (MOE ≤ 2%)
- Do any combination of the above in any order

**The gap**: Right now, the ONLY source of `EvaluationMetric[]` for the 5-LLM cascade is Gemini's Paragraphical extraction. If a user skips the Paragraphical and only does the Main Module or Mini Modules, **there are zero metrics to evaluate**. The 5-LLM cascade has nothing to score. The report cannot generate.

---

## 2. COMPLETE ARCHITECTURE MAP

### 2.1 Data Collection Layer (FULLY BUILT ✅)

**8 data sources**, all persisted to Supabase and aggregated:

| Source | File | Questions | Output |
|--------|------|-----------|--------|
| **Globe Selection** | `src/components/Dashboard/GlobeExplorer.tsx` | 1 click | `GlobeSelection { region, lat, lng, zoomLevel }` |
| **Paragraphical** | `src/components/Paragraphical/ParagraphicalFlow.tsx` | 30 paragraphs | Free-form text → sent to Gemini |
| **Demographics** | Main Module Q1-Q34 | 34 questions | `DemographicAnswers` |
| **Do Not Wants (DNW)** | Main Module Q35-Q67 | 33 questions | `DNWAnswers` (dealbreaker severity 1-5) |
| **Must Haves (MH)** | Main Module Q68-Q100 | 33 questions | `MHAnswers` (requirement importance 1-5) |
| **Tradeoffs** | `src/data/questions/tradeoff_questions.ts` | 50 sliders | Slider positions 0-100 |
| **General Questions** | `src/data/questions/general_questions.ts` | 50 questions | Mixed types (Likert, select, etc.) |
| **Mini Modules** | `src/data/questions/{module_id}.ts` × 23 | 100 each (2,300 total) | Per-module answer sets |

### 2.2 The 30 Paragraphs (P1-P30) in 6 Phases

| Phase | Paragraphs | Purpose |
|-------|-----------|---------|
| **Phase 1: Your Profile** | P1 (Who You Are), P2 (Your Life Right Now) | Demographics baseline |
| **Phase 2: Do Not Wants** | P3 (Your Dealbreakers) | Hard elimination filters |
| **Phase 3: Must Haves** | P4 (Your Non-Negotiables) | Required presence thresholds |
| **Phase 4: Trade-offs** | P5 (Your Trade-offs) | Category weighting flexibility |
| **Phase 5: Module Deep Dives** | P6-P28 (1:1 mapped to 23 modules) | Narrative deep dives per life dimension |
| **Phase 6: Your Vision** | P29 (Dream Day), P30 (Anything Else) | Implicit lifestyle + wildcard |

### 2.3 The 23 Category Modules (Funnel Order)

| Tier | # | Module ID | Module Name |
|------|---|-----------|-------------|
| **SURVIVAL** | 1 | `safety_security` | Safety & Security |
| | 2 | `health_wellness` | Health & Wellness |
| | 3 | `climate_weather` | Climate & Weather |
| **FOUNDATION** | 4 | `legal_immigration` | Legal & Immigration |
| | 5 | `financial_banking` | Financial & Banking |
| | 6 | `housing_property` | Housing & Property |
| | 7 | `professional_career` | Professional & Career |
| **INFRASTRUCTURE** | 8 | `technology_connectivity` | Technology & Connectivity |
| | 9 | `transportation_mobility` | Transportation & Mobility |
| | 10 | `education_learning` | Education & Learning |
| | 11 | `social_values_governance` | Social Values & Governance |
| **LIFESTYLE** | 12 | `food_dining` | Food & Dining |
| | 13 | `shopping_services` | Shopping & Services |
| | 14 | `outdoor_recreation` | Outdoor & Recreation |
| | 15 | `entertainment_nightlife` | Entertainment & Nightlife |
| **CONNECTION** | 16 | `family_children` | Family & Children |
| | 17 | `neighborhood_urban_design` | Neighborhood & Urban Design |
| | 18 | `environment_community_appearance` | Environment & Community Appearance |
| **IDENTITY** | 19 | `religion_spirituality` | Religion & Spirituality |
| | 20 | `sexual_beliefs_practices_laws` | Sexual Beliefs, Practices & Laws |
| | 21 | `arts_culture` | Arts & Culture |
| | 22 | `cultural_heritage_traditions` | Cultural Heritage & Traditions |
| | 23 | `pets_animals` | Pets & Animals |

### 2.4 The Main Module (200 Questions)

| Section | Questions | What It Captures |
|---------|-----------|-----------------|
| **Demographics** | Q1-Q34 | Nationality, citizenship, age, household, employment, medical conditions |
| **Do Not Wants** | Q35-Q67 | 33 dealbreaker-severity questions (scale 1-5: Mild → Absolute Deal-Breaker) |
| **Must Haves** | Q68-Q100 | 33 requirement-presence questions |
| **General Questions** | 50 questions | Cross-cutting lifestyle/values signals |
| **Tradeoff Questions** | 50 sliders | Flexibility measures (0-100 continuous) |

Each question has a `modules: string[]` field mapping it to 1+ of the 23 category modules.

### 2.5 Gemini Extraction Pipeline (BUILT ✅)

**File**: `api/paragraphical.ts`
**Model**: `gemini-3.1-pro-preview` (with `thinking_level: "high"`, native Google Search grounding)

**Input**: 30 paragraphs + globe region + optional file uploads (100MB medical/financial records)

**Output** (`GeminiExtraction` in `src/types/index.ts`):
```
metrics: GeminiMetricObject[]          // 100-250 numbered metrics (M1-Mn)
  ├── id, fieldId, description, category (1 of 23 modules)
  ├── source_paragraph (P1-P30), score (0-100)
  ├── user_justification, data_justification, source
  ├── data_type, research_query, threshold?

recommended_countries: { name, iso_code, reasoning, local_currency }[]
recommended_cities: LocationMetrics[]        // Top 3 per country
recommended_towns: LocationMetrics[]         // Top 3 in winning city
recommended_neighborhoods: LocationMetrics[] // Top 3 in winning town

demographic_signals, detected_currency, budget_range
personality_profile, dnw_signals, mh_signals, tradeoff_signals
module_relevance: Record<moduleId, 0-1>
thinking_details: ThinkingStep[]
```

### 2.6 Answer Aggregation Pipeline (BUILT ✅)

**File**: `src/lib/answerAggregator.ts`

Converts ALL 7 questionnaire sources into `ProfileSignal[]`:

```
ProfileSignal {
  moduleId: string       // Which of the 23 modules
  key: string            // "dnw_q35", "mini_safety_q1"
  value: number          // 0-1 normalized
  source: SignalSource   // 'paragraphical' | 'demographics' | 'dnw' | 'mh' | 'tradeoffs' | 'general' | 'mini_module'
  confidence: number     // 0-1
  rawValue: string | number | boolean
}
```

Functions:
- `extractDemographicSignals()` — Demographics → ProfileSignal[]
- `extractDNWSignals()` — DNW answers → ProfileSignal[]
- `extractMHSignals()` — MH answers → ProfileSignal[]
- `extractTradeoffSignals()` — Tradeoff sliders → ProfileSignal[]
- `extractGeneralSignals()` — General questions → ProfileSignal[]
- `extractMiniModuleSignals()` — Mini module answers → ProfileSignal[]
- `aggregateProfile()` — Combines ALL sources into AggregatedProfile

### 2.7 Tier Engine (BUILT ✅)

**File**: `src/lib/tierEngine.ts`

6 tiers based on what data the user has provided (step-in/step-out):

| Tier | Trigger | LLMs | Judge | Tavily |
|------|---------|------|-------|--------|
| `discovery` | Paragraphical only | 1 (Gemini) | Yes | 5 |
| `exploratory` | + Demographics | 2 (+Sonnet) | Yes | 10 |
| `filtered` | + DNW | 3 (+GPT-5.4) | Yes | 15 |
| `evaluated` | + MH | 4 (+Grok) | Yes | 20 |
| `validated` | + General Questions | 5 (+Sonar) | Yes | 200 |
| `precision` | + Mini Modules | 5 (all) | Yes | 200+ |

**Key**: Opus/Cristiano judges at EVERY tier (`useJudge: true` on all 6).

`EvaluationContext` carries ALL data sources:
```typescript
interface EvaluationContext {
  tier: CompletionTier;
  confidence: number;
  paragraphical?: GeminiExtraction;
  demographics?: DemographicAnswers;
  dnw?: DNWAnswers;
  mh?: MHAnswers;
  generalQuestions?: GeneralAnswers;
  completedModules?: string[];
  globeRegion?: string;
}
```

### 2.8 Adaptive Intelligence Layer (BUILT ✅)

**File**: `src/lib/adaptiveEngine.ts`

Bayesian/MCAT-style adaptive question selection:
- EIG (Expected Information Gain) drives which question to ask next
- Prior answers inform future question selection (logic jumps)
- Questions are excluded when they add no information
- Module-level MOE tracks per-dimension accuracy
- Overall MOE target: ≤ 2% (0.02)
- Olivia (AI tutor) recommends which modules to complete

### 2.9 The 5-LLM Evaluation Cascade (BUILT ✅)

**File**: `src/lib/evaluationOrchestrator.ts` (436 lines)

5 LLM evaluators fire in parallel across 23 categories in waves of 2:

| LLM | Endpoint | Model |
|-----|----------|-------|
| Gemini | `/api/evaluate-gemini` | `gemini-3.1-pro-preview` |
| Sonnet | `/api/evaluate-sonnet` | `claude-sonnet-4-6` |
| GPT-5.4 | `/api/evaluate-gpt54` | `gpt-5.4` |
| Grok | `/api/evaluate-grok` | `grok-4-1-fast-reasoning` |
| Sonar | `/api/evaluate-perplexity` | `sonar-reasoning-pro-high` |

Each LLM receives per category:
```
EvaluateRequest {
  sessionId: string
  category: string              // One of 23 module IDs
  metrics: EvaluationMetric[]   // ← THIS IS THE GAP INPUT
  cities: CityCandidate[]
  tavilyResearch: TavilyResult[]
}
```

Each LLM returns per city:
```
CityEvaluation {
  location, country, overall_score (0-100)
  metric_scores: MetricScore[] {
    metric_id, score (0-100), confidence (0-1)
    user_justification, data_justification, source, reasoning
  }
}
```

Consensus building:
- Mean + median per metric per city across all LLMs
- StdDev per location (LLM disagreement within each city)
- Confidence: σ<5 = unanimous, σ<12 = strong, σ<20 = moderate, σ≥20 = split
- Metrics with σ > 15 flagged for Opus judge review

### 2.10 Opus Judge — Cristiano (BUILT ✅)

**File**: `api/judge-opus.ts` (380 lines) + `src/lib/judgeOrchestrator.ts` (496 lines)

- Reviews disputed metrics (σ > 15), max 30 per call
- Analyzes source credibility (.gov > .edu > .org)
- Checks source recency (prefers 2025-2026)
- Identifies outlier LLMs
- Renders final score per disputed metric
- Applies dual scoring (legal vs enforcement) where applicable
- Cannot conduct web search (judge, not investigator)
- Cannot override confidence levels (must match actual StdDev)

**Opus judges at EVERY tier** — `useJudge: true` on all 6 tiers.

### 2.11 Smart Score Engine (BUILT ✅)

**Files**: `src/lib/smartScoreEngine.ts` (327 lines), `src/lib/categoryRollup.ts` (292 lines), `src/lib/relativeScoring.ts` (244 lines), `src/types/smartScore.ts` (323 lines)

Pipeline:
1. Normalize per metric (0-100, judge-adjusted if applicable)
2. Category rollup (weighted average of metrics in category)
3. City rollup (weighted sum of all category scores)
4. Relative scoring (cities scored against each other)
5. Winner determination (score difference < 1 = tie)

### 2.12 Tavily Research Pipeline (BUILT ✅)

**Files**: `api/tavily-research.ts`, `api/tavily-search.ts`, `src/lib/tavilyClient.ts`

- Baseline region research (10 default topics)
- Metric-specific city research (per metric × per city)
- 30-minute TTL cache in Supabase `tavily_cache` table
- Source validation (government/academic detection)

### 2.13 Results Components (PARTIALLY BUILT)

**Directory**: `src/components/Results/`

| Component | Purpose | Status |
|-----------|---------|--------|
| `ReasoningTrace.tsx` | Gemini's thinking_details step-by-step | Built |
| `SideBySideMetricView.tsx` | City vs town vs neighborhood comparison | Built |
| `ReactiveJustification.tsx` | Click metric → highlight source paragraph | Built |
| `FileUpload.tsx` | 100MB medical/financial upload for P7, P10 | Built (misplaced — belongs in Paragraphical) |
| `ThinkingDetailsPanel.tsx` | Full transparency UI | Built |

**NOT built**: Results page routing, neighborhood dedicated UI, PDF report, HeyGen video integration.

---

## 3. THE GAP: ProfileSignal[] → EvaluationMetric[] Bridge

### 3.1 Where the gap is

```
DATA COLLECTION (BUILT ✅)
  ├── Paragraphical → Gemini → GeminiMetricObject[] (100-250 metrics)
  ├── Main Module → answerAggregator → ProfileSignal[]
  └── Mini Modules → answerAggregator → ProfileSignal[]

                    ╔═══════════════════════════════════════╗
                    ║  GAP: NO BRIDGE EXISTS HERE            ║
                    ║                                        ║
                    ║  ProfileSignal[] from Main Module      ║
                    ║  and Mini Modules CANNOT become        ║
                    ║  EvaluationMetric[] for the cascade    ║
                    ║                                        ║
                    ║  If user skips Paragraphical:           ║
                    ║  → Zero metrics → Zero evaluation      ║
                    ║  → Report cannot generate               ║
                    ╚═══════════════════════════════════════╝

EVALUATION PIPELINE (BUILT ✅)
  ├── evaluationOrchestrator takes EvaluationMetric[]
  ├── 5 LLMs score cities against metrics
  ├── Opus judges disagreements
  └── Smart Score engine produces final rankings
```

### 3.2 What the bridge must do

**Input**: `ProfileSignal[]` from any combination of:
- Demographics (34 questions)
- DNW (33 questions)
- MH (33 questions)
- Tradeoffs (50 sliders)
- General Questions (50 questions)
- Mini Module answers (up to 23 × 100 questions)

**Output**: `EvaluationMetric[]` that the 5-LLM cascade can consume

**Requirements**:
1. Each ProfileSignal must map to an EvaluationMetric with:
   - `id` (unique metric ID like "QM1", "QM2" to distinguish from Gemini's "M1", "M2")
   - `fieldId` (matches the question's module mapping)
   - `description` (human-readable metric derived from the question + answer)
   - `category` (one of 23 module IDs — already on the ProfileSignal via `moduleId`)
   - `data_type` (derived from question response type)
   - `research_query` (what Tavily should search to validate this preference)
2. DNW signals must produce DEALBREAKER metrics (cities eliminated if they fail)
3. MH signals must produce REQUIRED metrics (cities penalized if they lack)
4. Tradeoff signals must produce WEIGHTING adjustments (not metrics themselves)
5. When Paragraphical metrics ALSO exist, questionnaire-derived metrics must MERGE with them (not replace)
6. Duplicate coverage (same topic from Paragraphical + questionnaire) should consolidate, not double-count

### 3.3 What the bridge must NOT do

1. Must NOT modify `evaluationOrchestrator.ts` internals
2. Must NOT modify `GeminiMetricObject` or `EvaluationMetric` type definitions
3. Must NOT break Paragraphical-only flow (existing path must still work)
4. Must NOT duplicate metrics already extracted by Gemini
5. Must NOT change the judge system, Smart Score engine, or Tavily pipeline

### 3.4 Where to build it

**New file**: `src/lib/profileSignalBridge.ts`

This file should export:
```typescript
// Convert ProfileSignals from questionnaire answers into EvaluationMetrics
export function convertSignalsToMetrics(
  signals: ProfileSignal[],
  existingGeminiMetrics?: GeminiMetricObject[]  // For dedup
): EvaluationMetric[]

// Merge Gemini-derived metrics with questionnaire-derived metrics
export function mergeAllMetrics(
  geminiMetrics: GeminiMetricObject[],       // From Paragraphical (may be empty)
  questionnaireMetrics: EvaluationMetric[],  // From bridge (may be empty)
): EvaluationMetric[]

// Extract city candidates when Paragraphical was skipped
// (Gemini normally generates recommended_cities — without it, we need another source)
export function deriveCityCandidatesFromSignals(
  signals: ProfileSignal[],
  globeRegion?: string
): CityCandidate[]
```

### 3.5 The city candidate problem

When a user skips the Paragraphical, Gemini never runs. Gemini is what generates `recommended_countries`, `recommended_cities`, `recommended_towns`, `recommended_neighborhoods`. Without Gemini:
- We have metrics (from the bridge) but no cities to evaluate them against
- **Solution options**:
  - A. Run a lightweight Gemini call with just the ProfileSignals to get city candidates
  - B. Use a deterministic city selector based on region + demographics + DNW filters
  - C. Require at minimum a globe region selection and use region-default cities
  - D. Build a separate city recommendation endpoint that doesn't need paragraphs

This is an architectural decision that must be made before building.

---

## 4. ENTRY POINT SCENARIOS (Step-In/Step-Out)

| Scenario | Data Available | Metrics Source | City Source | LLMs |
|----------|---------------|---------------|-------------|------|
| Paragraphical only | 30 paragraphs | Gemini extraction (100-250 metrics) | Gemini recommended_cities | 1 (discovery tier) |
| Main Module only | 200 questions | **BRIDGE** (ProfileSignal → EvaluationMetric) | **NEEDS SOLUTION** | Depends on sections completed |
| Mini Modules only (a la carte) | 100-2300 questions | **BRIDGE** | **NEEDS SOLUTION** | Depends on modules completed |
| Paragraphical + Main Module | 30 paragraphs + 200 questions | Gemini + BRIDGE merged | Gemini recommended_cities | Up to 5 (depends on tier) |
| Paragraphical + Main + Modules | Everything | Gemini + BRIDGE merged | Gemini recommended_cities | 5 (precision tier) |
| Main Module + Mini Modules (no Paragraphical) | 200 + module questions | **BRIDGE** | **NEEDS SOLUTION** | Depends on tier |

---

## 5. EXISTING CODE THAT IS INTACT (Verified 2026-03-10)

**Nothing was deleted.** Full file inventory:

### Evaluation Pipeline Files
| File | Lines | Status |
|------|-------|--------|
| `api/evaluate-gemini.ts` | 350 | ✅ Full implementation |
| `api/evaluate-gpt54.ts` | 330 | ✅ Full implementation |
| `api/evaluate-grok.ts` | 328 | ✅ Full implementation |
| `api/evaluate-perplexity.ts` | 332 | ✅ Full implementation |
| `api/evaluate-sonnet.ts` | 328 | ✅ Full implementation |
| `src/lib/evaluationOrchestrator.ts` | 436 | ✅ Full implementation |
| `src/types/evaluation.ts` | ~160 | ✅ Type definitions |

### Judge System Files
| File | Lines | Status |
|------|-------|--------|
| `api/judge-opus.ts` | 380 | ✅ Full implementation |
| `src/lib/judgeOrchestrator.ts` | 496 | ✅ Full implementation |
| `src/types/judge.ts` | 223 | ✅ Type definitions |

### Smart Score Files
| File | Lines | Status |
|------|-------|--------|
| `src/lib/smartScoreEngine.ts` | 327 | ✅ Full implementation |
| `src/lib/categoryRollup.ts` | 292 | ✅ Full implementation |
| `src/lib/relativeScoring.ts` | 244 | ✅ Full implementation |
| `src/types/smartScore.ts` | 323 | ✅ Type definitions |

### Data Collection Files
| File | Lines | Status |
|------|-------|--------|
| `src/lib/answerAggregator.ts` | ~500 | ✅ Full implementation |
| `src/lib/tierEngine.ts` | 363 | ✅ Full implementation |
| `src/lib/adaptiveEngine.ts` | ~530 | ✅ Full implementation |
| `src/lib/moduleRelevanceEngine.ts` | ~200 | ✅ Full implementation |
| `src/lib/qualityScorer.ts` | ~250 | ✅ Full implementation |
| `src/lib/coverageTracker.ts` | ~300 | ✅ Full implementation |

### Research Files
| File | Lines | Status |
|------|-------|--------|
| `api/tavily-research.ts` | ~200 | ✅ Full implementation |
| `api/tavily-search.ts` | ~200 | ✅ Full implementation |
| `src/lib/tavilyClient.ts` | ~150 | ✅ Full implementation |

---

## 6. BUILD ORDER

1. **BUILD `src/lib/profileSignalBridge.ts`** — The missing bridge
2. **DECIDE** city candidate strategy for non-Paragraphical entry points (Section 3.5)
3. **WIRE** the bridge into the evaluation trigger (wherever `runEvaluation()` is called)
4. **AUDIT** — Verify zero breaking changes to existing pipeline
5. **TEST** — Verify all 6 entry point scenarios work
6. **THEN** build Results Dashboard with neighborhood UI

---

## 7. NON-NEGOTIABLE RULES

- **Gemini model is `gemini-3.1-pro-preview`** — exact ID, no variations
- **30 paragraphs (P1-P30)** in 6 phases — not 27, not 24
- **23 category modules** — exact count
- **2,500 question library** — 23×100 + 100 Main + 50 General + 50 Tradeoffs
- **Opus judges at EVERY tier** — `useJudge: true` on all 6
- **WCAG 2.1 AA compliance** in both dark and light mode for all UI
- **Do not label anything "legacy"** to avoid fixing it
- **Do not claim work is complete without grep verification**
