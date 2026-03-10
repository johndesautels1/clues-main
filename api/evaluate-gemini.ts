/**
 * /api/evaluate-gemini — Gemini 3.1 Pro Preview (Google) LLM Evaluator #3
 *
 * Pricing (per 1M tokens): Input $1.25, Output $10.00
 * Strengths: Inferential reasoning, user intent, Google Search grounding
 *
 * NOTE: Gemini is also the REASONING ENGINE for Paragraphical extraction
 *       (see api/paragraphical.ts). This endpoint reuses the same model
 *       for category evaluation during the 5-LLM parallel phase.
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

// ─── Gemini Config ──────────────────────────────────────────────
const MODEL_ID = 'gemini-3.1-pro-preview';
const GEMINI_INPUT_RATE = 1.25;  // C2 fix: was $2.00 — corrected to $1.25
const GEMINI_OUTPUT_RATE = 10.00; // C2 fix: was $12.00 — corrected to $10.00
const EVALUATOR_IDENTITY = {
  number: 3,
  model: 'Gemini 3.1 Pro Preview',
  strengths: [
    'Deep inferential reasoning from user-written paragraphs',
    'Understanding nuanced user intent and priorities',
    'Real-time data verification via Google Search grounding',
    'Cost-efficient evaluation with high accuracy',
  ],
};

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * GEMINI_INPUT_RATE + outputTokens * GEMINI_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
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

    // C1 fix: API key in x-goog-api-key header instead of URL query string
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{ text: 'You are a precise location analyst. Return only valid JSON. No markdown fences.' }],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 32768,
            responseMimeType: 'application/json',
          },
          tools: [{ google_search: {} }],
        }),
      }
    );

    const result = await response.json();
    const durationMs = Date.now() - startTime;

    // Check for truncation or safety block
    const finishReason = result.candidates?.[0]?.finishReason;
    const truncated = finishReason === 'MAX_TOKENS';
    if (truncated) {
      console.warn('[/api/evaluate-gemini] Response truncated (hit maxOutputTokens).');
    } else if (finishReason === 'SAFETY') {
      console.warn('[/api/evaluate-gemini] Response blocked by safety filters.');
      throw new Error('Gemini response blocked by safety filters — no usable output');
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const evaluation = parseEvaluationResponse(rawText, body.category, MODEL_ID);

    const usageMetadata = result.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = calculateCost(inputTokens, outputTokens);

    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/evaluate-gemini',
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
    console.error('[/api/evaluate-gemini] Failed:', message);
    res.status(500).json({ error: 'Gemini evaluation failed', durationMs });
  }
}
