# PARAGRAPHICAL ARCHITECTURE — Master Reference

> **PURPOSE**: This document captures the complete architectural vision for the CLUES Paragraphical system.
> Every AI assistant and every new conversation MUST read this file FIRST before working on any Paragraphical,
> Gemini extraction, evaluation pipeline, or report-related code.
>
> **Last Updated**: 2026-03-05
> **Status**: ARCHITECTURAL DESIGN — Implementation pending

---

## 1. WHAT IS THE PARAGRAPHICAL?

The Paragraphical is the **primary entry point** into the CLUES Intelligence platform. It consists of 24 free-form paragraphs where users describe their life, preferences, needs, and dreams in narrative form. These 24 paragraphs follow the **Human Existence Flow** (Survival to Soul).

The Paragraphical is NOT a lightweight signal extractor. It is designed to produce a **standalone 100+ page report** even if the user never touches the Main Module or the 20 Mini Modules. The Paragraphical alone must be powerful enough to:

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
24 paragraphs covering their entire life context (see paragraph definitions in `src/data/paragraphs.ts`).

### Step 2: Gemini Converts Paragraphs to Numbered Metrics
Every measurable, researchable preference becomes a discrete metric:

```
From P3 ("Your Ideal Climate"):
  "I hate humidity and want warm winters around 20-25C"
  -->
  M1: Average annual humidity below 60% [Category: Climate] [Source: P3]
  M2: Average winter temperature 20-25C [Category: Climate] [Source: P3]
  M3: Absence of extreme weather events [Category: Climate] [Source: P3]

From P8 ("Your Financial Picture"):
  "I make about 8000 euros a month and want to live comfortably"
  -->
  M15: Monthly cost of living below EUR 4,000 for comfortable lifestyle [Category: Financial] [Source: P8]
  M16: Favorable tax treatment for foreign income [Category: Financial] [Source: P8]

From P11 ("Staying Connected"):
  "I need at least 100mbps for my remote work"
  -->
  M28: Average broadband speed above 100 Mbps [Category: Technology] [Source: P11]
  M29: Reliable coworking space availability [Category: Technology] [Source: P11]
```

### Target: 100-250 Metrics
- **Minimum**: 100 metrics (even from sparse paragraphs, Gemini should extrapolate reasonable metrics)
- **Maximum**: ~250 metrics (from very detailed paragraphs)
- Each metric is:
  - **Numbered** (M1, M2, M3...)
  - **Categorized** (maps to one of 20 Human Existence Flow categories)
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
**Input**: 24 paragraphs + globe region
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
    Gemini (web search) + Sonnet + GPT-4o + Grok + Perplexity
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
- **Claude Sonnet**: Web search tool + Tavily
- **GPT-4o**: Bing search integration + Tavily
- **Grok**: X/Twitter real-time data + Tavily
- **Perplexity Sonar**: Native web search (built-in) + Tavily

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
- ...for all 20 categories

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
  - Organized by Human Existence Flow categories
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

The 20 Mini Modules and Main Module questionnaire are DOWNSTREAM of the Paragraphical:
- They may or may not be completed by the user
- When completed, they ADD precision to the Paragraphical's metrics
- They can ADD new metrics the paragraphs didn't cover
- They can REFINE metric weights and priorities
- They trigger additional LLMs (Sonnet, GPT-4o, Grok, Perplexity)
- They do NOT replace the Paragraphical — they enhance it

The Paragraphical must stand alone as a complete evaluation. Modules make it better, not make it work.

---

## 13. GEMINI EXTRACTION OUTPUT (Revised Schema)

The old `GeminiExtraction` schema is OBSOLETE. The new schema must include:

```typescript
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

  // ─── Metrics (THE KEY OUTPUT) ───
  metrics: {
    id: string;                      // "M1", "M2", etc.
    description: string;             // "Average winter temperature 20-25C"
    category: string;                // "climate", "safety", "financial"...
    source_paragraph: number;        // Which paragraph (1-24)
    data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
    research_query: string;          // What Tavily should search
    threshold?: {
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
      value: number | [number, number];
      unit: string;                  // "celsius", "percent", "USD", "index"
    };
  }[];                               // Minimum 100, up to 250

  // ─── Location Recommendations ───
  recommended_countries: {
    name: string;
    iso_code: string;
    reasoning: string;
    local_currency: string;
  }[];                               // 1 primary, up to 3

  recommended_cities: {
    name: string;
    country: string;
    reasoning: string;
  }[];                               // Top 3 per country

  recommended_towns: {
    name: string;
    parent_city: string;
    reasoning: string;
  }[];                               // Top 3 in winning city

  recommended_neighborhoods: {
    name: string;
    parent_town: string;
    reasoning: string;
  }[];                               // Top 3 in winning town

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

## 15. LIFESCORE REFERENCE

Before implementing, STUDY the LifeScore codebase at `github.com/johndesautels1/lifescore`:
- How metrics are defined and numbered
- How Tavily research feeds into scoring
- How sources are collected and displayed with direct links
- How parallel batch firing handles timeouts
- How Smart Scores are calculated (relative scoring)
- How the UI displays metric comparisons
- How cost tracking works per call
- The two-row header pattern

LifeScore is the ONLY fully operational module. Its patterns are proven. CLUES Main follows the same patterns with paragraph-derived metrics instead of pre-defined ones.

---

## 16. WHAT THE OLD PROMPT GOT WRONG

The current `api/paragraphical.ts` prompt says:
- "You do NOT score cities or make recommendations" — **WRONG.** Gemini IS the first-pass recommender
- `module_relevance` scoring 20 modules 0-1 — **IRRELEVANT.** We need location recommendations and metrics
- Budget in USD only — **WRONG.** Global app, multi-currency
- No metric extraction — **THE MOST IMPORTANT STEP IS MISSING**
- No location output — **THE WHOLE POINT IS MISSING**
- No data source strategy — **Every metric needs sourced, provable data**
- "Gemini is an EXTRACTOR, not an evaluator" — **PARTIALLY WRONG.** Gemini extracts AND recommends AND scores at Discovery tier. The distinction is that Gemini alone is not the FINAL word — Opus/Cristiano always judges.

---

## 17. IMPLEMENTATION PRIORITY

1. Study LifeScore codebase completely
2. Rewrite `GeminiExtraction` TypeScript interfaces
3. Rewrite Gemini prompt for Call 1 (extract metrics)
4. Build Tavily research pipeline for metric data
5. Write Gemini prompt for Call 2 (recommend + score with sourced data)
6. Build Opus/Cristiano judge call for Paragraphical tier
7. Build Smart Score engine
8. Build report data structure
9. Build parallel batch firing for large metric sets
10. Update `api/paragraphical.ts` endpoint
11. Update frontend to display metric comparisons + sources

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
