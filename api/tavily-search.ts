/**
 * /api/tavily-search — Vercel Serverless
 *
 * Metric-specific Tavily search per city. Receives metric research_queries
 * from Gemini extraction and searches for city-specific data.
 *
 * Flow: Client → tavilyClient.ts → POST /api/tavily-search → Tavily API
 *       → response cached in Supabase tavily_cache → returned to client
 *       → results passed to evaluation LLMs (Grok, Sonnet, GPT, etc.)
 *
 * Env: TAVILY_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types (inlined for serverless) ──────────────────────────────

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
  published_date?: string;
}

interface TavilyAPIResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  response_time: number;
}

interface SourceURL {
  url: string;
  title: string;
  domain: string;
  relevanceScore: number;
  snippet: string;
  publishedDate?: string;
  isGovernment: boolean;
  isAcademic: boolean;
}

interface MetricResearch {
  metricId: string;
  query: string;
  city: string;
  results: TavilySearchResult[];
  sources: SourceURL[];
  answer?: string;
  responseTimeMs: number;
}

// ─── Source URL Extraction ───────────────────────────────────────

// Anchored to TLD position to avoid false positives (e.g., governance.com)
const GOV_PATTERN = /\.gov(\.[a-z]{2})?$/i;
const MIL_PATTERN = /\.mil(\.[a-z]{2})?$/i;
const GOV_ORGS = ['.europa.eu', '.un.org', '.who.int', '.oecd.org'];
const EDU_PATTERN = /\.edu(\.[a-z]{2})?$/i;
const AC_PATTERN = /\.ac\.[a-z]{2}$/i;
const ACADEMIC_HOSTS = ['scholar.google.com', 'researchgate.net', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov'];

function extractSourceURL(result: TavilySearchResult): SourceURL {
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

  return {
    url: result.url,
    title: result.title,
    domain,
    relevanceScore: result.score,
    snippet: result.content.slice(0, 300),
    publishedDate: result.published_date,
    isGovernment,
    isAcademic,
  };
}

function isValidSourceURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

// ─── Tavily API Call ─────────────────────────────────────────────

async function searchTavily(
  apiKey: string,
  query: string
): Promise<TavilyAPIResponse> {
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<TavilyAPIResponse>;
}

// ─── Hash Utility ────────────────────────────────────────────────

async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Supabase Cache ──────────────────────────────────────────────

async function getCached(
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

async function setCache(
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
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });
  } catch (err) {
    console.warn('[/api/tavily-search] Cache write failed:', err);
  }
}

// ─── Cost Tracking ───────────────────────────────────────────────

async function trackCost(entry: {
  sessionId: string;
  endpoint: string;
  searchesExecuted: number;
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
        cost_usd: 0, // Tavily cost tracked separately via API dashboard
        duration_ms: entry.durationMs,
      }),
    });
  } catch (err) {
    console.warn('[CostTracking] Failed to log Tavily cost:', err);
  }
}

// ─── Handler ─────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startTime = Date.now();

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'TAVILY_API_KEY not configured' });
    return;
  }

  const body = req.body as {
    sessionId?: string;
    metrics?: Array<{ metricId: string; researchQuery: string }>;
    city?: string;
    country?: string;
    maxSearches?: number;
  };

  if (!body.sessionId || !body.metrics || !body.city || !body.country) {
    res.status(400).json({ error: 'Missing required fields: sessionId, metrics, city, country' });
    return;
  }

  const { sessionId, city, country } = body;
  const maxSearches = Math.min(body.maxSearches ?? 100, 200); // Default to 100, hard cap 200
  const metrics = body.metrics.slice(0, maxSearches); // Enforce tier limit

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasCache = Boolean(supabaseUrl && supabaseKey);

  try {
    const results: MetricResearch[] = [];
    let cacheHits = 0;

    // Execute metric searches in parallel batches of 5
    for (let i = 0; i < metrics.length; i += 5) {
      const batch = metrics.slice(i, i + 5);

      const batchResults = await Promise.all(
        batch.map(async ({ metricId, researchQuery }) => {
          // Append city + country for location specificity
          const query = `${researchQuery} ${city} ${country}`;
          const queryHash = await hashQuery(query);
          const searchStart = Date.now();

          // Check cache
          if (hasCache) {
            const cached = await getCached(queryHash, supabaseUrl!, supabaseKey!);
            if (cached) {
              cacheHits++;
              return buildMetricResult(metricId, query, city, cached, Date.now() - searchStart);
            }
          }

          // Fresh search
          const response = await searchTavily(apiKey, query);

          // Cache
          if (hasCache) {
            await setCache(queryHash, query, response, supabaseUrl!, supabaseKey!);
          }

          return buildMetricResult(metricId, query, city, response, Date.now() - searchStart);
        })
      );

      results.push(...batchResults);
    }

    const durationMs = Date.now() - startTime;
    const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);

    // Track cost
    trackCost({
      sessionId,
      endpoint: '/api/tavily-search',
      searchesExecuted: metrics.length - cacheHits,
      durationMs,
    });

    res.status(200).json({
      results,
      usage: {
        searchesExecuted: metrics.length,
        cacheHits,
        totalResults,
        durationMs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/tavily-search] Error:', message);
    res.status(500).json({
      error: 'Tavily metric search failed',
      detail: message,
      durationMs: Date.now() - startTime,
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildMetricResult(
  metricId: string,
  query: string,
  city: string,
  response: TavilyAPIResponse,
  responseTimeMs: number
): MetricResearch {
  const validResults = (response.results ?? []).filter(r => isValidSourceURL(r.url));
  const sources = validResults.map(extractSourceURL);

  return {
    metricId,
    query,
    city,
    results: validResults,
    sources,
    answer: response.answer,
    responseTimeMs,
  };
}
