/**
 * /api/evaluate-sonnet — Claude Sonnet 4.6 (Anthropic) LLM Evaluator #1
 *
 * Pricing (per 1M tokens): Input $3.00, Output $15.00
 * Strengths: Structured scoring, nuanced qualitative analysis, consistent JSON
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleCors,
  validateEvaluateRequest,
  trackCost,
  buildEvaluationPrompt,
  parseEvaluationResponse,
  fetchWithRetry,
  type EvaluateRequest,
} from './_shared/evaluation-utils';

// ─── Sonnet Config ───────────────────────────────────────────────
const MODEL_ID = 'claude-sonnet-4-6';
const SONNET_INPUT_RATE = 3.00;
const SONNET_OUTPUT_RATE = 15.00;
const EVALUATOR_IDENTITY = {
  number: 1,
  model: 'Claude Sonnet 4.6',
  strengths: [
    'Structured, reliable scoring with consistent formatting',
    'Nuanced qualitative analysis (culture, lifestyle, community dynamics)',
    'Weighing multiple data sources to form balanced assessments',
    'Identifying subtle trade-offs between locations',
  ],
  rule3: 'Balance quantitative data with qualitative nuance — your strength.',
};

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * SONNET_INPUT_RATE + outputTokens * SONNET_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const body = req.body as EvaluateRequest;
  const validationError = validateEvaluateRequest(body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const startTime = Date.now();

  try {
    const prompt = buildEvaluationPrompt(
      EVALUATOR_IDENTITY,
      body.category,
      body.metrics,
      body.cities,
      Array.isArray(body.tavilyResearch) ? body.tavilyResearch : []
    );

    const response = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2024-10-22',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: 32768,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a precise location analyst. Return only valid JSON. No markdown fences.',
          temperature: 0.3,
        }),
      }
    );

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    // Check for truncation
    const truncated = result.stop_reason === 'max_tokens';
    if (truncated) {
      console.warn('[/api/evaluate-sonnet] Response truncated (hit max_tokens).');
    }

    // Parse response
    const contentBlocks = Array.isArray(result.content) ? result.content : [];
    const textBlock = contentBlocks.find((b: { type: string }) => b.type === 'text');
    const rawText = textBlock?.text ?? '';

    const evaluation = parseEvaluationResponse(rawText, body.category, MODEL_ID);

    // Token usage
    const usage = result.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/evaluate-sonnet',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    });

    res.status(200).json({
      evaluation,
      metadata: {
        model: MODEL_ID,
        category: body.category,
        metricsEvaluated: body.metrics.length,
        citiesEvaluated: body.cities.length,
        inputTokens,
        outputTokens,
        reasoningTokens: 0,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        disagreementCount: evaluation.disagreements.length,
        truncated,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/evaluate-sonnet] Failed:', message);
    res.status(500).json({ error: 'Sonnet evaluation failed', durationMs });
  }
}
