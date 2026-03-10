# Conv 9-10 Audit: Tavily Research Pipeline

> **Auditor**: Claude Opus 4.6
> **Date**: 2026-03-10
> **Scope**: `api/tavily-research.ts`, `api/tavily-search.ts`, `src/lib/tavilyClient.ts`, `src/types/tavily.ts`
> **Method**: Line-by-line code review against actual source files, cross-referenced with downstream consumers (evaluationOrchestrator.ts, evaluationPipeline.ts, tierEngine.ts, evaluation.ts types, schema.sql)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1     |
| HIGH     | 5     |
| MEDIUM   | 10    |
| LOW      | 9     |
| **TOTAL**| **25**|

---

## CRITICAL (1)

### C1 — API Key Sent in Request Body (Security)
**Files**: `api/tavily-research.ts:143`, `api/tavily-search.ts:114`
**Issue**: The Tavily API key is sent in the JSON request body (`api_key: apiKey`) instead of via an HTTP header. While Tavily's own docs show this pattern, request bodies are more likely to be logged by middleware, proxies, and APM tools than headers. In a Vercel serverless function with structured logging, the `body` object may be captured in error logs, exposing the key.
**Fix**: Move API key to header (`Authorization: Bearer ${apiKey}` or `x-api-key: ${apiKey}`). Verify Tavily's current API accepts header-based auth. If not, at minimum redact `api_key` from any error logging paths.
**Impact**: API key exposure in logs → unauthorized Tavily usage → cost overrun.

---

## HIGH (5)

### H1 — No Retry Logic on Tavily API Calls
**Files**: `api/tavily-research.ts:135-159`, `api/tavily-search.ts:106-130`
**Issue**: The `searchTavily()` function in both endpoints has zero retry logic. If the Tavily API returns a 429 (rate limit) or 5xx (server error), the entire batch fails immediately. All 5 LLM evaluation endpoints have retry with exponential backoff for these status codes, but the Tavily endpoints — which are the DATA source those LLMs depend on — do not.
**Fix**: Add retry with exponential backoff (2s, 4s, 8s) for 429 and 5xx responses, matching the pattern in `api/evaluate-*.ts`.

### H2 — No Request Timeout on Tavily API Calls
**Files**: `api/tavily-research.ts:139`, `api/tavily-search.ts:110`
**Issue**: `fetch('https://api.tavily.com/search', ...)` has no AbortController/timeout. If Tavily hangs, the Vercel function will hit its 10s/30s limit and return a 504 with no useful error. The evaluation endpoints all use AbortController with dynamic timeouts.
**Fix**: Add `AbortController` with a reasonable timeout (15-20s per search call).

### H3 — Duplicate Code: ~120 Lines of Identical Logic Between Two API Files
**Files**: `api/tavily-research.ts:17-131`, `api/tavily-search.ts:18-102`
**Issue**: Both files contain identical copies of:
- `TavilySearchResult` interface (17 lines)
- `TavilyAPIResponse` interface (6 lines)
- `SourceURL` interface (10 lines)
- `extractSourceURL()` function (29 lines)
- `isValidSourceURL()` function (8 lines)
- `hashQuery()` function (7 lines)
- `searchTavily()` function (22 lines)
- Gov/academic regex patterns and constants (6 lines)

This is a maintenance hazard — fixing a bug in one file requires remembering to fix the other. While serverless functions intentionally inline types to avoid bundling src/, the shared utility code should be in a co-located `api/_shared/tavily-utils.ts` file.
**Fix**: Extract shared code into `api/_shared/tavily-utils.ts` and import from both endpoints (Vercel supports shared `_` prefixed directories).

### H4 — No Input Sanitization on `region` Parameter
**Files**: `api/tavily-research.ts:283-288`, `api/tavily-search.ts:262-265`
**Issue**: `body.region` is passed directly into search queries (`buildTopicQuery(topic, region)`) without sanitization. A malicious or corrupted `region` value could inject unwanted content into Tavily queries (prompt injection via search query). While not directly exploitable as code injection, it could lead to:
- Wasted API credits on garbage queries
- Cache poisoning (bad results stored under legitimate-looking hashes)
- Tavily API abuse detection flagging the account
**Fix**: Validate `region` against a reasonable format (string length, character whitelist, no HTML/script tags). Truncate to max 200 chars.

### H5 — `tavilyByMetric` Type Mismatch in evaluationPipeline.ts
**Files**: `src/lib/evaluationPipeline.ts:75,190`
**Issue**: `tavilyByMetric` is typed as `Record<string, unknown>` in the pipeline function signature (line 75), then force-cast to `Record<string, never>` when passed to `runEvaluation` (line 190). The orchestrator expects `Record<string, TavilyResult>` (from `src/types/evaluation.ts`). The `unknown → never` cast silences TypeScript but is semantically wrong — `never` means "no value can satisfy this type". This won't crash at runtime because JS ignores types, but it prevents TypeScript from catching actual type mismatches in the Tavily data flowing to LLM evaluators.
**Fix**: Type `tavilyByMetric` as `Record<string, TavilyResult>` in the pipeline function signature.

---

## MEDIUM (10)

### M1 — Cache Write Not Awaited Before Response
**Files**: `api/tavily-research.ts:327-329`, `api/tavily-search.ts:303-305`
**Issue**: `setCachedResearch()`/`setCache()` is awaited inside the `Promise.all` batch, which means each individual search waits for its own cache write before the batch resolves. This serializes the "search + cache" operations per item. More critically, if the cache write fails (network timeout, Supabase down), the search result is still valid but the batch promise rejects via the wrapping `try/catch` only at the individual search level — cache failures are caught (line 215-217/196-198) but the `await` still adds latency.
**Fix**: Fire cache writes with `void setCachedResearch(...)` (fire-and-forget) since the `try/catch` inside already handles failures silently. This reduces response latency.

### M2 — `trackCost()` Not Awaited, Errors Silently Swallowed
**Files**: `api/tavily-research.ts:359-364`, `api/tavily-search.ts:318-323`
**Issue**: `trackCost()` is called without `await` in `tavily-research.ts` (line 359: `trackCost({...})` — no await) but the function is `async`. In `tavily-search.ts` it's also not awaited (line 318). If cost tracking fails, the error is swallowed by the internal `try/catch`, but the Promise rejection is unhandled by the caller. Node.js/Vercel will log an `UnhandledPromiseRejection` warning.
**Fix**: Either `void trackCost(...)` to explicitly mark fire-and-forget, or `await trackCost(...)` with the internal catch already handling failures.

### M3 — Cost Tracking Logs `queries_executed` vs `searchesExecuted` Inconsistently
**Files**: `api/tavily-research.ts:253-255`, `api/tavily-search.ts:226-227`
**Issue**: `tavily-research.ts` uses `queriesExecuted` as the property name and maps it to `input_tokens`. `tavily-search.ts` uses `searchesExecuted`. The `cost_tracking` table stores these in the same `input_tokens` column. While functionally identical, the inconsistent naming makes it harder to audit cost records and understand what `input_tokens` means for Tavily rows.
**Fix**: Standardize on one name (e.g., `searchesExecuted`) across both endpoints.

### M4 — `DEFAULT_TOPICS` Duplicated Between API and Types
**Files**: `api/tavily-research.ts:53-64`, `src/types/tavily.ts:177-188`
**Issue**: The default topics array is defined identically in both files. `tavily.ts` exports `DEFAULT_RESEARCH_TOPICS` as a `const` array with proper `ResearchTopic` type extraction. The API file defines its own `DEFAULT_TOPICS` as a plain array. If topics are added/removed, both must be updated.
**Fix**: Since serverless functions can't easily import from `src/types/`, add a comment in the API file referencing the canonical source, or extract to `api/_shared/constants.ts`.

### M5 — `buildTopicQuery()` Returns Stale Date-Pinned Queries
**File**: `api/tavily-research.ts:68-82`
**Issue**: Several query templates are hardcoded with "2025 2026" (e.g., `cost of living index ${region} 2025 2026`). Since today is 2026-03-10, this is currently fine but will become stale in 2027. The year should be dynamic.
**Fix**: Use `new Date().getFullYear()` to inject the current year and previous year dynamically.

### M6 — `snippet` Truncation Without Word Boundary
**Files**: `api/tavily-research.ts:117`, `api/tavily-search.ts:88`
**Issue**: `result.content.slice(0, 300)` cuts content at exactly 300 characters, potentially mid-word or mid-sentence. This truncated text is stored in the `SourceURL.snippet` field and may be displayed to users in the report.
**Fix**: Find the last space before position 300 and truncate there, appending "..." for clarity.

### M7 — Memory Cache `firstEntry` Type Safety
**File**: `src/lib/tavilyClient.ts:188`
**Issue**: `memoryCache.values().next().value` returns `CacheEntry | undefined`. The code uses `firstEntry.cachedAt` without a null check — but the ternary on line 189 does protect it (`firstEntry ? Date.now() - firstEntry.cachedAt : null`). However, TypeScript's `Iterator.next().value` can be typed as `T | undefined` depending on config, which may cause a type error in stricter tsconfig settings.
**Fix**: Add explicit type annotation: `const firstEntry = memoryCache.values().next().value as CacheEntry | undefined`.

### M8 — `dedupedFetch` Shares Promise Rejections Across Callers
**File**: `src/lib/tavilyClient.ts:75-85`
**Issue**: When two concurrent calls for the same `key` arrive, the second caller receives the same Promise as the first. If the first request fails, BOTH callers receive the same rejection. The `.finally()` cleanup runs, but the error isn't wrapped or re-thrown with context. The second caller has no way to distinguish "my request failed" from "someone else's identical request failed".
**Fix**: This is acceptable behavior for dedup (both callers want the same result), but the error should be re-thrown with the original key for debugging: `catch(err => { throw new Error(\`Deduped fetch failed for ${key}: ${err}\`); })`.

### M9 — `searchMetrics` Cache Key Doesn't Include `maxSearches`
**File**: `src/lib/tavilyClient.ts:150`
**Issue**: The cache key for metric searches is `metrics_${city}_${country}_${metrics.map(m => m.metricId).join(',')}` but doesn't include `maxSearches`. If two calls with different `maxSearches` values (e.g., 10 vs 200) arrive for the same city/metrics, the second call may return the first's cached result, which could have fewer metrics than expected.
**Fix**: Include `maxSearches` in the cache key.

### M10 — No CORS Headers on API Endpoints
**Files**: `api/tavily-research.ts`, `api/tavily-search.ts`
**Issue**: Neither endpoint returns CORS headers. While Vercel's `vercel.json` may handle CORS globally, the endpoints themselves don't handle OPTIONS preflight requests or set `Access-Control-Allow-*` headers. If the SPA is served from a different origin during development or staging, these endpoints will fail with CORS errors.
**Fix**: Add CORS handling (at minimum OPTIONS method support and appropriate headers) or verify that `vercel.json` handles this globally and document the dependency.

---

## LOW (9)

### L1 — `hashQuery()` Triplicated Across 3 Files
**Files**: `api/tavily-research.ts:222-228`, `api/tavily-search.ts:134-140`, `src/lib/tavilyClient.ts:89-95`
**Issue**: The exact same SHA-256 hashing function is copy-pasted in 3 files. Any fix to the hashing logic (e.g., additional normalization) must be applied 3 times.
**Fix**: Extract to `api/_shared/tavily-utils.ts` for API files, keep `tavilyClient.ts` copy (client-side needs its own since it can't import from `api/`).

### L2 — `cost_usd: 0` Hardcoded — No Tavily Cost Estimation
**Files**: `api/tavily-research.ts:258`, `api/tavily-search.ts:229`
**Issue**: Cost tracking logs `cost_usd: 0` for all Tavily requests. The comment says "Tavily cost tracked separately via API dashboard". This means the `cost_tracking` table has no actual cost data for Tavily, making total-cost-per-user calculations undercount.
**Fix**: Estimate cost based on Tavily's pricing ($0.01/search for basic, $0.02/search for advanced) and store the estimate. Even approximate tracking is better than zero.

### L3 — `response_time` Type Mismatch Between Tavily API and Internal Types
**Files**: `src/types/tavily.ts:30`, `api/tavily-search.ts:52`
**Issue**: `TavilySearchResponse.response_time` is typed as `number` with comment "seconds" (line 30). But `MetricResearch.responseTimeMs` (line 107) is in milliseconds. The API handler in `tavily-search.ts` measures its own `Date.now()` delta (line 288, 307) in ms and stores that — it never uses `response.response_time` from Tavily. So the Tavily-reported latency is silently discarded.
**Fix**: Either capture and expose `response.response_time` (converting s → ms) alongside the measured duration, or add a comment explaining why it's intentionally ignored.

### L4 — `getBaseUrl()` Not Defined in evaluationOrchestrator.ts Context
**File**: `src/lib/evaluationOrchestrator.ts:258` (downstream consumer)
**Issue**: Not a Tavily bug per se, but the orchestrator that consumes Tavily results calls `getBaseUrl()` to construct API URLs. If this function isn't imported or defined, the evaluation calls that pass `tavilyResearch` to LLMs will fail.
**Note**: Verified this is defined earlier in the file — false positive.

### L5 — `query_hash` UNIQUE Constraint May Cause Race Condition
**Files**: `supabase/schema.sql:683`, `api/tavily-research.ts:198-218`
**Issue**: The `tavily_cache` table has `query_hash text not null unique`. The cache write uses `Prefer: resolution=merge-duplicates` which is the Supabase/PostgREST upsert mechanism. However, if two concurrent requests for the same query arrive before either caches, both will call `searchTavily()` (wasting an API call), then both will try to upsert. The `merge-duplicates` header handles the conflict gracefully, but the duplicate API call is wasted money.
**Fix**: The `dedupedFetch` in `tavilyClient.ts` prevents this at the client level. But if two different user sessions hit the serverless function simultaneously for the same query, there's no server-side dedup. This is an accepted limitation — the cache write handles it safely.

### L6 — `topics` Parameter Not Validated
**File**: `api/tavily-research.ts:291`
**Issue**: `body.topics ?? DEFAULT_TOPICS` accepts any array of strings. If a caller passes `["'; DROP TABLE tavily_cache; --"]`, this becomes a Tavily search query (not a SQL injection since it goes to Tavily's API, not our DB). But it wastes API credits and pollutes the cache.
**Fix**: Validate topics against `DEFAULT_TOPICS` or a whitelist.

### L7 — `maxSearches` Cap at 200 May Conflict with Tier Config
**Files**: `api/tavily-search.ts:268`, `src/lib/tierEngine.ts:351,359`
**Issue**: The API hard-caps `maxSearches` at 200 (`Math.min(body.maxSearches ?? 100, 200)`). The tier config for `precision` tier says `tavilySearches: 200 // +20 per completed module`. If a user has completed all 23 modules, the intended search count would be 200 + (23 × 20) = 660, but the API caps it at 200. The "+20 per completed module" comment is misleading.
**Fix**: Either increase the hard cap to accommodate the bonus, or update the tier config comment to clarify that 200 is the ceiling.

### L8 — `TavilyCacheEntry.response` Type Uses `TavilySearchResponse` Not `TavilyAPIResponse`
**File**: `src/types/tavily.ts:161`
**Issue**: The cache entry type references `TavilySearchResponse` which has `response_time: number` (line 30). But the serverless endpoints inline their own `TavilyAPIResponse` type (which is identical). This is a cosmetic inconsistency — the types are structurally identical so no runtime issue, but it could cause confusion during maintenance.
**Fix**: Ensure the inlined API types reference the same field names and shapes.

### L9 — No Cache Expiry Cleanup Mechanism
**Files**: `supabase/schema.sql:891-898`, `src/lib/tavilyClient.ts:204-213`
**Issue**: The schema has a comment about periodic TTL-based deletion, but no actual scheduled cleanup (no pg_cron job, no Supabase Edge Function). The in-memory cache has `evictExpired()` but it's never called automatically — it's only exported for manual use. Over time, the `tavily_cache` table will accumulate expired rows.
**Fix**: Add a Supabase pg_cron job or Edge Function to periodically delete rows where `expires_at < now()`. Call `evictExpired()` before cache reads in `tavilyClient.ts`.

---

## False Positives / Verified Correct

1. **SHA-256 hashing uses `crypto.subtle`**: Available in both browser (client) and Vercel Edge/Node 18+ (server). No compatibility issue.
2. **`Prefer: resolution=merge-duplicates`**: Correct PostgREST header for upsert on `query_hash` UNIQUE constraint.
3. **Batch sizes (3 for research, 5 for search)**: Reasonable rate-limit mitigation. Tavily's rate limits are generous enough for these batch sizes.
4. **Source URL validation**: `isValidSourceURL()` correctly checks protocol and hostname format. `extractSourceURL()` correctly classifies government and academic domains using TLD-anchored patterns.
5. **LRU eviction in memory cache**: Correctly uses Map insertion-order semantics (delete + re-insert = move to end).
6. **`dedupedFetch` Promise sharing**: Correct dedup pattern — both callers want the same result, sharing the Promise is intentional.
7. **`api_key` in Tavily request body**: This is Tavily's documented API pattern as of 2026. The API does not currently support header-based auth. C1 still stands as a security concern for logging.

---

## Integration Verification

| Integration Point | Status | Notes |
|---|---|---|
| `tavilyClient.ts` → `api/tavily-research.ts` | OK | POST body matches handler's `req.body` destructuring |
| `tavilyClient.ts` → `api/tavily-search.ts` | OK | POST body matches handler's `req.body` destructuring |
| `evaluationOrchestrator.ts` → `TavilyResult` type | OK | Correctly filters metrics and passes to LLMs |
| `evaluationPipeline.ts` → `tavilyByMetric` | **BUG (H5)** | `Record<string, unknown>` → `Record<string, never>` cast |
| `tierEngine.ts` → `tavilySearches` | **BUG (L7)** | Precision tier comment says +20/module but API caps at 200 |
| `schema.sql` → `tavily_cache` table | OK | Columns match what API endpoints write |
| `types/tavily.ts` → API inlined types | OK | Structurally identical (L8 is cosmetic) |

---

## Priority Fix Order

1. **H1** — Add retry logic to Tavily API calls (reliability)
2. **H2** — Add AbortController timeout (reliability)
3. **C1** — Assess API key logging risk, add redaction (security)
4. **H5** — Fix type cast in evaluationPipeline.ts (type safety)
5. **H4** — Add input sanitization on region/topics (security)
6. **H3** — Extract shared code to reduce duplication (maintainability)
7. **M1-M10** — Medium fixes in priority order
8. **L1-L9** — Low fixes as time permits
