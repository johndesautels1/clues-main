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
- [ ] Wire existing Results components into `/results` route
- [ ] `src/components/Results/ResultsDashboard.tsx` — main results page layout
- [ ] `src/components/Results/WinnerHero.tsx` — full-width winner declaration
- [ ] `src/components/Results/CategoryBreakdown.tsx` — collapsible category sections with score bars
- [ ] `src/components/Results/MetricDetailTable.tsx` — per-metric scores, sources, confidence dots
- [ ] `src/components/Results/EvidencePanel.tsx` — source citations with filter buttons
- [ ] `src/components/Results/CityComparisonGrid.tsx` — side-by-side city scoring grid
- [ ] `src/components/Results/TownNeighborhoodDrilldown.tsx` — town + neighborhood sections
- [ ] Connect ReasoningTrace, SideBySideMetricView, ThinkingDetailsPanel

#### Conv 19-20: Cristiano Judge UI + Video
- [ ] `src/components/Results/JudgeVerdict.tsx` — MI6 Briefing Room styled verdict display
- [ ] `src/components/Results/CourtOrder.tsx` — per-category judicial analysis with real-world examples
- [ ] `src/components/Results/SimliQuickVerdict.tsx` — real-time avatar narration
- [ ] `api/cristiano-storyboard.ts` — Sonnet 4.6 generates 7-scene storyboard
- [ ] `api/heygen-render.ts` — HeyGen Video Agent V2 cinematic render
- [ ] Video polling + Supabase Storage save
- [ ] Cristiano avatar integration

#### Conv 21-22: Report Generation
- [ ] `src/lib/reportDataAssembler.ts` — assemble all evaluation data into report structure
- [ ] `src/lib/gammaReportGenerator.ts` — push to Gamma API for 100+ page report
- [ ] `src/components/Results/ReportDownload.tsx` — download/view Gamma report
- [ ] Report versioning: re-evaluation produces new report version
- [ ] PDF export fallback for offline use
- [ ] Supabase: `reports` table (user_id, version, gamma_url, video_url, created_at)

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

### Latest Update: 2026-03-09 — Session 11 (Phase 1 Audit Fix Pass — COMPLETE)

**What was done this conversation:**
- **Full 116-issue audit chart committed to README.md** (Conv 1-8, all severity levels documented).
- **P0 Data Corruption Fixes:**
  - `adaptiveEngine.ts`: EIG recalculation now includes `module.moduleWeight` (was dropping it, breaking cross-module prioritization). Added `moduleWeight` field to `ModuleAdaptiveState`. Replaced recursive `selectNextQuestion` with iterative loop. Fixed stale model name comments. Renamed misleading `getQuestionByBelief` → `getQuestionByModuleAndNumber`.
  - `coverageTracker.ts`: Guarded division-by-zero in `applyCoverageFromMiniModule` (totalQuestions=0 → early return). Fixed `addOrUpdateSource` averaging bug (naive avg → weighted running avg). Clamped `estimatedQuestionsToResolve` to `Math.max(1, ...)`.
- **P1 WCAG Light Mode (systemic):**
  - `globals.css`: Added `@media (prefers-color-scheme: light)` block with WCAG-verified text colors (#111827 15.4:1, #4b5563 7.4:1, #6b7280 5.0:1, #2563eb 5.3:1), surface vars, score color overrides (darkened --score-green, --clues-gold etc. for 4.5:1 on white).
  - `questionnaireData.ts`, `discoveryData.ts`, `ReadinessIndicator.tsx`: All `C` token objects converted from hardcoded hex to `var(--text-primary)` etc.
  - `CoverageMeter.tsx`: Hardcoded dark `rgba(17,24,39,*)` backgrounds → `var(--bg-glass)` / `var(--bg-card)`.
  - `OliviaChoiceModal.tsx`, `HeyGenVideoModal.tsx`, `main.tsx`: Dark gradient/colors → CSS variables.
  - `LoginPage.tsx`: GitHub SVG `fill="#f9fafb"` → `fill="currentColor"`.
- **P2 API Resilience:**
  - `evaluate-gemini.ts`: Added retry loop (3x exponential backoff: 1s, 2s, 4s) on 429/5xx.
  - `judge-opus.ts`: Added 120s AbortController timeout.
- **False Positives Documented:** Issues #1-4 (supabase already uses import.meta.env, auth already unsubscribes), #53 (uses process.env), #59 (validates required fields).
- **tsc: 0 errors** after all changes.

**What's next**: Conv 17-18 — Results Page Assembly (ResultsDashboard, WinnerHero, CategoryBreakdown, MetricDetailTable, EvidencePanel, CityComparisonGrid, TownNeighborhoodDrilldown). Wire existing Results components into /results route.

### Previous Update: 2026-03-09 — Session 10 (Conv 15-16 — Smart Score Engine — COMPLETE)

**What was done this conversation:**
- **Conv 15-16: Smart Score Engine** — ALL 8 checklist items completed. 4 new files, ~1,172 lines total.

**src/types/smartScore.ts** (~290 lines):
- `MetricSmartScore`: per-metric per-location score with judge override tracking, dual score, confidence, sources
- `CategorySmartScore`: per-category weighted average with metric breakdown, judge analysis
- `CitySmartScore`: overall city score with category rollup, rank, judge trend
- `DualScore`: legal vs enforcement scoring with combined/conservative modes
- `WinnerDetermination`: rankings, tie detection, advantage category analysis
- `CategoryWeights`: weight derivation tracking (default/persona/paragraph_emphasis)
- `SmartScoreInput`/`SmartScoreOutput`: full pipeline I/O types
- `ConfidenceLevel` type + `CONFIDENCE_THRESHOLDS` constants (§15.5)
- Tie thresholds: `CITY_TIE_THRESHOLD = 1`, `CATEGORY_TIE_THRESHOLD = 2` (§15.4)
- 6 `PersonaPreset` definitions: Balanced, Digital Nomad, Entrepreneur, Family, Retiree, Investor

**src/lib/smartScoreEngine.ts** (~260 lines):
- `getConfidenceLevel()`: σ < 5 → unanimous, < 12 → strong, < 20 → moderate, ≥ 20 → split
- `clampScore()`, `normalizeNumeric()`, `normalizeBoolean()`: raw → 0-100 normalization
- `isDualScoreMetric()`: categories where legal vs lived distinction applies (safety, legal, social values, sexual beliefs, religion)
- `computeDualScore()`: combined = (legal × legalWeight) + (enforcement × enforcementWeight), conservative = MIN(legal, enforcement)
- `computeMetricSmartScore()`: consensus + judge override → final MetricSmartScore
- `computeAllMetricSmartScores()`: main entry point — OrchestrationResult + JudgeReport → Map<location, MetricSmartScore[]>
- Utility: `mean()`, `median()`, `stdDev()`

**src/lib/categoryRollup.ts** (~220 lines):
- `deriveCategoryWeights()`: equal base (1/23) → persona preset multipliers → paragraph emphasis → normalize to sum 1.0
- `rollupToCategories()`: group metrics by category, weighted average (excludes score -1 missing data), aggregate confidence
- `rollupToCity()`: weighted sum of category scores → overall 0-100, judge trend from summaryOfFindings
- `computeCityScore()`: full pipeline for one city (metrics → categories → city)

**src/lib/relativeScoring.ts** (~190 lines):
- `applyRelativeScoring()`: per-metric linear interpolation across peer cities (best=100, worst=0, equal=50)
- `determineWinner()`: rank cities, detect ties (< 1pt city, < 2pt category), identify advantage/tied categories
- `computeSmartScores()`: THE main entry point tying all 3 engines: consensus→smartScores→relativeScoring→rollup→winner

**Build status**: tsc 0 errors. **Phase 2 (Evaluation Pipeline) is now COMPLETE** — all Conv 9-16 items done.

- **What's next**: Conv 17-18 — Results Page Assembly (ResultsDashboard, WinnerHero, CategoryBreakdown, MetricDetailTable, EvidencePanel, CityComparisonGrid, TownNeighborhoodDrilldown). Wire existing Results components into /results route.

### Previous Update: 2026-03-09 — Session 9 (Full Codebase Audit — Conv 7-16 — COMPLETE)

**What was done this conversation:**
- **Full retroactive audit of ALL code from Conv 7-16** — 5 commits, ~35 bugs fixed across ~15 files.
- **Audit approach**: Deep subagent audits on every file from each conversation group, prioritized by severity, verified with `tsc -b && vite build` after each round.

**Conv 15-16 audit fixes (commit 1):**
- `evaluationOrchestrator.ts`: Fixed `process.env` → `import.meta.env` (build error), replaced raw Supabase fetch with shared client, CRITICAL stdDev fix (was flattening across cities causing false judge triggers → now per-location max), NaN guard on costUsd
- `judgeOrchestrator.ts`: Fixed `process.env` → `import.meta.env`, shared Supabase client, fixed `safeguard_triggered` hardcoded false, fixed silent catch, winner override string normalization, `metrics_overridden` uses allOverrides.length, typed Opus response
- `src/types/judge.ts`: Removed unused `MetricConsensus` import

**Conv 13-14 audit fixes (commit 2):**
- `api/judge-opus.ts`: Increased max_tokens 16384→32768, added stop_reason truncation warning, imported shared `JudgeOpusRequest` type, added `trustedModel` validation, removed error detail leak
- All 5 evaluate endpoints: Added finish_reason truncation warnings, removed error detail leaks, added `Array.isArray(body.tavilyResearch)` guard
- `api/evaluate-perplexity.ts`: Added `<think>` tag stripping for reasoning model
- `api/evaluate-grok.ts`: Replaced 60 lines duplicated types with shared imports
- `api/evaluate-gemini.ts`: Added `finishReason === 'SAFETY'` check
- `api/gpt-realtime.ts`: Added token validation, removed error detail leak

**Conv 11-12 audit fixes (commit 3):**
- `evaluationOrchestrator.ts`: Additional shared Supabase integration fixes
- All evaluate endpoints: Consistent error handling patterns

**Conv 9-10 audit fixes (commit 4):**
- `api/tavily-search.ts`: CRITICAL cache column fix (`query` → `query_text`, removed non-existent `city`/`metric_id` columns), added `result_count`/`source_urls`, added `Prefer: resolution=merge-duplicates` for upsert
- `api/tavily-research.ts`: Same cache column fix, fixed .gov/.edu detection from substring to anchored regex (was matching `governance.com` as `.gov`), removed error detail leak
- `src/lib/tavilyClient.ts`: Fixed searchMetrics memory cache check, fixed clearCache not clearing inflightRequests
- `src/types/tavily.ts`: Aligned TavilyCacheEntry with actual schema.sql columns

**Conv 7-8 audit fixes (commit 5):**
- `src/lib/qualityScorer.ts`: Hardcoded `23` → `MODULE_COUNT` (= MODULES.length = 24), clamped `moeCoverage` and `overallReadiness` to 0-100 range
- `src/components/Dashboard/ReadinessIndicator.tsx`: Added light-mode WCAG-compliant color variants (4.5:1+ contrast against white)
- `src/components/Questionnaire/MiniModuleFlow.tsx`: Fixed `fontSize: 10` → `11` (below WCAG 11px minimum)
- `src/hooks/useAggregatedProfile.ts`: Added `paragraphs.length` to useMemo deps, added console.warn to catch block
- `src/lib/answerAggregator.ts`: Null guard on `extraction.metrics`

**Build status**: tsc 0 errors, Vite 0 errors, 669 modules transformed after all fixes.
**All Conv 7-16 code is now audited and clean.**

### Previous Update: 2026-03-09 — Session 8 (Conv 13-14 — Opus Judge System — COMPLETE)

**What was done this conversation:**
- Built Conv 13-14: Opus Judge System (all items). See commit history for details.
- **Conv 13-14 is now COMPLETE.**

### Previous Update: 2026-03-09 — Session 8 (Conv 11-12 — 5-LLM Parallel Evaluator — COMPLETE)

**What was done this conversation:**
- **Conv 11-12: 5-LLM Parallel Evaluator** (ALL items):
  - **src/types/evaluation.ts** (~175 lines): Shared types for entire evaluation pipeline. EvaluationMetric, CityCandidate, TavilyResult (shared request types). MetricScore, CityEvaluation, LLMEvaluationResponse, EvaluationMetadata, EvaluateResponse (shared response types). EvaluatorModel union, EvaluatorResult, CategoryBatchResult with isUsable flag (≥3/5 LLMs). MetricConsensus with mean/median/stdDev per metric per location, confidenceLevel (unanimous/strong/moderate/split), needsJudgeReview (σ>15). LocationConsensus, EvaluationWave, OrchestrationResult, LLMEvaluationRow (Supabase shape).
  - **api/evaluate-sonnet.ts** (~230 lines): Claude Sonnet 4.6 via Anthropic Messages API. anthropic-version header, text block extraction, input_tokens/output_tokens from usage. $3.00/$15.00 per 1M. Strengths: structured scoring, qualitative nuance.
  - **api/evaluate-gpt54.ts** (~230 lines): GPT-5.4 via OpenAI Chat Completions API. response_format: json_object, reasoning_tokens extraction. $5.00/$20.00 per 1M. Strengths: factual knowledge, edge case detection.
  - **api/evaluate-gemini.ts** (~240 lines): Gemini 3.1 Pro Preview via generateContent API. google_search tool, responseMimeType: application/json, usageMetadata extraction. $1.25/$10.00 per 1M. Strengths: inferential reasoning, Google Search grounding.
  - **api/evaluate-perplexity.ts** (~230 lines): Perplexity Sonar Reasoning Pro High via OpenAI-compatible API. Native web search, URL citation emphasis. $1.00/$1.00 per 1M. Strengths: best native search, fact-checking.
  - **api/evaluate-grok.ts**: Already existed from previous session. Grok 4.1 Fast Reasoning via xAI API. $0.20/$0.50 per 1M. Verified compatible with shared types.
  - **api/gpt-realtime.ts** (~160 lines): GPT Realtime 1.5 ephemeral session token endpoint. Creates WebRTC session via OpenAI Realtime Sessions API. Voice presets, Olivia persona instructions, server VAD turn detection. Returns ephemeral token (60s expiry) + realtimeSessionId. Session creation free; audio tokens billed separately.
  - **src/lib/evaluationOrchestrator.ts** (~280 lines): Full parallel batch firing system. CATEGORY_WAVES: 13 waves of 1-2 categories ordered by tier (Survival→Identity). runEvaluation() accepts metricsByCategory + cities + tavilyByMetric. Per-wave: fires all categories in parallel, each category → 5 LLMs via Promise.all with AbortController timeout. Dynamic timeout: 120s + 5s per metric (max 300s). MIN_USABLE_LLMS = 3. Consensus builder: mean/median/stdDev per metric per location. σ > 15 → needsJudgeReview. confidenceLevel thresholds: ≤5 unanimous, ≤10 strong, ≤15 moderate, >15 split. Inter-wave 1s delay. persistEvaluationResults() writes to Supabase llm_evaluations table. onWaveComplete callback for UI progress.
  - All 5 evaluation endpoints follow identical pattern: POST, validation, prompt construction, API call, JSON parse with fallback cleanup, field validation, token/cost tracking, metadata response.
  - Build verified: tsc 0 errors, Vite 0 errors, 669 modules transformed.
  - **Conv 11-12 is now COMPLETE.**
- **Also done**: Audited Conv 7-8 files (answerAggregator, qualityScorer, useAggregatedProfile, ReadinessIndicator, green light trigger) — all clean, no bugs.
- **What's next**: Conv 13-14 — Opus Judge System (api/judge-opus.ts, src/lib/judgeOrchestrator.ts, src/types/judge.ts, σ>15 detection, anti-hallucination safeguard, judge_reports table).

### Previous Update: 2026-03-09 — Session 7 (Conv 7-8 Answer Aggregation — PHASE 1 COMPLETE)

**What was done this conversation:**
- **Conv 7-8: Answer Aggregation + Quality** (ALL 6 items):
  - **answerAggregator.ts** (~350 lines): Merges all 7 data sources into unified `AggregatedProfile`. Per-source extractors: Paragraphical (metrics + module_relevance + dnw/mh signals → module keyword matching), Demographics (rule-based field→module mapping + baseline), DNW (severity → modules via question `.modules[]` lookup), MH (importance → modules), Tradeoffs (slider strength → modules), General (normalized → modules), Mini Modules (localStorage → per-module signals). All values normalized 0-1 with confidence weights. Module-level aggregation with source breakdown.
  - **qualityScorer.ts** (~250 lines): Weighted readiness formula: 40% source completeness (X/7 sources) + 30% average module depth (signal count × source diversity × coverage signal) + 20% MOE-based coverage + 10% completed module bonus. Per-module quality: empty/sparse/adequate/good/excellent. Gap detection: weight > 0.03 and status ≤ sparse. Next steps generator: missing sources (highest impact, Paragraphical=15), gap modules (5 impact), low-depth polish (3 impact), sorted by impact with priority ranks.
  - **useAggregatedProfile.ts** (~130 lines): Reactive hook composing aggregateProfile + scoreQuality. Memoized on session answer changes. Auto-persists to Supabase `user_profiles_computed` table via upsert (3s debounce, fingerprint dedup). Returns readiness, quality, profile, activeSourceCount, totalSignals, hasData.
  - **ReadinessIndicator.tsx + CSS** (~230 lines): Dashboard widget. Readiness % with animated progress bar, source/module/signal/gap counts, top 3 next steps with priority badges and impact estimates, celebration state at ≥80%. WCAG verified: all text ≥11px, C.textPrimary (18.4:1), C.textAccent (7.6:1), C.textMuted (6.4:1), C.scoreGreen (8.5:1), C.gold (9.0:1). Light mode @media query. Color never sole indicator.
  - **Dashboard.tsx**: ReadinessIndicator wired between CoverageMeter (400ms) and ModuleGrid (550ms) at 450ms stagger. Module status (not_started/in_progress/completed/recommended) already existed via enrichedModules.
  - **MiniModuleFlow.tsx green light trigger**: Toast celebration when coverage.isReportReady becomes true during active answering. useRef prevents duplicate. Duration 8s, sparkle icon.
  - **Supabase**: user_profiles_computed table upsert with session_id, tier, confidence, readiness, source_counts, completed_modules, gap/adequate counts, next_steps, globe_region, timestamps.
  - Build verified: 0 errors, 669 modules transformed.
  - **Conv 7-8 is now COMPLETE. PHASE 1 (Data Collection Engine) is COMPLETE** — all Conv 1-8 items done.
- **Also completed earlier in session**: Conv 5-6 final item (EIG question prioritization), 4 pre-existing build errors fixed.
- **What's next**: Conv 11-12 — 5-LLM Parallel Evaluator (evaluate-sonnet.ts, evaluate-gpt54.ts, evaluate-gemini.ts, evaluate-grok.ts, evaluate-perplexity.ts, gpt-realtime.ts).

### Previous Update: 2026-03-09 — Session 7b (Conv 9-10 Tavily Research Pipeline — COMPLETE)

**What was done:**
- **Conv 9-10: Tavily Research Pipeline** (ALL 7 items):
  - **src/types/tavily.ts** (~170 lines): TavilySearchRequest/Response, SourceURL with .gov/.edu detection, RegionResearch (10-topic baseline), MetricResearch (per-city per-metric), TavilyCacheEntry, MemoryCacheEntry, DEFAULT_RESEARCH_TOPICS.
  - **api/tavily-research.ts** (~280 lines): Baseline region research. 10 topic searches (cost_of_living, safety, healthcare, climate, connectivity, visa, education, transport, culture, English). Parallel batches of 3. Supabase tavily_cache with 30-min TTL. SHA-256 query hash dedup. Source URL validation + .gov/.edu flags. Cost tracking.
  - **api/tavily-search.ts** (~280 lines): Metric-specific searches. Gemini research_query + city + country → Tavily advanced. Parallel batches of 5. Same cache/hash/cost patterns. Tier-limited via maxSearches (5-200).
  - **src/lib/tavilyClient.ts** (~220 lines): Client orchestrator with 3-layer cache (in-memory LRU max 50, 30-min TTL → Supabase → API). Request dedup via inflight map. researchRegion(), searchMetrics(), getCacheStats(), clearCache(), evictExpired().
  - Build: 0 errors (tsc + Vite + API routes verified separately).
  - **Conv 9-10 is now COMPLETE.**
- **What's next**: Conv 11-12 — 5-LLM Parallel Evaluator.

### Previous Update: 2026-03-09 — Session 7 (EIG Question Prioritization — Conv 5-6 COMPLETE)

**What was done that conversation:**
- **Engine Wiring, Bite 8**: EIG-driven question prioritization — the final Conv 5-6 item
  - **useAdaptivePriority.ts** (~170 lines): Bridge hook between adaptive engine (EIG-sorted beliefs) and useModuleState (section/question navigation grid). Builds `locationMap` (questionNumber → {sectionIndex, questionIndex}) and `eigSequence` (questions sorted by EIG descending, skipping pre-filled). `goNextAdaptive()` jumps to highest-EIG unanswered question. `goPrevAdaptive()` retraces visited-question history stack (not sequential). Returns `eigRank`, `totalPrioritized`, `answeredPrioritized`, `isAdaptiveComplete`, `isFirstInHistory`. Graceful fallback to sequential when adaptive unavailable.
  - **MiniModuleFlow.tsx**: Replaced sequential `ms.goNext()`/`ms.goPrev()` with EIG-priority navigation when adaptive active. Completion detection uses `priority.isAdaptiveComplete` (all questions answered or MOE target reached). Prev button disabled by `priority.isFirstInHistory` (history stack). Skip handler uses EIG-priority nav. Adaptive insight bar enhanced with EIG rank badge and answered/total counter.
  - WCAG verified: EIG badge uses C.textAccent (7.6:1 vs #0a0e1a), 11px min font, color never sole indicator (text labels on all badges). All interactive elements ≥44px.
  - Build verified: 0 errors, 664 modules transformed.
  - **Conv 5-6 (Adaptive Intelligence Layer) is now COMPLETE** — all 6 checklist items done.
- **Also fixed**: 4 pre-existing build errors (QuestionLibrary.tsx missing `modules` prop, useModuleState.ts useRef arg, moduleRelevanceEngine.ts unused import).
- **What's next**: Conv 7-8 Answer Aggregation + Quality — `answerAggregator.ts`, `qualityScorer.ts`, dashboard completion status, readiness indicator, `user_profiles_computed` table, Olivia green light trigger.

### Previous Update: 2026-03-09 — Session 6 (CoverageMeter + Engine Wiring cont.)

**What was done that conversation:**
- **Engine Wiring, Bite 6**: CoverageMeter.tsx — real-time MOE/coverage visualization
  - **CoverageMeter.tsx** (~330 lines): Two-variant component (compact + full). Compact: SVG MOE ring (r=18, circumference 113.1) + stats + gap count badge. Full: larger SVG ring (r=23, circumference 144.51) + overall progress bar + critical/moderate gap alert badges + expandable 23-dimension breakdown with per-module signal strength bars sorted weakest-first.
  - **Compact variant**: role="status" for screen readers, MOE ring with animated stroke-dasharray, coverage % + data point count, gap count badge with severity color.
  - **Full variant**: role="region" with aria-label, expand/collapse button (aria-expanded, 44px min touch target), per-dimension DimensionBar sub-component with tier-colored bars, percentage labels, "REC" badge for recommended modules.
  - **Dashboard.tsx**: Wired CoverageMeter variant="full" between MainModuleExpander (350ms) and ModuleGrid (500ms). Animation stagger: 400ms.
  - Tier colors: 23 module IDs verified against MODULES array — 3+4+4+4+3+5=23. Same colors as MiniModuleFlow.getModuleAccent.
  - WCAG verified: all text ≥11px, C.textPrimary (18.4:1), C.textSecondary (7.6:1), C.textMuted (6.4:1), C.textAccent (7.6:1), #22c55e (8.5:1), #f59e0b (9.0:1), #ef4444 (5.4:1) — all pass 4.5:1. Button 44px touch target. Global :focus-visible inherited. Color never sole indicator (text labels on all badges).
  - Audit: all imports verified (paths, types), SVG math verified, unused CompactMeterProps interface removed, TypeScript clean.
- **Engine Wiring, Bite 7**: SkipLogic — cross-module pre-fill + skip detection
  - **useSkipLogic.ts** (~170 lines): Hook detecting skippable questions from 3 sources: (1) Paragraphical metrics ≥2 matching the question's module category, (2) Main Module DNW/MH answers with severity/importance ≥4 + signalStrength ≥0.5, (3) high coverage ≥0.8 for the dimension. Returns `getSkipInfo(qNum)`, `skippableCount`, `skipSummary`.
  - **SkipLogic.tsx** (~140 lines): Two visual components. `SkipIndicator`: inline badge below the question with reason text, source label ("Paragraphs"/"Main Module"/"Coverage"), confidence %, and 44px "Skip" button. `SkipSummaryBar`: Olivia-attributed module-level summary ("X of Y questions covered by prior answers").
  - **useAdaptiveState.ts**: Wired `markPreFilled` (5th and final adaptive engine function, deferred from Bite 3). `markAdaptivePreFilled(moduleId, qNum, value)` marks question as pre-filled with partial MOE reduction (70% of full EIG).
  - **MiniModuleFlow.tsx**: Integrated all skip logic — `questionModules` map built from `moduleData.sections`, `useSkipLogic` hook wired, `SkipSummaryBar` above the card, `SkipIndicator` below QuestionRenderer, `handleSkipQuestion` calls both `markAdaptivePreFilled` and `ms.goNext()`.
  - WCAG verified: all text ≥11px, C.textSecondary (7.6:1), C.textMuted (6.4:1), C.textAccent (7.6:1), #22c55e (8.5:1) — all pass 4.5:1. Skip button 44px touch target. Color never sole indicator.
  - Audit: all imports verified (5 new imports across 3 files), `markPreFilled` signature verified against adaptiveEngine.ts, `GeminiMetricObject.category` verified, unused `GeminiExtraction` import removed, TypeScript clean.
- **What's next**: Conv 5-6 remaining items — question prioritization (EIG-driven ordering in MiniModuleFlow), then Conv 7-8 Answer Aggregation.

**Previous conversation (2026-03-09, Session 5) completed:**
- **Conv 3-4, Part 1**: Mini Module Questionnaire Flows + Dashboard Integration
  - **MiniModuleFlow.tsx** (~580 lines): One-question-at-a-time card flow for all 23 mini modules. Uses the SAME `mq-*` CSS / Questionnaire.css as MainQuestionnaire — same particle field, Olivia integration (chat/voice/video), topbar, glassmorphic cards, section tabs, nav buttons, review table. No separate design system.
  - **ModuleLauncher.tsx**: Route wrapper resolving `moduleId` from URL params, loads question data via `getModuleById()`, renders MiniModuleFlow. Error page uses established `mq-universe` styling.
  - **useModuleState.ts** (~200 lines): State management hook for mini modules. Three-layer persistence (memory → localStorage → UserContext/Supabase). Answer keys prefixed `{moduleId}__q{number}`. Auto-resumes at first unanswered question. Fires `COMPLETE_MODULE` when all 100 answered.
  - **ModuleButton.tsx**: Navigates to `/module/:moduleId` (internal SPA route) instead of external URL.
  - **App.tsx**: Added `/module/:moduleId` route with `ProtectedRoute allowAnonymous`.
- **Engine Wiring, Bite 1**: Coverage tracker → React layer
  - **useCoverageState.ts** (~130 lines): Reactive hook computing CoverageState from ALL 7 data sources (paragraphical extraction, demographics, DNW, MH, tradeoffs, general, mini module localStorage). Derived state — no new reducer actions. Returns coverage, recommendedModules (gap analysis), isReportReady flag, overallPercentage.
  - Audit: all 7 `applyCoverage*` signatures verified against `coverageTracker.ts`, localStorage key patterns match `useModuleState`, TypeScript clean.
- **Engine Wiring, Bite 2**: Module relevance engine → React layer
  - **useRelevanceState.ts** (~110 lines): Reactive hook computing which modules to recommend. Chains all 6 `apply*` functions from moduleRelevanceEngine.ts (paragraphical, demographics, DNW, MH, tradeoffs, general). Returns recommendedModules sorted by priority, `isRecommended(moduleId)` lookup, `getRelevance(moduleId)` score, estimated question count.
  - Recommendation logic: `relevance >= 0.35 AND confidence < 0.75`, priority = `relevance × (1 - confidence)`.
  - Audit: all 6 `apply*` signatures verified, all imports confirmed exported, argument types match UserSession fields, TypeScript clean.
- **Engine Wiring, Bite 3**: Adaptive engine → React layer
  - **useAdaptiveState.ts** (~120 lines): Reactive hook wrapping the CAT adaptive question engine. Provides an OVERLAY on top of useModuleState (doesn't replace it). Wraps 4 of 5 exported functions from adaptiveEngine.ts (initializeAdaptiveEngine, selectNextQuestion, recordAnswer, skipQuestion). markPreFilled deferred to future bite when cross-module pre-fill is wired.
  - Takes `RelevanceResult | null` and `CoverageState | null` as inputs from the other two hooks.
  - Returns: nextQuestion (highest-EIG), recordAdaptiveAnswer, skipAdaptiveQuestion, isSessionComplete, overallMOE, totalAnswered, estimatedRemaining, isAvailable.
  - Audit: all 4 imported functions verified against adaptiveEngine.ts signatures, all type imports (AdaptiveState, NextQuestionResult, CoverageState, RelevanceResult) verified exported, return interface maps correctly to AdaptiveState fields, React patterns correct (useMemo, useCallback, functional setState updaters), TypeScript clean.
- **Engine Wiring, Bite 4**: Dashboard module badges — dynamic status from engines
  - **Dashboard.tsx**: Wired `useRelevanceState` into Dashboard. Module grid now shows dynamic statuses: `completed` (from `session.completedModules`), `in_progress` (from localStorage answer detection), `recommended` (from relevance engine), or `not_started` (default). Previously all 23 modules were static `not_started`.
  - Added `hasLocalStorageAnswers()` helper — reads `clues-module-${moduleId}` localStorage key, checks for `{moduleId}__` prefixed answer keys. Same pattern as `useCoverageState.ts` and `useModuleState.ts`.
  - `enrichedModules` computed via `useMemo` — merges static MODULES with dynamic status, priority: completed > in_progress > recommended > not_started.
  - ModuleButton.tsx and ModuleButton.css already support all 5 states (not_started, in_progress, completed, recommended, locked) with illumination CSS — no changes needed.
  - Audit: all imports verified, localStorage key pattern matches useModuleState, isRecommended signature matches useRelevanceState, TypeScript clean.
- **Engine Wiring, Bite 5**: Adaptive engine → MiniModuleFlow (insight overlay + MOE sync)
  - **MiniModuleFlow.tsx**: Wired all three hooks (useCoverageState, useRelevanceState, useAdaptiveState) into MiniModuleFlow. Adaptive engine runs as an OVERLAY — useModuleState still handles persistence and sequential navigation.
  - **handleAnswerWithAdaptive**: Wrapper that calls both `ms.setAnswer()` (persistence) and `adaptive.recordAdaptiveAnswer()` (MOE tracking) on every answer. Keeps adaptive state in sync without replacing the persistence layer.
  - **Adaptive Insight Bar**: Fixed bar below progress bar showing: Olivia's selection reason (from `generateSelectionReason()`), current MOE percentage (green ≤2%, gold ≤10%, muted otherwise), estimated remaining questions. Only visible when adaptive engine has data.
  - WCAG verified: all text 11px (minimum allowed), C.textMuted (6.4:1), #22c55e (8.5:1), #f59e0b (9.0:1) — all pass 4.5:1 against near-#0a0e1a background.
  - Audit: all 3 hook imports verified (paths, return types), handleAnswerWithAdaptive argument types match both ms.setAnswer and adaptive.recordAdaptiveAnswer, adaptive.nextQuestion.selectionReason verified as string on NextQuestionResult, TypeScript clean.
- TypeScript compilation verified clean — zero errors
- **What's next**: Bite 7 — Build SkipLogic.tsx (cross-module pre-fill + skip display).

**Previous conversation (2026-03-09, Session 4) completed:**
- COMPLETED Section 10, Steps 3-6: All three engines now read from `QuestionItem.modules` instead of hardcoded lookup tables
  - **Step 3 — coverageTracker.ts**: Deleted `DNW_MODULE_MAP` (27 entries) and `MH_MODULE_MAP` (28 entries). DNW/MH coverage now looks up main_module questions by number and uses their `modules` field. Paragraphical signal matching uses a lazy keyword index built from question text. Tradeoff handling upgraded from 15 hardcoded pairs to full 50-question lookup via `getModuleQuestions('tradeoff_questions')`.
  - **Step 4 — moduleRelevanceEngine.ts**: Deleted `MODULE_KEYWORDS` (23 entries × 5-8 keywords each) and `findModuleHitsFromText()`. DNW/MH relevance now looks up questions by number directly. Tradeoff relevance upgraded from 15 hardcoded pairs to 50-question lookup.
  - **Step 5 — adaptiveEngine.ts**: Added cross-module overlap to EIG recalculation. Questions sharing `modules` references with the just-answered question get an information overlap penalty (up to 12% uncertainty reduction per shared module ratio), improving question selection efficiency.
  - **Step 6 — Grep verification**: Zero remaining hardcoded keyword-to-module lookup tables in `src/`. Confirmed: `DNW_MODULE_MAP`, `MH_MODULE_MAP`, `MODULE_KEYWORDS`, `tradeoffPairs`, `TRADEOFF_PAIRS` all eliminated.
- Net code reduction: -53 lines (173 added, 226 removed)
- TypeScript compilation verified clean — zero errors

**Previous conversation (2026-03-09, Session 3) completed:**
- Section 10, Steps 1-2: All 2,500 questions across 26 files tagged with correct `modules: string[]` cross-references

**Previous conversation (2026-03-09, Session 2) completed:**
- Designed `modules: string[]` architecture (Section 10)
- Added `modules` field to QuestionItem type
- Tagged main_module.ts (100 questions) manually with cross-module refs
- Pass 1: Auto-tagged all 2,400 remaining questions (23 mini modules + general + tradeoff) with default self-module tags

**Previous conversation (2026-03-09, Session 1) built:**
- Created `LLM_PROVIDER_ARCHITECTURE.md` — complete LLM assignment document
- Built `src/lib/coverageTracker.ts` (~400 lines) — 23-dimension coverage state
- Built `src/lib/moduleRelevanceEngine.ts` (~380 lines) — deterministic module recommendation
- Built `src/lib/adaptiveEngine.ts` (~380 lines) — CAT question selection engine

**Previous conversation (2026-03-08) built:**
- Questionnaire Renderer (Phase 1, Conv 1-2): MainQuestionnaire, QuestionRenderer, 5 sections, logic jumps
- Question library split: 14,415 lines → 26 per-module files
- Supabase schema: 20 tables + 2 views with RLS
- 5 Supabase persistence bug fixes

**Current build position:**
- Phase 1, Conv 1-2 (Questionnaire Renderer) is DONE
- Phase 1, Conv 5-6 (Adaptive Intelligence) is SCAFFOLDED — engines refactored, read from question data
- Section 10 is COMPLETE — all 6 steps done (tagging + engine refactoring + grep verification)
- **NEXT**: Phase 1, Conv 3-4 (Main + Mini Module Flows)

**Next agent should:**
1. Read mandatory files: CLAUDE.md, CLUES_MISSION.md, BUILD_SCHEDULE.md, PARAGRAPHICAL_ARCHITECTURE.md, LLM_PROVIDER_ARCHITECTURE.md
2. Wire EIG-driven question ordering into MiniModuleFlow (use adaptive.nextQuestion to reorder instead of sequential)
3. Move to Conv 7-8: Answer Aggregation + Quality (answerAggregator.ts, qualityScorer.ts, Dashboard readiness indicator, MOE green light trigger)

**Known issues:**
- `questionLibrary.ts` (original monolith) still exists — can be deleted once all consumers migrated
- `README.md` at 46KB needs trimming (not urgent, do during Phase 4 polish)
- Olivia's logic-jump behavior in MainQuestionnaire is currently passive (needs Conv 3-4 enhancement)

---

## 9. DEPENDENCY GRAPH (What Blocks What)

```
Phase 1: Data Collection
  ├── Questionnaire Renderer (Conv 1-2)
  │     ↓ needed by
  ├── Main + Mini Module Flows (Conv 3-4)
  │     ↓ needed by
  ├── Adaptive Intelligence (Conv 5-6)
  │     ↓ needed by
  └── Answer Aggregation (Conv 7-8)
        ↓ needed by

Phase 2: Evaluation Pipeline
  ├── Tavily Research (Conv 9-10)  ← independent, can start with Phase 1 data
  │     ↓ needed by
  ├── 5-LLM Evaluator (Conv 11-12)  ← needs Tavily data
  │     ↓ needed by
  ├── Opus Judge (Conv 13-14)  ← needs all 5 LLM outputs
  │     ↓ needed by
  └── Smart Score Engine (Conv 15-16)  ← needs judge verdicts
        ↓ needed by

Phase 3: Results & Reports
  ├── Results Page (Conv 17-18)  ← needs Smart Scores
  ├── Cristiano Video (Conv 19-20)  ← needs judge report
  └── Report Generation (Conv 21-22)  ← needs everything above
        ↓ needed by

Phase 4: Monetization & Polish
  ├── Stripe (Conv 23-24)  ← independent
  ├── Light Mode (Conv 25-26)  ← independent
  └── Production Hardening (Conv 27-28)  ← needs all features stable
```

**Parallelizable work:**
- Stripe (Phase 4) can be built anytime after Phase 1
- Light Mode (Phase 4) can be built anytime
- Tavily pipeline (Phase 2 start) can begin as soon as Paragraphical data exists (already does)

---

## 10. QUESTION CHANGEABILITY ARCHITECTURE (PERMANENT — DO NOT REMOVE)

> **WHY THIS EXISTS**: The founder's wife audits every question in the platform. She may change
> ANY question — in ANY module, in ANY section — at ANY time. When she changes a question,
> the system MUST NOT break. This section documents the architectural decision that makes
> question changes safe.
>
> **Date**: 2026-03-09
> **Status**: MANDATORY ARCHITECTURE — Every agent must follow this

### The Problem

Question-to-module mappings currently live in SEPARATE files from the questions themselves:
- `coverageTracker.ts` has `DNW_MODULE_MAP` and `MH_MODULE_MAP` (keyword → module lookup tables)
- `moduleRelevanceEngine.ts` has `MODULE_KEYWORDS` (keyword → module lookup tables)
- `adaptiveEngine.ts` reads from `moduleRelevanceEngine.ts` for relevance data
- `tierEngine.ts` has `GQ_MODULE_SIGNALS` (GQ key → module mapping)

When someone changes a question's text, wording, or intent, NOBODY remembers to update
the keyword maps in 2-3 other files. The system silently miscategorizes questions.
This is a ticking time bomb.

### The Solution: `modules: string[]` ON Each Question

Every `QuestionItem` in `src/data/questions/types.ts` gets a `modules` field:

```typescript
export interface QuestionItem {
  number: number;
  question: string;
  type: string;
  sliderLeft?: string;
  sliderRight?: string;
  modules: string[];  // ← THE FIX: which of the 23 modules this question maps to
}
```

**The mapping travels WITH the question.** When the auditor changes Q47 from
"How important is healthcare access?" to "How important is specialist medical care
for chronic conditions?", she sees `modules: ['health_wellness']` right there and
can update it to `modules: ['health_wellness', 'family_children']` in the same edit.

### What This Replaces

Once `modules: string[]` is on every question:
1. **DELETE** `DNW_MODULE_MAP` from `coverageTracker.ts` — read from question's `modules` field instead
2. **DELETE** `MH_MODULE_MAP` from `coverageTracker.ts` — read from question's `modules` field instead
3. **DELETE** `MODULE_KEYWORDS` from `moduleRelevanceEngine.ts` — read from question's `modules` field instead
4. **KEEP** `GQ_MODULE_SIGNALS` in `tierEngine.ts` — this maps GQ answer KEYS (gq14, gq41, etc.) to modules,
   which is different from mapping question TEXT to modules. But add `modules` to GQ questions too for consistency.
5. **KEEP** `DEMOGRAPHIC_RULES` in `moduleRelevanceEngine.ts` — these map DEMOGRAPHIC FACTS (has_children, retired, etc.)
   to module relevance boosts. These are about user attributes, not question text.
6. **KEEP** `TRADEOFF_PAIRS` — tradeoff sliders inherently map to module pairs by design.
   But add `modules` to tradeoff questions too for self-documentation.

### Rules for Every Agent (NON-NEGOTIABLE)

1. **NEVER** create a separate question-to-module mapping table. The mapping is ON the question.
2. **NEVER** use keyword matching on question text to determine module relevance.
   The `modules` field is explicit. Keywords are fragile and break when questions are reworded.
3. When adding a new question to ANY module file, you MUST include the `modules: string[]` field.
4. When changing a question's wording, CHECK if the `modules` field still makes sense.
5. The `coverageTracker.ts` and `moduleRelevanceEngine.ts` engines must read `modules`
   from the question definitions, not from internal lookup tables.

### The Full Funnel (For Context)

This is the CLUES user journey. The user can **step off at ANY point** and receive a valid
report. The user can **step back on at ANY point** and improve their report's accuracy.

```
STEP 1: Paragraphical (30 free-form paragraphs, P1-P30)
  → Gemini extracts 100-250 metrics, module_relevance scores
  → Confidence: ~35%, MOE: high but valid report generated
  → User CAN STOP HERE → Discovery tier report

STEP 2: Main Module (5 sections, strict order)
  2a. Demographics (34 questions) → +10% confidence
      → Deterministic rules: has_children → family_children UP, retired → professional_career DOWN
  2b. Do Not Wants (33 questions) → +15% confidence
      → Severity 4-5 dealbreakers ELIMINATE cities, boost module weights
  2c. Must Haves (33 questions) → +10% confidence
      → Importance 4-5 requirements BOOST cities, boost module weights
  2d. Trade-offs (50 questions: 49 sliders + 1 text) → weights categories AGAINST each other
      → Slider at 80/20 = 80% left category, 20% right category
  2e. General Questions (50 questions) → +20% confidence
      → Broad coverage, GQ answers map to module relevance via GQ_MODULE_SIGNALS
  → User CAN STOP after any section → system recalculates tier + confidence

STEP 3: System-Selected Mini Modules (23 available, system picks 3-8)
  → getRecommendedModules() filters by relevance threshold (default 0.5)
  → Only modules with relevance ≥ 0.5 AND confidence < 0.75 get recommended
  → Priority = relevance × (1 - confidence) — high relevance + low confidence = ask first
  → Within each module: CAT/EIG selects highest-value questions
      → EIG = predictionUncertainty × smartScoreImpact × moduleWeight
      → After each answer: nearby questions get uncertainty reduced (information overlap)
      → Module stops when moduleMOE ≤ 2% (remaining questions auto-skipped)
  → Typical: 8-15 questions per module, NOT all 100
  → User CAN STOP after any module → system recalculates overall MOE

CONVERGENCE: ~250 total answers → MOE ≤ 2% → Olivia congratulates → GAMMA Report generated
  30 paragraphs + 34 demographics + 33 DNW + 33 MH + 50 tradeoffs + 50 general = 230 structured
  + ~20 adaptive module questions (across 3-8 modules, heavily skipped)
  ≈ 250 total → MOE ≤ 2%
```

### The Bayesian-Like Learning

The system LEARNS as data arrives:
- **Deduces**: DNW severity 5 on "crime" → safety_security is critical for this user
- **Induces**: demographics "has children" + MH "schools" → family_children AND education_learning both boosted
- **Logic-jumps**: upstream data already answered most education questions → adaptive engine
  sees LOW EIG on those questions → SKIPS them → jumps to questions with actual gaps
- **Funnels**: each answer narrows the possibility space. Country candidates shrink.
  City rankings tighten. By module completion, the recommendation is precise.

### Implementation Steps (When Ready)

1. Add `modules: string[]` to `QuestionItem` type in `src/data/questions/types.ts`
2. Tag every question in all 26 question files with correct `modules` values
   — READ each question carefully, do NOT fabricate module assignments
3. Update `coverageTracker.ts` to read `modules` from questions, delete `DNW_MODULE_MAP` and `MH_MODULE_MAP`
4. Update `moduleRelevanceEngine.ts` to read `modules` from questions, delete `MODULE_KEYWORDS`
5. Update `adaptiveEngine.ts` to use question-level `modules` for prediction uncertainty
6. Verify with grep: zero remaining hardcoded keyword-to-module lookup tables
7. Commit after each step

---

*This document is the active build roadmap for CLUES Intelligence. It must be read by every AI agent before starting work. It must be updated at the end of every conversation.*
