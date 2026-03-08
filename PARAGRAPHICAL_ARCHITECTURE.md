# PARAGRAPHICAL ARCHITECTURE — Master Reference

> **PURPOSE**: This document captures the complete architectural vision for the CLUES Paragraphical system.
> Every AI assistant and every new conversation MUST read this file FIRST before working on any Paragraphical,
> Gemini extraction, evaluation pipeline, or report-related code.
>
> **Last Updated**: 2026-03-06
> **Status**: CORE IMPLEMENTATION COMPLETE — Gemini 3.1 Pro Preview reasoning engine built

---

## 1. WHAT IS THE PARAGRAPHICAL?

The Paragraphical is the **primary entry point** into the CLUES Intelligence platform. It consists of 30 free-form paragraphs where users describe their life, preferences, needs, and dreams in narrative form. These 30 paragraphs follow the **CLUES decision pipeline** across 6 phases: Profile (P1-P2), Dealbreakers (P3), Must Haves (P4), Trade-offs (P5), Module Deep Dives (P6-P28, one per category module with `moduleId`), and Vision (P29-P30).

The Paragraphical is NOT a lightweight signal extractor. It is designed to produce a **standalone 100+ page report** even if the user never touches the Main Module or the 23 Mini Modules. The Paragraphical alone must be powerful enough to:

1. Convert narrative into 100-250 numbered, researchable metrics
2. Identify the best country (1 primary, up to 3)
3. Identify the top 3 cities in that country
4. Identify the top 3 towns in the winning city
5. Identify the top 3 neighborhoods in the winning town
6. Score every city against every metric with provable, sourced data
7. Produce a full report with source links for every data point

---

## 2. THE FUNDAMENTAL RULE: EVERYTHING IS SOURCED

This is the most important principle in CLUES. **Every single claim, score, and data point in a CLUES report must be backed by real, verifiable data sources.** Not one source — multiple sources. And not just "we found sources" — the actual article URL / direct link is shown to the user.

This mirrors the LifeScore pattern:
- LifeScore has 100 metrics comparing City A vs City B
- Each metric has provable data sources (Numbeo, WHO, Heritage Foundation, etc.)
- Each source includes the specific article/page with a direct link
- Users can click through and verify every claim

CLUES Main does the same thing, except the metrics are **derived from the user's paragraphs** rather than pre-defined.

---

## 3. PARAGRAPH-TO-METRIC CONVERSION (The Key Innovation)

### Step 1: User Writes Paragraphs
30 paragraphs covering their entire life context (see paragraph definitions in `src/data/paragraphs.ts`).

### Step 2: Gemini Converts Paragraphs to Numbered Metrics
Every measurable, researchable preference becomes a discrete metric:

```
From P6 ("Climate & Weather"):
  "I hate humidity and want warm winters around 20-25C"
  -->
  M1: Average annual humidity below 60% [Category: Climate] [Source: P6]
  M2: Average winter temperature 20-25C [Category: Climate] [Source: P6]
  M3: Absence of extreme weather events [Category: Climate] [Source: P6]

From P11 ("Financial & Banking"):
  "I make about 8000 euros a month and want to live comfortably"
  -->
  M15: Monthly cost of living below EUR 4,000 for comfortable lifestyle [Category: Financial] [Source: P11]
  M16: Favorable tax treatment for foreign income [Category: Financial] [Source: P11]

From P14 ("Technology & Connectivity"):
  "I need at least 100mbps for my remote work"
  -->
  M28: Average broadband speed above 100 Mbps [Category: Technology] [Source: P14]
  M29: Reliable coworking space availability [Category: Technology] [Source: P14]
```

### Target: 100-250 Metrics
- **Minimum**: 100 metrics (even from sparse paragraphs, Gemini should extrapolate reasonable metrics)
- **Maximum**: ~250 metrics (from very detailed paragraphs)
- Each metric is:
  - **Numbered** (M1, M2, M3...)
  - **Categorized** (maps to one of 23 category modules (funnel order))
  - **Sourced to a paragraph** (P3, P10, P14)
  - **Researchable** (Tavily can find real data for it)
  - **Scorable** (can be measured as a number, boolean, or ranking)

---

## 4. CURRENCY HANDLING (Global Application)

CLUES is used by Americans, Brits, Europeans, Asians, and Latin Americans. Currency handling is critical.

### Rules:
1. **Detect user's home currency** from paragraph context (mentions euros, pounds, dollars, baht, etc.)
2. **Convert to recommended country's currency** once country is identified
3. **Always show dual currency**: recommended country currency + user's home currency
4. **App provides conversion** — user shouldn't need to calculate manually
5. **Never default to USD-only** — detect from context, ask if ambiguous

### Example:
```
User mentions "8000 euros/month" in P8
Gemini recommends Portugal as top country

Report shows:
  "Monthly rent for 2BR apartment: EUR 1,800 (your currency)
   equivalent to EUR 1,800 (local currency: same)"

If Gemini recommends Thailand:
  "Monthly rent for 2BR apartment: THB 45,000 (EUR 1,150 in your currency)"
```

---

## 5. THE GEMINI PIPELINE (Multi-Call Architecture)

The Paragraphical is NOT a single Gemini call. It is a multi-step pipeline using parallel batch firing (same pattern as LifeScore to handle massive data and avoid timeouts).

### Call 1: EXTRACT (Gemini + Web Search)
**Input**: 30 paragraphs + globe region
**Output**:
- Numbered metrics (M1-Mn, minimum 100)
- Demographic signals (age, gender, household, etc.)
- Personality profile
- Detected currency
- Research queries for each metric (what Tavily should search)
- Initial country/region candidates (broad, not final)

### Tavily Research Phase
**Input**: Metrics + candidate regions
**Output**: Real data with source URLs for each metric in each candidate location
- Multiple sources per metric
- Direct links to source articles
- Structured data (numbers, rankings, indices)

### Call 2: RECOMMEND & SCORE (Gemini + Web Search + Tavily Data)
**Input**: Metrics + Tavily research data + user context
**Output**:
- Top 1 country (allow up to 3)
- Top 3 cities in winning country
- Top 3 towns in winning city
- Top 3 neighborhoods in winning town
- Smart Score for each city vs each metric
- Cities scored RELATIVE to each other
- Source citations with direct URLs for every data point

### Parallel Batch Firing
Due to the massive amount of data (100-250 metrics x multiple cities), this MUST use parallel batch splitting:
- Split metrics into category batches (Climate batch, Safety batch, Financial batch, etc.)
- Fire batches in parallel to avoid timeouts
- Merge results after all batches complete
- Same pattern as LifeScore (categories with >12 metrics split into parallel batches)

---

## 6. OPUS / CRISTIANO JUDGES EVERY STAGE

**Critical clarification**: Opus (Cristiano's brain) is NOT reserved for validated+ tier only. Opus judges EVERY stage, including the Paragraphical-only Discovery tier.

### At Paragraphical (Discovery) Tier:
```
Gemini completes extraction + recommendations + scoring
    |
    v
Opus/Cristiano JUDGES Gemini's work:
    - Reviews all metrics and their derivation from paragraphs
    - Reviews all scores and source data
    - Can UPSCORE any metric for any city
    - Can DOWNSCORE any metric for any city
    - Can OVERRIDE Gemini's recommendations entirely
    - Renders verdict: winner and why
    - Goes through each metric category with analysis
```

### At Main Module Tier (when user completes questionnaires):
```
All 5 LLMs complete their evaluations:
    Gemini (web search) + Sonnet 4.6 + GPT-5.4 + Grok 4.1 Fast Reasoning + Sonar Reasoning Pro High
    |
    v
Opus/Cristiano JUDGES ALL of them:
    - Weighs each LLM's verdict differently
    - Determines which LLM to trust most on which metrics
    - Renders verdict on the TOTALITY and weight of all verdicts
    - Final recommendation with full reasoning
```

### Why Opus is the Judge:
- Opus does NOT have web search — by design
- He judges purely on math, evidence, and reasoning
- Like a courtroom judge who doesn't do his own investigation
- He reviews what the "attorneys" (other LLMs) brought and renders verdict
- His immense mathematical power allows precise up/downscoring

---

## 7. WEB SEARCH STRATEGY

### All LLMs Use Web Search (Except Opus)
Every evaluating LLM uses web search in API calls PLUS Tavily:
- **Gemini**: Google Search grounding (native) + Tavily
- **Claude Sonnet 4.6**: Web search tool + Tavily
- **GPT-5.4**: Bing search integration + Tavily
- **Grok 4.1 Fast Reasoning**: X/Twitter real-time data + Tavily
- **Perplexity Sonar Reasoning Pro High**: Native web search (built-in) + Tavily

### Tavily's Role
Tavily provides:
1. **Research** — baseline context for candidate regions (cached 30 min)
2. **Search** — metric-specific real-time data per city
3. **Source URLs** — direct links to articles backing every data point

---

## 8. SMART SCORE TECHNOLOGY

Every metric for every city gets a Smart Score (0-100). Cities are scored RELATIVE to each other, not in isolation.

```
Example: M28 "Broadband speed above 100 Mbps"

Lisbon:    Avg 150 Mbps → Smart Score: 78
Valencia:  Avg 200 Mbps → Smart Score: 92
Athens:    Avg 80 Mbps  → Smart Score: 45

Sources:
  - Speedtest Global Index (speedtest.net/global-index/portugal)
  - OECD Broadband Portal (oecd.org/digital/broadband)
  - Cable.co.uk Speed Rankings (cable.co.uk/broadband/speed)
```

### Category Smart Scores
Metrics roll up into category scores:
- Climate Smart Score (average of M1, M2, M3...)
- Safety Smart Score (average of M4, M5, M6...)
- Financial Smart Score (average of M15, M16, M17...)
- ...for all 23 categories

### Overall City Smart Score
Category scores roll up into overall city score, weighted by user's implied priorities from paragraph content.

---

## 9. CRISTIANO'S DELIVERY PIPELINE

Cristiano (powered by Opus) delivers findings in two formats:

### Quick Verdict — Simli
- Real-time avatar narration
- Basic verdict and findings summary
- Available immediately after evaluation

### WOW Moment — HeyGen (5-minute cinematic video)
- "Your New Life in [WINNING CITY]"
- Covers the winning city from the top 3
- Walks through top 3 towns in that city
- Walks through top 3 neighborhoods
- Cinematic, personal, emotional narrative
- The user's ultimate deliverable moment

---

## 10. REPORT STRUCTURE (Even from Paragraphical Only)

A Paragraphical-only Discovery report still produces a 100+ page document:

```
SECTION 1: YOUR PROFILE (from paragraph extraction)
  - Who you are, your situation, your needs
  - Personality profile
  - Key priorities identified

SECTION 2: YOUR METRICS (100-250 numbered metrics)
  - Each metric with source paragraph reference
  - Organized by Funnel Flow categories
  - Each metric defines what will be measured

SECTION 3: COUNTRY ANALYSIS
  - Top country (up to 3)
  - Why this country matches your metrics
  - Category-by-category breakdown
  - Sources with direct links

SECTION 4: CITY COMPARISONS (Smart Score Tables)
  - Top 3 cities scored against every metric
  - City vs city comparison tables (like LifeScore)
  - Each score backed by sourced data with links
  - Category Smart Scores + Overall Smart Scores

SECTION 5: TOWN ANALYSIS
  - Top 3 towns in the winning city
  - Town-specific scoring on relevant metrics

SECTION 6: NEIGHBORHOOD ANALYSIS
  - Top 3 neighborhoods in the winning town
  - Neighborhood-specific details

SECTION 7: CRISTIANO'S VERDICT
  - Judge's analysis of each category
  - Why each city did well or poorly on specific metrics
  - Final court orders (the ruling)
  - Winner declaration with full reasoning

SECTION 8: NEXT STEPS
  - What completing DNWs would add (+15% confidence)
  - What completing MHs would add (+10% confidence)
  - Encouragement without forcing
```

---

## 11. LOCATION HIERARCHY

The recommendation structure follows a strict hierarchy:

```
1 COUNTRY (primary, up to 3)
  |
  +-- 3 CITIES (top 3 in winning country)
       |
       +-- [WINNING CITY]
            |
            +-- 3 TOWNS (top 3 in winning city)
                 |
                 +-- [WINNING TOWN]
                      |
                      +-- 3 NEIGHBORHOODS (top 3 in winning town)
```

**Country comes first.** The system identifies the best country, THEN drills into cities within that country, THEN towns within the winning city, THEN neighborhoods within the winning town.

---

## 12. DOWNSTREAM MODULES (How They Interact)

The 23 Mini Modules and Main Module questionnaire are DOWNSTREAM of the Paragraphical:
- They may or may not be completed by the user
- When completed, they ADD precision to the Paragraphical's metrics
- They can ADD new metrics the paragraphs didn't cover
- They can REFINE metric weights and priorities
- They trigger additional LLMs (Sonnet 4.6, GPT-5.4, Grok 4.1 Fast Reasoning, Sonar Reasoning Pro High)
- They do NOT replace the Paragraphical — they enhance it

The Paragraphical must stand alone as a complete evaluation. Modules make it better, not make it work.

---

## 13. GEMINI EXTRACTION OUTPUT (Revised Schema)

The old `GeminiExtraction` schema is OBSOLETE. The current schema (Gemini 3.1 Pro Preview with thinking + search):

```typescript
// Source of truth: api/paragraphical.ts

interface GeminiMetricObject {
  id: string;                      // "M1", "M2", etc.
  fieldId: string;                 // Machine-readable field ID
  description: string;             // "Average winter temperature 20-25C"
  category: string;                // "climate", "safety", "financial"... (23 categories)
  source_paragraph: number;        // Which paragraph (1-30)
  score: number;                   // 0-100
  user_justification: string;      // Why this matters to the user (traced to paragraph)
  data_justification: string;      // Real-world data backing the score
  source: string;                  // Data source attribution
  data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
  research_query: string;          // What Tavily should search
  threshold?: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | [number, number];
    unit: string;                  // "celsius", "percent", "USD", "index"
  };
}

interface LocationMetrics {
  location: string;                // City/town/neighborhood name
  country: string;
  location_type: 'city' | 'town' | 'neighborhood';
  parent?: string;                 // Parent city/town for towns/neighborhoods
  overall_score: number;           // 0-100 overall match score
  metrics: GeminiMetricObject[];   // Per-location scored metrics
}

interface ThinkingStep {
  step: number;
  thought: string;
  conclusion?: string;
}

interface GeminiExtraction {
  // ─── Profile ───
  demographic_signals: {
    age?: number;
    gender?: string;
    household_size?: number;
    has_children?: boolean;
    has_pets?: boolean;
    employment_type?: string;
    income_bracket?: string;
  };
  personality_profile: string;

  // ─── Currency ───
  detected_currency: string;         // "EUR", "GBP", "USD", "THB", etc.
  budget_range: {
    min: number;
    max: number;
    currency: string;                // User's home currency
  };

  // ─── Metrics (THE KEY OUTPUT — with dual justifications) ───
  metrics: GeminiMetricObject[];     // Minimum 100, up to 250

  // ─── Location Recommendations (each carries its own scored metrics) ───
  recommended_countries: {
    name: string;
    iso_code: string;
    reasoning: string;
    local_currency: string;
  }[];                               // 1 primary, up to 3

  recommended_cities: LocationMetrics[];         // Top 3 per country, with per-city metrics
  recommended_towns: LocationMetrics[];          // Top 3 in winning city, with per-town metrics
  recommended_neighborhoods: LocationMetrics[];  // Top 3 in winning town, with per-neighborhood metrics

  // NOTE: There is NO separate "location_metrics" field.
  // Per-location scoring is embedded inside LocationMetrics.metrics[].

  // ─── Paragraph Summaries ───
  paragraph_summaries: {
    id: number;
    key_themes: string[];
    extracted_preferences: string[];
    metrics_derived: string[];       // ["M1", "M2", "M5"] — which metrics came from this paragraph
  }[];

  // ─── Signals for Downstream ───
  dnw_signals: string[];             // Potential dealbreakers for DNW pre-fill
  mh_signals: string[];              // Potential must-haves for MH pre-fill
  tradeoff_signals: string[];        // Priority trade-offs: "safety > cost of living"
  module_relevance: Record<string, number>;  // Module ID → 0-1 relevance
  globe_region_preference: string;   // User's geographic preference

  // ─── Thinking Details (reasoning chain transparency) ───
  thinking_details?: ThinkingStep[]; // Gemini 3.1 reasoning trace steps
}
```

---

## 14. SMART SCORE OUTPUT (After Tavily + Gemini Call 2)

```typescript
interface CitySmartScore {
  city: string;
  country: string;
  overall_score: number;             // 0-100
  category_scores: Record<string, number>;  // "climate": 85, "safety": 72
  metric_scores: {
    metric_id: string;               // "M1"
    score: number;                   // 0-100 (relative to other cities)
    raw_value: string;               // "23.4C average"
    sources: {
      name: string;                  // "WeatherSpark"
      url: string;                   // Direct link
      excerpt: string;               // Relevant snippet
    }[];
  }[];
}
```

---

## 15. LIFESCORE DEEP STUDY — Patterns to Follow

> **Source**: Complete analysis of `github.com/johndesautels1/lifescore` (cloned 2026-03-05)
> LifeScore is the ONLY fully operational module. Its patterns are proven.
> CLUES Main follows these exact patterns with paragraph-derived metrics instead of pre-defined ones.

### 15.1 METRIC DEFINITION STRUCTURE (How LifeScore Defines 100 Metrics)

Each metric in LifeScore follows the `MetricDefinition` interface:

```typescript
{
  id: string;                           // Format: XX_NN_name (e.g., pf_01_cannabis_legal)
  categoryId: CategoryId;               // One of 6 categories
  name: string;                         // Full human-readable name
  shortName: string;                    // Abbreviated for tight UI
  description: string;                  // Context/purpose
  weight: number;                       // 1-10 (intra-category importance)
  scoringDirection: 'higher_is_better' | 'lower_is_better';
  dataType: 'boolean' | 'numeric' | 'scale' | 'categorical';
  unit?: string;                        // 'percent', 'currency_per_hour', 'per_100k', 'days', 'score'
  searchQueries: string[];              // 2+ Tavily queries with {city} placeholder
  scoringCriteria: ScoringCriteria;     // Type-specific scoring rules
}
```

**Metric ID Format**: `XX_NN_name`
- `XX` = 2-char category prefix (`pf`, `hp`, `bw`, `tr`, `pl`, `sl`)
- `NN` = 2-digit number (`01`-`25`)
- `name` = snake_case descriptor

**CLUES Main Adaptation**: Our metric IDs will be `cl_NN_name` where NN auto-increments from M1-M250, and category maps to one of the 23 category modules (funnel order).

### 15.2 DATA TYPES & SCORING CRITERIA

| Type | How It Works | Example |
|------|-------------|---------|
| `boolean` | true=100, false=0 (inverted if `lower_is_better`) | `pf_14_curfew_laws` |
| `categorical` | Predefined options with assigned scores (non-uniform) | `pf_01_cannabis_legal`: fully_legal(100), medical_only(60), decriminalized(40), illegal(0) |
| `scale` | 1-5 ordinal levels: 20/40/60/80/100 | `tr_01_public_transit_quality` |
| `numeric` (range) | Linear normalization: `((value - min) / (max - min)) * 100` | `bw_03_minimum_wage`: $7-$25/hr mapped to 0-100 |

**All categorical/scale metrics get automatic fallback options:**
```typescript
{ value: 'insufficient_data', label: 'Data Not Available', score: -1 }
{ value: 'transitional', label: 'Pending Legislation/Unclear', score: -1 }
```
Score=-1 means "exclude from calculation" (not default to 50).

### 15.3 DUAL SCORING: LEGAL vs LIVED

LifeScore tracks TWO scores per metric per city:
- **Legal Score** (0-100): What the law technically says
- **Enforcement Score** (0-100): How it's actually applied in practice

Combined via configurable `LawLivedRatio` (default 50/50):
```
normalizedScore = (legalScore * lawRatio) + (livedScore * livedRatio)
```

**Conservative Mode**: Uses `MIN(legalScore, livedScore)` for pessimistic/realistic view.

**CLUES Main Adaptation**: We should adopt dual scoring for relevant metrics (e.g., "cannabis legal" = legal status vs actual enforcement). Not all metrics need it — climate data is objective.

### 15.4 SCORING ALGORITHM (The Math)

**Step 1: Raw → Normalized (0-100)**
```typescript
function normalizeScore(metric, rawValue): number {
  if (boolean) → true=100, false=0
  if (range)   → ((value - min) / (max - min)) * 100
  if (scale)   → levels.find(l.level == value).score
  if (categorical) → options.find(o.value == category).score
  if (lower_is_better) → 100 - score
  return Math.max(0, Math.min(100, score))
}
```

**Step 2: Category Score (weighted average within category)**
```typescript
function calculateCategoryScore(categoryId, metricScores) {
  // EXCLUDE missing/null metrics from calculation (don't default to 50)
  for each metric in category:
    if (!isMissing && normalizedScore !== null):
      totalWeightedScore += normalizedScore * metricWeight
      totalWeight += metricWeight

  averageScore = totalWeightedScore / totalWeight  // 0-100
  weightedScore = (averageScore * categoryWeight) / 100  // contribution to total
}
```

**Step 3: City Total Score**
```
totalScore = SUM(all category weightedScores) → 0-100
```

**Step 4: Winner Determination**
```
Tie threshold: scoreDifference < 1 point (city level)
Category tie: scoreDifference < 2 points
```

### 15.5 CONFIDENCE LEVELS (from StdDev)

Based on **standard deviation** of LLM responses:

| StdDev | Level | Meaning |
|--------|-------|---------|
| < 5 | `unanimous` | All LLMs agree perfectly |
| < 12 | `strong` | Strong agreement |
| < 20 | `moderate` | Some disagreement |
| >= 20 | `split` | Significant disagreement — flagged for Opus review |

**σ > 15 triggers Opus judge review** for that specific metric.

### 15.6 CATEGORY WEIGHTS

LifeScore's 6 categories with default weights:

| Category | Metrics | Weight |
|----------|---------|--------|
| Personal Freedom | 15 | 20% |
| Housing & Property | 20 | 20% |
| Business & Work | 25 | 20% |
| Transportation | 15 | 15% |
| Policing & Legal | 15 | 15% |
| Speech & Lifestyle | 10 | 10% |
| **Total** | **100** | **100%** |

Plus 6 persona presets that adjust weights (Balanced, Digital Nomad, Entrepreneur, Family, Libertarian, Investor).

**CLUES Main Adaptation**: 23 categories in Funnel Flow order. Weights derived from user's paragraph emphasis + persona presets.

### 15.7 FIVE-LLM PARALLEL EVALUATION

**LLM Roster**:
| LLM | Web Search Method | Tavily Use |
|-----|------------------|------------|
| Claude Sonnet 4.6 | Native (Anthropic API tool) | Supplemental |
| GPT-5.4 | Tavily injected into prompt context | Primary |
| Gemini | Google Search grounding (native) | Supplemental |
| Grok 4.1 Fast Reasoning | Tavily injected into prompt context | Primary |
| Sonar Reasoning Pro High | Native (built-in search) | Supplemental |

**Batch Firing Pattern**:
```
100 metrics split into 6 category batches
Fired in 3 WAVES of 2 concurrent categories:

Wave 1 (parallel): Category[0] + Category[1]
  wait 1s
Wave 2 (parallel): Category[2] + Category[3]
  wait 1s
Wave 3 (parallel): Category[4] + Category[5]

Each wave: POST /api/evaluate per batch
Dynamic timeout: 120s + 5s per metric (max 300s Vercel limit)
```

**Retry**: 2 retries, 3s delay, network errors only.
**Partial Success**: 3/6 categories OR 30+ metric scores = usable result.

### 15.8 OPUS JUDGE IMPLEMENTATION

**Input**: All 5 LLM results aggregated into MetricConsensus objects
**Focus**: High-disagreement metrics (σ > 15) — max 30 metrics in prompt to fit token budget

**What Opus CAN do**:
- Upscore/downscore any metric's consensusScore
- Update legalScore and enforcementScore
- Provide judgeExplanation per metric
- Weigh which LLM to trust more for specific metrics

**What Opus CANNOT do**:
- Override confidence level (must match actual StdDev)
- Override the computed winner (safeguard force-corrects if Opus hallucinates)

**Anti-Hallucination Safeguards**:
```typescript
// SAFEGUARD: Force-correct recommendation to match computed scores
if (city1Score > city2Score && recommendation !== 'city1') {
  recommendation = 'city1';  // Opus can't override math
}
```

### 15.9 TAVILY RESEARCH STRATEGY

**Two APIs**:
1. **Research API** (`/research`): Baseline comparison report (~30 credits per call)
2. **Search API** (`/search`): Category-specific queries (2 cities x 6 categories = 12 calls)

**Query Pattern** (with `{city}` placeholder):
```
"${city} personal freedom drugs alcohol cannabis gambling abortion LGBTQ laws 2025"
"${city} property rights zoning HOA land use housing regulations 2025"
"${city} business regulations taxes licensing employment labor laws 2025"
"${city} transportation vehicle regulations transit parking driving laws 2025"
"${city} criminal justice police enforcement legal rights civil liberties 2025"
"${city} freedom speech expression privacy lifestyle regulations 2025"
```

**Caching**: 30-min TTL, max 50 entries, prevents duplicate calls across LLMs.

**CLUES Main Adaptation**: Our queries are paragraph-derived, not pre-defined. Each metric generates its own `research_query` field which becomes the Tavily search.

### 15.10 FIELD KNOWLEDGE SYSTEM (Per-Metric Sources)

LifeScore maintains a `FieldKnowledge` object per metric:
```typescript
interface FieldKnowledge {
  talkingPoints: string[];      // Key conversation points
  keySourceTypes: string[];     // "government documents", "news", etc.
  commonQuestions: string[];    // FAQ about this metric
  dailyLifeImpact?: string;    // Real-world meaning
}
```

Split into 6 files by category (`fieldKnowledge-personal-freedom.ts`, etc.)
Used by: Olivia (chat answers), Court Order (real-world examples), Judge Report (context).

**CLUES Main Adaptation**: Since our metrics are paragraph-derived, field knowledge is generated dynamically by Gemini/Tavily rather than pre-defined. But the pattern (per-metric talking points + source types + daily impact) is the same.

### 15.11 JUDGE REPORT FORMAT

```typescript
interface JudgeReport {
  reportId: string;                // "LIFE-JDG-{date}-{userId}-{timestamp}"
  summaryOfFindings: {
    city1Score: number;
    city1Trend: 'improving' | 'stable' | 'declining';
    city2Score: number;
    city2Trend: 'improving' | 'stable' | 'declining';
    overallConfidence: 'high' | 'medium' | 'low';
  };
  categoryAnalysis: [{             // ALL 6 categories, always
    categoryId: string;
    categoryName: string;
    city1Analysis: string;         // 2-3 sentences
    city2Analysis: string;         // 2-3 sentences
    trendNotes: string;
  }];
  executiveSummary: {
    recommendation: 'city1' | 'city2' | 'tie';
    rationale: string;             // 2-3 paragraphs
    keyFactors: string[];          // Top 5 considerations
    futureOutlook: string;         // 1-2 paragraph forecast
  };
  freedomEducation: {              // "Court Order" content
    categories: [{
      categoryId: string;
      winningMetrics: [{           // Only if winner beats loser by 10+ points
        metricName: string;
        winnerScore: number;
        loserScore: number;
        realWorldExample: string;  // Vivid 1-2 sentence scene using "you"
      }];
      heroStatement: string;       // Bold, inspirational vision
    }];
  };
}
```

### 15.12 GAMMA REPORT STRUCTURE (82 Pages)

LifeScore's Gamma report template:

| Pages | Content |
|-------|---------|
| 1-4 | Executive Summary: cover, winner verdict radial gauge, category showdown, TOC |
| 5-14 | Law vs Reality: legal vs enforcement scores, myth vs reality |
| 15-42 | Category Deep Dives: all 100 metrics with scores, bar charts, confidence |
| 43-46 | Your Life in Each City: day-in-the-life narratives |
| 47-49 | Persona Recommendations: nomad, entrepreneur, family, retiree, libertarian, investor |
| 50-52 | Surprising Findings: counterintuitive differences |
| 53-55 | Hidden Costs: financial trade-offs, tax implications |
| 56-59 | Future Outlook: 5-year trajectory, scenario planning |
| 60-62 | Next Steps: actionable checklists, key contacts |
| 63-67 | LLM Consensus: models used, agreement levels, technical explanation |
| 68-71 | Special Topics (LifeScore: Gun Rights — unscored, facts only) |
| 72-75 | Methodology: what is LIFE SCORE, categories, personalization |
| 76-82 | Evidence & Citations: key citations per city, data quality, legal notices |

**Visual elements**: Radial gauges, horizontal bar stats, process steps, comparison tables, city imagery overlays.

**CLUES Main Adaptation**: Same template structure but expanded for 23 categories and 100-250 metrics. Country section added before city comparisons. Town/neighborhood sections after city winner.

### 15.13 CRISTIANO VIDEO PIPELINE (2-Stage)

**Stage 1: Storyboard** (Claude Sonnet 4.6 generates)
- 7 scenes, 105-120s total, 200-250 words
- Scene 1 & 7: A-ROLL (avatar talking)
- Scenes 2-6: B-ROLL (city footage)
- QA validation: scene count, duration, word count, category coverage
- Retries up to 2x if validation fails

**Stage 2: HeyGen Render**
- Video Agent V2 API
- B-roll stock footage per scene keywords
- Cristiano avatar narration (ElevenLabs voice → OpenAI `onyx` fallback)
- Overlays: Freedom Score badge, category scores, CLUES logo
- Poll for completion (5s intervals, max 5 min)
- Save to Supabase Storage

### 15.14 UI/UX PATTERNS FOR RESULTS DISPLAY

**Score Bars**:
- 12px horizontal bars, rounded endpoints
- City1 = Sapphire (`#2563eb`), City2 = Orange (`#f97316`)
- Winner = Green (`#22c55e`)
- Percentage shown above each bar

**Confidence Dots** (8px circles):
- High = Green (`#22c55e`)
- Medium = Gold (`#eab308`)
- Low = Red (`#ef4444`)

**Winner Hero**:
- Full-width gradient background
- Large trophy emoji (4rem)
- Winner score in gold (5rem, `#d4af37`)
- Score difference narrative
- Top 3 advantage categories

**Category Breakdown**:
- Collapsible sections (one per category)
- Category icon + name + weight badge
- Two horizontal comparison bars
- Expandable metric detail table with confidence legend

**Evidence Panel**:
- Collapsible card with filter buttons (All, City1, City2)
- Each evidence item: metric name + city badge + URL domain + snippet
- Links in sapphire blue, underline on hover

**Two-Row Header**:
- Row 1: Theme toggle + company name (centered) + user account
- Row 2: Logo/branding + comparison title

**Judge Verdict ("MI6 Briefing Room")**:
- Midnight navy background (`#0a1628`) with gold accents
- Glassmorphic cards throughout
- Color scheme: Midnight → Cockpit Blue → Brushed Gold → Judge Gold
- Typography: Clean, purposeful

### 15.15 COST PER COMPARISON (LifeScore Actual)

| Component | Cost |
|-----------|------|
| Claude Sonnet 4.6 (90 metrics) | ~$0.90 |
| GPT-5.4 (90 metrics + Tavily) | ~$5.00 |
| Gemini (90 metrics) | ~$0.45 |
| Grok 4.1 Fast Reasoning (90 metrics + Tavily) | ~$0.06 |
| Sonar Reasoning Pro High (90 metrics) | ~$0.90 |
| Tavily searches (540 calls) | ~$2.70 |
| Opus Judge | ~$13.50 |
| **Total per comparison** | **~$22** |

**CLUES Main will be higher** due to 100-250 metrics across 23 categories + country/town/neighborhood layers.

---

## 16. WHAT THE OLD PROMPT GOT WRONG (FIXED 2026-03-06)

> **ALL ISSUES BELOW HAVE BEEN FIXED.** The old `api/paragraphical.ts` has been completely
> rewritten to use Gemini 3.1 Pro Preview with thinking_level: high, Google Search grounding,
> and the full metric extraction + recommendation + scoring pipeline.

~~The old prompt said "You do NOT score cities" — WRONG.~~ **FIXED**: Gemini now extracts, recommends, AND scores.
~~`module_relevance` scoring 23 modules 0-1~~ **FIXED**: Replaced with 100-250 numbered metrics.
~~Budget in USD only~~ **FIXED**: Currency detected from context, multi-currency support.
~~No metric extraction~~ **FIXED**: 100-250 metrics extracted with fieldId, score, justifications, sources.
~~No location output~~ **FIXED**: Country → City → Town → Neighborhood recommendations with per-location scoring.
~~No data source strategy~~ **FIXED**: Every metric has user_justification + data_justification + source.
~~"Gemini is an EXTRACTOR, not an evaluator"~~ **FIXED**: Gemini 3.1 Pro Preview is the reasoning engine. Opus judges afterward.

### Gemini 3.1 Pro Preview Configuration (Implemented)
```typescript
generationConfig: {
  thinking_level: 'high',             // Deep multi-step reasoning
  include_thinking_details: true,     // Returns reasoning chain for transparency UI
},
tools: [{
  google_search: {},                  // Native 2026 search grounding
}],
```

### Frontend Components (Implemented)
- `ReasoningTrace` — Displays thinking_details array from Gemini
- `SideBySideMetricView` — Compares City vs Town vs Neighborhood metrics
- `ReactiveJustification` — Click justification to highlight source Paragraph (P1-P30)
- `ThinkingDetailsPanel` — Full transparency UI with model info, token stats, timeline
- `FileUpload` — 100MB upload for medical records (P8), financial spreadsheets (P11)

---

## 17. IMPLEMENTATION STATUS (Updated 2026-03-06)

### COMPLETED
1. ✅ Gemini 3.1 Pro Preview reasoning engine (`api/paragraphical.ts`)
2. ✅ GeminiExtraction V2 types with metrics array and justifications
3. ✅ File upload endpoint (`api/upload.ts`) for 100MB Gemini ingestion
4. ✅ ReasoningTrace, SideBySideMetricView, ReactiveJustification components
5. ✅ ThinkingDetailsPanel transparency UI
6. ✅ FileUpload component
7. ✅ Tier engine updated with `gemini-3.1-pro-preview` model references
8. ✅ Cost tracking updated for new provider

### REMAINING
9. Build Tavily research pipeline for metric data
10. Build Opus/Cristiano judge call for Paragraphical tier
11. Build Smart Score engine
12. Build report data structure
13. Build parallel batch firing for large metric sets
14. Wire Results components into /results route

---

## 18. NON-NEGOTIABLE RULES

1. **100 metrics minimum** from any Paragraphical, even sparse ones
2. **Every data point has multiple sources with direct links**
3. **Opus/Cristiano judges every stage** including Paragraphical-only
4. **All LLMs use web search except Opus** (he's the judge, not investigator)
5. **Currency detected from context**, dual display (local + user's home)
6. **Country first**, then cities within country, then towns, then neighborhoods
7. **Cities scored relative to each other**, not in isolation
8. **Parallel batch firing** for metric evaluation (avoid timeouts)
9. **The Paragraphical alone produces a complete report** — modules enhance, not enable
10. **Follow LifeScore patterns** for metric display, sources, Smart Scores, and UI

---

*This file must be read by any AI assistant before working on Paragraphical, Gemini, evaluation, or report code. It supersedes any conflicting information in CLUES_MAIN_BUILD_REFERENCE.md regarding the Paragraphical's scope and Gemini's role.*
