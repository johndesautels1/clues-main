/**
 * CLUES Intelligence — Tavily Research Types
 *
 * Tavily is our real-time web search backend. Two endpoints:
 * 1. tavily-research: Baseline region research (climate, cost, safety, etc.)
 * 2. tavily-search: Metric-specific search per city candidate
 *
 * Results flow: Gemini metrics → research_query → Tavily → evaluation LLMs
 */

// ─── Tavily API Request Types ────────────────────────────────────

/** Tavily /search endpoint request body */
export interface TavilySearchRequest {
  query: string;
  search_depth?: 'basic' | 'advanced';
  topic?: 'general' | 'news' | 'finance';
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
}

/** Tavily /search endpoint response */
export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  response_time: number; // seconds (Tavily API returns seconds; convert to ms via * 1000 if needed)
}

/** A single search result from Tavily */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number; // relevance score 0-1
  published_date?: string;
}

// ─── CLUES-Specific Types ────────────────────────────────────────

/** A validated source URL extracted from Tavily results */
export interface SourceURL {
  url: string;
  title: string;
  domain: string;
  relevanceScore: number; // 0-1
  snippet: string;
  publishedDate?: string;
  isGovernment: boolean;
  isAcademic: boolean;
}

/** Baseline research result for a region (tavily-research endpoint) */
export interface RegionResearch {
  /** Region name (e.g., "Southeast Asia", "Western Europe") */
  region: string;

  /** Research queries executed */
  queries: string[];

  /** Aggregated results organized by topic */
  topics: RegionResearchTopic[];

  /** All validated source URLs */
  sources: SourceURL[];

  /** When this research was performed */
  researchedAt: string;

  /** TTL expiration */
  expiresAt: string;
}

/** A research topic within a region */
export interface RegionResearchTopic {
  topic: string; // e.g., "cost_of_living", "safety", "healthcare"
  summary: string; // Tavily's AI answer for this topic
  results: TavilySearchResult[];
  sourceCount: number;
}

/** Metric-specific search result (tavily-search endpoint) */
export interface MetricResearch {
  /** Gemini metric ID this search supports */
  metricId: string;

  /** The research query (from GeminiMetricObject.research_query) */
  query: string;

  /** City this search targeted */
  city: string;

  /** Search results */
  results: TavilySearchResult[];

  /** Validated source URLs */
  sources: SourceURL[];

  /** Tavily's AI-generated answer (if available) */
  answer?: string;

  /** Response time in ms */
  responseTimeMs: number;
}

// ─── Request/Response Types for Our API Routes ──────────────────

/** POST body for /api/tavily-research */
export interface TavilyResearchRequest {
  sessionId: string;
  region: string;
  topics?: string[]; // Override default topics
}

/** Response from /api/tavily-research */
export interface TavilyResearchResponse {
  research: RegionResearch;
  usage: {
    queriesExecuted: number;
    cacheHits: number;
    totalResults: number;
    uniqueSources: number;
    durationMs: number;
  };
}

/** POST body for /api/tavily-search */
export interface TavilyMetricSearchRequest {
  sessionId: string;
  metrics: Array<{
    metricId: string;
    researchQuery: string;
  }>;
  city: string;
  country: string;
  maxSearches?: number; // Tier-limited
}

/** Response from /api/tavily-search */
export interface TavilyMetricSearchResponse {
  results: MetricResearch[];
  usage: {
    searchesExecuted: number;
    cacheHits: number;
    totalResults: number;
    durationMs: number;
  };
}

// ─── Cache Types ─────────────────────────────────────────────────

/**
 * Cache entry for tavily_cache Supabase table (matches schema.sql columns).
 * L8 fix: response field stores the raw Tavily API response which matches
 * TavilySearchResponse structurally. The serverless endpoints use an inlined
 * TavilyAPIResponse type (identical structure) defined in api/_shared/tavily-utils.ts.
 */
export interface TavilyCacheEntry {
  id?: string;
  query_hash: string;      // SHA-256 of normalized query (UNIQUE)
  query_text: string;      // original search query
  response: TavilySearchResponse;
  result_count: number;
  source_urls: string[];
  expires_at: string;      // 30-min TTL
  created_at?: string;
}

/** Generic in-memory cache entry with TTL tracking (used by tavilyClient.ts) */
export interface MemoryCacheEntry<T = unknown> {
  data: T;
  cachedAt: number;  // Date.now()
  expiresAt: number; // Date.now() + TTL
}

// ─── Default Research Topics (for baseline region research) ──────

export const DEFAULT_RESEARCH_TOPICS = [
  'cost_of_living',
  'safety_crime',
  'healthcare_quality',
  'climate_weather',
  'internet_connectivity',
  'visa_immigration',
  'education_quality',
  'transportation',
  'cultural_diversity',
  'english_proficiency',
] as const;

export type ResearchTopic = typeof DEFAULT_RESEARCH_TOPICS[number];
