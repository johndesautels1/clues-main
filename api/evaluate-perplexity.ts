/**
 * /api/evaluate-perplexity — Perplexity Sonar Reasoning Pro High LLM Evaluator #5
 *
 * Pricing (per 1M tokens): Input $1.00, Output $1.00
 * Strengths: Native web search, source citations with URLs, cross-validation
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

// ─── Perplexity Config ──────────────────────────────────────────
const MODEL_ID = 'sonar-reasoning-pro-high';
const PERPLEXITY_INPUT_RATE = 1.00;
const PERPLEXITY_OUTPUT_RATE = 1.00;
const EVALUATOR_IDENTITY = {
  number: 5,
  model: 'Perplexity Sonar Reasoning Pro High',
  strengths: [
    'Native web search — the best search capability of all 5 evaluators',
    'Finding current, relevant data with deep reasoning chains',
    'Citing real sources with URLs for every claim',
    'Cross-validating research data with independent web searches',
  ],
  rule3: 'Use your native search to independently verify Tavily data — you\'re the fact-checker.',
  rule4: 'Flag ANY data inconsistency between Tavily research and your search results.',
  importantOverride: 'IMPORTANT: You have Tavily research data below AND your own native search. Use BOTH. Tavily is your starting point, but independently verify and supplement with your own search. If you find contradictions, flag them in the "disagreements" array.',
};

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * PERPLEXITY_INPUT_RATE + outputTokens * PERPLEXITY_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'PERPLEXITY_API_KEY not configured' });
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

    // Note: Perplexity reasoning model — no response_format constraint
    const response = await fetchWithRetry(
      'https://api.perplexity.ai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: 'system', content: 'You are a precise location analyst with native web search. Return only valid JSON. No markdown fences.' },
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
      console.warn('[/api/evaluate-perplexity] Response truncated (hit max_tokens).');
    }

    const rawText = result.choices?.[0]?.message?.content ?? '';

    // parseEvaluationResponse strips <think> tags automatically (reasoning model)
    const evaluation = parseEvaluationResponse(rawText, body.category, MODEL_ID);

    const usage = result.usage;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/evaluate-perplexity',
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
    console.error('[/api/evaluate-perplexity] Failed:', message);
    res.status(500).json({ error: 'Perplexity evaluation failed', durationMs });
  }
}
