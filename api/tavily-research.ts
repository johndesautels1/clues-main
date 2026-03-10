/**
 * /api/tavily-research — Vercel Serverless
 *
 * Baseline research for a globe region. Executes 10 topic searches via Tavily
 * and returns aggregated results with validated source URLs.
 *
 * Flow: Client → tavilyClient.ts → POST /api/tavily-research → Tavily API
 *       → response cached in Supabase tavily_cache → returned to client
 *
 * Env: TAVILY_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types (inlined to avoid src/ imports in serverless) ─────────

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

interface RegionResearchTopic {
  topic: string;
  summary: string;
  results: TavilySearchResult[];
  sourceCount: number;
}

// ─── Default Topics ──────────────────────────────────────────────

const DEFAULT_TOPICS = [
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
];

// ─── Topic → Search Query Templates ─────────────────────────────

function buildTopicQuery(topic: string, region: string): string {
  const templates: Record<string, string> = {
    cost_of_living: `cost of living index ${region} 2025 2026 average rent food utilities`,
    safety_crime: `safety crime rate ${region} 2025 violent crime index expat safety`,
    healthcare_quality: `healthcare quality ${region} 2025 hospital access insurance expats`,
    climate_weather: `climate weather ${region} average temperature humidity seasons`,
    internet_connectivity: `internet speed connectivity ${region} 2025 broadband fiber 5G`,
    visa_immigration: `visa immigration requirements ${region} 2025 residency permits digital nomad`,
    education_quality: `education quality ${region} 2025 international schools universities ranking`,
    transportation: `public transportation ${region} 2025 metro bus infrastructure walkability`,
    cultural_diversity: `cultural diversity ${region} expat community international population`,
    english_proficiency: `English proficiency ${region} 2025 EF EPI language barrier`,
  };
  return templates[topic] ?? `${topic.replace(/_/g, ' ')} ${region} 2025`;
}

// ─── Source URL Validation ───────────────────────────────────────

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

// ─── Supabase Cache ──────────────────────────────────────────────

async function getCachedResearch(
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

async function setCachedResearch(
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
    console.warn('[/api/tavily-research] Cache write failed:', err);
  }
}

// ─── Hash Utility ────────────────────────────────────────────────

async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Cost Tracking ───────────────────────────────────────────────

async function trackCost(entry: {
  sessionId: string;
  endpoint: string;
  queriesExecuted: number;
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
        // input_tokens repurposed: stores queries_executed for Tavily (not LLM tokens)
        input_tokens: entry.queriesExecuted,
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

  const body = req.body as { sessionId?: string; region?: string; topics?: string[] };

  if (!body.sessionId || !body.region) {
    res.status(400).json({ error: 'Missing required fields: sessionId, region' });
    return;
  }

  const { sessionId, region } = body;
  const topics = body.topics ?? DEFAULT_TOPICS;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasCache = Boolean(supabaseUrl && supabaseKey);

  try {
    const topicResults: RegionResearchTopic[] = [];
    const allSources: SourceURL[] = [];
    const allQueries: string[] = [];
    let totalResults = 0;
    let cacheHits = 0;

    // Execute topic searches (parallel batches of 3 to avoid rate limits)
    for (let i = 0; i < topics.length; i += 3) {
      const batch = topics.slice(i, i + 3);

      const batchResults = await Promise.all(
        batch.map(async (topic) => {
          const query = buildTopicQuery(topic, region);
          allQueries.push(query);
          const queryHash = await hashQuery(query);

          // Check cache first
          if (hasCache) {
            const cached = await getCachedResearch(queryHash, supabaseUrl!, supabaseKey!);
            if (cached) {
              cacheHits++;
              return { topic, response: cached, fromCache: true, queryHash, query };
            }
          }

          // Fresh search
          const response = await searchTavily(apiKey, query);

          // Cache the result
          if (hasCache) {
            await setCachedResearch(queryHash, query, response, supabaseUrl!, supabaseKey!);
          }

          return { topic, response, fromCache: false, queryHash, query };
        })
      );

      for (const { topic, response } of batchResults) {
        const validResults = (response.results ?? []).filter(r => isValidSourceURL(r.url));
        const sources = validResults.map(extractSourceURL);

        topicResults.push({
          topic,
          summary: response.answer ?? '',
          results: validResults,
          sourceCount: validResults.length,
        });

        allSources.push(...sources);
        totalResults += validResults.length;
      }
    }

    // Deduplicate sources by URL
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );

    const durationMs = Date.now() - startTime;

    // Track cost
    trackCost({
      sessionId,
      endpoint: '/api/tavily-research',
      queriesExecuted: topics.length - cacheHits,
      durationMs,
    });

    const now = new Date();
    res.status(200).json({
      research: {
        region,
        queries: allQueries,
        topics: topicResults,
        sources: uniqueSources,
        researchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      },
      usage: {
        queriesExecuted: topics.length,
        cacheHits,
        totalResults,
        uniqueSources: uniqueSources.length,
        durationMs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/tavily-research] Error:', message);
    res.status(500).json({
      error: 'Tavily research failed',
      detail: message,
      durationMs: Date.now() - startTime,
    });
  }
}
