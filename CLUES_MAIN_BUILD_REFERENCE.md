# CLUES Main Module - Build Reference

> **PURPOSE**: This file is the single source of truth for any AI assistant working on the CLUES Main Module.
> Read this FIRST before exploring the codebase or spec docs. Do NOT re-explore from scratch.
> **Last Updated**: 2026-03-04 | **Conversation ID**: CLUES-SYS-2026-0303-A (continued)

---

## 1. WHAT IS CLUES?

**CLUES Intelligence** is an AI-powered international relocation consulting platform that helps users find their ideal city, town, and neighborhood anywhere in the world. It uses multiple AI models, real-time data, and a progressive questionnaire system to narrow down from 1,000+ global metros to a single recommendation.

**Business Model**: Stripe-tiered subscriptions (Free, Navigator, Sovereign) with report-based deliverables.

**Deployed at**: Vercel (SPA) | **Repo**: github.com/johndesautels1/clues-main

---

## 2. TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TypeScript + Vite 7 | Dark glassmorphic UI, Montserrat font |
| Hosting | Vercel | Serverless functions for API routes |
| Database | Supabase (PostgreSQL) | User data, evaluations, cost tracking |
| LLM Evaluators | Claude Sonnet 4.5, GPT-4o, Gemini 3.1 Pro Preview, Grok 4, Perplexity Sonar | 5 parallel evaluators |
| Judge | Claude Opus 4.5 | Consensus builder, reviews stdDev > 15 disagreements |
| Reasoning Engine | Gemini 3.1 Pro Preview | Paragraphical extraction, metric scoring, location recommendations (with thinking_level: high, Google Search grounding). Opus judges afterward. |
| Research | Tavily API | Research (baseline) + Search (category-specific), cached 30 min |
| Payments | Stripe | Tiered subscriptions |
| Reports | Gamma | Polished visual reports |
| Video | HeyGen (Olivia avatar), InVideo (cinematic movie) | Cristiano Judge narration |

---

## 3. REFERENCE IMPLEMENTATION: LIFESCORE

**Repo**: github.com/johndesautels1/lifescore | **Live**: clueslifescore.com

LifeScore is the ONLY fully operational module. It compares cities across 100 freedom metrics using 5 parallel LLMs + Opus Judge. Study its patterns:

### Key Patterns to Follow
- **Parallel LLM evaluation**: 5 models score simultaneously, results merged
- **Batch splitting**: Categories with >12 metrics split into parallel batches
- **Opus Judge consensus**: Reviews disagreements (stdDev > 15), provides final verdict
- **Tavily integration**: Research (baseline context) + Search (category-specific real-time data)
- **Cost tracking**: Per-call token counting stored in Supabase
- **Error handling**: 3 retries with exponential backoff, partial success accepted
- **Two-row header**: Logo/nav row + city comparison row (CLUES Main needs this pattern)

### LifeScore API Route Pattern
```typescript
// api/evaluate.ts - Template for all evaluation endpoints
export default async function handler(req, res) {
  const { cities, category, metrics } = req.body;

  // 1. Tavily research for baseline context
  const research = await tavily.research(cities, category);

  // 2. Build system prompt with metrics + research
  const systemPrompt = buildPrompt(category, metrics, research);

  // 3. Fire 5 LLMs in parallel
  const results = await Promise.allSettled([
    evaluateWithClaude(systemPrompt, cities),
    evaluateWithGPT(systemPrompt, cities),
    evaluateWithGemini(systemPrompt, cities),
    evaluateWithGrok(systemPrompt, cities),
    evaluateWithPerplexity(systemPrompt, cities),
  ]);

  // 4. Merge results, calculate consensus
  const merged = mergeEvaluations(results);

  // 5. Track costs
  await trackCosts(results);

  return res.json(merged);
}
```

---

## 4. THE 23 CATEGORY MODULES (Funnel Flow)

Modules are ordered by evaluation funnel logic — each tier progressively narrows candidate locations:

### TIER 1: SURVIVAL (Can I survive here?)
1. **Safety & Security** — Crime rates, emergency services, political stability
2. **Health & Wellness** — Healthcare system, medical access, wellness infrastructure
3. **Climate & Weather** — Temperature, seasons, natural disasters, air quality

### TIER 2: FOUNDATION (Can I legally/financially exist here?)
4. **Legal & Immigration** — Visa pathways, residency, rule of law, property rights
5. **Financial & Banking** — Banking access, cost of living, taxes, currency stability
6. **Housing & Real Estate** — Cost, availability, types, rental/purchase options
7. **Professional & Career** — Job market, remote work infrastructure, industry presence

### TIER 3: INFRASTRUCTURE (Can I function daily here?)
8. **Technology & Connectivity** — Internet, digital infrastructure, tech ecosystem
9. **Transportation & Mobility** — Transit, walkability, cycling, driving infrastructure
10. **Education & Learning** — Schools, universities, language programs, continuing education
11. **Social Values & Governance** — Political freedom, social tolerance, civic engagement

### TIER 4: LIFESTYLE (Can I enjoy life here?)
12. **Food & Dining** — Restaurants, dietary options, food culture, grocery access
13. **Shopping & Services** — Retail, convenience, international products, delivery
14. **Outdoor & Recreation** — Parks, hiking, sports facilities, nature access
15. **Entertainment & Nightlife** — Venues, events, nightlife, cultural programming

### TIER 5: CONNECTION (Can I build a life here?)
16. **Family & Children** — Family services, child safety, schools, pediatric care
17. **Neighborhood & Urban Design** — Street-level livability, walkability, public spaces
18. **Environment & Community Appearance** — Cleanliness, green space, aesthetic quality

### TIER 6: IDENTITY (Can I be myself here?)
19. **Religion & Spirituality** — Places of worship, tolerance, spiritual communities
20. **Sexual Beliefs, Practices & Laws** — LGBTQ+ rights, personal freedom, legal protections
21. **Arts & Culture** — Museums, galleries, creative communities, intellectual life
22. **Cultural Heritage & Traditions** — Local customs, integration expectations, belonging
23. **Pets & Animals** — Pet policies, veterinary care, pet-friendly housing/spaces

Each module has **100 questions** (2,300 total across 23 modules).

---

## 5. THE 30-PARAGRAPH PARAGRAPHICAL

Free-form narrative input following the CLUES decision pipeline. Gemini 3.1 Pro Preview extracts structured data from all 30 paragraphs using deep reasoning and Google Search grounding.

### Paragraph Map (6 Phases — see `src/data/paragraphs.ts`)
```
PHASE 1: YOUR PROFILE (Demographics)
  P1:  "Who You Are"                          — Age, gender, nationality, citizenship, household, languages, employment
  P2:  "Your Life Right Now"                  — Current location, income, currency, push factors, timeline

PHASE 2: DO NOT WANTS (Dealbreakers)
  P3:  "Your Dealbreakers"                    — Hard walls that eliminate cities before scoring begins

PHASE 3: MUST HAVES (Non-Negotiables)
  P4:  "Your Non-Negotiables"                 — Requirements a city MUST meet to stay in the running

PHASE 4: TRADE-OFFS (Priority Weighting)
  P5:  "Your Trade-offs"                      — What user would sacrifice — reveals how to weight competing metrics

PHASE 5: MODULE DEEP DIVES (23 paragraphs, 1:1 with category modules in funnel order)
  TIER 1: SURVIVAL
    P6:  "Safety & Security"                  — moduleId: safety_security
    P7:  "Health & Wellness"                  — moduleId: health_wellness
    P8:  "Climate & Weather"                  — moduleId: climate_weather
  TIER 2: FOUNDATION
    P9:  "Legal & Immigration"                — moduleId: legal_immigration
    P10: "Financial & Banking"                — moduleId: financial_banking
    P11: "Housing & Real Estate"              — moduleId: housing_real_estate
    P12: "Professional & Career"              — moduleId: professional_career
  TIER 3: INFRASTRUCTURE
    P13: "Technology & Connectivity"           — moduleId: technology_connectivity
    P14: "Transportation & Mobility"           — moduleId: transportation_mobility
    P15: "Education & Learning"                — moduleId: education_learning
    P16: "Social Values & Governance"          — moduleId: social_values_governance
  TIER 4: LIFESTYLE
    P17: "Food & Dining"                       — moduleId: food_dining
    P18: "Shopping & Services"                 — moduleId: shopping_services
    P19: "Outdoor & Recreation"                — moduleId: outdoor_recreation
    P20: "Entertainment & Nightlife"           — moduleId: entertainment_nightlife
  TIER 5: CONNECTION
    P21: "Family & Children"                   — moduleId: family_children
    P22: "Neighborhood & Urban Design"         — moduleId: neighborhood_urban_design
    P23: "Environment & Community Appearance"  — moduleId: environment_community_appearance
  TIER 6: IDENTITY
    P24: "Religion & Spirituality"             — moduleId: religion_spirituality
    P25: "Sexual Beliefs, Practices & Laws"    — moduleId: sexual_beliefs_practices_laws
    P26: "Arts & Culture"                      — moduleId: arts_culture
    P27: "Cultural Heritage & Traditions"      — moduleId: cultural_heritage_traditions
    P28: "Pets & Animals"                      — moduleId: pets_animals

PHASE 6: YOUR VISION
  P29: "Your Dream Day"                       — Perfect ordinary Tuesday in your new city
  P30: "Anything Else"                        — Wildcard: missed dealbreakers, past experiences, future plans
```

### Key changes vs. the old 24-paragraph structure:
- **Added P3 (Dealbreakers)** — DNW hard walls the old structure lacked
- **Added P4 (Non-Negotiables)** — Must Haves the old structure lacked
- **Added P5 (Trade-offs)** — Priority weighting signals the old structure lacked
- **Module-mapped paragraphs** — Each P6-P28 has a `moduleId` property linking it to the exact category module it mirrors
- **Enriched prompts** — Every prompt asks for specific, scorable data (numbers, thresholds, concrete preferences)

### Gemini 3.1 Pro Preview Extraction + Recommendation Output
```typescript
interface GeminiExtraction {
  demographic_signals: { age, gender, household_size, has_children, has_pets, employment_type, income_bracket };
  personality_profile: string;
  detected_currency: string;                    // "EUR", "GBP", "USD"
  budget_range: { min: number, max: number, currency: string };
  metrics: {                                    // 100-250 numbered metrics
    id: string;                                 // "M1", "M2", ...
    description: string;
    category: string;                           // one of 23 category modules (funnel order)
    source_paragraph: number;                   // 1-30
    data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
    research_query: string;                     // what Tavily should search
    user_justification: string;                 // tied to specific paragraph text (P#)
    data_justification: string;                 // real-world data from google_search
    source: string;                             // "Tavily: ...", "Google Search: ...", etc.
    threshold?: { operator, value, unit };
  }[];
  recommended_countries: { name, iso_code, reasoning, local_currency }[];
  recommended_cities: { name, country, reasoning }[];
  recommended_towns: { name, parent_city, reasoning }[];
  recommended_neighborhoods: { name, parent_town, reasoning }[];
  location_metrics: {                           // Side-by-Side Metric View
    field_id: string;                           // "safety_index", "connectivity_5G"
    label: string;
    category: string;
    locations: { name, type, score, user_justification, data_justification, source }[];
  }[];
  paragraph_summaries: { id, key_themes, extracted_preferences, metrics_derived }[];
  dnw_signals: string[];                        // "hates humidity", "avoids instability"
  mh_signals: string[];                         // "needs fast internet", "wants walkable"
  tradeoff_signals: string[];                   // "safety > cost of living"
  module_relevance: Record<string, number>;     // climate: 0.9, tech: 0.8
  globe_region_preference: string;
}
```

**CRITICAL**: Gemini 3.1 Pro Preview is the REASONING ENGINE. It uses `thinking_level: "high"` for deep reasoning and Google Search grounding for live 2026 data. Each metric includes dual justifications (user-said + real-world data). It extracts metrics, recommends locations, AND scores them at Discovery tier. Opus/Cristiano always judges Gemini's output afterward.

---

## 6. PROGRESSIVE CONFIDENCE ARCHITECTURE

The core innovation: every user gets results no matter where they stop. More data = narrower funnel + higher confidence.

```
TIER              CONFIDENCE   LLMs FIRED        JUDGE   OUTPUT
─────────────────────────────────────────────────────────────────
Paragraphical     DISCOVERY    1 (Gemini)        No      3 countries, 9 cities
only              ~35%

+ Demographics    EXPLORATORY  2 (Gemini+Claude) No      3 countries, 9 cities,
                  ~45%                                    9 towns

+ DNWs            FILTERED     3 LLMs            No      2-3 countries, 6-9
                  ~60%                                    cities, towns, nbhds

+ MHs             EVALUATED    4 LLMs            No      1-2 countries, 3 cities
                  ~75%                                    9 towns, 27 nbhds

+ General Q's     VALIDATED    5 LLMs + Opus     Yes     1 country, 3 cities
                  ~90%                                    9 towns, 27 nbhds

+ Mini Modules    PRECISION    5 LLMs + Opus     Yes     1 country, 1 city
(each +0.5%)      90-100%                                 1 town, 1 nbhd
```

### TypeScript Types
```typescript
type CompletionTier =
  | 'discovery'      // Paragraphical only
  | 'exploratory'    // + Demographics
  | 'filtered'       // + DNWs
  | 'evaluated'      // + MHs
  | 'validated'      // + General Questions
  | 'precision';     // + Mini Modules

interface EvaluationContext {
  tier: CompletionTier;
  confidence: number;            // 0-100
  paragraphical?: GeminiExtraction;
  demographics?: DemographicAnswers;
  dnw?: DNWAnswers;
  mh?: MHAnswers;
  generalQuestions?: GeneralAnswers;
  completedModules?: string[];
  globeRegion?: string;
}

interface EvaluationResult {
  tier: CompletionTier;
  confidence: number;
  countries: CountryRecommendation[];   // 1-3
  cities: CityRecommendation[];         // 3-9
  towns: TownRecommendation[];          // 3-27
  neighborhoods: NeighborhoodRecommendation[];  // 3-27
  nextSteps: NextStep[];               // "Complete DNWs for +25% confidence"
  llmsUsed: string[];
  judgeUsed: boolean;
  dataCompleteness: Record<string, boolean>;
}
```

---

## 7. MAIN MODULE STRUCTURE (300 Questions)

The Main Module has 4 sub-sections, unlocking sequentially:

| Section | Questions | Purpose | Unlock Condition |
|---------|-----------|---------|------------------|
| Demographics | 34 Q | Context (age, household, income) | Always open |
| Do Not Wants (DNW) | 33 Q | Hard elimination walls | Demographics complete |
| Must Haves (MH) | 33 Q | Positive magnets/boosters | DNW complete |
| General Questions | 200 Q | Deep scoring across all modules | MH complete |

### DNW Severity Tiers (5 levels)
1. **Mild Preference** - Slight negative, won't eliminate
2. **Moderate Concern** - Notable negative, reduces score
3. **Strong Aversion** - Significant penalty
4. **Critical Issue** - Near-elimination threshold
5. **Absolute Dealbreaker** - Instant city elimination

### MH Importance Tiers (5 levels)
1. **Nice to Have** - Small positive boost
2. **Somewhat Important** - Moderate boost
3. **Important** - Significant boost
4. **Very Important** - Major boost
5. **Essential** - Critical requirement, near-mandatory

---

## 8. CLUES 5-TIER SCORING SCALE & QUESTION RESPONSE TYPE TAXONOMY

> **PURPOSE**: Every question across all 23 category modules (2,300 questions) and the Main Module (~300 questions) must return structured data that maps to the universal CLUES 5-Tier Color Scale. This section defines the scale, the approved response types, and how each response type maps to a 0-100 score.

### The CLUES 5-Tier Color Scale (Universal)

This is the **single scoring backbone** used across the entire CLUES ecosystem — LifeScore, Main Module, category modules, reports, dashboards, and all LLM evaluations. Every score, everywhere, maps to one of these five tiers.

| Tier | Range | Color | Label | Hex |
|------|-------|-------|-------|-----|
| 1 | 0-20 | Red | Poor | `#ef4444` |
| 2 | 21-40 | Orange | Below Average / Fair | `#f97316` |
| 3 | 41-60 | Yellow | Average | `#eab308` |
| 4 | 61-80 | Blue | Good / Above Average | `#3b82f6` |
| 5 | 81-100 | Green | Excellent | `#22c55e` |

**Rule**: Every question's answer must ultimately be convertible to a **0-100 score** that lands in one of these tiers. This is the contract between the questionnaire system and the LLM evaluation pipeline.

### Approved Response Types

Every question in every module file MUST have a `| Type |` column with one of these approved values:

#### Direct-Scoring Types (user answer maps directly to 0-100)

These response types produce a score immediately from the user's selection. The 5 options in each Likert variant map to `0, 25, 50, 75, 100` (the midpoints of each tier).

| Type Code | Label Set (1→5) | Use For |
|-----------|-----------------|---------|
| `Likert-Importance` | Not Important → Slightly → Moderately → Very → Essential | "How important is X?" questions |
| `Likert-Frequency` | Never → Rarely → Sometimes → Often → Always | "How often do you X?" questions |
| `Likert-Comfort` | Very Uncomfortable → Uncomfortable → Neutral → Comfortable → Very Comfortable | "How comfortable are you with X?" questions |
| `Likert-Concern` | Not Concerned → Slightly → Moderately → Very → Extremely Concerned | "How concerned are you about X?" questions |
| `Likert-Willingness` | Unwilling → Reluctant → Neutral → Willing → Eager | "Would you accept / are you willing to X?" questions |
| `Likert-Satisfaction` | Very Dissatisfied → Dissatisfied → Neutral → Satisfied → Very Satisfied | "How satisfied are you with X?" questions |
| `Likert-Agreement` | Strongly Disagree → Disagree → Neutral → Agree → Strongly Agree | "Do you agree that X?" questions |
| `Dealbreaker` | Not a Factor → Mild Preference → Moderate Preference → Strong Preference → Absolute Dealbreaker | DNW-style severity questions |

#### Indirect-Scoring Types (LLM calculates 0-100 by comparing user answer to city data)

These response types collect structured user preferences. The LLMs then compare the user's selections/values against real-world city data (via Tavily/Google Search) to produce a 0-100 match score.

| Type Code | UI Component | How LLM Scores It |
|-----------|-------------|-------------------|
| `Multi-select` | Checkboxes (select all that apply) | % of user's selections available in the city → 0-100 |
| `Single-select` | Radio buttons (pick one) | Binary match (city has it or doesn't) → feeds weighted section score |
| `Range` | Predefined brackets (budget, distance, time) | Proximity of city's actual value to user's ideal range → 0-100 |
| `Ranking` | Drag-and-drop ordering of 5 items | NOT a score — becomes **section weights** for how much each sub-topic matters within its module |
| `Yes/No` | Binary toggle | Acts as a **gate/filter** — determines module relevance (e.g., "Do you have pets?" gates the entire Pets module) |
| `Yes/No/Maybe` | Ternary toggle | Like Yes/No but "Maybe" = half-weight gate |
| `Number` | Numeric input | Compared against city data (e.g., "How many pets?" → checked against breed/import restrictions) |
| `Slider` | 0-100 continuous slider | Direct 0-100 value — used for trade-off and Cultural Flex questions |
| `Text` | Short free-text input | Demographics only (name, languages, nationality) — NOT scored, used as context for LLMs |

### Score Mapping Rules

1. **All Likert types** → User picks 1 of 5 → maps to `0, 25, 50, 75, 100`
2. **Dealbreaker type** → Same 5-point mapping, but severity 5 (100) triggers **instant city elimination** per DNW rules
3. **Multi-select** → LLM calculates `(matched_items / total_selected) × 100`
4. **Range** → LLM calculates proximity: if user wants $2k-3k/mo and city is $2.5k, score = 100; if city is $5k, score = 20
5. **Ranking** → Does NOT produce a score. Produces **weights** (1st place = highest weight) for the section's questions
6. **Yes/No** → `Yes` = module/section is relevant (scored normally); `No` = module/section weight drops to 0
7. **Slider** → Raw 0-100 value IS the score
8. **Text** → No score. Context only.

### Section Structure Rule

Every module follows this pattern:
- **10 sections** of ~10 questions each (may vary slightly per module)
- **Every section's last question is a `Ranking` type** — user drag-and-drops the section's key factors in priority order
- **Question 100 is always a `Ranking` type** — master cross-section priority ranking for the entire module
- The Ranking answers become the **weights** the LLMs use when computing the module's overall city score

### How This Feeds the LLM Pipeline

```
USER ANSWERS (structured)
    │
    ├── Likert scores (0/25/50/75/100) ──→ "User wants X at importance level 75"
    ├── Multi-selects ──→ "User needs: Thai, Italian, Japanese cuisine"
    ├── Ranges ──→ "User budget: $2,000-$3,000/month"
    ├── Rankings ──→ "User weights: Safety > Cost > Climate > Culture"
    ├── Yes/No gates ──→ "User has no pets → skip Pets module"
    │
    ▼
LLM + TAVILY RESEARCH
    │
    ├── Compare user preferences against real city data
    ├── Score each metric 0-100 on the CLUES 5-Tier Scale
    ├── Apply section weights from Ranking answers
    ├── Apply module weights from master Rankings (Q100)
    │
    ▼
CITY SCORE (0-100, maps to Red/Orange/Yellow/Blue/Green)
```

### Question File Format Standard

Every question file in `docs/` MUST use this table format:

```markdown
| # | Question | Type |
|---|----------|------|
| 1 | How important is access to major international banks near your home? | Likert-Importance |
| 2 | Which banking services are essential for your daily life? (Select all that apply) | Multi-select |
| 3 | Do you need multi-currency accounts? | Yes/No/Maybe |
| 10 | Rank these factors from most to least important: Factor A, Factor B, Factor C, Factor D, Factor E | Ranking |
```

### Cultural Flex Questions

Questions tagged `CULTURAL FLEX` in the question text use `Slider` type (0-100). These measure the user's willingness to adapt to local customs. The slider value maps directly to the CLUES scale:
- 0-20 (Red): "I need things exactly like home"
- 21-40 (Orange): "I prefer familiar but can tolerate some differences"
- 41-60 (Yellow): "I'm neutral — some adaptation is fine"
- 61-80 (Blue): "I enjoy adapting to local ways"
- 81-100 (Green): "I want full cultural immersion"

---

## 9. THREE-LAYER WEIGHT SYSTEM

```
Layer 1: PERSONA DEFAULTS
  └── 6 presets with pre-configured module weights
      Balanced | Digital Nomad | Entrepreneur | Family | Libertarian | Investor

Layer 2: USER OVERRIDES
  └── User adjusts weights via sliders after choosing persona
      "I'm a Digital Nomad but I care MORE about healthcare"

Layer 3: OPUS JUDGE OVERRIDES
  └── Judge can adjust weights based on evaluation evidence
      "User's DNW responses suggest safety should be weighted higher"
```

---

## 10. REPORT PIPELINE (5 Deliverables)

```
EVALUATION COMPLETE (any tier)
            │
            ▼
┌───────────────────────────────────────────┐
│  1. LLM RAW REPORT                       │
│  The "manuscript" - data + analysis       │
│  Written by LLMs following playbook       │
│  Discovery: 15-20 pages                   │
│  Validated: 50-100 pages                  │
│  Precision: 100-150 pages                 │
└───────────────────┬───────────────────────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
┌────────────┐ ┌────────────┐ ┌─────────────────┐
│ 2. GAMMA   │ │ 3.CRISTIANO│ │ 4. OLIVIA       │
│ REPORT     │ │ JUDGE VIDEO│ │ PRESENTATION    │
│            │ │            │ │                  │
│ Polished   │ │ A-Film:    │ │ HeyGen avatar   │
│ branded    │ │ Winner     │ │ walks through   │
│ visual     │ │ drone fly- │ │ Gamma report    │
│ magazine   │ │ overs,     │ │ Video + Audio   │
│ quality    │ │ narration  │ │ podcast version │
│            │ │ B-Film:    │ │ ~15-20 min      │
│ Charts,    │ │ Runner-up  │ │                  │
│ maps,      │ │ 3-5 min ea │ │                  │
│ photos     │ │            │ │                  │
└────────────┘ └────────────┘ └─────────────────┘
                                       │
                              ┌────────┘
                              ▼
                    ┌──────────────────┐
                    │ 5. INVIDEO MOVIE │
                    │ "My Life Before  │
                    │  and After"      │
                    │ 10-min cinematic │
                    │ theatre movie    │
                    └──────────────────┘
```

### Report Scaling by Tier
```
Discovery (35%):   15-20pg LLM | 25-30pg Gamma | 1 film | 5min Olivia | No movie
Validated (90%):   50-100pg    | 100pg Gamma   | A+B    | 15-20min    | 10min movie
Precision (100%):  100-150pg   | 120+pg Gamma  | A+B+hl | 20+min      | 10min movie
```

---

## 11. UI/UX SPECIFICATION

### Design Language
- **Theme**: Dark mode default, glassmorphic (frosted glass with backdrop blur). WCAG 2.1 AA compliance required for BOTH dark and light mode.
- **Font**: Montserrat (400, 500, 600, 700, 800) + JetBrains Mono
- **Primary Color**: Sapphire blue `#2563eb`
- **Accent**: Orange `#f97316`, Gold `#f59e0b`
- **Background**: `#0a0e1a` (almost black)
- **Cards**: `rgba(255,255,255,0.06)` with 20px blur

### Illumination States (Module Buttons)
| State | Visual | Animation |
|-------|--------|-----------|
| `locked` | 35% opacity, 70% grayscale | None |
| `not_started` | Gray, desaturated | None |
| `in_progress` | Pulsing sapphire glow | 2.5s pulse cycle |
| `completed` | Green glow + completion meter | 3s glow cycle |
| `recommended` | Gold shimmer | 3s shimmer cycle |

### Responsive Breakpoints
- Desktop: 5 columns (>1024px)
- Tablet: 4 → 3 columns (768px-1024px)
- Mobile: 2 columns (<480px)

### Staggered Animations
- Components fade-up on mount with increasing delays (100ms, 250ms, 400ms)
- Module grid items stagger at 50ms intervals

---

## 12. CURRENT PROJECT STATE (Phase 2 In Progress)

### What's Built
- ✅ Dashboard layout with Paragraphical button, Main Module expander, Module Grid
- ✅ 23 module cards with illumination states and animations
- ✅ Glassmorphic design system (CSS custom properties, utilities)
- ✅ Header with navigation placeholders
- ✅ Olivia (AI assistant) and Emilia (help) floating chat bubbles
- ✅ Status badge component (reusable, 2 sizes)
- ✅ Toast notification system
- ✅ Vercel deployment configured (SPA rewrite)
- ✅ GitHub repo connected
- ✅ Hero heading: "Stop Guessing — Start Living: Your New Life is a Click Away"
- ✅ Interactive 3D globe (react-globe.gl) with progressive zoom (region → country → city)
- ✅ Globe zoom depth indicator (3 pips + level label), reset button, region badge
- ✅ Post-zoom prompt: "Now click on the Paragraphical below and tell us about: You"
- ✅ Globe passes lat/lng/zoomLevel to state for Supabase persistence
- ✅ Centralized UserContext (useReducer, 15 action types, isLoading state)
- ✅ Supabase client (graceful local-only fallback when env vars not set)
- ✅ Core TypeScript types in src/types/index.ts (full pipeline shapes)
- ✅ Directory structure: src/lib/, src/hooks/, src/context/, src/types/
- ✅ 3-layer session persistence (Supabase → localStorage → memory)
- ✅ Supabase schema with denormalized globe columns for LLM token savings
- ✅ Globe position restored on return (auto-zoom to saved lat/lng)
- ✅ cost_tracking table ready for mandatory per-call logging
- ✅ Cost tracking service (`src/lib/costTracking.ts`) with provider rate table, logCost(), aggregation
- ✅ Cost tracking dashboard modal (admin-only) with provider breakdown, tier breakdown, profitability analysis
- ✅ Emilia help panel with categorized help topics (admin sees Cost Tracking + System Status)
- ✅ React Router (`/` dashboard, `/paragraphical` essay flow)
- ✅ Paragraphical 30-paragraph stepped input UI with sidebar navigation
- ✅ 30 paragraph definitions with prompts, placeholders, section groupings, moduleId mapping
- ✅ Auto-save paragraphs to context (→ Supabase) on navigation
- ✅ Dashboard loading state during session hydration
- ✅ Olivia Tutor: Layer 1 (coverage targets data) + Layer 2 (keyword detection) + Layer 3 (Gemini 3.1 Pro Preview escalation)
- ✅ 30 paragraph coverage targets with keyword groups and template interjections (`src/data/paragraphTargets.ts`)
- ✅ Gemini extraction+recommendation prompt rewritten for 30-paragraph pipeline (`api/paragraphical.ts`)

- ✅ Gemini 3.1 Pro Preview reasoning engine (`/api/paragraphical`) with thinking_level, search grounding, metric extraction
- ✅ File upload endpoint (`/api/upload`) for 100MB Gemini ingestion
- ✅ Tier engine with `gemini-3.1-pro-preview` model references
- ✅ Results components: ReasoningTrace, SideBySideMetricView, ReactiveJustification, ThinkingDetailsPanel, FileUpload
- ✅ GeminiMetricObject type with fieldId, score, user_justification, data_justification, source
- ✅ Cost tracking updated for `gemini-3.1-pro-preview` provider

### What's NOT Built Yet
- ❌ Gemini extraction endpoint deployment (prompt written, endpoint not yet tested with live API key)
- ❌ Main Module questionnaire UI (Demographics, DNW, MH, General)
- ❌ 5 LLM evaluation endpoints
- ❌ Opus Judge endpoint
- ❌ Tavily research/search integration
- ❌ Progressive tier calculator
- ❌ Report generation pipeline
- ❌ Supabase auth (client + schema ready, auth flow not built)
- ❌ Stripe subscription flow
- ❌ Two-row header (needs LifeScore-style city comparison row)
- ❌ Individual module deep-dive UIs
- ❌ Results/Reports/Settings pages
- ❌ Chat functionality for Olivia/Emilia bubbles

---

## 13. FILE STRUCTURE

```
clues-main/
├── index.html                          # Entry HTML, Montserrat font, meta
├── package.json                        # React 19, Vite 7, Supabase, react-globe.gl
├── vercel.json                         # SPA rewrite only (no function config yet)
├── vite.config.ts                      # Standard Vite + React plugin
├── tsconfig.json                       # References app + node configs
├── tsconfig.app.json                   # ES2022, strict, JSX react-jsx
├── .gitignore                          # Claude temps, .env patterns
├── CLUES_MAIN_BUILD_REFERENCE.md       # THIS FILE - persistent knowledge base
│
└── src/
    ├── main.tsx                        # Entry: StrictMode, Toaster config
    ├── App.tsx                         # Root: UserProvider → Dashboard
    │
    ├── types/
    │   └── index.ts                    # All shared TypeScript types
    │
    ├── lib/
    │   ├── supabase.ts                 # Supabase client (env-gated)
    │   └── costTracking.ts             # Cost tracking service, rate table, aggregation
    │
    ├── context/
    │   └── UserContext.tsx              # useReducer + auto-save, 15 actions
    │
    ├── hooks/                          # (empty — ready for custom hooks)
    │
    ├── components/
    │   ├── Dashboard/
    │   │   ├── Dashboard.tsx           # Layout orchestrator, reads UserContext
    │   │   ├── HeroHeading.tsx         # "Stop Guessing — Start Living"
    │   │   ├── GlobeExplorer.tsx       # 3D globe, progressive zoom, lat/lng
    │   │   ├── ParagraphicalButton.tsx # Hero CTA, 4 states, gradient
    │   │   ├── MainModuleExpander.tsx  # Collapsible panel, 2x2 sub-sections
    │   │   ├── ModuleGrid.tsx          # 5-col responsive grid, staggered
    │   │   ├── ModuleButton.tsx        # Individual module card, 5 states
    │   │   ├── StatusBadge.tsx         # Reusable badge (md/sm sizes)
    │   │   └── *.css                   # Component-scoped styles
    │   │
    │   └── Shared/
    │       ├── Header.tsx              # Sticky glassmorphic header + admin cost toggle
    │       ├── OliviaBubble.tsx        # Bottom-right AI assistant (blue)
    │       ├── EmiliaBubble.tsx        # Bottom-left help panel with categories
    │       ├── EmiliaPanel.css         # Help panel styles
    │       ├── CostTrackingModal.tsx   # Admin cost dashboard modal
    │       └── CostTrackingModal.css   # Cost dashboard styles
    │
    ├── data/
    │   └── modules.ts                  # 23 module definitions, types, map
    │
    └── styles/
        └── globals.css                 # Full CSS design system
```

---

## 14. CRITICAL RULES (DO NOT VIOLATE)

1. **Gemini 3.1 Pro Preview is the REASONING ENGINE.** It extracts metrics from paragraphs, recommends locations, AND scores them at Discovery tier using deep reasoning (thinking_level: high) and Google Search grounding. Each metric includes dual justifications. Opus/Cristiano always judges Gemini's output afterward. Gemini is NOT the final word — it is the first-pass reasoner.

2. **Every completion tier produces results.** Always output: countries → cities → towns → neighborhoods. The only difference is quantity, confidence, and AI depth.

3. **5 LLMs + Opus Judge** is the full evaluation pipeline. Never shortcut to fewer models for cost savings without user consent.

4. **WCAG 2.1 AA in both dark AND light mode.** Dark mode is the default brand aesthetic (glassmorphic), but all UI and reports must also meet WCAG contrast and accessibility requirements in light mode.

5. **LifeScore is the reference implementation.** Follow its patterns for API routes, LLM integration, batch splitting, error handling, and cost tracking.

6. **Reports were built first.** The app exists to feed data into the report pipeline. Report format, brand voice, and quality are non-negotiable. Study summer report files before changing report structure.

7. **Module order follows Funnel Flow** (Survival → Identity), NOT alphabetical.

8. **DNWs are hard walls.** A severity-5 DNW instantly eliminates a city regardless of other scores.

9. **Three-layer weights.** Persona defaults → User overrides → Opus Judge overrides. All three layers must be maintained.

10. **Paragraph-to-metric linking.** Every recommendation should trace back to specific paragraphs (P3, P10, P14) for transparency.

11. **Progressive confidence nudges.** Every report shows "Next Steps" that encourage deeper funnel completion without forcing it.

12. **No over-engineering.** Build what's needed now. Don't add abstractions for hypothetical features.

13. **Batch splitting for large categories.** If a module has >12 metrics, split into parallel batches (LifeScore pattern).

14. **Cost tracking is mandatory.** Every LLM call must track tokens and cost in Supabase.

---

## 15. BUGS TO AVOID (from LifeScore lessons)

1. **Don't put function configs in vercel.json for routes that don't exist yet** - causes build failures
2. **tmpclaude-* files**: Add to .gitignore, never commit
3. **Windows paths in cloud environments**: Use forward slashes, not backslashes
4. **Typeform/questionnaire data format**: Maintain consistent shape across all 300 questions
5. **LLM timeout**: Set 60s timeout for parallel evaluations, don't fail entire batch if one model times out
6. **Tavily rate limits**: Cache results for 30 minutes, don't re-search same query
7. **Supabase RLS**: Enable Row Level Security on all tables from day one
8. **React 19 strict mode**: Components render twice in dev - don't treat as bugs
9. **Vercel cold starts**: First serverless function call may be slow - show loading state
10. **Git merge conflicts on module data**: modules.ts is a single source of truth - never split

---

## 16. GEMINI 3.1 PRO PREVIEW DATA CONTRACT

> **IMPORTANT**: Gemini 3.1 Pro Preview (released Feb 2026) is the reasoning engine.
> It uses `thinking_level: "high"`, `include_thinking_details: true`, and
> `tools: [{ google_search: {} }]` for deep reasoning with real-time search grounding.

### API Configuration
```typescript
// api/paragraphical.ts — Gemini 3.1 Pro Preview config
const geminiRequestBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 65536,
    responseMimeType: 'application/json',
    thinking_level: 'high',             // Deep multi-step reasoning
    include_thinking_details: true,     // Returns internal reasoning chain
  },
  tools: [{
    google_search: {},                  // Native 2026 search grounding
  }],
};
```

### Input to Gemini
```typescript
interface ParagraphicalInput {
  paragraphs: {
    id: number;           // 1-30
    heading: string;      // "Who You Are"
    content: string;      // User's free-form text
    moduleId?: string;    // P6-P28 only: links to the category module this paragraph mirrors
  }[];
  globeRegion: string;    // "Southern Europe / Mediterranean"
  fileUrls?: string[];    // Uploaded files (medical records, spreadsheets) — up to 100MB
  metadata: {
    timestamp: string;
    appVersion: string;
  };
}
```

### Output from Gemini 3.1 Pro Preview (Metric Object with Justifications)
```typescript
interface GeminiMetricObject {
  id: string;                      // "M1", "M2", etc.
  fieldId: string;                 // "climate_01_humidity"
  description: string;             // "Average annual humidity below 60%"
  category: string;                // One of 23 category modules (funnel order)
  source_paragraph: number;        // Which paragraph (1-30)
  score: number;                   // 0-100 (relative to other locations)
  user_justification: string;      // "Matches P4: User prioritized 'low petty crime'"
  data_justification: string;      // "Cascais 2026 safety reports show 12% decrease"
  source: string;                  // "Tavily: Portugal Interior Ministry Report 2026"
  data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
  research_query: string;          // What Tavily should search
}

interface GeminiExtraction {
  demographic_signals: { age?, gender?, household_size?, has_children?, has_pets?, employment_type?, income_bracket? };
  personality_profile: string;
  detected_currency: string;       // "EUR", "GBP", "USD" — detected from paragraphs
  budget_range: { min, max, currency };
  metrics: GeminiMetricObject[];   // 100-250 numbered metrics (THE KEY OUTPUT)
  recommended_countries: { name, iso_code, reasoning, local_currency }[];
  recommended_cities: LocationMetrics[];    // Top 3 with per-city metric scores
  recommended_towns: LocationMetrics[];     // Top 3 in winning city
  recommended_neighborhoods: LocationMetrics[]; // Top 3 in winning town
  paragraph_summaries: { id, key_themes, extracted_preferences, metrics_derived }[];
  dnw_signals: string[];
  mh_signals: string[];
  tradeoff_signals: string[];
  module_relevance: Record<string, number>;
  globe_region_preference: string;
  thinking_details?: ThinkingStep[];  // Reasoning chain for transparency UI
}
```

### What Gemini 3.1 Pro Preview Enables
1. **100-250 numbered metrics** derived from user's 30 paragraphs
2. **Location recommendations** (country → city → town → neighborhood)
3. **Per-metric scoring** with user_justification + data_justification + source
4. **Reasoning trace** — thinking_details array shows HOW the model reached its conclusions
5. **100MB file uploads** — medical records (P8), financial spreadsheets (P11) ingested directly
6. **Emerging neighborhood discovery** — ARC-AGI-2 reasoning finds hidden-gem locations
7. Pre-fills Demographics, suggests DNW severity levels, suggests MH importance levels
8. Weights the 23 category modules by relevance via module_relevance scores
9. Extracts tradeoff_signals for priority weighting downstream

---

## 17. SMART SCALING RULES (Cost vs. Depth)

The system scales AI spend proportionally to data completeness. A busy executive pays less and gets a Discovery report in 30 seconds. A thorough user pays more and gets a Precision report. Both get the same output format.

```
┌─────────────────────┬─────────────────────┬────────────┬─────────────────┬───────┐
│  What's Available   │     LLMs Fired      │ Opus Judge │ Tavily Searches │ Cost  │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ Paragraphical only  │ 1 (Gemini)          │ No         │ 5 basic         │ $     │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ + Demographics      │ 2 (Gemini + Claude) │ No         │ 10              │ $$    │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ + DNWs              │ 3                   │ No         │ 15              │ $$$   │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ + MHs               │ 4                   │ No         │ 20              │ $$$$  │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ + General Questions │ 5 + Opus Judge      │ Yes        │ Full (200+)     │ $$$$$ │
├─────────────────────┼─────────────────────┼────────────┼─────────────────┼───────┤
│ + Each Mini Module  │ Same 5 + Judge      │ Yes        │ +20 per module  │ $$$$$ │
└─────────────────────┴─────────────────────┴────────────┴─────────────────┴───────┘
```

### LLM Firing Order by Tier

| Tier | Which LLMs | Why |
|------|-----------|-----|
| Discovery (1) | Gemini only | It already did the extraction — reuse that context for a quick-scan recommendation |
| Exploratory (2) | Gemini + Claude Sonnet | Sonnet adds structured reasoning on top of Gemini's narrative context |
| Filtered (3) | + GPT-4o | GPT-4o excels at elimination/classification tasks (DNW hard walls) |
| Evaluated (4) | + Grok | Grok adds real-time web context for MH scoring (transit, internet, etc.) |
| Validated (5+Judge) | + Perplexity Sonar + Opus Judge | Full panel. Perplexity adds research-backed citations. Opus arbitrates. |
| Precision (5+Judge) | Same panel, deeper prompts | Each completed mini module adds domain-specific scoring context |

---

## 18. NEXT STEPS RECOMMENDATION ENGINE

Every report ends with a "Next Steps" block that nudges users down the funnel without forcing them. The confidence gain values drive urgency ordering.

```
YOUR REPORT: DISCOVERY (35% confidence)

To improve your results:
┌──────────────────────────────────────────────────┐
│ ★ Complete "Do Not Wants" → +25% confidence      │
│   Eliminates cities that are deal breakers        │
│   ~10 minutes · 33 questions                      │
├──────────────────────────────────────────────────┤
│   Complete "Must Haves" → +15% confidence         │
│   Boosts cities that match what you want          │
│   ~10 minutes · 33 questions                      │
├──────────────────────────────────────────────────┤
│   Complete "Demographics" → +10% confidence       │
│   Helps us understand your household needs        │
│   ~5 minutes · 34 questions                       │
└──────────────────────────────────────────────────┘
```

### Confidence Gain Table

| Action | Confidence Gain | Time Estimate |
|--------|----------------|---------------|
| Complete Paragraphical | Base 35% | 30-60 min |
| Complete Demographics | +10% | 5 min |
| Complete DNWs | +15% | 10 min |
| Complete MHs | +10% | 10 min |
| Complete General Questions | +20% | 30 min |
| Each Mini Module (20 total) | +0.5% each | 5-10 min each |
| All Mini Modules | +10% total | 2-3 hours |

The star (★) goes on the highest-gain incomplete item. Items are ordered by gain descending, not by pipeline sequence. A user might skip Demographics but the DNW gain is higher, so DNW shows first.

---

## 19. COST TRACKING SYSTEM (Built)

### Architecture
- **Types**: `CostProvider` (16 providers), `CostEntry`, `CostSummary`, `ProviderCostSummary`, `SessionCostRow` in `src/types/index.ts`
- **Service**: `src/lib/costTracking.ts` — rate table, `logCost()`, `fetchAllCosts()`, `buildCostSummary()`, CSV export
- **UI**: `src/components/Shared/CostTrackingModal.tsx` — admin-only modal
- **Access**: Header toolbar (money bag icon) + Emilia help panel → "Cost Tracking" category
- **Admin gate**: `?admin=true` URL param or `localStorage.setItem('clues_admin', 'true')`

### Provider Rate Table (per 1M tokens, March 2026)
```
claude-sonnet-4-5     Input: $3.00    Output: $15.00   (LLM Evaluator #1)
gpt-4o                Input: $2.50    Output: $10.00   (LLM Evaluator #2)
gemini-3.1-pro-preview Input: $1.25   Output: $10.00   (Reasoning Engine + LLM Evaluator #3)
grok-4                Input: $3.00    Output: $15.00   (LLM Evaluator #4)
perplexity-sonar      Input: $1.00    Output: $1.00    (LLM Evaluator #5)
claude-opus-4-5       Input: $15.00   Output: $75.00   (Opus Judge)
tavily                Flat rate per search              (Research + Search)
gamma                 Flat rate per report              (Report generation)
claude-sonnet-4-6     Input: $3.00    Output: $15.00   (Olivia Chat Assistant — Sonnet 4.6 company-wide)
olivia-tutor          Input: $1.25    Output: $10.00   (Paragraphical tutor — Gemini 3.1 Pro Preview)
tts-elevenlabs        Per character                     (Voice narration)
tts-openai            Per character                     (Voice narration)
avatar-heygen         Per minute                        (Video avatar)
avatar-d-id           Per minute                        (Video avatar)
kling-ai              Per image                         (Image generation)
```

### Dashboard Sections (mirrors LifeScore pattern)
1. **Cost Summary** — Grand total, total sessions, total API calls, avg cost per session
2. **Cost by Provider** — Each provider with $ amount, % of total, visual bar
3. **Cost by Completion Tier** — How much was spent at each tier level
4. **Profitability Analysis** — Avg cost/session, break-even (20%), suggested (50%), suggested (100%)
5. **Recent Sessions** — Table with session ID, tier, calls, date, cost, optional margin column
6. **Actions** — Save to DB, Export CSV, Delete All

### Persistence
- Dual write: every `logCost()` call saves to both localStorage AND Supabase
- Fetch prefers Supabase (authoritative), falls back to localStorage if Supabase unavailable
- Same 3-layer pattern as session persistence

---

## 20. THE CORE RULE

**Every entry point produces: best countries → best cities → best towns → best neighborhoods. Always. No exceptions.**

The only things that change across tiers:
- **How many** — 3 countries at Discovery, 1 country at Precision
- **How confident** — 35% at Discovery, 100% at Precision
- **How much AI power** — 1 LLM at Discovery, 5 LLMs + Judge at Validated+

A user who completes only the Paragraphical gets a Discovery report with 3 countries and 9 cities. A user who completes everything gets a Precision report with 1 country, 1 city, 1 town, 1 neighborhood. The report format is identical — only the confidence badge and depth changes.

Reports must label what was NOT completed:
- "No dealbreakers applied — results may include locations you'd reject"
- "No must-haves scored — results are based on elimination only"
- "Partial evaluation — 2 of 5 AI models used"

---

## 21. EVALUATION PIPELINE IMPLEMENTATION PLAN

### One Function, Adaptive Depth

```typescript
// api/evaluate.ts — THE evaluation endpoint
// Receives EvaluationContext, determines tier, fires appropriate LLMs
async function evaluate(context: EvaluationContext): Promise<EvaluationResult> {
  // 1. Determine tier from available data
  const tier = calculateTier(context);
  const confidence = calculateConfidence(context);

  // 2. Get metro candidates (globe region narrows from 1000+ to ~80-120)
  const candidates = await getCandidateMetros(context.globeRegion);

  // 3. Apply DNW elimination (if available)
  const afterDNW = context.dnw
    ? eliminateByDNW(candidates, context.dnw)
    : candidates;

  // 4. Fire LLMs based on tier (see firing order table)
  const llmResults = await fireLLMs(tier, context, afterDNW);

  // 5. Apply MH scoring (if available)
  const scored = context.mh
    ? applyMHScoring(llmResults, context.mh)
    : llmResults;

  // 6. Opus Judge consensus (only at validated+ tier)
  const final = tier === 'validated' || tier === 'precision'
    ? await opusJudge(scored, context)
    : scored;

  // 7. Build recommendations at appropriate depth
  const result = buildRecommendations(final, tier);

  // 8. Calculate next steps
  result.nextSteps = calculateNextSteps(context);

  // 9. Log costs
  // (each LLM call already logged via logCost() — summary attached to result)

  return result;
}
```

### Tier Calculator

```typescript
function calculateTier(context: EvaluationContext): CompletionTier {
  if (context.completedModules?.length) return 'precision';
  if (context.generalQuestions) return 'validated';
  if (context.mh) return 'evaluated';
  if (context.dnw) return 'filtered';
  if (context.demographics) return 'exploratory';
  return 'discovery';
}

function calculateConfidence(context: EvaluationContext): number {
  let confidence = 0;
  if (context.paragraphical) confidence += 35;
  if (context.demographics) confidence += 10;
  if (context.dnw) confidence += 15;
  if (context.mh) confidence += 10;
  if (context.generalQuestions) confidence += 20;
  const moduleBonus = (context.completedModules?.length ?? 0) * 0.5;
  confidence += Math.min(moduleBonus, 10); // Cap at 10%
  return Math.min(confidence, 100);
}
```

### Key Implementation Notes

1. **Globe region is a pre-filter, not a hard wall.** If user zooms to Southern Europe but their DNWs eliminate all of Southern Europe, the system expands search. Globe selection is a starting preference, not a cage.

2. **Gemini extraction at Discovery tier doubles as the first LLM evaluation.** Since Gemini already analyzed the narrative, its extraction output IS the first-pass recommendation data. We don't call Gemini twice.

3. **DNW elimination is binary at severity 5.** Severity 1-4 reduces scores progressively. Only severity 5 is a hard wall that removes a city from consideration entirely.

4. **MH scoring is additive, not eliminative.** Must-Haves boost matching cities but never remove cities. The combination of DNW elimination + MH boosting creates the funnel.

5. **Tavily searches scale with tier.** Discovery gets 5 basic searches (top candidate regions). Validated gets 200+ searches (every metric for every candidate city). This is the biggest cost driver — more expensive than the LLMs at higher tiers.

6. **Partial success is acceptable.** If GPT-4o times out but 4 other LLMs return, the evaluation proceeds with 4 results. The confidence score adjusts slightly downward but the user still gets their report.

7. **Mini modules narrow, never expand.** Each completed mini module can only move the recommendation from 3→2→1 city, never introduce new candidates. The narrowing is monotonic.

---

## 22. NEXT STEPS (Updated Phase 2 Priority)

Priority order for development:

1. ~~Paragraphical UI~~ ✅ DONE — 30-paragraph stepped input (P3=Dealbreakers, P4=Must Haves, P5=Trade-offs, P6-P28=Module Deep Dives, P29-P30=Vision)
2. ~~Cost Tracking~~ ✅ DONE — Service, modal, admin access, dual persistence
3. **Gemini extraction endpoint** — `/api/paragraphical` (Vercel serverless function)
4. **Tier calculator + confidence engine** — `calculateTier()` + `calculateConfidence()`
5. **Discovery evaluation** — Gemini-only quick scan → first report at 35%
6. **Main Module questionnaire UI** — Demographics → DNW → MH → General flow
7. **Progressive evaluation endpoints** — Add LLMs as tier increases
8. **DNW elimination engine** — Binary walls (severity 5) + progressive penalties (1-4)
9. **MH scoring engine** — Additive boosting based on importance levels
10. **Opus Judge endpoint** — Consensus builder for validated+ tier
11. **Next Steps engine** — Dynamic "what to do next" recommendations
12. **Results page** — Country → City → Town → Neighborhood display with confidence badge
13. **Report generation** — LLM raw report following summer playbook
14. **Supabase auth flow** — Login/signup, session ownership
15. **Stripe subscription** — Free/Navigator/Sovereign tiers
16. **Deliverables pipeline** — Gamma, Cristiano, Olivia, InVideo

---

## 23. WHAT WE KEEP FROM PRIOR DESIGN DISCUSSIONS

### KEEP (locked in, no debate)
- **Gemini 3.1 Pro Preview as reasoning engine** — Extracts metrics, recommends locations, scores with justifications. Uses thinking_level: high + Google Search grounding. Opus always judges afterward.
- **Progressive Confidence Architecture** — Every tier produces results
- **Paragraph-to-metric linking** — P3, P10, P14 references in recommendations
- **TypeScript interfaces** — `EvaluationContext`, `EvaluationResult`, `GeminiExtraction` as defined
- **Nested location hierarchy** — Country → City → Town → Neighborhood, always
- **5 LLMs + Opus Judge** — Full panel at validated tier
- **Smart scaling** — LLMs fire incrementally, not all-or-nothing
- **Cost tracking per call** — Every LLM/API call logged with tokens and cost
- **Next Steps nudges** — Every report shows what to do next for more confidence
- **DNW severity 5 = instant elimination** — Hard wall, no exceptions
- **Globe region as preference, not cage** — System can expand if needed

### DON'T KEEP (rejected from original proposals)
- ~~Gemini as SOLE and FINAL evaluator~~ — Gemini is the first-pass reasoner; Opus/Cristiano always judges
- ~~Skipping DNW/MH structured questionnaire~~ — Narrative misses things (blood thinners, pharmacy access)
- ~~"Gemini is an EXTRACTOR, not an evaluator"~~ — **WRONG.** Gemini 3.1 Pro Preview extracts AND recommends AND scores at Discovery tier. It uses thinking_level: high for deep reasoning. The distinction is that Opus always judges afterward.

### ADAPTED (good idea, modified execution)
- **Gemini's TypeScript interfaces** → Kept as starting point, extended with `CompletionTier`, `SessionCostRow`, etc.
- **Paragraph-to-metric linking** → Expanded from Gemini's proposal to work across ALL tiers, not just Gemini's output
- **Budget extraction** → Gemini extracts budget range from narrative; user confirms in Demographics
- **Module relevance scoring** → Gemini suggests which modules matter most; used to order the "Recommended" badges on dashboard

---

*This file should be read by any AI assistant before starting work on the CLUES Main Module. It contains the complete architectural vision, technical decisions, and implementation patterns needed to build correctly.*
