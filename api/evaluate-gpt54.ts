/**
 * /api/evaluate-gpt54 — GPT-5.4 (OpenAI) LLM Evaluator #2
 *
 * Pricing (per 1M tokens): Input $5.00, Output $20.00
 * Strengths: Enormous knowledge base, multi-step reasoning, edge case detection
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

// ─── GPT-5.4 Config ─────────────────────────────────────────────
const MODEL_ID = 'gpt-5.4';
const GPT54_INPUT_RATE = 5.00;
const GPT54_OUTPUT_RATE = 20.00;
const EVALUATOR_IDENTITY = {
  number: 2,
  model: 'GPT-5.4',
  strengths: [
    'Enormous factual knowledge base spanning global datasets',
    'Advanced multi-step reasoning for complex scoring decisions',
    'Detecting edge cases and anomalies in location data',
    'High-stakes logic where precision matters',
  ],
};

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * GPT54_INPUT_RATE + outputTokens * GPT54_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
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
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: 'system', content: 'You are a precise location analyst. Return only valid JSON. No markdown fences.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 32768,
          response_format: { type: 'json_object' },
        }),
      }
    );

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    const truncated = result.choices?.[0]?.finish_reason === 'length';
    if (truncated) {
      console.warn('[/api/evaluate-gpt54] Response truncated (hit max_tokens).');
    }

    const rawText = result.choices?.[0]?.message?.content ?? '';
    const evaluation = parseEvaluationResponse(rawText, body.category, MODEL_ID);

    const usage = result.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/evaluate-gpt54',
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
        reasoningTokens,
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
    console.error('[/api/evaluate-gpt54] Failed:', message);
    res.status(500).json({ error: 'GPT-5.4 evaluation failed', durationMs });
  }
}
