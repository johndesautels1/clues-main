# Conv 7-8 Audit Report: Answer Aggregation + Quality Scoring

> **Audited**: 2026-03-10
> **Source**: All findings from reading actual source files on disk (verified line-by-line)
> **Scope**: 7 files, ~1,600 lines

## Files Audited

| File | Lines | Scope |
|------|-------|-------|
| `src/lib/answerAggregator.ts` | 493 | Merges 7 sources → AggregatedProfile |
| `src/lib/qualityScorer.ts` | 343 | Weighted readiness formula, next-step generation |
| `src/hooks/useAggregatedProfile.ts` | 141 | Reactive hook + Supabase persistence |
| `src/components/Dashboard/ReadinessIndicator.tsx` | 125 | Dashboard readiness widget |
| `src/components/Dashboard/ReadinessIndicator.css` | 207 | Styles for readiness widget |
| `src/components/Dashboard/Dashboard.tsx` | 215 | Dashboard layout (Conv 7-8 modifications) |
| `src/components/Questionnaire/MiniModuleFlow.tsx` | (green light trigger only) | Toast on coverage.isReportReady |

## Summary: 38 findings — 2 CRITICAL, 8 HIGH, 15 MEDIUM, 13 LOW

---

## CRITICAL (2)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| C1 | `answerAggregator.ts` | 290-309 | **Demographic signal keys `has_children`, `has_pets`, `employment`, `relationship` will never match** — `DemographicAnswers` is typed `{ [questionId: string]: ... }` where keys are question IDs like `"q1"`, `"q5"`, NOT semantic names. The `demoRules` array checks `demo['has_children']` etc., but the actual runtime data uses `demo['q12']` (or whatever the question number is). All 5 demographic boost rules silently produce zero signals. This is the same issue as coverageTracker H2 — the aggregator inherited the same bug. |
| C2 | `useAggregatedProfile.ts` | 54-66 | **`aggregateProfile(session)` called inside `useMemo` reads localStorage** — `extractMiniModuleSignals` (line 451) calls `localStorage.getItem` for each of 23 modules. localStorage is a side effect not tracked by React's dependency array. The memo deps (lines 67-79) don't include `completedModules.length` changes from mini module answer saves — only from `session.completedModules` which updates AFTER a module is fully complete. Partial mini module progress is invisible to the profile until module completion. |

---

## HIGH (8)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| H1 | `answerAggregator.ts` | 246-262, 266-280 | **DNW/MH signal matching uses `mod.shortName.toLowerCase()` substring** — `signal.toLowerCase().includes(mod.shortName.toLowerCase())` is extremely noisy. If a signal text is "I need good healthcare", `mod.shortName` "Health" matches, but so would any module whose shortName appears as a substring (e.g., "Art" in "Starting"). False positive signals pollute the profile. |
| H2 | `answerAggregator.ts` | 337, 363 | **`getModuleQuestions('main_module')` assumes a single question bank** — DNW questions (q35-q67) and MH questions (q68-q100) are looked up from 'main_module' questions, but `getModuleQuestions` may return the wrong set if the module structure separates these. If the lookup fails, `question?.modules` is `undefined`, and the signal gets zero module assignments (skipped silently). |
| H3 | `answerAggregator.ts` | 462-463 | **Mini module number normalization heuristic is fragile** — `rawValue <= 5 ? rawValue / 5 : rawValue / 100` assumes numbers ≤5 are Likert and >5 are sliders. A Likert-10 scale (1-10) or a numeric answer like "3 bedrooms" would be incorrectly normalized (3/5 = 0.6 instead of appropriate mapping). |
| H4 | `qualityScorer.ts` | 73, 84 | **Comment says "24 entries" but `MODULE_COUNT` is 23** — `modules: ModuleQuality[]` comment says 24 entries, `ReadinessIndicator.tsx` line 84 shows "/24 modules" in the UI. MODULES has 23 entries. The denominator mismatch means the UI displays wrong numbers. |
| H5 | `qualityScorer.ts` | 229 | **`expectedSignals` calculation can produce unreasonable thresholds** — `Math.max(5, Math.round(weight * 200))` with normalized weights (weight ≈ 0.04 for equal distribution) gives `Math.round(0.04 * 200) = 8`. But high-weight modules after DNW boosts could have weight ≈ 0.15, giving expected = 30, making them nearly impossible to reach "excellent" status. |
| H6 | `useAggregatedProfile.ts` | 98-115 | **Supabase upsert uses `session_id` as conflict key** — if the user clears their session and starts over with the same session_id (e.g., from a URL/cookie), the old computed profile is silently overwritten. No versioning or history. |
| H7 | `useAggregatedProfile.ts` | 128 | **`quality?.overallReadiness` in useEffect deps** — optional chaining in dependency array: when `quality` is null, this evaluates to `undefined`. When quality first appears with readiness=0, it changes from `undefined` to `0`, triggering the effect. Then any readiness change triggers again. But if readiness stays the same across re-renders while other quality fields change, the persist is skipped even though data changed. |
| H8 | `ReadinessIndicator.tsx` | 84 | **Hardcoded "/24 modules" in UI** — should use `MODULES.length` (23). Displays incorrect denominator to the user. |

---

## MEDIUM (15)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| M1 | `answerAggregator.ts` | 165-167 | **O(N²) signal filtering** — `allSignals.filter(s => s.moduleId === mod.id)` runs for each of 23 modules. With 500+ signals, this is 11,500+ comparisons. Should use a Map grouping. |
| M2 | `answerAggregator.ts` | 226 | **`metric.score / 100` assumes 0-100 range** — if Gemini returns scores on a different scale (0-10, 0-1), all paragraphical signals would be wrong. No bounds check. |
| M3 | `answerAggregator.ts` | 392 | **Neutral tradeoffs (slider=50) produce strength=0** — zero-strength signals are still added to the profile (unlike coverageTracker's M6 fix). Pollutes signal list with meaningless entries. |
| M4 | `answerAggregator.ts` | 177-178 | **`avgSignalValue` is unweighted** — all signals contribute equally regardless of confidence. A low-confidence signal (0.3) has the same weight as a high-confidence one (0.9). Should be confidence-weighted average. |
| M5 | `answerAggregator.ts` | 483 | **Array rawValue joined with `, `** — `rawValue: Array.isArray(rawValue) ? rawValue.join(', ') : rawValue` converts array to string for `ProfileSignal.rawValue` typed as `string | number | boolean`. TypeScript won't catch this since `join()` returns string. |
| M6 | `qualityScorer.ts` | 156 | **`moeCoverage` ignores coverage's own `isReportReady`** — computes its own percentage from `overallMOE` rather than using the canonical `coverage.isReportReady` flag. If the threshold changes in coverageTracker, these could diverge. |
| M7 | `qualityScorer.ts` | 200-208 | **Expected signal counts are guesses** — `paragraphical: 150`, `mini_module: 200` etc. are hardcoded estimates. If actual data consistently produces more or fewer, source ratings are skewed (always 100% or always low). |
| M8 | `qualityScorer.ts` | 304 | **`coverage.gapAnalysis` may not contain the gap module** — `coverage.gapAnalysis.find(g => g.moduleId === gap.moduleId)` returns undefined if the gap module isn't in the analysis array, falling back to `?? 10` as a magic number. |
| M9 | `qualityScorer.ts` | 339 | **`steps.forEach((s, i) => { s.priority = i + 1; })` mutates objects** — the `QualityNextStep` objects are created in the same function, so this is safe, but the mutation pattern is inconsistent with the rest of the codebase which uses immutable transforms. |
| M10 | `useAggregatedProfile.ts` | 56-63 | **`hasAny` check uses truthiness, not length** — `session.mainModule.demographics` is truthy even if it's an empty `{}`. Should check `Object.keys(demographics).length > 0` like useCoverageState does. |
| M11 | `useAggregatedProfile.ts` | 90 | **No error boundary around `aggregateProfile`** — if any extractor throws (e.g., corrupt localStorage), the entire profile becomes null. Should wrap in try/catch like useCoverageState's per-source pattern. |
| M12 | `ReadinessIndicator.tsx` | 42-44 | **`useMemo` for trivial `.slice(0, 3)`** — `quality.nextSteps.slice(0, 3)` is a trivial operation. The memo adds overhead (dependency tracking) without meaningful benefit. |
| M13 | `ReadinessIndicator.css` | 5-6 | **Dark mode glass background uses raw rgba** — `rgba(255, 255, 255, 0.02)` should be `var(--bg-glass)` or `var(--bg-card)` for consistency with the design system. |
| M14 | `ReadinessIndicator.css` | 52-53 | **Progress bar track uses raw rgba** — `rgba(255, 255, 255, 0.06)` instead of `var(--bg-card)`. |
| M15 | `Dashboard.tsx` | 50-64 | **`enrichedModules` reads localStorage in useMemo** — `hasLocalStorageAnswers` calls `localStorage.getItem` + `JSON.parse` for 23 modules on every memo recompute. The deps `[completedModules, isRecommended]` don't track localStorage changes from partial answers. |

---

## LOW (13)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| L1 | `answerAggregator.ts` | 211 | `aggregatedAt: new Date().toISOString()` — generates new timestamp on every call, making memoization fingerprinting unreliable (the profile appears "changed" every time even if data didn't change). |
| L2 | `answerAggregator.ts` | 313 | `TOTAL_DEMO_QUESTIONS = 34` hardcoded — should derive from question data to stay in sync. |
| L3 | `answerAggregator.ts` | 340 | `normalizedSeverity = answer.severity / 5` — produces 0.2-1.0 range, not 0-1. If severity=0 is valid, this would produce 0. Comment says "1-5 → 0.2-1.0" which is correct but the normalization choice loses the 0-0.2 range. |
| L4 | `answerAggregator.ts` | 389 | `parseInt(key.replace(/\D/g, ''), 10)` — strips ALL non-digits. If key is "tq42b" (hypothetical), it would parse as 42. Fragile but unlikely to cause issues with current key format. |
| L5 | `answerAggregator.ts` | 455 | `keys.filter(k => k.startsWith(`${moduleId}__q`))` — only matches keys starting with `q` after the prefix. If any key uses a different format (e.g., `moduleId__s1_q1`), it would be silently skipped. |
| L6 | `qualityScorer.ts` | 23 | `MODULE_COUNT = MODULES.length` at module scope — if MODULES is modified at runtime (hypothetical), this would be stale. Trivial risk. |
| L7 | `qualityScorer.ts` | 252 | **Gap detection threshold `weight > 0.03`** — hardcoded. With 23 modules, equal weight is ~0.043, so this threshold catches most modules. But after weight normalization from DNW/MH boosts, some modules might dip below 0.03 and never be flagged as gaps even with zero data. |
| L8 | `qualityScorer.ts` | 328 | **Completed modules bonus step only shows if `< 5 && > 0`** — users with 0 completed modules or ≥ 5 never see this step. The 5-module threshold is arbitrary. |
| L9 | `useAggregatedProfile.ts` | 94 | **Fingerprint doesn't include `session.id`** — if the session changes but `totalDataPoints`, `overallReadiness`, and `aggregatedAt` coincidentally match, the upsert is skipped. Extremely unlikely but theoretically possible. |
| L10 | `ReadinessIndicator.tsx` | 104 | **List items use array index as key** — `key={i}` instead of `key={step.target}` or a stable identifier. If next steps reorder between renders, React may not reconcile correctly. |
| L11 | `ReadinessIndicator.css` | 97 | **Border separator uses raw rgba** — `rgba(255, 255, 255, 0.06)` instead of `var(--border-glass)`. |
| L12 | `Dashboard.tsx` | 93-98 | **`getMainModuleStatus()` called during render** — not memoized. Creates a new function and iterates `Object.values` on every render. Trivial cost but inconsistent with other memoized computations. |
| L13 | `MiniModuleFlow.tsx` | 127 | **Toast icon uses Unicode emoji `\u2728`** — toast.success uses a sparkle emoji as icon. Per CLAUDE.md, emojis should not be sole indicators, but the toast also has text, so this is borderline acceptable. |
