/**
 * /api/recommend-sonnet — Claude Sonnet 4.6 City Recommender
 *
 * Given a user's questionnaire signals + globe region, recommends
 * cities/towns that match their profile. Part of the 5-LLM city
 * recommendation system for non-Paragraphical entry points.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Request/Response Types ─────────────────────────────────────

interface RecommendRequest {
  sessionId: string;
  signals: { moduleId: string; key: string; value: number; source: string; rawValue: string | number | boolean }[];
  globeRegion: string;
  tier: string;
  dnwSummary: string[];
  mhSummary: string[];
  demographicSummary: Record<string, string | number | boolean>;
}

// ─── Cost tracking helper ───────────────────────────────────────

async function trackCost(entry: {
  sessionId: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
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
        model: entry.model,
        endpoint: entry.endpoint,
        input_tokens: entry.inputTokens,
        output_tokens: entry.outputTokens,
        cost_usd: entry.costUsd,
        duration_ms: entry.durationMs,
      }),
    });
  } catch (err) {
    console.warn('[CostTracking] Failed to log cost:', err);
  }
}

const SONNET_INPUT_RATE = 3.00;
const SONNET_OUTPUT_RATE = 15.00;

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * SONNET_INPUT_RATE + outputTokens * SONNET_OUTPUT_RATE) / 1_000_000;
}

// ─── Prompt Builder ─────────────────────────────────────────────

function buildRecommendationPrompt(body: RecommendRequest): string {
  const signalsByModule: Record<string, string[]> = {};
  for (const s of body.signals) {
    if (!signalsByModule[s.moduleId]) signalsByModule[s.moduleId] = [];
    signalsByModule[s.moduleId].push(`${s.key}: ${s.rawValue} (strength: ${(s.value * 100).toFixed(0)}%, source: ${s.source})`);
  }

  const moduleText = Object.entries(signalsByModule)
    .map(([mod, sigs]) => `${mod}:\n${sigs.map(s => `  - ${s}`).join('\n')}`)
    .join('\n\n');

  const dnwText = body.dnwSummary.length > 0
    ? body.dnwSummary.map(d => `  - ${d}`).join('\n')
    : '  (none specified)';

  const mhText = body.mhSummary.length > 0
    ? body.mhSummary.map(m => `  - ${m}`).join('\n')
    : '  (none specified)';

  const demoText = Object.entries(body.demographicSummary)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n') || '  (none specified)';

  return `You are CLUES Intelligence's City Recommender (Claude Sonnet 4.6).

Your role: Based on this user's questionnaire data and globe region preference, recommend the BEST cities and towns for them to relocate to.

You MUST use your web search capabilities to verify that your recommendations are based on REAL, CURRENT (2025-2026) data. Do not hallucinate cities or make up statistics.

═══════════════════════════════════════════════════════════════
USER'S GLOBE REGION PREFERENCE:
═══════════════════════════════════════════════════════════════
${body.globeRegion}

═══════════════════════════════════════════════════════════════
USER'S DEMOGRAPHICS:
═══════════════════════════════════════════════════════════════
${demoText}

═══════════════════════════════════════════════════════════════
DEALBREAKERS (cities MUST NOT have these):
═══════════════════════════════════════════════════════════════
${dnwText}

═══════════════════════════════════════════════════════════════
MUST-HAVES (cities MUST have these):
═══════════════════════════════════════════════════════════════
${mhText}

═══════════════════════════════════════════════════════════════
USER PREFERENCE SIGNALS BY LIFE CATEGORY:
═══════════════════════════════════════════════════════════════
${moduleText}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

1. Analyze the user's complete profile across all categories
2. Use web search to find cities/towns in their preferred region that match
3. Recommend 5-8 cities and 3-5 towns within those cities
4. For each recommendation, explain WHY it matches this specific user
5. Flag any concerns or trade-offs for each location
6. Confidence: 0-1 (how confident you are this city matches their profile)

Return ONLY valid JSON matching this schema (no markdown fences):

{
  "recommended_cities": [
    {
      "location": "<city name>",
      "country": "<country>",
      "reasoning": "<why this city matches the user's profile>",
      "confidence": <0.0-1.0>,
      "strengths": ["<strength 1>", "<strength 2>"],
      "concerns": ["<concern 1>"]
    }
  ],
  "recommended_towns": [
    {
      "location": "<town name>",
      "country": "<country>",
      "reasoning": "<why this town matches>",
      "confidence": <0.0-1.0>,
      "strengths": ["<strength 1>"],
      "concerns": ["<concern 1>"]
    }
  ],
  "reasoning_summary": "<overall analysis of what kind of location suits this user>"
}

Rules:
1. Recommendations MUST be in or near the user's globe region preference.
2. Cities with dealbreaker violations are ELIMINATED — do not recommend them.
3. Prioritize cities that satisfy must-haves.
4. Use REAL data — verify population, safety stats, cost of living, etc.
5. Balance quality of life across ALL categories the user cares about.`;
}

// ─── Main Handler ───────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const body = req.body as RecommendRequest;

  if (!body.sessionId || !body.globeRegion || !body.signals?.length) {
    res.status(400).json({ error: 'Missing sessionId, globeRegion, or signals' });
    return;
  }

  const invalidSignal = body.signals.find(
    s => typeof s.moduleId !== 'string' || typeof s.key !== 'string' ||
         typeof s.value !== 'number' || typeof s.source !== 'string' ||
         s.rawValue === undefined
  );
  if (invalidSignal) {
    res.status(400).json({ error: 'Malformed signal object: each signal must have moduleId (string), key (string), value (number), source (string), and rawValue' });
    return;
  }

  const startTime = Date.now();

  try {
    const prompt = buildRecommendationPrompt(body);

    let anthropicResponse: Response | undefined;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 16384,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a world-class relocation analyst. Return only valid JSON. No markdown fences.',
          temperature: 0.4,
        }),
      });
      if (anthropicResponse.ok) break;
      const status = anthropicResponse.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API returned ${status}: ${errText}`);
    }

    if (!anthropicResponse || !anthropicResponse.ok) throw new Error('Anthropic API request failed after retries');

    const result = await anthropicResponse.json();
    const durationMs = Date.now() - startTime;

    const contentBlocks = Array.isArray(result.content) ? result.content : [];
    const textBlock = contentBlocks.find((b: { type: string }) => b.type === 'text');
    const rawText = textBlock?.text ?? '';

    let recommendations;
    try {
      recommendations = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleaned);
    }

    if (!recommendations.recommended_cities) recommendations.recommended_cities = [];
    if (!recommendations.recommended_towns) recommendations.recommended_towns = [];
    if (!recommendations.reasoning_summary) recommendations.reasoning_summary = '';

    const usage = result.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    trackCost({
      sessionId: body.sessionId,
      model: 'claude-sonnet-4-6',
      endpoint: '/api/recommend-sonnet',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    res.status(200).json({
      recommendations,
      metadata: {
        model: 'claude-sonnet-4-6',
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/recommend-sonnet] Failed:', message);
    res.status(500).json({ error: 'Sonnet recommendation failed', detail: message, durationMs });
  }
}
