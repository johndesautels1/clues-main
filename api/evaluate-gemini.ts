/**
 * /api/evaluate-gemini — Gemini 3.1 Pro Preview (Google) LLM Evaluator #3
 *
 * Receives a category, metrics, cities, and Tavily research context.
 * Sends to Gemini 3.1 Pro Preview via the Gemini API.
 *
 * Gemini 3.1 Pro Preview excels at:
 *   - Plain-language extraction and inferential reasoning
 *   - Understanding user intent from written text
 *   - Native Google Search grounding for real-time verification
 *   - Best value per token (cheapest evaluator after Grok)
 *
 * NOTE: Gemini is also the REASONING ENGINE for Paragraphical extraction
 *       (see api/paragraphical.ts). This endpoint reuses the same model
 *       for category evaluation during the 5-LLM parallel phase.
 *
 * Fires from Tier 4 (Evaluated) onwards per tierEngine.ts.
 *
 * Pricing (per 1M tokens, March 2026):
 *   - Input:  $2.00
 *   - Output: $12.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  EvaluationMetric,
  CityCandidate,
  TavilyResult,
  LLMEvaluationResponse,
} from '../src/types/evaluation';

// ─── Request type ─────────────────────────────────────────────
interface EvaluateGeminiRequest {
  sessionId: string;
  category: string;
  metrics: EvaluationMetric[];
  cities: CityCandidate[];
  tavilyResearch: TavilyResult[];
}

// ─── Cost tracking helper (server-side, writes to Supabase directly) ──
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

// ─── Gemini Token Rates (per 1M tokens, March 2026) ──────────
const GEMINI_INPUT_RATE = 2.00;
const GEMINI_OUTPUT_RATE = 12.00;

function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * GEMINI_INPUT_RATE + outputTokens * GEMINI_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Build the evaluation prompt ─────────────────────────────
function buildEvaluationPrompt(
  category: string,
  metrics: EvaluationMetric[],
  cities: CityCandidate[],
  tavilyResearch: TavilyResult[]
): string {
  const metricsText = metrics
    .map(m => `${m.id}: ${m.description} [${m.data_type}]${m.threshold ? ` (threshold: ${m.threshold.operator} ${JSON.stringify(m.threshold.value)} ${m.threshold.unit})` : ''}`)
    .join('\n');

  const citiesText = cities
    .map(c => `- ${c.location}, ${c.country} (${c.location_type}${c.parent ? `, in ${c.parent}` : ''})`)
    .join('\n');

  const researchText = tavilyResearch
    .map(r => {
      const sources = r.results
        .map(s => `  - [${s.title}](${s.url}): ${s.content.slice(0, 300)}`)
        .join('\n');
      return `${r.metric_id} (${r.query}):\n${sources}`;
    })
    .join('\n\n');

  return `You are CLUES Intelligence's LLM Evaluator #3 (Gemini 3.1 Pro Preview).

Your role: Score each city/location against each metric for the "${category}" category.

You are especially strong at:
- Deep inferential reasoning from user-written paragraphs
- Understanding nuanced user intent and priorities
- Real-time data verification via Google Search grounding
- Cost-efficient evaluation with high accuracy

IMPORTANT: You have Tavily research data below. Use it as your PRIMARY source. Cross-reference with your own knowledge and Google Search grounding. If you find contradictions, flag them in the "disagreements" array.

═══════════════════════════════════════════════════════════════
METRICS TO EVALUATE (${metrics.length} metrics):
═══════════════════════════════════════════════════════════════
${metricsText}

═══════════════════════════════════════════════════════════════
LOCATIONS TO SCORE:
═══════════════════════════════════════════════════════════════
${citiesText}

═══════════════════════════════════════════════════════════════
TAVILY RESEARCH DATA:
═══════════════════════════════════════════════════════════════
${researchText}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

For each location, score EVERY metric:
- score: 0-100 (relative to other locations)
- confidence: 0.0-1.0 (how confident you are in this score)
- user_justification: Why this matters to the user (reference their paragraph)
- data_justification: Real-world data backing this score (cite 2026 data)
- source: Attribution to a specific data source
- reasoning: Your analytical reasoning chain

Also provide:
- disagreements: Metrics where your analysis contradicts the Tavily research data
- reasoning_summary: Your overall assessment of this category across all locations

Return ONLY valid JSON matching this schema (no markdown fences):

{
  "category": "${category}",
  "evaluations": [
    {
      "location": "<city name>",
      "country": "<country>",
      "overall_score": <0-100>,
      "metric_scores": [
        {
          "metric_id": "<M1, M2, etc.>",
          "score": <0-100>,
          "confidence": <0.0-1.0>,
          "user_justification": "<why this matters to user>",
          "data_justification": "<real-world data>",
          "source": "<data source>",
          "reasoning": "<your analytical reasoning>"
        }
      ]
    }
  ],
  "disagreements": ["<metric_id>: <what you found vs what Tavily said>"],
  "reasoning_summary": "<overall category assessment>"
}

Rules:
1. Score EVERY metric for EVERY location. No skipping.
2. Scores are RELATIVE — best location gets highest score, others scaled accordingly.
3. Use your inferential reasoning to connect metric scores to user intent.
4. Flag ANY data inconsistency between Tavily research and your knowledge.
5. Confidence below 0.5 means you could not find reliable data — flag it.`;
}

// ─── Main Handler ──────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  const body = req.body as EvaluateGeminiRequest;

  if (!body.sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }
  if (!body.category) {
    res.status(400).json({ error: 'Missing category' });
    return;
  }
  if (!body.metrics || !Array.isArray(body.metrics) || body.metrics.length === 0) {
    res.status(400).json({ error: 'Missing or empty metrics array' });
    return;
  }
  if (!body.cities || !Array.isArray(body.cities) || body.cities.length === 0) {
    res.status(400).json({ error: 'Missing or empty cities array' });
    return;
  }

  const startTime = Date.now();

  try {
    // ─── Gemini API (generateContent) ────────────────────────
    const prompt = buildEvaluationPrompt(
      body.category,
      body.metrics,
      body.cities,
      Array.isArray(body.tavilyResearch) ? body.tavilyResearch : []
    );

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: 'You are a precise location analyst. Return only valid JSON. No markdown fences. No explanation outside the JSON.' }],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 32768,
        responseMimeType: 'application/json',
      },
      tools: [{ google_search: {} }],
    });

    // Retry with exponential backoff on 429 (rate limit) and 5xx errors
    let geminiResponse: Response | undefined;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (geminiResponse.ok) break;

      const status = geminiResponse.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      const errText = await geminiResponse.text();
      throw new Error(`Gemini API returned ${status}: ${errText}`);
    }

    if (!geminiResponse || !geminiResponse.ok) {
      throw new Error('Gemini API request failed after retries');
    }

    const geminiResult = await geminiResponse.json();
    const durationMs = Date.now() - startTime;

    // ─── Check for truncation or safety block ────────────────
    const finishReason = geminiResult.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.warn('[/api/evaluate-gemini] Response truncated (hit maxOutputTokens).');
    } else if (finishReason === 'SAFETY') {
      console.warn('[/api/evaluate-gemini] Response blocked by safety filters.');
      throw new Error('Gemini response blocked by safety filters — no usable output');
    }

    // ─── Parse response ──────────────────────────────────────
    const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let evaluation: LLMEvaluationResponse;
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        evaluation = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error(`Failed to parse Gemini JSON response: ${parseErr instanceof Error ? parseErr.message : 'Unknown parse error'}`);
      }
    }

    // ─── Validate required fields ────────────────────────────
    if (!evaluation.category) evaluation.category = body.category;
    if (!evaluation.evaluations) evaluation.evaluations = [];
    if (!evaluation.disagreements) evaluation.disagreements = [];
    if (!evaluation.reasoning_summary) evaluation.reasoning_summary = '';

    // ─── Token usage ─────────────────────────────────────────
    const usageMetadata = geminiResult.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = calculateGeminiCost(inputTokens, outputTokens);

    // Track cost (non-blocking)
    trackCost({
      sessionId: body.sessionId,
      model: 'gemini-3.1-pro-preview',
      endpoint: '/api/evaluate-gemini',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    // ─── Return evaluation + metadata ────────────────────────
    res.status(200).json({
      evaluation,
      metadata: {
        model: 'gemini-3.1-pro-preview',
        category: body.category,
        metricsEvaluated: body.metrics.length,
        citiesEvaluated: body.cities.length,
        inputTokens,
        outputTokens,
        reasoningTokens: 0,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        disagreementCount: evaluation.disagreements.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/evaluate-gemini] Gemini 3.1 Pro Preview evaluation failed:', message);
    res.status(500).json({
      error: 'Gemini evaluation failed',
      detail: message,
      durationMs,
    });
  }
}
