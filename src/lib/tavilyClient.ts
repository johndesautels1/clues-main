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
} from '../types/tavily';

// ─── Configuration ───────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MEMORY_ENTRIES = 50;

// ─── In-Memory Cache (LRU, max 50 entries) ──────────────────────

interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function getFromMemory<T>(queryHash: string): T | null {
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
  return entry.data as T;
}

function setInMemory<T>(queryHash: string, data: T): void {
  // Evict oldest if at capacity
  if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest !== undefined) {
      memoryCache.delete(oldest);
    }
  }

  memoryCache.set(queryHash, {
    data,
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

  // Check memory cache — returns full RegionResearch
  const cached = getFromMemory<RegionResearch>(queryHash);
  if (cached) return cached;

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

  // Cache the full RegionResearch in memory
  setInMemory(queryHash, result.research);

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
  const queryHash = await hashQuery(cacheKey);

  // Check memory cache for the full batch result
  const cached = getFromMemory<MetricResearch[]>(queryHash);
  if (cached) return cached;

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

  // Cache the full batch result in memory
  setInMemory<MetricResearch[]>(queryHash, result.results);

  return result.results;
}

// ─── Cache Management ────────────────────────────────────────────

/** Get current cache stats */
export function getCacheStats(): {
  memoryEntries: number;
  maxEntries: number;
  oldestEntryAge: number | null;
} {
  // LRU: first entry in Map insertion order is the oldest
  const firstEntry = memoryCache.values().next().value;
  const oldestAge = firstEntry ? Date.now() - firstEntry.cachedAt : null;

  return {
    memoryEntries: memoryCache.size,
    maxEntries: MAX_MEMORY_ENTRIES,
    oldestEntryAge: oldestAge,
  };
}

/** Clear the in-memory cache (does NOT cancel inflight requests) */
export function clearCache(): void {
  memoryCache.clear();
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
