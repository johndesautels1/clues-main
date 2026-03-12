/**
 * /api/recommend-gemini — Gemini 3.1 Pro Preview City Recommender
 *
 * Given a user's questionnaire signals + globe region, recommends
 * cities/towns that match their profile. Uses Google Search grounding.
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

const GEMINI_INPUT_RATE = 1.25;
const GEMINI_OUTPUT_RATE = 10.00;
function calculateCost(i: number, o: number): number { return (i * GEMINI_INPUT_RATE + o * GEMINI_OUTPUT_RATE) / 1_000_000; }

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

  return `You are CLUES Intelligence's City Recommender (Gemini 3.1 Pro Preview).

Your role: Based on this user's questionnaire data and globe region preference, recommend the BEST cities and towns for them to relocate to.

Use Google Search grounding to verify all recommendations against REAL, CURRENT (2025-2026) data.

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
2. Use Google Search to find cities/towns in their preferred region that match
3. Recommend 5-8 cities and 3-5 towns
4. Explain WHY each matches this specific user
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
4. Use REAL data.
5. Balance across ALL categories.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'GEMINI_API_KEY not configured' }); return; }

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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;

    let geminiResponse: Response | undefined;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: 'You are a world-class relocation analyst. Return only valid JSON. No markdown fences.' }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 16384, responseMimeType: 'application/json' },
          tools: [{ google_search: {} }],
        }),
      });
      if (geminiResponse.ok) break;
      const status = geminiResponse.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API returned ${status}: ${errText}`);
    }

    if (!geminiResponse || !geminiResponse.ok) throw new Error('Gemini API request failed after retries');

    const geminiResult = await geminiResponse.json();
    const durationMs = Date.now() - startTime;
    const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let recommendations;
    try { recommendations = JSON.parse(rawText); } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleaned);
    }

    if (!recommendations.recommended_cities) recommendations.recommended_cities = [];
    if (!recommendations.recommended_towns) recommendations.recommended_towns = [];
    if (!recommendations.reasoning_summary) recommendations.reasoning_summary = '';

    const usageMetadata = geminiResult.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    trackCost({ sessionId: body.sessionId, model: 'gemini-3.1-pro-preview', endpoint: '/api/recommend-gemini', inputTokens, outputTokens, costUsd, durationMs }).catch(() => {});

    res.status(200).json({
      recommendations,
      metadata: { model: 'gemini-3.1-pro-preview', inputTokens, outputTokens, costUsd: Number(costUsd.toFixed(6)), durationMs, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/recommend-gemini] Failed:', message);
    res.status(500).json({ error: 'Gemini recommendation failed', detail: message, durationMs });
  }
}
