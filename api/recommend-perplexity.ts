/**
 * /api/recommend-perplexity — Sonar Reasoning Pro High (Perplexity) City Recommender
 *
 * Given a user's questionnaire signals + globe region, recommends
 * cities/towns that match their profile. Native web search for real-time data.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RecommendRequest {
  sessionId: string;
  signals: { moduleId: string; key: string; value: number; source: string; rawValue: string | number | boolean }[];
  globeRegion: string;
  tier: string;
  dnwSummary: string[];
  mhSummary: string[];
  demographicSummary: Record<string, string | number | boolean>;
}

async function trackCost(entry: {
  sessionId: string; model: string; endpoint: string;
  inputTokens: number; outputTokens: number; costUsd: number; durationMs: number;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/cost_tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=minimal' },
      body: JSON.stringify({ session_id: entry.sessionId, model: entry.model, endpoint: entry.endpoint, input_tokens: entry.inputTokens, output_tokens: entry.outputTokens, cost_usd: entry.costUsd, duration_ms: entry.durationMs }),
    });
  } catch (err) { console.warn('[CostTracking] Failed:', err); }
}

const PERPLEXITY_INPUT_RATE = 2.00;
const PERPLEXITY_OUTPUT_RATE = 8.00;
function calculateCost(i: number, o: number): number { return (i * PERPLEXITY_INPUT_RATE + o * PERPLEXITY_OUTPUT_RATE) / 1_000_000; }

function buildRecommendationPrompt(body: RecommendRequest): string {
  const signalsByModule: Record<string, string[]> = {};
  for (const s of body.signals) {
    if (!signalsByModule[s.moduleId]) signalsByModule[s.moduleId] = [];
    signalsByModule[s.moduleId].push(`${s.key}: ${s.rawValue} (strength: ${(s.value * 100).toFixed(0)}%, source: ${s.source})`);
  }
  const moduleText = Object.entries(signalsByModule).map(([mod, sigs]) => `${mod}:\n${sigs.map(s => `  - ${s}`).join('\n')}`).join('\n\n');
  const dnwText = body.dnwSummary.length > 0 ? body.dnwSummary.map(d => `  - ${d}`).join('\n') : '  (none specified)';
  const mhText = body.mhSummary.length > 0 ? body.mhSummary.map(m => `  - ${m}`).join('\n') : '  (none specified)';
  const demoText = Object.entries(body.demographicSummary).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  (none specified)';

  return `You are CLUES Intelligence's City Recommender (Sonar Reasoning Pro High).

Your role: Based on this user's questionnaire data and globe region preference, recommend the BEST cities and towns for them to relocate to.

You have NATIVE WEB SEARCH. Use it to verify every recommendation against REAL, CURRENT (2025-2026) data. Cite sources.

═══════════════════════════════════════════════════════════════
USER'S GLOBE REGION PREFERENCE: ${body.globeRegion}
═══════════════════════════════════════════════════════════════

DEMOGRAPHICS:
${demoText}

DEALBREAKERS (cities MUST NOT have these):
${dnwText}

MUST-HAVES (cities MUST have these):
${mhText}

USER PREFERENCE SIGNALS BY LIFE CATEGORY:
${moduleText}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

1. Analyze the user's complete profile across all categories
2. Use web search to find cities/towns in their preferred region that match
3. Recommend 5-8 cities and 3-5 towns
4. Explain WHY each matches this specific user, with cited sources
5. Flag concerns or trade-offs
6. Confidence: 0-1

Return ONLY valid JSON:
{
  "recommended_cities": [{ "location": "", "country": "", "reasoning": "", "confidence": 0, "strengths": [], "concerns": [] }],
  "recommended_towns": [{ "location": "", "country": "", "reasoning": "", "confidence": 0, "strengths": [], "concerns": [] }],
  "reasoning_summary": ""
}

Rules:
1. Recommendations MUST be in or near the user's globe region.
2. Dealbreaker violations = ELIMINATED.
3. Prioritize must-haves.
4. CITE REAL SOURCES for every claim.
5. Balance across ALL categories.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'PERPLEXITY_API_KEY not configured' }); return; }

  const body = req.body as RecommendRequest;
  if (!body.sessionId || !body.globeRegion || !body.signals?.length) {
    res.status(400).json({ error: 'Missing sessionId, globeRegion, or signals' }); return;
  }

  const startTime = Date.now();

  try {
    const prompt = buildRecommendationPrompt(body);

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro-high',
        messages: [
          { role: 'system', content: 'You are a world-class relocation analyst with native web search. Return only valid JSON. No markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 16384,
      }),
    });

    if (!perplexityResponse.ok) {
      const errText = await perplexityResponse.text();
      throw new Error(`Perplexity API returned ${perplexityResponse.status}: ${errText}`);
    }

    const result = await perplexityResponse.json();
    const durationMs = Date.now() - startTime;
    const rawText = result.choices?.[0]?.message?.content ?? '';

    let recommendations;
    try { recommendations = JSON.parse(rawText); } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleaned);
    }

    if (!recommendations.recommended_cities) recommendations.recommended_cities = [];
    if (!recommendations.recommended_towns) recommendations.recommended_towns = [];
    if (!recommendations.reasoning_summary) recommendations.reasoning_summary = '';

    const usage = result.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    trackCost({ sessionId: body.sessionId, model: 'sonar-reasoning-pro-high', endpoint: '/api/recommend-perplexity', inputTokens, outputTokens, costUsd, durationMs }).catch(() => {});

    res.status(200).json({
      recommendations,
      metadata: { model: 'sonar-reasoning-pro-high', inputTokens, outputTokens, costUsd: Number(costUsd.toFixed(6)), durationMs, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/recommend-perplexity] Failed:', message);
    res.status(500).json({ error: 'Perplexity recommendation failed', detail: message, durationMs });
  }
}
