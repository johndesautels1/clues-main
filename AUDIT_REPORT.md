# CLUES Intelligence — Full Codebase Audit Report

**Date**: 2026-03-10
**Auditor**: Claude Opus 4.6 (6 parallel audit agents)
**Scope**: All files built from conversation 1 through current session
**Policy**: READ-ONLY — Zero modifications made. All bugs reported for owner review.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 20 |
| MEDIUM | 22 |
| LOW | 14 |
| **TOTAL** | **60** |

---

## CRITICAL BUGS (4)

| # | File | Line | Bug |
|---|------|------|-----|
| C1 | `api/paragraphical.ts` | 387-388 | **Incorrect Gemini pricing rates.** Hardcoded $1.25 input / $10.00 output per 1M tokens. Actual March 2026 rates are $2.00 / $12.00. All Paragraphical cost tracking underestimates by ~40-60%. |
| C2 | `api/evaluate-gemini.ts` | 81-82 | **Same incorrect Gemini pricing rates** ($1.25/$10.00 instead of $2.00/$12.00). Evaluation cost tracking also underestimates. |
| C3 | `src/lib/judgeOrchestrator.ts` | 389-394 | **Math error in avgStdDev calculation.** Uses `sum + c.stdDev / arr.length` which divides EACH stdDev by array length before summing, producing wrong average. Should be `(sum + c.stdDev)` then divide total by length after loop. This corrupts judge review thresholds. |
| C4 | `src/lib/evaluationPipeline.ts` | 197-198 | **City recommendation cost is a stub.** Adds flat $0.01 per LLM call regardless of actual token usage/cost. Should sum `metadata.costUsd` from each API response. Total cost reporting is inaccurate. |

---

## HIGH BUGS (20)

| # | File | Line | Bug |
|---|------|------|-----|
| H1 | `api/evaluate-sonnet.ts` | 231-253 | **No retry logic on 429/5xx.** Gemini has exponential backoff, Sonnet does not. Rate limits cause immediate failure. |
| H2 | `api/evaluate-gpt54.ts` | 231-253 | **No retry logic on 429/5xx.** Same issue as H1 for OpenAI endpoint. |
| H3 | `api/evaluate-grok.ts` | 229-251 | **No retry logic on 429/5xx.** Same issue as H1 for xAI endpoint. |
| H4 | `api/evaluate-perplexity.ts` | 231-252 | **No retry logic on 429/5xx.** Same issue as H1 for Perplexity endpoint. |
| H5 | `api/evaluate-gemini.ts` | 294-297 | **Unhandled JSON.parse in catch block.** Second parse attempt has no error handling — crashes handler on malformed response. |
| H6 | `api/evaluate-sonnet.ts` | 272-276 | **Unhandled JSON.parse in catch block.** Same as H5. |
| H7 | `api/evaluate-gpt54.ts` | 273-276 | **Unhandled JSON.parse in catch block.** Same as H5. |
| H8 | `api/evaluate-grok.ts` | 271-274 | **Unhandled JSON.parse in catch block.** Same as H5. |
| H9 | `api/evaluate-perplexity.ts` | 272-279 | **Double parse vulnerability.** `<think>` block stripping + two unguarded JSON.parse calls — both can throw unhandled. |
| H10 | `api/paragraphical.ts` | 547 | **Thinking token cost conflation.** Thinking and output tokens combined but only output rate applied. Should itemize separately. |
| H11 | `src/lib/judgeOrchestrator.ts` | 408-409 | **Unsafe confidenceRank access.** If `overallConfidence` is not 'high'/'medium'/'low', returns undefined → NaN comparison. No type guard. |
| H12 | `api/judge-opus.ts` | 328-331 | **VALID_MODELS Set hardcoded.** Won't auto-update if EvaluatorModel type changes. Creates silent drift. |
| H13 | `src/lib/coverageTracker.ts` | 304 | **DNW questionId parsing uses bare parseInt.** If ID is "dnw_q35", returns NaN. Inconsistent with answerAggregator which uses `.replace(/\D/g, '')`. |
| H14 | `src/lib/coverageTracker.ts` | 351 | **MH questionId parsing uses bare parseInt.** Same as H13. |
| H15 | `src/lib/moduleRelevanceEngine.ts` | 292 | **DNW questionId parsing uses bare parseInt.** Third instance of inconsistent parsing. |
| H16 | `src/lib/moduleRelevanceEngine.ts` | 328 | **MH questionId parsing uses bare parseInt.** Fourth instance. |
| H17 | `src/lib/answerAggregator.ts` | 421 | **General signal normalization assumes 0-10 scale.** Uses `value / 10` but GeneralAnswers has no documented range. If answers are 0-100 or 1-5, normalization is wrong. |
| H18 | `src/lib/qualityScorer.ts` | 23 | **Comment says MODULE_COUNT=24 but actual count is 23.** Contradicts all documentation. Code uses MODULES.length dynamically so it works, but the comment is wrong and misleading. |
| H19 | `src/components/Results/ReactiveJustification.tsx` | 73-75 | **WCAG violation: `score-red` (#ef4444) contrast 4.35:1 < 4.5:1 required.** Not in approved dark-mode color table. |
| H20 | `src/components/Results/SideBySideMetricView.tsx` | 54-57 | **WCAG violation: `score-red` (#ef4444) same contrast failure.** |

---

## MEDIUM BUGS (22)

| # | File | Line | Bug |
|---|------|------|-----|
| M1 | `api/paragraphical.ts` | 514-520 | **Unhandled JSON parse in catch.** Same pattern as H5-H9 in Paragraphical endpoint. |
| M2 | `api/paragraphical.ts` | 510-511 | **Empty text extraction.** If Gemini returns undefined `content.parts`, rawText is empty string → unparseable JSON → crash. |
| M3 | `api/tavily-research.ts` | 327 | **Fire-and-forget cache write.** `setCachedResearch()` not awaited — cache failures silently ignored. |
| M4 | `api/tavily-search.ts` | 303 | **Fire-and-forget cache write.** Same as M3. |
| M5 | `src/lib/smartScoreEngine.ts` | 323 | **Division by zero risk in stdDev.** If all values are NaN after filtering, `valid.length === 0` → `Math.sqrt(0/0)` = NaN. Should check `valid.length >= 2`. |
| M6 | `src/lib/judgeOrchestrator.ts` | 76 | **Derivation logic unclear.** `preset ? 'paragraph_emphasis' : 'custom'` only when paragraphEmphasis exists. Logic intent is ambiguous. |
| M7 | `src/lib/judgeOrchestrator.ts` | 250-313 | **Last-batch-wins on merge.** Multiple judge batches → only last report's recommendation kept. Conflicts not flagged. |
| M8 | `src/lib/judgeOrchestrator.ts` | 95 | **`import.meta.env.VITE_VERCEL_URL` in server context.** Will be undefined in API routes. |
| M9 | `src/lib/categoryRollup.ts` | 76 | **Derivation type ambiguity.** 'custom' doesn't distinguish "paragraph_emphasis only" from "user custom weights". |
| M10 | `src/lib/categoryRollup.ts` | 178 | **judgeTrend possibly undefined.** Assignment from `locationSummary?.trend` can be undefined but typed as optional enum. |
| M11 | `src/lib/evaluationOrchestrator.ts` | 326 | **Empty evaluations silently produce 0 scores.** If LLM returns evaluations array missing expected cities, mean/median default to 0 without flagging. |
| M12 | `api/evaluate-sonnet.ts` | 266 | **Type unsafe content block access.** Checks `Array.isArray` without null guard on `anthropicResult.content`. |
| M13 | `src/lib/answerAggregator.ts` | 336 | **Fragile questionId parsing.** `.replace(/\D/g, '')` strips all non-digits — fragile if ID format changes. |
| M14 | `src/lib/answerAggregator.ts` | 319 | **Magic number 34 for demo questions.** `demoCount / 34` hardcoded. No constant defined. |
| M15 | `src/lib/answerAggregator.ts` | 468 | **Multi-select normalization assumes max 5 options.** `rawValue.length / 5` clips at 1.0 for 5-item selections. Questions with 10+ options break. |
| M16 | `src/lib/qualityScorer.ts` | 234 | **Source score divides by 4, but 7 sources exist.** `activeSources / 4 * 100` caps at >100% if user has 5+ sources. Should be /7. |
| M17 | `src/lib/profileSignalBridge.ts` | 149, 190 | **parseInt with no digit guard.** Same fragile pattern as M13. NaN if questionId has no digits. |
| M18 | `src/lib/cityRecommendationOrchestrator.ts` | 227 | **Unsafe type assertion on API response.** `data.recommendations as LLMRecommendationResponse` — no validation. |
| M19 | `src/lib/evaluationPipeline.ts` | 165 | **Tier string passed without validation.** `calculateTier()` returns string, passed to `recommendCities()` without verifying it's a valid CompletionTier. |
| M20 | `src/lib/cityRecommendationOrchestrator.ts` | 143-168 | **location_type hardcoded.** LLM responses could return any string, but 'city'/'town' are forced regardless. |
| M21 | `src/components/Results/ReasoningTrace.tsx` | 41-76 | **Missing :focus-visible on button.** WCAG requires visible focus indicators with 3:1 contrast. |
| M22 | `src/components/Results/ThinkingDetailsPanel.tsx` | 39-61, 102-120 | **Missing :focus-visible on toggle/close buttons.** Same WCAG violation. |

---

## LOW BUGS (14)

| # | File | Line | Bug |
|---|------|------|-----|
| L1 | `api/evaluate-gemini.ts` | 84-85 | **NaN/Infinity in cost calc.** If tokens are NaN, `toFixed(6)` produces "NaN" string → corrupts JSON. |
| L2 | `api/evaluate-sonnet.ts` | 82-83 | **Same NaN/Infinity risk.** |
| L3 | `api/evaluate-gpt54.ts` | 80-81 | **Same NaN/Infinity risk.** |
| L4 | `api/evaluate-grok.ts` | 78-79 | **Same NaN/Infinity risk.** |
| L5 | `api/evaluate-perplexity.ts` | 80-81 | **Same NaN/Infinity risk.** |
| L6 | `src/lib/evaluationOrchestrator.ts` | 163-175 | **Cost accumulation doesn't guard Infinity.** Guards NaN but not Infinity. |
| L7 | `src/lib/relativeScoring.ts` | 85-96 | **Input mutation.** `ms.rawConsensusScore = ms.score` mutates input objects. If reused elsewhere, side effects occur. |
| L8 | `src/lib/coverageTracker.ts` | 145-165 | **signalConsistency initialized to 1 with zero data.** Should be 0 or NaN, not "perfect coherence". |
| L9 | `src/lib/coverageTracker.ts` | 288 | **DNW strength calc uses layered multiplication.** `severity * 0.1 * 0.3` = 0.03-0.15 range. Obscure, not documented. |
| L10 | `api/tavily-research.ts` | 361 | **Cost tracking logs queriesExecuted as input_tokens.** Semantic mismatch. |
| L11 | `api/tavily-search.ts` | 320 | **Cost tracking logs searchesExecuted as input_tokens.** Same semantic mismatch. |
| L12 | `src/lib/profileSignalBridge.ts` | 92 | **GeminiMetricObject.source field lost during conversion.** Metadata dropped when converting to EvaluationMetric. |
| L13 | `src/lib/adaptiveEngine.ts` | 283-305 | **selectNextQuestion loop fragile.** Sets module complete then nulls reference. Works but not resilient to future edits. |
| L14 | `src/lib/answerAggregator.ts` | 482 | **Silent localStorage failure.** Mini module extraction swallows all errors. Should log warnings. |

---

## WCAG-SPECIFIC VIOLATIONS (included in counts above)

| # | Component | Issue |
|---|-----------|-------|
| H19 | ReactiveJustification.tsx | `score-red` (#ef4444) contrast 4.35:1 < 4.5:1 required |
| H20 | SideBySideMetricView.tsx | `score-red` (#ef4444) same violation |
| H20b | FileUpload.tsx (L165, L210) | `score-red` (#ef4444) used for error text and button |
| M21 | ReasoningTrace.tsx | Missing :focus-visible on interactive button |
| M22 | ThinkingDetailsPanel.tsx | Missing :focus-visible on toggle/close buttons |
| M22b | SideBySideMetricView.tsx (L174-220, L280-295) | Missing :focus-visible on filter/row buttons |
| M22c | ReactiveJustification.tsx (L82-137) | Missing :focus-visible on metric button |

---

## PATTERN ANALYSIS — Systemic Issues

### Pattern 1: Inconsistent questionId parsing (H13-H16, M13, M17)
**6 occurrences** across 4 files. `answerAggregator.ts` uses `.replace(/\D/g, '')` before `parseInt`. `coverageTracker.ts` and `moduleRelevanceEngine.ts` use bare `parseInt`. If questionId format is "q35" or "dnw_q35", the bare parseInt returns NaN.

### Pattern 2: Unhandled JSON.parse in catch blocks (H5-H9, M1)
**6 occurrences** across 6 files. Every evaluation endpoint has a try/catch where the catch block does a second `JSON.parse(cleaned)` with no error handling. If both parses fail, the handler crashes.

### Pattern 3: Missing retry logic (H1-H4)
**4 of 5** evaluation endpoints lack retry logic on 429/5xx. Only `evaluate-gemini.ts` has exponential backoff. The other 4 LLMs fail immediately on rate limits.

### Pattern 4: NaN/Infinity cost propagation (L1-L6)
**6 occurrences**. If any LLM returns malformed token counts, NaN propagates through cost calculations and corrupts JSON responses.

### Pattern 5: WCAG :focus-visible missing (M21, M22, M22b, M22c)
**All 4** Results components lack :focus-visible outlines on interactive elements. Systematic WCAG 2.1 AA violation.

---

## RECOMMENDED FIX ORDER

1. **C1 + C2**: Fix Gemini pricing rates (trivial — change 2 constants in 2 files)
2. **C3**: Fix judgeOrchestrator avgStdDev math (1-line fix, high impact)
3. **C4**: Fix evaluationPipeline cost calculation (wire actual metadata.costUsd)
4. **H1-H4**: Add retry logic to 4 evaluation endpoints (copy from evaluate-gemini)
5. **H5-H9 + M1**: Wrap second JSON.parse in try/catch across all 6 endpoints
6. **H13-H16 + M17**: Standardize questionId parsing (extract helper function)
7. **H19-H20**: Replace #ef4444 with WCAG-compliant red across Results components
8. **M21-M22**: Add :focus-visible to all Results component buttons

---

*This report was generated by 6 parallel audit agents and consolidated. No files were modified.*
