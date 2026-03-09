# CLUES Intelligence — LLM Provider Architecture & Adaptive Question Engine

> **PURPOSE**: This document defines which LLM handles which task in the CLUES Intelligence platform,
> and how the Adaptive Question Engine selects modules and questions to minimize user effort while
> achieving the 2% MOE target.
>
> **Author**: John Desautels, Founder + Claude Opus 4.6 Architecture
> **Created**: 2026-03-08
> **Status**: ARCHITECTURAL BLUEPRINT — Pre-implementation

---

## 1. WHAT CLUES PREDICTS

CLUES Intelligence predicts the **best place in the world** for a specific human being. The output is:

1. **The best country** (1 primary, up to 3 alternatives)
2. **The top 3 cities** within that country
3. **The top 3 towns** within the winning city
4. **The top 3 neighborhoods** within the winning town

Every recommendation is backed by SMART Scores (0-100, relative, sourced) across up to 250 personalized metrics spanning 23 life dimensions. Every data point has multiple sources with direct, clickable URLs. The final deliverable is a 100+ page GAMMA Report.

---

## 2. LLM PROVIDER MAP — WHO DOES WHAT

### 2.1 The Seven Models

| Model | Role | Web Search | When Used |
|-------|------|------------|-----------|
| **Gemini 3.1 Pro Preview** | Reasoning Engine — Paragraphical extraction, metric generation, initial country/city/town/neighborhood recommendations | Google Search grounding (native) + Tavily | Paragraphical processing, module deep-dive text analysis |
| **GPT-5.4** | Structured Evaluator + Bayesian Refinement Pass — Facts, figures, advanced reasoning on structured questionnaire data | Bing integration + Tavily | Main Module & Mini Module evaluation, adaptive engine refinement |
| **Grok 4.1 Fast Reasoning** | Mathematical Evaluator — Quantitative analysis, fast scoring, 2M context window | X/Twitter real-time + Tavily | Metric scoring, numerical analysis, cost-of-living calculations |
| **Perplexity Sonar Reasoning Pro High** | Current Data Specialist — Real-time web research with deep reasoning | Native (built-in) + Tavily | Sourcing current data, trend analysis, verifying recency |
| **Claude Sonnet 4.6** | Structured Evaluator — Reliable, efficient scoring across categories | Native web search tool + Tavily | Category-by-category metric evaluation |
| **Claude Opus 4.6** | The Judge (Cristiano) — Reviews all evidence, resolves disagreements, renders verdicts | None (by design) | Judges every evaluation stage, final verdict |
| **GPT Realtime 1.5** | Olivia's Voice — Live voice/video interaction | None | Real-time user conversation via WebSocket |

### 2.2 The Division of Labor

```
USER DATA FLOWS IN
        |
        v
┌─────────────────────────────────────────────────┐
│  STAGE 1: DATA COLLECTION                       │
│                                                  │
│  Paragraphical (30 free-form paragraphs)         │
│       → Gemini 3.1 Pro Preview processes         │
│       → 100-250 numbered metrics extracted        │
│       → Initial country/city/town/neighborhood   │
│                                                  │
│  Main Module (5 sections: Demo, DNW, MH,         │
│              Trade-offs, General)                 │
│       → Deterministic math engine processes       │
│       → Module relevance scores calculated        │
│       → Coverage gaps identified                  │
│                                                  │
│  Mini Modules (23 × 100 questions each)          │
│       → Adaptive Engine selects which modules     │
│       → Adaptive Engine selects which questions   │
│       → Answers feed back into relevance scores   │
└─────────────────────────────────────────────────┘
        |
        v
┌─────────────────────────────────────────────────┐
│  STAGE 2: ADAPTIVE QUESTION ENGINE               │
│  (Pure math — NO LLM needed for selection)       │
│                                                  │
│  1. Calculate per-module MOE contribution         │
│  2. Rank modules by: weight × uncertainty         │
│  3. For each selected module, calculate           │
│     Expected Information Gain (EIG) per question │
│  4. Present highest-EIG questions first           │
│  5. After each answer: recalculate MOE            │
│  6. Stop module when module MOE ≤ 2%              │
│                                                  │
│  GPT-5.4 Refinement Pass (once per section):     │
│  After user completes a module section, one       │
│  GPT-5.4 call detects emergent patterns,          │
│  tensions, and cross-module implications          │
│  that pure math cannot catch.                    │
└─────────────────────────────────────────────────┘
        |
        v
┌─────────────────────────────────────────────────┐
│  STAGE 3: FIVE-LLM PARALLEL EVALUATION           │
│                                                  │
│  All 5 evaluating LLMs independently score       │
│  every metric against candidate locations:       │
│                                                  │
│  Gemini    ──┐                                   │
│  GPT-5.4  ──┤                                    │
│  Grok 4.1 ──┼──→ Per-metric scores + sources     │
│  Sonar    ──┤                                    │
│  Sonnet   ──┘                                   │
│                                                  │
│  Parallel batch firing in waves of 2 categories  │
│  Each LLM uses web search + Tavily               │
│  Dynamic timeout: 120s + 5s per metric (max 300s)│
└─────────────────────────────────────────────────┘
        |
        v
┌─────────────────────────────────────────────────┐
│  STAGE 4: OPUS JUDGE (Cristiano)                 │
│                                                  │
│  Opus reviews all 5 LLM outputs:                 │
│  - Examines source recency and reliability       │
│  - Identifies outliers (maybe right, maybe wrong)│
│  - Applies statistical weights (mean/median/mode)│
│  - Can upscore/downscore any metric              │
│  - Cannot override the computed math winner      │
│  - Renders final verdict with full reasoning     │
│                                                  │
│  Opus judges EVERY stage including Paragraphical-│
│  only Discovery tier. Not reserved for premium.  │
└─────────────────────────────────────────────────┘
        |
        v
┌─────────────────────────────────────────────────┐
│  STAGE 5: SMART SCORE ENGINE + GAMMA REPORT      │
│                                                  │
│  - Normalize all scores to 0-100 SMART Scores    │
│  - Cities scored RELATIVE to each other           │
│  - Category rollup → Overall city scores          │
│  - Weight derivation from user persona            │
│  - 100+ page GAMMA Report generated              │
│  - Cristiano HeyGen cinematic video               │
│  - All sources with direct clickable URLs         │
└─────────────────────────────────────────────────┘
```

---

## 3. THE MODULE SELECTION PROBLEM (Solved)

### 3.1 The Scenario

A user has completed:
- The Paragraphical (30 paragraphs → Gemini extracted 180 metrics)
- The Main Module (5 sections: Demographics, DNW, MH, Trade-offs, General)

The system calculates an aggregate MOE of 10%. Target is ≤ 2%.

**Question**: Which of the 23 modules should the user complete, and within those modules, which of the ~100 questions per module actually matter?

### 3.2 Why This Is NOT an LLM Problem

The module/question selection task is **mathematical optimization**, not language understanding:

- The upstream data (Paragraphical metrics + Main Module answers) is already structured
- Each question has a known relationship to specific metrics and categories
- The MOE is decomposable per-module — you can calculate which modules contribute most to uncertainty
- Expected Information Gain per question is computable from prediction confidence

Using an LLM to pick questions is like using ChatGPT to multiply numbers — it can do it, but a calculator is faster, cheaper, and correct every time.

### 3.3 The Deterministic Module Selection Engine

**Layer 1: Module MOE Decomposition (pure TypeScript)**

```
Overall MOE = 10%

Per-module MOE contribution (calculated from data gaps + signal conflicts):
  safety_security:              0.4%  ← confident (DNW severity 5, Paragraphical confirmed)
  family_children:              0.3%  ← confident (demographics: 3 kids, consistent signals)
  health_wellness:              2.8%  ← HIGH UNCERTAINTY (conflicting signals)
  arts_culture:                 1.9%  ← MODERATE (some signal but thin)
  financial_banking:            2.1%  ← HIGH UNCERTAINTY (no clear data)
  climate_weather:              0.5%  ← confident (detailed in Paragraphical P6)
  outdoor_recreation:           0.7%  ← okay
  ...remaining 16 modules:     1.3%  ← distributed small contributions
```

**Module selection rule**: Select modules where `moduleWeight × moduleMOE > threshold`.

Result: User needs **3-5 modules**, not 23.

### 3.4 Within-Module Adaptive Question Selection (CAT Engine)

This is **Computerized Adaptive Testing** — the same math used by the GRE, GMAT, and medical licensing exams. They don't ask 500 questions. They pick the **next most informative question** based on everything already answered, and **stop** when confidence hits the target.

**For each unanswered question Q in selected module M:**

```
Expected Information Gain (EIG) =
    prediction_uncertainty(Q)     ← How unsure is the system about what the user will answer?
  × smart_score_impact(Q)        ← How much would the answer change the SMART Scores?
  × module_weight(M)             ← How important is this module to the overall recommendation?
```

**Questions with HIGH EIG (ask these first):**
- System is uncertain what the user will say (50/50 prediction)
- AND the answer materially changes the country/city/town/neighborhood SMART Scores
- AND the module carries significant weight for this user's profile

**Questions with LOW EIG (skip these):**
- System already knows the answer from upstream data (95% confident from Paragraphical or Main Module)
- OR the answer barely moves the SMART Scores regardless
- OR the module has low weight for this user (e.g., Education module for a childless retiree)

**The adaptive loop:**

```
1. Math engine selects highest-EIG question from priority module
2. Olivia delivers it conversationally (GPT Realtime 1.5 for voice, GPT-5.4 for text)
3. User answers
4. System updates beliefs (Bayesian update)
5. Recalculate module MOE
6. If module MOE ≤ 2% → move to next module (or stop entirely)
7. If module MOE > 2% → recalculate EIG for remaining questions
8. Pick next highest-EIG question
9. Repeat
```

**Typical result**: 8-15 questions per module instead of 100. Across 3-5 selected modules, the user answers **40-60 total adaptive questions** out of the 2,300 mini module questions (23 modules × 100).

### 3.5 Where LLMs DO Fit in the Adaptive Process

| Task | Who Handles It | Why |
|------|---------------|-----|
| **Selecting which modules to recommend** | Deterministic math engine | Computable from data gaps — no interpretation needed |
| **Selecting which questions to ask within a module** | CAT engine (pure math) | Information gain is calculable, not a judgment call |
| **Detecting emergent patterns across structured answers** | GPT-5.4 (1 call per completed section) | Example: User rates crime severity 5 AND nightlife importance 5 — tension that pure math misses. GPT-5.4 recognizes this and recommends `neighborhood_urban_design` as the bridge module |
| **Interpreting free-text answers within modules** | Gemini 3.1 Pro Preview | Some module questions allow paragraph-style responses. Gemini reads prose and extracts structured signals, same as the Paragraphical |
| **Conversational delivery of adaptive questions** | GPT-5.4 (text Olivia) / GPT Realtime 1.5 (voice Olivia) | Olivia explains WHY these specific questions matter and adapts her tone |
| **Judging whether conflicting signals are genuine tensions vs data errors** | Opus 4.6 (Cristiano) | When two modules show contradictory recommendations, the judge resolves it |

### 3.6 What Happens When a User Skips the Paragraphical

If the user goes straight to the Main Module (no paragraphs at all):

1. **Demographics section** → Deterministic engine builds initial persona (age, household, employment, budget)
2. **DNW section** → Each dealbreaker with severity score directly maps to module relevance weights
3. **MH section** → Each must-have with importance score adds module relevance signals
4. **Trade-offs section** → Slider positions directly weight categories against each other
5. **General section** → Lifestyle signals fill remaining gaps

The module relevance engine does NOT need Gemini here. The Main Module is structured data — every answer maps deterministically to module weights:

```typescript
// Examples of deterministic mappings (no LLM needed):
if (demographics.has_children)          → family_children.relevance += 0.4
if (dnw.crime_severity >= 4)            → safety_security.relevance += 0.3
if (mh.healthcare_importance >= 4)      → health_wellness.relevance += 0.3
if (tradeoff.culture_vs_cost > 70)      → arts_culture.relevance += 0.2
if (demographics.has_pets)              → pets_animals.relevance += 0.4
if (demographics.employment === 'remote') → technology_connectivity.relevance += 0.3
if (dnw.climate_extreme_severity >= 3)  → climate_weather.relevance += 0.2
```

**GPT-5.4 refinement pass** fires ONCE after all 5 Main Module sections are complete. It takes the full structured answer set + deterministic module relevance scores and looks for:
- Emergent cross-section patterns the math missed
- Contradictions that suggest the user needs clarification
- Implicit priorities the explicit ratings didn't capture

This is 1 API call, not 200. Cost: ~$0.50.

---

## 4. THE OLIVIA + BAYESIAN ARCHITECTURE

### 4.1 Olivia's Role in the Funnel

Olivia is NOT making module decisions. Olivia is the **delivery layer**:

```
Math Engine decides: "Ask question 47 from health_wellness module next"
     |
     v
Olivia delivers: "Based on everything you've shared, I have really strong
clarity on your safety needs and family priorities. But I'm noticing some
interesting tension in your health signals — you mentioned valuing outdoor
access, but your trade-offs suggest you'd sacrifice green space for urban
amenities. I have about 12 targeted questions that would help me really
nail this down. Ready?"
```

Olivia's brain for text chat is **GPT-5.4**. For voice/video, **GPT Realtime 1.5**. Neither picks the questions — the math engine does. They make the experience feel human.

### 4.2 The Bayesian-Like Update Cycle

After every answer:

```
1. user_answers += new_answer
2. belief_state = bayesianUpdate(belief_state, new_answer)
3. per_module_MOE = recalculateMOE(belief_state)
4. overall_MOE = sum(per_module_MOE)
5. if (overall_MOE <= 0.02) → GREEN LIGHT: report-ready
6. else → next_question = selectHighestEIG(remaining_questions, belief_state)
7. Olivia delivers next_question (or congratulates user if green)
```

The **real-time status indicator** shows two things:
- **Questions completed** (simple counter — "47 of ~60 estimated")
- **Confidence meter** (the critical one — shows MOE trending toward 2% target)

When the confidence meter hits green, Olivia congratulates the user. Their CLUES questionnaire is complete. The system can now generate a full, accurate GAMMA Report with sourced SMART Scores for the best country → top 3 cities → top 3 towns → top 3 neighborhoods.

---

## 5. IMPLEMENTATION FILES

### 5.1 Adaptive Engine (Pure Math — No LLM)

```
src/lib/adaptiveEngine.ts           ← The CAT engine (~300-400 lines)
  - calculateModuleMOE()             ← Per-module uncertainty decomposition
  - calculateQuestionEIG()           ← Expected Information Gain per question
  - selectNextQuestion()             ← Greedy selection of highest-EIG question
  - updateBeliefs()                  ← Bayesian update after each answer
  - checkStoppingCriterion()         ← MOE ≤ 2%? Stop.

src/lib/moduleRelevanceEngine.ts    ← Feeds the adaptive engine (~200 lines)
  - calculateFromDemographics()      ← Demographics → module weights
  - calculateFromDNW()               ← DNW severity → module weights
  - calculateFromMH()                ← MH importance → module weights
  - calculateFromTradeoffs()         ← Slider positions → category weights
  - calculateFromGeneral()           ← General lifestyle → module weights
  - mergeWithParagraphical()         ← Merge Gemini signals when available

src/lib/coverageTracker.ts          ← 23-dimension coverage state (~150 lines)
  - dimensionCoverage[]              ← Per-module: data points, signal strength, consistency
  - overallCoverage                  ← Aggregate across all 23 dimensions
  - gapAnalysis()                    ← Which dimensions have the weakest signal?
```

### 5.2 GPT-5.4 Refinement (1 call per completed section)

```
api/refinement-gpt.ts              ← GPT-5.4 refinement endpoint
  - Input: Full answer set + deterministic module relevance scores
  - Output: Adjusted scores, detected tensions, recommended bridge modules
  - Fires: Once per completed Main Module section (max 5 calls)
  - Cost: ~$0.50 total across all 5 sections
```

### 5.3 Olivia Delivery Layer

```
src/lib/oliviaTutor.ts             ← Already built (313 lines)
  - Adapts messaging based on adaptive engine output
  - Explains WHY each question matters
  - Congratulates when MOE target reached

api/olivia-chat.ts                 ← Already built (159 lines)
  - GPT-5.4 powered text chat
  - Receives next-question recommendation from adaptive engine
  - Wraps it in conversational delivery
```

---

## 6. COST PER USER (Estimated)

| Component | Cost | When |
|-----------|------|------|
| Gemini Paragraphical extraction | ~$0.45 | If user completes Paragraphical |
| Deterministic module/question selection | $0.00 | Always (pure math) |
| GPT-5.4 refinement passes (5 max) | ~$0.50 | After each Main Module section |
| 5-LLM parallel evaluation (100-250 metrics) | ~$22-35 | Report generation |
| Opus Judge verdict | ~$13.50 | Report generation |
| Tavily research + search | ~$2.70 | Report generation |
| HeyGen Cristiano video | ~$5.00 | Report generation |
| GPT Realtime 1.5 (Olivia voice) | Variable | During live sessions |
| **Total per full evaluation** | **~$45-60** | Stripe tiers absorb this |

---

## 7. KEY ARCHITECTURAL DECISIONS

### 7.1 Why Gemini for Paragraphical, Not for Module Selection

**Gemini's superpower**: Reading free-form prose and inferring structured signals. When a user writes "I hate humidity and want warm winters around 20-25C," Gemini understands this is about climate preferences and generates numbered metrics.

**Module selection from structured questionnaire data is NOT prose interpretation.** When a user selects severity 5 on "I can't live somewhere with high crime," the meaning is already quantified. No language model is needed to understand it. A lookup table maps it directly to `safety_security.relevance += 0.3`.

### 7.2 Why GPT-5.4 for Refinement, Not Opus

**Opus is the judge.** His role is reviewing evidence after all LLMs have evaluated, detecting disagreements, and rendering verdicts. Using Opus for real-time module selection would:
- Cost 10-20x more than GPT-5.4
- Be architecturally wrong (judges don't investigate)
- Add unnecessary latency to the questionnaire flow

GPT-5.4's strength is **advanced reasoning on structured data with a massive factual knowledge base.** Perfect for detecting emergent patterns across the 200 structured Main Module flow answers (100 Main Module + 50 Tradeoff + 50 General).

### 7.3 Why Pure Math for Question Selection, Not Any LLM

The question "which question reduces MOE the most?" has a **calculable answer**. Expected Information Gain is a mathematical quantity derived from:
- Current prediction uncertainty for each question
- Each question's impact on SMART Score calculations
- The module's weight in the overall recommendation

This is entropy math. It runs in milliseconds, costs nothing, and is provably optimal. An LLM would be slower, more expensive, and less accurate for this specific task.

### 7.4 Why 40-60 Questions Instead of 2,300

The 2,500-question library exists so the system has **coverage** across every possible human scenario. But any individual user only needs the questions where:
1. Upstream data left uncertainty (the system doesn't already know the answer)
2. The answer would actually change the recommendation (high SMART Score impact)
3. The relevant module carries significant weight for this user's profile

For most users, ~250 total answers (Paragraphical paragraphs + Main Module questions + adaptive mini-module questions) achieves the 2% MOE target. The adaptive engine ensures those 250 are the RIGHT 250.

---

## 8. WHAT EACH STAGE PRODUCES

| Stage | Input | Output | LLM(s) Used |
|-------|-------|--------|-------------|
| **Paragraphical** | 30 free-form paragraphs | 100-250 metrics, initial country/city/town/neighborhood, personality profile, module_relevance | Gemini 3.1 Pro Preview |
| **Main Module Flow** | 200 structured answers (100 Main Module: 34 Demo + 33 DNW + 33 MH, plus 50 Tradeoffs + 50 General) | Module weights, coverage map, pre-filled signals for mini modules | Deterministic engine + 1 GPT-5.4 refinement call |
| **Adaptive Module Selection** | All upstream data | Ranked list of 3-5 modules to complete, with estimated questions per module | Deterministic engine (pure math) |
| **Adaptive Question Selection** | Selected module + all prior answers | Next highest-EIG question within current module | CAT engine (pure math) |
| **5-LLM Evaluation** | All metrics + candidate locations | Per-metric SMART Scores with sources from 5 independent LLMs | Gemini + GPT-5.4 + Grok 4.1 + Sonar + Sonnet 4.6 |
| **Opus Judge** | All 5 LLM evaluations | Final verdicts, upscores/downscores, judicial reasoning | Opus 4.6 (Cristiano) |
| **SMART Score Engine** | Judge verdicts + all metric data | Normalized 0-100 scores, category rollups, city comparisons, winner | Deterministic engine |
| **GAMMA Report** | All SMART Scores + sources + judge report | 100+ page polished report | Gamma API |
| **Cristiano Video** | Judge report + winning city data | 7-scene cinematic HeyGen video | Sonnet 4.6 (storyboard) + HeyGen (render) |

---

*This document defines the LLM provider architecture for CLUES Intelligence. It must be read alongside CLUES_MISSION.md, BUILD_SCHEDULE.md, and PARAGRAPHICAL_ARCHITECTURE.md. Any conflicts between this document and those should be resolved in favor of this document for LLM assignment questions.*
