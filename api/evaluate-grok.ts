/**
 * /api/evaluate-grok — Grok 4.1 Fast Reasoning (xAI) LLM Evaluator #4
 *
 * Pricing (per 1M tokens): Input $0.20, Output $0.50
 * Strengths: Math/quantitative analysis, real-time web data, fast reasoning
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

// ─── Grok Config ────────────────────────────────────────────────
const MODEL_ID = 'grok-4-1-fast-reasoning';
const GROK_INPUT_RATE = 0.20;
const GROK_OUTPUT_RATE = 0.50;
const EVALUATOR_IDENTITY = {
  number: 4,
  model: 'Grok 4.1 Fast Reasoning',
  strengths: [
    'Mathematical calculations and quantitative analysis',
    'Processing real-time web data',
    'Detecting numerical inconsistencies in research data',
  ],
};

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * GROK_INPUT_RATE + outputTokens * GROK_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'XAI_API_KEY not configured' });
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

    // Note: Grok Fast Reasoning is a reasoning model — do NOT set response_format
    // as it may conflict with reasoning mode. Rely on prompt instructions for JSON.
    const response = await fetchWithRetry(
      'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: 'system', content: 'You are a precise quantitative analyst. Return only valid JSON. No markdown fences. No explanation outside the JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 32768,
        }),
      }
    );

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    const truncated = result.choices?.[0]?.finish_reason === 'length';
    if (truncated) {
      console.warn('[/api/evaluate-grok] Response truncated (hit max_tokens).');
    }

    const rawText = result.choices?.[0]?.message?.content ?? '';

    // parseEvaluationResponse strips <think> tags automatically (reasoning model fix)
    const evaluation = parseEvaluationResponse(rawText, body.category, MODEL_ID);

    const usage = result.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/evaluate-grok',
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
    console.error('[/api/evaluate-grok] Failed:', message);
    res.status(500).json({ error: 'Grok evaluation failed', durationMs });
  }
}
