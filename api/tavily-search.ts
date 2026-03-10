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
import {
  searchTavily,
  hashQuery,
  getCached,
  setCache,
  trackCost,
  extractSourceURL,
  isValidSourceURL,
  sanitizeInput,
  type TavilySearchResult,
  type TavilyAPIResponse,
  type SourceURL,
} from './_shared/tavily-utils';

// ─── Types ──────────────────────────────────────────────────────

interface MetricResearch {
  metricId: string;
  query: string;
  city: string;
  results: TavilySearchResult[];
  sources: SourceURL[];
  answer?: string;
  responseTimeMs: number;
}

// ─── Handler ─────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // M10 fix: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

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

  const sessionId = sanitizeInput(body.sessionId, 100); // H4 fix
  const city = sanitizeInput(body.city, 200);             // H4 fix
  const country = sanitizeInput(body.country, 200);       // H4 fix
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

          // Fresh search (H1: retry, H2: timeout built into searchTavily)
          const response = await searchTavily(apiKey, query);

          // M1 fix: Fire-and-forget cache write (don't block on it)
          if (hasCache) {
            void setCache(queryHash, query, response, supabaseUrl!, supabaseKey!);
          }

          return buildMetricResult(metricId, query, city, response, Date.now() - searchStart);
        })
      );

      results.push(...batchResults);
    }

    const durationMs = Date.now() - startTime;
    const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);

    // M2 fix: Explicitly fire-and-forget cost tracking
    void trackCost({
      sessionId,
      endpoint: '/api/tavily-search',
      searchesExecuted: metrics.length - cacheHits, // M3 fix: standardized name
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
