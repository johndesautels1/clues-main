/**
 * /api/recommend-grok — Grok 4.1 Fast Reasoning (xAI) City Recommender
 *
 * Given a user's questionnaire signals + globe region, recommends
 * cities/towns that match their profile.
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

const GROK_INPUT_RATE = 3.00;
const GROK_OUTPUT_RATE = 15.00;
function calculateCost(i: number, o: number): number { return (i * GROK_INPUT_RATE + o * GROK_OUTPUT_RATE) / 1_000_000; }

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

  return `You are CLUES Intelligence's City Recommender (Grok 4.1 Fast Reasoning).

Your role: Based on this user's questionnaire data and globe region preference, recommend the BEST cities and towns for them to relocate to.

You excel at rapid quantitative analysis. Use your reasoning capabilities and real-time knowledge to provide data-backed recommendations.

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
2. Recommend 5-8 cities and 3-5 towns in their preferred region
3. Explain WHY each matches this specific user
4. Flag concerns or trade-offs
5. Confidence: 0-1

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
4. Use REAL data.
5. Balance across ALL categories.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'XAI_API_KEY not configured' }); return; }

  const body = req.body as RecommendRequest;
  if (!body.sessionId || !body.globeRegion || !body.signals?.length) {
    res.status(400).json({ error: 'Missing sessionId, globeRegion, or signals' }); return;
  }

  const invalidSignal = body.signals.find(
    s => typeof s.moduleId !== 'string' || typeof s.key !== 'string' ||
         typeof s.value !== 'number' || typeof s.source !== 'string' ||
         s.rawValue === undefined
  );
  if (invalidSignal) {
    res.status(400).json({ error: 'Malformed signal object: each signal must have moduleId (string), key (string), value (number), source (string), and rawValue' }); return;
  }

  const startTime = Date.now();

  try {
    const prompt = buildRecommendationPrompt(body);

    let grokResponse: Response | undefined;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages: [
            { role: 'system', content: 'You are a world-class relocation analyst with quantitative expertise. Return only valid JSON. No markdown fences.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 16384,
          response_format: { type: 'json_object' },
        }),
      });
      if (grokResponse.ok) break;
      const status = grokResponse.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      const errText = await grokResponse.text();
      throw new Error(`xAI API returned ${status}: ${errText}`);
    }

    if (!grokResponse || !grokResponse.ok) throw new Error('xAI API request failed after retries');

    const result = await grokResponse.json();
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

    trackCost({ sessionId: body.sessionId, model: 'grok-4-1-fast-reasoning', endpoint: '/api/recommend-grok', inputTokens, outputTokens, costUsd, durationMs }).catch(() => {});

    res.status(200).json({
      recommendations,
      metadata: { model: 'grok-4-1-fast-reasoning', inputTokens, outputTokens, costUsd: Number(costUsd.toFixed(6)), durationMs, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/recommend-grok] Failed:', message);
    res.status(500).json({ error: 'Grok recommendation failed', detail: message, durationMs });
  }
}
