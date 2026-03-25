# Session Handoff: Clues Main-Fix-3 (2026-03-25)

## RULES FOR THE NEXT AGENT — READ THESE FIRST

1. **The repo is at `D:\Clues Main\`** — ALL work happens on the D: drive. Do NOT create files on C: drive.
2. **GitHub repo**: `https://github.com/johndesautels1/clues-main.git` — branch: `main`
3. **READ `D:\Clues Main\CLAUDE.md` FIRST** — absolute priority rules including stop-means-stop.
4. **READ `D:\Clues Main\CLUES_MAIN_BUILD_REFERENCE.md`** — complete architecture reference.
5. **DO NOT write code without explicit user permission.** Read and understand first. Ask before changing anything.
6. **All commits MUST be pushed immediately.** `git commit && git push` — every time.
7. **API keys are in Vercel env vars.** They exist. Do NOT claim they're missing.
8. **The LLM cascade infrastructure is FULLY BUILT in `src/lib/cascade/` and `api/`.** Do NOT propose rebuilding it.

---

## CURRENT STATE

### Latest Commit: `800f64b` — "Wire test persona through real LLM cascade pipeline"

**What this commit did:**
- Removed 3 pre-baked output fields from `buildTestPersonaSession()` in `src/data/testPersona.ts`:
  - `smartScoreOutput: TEST_SMART_SCORES`
  - `judgeReport: TEST_JUDGE_REPORT`
  - `judgeOrchestration: TEST_JUDGE_ORCHESTRATION`
- Removed the unused import of those 3 mock objects from `testPersonaMockScores.ts`
- Kept `currentTier: 'precision'` and `confidence: 98` (required by TypeScript `UserSession` type)
- Kept ALL input data (30 paragraphs, demographics, DNW, MH, tradeoffs, general, 23 mini modules)

**Intention:** Without pre-baked `smartScoreOutput`, `ResultsPage.tsx:36` no longer skips `pipeline.run()`, so the real 5-LLM cascade should fire.

### THE BUG: React Error #300 on Production

After deploying commit `800f64b`, the production site crashes with:
```
Minified React error #300
```

This is **"Objects are not valid as a React child"** — something in the rendering is trying to display a raw JavaScript object instead of a string/number.

### LIKELY CAUSE

The error happens when the test persona loads on the Dashboard. Possible locations:
1. A component tries to render `session.smartScoreOutput` (now `undefined`) or a related field directly in JSX
2. The `ReadinessIndicator` or `Dashboard` renders something that was previously an object (from pre-baked data) and now fails because the shape changed
3. A component somewhere renders `session.currentTier` or `session.confidence` as a child but one of these is actually an object in some edge case

### WHAT NEEDS INVESTIGATION

The next agent should:
1. **Find the component rendering an object as a React child.** Search all `.tsx` files in `src/components/` for places where session fields are rendered in JSX without accessing primitive properties.
2. **Check if localStorage has stale data.** The `useSessionPersistence` hook loads from localStorage on mount. If a previous session with the old pre-baked `smartScoreOutput` (which is a complex object) was saved to localStorage, it might be getting rendered somewhere.
3. **Run locally** with `npm run dev` at `D:\Clues Main\` to see the full unminified error with stack trace.

### SEARCH PATTERNS FOR THE BUG

```
# Find any JSX that renders session fields directly
grep -rn '{session\.' src/components/ --include='*.tsx'

# Find any JSX that renders quality/profile objects
grep -rn '{quality\.' src/components/ --include='*.tsx'
grep -rn '{profile\.' src/components/ --include='*.tsx'

# Find any place smartScoreOutput is rendered
grep -rn 'smartScoreOutput' src/components/ --include='*.tsx'
```

---

## THE FULL PIPELINE (Already Built — DO NOT Rebuild)

### Pipeline Entry Point
- `src/hooks/useEvaluationPipeline.ts` — React hook that calls `runPipeline()`
- `src/lib/evaluationPipeline.ts` — 8-phase orchestration (aggregate → metrics → cities → evaluate → judge → score)

### Pipeline Chain
```
useEvaluationPipeline.run()
  → tavilyClient.searchMetrics() → POST /api/tavily-search
  → evaluationPipeline.runPipeline()
    → answerAggregator.aggregateProfile()       [src/lib/answerAggregator.ts]
    → profileSignalBridge.buildMetricsForEvaluation()  [src/lib/profileSignalBridge.ts]
    → evaluationOrchestrator.runEvaluation()    [src/lib/evaluationOrchestrator.ts]
      → fetch('/api/evaluate-sonnet')           [api/evaluate-sonnet.ts]
      → fetch('/api/evaluate-gpt54')            [api/evaluate-gpt54.ts]
      → fetch('/api/evaluate-gemini')           [api/evaluate-gemini.ts]
      → fetch('/api/evaluate-grok')             [api/evaluate-grok.ts]
      → fetch('/api/evaluate-perplexity')       [api/evaluate-perplexity.ts]
    → judgeOrchestrator.runJudge()              [src/lib/judgeOrchestrator.ts]
      → fetch('/api/judge-opus')                [api/judge-opus.ts]
    → relativeScoring.computeSmartScores()      [src/lib/relativeScoring.ts]
  → dispatch SET_SMART_SCORES to UserContext
  → dispatch SET_JUDGE_REPORT to UserContext
  → ResultsDashboard renders full results
```

### All 5 Evaluator Endpoints (LIVE on Vercel)
- `api/evaluate-sonnet.ts` — Claude Sonnet 4.6
- `api/evaluate-gpt54.ts` — GPT-5.4
- `api/evaluate-gemini.ts` — Gemini 3.1 Pro Preview
- `api/evaluate-grok.ts` — Grok 4.1 Fast Reasoning
- `api/evaluate-perplexity.ts` — Sonar Reasoning Pro High

### Judge Endpoint (LIVE on Vercel)
- `api/judge-opus.ts` — Claude Opus 4.6 (Cristiano)

### Research Endpoints (LIVE on Vercel)
- `api/tavily-search.ts` — Per-metric searches
- `api/tavily-research.ts` — Region baseline research

### Shared Utilities
- `api/_shared/evaluation-utils.ts` — CORS, prompt building, response parsing, retry logic, cost tracking

---

## RESULTS UI COMPONENTS (All 19 in `src/components/Results/`)

| Component | What It Shows | Data Source |
|-----------|--------------|-------------|
| `ResultsPage.tsx` | Route wrapper, 3 states (no data / run eval / show results) | session |
| `ResultsDashboard.tsx` | Main orchestrator, wires all sections together | SmartScoreOutput |
| `WinnerHero.tsx` | Winner city with score and rank | winner from SmartScores |
| `CityComparisonGrid.tsx` | Side-by-side city cards with scores | cityScores array |
| `CategoryBreakdown.tsx` | 23 collapsible categories with comparison bars + metrics | categoryScores |
| `MetricDetailTable.tsx` | Individual metrics within a category | metricScores |
| `EvidencePanel.tsx` | Source citations filterable by category | metric sources |
| `JudgeVerdict.tsx` | Opus judge summary + overrides | judgeReport |
| `CourtOrder.tsx` | Per-category judge analysis | judgeReport |
| `SimliQuickVerdict.tsx` | Real-time narration of verdict | judgeReport |
| `CristianoVideoPlayer.tsx` | Cinematic video of verdict | judgeReport + HeyGen |
| `TownNeighborhoodDrilldown.tsx` | Towns + neighborhoods in winning city | cityScores filtered |
| `ThinkingDetailsPanel.tsx` | Gemini reasoning chain | extraction.thinking_details |
| `SideBySideMetricView.tsx` | Metric comparison across locations | extraction recommendations |
| `ParagraphHighlightPanel.tsx` | Paragraph text with highlights | paragraphs |
| `PipelineCascadeProgress.tsx` | Real-time pipeline progress during evaluation | pipeline.progress |
| `ReportDownload.tsx` | Report generation (Gamma, Evidence Room) | pipelineResult + session |

---

## KEY FILE PATHS (All on D: drive)

| Purpose | Path |
|---------|------|
| Project root | `D:\Clues Main\` |
| Agent instructions | `D:\Clues Main\CLAUDE.md` |
| Build reference | `D:\Clues Main\CLUES_MAIN_BUILD_REFERENCE.md` |
| Architecture gaps | `D:\Clues Main\URGENT_ARCHITECTURE_GAP.md` |
| Test persona | `D:\Clues Main\src\data\testPersona.ts` |
| Mock scores | `D:\Clues Main\src\data\testPersonaMockScores.ts` |
| Pipeline entry | `D:\Clues Main\src\lib\evaluationPipeline.ts` |
| Signal bridge | `D:\Clues Main\src\lib\profileSignalBridge.ts` |
| Eval orchestrator | `D:\Clues Main\src\lib\evaluationOrchestrator.ts` |
| Judge orchestrator | `D:\Clues Main\src\lib\judgeOrchestrator.ts` |
| Smart scores | `D:\Clues Main\src\lib\relativeScoring.ts` |
| Category rollup | `D:\Clues Main\src\lib\categoryRollup.ts` |
| Tier engine | `D:\Clues Main\src\lib\tierEngine.ts` |
| Answer aggregator | `D:\Clues Main\src\lib\answerAggregator.ts` |
| Tavily client | `D:\Clues Main\src\lib\tavilyClient.ts` |
| User context | `D:\Clues Main\src\context\UserContext.tsx` |
| Results page | `D:\Clues Main\src\components\Results\ResultsPage.tsx` |
| Results dashboard | `D:\Clues Main\src\components\Results\ResultsDashboard.tsx` |
| Pipeline hook | `D:\Clues Main\src\hooks\useEvaluationPipeline.ts` |
| Aggregated profile hook | `D:\Clues Main\src\hooks\useAggregatedProfile.ts` |
| Session persistence | `D:\Clues Main\src\hooks\useSessionPersistence.ts` |
| Types | `D:\Clues Main\src\types/` (index.ts, evaluation.ts, judge.ts, smartScore.ts) |

---

## GIT STATE

```
Branch: main
Remote: github.com/johndesautels1/clues-main
Latest commit: 800f64b
All changes pushed: Yes
Unstaged: package-lock.json (benign), nul (untracked, benign)
```

## REMAINING ARCHITECTURE GAPS (from URGENT_ARCHITECTURE_GAP.md)

1. **Gap 4**: Category weights don't reflect user priorities — `categoryRollup.ts` treats all 23 categories equally
2. **Gap 3**: Recommendation engine ignores dealbreaker violations — winner forced to highest raw score
3. **Gap 5**: Anti-hallucination safeguard overrides Opus on dealbreakers

## IMMEDIATE PRIORITY

**Fix React error #300** so the site loads. Then verify the pipeline fires correctly with the test persona.
