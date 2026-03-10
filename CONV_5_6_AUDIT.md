# Conv 5-6 Audit Report: Adaptive Intelligence Layer

> **Audited**: 2026-03-10
> **Source**: All findings from reading actual source files on disk (verified line-by-line)
> **Scope**: 8 files, ~2,280 lines

## Files Audited

| File | Lines | Scope |
|------|-------|-------|
| `src/lib/adaptiveEngine.ts` | 569 | Bayesian-like coverage tracking, EIG computation |
| `src/lib/coverageTracker.ts` | 603 | 23-dimension coverage state, MOE calculation |
| `src/components/Questionnaire/CoverageMeter.tsx` | 334 | Real-time coverage/MOE UI |
| `src/components/Questionnaire/SkipLogic.tsx` | 141 | Pre-fill and skip display |
| `src/hooks/useAdaptiveState.ts` | 135 | Adaptive engine state management |
| `src/hooks/useAdaptivePriority.ts` | 195 | EIG question prioritization |
| `src/hooks/useCoverageState.ts` | 135 | Coverage state hook |
| `src/hooks/useSkipLogic.ts` | 169 | Skip logic for inferrable questions |

## Summary: 51 findings — 3 CRITICAL, 14 HIGH, 18 MEDIUM, 16 LOW

---

## CRITICAL (3)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| C1 | `adaptiveEngine.ts` | 296-310 | **`selectNextQuestion` mutates state in-place** — sets `activeModuleId` and `isComplete` directly on the passed object. Every other mutation function uses `structuredClone`. In React 19, mutating state held in `useState` outside `setState` causes missed renders and stale UI. |
| C2 | `useAdaptiveState.ts` | 81-89 | **`useMemo` used for side effects (setState)** — `useMemo` is semantically pure; React may drop/re-run memoized values in concurrent mode. The engine initialization calls `setState` inside `useMemo`. Should be `useEffect`. |
| C3 | `adaptiveEngine.ts` | 405-431 | **`markPreFilled` never updates overall MOE/session complete** — reduces `moduleMOE` but never recalculates `overallMOE`, `estimatedRemaining`, or checks `isSessionComplete`. If many questions are pre-filled, the session will never converge. Compare with `recordAnswer` (389-391) which does all of these. |

---

## HIGH (14)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| H1 | `coverageTracker.ts` | 151, 466, 531 | **`signalConsistency` never populated** for non-mini-module sources. Initialized to 0 for all dimensions, only updated in `applyCoverageFromMiniModule`. The consistency penalty system is dead code for 5 of 6 data sources. |
| H2 | `coverageTracker.ts` | 242-253 | **Demographic property keys may not match runtime data** — code accesses `demographics.has_children`, `demographics.has_pets`, etc. but `DemographicAnswers` is typed as `{ [questionId: string]: ... }`. If actual keys are `"q1"`, `"q2"`, all demographic boosts silently fail. |
| H3 | `useAdaptivePriority.ts` | 123, 132, 164, 179 | **`ms` (entire useModuleState return) in dependency arrays** — if `useModuleState` returns a new object literal each render (standard pattern), all `useCallback`/`useMemo` depending on `ms` recompute every render, defeating memoization. |
| H4 | `useAdaptivePriority.ts` | 182 | **`findNextUnanswered()` called in render path** outside `useMemo` — iterates full `eigSequence` array every single render. |
| H5 | `useCoverageState.ts` | 38-51, 101 | **localStorage read on every recompute** — `getMiniModuleAnswerCounts()` calls `localStorage.getItem` + `JSON.parse` for 23+ modules inside `useMemo`. |
| H6 | `useCoverageState.ts` | 101-118 | **localStorage not in dependency array** — `getMiniModuleAnswerCounts()` reads from localStorage which changes independently of listed deps. Coverage state is stale after answering mini module questions until something else triggers re-render. |
| H7 | `useSkipLogic.ts` | 82-105 | **DNW/MH skip logic is module-agnostic** — any high-severity DNW/MH answer (severity >= 4) flags ALL modules as skippable, regardless of whether the answer relates to the current module. Overly aggressive skip suggestions. |
| H8 | `CoverageMeter.tsx` | 227, 229 | **`#ef4444` fails 4.5:1 on white** (light mode) — ~3.9:1 for 11px text. |
| H9 | `CoverageMeter.tsx` | 239, 315 | **`#f59e0b` fails 4.5:1 on white** — ~2.1:1 for text. Severe light-mode failure. |
| H10 | `CoverageMeter.tsx` | 305 | **`#22c55e` fails 4.5:1 on white** — ~2.3:1 for percentage text. |
| H11 | `CoverageMeter.tsx` | 188 | **No `:focus-visible` on expand/collapse button** — inline styles can't express `:focus-visible`. No visible focus indicator. |
| H12 | `SkipLogic.tsx` | 125 | **`#22c55e` "Olivia" label fails 4.5:1 on white** — same light-mode contrast failure. |
| H13 | `SkipLogic.tsx` | 72 | **No `:focus-visible` on Skip button** — inline styles only, no focus ring defined. |
| H14 | `SkipLogic.tsx` | 86-87 | **Hover-only interaction feedback** — color change only on `onMouseEnter`/`onMouseLeave`. No keyboard focus equivalent. |

---

## MEDIUM (18)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| M1 | `adaptiveEngine.ts` | 436-456 | `skipQuestion` doesn't recalculate `estimatedRemaining` — shows stale counts |
| M2 | `adaptiveEngine.ts` | 515-526 | `calculateOverallMOE` is unweighted average — diverges from coverageTracker's weighted MOE |
| M3 | `adaptiveEngine.ts` | 475, 494 | `getQuestionByModuleAndNumber` called O(N) times per answer — re-flattens sections each call |
| M4 | `coverageTracker.ts` | 92, 105 | Module-level mutable caches (`_mainModuleQuestions`, `_signalIndex`) with no invalidation |
| M5 | `coverageTracker.ts` | 253, 259 | `employment_type` vs `employment` ambiguity — two different keys checked, neither may match |
| M6 | `coverageTracker.ts` | 412 | Neutral tradeoff answers (strength=0) still add zero-strength sources, polluting source list |
| M7 | `coverageTracker.ts` | 233 vs 322 | Weight normalization inconsistency — `applyCoverageFromDemographics` skips `normalizeWeights`, others call it |
| M8 | `coverageTracker.ts` | 543 | `recalculateMOE` calls `analyzeGaps` every time — wasteful for incremental updates |
| M9 | `useAdaptiveState.ts` | — | No re-initialization path — if user leaves and returns with different data, engine stays frozen |
| M10 | `useAdaptivePriority.ts` | 69-70, 173 | `historyRef` updated during render (concurrent mode risk), `goPrevAdaptive` reads stale ref |
| M11 | `useCoverageState.ts` | 72-107 | No try/catch around `applyCoverage*` functions — malformed extraction data crashes entire `useMemo` |
| M12 | `useSkipLogic.ts` | 119, 135 | Only one skip reason per question — priority ordering means paragraphical always wins even with lower confidence |
| M13 | `useSkipLogic.ts` | 150 | `questionModules` Map in dependency array — recomputes every render if caller creates new Map |
| M14 | `CoverageMeter.tsx` | 107-117 | Gap badge color/text mismatch — color from first gap's severity, text counts critical gaps |
| M15 | `CoverageMeter.tsx` | 115 | "0 gaps" shown when only moderate gaps exist |
| M16 | `CoverageMeter.tsx` | 21-28 | All TIER_COLORS hardcoded hex, no CSS variables — fail 3:1 on light mode |
| M17 | `CoverageMeter.tsx` | 287-298 | Bar color is sole tier indicator — no pattern, label, or icon alternative |
| M18 | `SkipLogic.tsx` | 42, 111 | `role="status"` on SkipIndicator/SkipSummaryBar — live region causes excessive screen reader announcements |

---

## LOW (16)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| L1 | `adaptiveEngine.ts` | 423 | `markPreFilled` sets `answered=true` but increments `skippedCount` not `answeredCount` |
| L2 | `adaptiveEngine.ts` | 368 | MOE reduction factor `0.15` is a magic number |
| L3 | `adaptiveEngine.ts` | 319 | `nextBelief` type narrowing fragile (guarded at runtime) |
| L4 | `adaptiveEngine.ts` | 354, 411, 441 | `structuredClone` on every mutation — potentially expensive with 2300 beliefs |
| L5 | `coverageTracker.ts` | 404 | Redundant `typeof value === 'number'` check (type already guarantees number) |
| L6 | `coverageTracker.ts` | 576-603 | `applySignalHitsFromIndex` single-word matching — very noisy false positives |
| L7 | `coverageTracker.ts` | 271, 318 | Linear `.find()` on dimensions array in inner loops — trivial with 23 items |
| L8 | `useAdaptiveState.ts` | 128-131 | Return type exposes nullable `adaptiveState` with `??` fallbacks |
| L9 | `useAdaptiveState.ts` | 93-96 | `nextQuestion` recomputes on every state change |
| L10 | `useAdaptivePriority.ts` | 139 | `eigRank` returns null when currentQuestion undefined — handled correctly |
| L11 | `useCoverageState.ts` | 122 | Only includes 'critical'/'moderate' severity in recommendations — 'low' silently excluded |
| L12 | `useCoverageState.ts` | 126 | `overallPercentage` computed outside `useMemo` |
| L13 | `useSkipLogic.ts` | 86-87 | `parseInt(dnw.questionId)` result unused — dead code |
| L14 | `useSkipLogic.ts` | 161-165 | `useMemo` returning closure — could be `useCallback` |
| L15 | `CoverageMeter.tsx` | 133 | `sortedDimensions` not memoized |
| L16 | `CoverageMeter.tsx` | 58 | `role="status"` on CompactMeter — excessive screen reader announcements |
