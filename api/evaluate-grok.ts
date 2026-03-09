/**
 * /api/evaluate-grok — Grok 4.1 Fast Reasoning (xAI) LLM Evaluator #4
 *
 * Receives a category, metrics, cities, and Tavily research context.
 * Sends to Grok 4.1 Fast Reasoning via xAI's OpenAI-compatible API.
 *
 * Grok 4.1 Fast Reasoning excels at:
 *   - Mathematical calculations and quantitative analysis
 *   - Real-time web context (X/Twitter data)
 *   - Fast reasoning with 2M context window (~99 tokens/sec)
 *
 * Fires from Tier 4 (Evaluated) onwards per tierEngine.ts.
 *
 * Pricing (per 1M tokens):
 *   - Input:  $0.20
 *   - Output: $0.50
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  EvaluationMetric,
  CityCandidate,
  TavilyResult,
  LLMEvaluationResponse,
} from '../src/types/evaluation';

// ─── Request type ─────────────────────────────────────────────
interface EvaluateGrokRequest {
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

// ─── Grok Token Rates (per 1M tokens) ────────────────────────
const GROK_INPUT_RATE = 0.20;
const GROK_OUTPUT_RATE = 0.50;

function calculateGrokCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * GROK_INPUT_RATE + outputTokens * GROK_OUTPUT_RATE) / 1_000_000;
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

  return `You are CLUES Intelligence's LLM Evaluator #4 (Grok 4.1 Fast Reasoning).

Your role: Score each city/location against each metric for the "${category}" category.

You are especially strong at:
- Mathematical calculations and quantitative analysis
- Processing real-time web data
- Detecting numerical inconsistencies in research data

IMPORTANT: You have Tavily research data below. Use it as your PRIMARY source. Cross-reference with your own knowledge. If you find contradictions, flag them in the "disagreements" array.

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
- reasoning: Your mathematical/analytical reasoning chain

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
3. Use mathematical precision — if a metric has a threshold, calculate exact pass/fail.
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

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'XAI_API_KEY not configured' });
    return;
  }

  const body = req.body as EvaluateGrokRequest;

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
    // ─── xAI API (OpenAI-compatible) ─────────────────────────
    const prompt = buildEvaluationPrompt(
      body.category,
      body.metrics,
      body.cities,
      Array.isArray(body.tavilyResearch) ? body.tavilyResearch : []
    );

    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          {
            role: 'system',
            content: 'You are a precise quantitative analyst. Return only valid JSON. No markdown fences. No explanation outside the JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 32768,
        response_format: { type: 'json_object' },
      }),
    });

    if (!grokResponse.ok) {
      const errText = await grokResponse.text();
      throw new Error(`xAI API returned ${grokResponse.status}: ${errText}`);
    }

    const grokResult = await grokResponse.json();
    const durationMs = Date.now() - startTime;

    // ─── Check for truncation ────────────────────────────────
    if (grokResult.choices?.[0]?.finish_reason === 'length') {
      console.warn('[/api/evaluate-grok] Response truncated (hit max_tokens).');
    }

    // ─── Parse response ──────────────────────────────────────
    const rawText = grokResult.choices?.[0]?.message?.content ?? '';

    let evaluation: LLMEvaluationResponse;
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    }

    // ─── Validate required fields ────────────────────────────
    if (!evaluation.category) evaluation.category = body.category;
    if (!evaluation.evaluations) evaluation.evaluations = [];
    if (!evaluation.disagreements) evaluation.disagreements = [];
    if (!evaluation.reasoning_summary) evaluation.reasoning_summary = '';

    // ─── Token usage ─────────────────────────────────────────
    const usage = grokResult.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    const costUsd = calculateGrokCost(inputTokens, outputTokens);

    // Track cost (non-blocking)
    trackCost({
      sessionId: body.sessionId,
      model: 'grok-4-1-fast-reasoning',
      endpoint: '/api/evaluate-grok',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    // ─── Return evaluation + metadata ────────────────────────
    res.status(200).json({
      evaluation,
      metadata: {
        model: 'grok-4-1-fast-reasoning',
        category: body.category,
        metricsEvaluated: body.metrics.length,
        citiesEvaluated: body.cities.length,
        inputTokens,
        outputTokens,
        reasoningTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        disagreementCount: evaluation.disagreements.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('[/api/evaluate-grok] Grok 4.1 Fast Reasoning evaluation failed:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/evaluate-grok] Detail:', message);
    res.status(500).json({
      error: 'Grok evaluation failed',
      durationMs,
    });
  }
}
