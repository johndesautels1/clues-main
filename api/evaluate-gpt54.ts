/**
 * /api/evaluate-gpt54 — GPT-5.4 (OpenAI) LLM Evaluator #2
 *
 * Receives a category, metrics, cities, and Tavily research context.
 * Sends to GPT-5.4 via the OpenAI Chat Completions API.
 *
 * GPT-5.4 excels at:
 *   - Enormous factual knowledge base
 *   - Advanced multi-step reasoning
 *   - High-stakes logic and edge case detection
 *   - Bing search integration for verification
 *
 * Fires from Tier 4 (Evaluated) onwards per tierEngine.ts.
 *
 * Pricing (per 1M tokens):
 *   - Input:  $5.00
 *   - Output: $20.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  EvaluationMetric,
  CityCandidate,
  TavilyResult,
  LLMEvaluationResponse,
} from '../src/types/evaluation';

// ─── Request type ─────────────────────────────────────────────
interface EvaluateGPT54Request {
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

// ─── GPT-5.4 Token Rates (per 1M tokens) ─────────────────────
const GPT54_INPUT_RATE = 5.00;
const GPT54_OUTPUT_RATE = 20.00;

function calculateGPT54Cost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * GPT54_INPUT_RATE + outputTokens * GPT54_OUTPUT_RATE) / 1_000_000;
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

  return `You are CLUES Intelligence's LLM Evaluator #2 (GPT-5.4).

Your role: Score each city/location against each metric for the "${category}" category.

You are especially strong at:
- Enormous factual knowledge base spanning global datasets
- Advanced multi-step reasoning for complex scoring decisions
- Detecting edge cases and anomalies in location data
- High-stakes logic where precision matters

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
3. Leverage your deep knowledge base — if Tavily data is thin, supplement with your own.
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    return;
  }

  const body = req.body as EvaluateGPT54Request;

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
    // ─── OpenAI Chat Completions API ─────────────────────────
    const prompt = buildEvaluationPrompt(
      body.category,
      body.metrics,
      body.cities,
      Array.isArray(body.tavilyResearch) ? body.tavilyResearch : []
    );

    const requestBody = JSON.stringify({
      model: 'gpt-5.4',
      messages: [
        {
          role: 'system',
          content: 'You are a precise location analyst. Return only valid JSON. No markdown fences. No explanation outside the JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 32768,
      response_format: { type: 'json_object' },
    });

    // Retry with exponential backoff on 429 (rate limit) and 5xx errors
    let openaiResponse: Response | undefined;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: requestBody,
      });

      if (openaiResponse.ok) break;

      const status = openaiResponse.status;
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      const errText = await openaiResponse.text();
      throw new Error(`OpenAI API returned ${status}: ${errText}`);
    }

    if (!openaiResponse || !openaiResponse.ok) {
      throw new Error('OpenAI API request failed after retries');
    }

    const openaiResult = await openaiResponse.json();
    const durationMs = Date.now() - startTime;

    // ─── Check for truncation ────────────────────────────────
    if (openaiResult.choices?.[0]?.finish_reason === 'length') {
      console.warn('[/api/evaluate-gpt54] Response truncated (hit max_tokens).');
    }

    // ─── Parse response ──────────────────────────────────────
    const rawText = openaiResult.choices?.[0]?.message?.content ?? '';

    let evaluation: LLMEvaluationResponse;
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        evaluation = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error(`Failed to parse GPT-5.4 JSON response: ${parseErr instanceof Error ? parseErr.message : 'Unknown parse error'}`);
      }
    }

    // ─── Validate required fields ────────────────────────────
    if (!evaluation.category) evaluation.category = body.category;
    if (!evaluation.evaluations) evaluation.evaluations = [];
    if (!evaluation.disagreements) evaluation.disagreements = [];
    if (!evaluation.reasoning_summary) evaluation.reasoning_summary = '';

    // ─── Token usage ─────────────────────────────────────────
    const usage = openaiResult.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    const costUsd = calculateGPT54Cost(inputTokens, outputTokens);

    // Track cost (non-blocking)
    trackCost({
      sessionId: body.sessionId,
      model: 'gpt-5.4',
      endpoint: '/api/evaluate-gpt54',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    // ─── Return evaluation + metadata ────────────────────────
    res.status(200).json({
      evaluation,
      metadata: {
        model: 'gpt-5.4',
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/evaluate-gpt54] GPT-5.4 evaluation failed:', message);
    res.status(500).json({
      error: 'GPT-5.4 evaluation failed',
      detail: message,
      durationMs,
    });
  }
}
