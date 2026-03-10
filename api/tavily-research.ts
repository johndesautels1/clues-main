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
  type SourceURL,
} from './_shared/tavily-utils';

// ─── Types ──────────────────────────────────────────────────────

interface RegionResearchTopic {
  topic: string;
  summary: string;
  results: TavilySearchResult[];
  sourceCount: number;
}

// ─── Default Topics ──────────────────────────────────────────────
// M4: Canonical list — mirrors src/types/tavily.ts DEFAULT_RESEARCH_TOPICS

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
  // M5 fix: Use dynamic year instead of hardcoded "2025 2026"
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const yearTag = `${prevYear} ${currentYear}`;

  const templates: Record<string, string> = {
    cost_of_living: `cost of living index ${region} ${yearTag} average rent food utilities`,
    safety_crime: `safety crime rate ${region} ${yearTag} violent crime index expat safety`,
    healthcare_quality: `healthcare quality ${region} ${yearTag} hospital access insurance expats`,
    climate_weather: `climate weather ${region} average temperature humidity seasons`,
    internet_connectivity: `internet speed connectivity ${region} ${yearTag} broadband fiber 5G`,
    visa_immigration: `visa immigration requirements ${region} ${yearTag} residency permits digital nomad`,
    education_quality: `education quality ${region} ${yearTag} international schools universities ranking`,
    transportation: `public transportation ${region} ${yearTag} metro bus infrastructure walkability`,
    cultural_diversity: `cultural diversity ${region} expat community international population`,
    english_proficiency: `English proficiency ${region} ${yearTag} EF EPI language barrier`,
  };
  return templates[topic] ?? `${topic.replace(/_/g, ' ')} ${region} ${currentYear}`;
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

  const body = req.body as { sessionId?: string; region?: string; topics?: string[] };

  if (!body.sessionId || !body.region) {
    res.status(400).json({ error: 'Missing required fields: sessionId, region' });
    return;
  }

  const sessionId = sanitizeInput(body.sessionId, 100); // H4 fix
  const region = sanitizeInput(body.region, 200);        // H4 fix

  // L6 fix: Validate topics against the whitelist
  const validTopics = new Set(DEFAULT_TOPICS);
  const topics = body.topics
    ? body.topics.filter(t => validTopics.has(t))
    : DEFAULT_TOPICS;

  if (topics.length === 0) {
    res.status(400).json({ error: 'No valid topics provided' });
    return;
  }

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
            const cached = await getCached(queryHash, supabaseUrl!, supabaseKey!);
            if (cached) {
              cacheHits++;
              return { topic, response: cached, fromCache: true, queryHash, query };
            }
          }

          // Fresh search (H1: retry, H2: timeout built into searchTavily)
          const response = await searchTavily(apiKey, query);

          // M1 fix: Fire-and-forget cache write (don't block on it)
          if (hasCache) {
            void setCache(queryHash, query, response, supabaseUrl!, supabaseKey!);
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

    // M2 fix: Explicitly fire-and-forget cost tracking
    void trackCost({
      sessionId,
      endpoint: '/api/tavily-research',
      searchesExecuted: topics.length - cacheHits, // M3 fix: standardized name
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
