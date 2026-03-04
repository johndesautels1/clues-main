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
| LLM Evaluators | Claude Sonnet 4.5, GPT-4o, Gemini 3.1 Pro, Grok 4, Perplexity Sonar Pro | 5 parallel evaluators |
| Judge | Claude Opus 4.5 | Consensus builder, reviews stdDev > 15 disagreements |
| Narrative Engine | Gemini | Paragraphical extraction ONLY (not sole evaluator) |
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

## 4. THE 20 MODULES (Human Existence Flow)

Modules are ordered by human need hierarchy, NOT alphabetically:

### SURVIVAL & FOUNDATION
1. **Climate & Weather** 🌡️ - Temperature, seasons, natural disasters
2. **Safety & Security** 🛡️ - Crime rates, emergency services, stability
3. **Healthcare & Medical** 🏥 - System quality, insurance, accessibility
4. **Housing & Real Estate** 🏠 - Cost, availability, types, quality

### LEGAL & FINANCIAL
5. **Legal & Immigration** ⚖️ - Visa pathways, residency, rule of law
6. **Financial & Banking** 💰 - Banking, cost of living, taxes
7. **LifeScore** 🗽 - Legal independence & freedom (100 metrics) ✅ COMPLETED

### LIVELIHOOD & GROWTH
8. **Business & Entrepreneurship** 💼 - Startup ecosystem, regulations
9. **Technology & Connectivity** 📡 - Internet, digital infrastructure
10. **Transportation** 🚇 - Transit, walkability, infrastructure
11. **Education & Learning** 🎓 - Schools, universities, programs

### PEOPLE & RELATIONSHIPS
12. **Family & Children** 👨‍👩‍👧‍👦 - Family services, schools, safety
13. **Dating & Social Life** 💬 - Dating scene, social communities
14. **Pets & Animals** 🐾 - Pet policies, veterinary care

### NOURISHMENT & LIFESTYLE
15. **Food & Cuisine** 🍽️ - Restaurants, dietary options, food culture
16. **Sports & Fitness** 🏃 - Gyms, sports leagues, facilities
17. **Outdoor & Nature** 🌿 - Parks, hiking, recreation

### SOUL & MEANING
18. **Arts & Culture** 🎨 - Museums, galleries, heritage
19. **Entertainment & Nightlife** 🎭 - Venues, events, nightlife
20. **Spiritual & Religious** 🕊️ - Places of worship, tolerance

Each module has **10 general questions** (200 total across 20 modules).

---

## 5. THE 24-PARAGRAPH PARAGRAPHICAL

Free-form narrative input mapped to the Human Existence Flow. Gemini extracts structured data from all 24 paragraphs.

### Paragraph Map
```
OPENING (Your Story)
  P1:  "Who You Are"             — Name, age, identity, origins
  P2:  "Your Life Right Now"     — Current situation, what works/doesn't

SURVIVAL & FOUNDATION
  P3:  "Your Ideal Climate"      — Weather, seasons, environment
  P4:  "Safety & Peace of Mind"  — What makes you feel secure
  P5:  "Your Health & Wellness"  — Medical needs, health priorities
  P6:  "Your Dream Home"         — Housing type, neighborhood, space

LEGAL & FINANCIAL
  P7:  "Your Legal Reality"      — Citizenship, visa situation
  P8:  "Your Financial Picture"  — Budget, income, cost tolerance
  P9:  "Freedom & Autonomy"      — What freedoms matter most

LIVELIHOOD & GROWTH
  P10: "Your Work & Career"      — Job, remote/local, ambitions
  P11: "Staying Connected"       — Internet, tech, digital life
  P12: "Getting Around"          — Car/transit/walk preferences
  P13: "Learning & Growth"       — Education goals (you or kids)

PEOPLE & RELATIONSHIPS
  P14: "Your Family"             — Who comes, family dynamics
  P15: "Your Social World"       — Friends, dating, community
  P16: "Your Animals"            — Pets, animal needs

NOURISHMENT & LIFESTYLE
  P17: "Food & Dining"           — Dietary needs, cuisines, food culture
  P18: "Fitness & Activity"      — Exercise, sports, staying active
  P19: "Nature & Outdoors"       — Mountains/beaches, parks

SOUL & MEANING
  P20: "Arts & Culture"          — Museums, music, theater
  P21: "Fun & Entertainment"     — Nightlife, events, hobbies
  P22: "Faith & Spirituality"    — Religious needs, spiritual community

CLOSING (Your Vision)
  P23: "Your Dream Day"          — Perfect day in your new city
  P24: "Anything Else"           — Dealbreakers, wild cards
```

### Gemini's Extraction Output
```typescript
interface GeminiExtraction {
  demographic_signals: { age, gender, household_size, ... };
  dnw_signals: string[];        // "hates humidity", "avoids instability"
  mh_signals: string[];         // "needs fast internet", "wants walkable"
  module_relevance: Record<string, number>;  // climate: 0.9, tech: 0.8
  budget_range: { min: number, max: number, currency: string };
  globe_region_preference: string;
  personality_profile: string;
  paragraph_summaries: { id: number, key_themes: string[] }[];
}
```

**CRITICAL**: Gemini is a narrative-to-data EXTRACTOR. It does NOT score cities or make recommendations. Its output feeds INTO the full evaluation pipeline.

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

## 8. THREE-LAYER WEIGHT SYSTEM

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

## 9. REPORT PIPELINE (5 Deliverables)

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

## 10. UI/UX SPECIFICATION

### Design Language
- **Theme**: Dark mode ONLY, glassmorphic (frosted glass with backdrop blur)
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

## 11. CURRENT PROJECT STATE (Phase 2 In Progress)

### What's Built
- ✅ Dashboard layout with Paragraphical button, Main Module expander, Module Grid
- ✅ 20 module cards with illumination states and animations
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
- ✅ React Router (`/` dashboard, `/paragraphical` essay flow)
- ✅ Paragraphical 24-paragraph stepped input UI with sidebar navigation
- ✅ 24 paragraph definitions with prompts, placeholders, section groupings
- ✅ Auto-save paragraphs to context (→ Supabase) on navigation
- ✅ Dashboard loading state during session hydration

### What's NOT Built Yet
- ❌ Gemini extraction endpoint (`/api/paragraphical`)
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

## 12. FILE STRUCTURE

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
    │   └── supabase.ts                 # Supabase client (env-gated)
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
    │       ├── Header.tsx              # Sticky glassmorphic header
    │       ├── OliviaBubble.tsx        # Bottom-right AI assistant (blue)
    │       └── EmiliaBubble.tsx        # Bottom-left help bubble (gray)
    │
    ├── data/
    │   └── modules.ts                  # 20 module definitions, types, map
    │
    └── styles/
        └── globals.css                 # Full CSS design system
```

---

## 13. CRITICAL RULES (DO NOT VIOLATE)

1. **Gemini is an EXTRACTOR, not an evaluator.** It reads the 24 paragraphs and outputs structured data. It does NOT score cities or make final recommendations.

2. **Every completion tier produces results.** Always output: countries → cities → towns → neighborhoods. The only difference is quantity, confidence, and AI depth.

3. **5 LLMs + Opus Judge** is the full evaluation pipeline. Never shortcut to fewer models for cost savings without user consent.

4. **Dark mode only.** No light mode toggle. The glassmorphic aesthetic IS the brand.

5. **LifeScore is the reference implementation.** Follow its patterns for API routes, LLM integration, batch splitting, error handling, and cost tracking.

6. **Reports were built first.** The app exists to feed data into the report pipeline. Report format, brand voice, and quality are non-negotiable. Study summer report files before changing report structure.

7. **Module order follows Human Existence Flow** (Survival → Soul), NOT alphabetical.

8. **DNWs are hard walls.** A severity-5 DNW instantly eliminates a city regardless of other scores.

9. **Three-layer weights.** Persona defaults → User overrides → Opus Judge overrides. All three layers must be maintained.

10. **Paragraph-to-metric linking.** Every recommendation should trace back to specific paragraphs (P3, P10, P14) for transparency.

11. **Progressive confidence nudges.** Every report shows "Next Steps" that encourage deeper funnel completion without forcing it.

12. **No over-engineering.** Build what's needed now. Don't add abstractions for hypothetical features.

13. **Batch splitting for large categories.** If a module has >12 metrics, split into parallel batches (LifeScore pattern).

14. **Cost tracking is mandatory.** Every LLM call must track tokens and cost in Supabase.

---

## 14. BUGS TO AVOID (from LifeScore lessons)

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

## 15. GEMINI DATA CONTRACT

### Input to Gemini
```typescript
interface ParagraphicalInput {
  paragraphs: {
    id: number;           // 1-24
    heading: string;      // "Who You Are"
    content: string;      // User's free-form text
  }[];
  globeRegion: string;    // "Southern Europe / Mediterranean"
  metadata: {
    timestamp: string;
    appVersion: string;
  };
}
```

### Output from Gemini
```typescript
interface GeminiExtraction {
  demographic_signals: {
    age?: number;
    gender?: string;
    household_size?: number;
    has_children?: boolean;
    has_pets?: boolean;
    employment_type?: string;
    income_bracket?: string;
  };
  dnw_signals: string[];          // Extracted deal-breakers
  mh_signals: string[];           // Extracted must-haves
  module_relevance: Record<string, number>;  // Module ID → 0-1 relevance
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };
  globe_region_preference: string;
  personality_profile: string;    // Behavioral/lifestyle summary
  paragraph_summaries: {
    id: number;
    key_themes: string[];
    extracted_preferences: string[];
  }[];
}
```

### What Gemini Extraction Enables
1. Pre-fills Demographics questionnaire (user confirms/corrects)
2. Suggests DNW severity levels ("Based on P4, political instability seems like a dealbreaker?")
3. Suggests MH importance levels ("Based on P11, fast internet seems Essential?")
4. Weights the 20 modules by relevance
5. Provides context to all 5 LLM evaluators when they score cities

---

## 16. NEXT STEPS (Phase 2 Planning)

Priority order for development:
1. **Paragraphical UI** - 24-paragraph input flow with globe region selector
2. **Gemini extraction endpoint** - `/api/paragraphical`
3. **Main Module questionnaire UI** - Demographics → DNW → MH → General flow
4. **Progressive tier calculator** - Determine tier from available data
5. **Evaluation pipeline** - 5 LLMs + Opus Judge, adapting to tier
6. **Results page** - Country → City → Town → Neighborhood display
7. **Report generation** - LLM raw report following summer playbook
8. **Supabase integration** - Auth, data persistence, cost tracking
9. **Stripe integration** - Subscription tiers
10. **Deliverables pipeline** - Gamma, Cristiano, Olivia, InVideo

---

*This file should be read by any AI assistant before starting work on the CLUES Main Module. It contains the complete architectural vision, technical decisions, and implementation patterns needed to build correctly.*
