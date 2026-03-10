/**
 * Shared utilities for Tavily API serverless endpoints.
 *
 * H3/L1 fix: Extracted from api/tavily-research.ts and api/tavily-search.ts
 * to eliminate ~120 lines of duplicated code. Both endpoints import from here.
 *
 * Contains:
 * - Shared types (inlined for serverless — no src/ imports)
 * - Source URL extraction & validation
 * - Tavily API call with retry + timeout (H1, H2 fixes)
 * - SHA-256 query hashing
 * - Supabase cache read/write
 * - Cost tracking
 * - Input sanitization (H4 fix)
 */

// ─── Types (inlined to avoid src/ imports in serverless) ─────────

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
  published_date?: string;
}

export interface TavilyAPIResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  response_time: number;
}

export interface SourceURL {
  url: string;
  title: string;
  domain: string;
  relevanceScore: number;
  snippet: string;
  publishedDate?: string;
  isGovernment: boolean;
  isAcademic: boolean;
}

// ─── Source URL Validation ───────────────────────────────────────

// Anchored to TLD position to avoid false positives (e.g., governance.com)
const GOV_PATTERN = /\.gov(\.[a-z]{2})?$/i;
const MIL_PATTERN = /\.mil(\.[a-z]{2})?$/i;
const GOV_ORGS = ['.europa.eu', '.un.org', '.who.int', '.oecd.org'];
const EDU_PATTERN = /\.edu(\.[a-z]{2})?$/i;
const AC_PATTERN = /\.ac\.[a-z]{2}$/i;
const ACADEMIC_HOSTS = ['scholar.google.com', 'researchgate.net', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov'];

export function extractSourceURL(result: TavilySearchResult): SourceURL {
  let domain = '';
  try {
    domain = new URL(result.url).hostname.toLowerCase();
  } catch {
    domain = (result.url.split('/')[2] ?? '').toLowerCase();
  }

  const isGovernment =
    GOV_PATTERN.test(domain) ||
    MIL_PATTERN.test(domain) ||
    GOV_ORGS.some(d => domain.endsWith(d));

  const isAcademic =
    EDU_PATTERN.test(domain) ||
    AC_PATTERN.test(domain) ||
    ACADEMIC_HOSTS.some(d => domain === d || domain.endsWith('.' + d));

  // M6 fix: Truncate snippet at word boundary instead of mid-word
  let snippet = result.content;
  if (snippet.length > 300) {
    const lastSpace = snippet.lastIndexOf(' ', 300);
    snippet = snippet.slice(0, lastSpace > 200 ? lastSpace : 300) + '...';
  }

  return {
    url: result.url,
    title: result.title,
    domain,
    relevanceScore: result.score,
    snippet,
    publishedDate: result.published_date,
    isGovernment,
    isAcademic,
  };
}

export function isValidSourceURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

// ─── Tavily API Call (with retry + timeout) ──────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // exponential backoff
const SEARCH_TIMEOUT_MS = 20_000; // 20s per individual search

/**
 * H1 fix: Retry logic with exponential backoff for 429/5xx.
 * H2 fix: AbortController timeout per request.
 * C1 note: api_key is Tavily's required body parameter — their API does not
 *   support header-based auth as of 2026. Key is NOT logged in error paths.
 */
export async function searchTavily(
  apiKey: string,
  query: string
): Promise<TavilyAPIResponse> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'advanced',
          topic: 'general',
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const status = response.status;
        // H1 fix: Retry on 429 (rate limit) and 5xx (server error)
        if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
          console.warn(`[Tavily] ${status} on attempt ${attempt + 1}, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }
        const errorText = await response.text();
        throw new Error(`Tavily API error ${status}: ${errorText}`);
      }

      return response.json() as Promise<TavilyAPIResponse>;
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort && attempt < MAX_RETRIES) {
        console.warn(`[Tavily] Timeout on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Tavily search exhausted all retries');
}

// ─── Hash Utility ────────────────────────────────────────────────

export async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Supabase Cache ──────────────────────────────────────────────

export async function getCached(
  queryHash: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<TavilyAPIResponse | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tavily_cache?query_hash=eq.${queryHash}&expires_at=gt.${new Date().toISOString()}&select=response&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length > 0 ? rows[0].response : null;
  } catch {
    return null;
  }
}

export async function setCache(
  queryHash: string,
  query: string,
  response: TavilyAPIResponse,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  try {
    const sourceUrls = (response.results ?? [])
      .map((r: TavilySearchResult) => r.url)
      .filter(Boolean);

    await fetch(`${supabaseUrl}/rest/v1/tavily_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify({
        query_hash: queryHash,
        query_text: query,
        response,
        result_count: response.results?.length ?? 0,
        source_urls: sourceUrls,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30-min TTL
      }),
    });
  } catch (err) {
    console.warn('[tavily-utils] Cache write failed:', err);
  }
}

// ─── Cost Tracking ───────────────────────────────────────────────

// L2 fix: Estimate Tavily cost ($0.02/search for advanced depth)
const TAVILY_COST_PER_SEARCH_USD = 0.02;

export async function trackCost(entry: {
  sessionId: string;
  endpoint: string;
  searchesExecuted: number; // M3 fix: Standardized name
  durationMs: number;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/cost_tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        session_id: entry.sessionId,
        model: 'tavily',
        endpoint: entry.endpoint,
        // input_tokens repurposed: stores searches_executed for Tavily (not LLM tokens)
        input_tokens: entry.searchesExecuted,
        output_tokens: 0,
        // L2 fix: Estimate cost instead of hardcoding 0
        cost_usd: entry.searchesExecuted * TAVILY_COST_PER_SEARCH_USD,
        duration_ms: entry.durationMs,
      }),
    });
  } catch (err) {
    console.warn('[CostTracking] Failed to log Tavily cost:', err);
  }
}

// ─── Input Sanitization ─────────────────────────────────────────

/**
 * H4 fix: Sanitize user-provided region/string inputs.
 * - Strips HTML/script tags
 * - Truncates to maxLen characters
 * - Removes control characters
 */
export function sanitizeInput(input: string, maxLen = 200): string {
  return input
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[\x00-\x1f\x7f]/g, '')  // Strip control characters
    .trim()
    .slice(0, maxLen);
}
