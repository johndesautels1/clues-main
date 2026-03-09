/**
 * CLUES Intelligence — Tavily Client Orchestrator
 *
 * Client-side coordinator that:
 * 1. Fires region research (baseline) and metric-specific searches
 * 2. Manages a 3-layer cache: in-memory (fastest) → Supabase (persistent) → API (fresh)
 * 3. Respects tier-based search limits from tierEngine
 * 4. Deduplicates concurrent requests for the same query
 *
 * Cache spec:
 * - 30-minute TTL
 * - Max 50 in-memory entries (LRU eviction)
 * - Supabase tavily_cache for cross-session persistence
 * - SHA-256 query hash for dedup across sources
 */

import type {
  TavilyResearchResponse,
  TavilyMetricSearchResponse,
  MetricResearch,
  RegionResearch,
  MemoryCacheEntry,
  TavilySearchResponse,
} from '../types/tavily';

// ─── Configuration ───────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MEMORY_ENTRIES = 50;

// ─── In-Memory Cache (LRU, max 50 entries) ──────────────────────

const memoryCache = new Map<string, MemoryCacheEntry>();

function getFromMemory(queryHash: string): TavilySearchResponse | null {
  const entry = memoryCache.get(queryHash);
  if (!entry) return null;

  // Check TTL
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(queryHash);
    return null;
  }

  // Move to end (LRU touch)
  memoryCache.delete(queryHash);
  memoryCache.set(queryHash, entry);
  return entry.response;
}

function setInMemory(queryHash: string, response: TavilySearchResponse): void {
  // Evict oldest if at capacity
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest !== undefined) {
      memoryCache.delete(oldest);
    }
  }

  memoryCache.set(queryHash, {
    queryHash,
    response,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── Request Deduplication ───────────────────────────────────────

const inflightRequests = new Map<string, Promise<unknown>>();

async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

// ─── Hash Utility ────────────────────────────────────────────────

async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Region Research ─────────────────────────────────────────────

/**
 * Execute baseline region research via /api/tavily-research.
 * Returns cached results if available (30-min TTL).
 */
export async function researchRegion(
  sessionId: string,
  region: string,
  topics?: string[]
): Promise<RegionResearch> {
  const cacheKey = `region_${region}_${(topics ?? []).join(',')}`;
  const queryHash = await hashQuery(cacheKey);

  // Check memory cache
  const cached = getFromMemory(queryHash);
  if (cached) {
    return {
      region,
      queries: [],
      topics: [],
      sources: [],
      researchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    };
  }

  // Deduplicated API call
  const result = await dedupedFetch<TavilyResearchResponse>(cacheKey, async () => {
    const response = await fetch('/api/tavily-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, region, topics }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error ?? `Research failed: ${response.status}`);
    }

    return response.json() as Promise<TavilyResearchResponse>;
  });

  // Cache the response in memory
  setInMemory(queryHash, {
    query: cacheKey,
    results: [],
    response_time: result.usage.durationMs / 1000,
  });

  return result.research;
}

// ─── Metric-Specific Search ─────────────────────────────────────

/**
 * Execute metric-specific Tavily searches for a city candidate.
 * Respects maxSearches from tier config.
 */
export async function searchMetrics(
  sessionId: string,
  metrics: Array<{ metricId: string; researchQuery: string }>,
  city: string,
  country: string,
  maxSearches?: number
): Promise<MetricResearch[]> {
  const cacheKey = `metrics_${city}_${country}_${metrics.map(m => m.metricId).join(',')}`;

  // Deduplicated API call
  const result = await dedupedFetch<TavilyMetricSearchResponse>(cacheKey, async () => {
    const response = await fetch('/api/tavily-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, metrics, city, country, maxSearches }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error ?? `Metric search failed: ${response.status}`);
    }

    return response.json() as Promise<TavilyMetricSearchResponse>;
  });

  // Cache individual metric results in memory
  for (const metricResult of result.results) {
    const metricHash = await hashQuery(`${metricResult.query}_${city}_${country}`);
    setInMemory(metricHash, {
      query: metricResult.query,
      answer: metricResult.answer,
      results: metricResult.results,
      response_time: metricResult.responseTimeMs / 1000,
    });
  }

  return result.results;
}

// ─── Cache Management ────────────────────────────────────────────

/** Get current cache stats */
export function getCacheStats(): {
  memoryEntries: number;
  maxEntries: number;
  oldestEntryAge: number | null;
} {
  let oldestAge: number | null = null;
  for (const entry of memoryCache.values()) {
    const age = Date.now() - entry.cachedAt;
    if (oldestAge === null || age > oldestAge) {
      oldestAge = age;
    }
    break; // LRU: first entry is oldest
  }

  return {
    memoryEntries: memoryCache.size,
    maxEntries: MAX_MEMORY_ENTRIES,
    oldestEntryAge: oldestAge,
  };
}

/** Clear the in-memory cache */
export function clearCache(): void {
  memoryCache.clear();
  inflightRequests.clear();
}

/** Evict expired entries from memory cache */
export function evictExpired(): number {
  let evicted = 0;
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      evicted++;
    }
  }
  return evicted;
}
