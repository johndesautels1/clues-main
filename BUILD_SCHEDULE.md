# CLUES Intelligence — Master Build Schedule & Agent Architecture

> **PURPOSE**: This is the engineering roadmap for building CLUES Intelligence from current state to launch.
> Every AI agent MUST read this file to understand: what's built, what's next, build order dependencies,
> context management strategy, file splitting rules, and drift prevention protocols.
>
> **Author**: John Desautels, Founder + Claude Agent Architecture
> **Created**: 2026-03-08
> **Status**: ACTIVE — Updated each conversation

---

## 0. ARCHITECTURAL ASSESSMENT (2026-03-08, Claude Opus 4.6)

> **Context**: This assessment was produced during the conversation that created this build schedule.
> It captures why this architecture is defensible and where execution risk lives.
> Preserved at the founder's request as a permanent reference for future agents.

### What Makes This Architecture Genuinely Impressive

1. **The 5-LLM consensus + judge pattern is architecturally sound.** No single model can be trusted for life decisions. Using each model where it's strongest (Gemini for reasoning, Grok 4.1 Fast Reasoning for math, GPT-5.4 for facts, Sonar Reasoning Pro High for search, Sonnet 4.6 for structure) and having Opus arbitrate disagreements is a legitimate approach to reducing error — not just marketing.

2. **Forcing web search on every evaluating LLM is the right call.** Most AI products let models answer from training data and hope for the best. CLUES treats unsourced output as unacceptable. That's a hard engineering constraint but the right one.

3. **The adaptive questionnaire solves a real UX problem.** The insight that a 2,500-question library needs to feel like a 250-question experience — and that the cutoff should be accuracy-driven (2% MOE target), not count-driven — is correct. Most survey products just cut questions arbitrarily.

4. **The three-report structure maps to real user needs.** The raw math (Results Data Report) for scrutiny, the narrative (LLM Analysis Reports) for understanding, and the polished GAMMA for sharing and decision-making. Different audiences (the analytical user, the spouse, the financial advisor) each get what they need.

5. **The transparency promise is the real differentiator.** Showing the user *how* you arrived at every score — including where models disagreed and what the judge overrode — builds trust that no competitor can match with a black-box ranking.

### Where Execution Will Be Hard (Known Risks)

1. **Cost per report is significant** (~$22+ per evaluation cycle from LifeScore data, higher with variable metric counts and the country/town/neighborhood layers). The Stripe tier pricing has to absorb this.

2. **Opus Judge reviewing hundreds of divergent metrics per report is token-intensive.** The 30-metric prompt cap from LifeScore may need to expand or batch for CLUES Main's 100-250 metric range.

3. **The 2% MOE claim will need rigorous backtesting methodology** to be defensible — validated empirically through comparing recommendations against known-good outcomes, not through theoretical Bayesian proofs.

4. **Parallel batch firing across 5 LLMs × 23 categories** creates complex orchestration. Partial failures, timeouts, and rate limits will need robust retry and fallback logic. The LifeScore pattern (waves of 2 concurrent categories) is proven but will need scaling.

5. **The Paragraphical-to-metric conversion quality is the lynchpin.** If Gemini doesn't extract high-quality, researchable metrics from free-form narrative, everything downstream degrades. This is the single most important API call in the system.

---

## 1. CURRENT STATE INVENTORY (As of 2026-03-08)

### What EXISTS and WORKS

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| **Dashboard** | `Dashboard/` (18 files) | ~2,277 | Working — globe, module grid, hero, nav |
| **Paragraphical Flow** | `Discovery/` (11 files) + `Paragraphical/` (2 files) | ~3,263 | Working — 30-paragraph Olivia-guided input |
| **Question Library** | `Admin/QuestionLibrary.tsx` + `data/questionLibrary.ts` | ~15,244 | Working — 2,500 questions browsable, admin dashboard |
| **Auth System** | `Auth/` (3 files) + `context/AuthContext.tsx` | ~340+ | Working — Supabase auth, protected routes |
| **User Context** | `context/UserContext.tsx` | exists | Working — session state management |
| **Shared UI** | `Shared/` (18 files) | ~2,139 | Working — header, footer, legal modals, chat bubbles |
| **Results Shells** | `Results/` (6 files) | ~1,521 | Built but NOT wired — ReasoningTrace, SideBySide, FileUpload, ThinkingDetails |
| **API: Paragraphical** | `api/paragraphical.ts` | 598 | Built — Gemini 3.1 Pro Preview reasoning engine |
| **API: Olivia Chat** | `api/olivia-chat.ts` | 159 | Built — Olivia AI chat endpoint |
| **API: Upload** | `api/upload.ts` | 120 | Built — 100MB file upload for Gemini |
| **API: HeyGen** | `api/heygen-token.ts` | 52 | Built — token endpoint |
| **Lib: Tier Engine** | `lib/tierEngine.ts` | 263 | Built — subscription tier definitions |
| **Lib: Cost Tracking** | `lib/costTracking.ts` | 252 | Built — per-model cost rates |
| **Lib: Olivia Tutor** | `lib/oliviaTutor.ts` + hook | 313 | Built — Olivia guided tutoring |
| **Lib: Session** | `hooks/useSessionPersistence.ts` | 185 | Built — session persistence |
| **Data: Paragraphs** | `data/paragraphs.ts` | 574 | Complete — 30 paragraph definitions |
| **Data: Modules** | `data/modules.ts` | 260 | Complete — 23 module definitions |
| **Data: Paragraph Targets** | `data/paragraphTargets.ts` | 567 | Complete — extraction targets per paragraph |
| **Types** | `types/index.ts` | 317 | Partial — needs expansion for evaluation pipeline |
| **Supabase Schema** | `supabase/schema.sql` | ~1,012 | Complete — 20 tables, 2 views, RLS, indexes |
| **Styles** | 21 CSS files | ~6,365 | Working — dark glassmorphic, WCAG compliant |

### What DOES NOT EXIST Yet

| System | Description | Complexity |
|--------|-------------|------------|
| **Questionnaire Engine** | Render questions from library, collect answers, adaptive logic | MASSIVE |
| **Adaptive Skip Logic** | Bayesian-like system to skip/pre-fill based on prior answers | VERY HIGH |
| **Coverage Tracker** | Real-time dimensional coverage + MOE meter | HIGH |
| **Tavily Research Pipeline** | Metric → Tavily search → sourced data with URLs | HIGH |
| **5-LLM Parallel Evaluator** | Sonnet 4.6 + GPT-5.4 + Gemini + Grok 4.1 Fast Reasoning + Sonar Reasoning Pro High batch firing | VERY HIGH |
| **Opus Judge System** | Cristiano judge reviewing all LLM outputs, rendering verdicts | HIGH |
| **Smart Score Engine** | Metric normalization, category rollup, city comparison scoring | HIGH |
| **Report Data Pipeline** | Structured report data from evaluation results | HIGH |
| **Results Page** | Wire existing Results components + new ones into /results route | MEDIUM |
| **Gamma Report Generator** | Push report data to Gamma for 100+ page polished output | MEDIUM |
| **Cristiano Video Pipeline** | Simli quick verdict + HeyGen cinematic video | MEDIUM |
| **Stripe Integration** | Subscription tiers, payment flow, tier gating | MEDIUM |
| **Module Questionnaire UI** | 23 individual module question flows | HIGH |
| **Main Module Questionnaire** | Structured main questionnaire flow | HIGH |
| **Olivia Adaptive Guide** | AI-driven question routing, congratulations, guidance | HIGH |
| **Supabase: Evaluation Tables** | Store LLM outputs, judge verdicts, scores, sources | MEDIUM |
| **Supabase: Report Tables** | Store generated reports, Gamma links, video links | MEDIUM |
| **Light Mode Theme** | Full light mode CSS that meets WCAG against white backgrounds | MEDIUM |
| **Globe → Region Pipeline** | User's globe selection → region constraint for evaluation | LOW |
| **PDF/Print Report** | Exportable report for offline use | LOW |

---

## 2. BUILD PHASES (Ordered by Dependency)

### PHASE 1: DATA COLLECTION ENGINE (Conversations 1-8)
*Everything that collects user answers. Nothing can be evaluated until we can collect data.*

#### Conv 1-2: Questionnaire Renderer
- [ ] `src/components/Questionnaire/QuestionRenderer.tsx` — renders any question type (multiple-choice, slider, text, checkbox, ranked-list, matrix, conditional)
- [ ] `src/components/Questionnaire/QuestionCard.tsx` — individual question card UI
- [ ] `src/components/Questionnaire/ProgressBar.tsx` — section/module progress
- [ ] `src/components/Questionnaire/QuestionnaireShell.tsx` — layout wrapper with nav, progress, Olivia panel
- [ ] `src/hooks/useQuestionnaireState.ts` — answer state management, validation, persistence
- [ ] `src/types/questionnaire.ts` — response types, answer state, validation rules
- [ ] Wire `/questionnaire/:moduleId` route in App.tsx
- [ ] Supabase: `user_answers` table (user_id, question_id, module_id, answer_value, answered_at)

#### Conv 3-4: Main Module + Mini Module Flows
- [ ] `src/components/Questionnaire/MainModuleFlow.tsx` — main module entry with section navigation
- [ ] `src/components/Questionnaire/MiniModuleFlow.tsx` — individual mini module flow (receives moduleId)
- [ ] `src/components/Questionnaire/ModuleLauncher.tsx` — dashboard integration (launch from module grid)
- [ ] Connect `data/questionLibrary.ts` questions to renderer by moduleId
- [ ] Section-by-section navigation within modules
- [ ] Save/resume: partial completion persists to Supabase
- [ ] Wire Dashboard module cards → questionnaire routes

#### Conv 5-6: Adaptive Intelligence Layer
- [ ] `src/lib/adaptiveEngine.ts` — Bayesian-like coverage tracking
- [ ] `src/lib/coverageTracker.ts` — 23-dimension coverage state
- [x] `src/components/Questionnaire/CoverageMeter.tsx` — real-time MOE/coverage UI
- [x] `src/components/Questionnaire/SkipLogic.tsx` — pre-fill and skip display
- [x] Question prioritization: most information-gain questions surface first
- [x] Cross-module inference: answer in Paragraphical → pre-fill in module
- [x] Olivia integration: "You can skip this section — your paragraphs covered it"

#### Conv 7-8: Answer Aggregation + Quality
- [x] `src/lib/answerAggregator.ts` — merge Paragraphical + Main + Modules into unified user profile
- [x] `src/lib/qualityScorer.ts` — answer completeness and depth scoring
- [x] Dashboard: completion status per module (not started / in progress / complete)
- [x] Dashboard: overall readiness indicator (% toward report-ready)
- [x] Supabase: `user_profiles_computed` table (aggregated profile from all answers)
- [x] Green light trigger: Olivia congratulates when MOE target reached

### PHASE 2: EVALUATION PIPELINE (Conversations 9-16)
*The AI evaluation engine. Depends on Phase 1 data collection being functional.*

#### Conv 9-10: Tavily Research Pipeline
- [x] `api/tavily-research.ts` — Vercel serverless: baseline research per region
- [x] `api/tavily-search.ts` — Vercel serverless: metric-specific search per city
- [x] `src/lib/tavilyClient.ts` — client-side orchestrator (fires research + search calls)
- [x] `src/types/tavily.ts` — Tavily response types, source URL structures
- [x] Cache layer: 30-min TTL, max 50 entries, dedup across LLMs
- [x] Source URL extraction and validation
- [x] Supabase: `tavily_cache` table (query_hash, response, expires_at)

#### Conv 11-12: 5-LLM Parallel Evaluator
- [x] `api/evaluate-sonnet.ts` — Claude Sonnet 4.6 evaluation endpoint
- [x] `api/evaluate-gpt54.ts` — GPT-5.4 evaluation endpoint
- [x] `api/evaluate-gemini.ts` — Gemini evaluation (reuses existing pattern)
- [x] `api/evaluate-grok.ts` — Grok 4.1 Fast Reasoning evaluation endpoint (pre-existing)
- [x] `api/evaluate-perplexity.ts` — Sonar Reasoning Pro High evaluation endpoint
- [x] `api/gpt-realtime.ts` — GPT Realtime 1.5 endpoint (Olivia live voice/video interaction)
- [x] `src/lib/evaluationOrchestrator.ts` — parallel batch firing (waves of 2 categories)
- [x] `src/types/evaluation.ts` — per-LLM response types, MetricConsensus, batch results
- [x] Dynamic timeout: 120s + 5s per metric (max 300s)
- [x] Partial success handling: 3/5 LLMs responding = usable result
- [x] Supabase: `llm_evaluations` table (user_id, llm_model, category, metrics_json, created_at)

#### Conv 13-14: Opus Judge System
- [x] `api/judge-opus.ts` — Opus 4.6 judge endpoint
- [x] `src/lib/judgeOrchestrator.ts` — aggregates 5 LLM results → feeds Opus
- [x] `src/types/judge.ts` — JudgeReport type, verdict structure, override records
- [x] σ > 15 detection: flag high-disagreement metrics for judge review
- [x] Anti-hallucination safeguard: computed winner override if Opus contradicts math
- [x] Judge report storage: Supabase `judge_reports` table
- [x] Cost tracking integration for Opus calls

#### Conv 15-16: Smart Score Engine
- [x] `src/lib/smartScoreEngine.ts` — normalize raw scores → 0-100 Smart Scores
- [x] `src/lib/categoryRollup.ts` — metric → category → overall city scores
- [x] `src/lib/relativeScoring.ts` — cities scored relative to each other (not absolute)
- [x] `src/types/smartScore.ts` — CitySmartScore, CategorySmartScore types
- [x] Dual scoring (legal vs lived) for applicable metrics
- [x] Weight derivation from user persona + paragraph emphasis
- [x] Confidence levels from StdDev (unanimous/strong/moderate/split)
- [x] Winner determination with tie threshold (< 1 point)

### PHASE 3: RESULTS & REPORTS (Conversations 17-22)
*Displaying results and generating deliverables. Depends on Phase 2 evaluation working.*

#### Conv 17-18: Results Page Assembly
- [x] Wire existing Results components into `/results` route
- [x] `src/components/Results/ResultsDashboard.tsx` — main results page layout
- [x] `src/components/Results/WinnerHero.tsx` — full-width winner declaration
- [x] `src/components/Results/CategoryBreakdown.tsx` — collapsible category sections with score bars
- [x] `src/components/Results/MetricDetailTable.tsx` — per-metric scores, sources, confidence dots
- [x] `src/components/Results/EvidencePanel.tsx` — source citations with filter buttons
- [x] `src/components/Results/CityComparisonGrid.tsx` — side-by-side city scoring grid
- [x] `src/components/Results/TownNeighborhoodDrilldown.tsx` — town + neighborhood sections
- [x] Connect ReasoningTrace, SideBySideMetricView, ThinkingDetailsPanel

#### Conv 19-20: Cristiano Judge UI + Video
- [x] `src/components/Results/JudgeVerdict.tsx` — MI6 Briefing Room styled verdict display
- [x] `src/components/Results/CourtOrder.tsx` — per-category judicial analysis with real-world examples
- [x] `src/components/Results/SimliQuickVerdict.tsx` — real-time avatar narration
- [x] `api/cristiano-storyboard.ts` — Sonnet 4.6 generates 7-scene storyboard
- [x] `api/heygen-render.ts` — HeyGen Video Agent V2 cinematic render
- [x] Video polling + Supabase Storage save (`CristianoVideoPlayer.tsx`)
- [x] Cristiano avatar integration (wired into ResultsDashboard)

#### Conv 21-22: Report Generation
- [x] `src/lib/reportDataAssembler.ts` — assemble all evaluation data into report structure
- [x] `src/lib/gammaReportGenerator.ts` — push to Gamma API for 100+ page report
- [x] `src/components/Results/ReportDownload.tsx` — download/view Gamma report
- [x] `src/components/Results/ResultsDataPage.tsx` — evidence room with line-by-line metrics
- [x] Report versioning: re-evaluation produces new report version
- [x] PDF export fallback for offline use
- [x] Supabase: `reports` table (user_id, version, gamma_url, video_url, created_at)

### PHASE 4: MONETIZATION & POLISH (Conversations 23-28)
*Payments, tier gating, light mode, and production hardening.*

#### Conv 23-24: Stripe Integration
- [ ] `api/stripe-checkout.ts` — create checkout session
- [ ] `api/stripe-webhook.ts` — handle subscription events
- [ ] `src/components/Subscription/PricingPage.tsx` — tier comparison + purchase
- [ ] `src/components/Subscription/TierGate.tsx` — gate features by subscription tier
- [ ] `src/lib/stripeClient.ts` — client-side Stripe integration
- [ ] Tier-specific feature unlocks (Discovery → Navigator → Sovereign)
- [ ] Supabase: `subscriptions` table

#### Conv 25-26: Light Mode + WCAG Audit
- [ ] Full light mode CSS custom properties (swap per prefers-color-scheme or theme class)
- [ ] Verify every text color against #ffffff background
- [ ] Verify every glassmorphic overlay in light mode
- [ ] Focus indicators audit (2px solid, 3:1 ratio)
- [ ] Touch target audit (44×44 CSS pixels)
- [ ] Automated contrast ratio testing
- [ ] Print stylesheet for PDF report

#### Conv 27-28: Production Hardening
- [ ] Error boundaries around every major section
- [ ] Loading states for all async operations
- [ ] Offline detection + graceful degradation
- [ ] Rate limiting on API endpoints
- [ ] Cost ceiling per user per evaluation cycle
- [ ] Logging + monitoring (evaluation success rates, API latency)
- [ ] SEO: meta tags, OpenGraph, sitemap
- [ ] Performance: lazy loading, code splitting, bundle optimization

### PHASE 5: ADVANCED FEATURES (Conversations 29+)
*Post-launch enhancements.*

- [ ] Olivia video agent (walk user through report via video chat)
- [ ] Re-evaluation loop (complete more modules → re-judge → updated report)
- [ ] Historical comparison (how rankings changed over time)
- [ ] User dashboard (saved reports, subscription management, profile)
- [ ] Multi-language support
- [ ] Mobile responsive optimization
- [ ] A/B testing framework for question ordering
- [ ] Admin dashboard (user analytics, evaluation metrics, cost tracking)

---

## 3. CONVERSATION CAPACITY PLANNING

### What One Conversation Can Build

Based on the Claude Code context window and compression behavior:

| Conversation Type | Usable Tokens | Effective Work Capacity |
|-------------------|---------------|------------------------|
| **Fresh conversation** | ~180K tokens | 3-5 new components + wiring + tests |
| **After 1 compression** | ~140K tokens | 2-4 components (reduced context) |
| **After 2 compressions** | ~100K tokens | 1-3 components (significant context loss) |
| **Danger zone** | < 80K tokens | Start a NEW conversation |

### Rules for Each Conversation

1. **Start**: Read CLAUDE.md → CLUES_MISSION.md → this file → PARAGRAPHICAL_ARCHITECTURE.md
2. **Identify**: Which Phase/Conv block you're building
3. **Build**: Write code, commit after each component
4. **Update**: Mark completed items in this file's checklists
5. **Before ending**: Update `LAST COMPLETED` section at bottom of this file
6. **Commit this file**: Every conversation must commit an updated BUILD_SCHEDULE.md

### When to Start a New Conversation

- After 2 compressions (context quality degrades significantly)
- When switching between Phases (different mental model required)
- When the agent is confused about what's already built vs what isn't
- After every 4-6 committed components (natural checkpoint)
- When file edits start conflicting with compressed-away context

---

## 4. CONTEXT PRESERVATION STRATEGY

### The Handoff Problem

Each new conversation starts with zero memory. The agent must reconstruct full understanding from files alone. This is why the mandatory read list exists.

### Mandatory Read List (In Order)

Every new agent reads these FIRST, before touching any code:

1. **`CLAUDE.md`** — WCAG rules, data integrity rules, development rules
2. **`CLUES_MISSION.md`** — WHY everything exists, the product vision
3. **`BUILD_SCHEDULE.md`** (this file) — WHAT to build next, in what order
4. **`PARAGRAPHICAL_ARCHITECTURE.md`** — Gemini pipeline, metrics, Smart Scores, judge system

### What NOT to Read Every Time

- `CLUES_MAIN_BUILD_REFERENCE.md` — Superseded by BUILD_SCHEDULE.md + PARAGRAPHICAL_ARCHITECTURE.md for build state. Only read if working on specific legacy component details.
- `docs/*.md` — Question reference docs. Only read when building the questionnaire renderer for a specific module.
- `CODEBASE_AUDIT_TABLE.md` — One-time migration audit. Archived.

### Context Size Budget

| File | Bytes | Read Every Conv? |
|------|-------|-----------------|
| CLAUDE.md | 6.1 KB | YES |
| CLUES_MISSION.md | 17.1 KB | YES |
| BUILD_SCHEDULE.md | ~25 KB | YES |
| PARAGRAPHICAL_ARCHITECTURE.md | 35.2 KB | YES (skim sections relevant to current phase) |
| **Total mandatory context** | **~83 KB** | **~20K tokens** |

This leaves ~160K tokens for actual work in a fresh conversation. Acceptable.

### Per-Conversation Context Log

At the END of every conversation, the agent updates the `LAST COMPLETED` section (Section 8 below). This is the single most important handoff mechanism. It tells the next agent exactly what was done and what to do next.

---

## 5. FILE SPLITTING STRATEGY

### The Bloat Problem

Large files cause three problems:
1. They consume disproportionate context window when read
2. They increase risk of merge conflicts between conversations
3. They make it harder for agents to find specific code

### Current Bloat Alert

| File | Lines | Action Required |
|------|-------|-----------------|
| `data/questionLibrary.ts` | 14,415 | **SPLIT NOW** — see plan below |
| `components/Admin/QuestionLibrary.tsx` | 829 | OK for now, split at 1,200 |
| `components/Discovery/DiscoveryFlow.tsx` | 808 | OK for now, split at 1,200 |
| `api/paragraphical.ts` | 598 | OK |

### Splitting Rules

| Threshold | Action |
|-----------|--------|
| **> 800 lines** (component) | Split into sub-components |
| **> 500 lines** (lib/util) | Split by responsibility |
| **> 400 lines** (API endpoint) | Extract shared utils |
| **> 2,000 lines** (data file) | Split by category/module |
| **> 300 lines** (types file) | Split by domain (questionnaire.ts, evaluation.ts, report.ts) |

### questionLibrary.ts Split Plan (14,415 lines → 26 files)

```
src/data/questionLibrary.ts (14,415 lines)
    ↓ SPLIT INTO:
src/data/questions/index.ts              — re-exports everything, maintains backward compat
src/data/questions/types.ts              — shared question types
src/data/questions/main_module.ts        — Main Module questions
src/data/questions/safety_security.ts    — Module 1 questions
src/data/questions/health_wellness.ts    — Module 2 questions
src/data/questions/climate_weather.ts    — Module 3 questions
... (one file per module, 23 mini module files + general_questions.ts + tradeoff_questions.ts + meta.ts)
```

**When to split**: First conversation that touches the questionnaire renderer (Conv 1-2 of Phase 1).

### Component Splitting Patterns

When a component exceeds 800 lines, extract:
- **Sub-components**: Visual sections become their own files
- **Hooks**: State logic moves to `useComponentName.ts`
- **Utils**: Pure functions move to `lib/componentNameUtils.ts`
- **Types**: Component-specific types move to a local `types.ts`

Example:
```
DiscoveryFlow.tsx (808 lines)
    ↓ IF it grows past 1,200:
DiscoveryFlow.tsx        — orchestrator, routing between sections
DiscoverySection.tsx     — individual section renderer
DiscoveryControls.tsx    — navigation buttons, progress
useDiscoveryState.ts     — state management hook
```

### New File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase.tsx | `QuestionRenderer.tsx` |
| Hook | use + PascalCase.ts | `useQuestionnaireState.ts` |
| Lib/util | camelCase.ts | `adaptiveEngine.ts` |
| Types | camelCase.ts | `evaluation.ts` |
| Data | camelCase.ts | `climateWeatherQ.ts` |
| API endpoint | kebab-case.ts | `evaluate-sonnet.ts` |
| CSS | PascalCase.css (matches component) | `QuestionRenderer.css` |

---

## 6. CODE DRIFT PREVENTION

### What Causes Drift

1. **Stale documentation**: Agent reads old README, builds to outdated spec
2. **Compressed context**: Agent forgets what was built 3 compressions ago
3. **Parallel conversations**: Two agents modify the same file with different assumptions
4. **Spec evolution**: Product decisions change but docs aren't updated
5. **Copy-paste from old patterns**: Agent replicates a pattern that was superseded

### Anti-Drift Protocols

#### Protocol 1: Single Source of Truth per Domain

| Domain | Source of Truth | NOT a source of truth |
|--------|----------------|----------------------|
| What to build next | `BUILD_SCHEDULE.md` (this file) | Any other MD file's "TODO" section |
| Product vision | `CLUES_MISSION.md` | README.md, old specs |
| Paragraphical pipeline | `PARAGRAPHICAL_ARCHITECTURE.md` | CLUES_MAIN_BUILD_REFERENCE.md Section 5-7 |
| WCAG rules | `CLAUDE.md` | Any inline comments |
| 23 module definitions | `src/data/modules.ts` | Any hardcoded module lists |
| 30 paragraph definitions | `src/data/paragraphs.ts` | Any hardcoded paragraph arrays |
| 2,500 questions | `src/data/questionLibrary.ts` | docs/*.md (those are reference only) |
| Type definitions | `src/types/*.ts` | Inline type assertions |

#### Protocol 2: Grep Before You Build

Before creating ANY new file or type:
```bash
# Does this type already exist?
grep -r "interface MetricScore" --include="*.ts" --include="*.tsx"

# Does this component already exist?
find src -name "*QuestionRenderer*"

# Is this module ID already defined?
grep -r "safety_security" --include="*.ts"
```

If it exists, USE IT. Don't create a duplicate.

#### Protocol 3: Import from Canonical Sources

```typescript
// CORRECT — import from canonical data source
import { CATEGORY_MODULES } from '@/data/modules';
import { PARAGRAPH_DEFS } from '@/data/paragraphs';

// WRONG — hardcoded module list
const modules = ['safety_security', 'health_wellness', ...];
```

#### Protocol 4: No Dead Code

- Delete what you replace. Don't comment it out.
- Don't add `// TODO: remove this` — just remove it.
- Don't add backward-compat shims. Change the callers.
- Don't rename unused variables with `_` prefix. Delete them.

#### Protocol 5: Commit Messages as Changelog

Every commit message should be precise enough that a future agent can reconstruct the build history:
```
✅ GOOD: "Add QuestionRenderer component with support for 7 response types"
✅ GOOD: "Wire /questionnaire/:moduleId route, connect to questionLibrary data"
❌ BAD:  "Update components"
❌ BAD:  "Fix stuff"
❌ BAD:  "WIP"
```

#### Protocol 6: No Speculative Architecture

Don't build abstractions for hypothetical future needs:
- Don't add plugin systems
- Don't add feature flags (unless Stripe tier gating)
- Don't add configuration layers "in case we need them later"
- Build exactly what the current Phase/Conv block requires

---

## 7. STALE FILE MANAGEMENT

### Files Archived (Moved to `docs/archive/`)

| File | Why Archived | Date |
|------|-------------|------|
| `CODEBASE_AUDIT_TABLE.md` | One-time migration audit (20→23 modules, 27→30 paragraphs). Migration complete. Future agents should NOT read this — it describes a completed migration, not current state. | 2026-03-08 |

### Files That Remain (With Caveats)

| File | Status | Caveat |
|------|--------|--------|
| `README.md` | **NEEDS UPDATE** — currently 46KB, contains mix of accurate and outdated info | Should be trimmed to <10KB: tech stack, setup instructions, deployment. NOT a spec doc. |
| `CLUES_MAIN_BUILD_REFERENCE.md` | **PARTIALLY SUPERSEDED** — 58KB, much of it duplicated in PARAGRAPHICAL_ARCHITECTURE.md and this file | Keep as deep reference for LifeScore patterns and tier engine details. Remove build state tracking (that's now in BUILD_SCHEDULE.md). |
| `docs/*.md` (27 files) | **REFERENCE ONLY** — question definition docs for each module | These are the raw question reference material. They are NOT read by agents unless building that specific module's questionnaire. They should never be imported into code — `questionLibrary.ts` is the canonical source. |

### README.md Rewrite Plan

The current README.md is 46KB — far too large and contains outdated build state information. It should be rewritten to contain ONLY:

1. **One-paragraph project description**
2. **Tech stack table** (keep current — it's accurate)
3. **The 23 Category System** (keep current — it's accurate)
4. **Setup instructions** (npm install, env vars, dev server)
5. **Deployment** (Vercel config)
6. **File structure overview** (directory tree, not prose)
7. **Links to other docs** (CLUES_MISSION.md, BUILD_SCHEDULE.md, etc.)

Target: < 10KB. Everything else lives in specialized docs.

---

## 8. LAST COMPLETED (Agent Handoff Log)

> **CRITICAL**: Every conversation MUST update this section before ending.
> This is how the next agent knows exactly where to pick up.

### Latest Update: 2026-03-14 — Session 18 (Dashboard Styling + Header Redesign)

**What was done this conversation (7 commits on `claude/review-clues-main-T1fSq`):**

1. **Uniform dash-card sizing** (`DashboardCard.css`) — All 5 dashboard cards (Journey, Paragraphical, Main Module, Coverage, Readiness) now share `width: 100%`, `padding: 28px`, `min-height: 180px`, `box-sizing: border-box`. Removed conflicting padding from ParagraphicalButton, JourneyGuide, MainModuleExpander, ReadinessIndicator, CoverageMeter.

2. **Header redesigned as two-row layout** (`Header.tsx`, `Header.css`) — Row 1: Brand left, statement center, actions right. Row 2: 5D toolbar buttons centered. Removed emoji icons from toolbar buttons (text-only). Buttons have sapphire gradient active state, hover lift, shimmer animation. No horizontal overflow.

3. **Brand statement** — Tagline reads: "The World's Most Advanced AI-Powered Predictive Relocation Intelligence Platform" — uppercase, weight 700, sapphire-to-gold gradient text with shimmer animation.

4. **CoverageMeter moved** — Relocated from between MainModule/Readiness to directly below the Exploration Modules grid in `Dashboard.tsx`.

5. **ModuleButton.css reverted** — Attempted 5D deep-blue treatment on 23 module grid cards but it caused the screen to appear solid blue after test persona injection. Reverted to original 4D glassmorphic treatment with `glass` class.

**CRITICAL BUG — NEXT SESSION MUST FIX:**
- **When clicking "Inject Test Persona", the screen goes blank/solid blue.** The dashboard is fully visible before injection. After clicking the button, everything goes blue. This is NOT a ModuleButton.css issue (that was reverted). The problem is in the **persona injection process itself** — likely in the `LOAD_SESSION` dispatch cascade or the re-render triggered by `startTransition` in `handleInjectTestPersona` (`Dashboard.tsx:127-137`).
- Key files to investigate:
  - `src/components/Dashboard/Dashboard.tsx` lines 127-137 (injection handler)
  - `src/context/UserContext.tsx` lines 215-231 (`LOAD_SESSION` reducer)
  - `src/data/testPersona.ts` — `buildTestPersonaSession()` and `injectTestModuleAnswers()`
  - Check if the massive state update (30 paragraphs + 200 main Qs + 23×100 module Qs) causes React to render an intermediate blank state
  - Check if `startTransition` is hiding the UI during the heavy update

**What's next (in order):**
1. **Fix the test persona injection blank screen bug** (above)
2. Make 23 module grid cards visually match the dash-card 5D treatment WITHOUT causing the blue screen
3. Wire up Stripe integration (Conv 23-24)
4. Light mode verification pass
5. Production hardening

---

### Previous sessions (10-17) archived — see git history for details.
### Key context from previous sessions that still matters:

**Open bugs/TODOs carried forward:**

| Priority | Issue | File(s) | Status |
|----------|-------|---------|--------|
| **MODERATE** | 5 unused exports in bridge | `profileSignalBridge.ts` | Open — low priority cleanup |
| **MODERATE** | `ALL_RECOMMENDERS` unused | `cityRecommendationOrchestrator.ts:87` | Open — dead export |
| **MODERATE** | ~200 lines duplicated across endpoints | `api/recommend-*.ts` | **WILL NOT FIX** — founder rejected extraction |
| **LOW** | `smartScoreEngine.ts:237` | `smartScoreEngine.ts` | Open — TODO: source citation aggregation |
| **LOW** | `oliviaTutor.ts:81` | `oliviaTutor.ts` | Open — TODO: build `/api/olivia-tutor` endpoint |
| **LOW** | 3 hardcoded "USD" strings | questions data | Open — currency should be dynamic |
| **FUTURE** | `/api/gamma-report` endpoint | Not yet created | Needed for Gamma API integration |
| **FUTURE** | `/api/report-pdf` endpoint | Not yet created | Needed for PDF fallback |

**Founder decisions to respect:**
- Step D rejected — do NOT extract `api/_shared/recommend-utils.ts`
- `relativeScoring.ts` had unused imports removed (Session 12 Commit 4) — re-add when needed
- `process.env` → `import.meta.env` migration done on evaluationOrchestrator.ts and judgeOrchestrator.ts

### End of handoff log. Previous session details in git history (Sessions 10-17, 2026-03-09 to 2026-03-14).
