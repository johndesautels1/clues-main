/**
 * /api/olivia-chat — Olivia AI Advisor Proxy
 *
 * Proxies chat requests to Claude so the API key stays server-side.
 * Used by both the Olivia chat panel and HeyGen video modal.
 *
 * Critical Rule #14: Every LLM call must track tokens and cost.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface OliviaChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  system: string;
  sessionId?: string;
}

// ─── Cost tracking helper ──────────────────────────────────────
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

// ─── Claude Token Rates (per 1M tokens, Sonnet 4) ─────────────
const CLAUDE_INPUT_RATE = 3.0;
const CLAUDE_OUTPUT_RATE = 15.0;

function calculateClaudeCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * CLAUDE_INPUT_RATE + outputTokens * CLAUDE_OUTPUT_RATE) / 1_000_000;
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const body = req.body as OliviaChatRequest;

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'Missing messages array' });
    return;
  }

  if (!body.system) {
    res.status(400).json({ error: 'Missing system prompt' });
    return;
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    const reply = data.content?.[0]?.text || "I'm here to help — could you tell me more?";

    // Extract usage
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const costUsd = calculateClaudeCost(inputTokens, outputTokens);

    // Track cost (non-blocking)
    if (body.sessionId) {
      trackCost({
        sessionId: body.sessionId,
        model: 'claude-sonnet-4-5',
        endpoint: '/api/olivia-chat',
        inputTokens,
        outputTokens,
        costUsd,
        durationMs,
      }).catch(() => {});
    }

    res.status(200).json({
      reply,
      usage: {
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('[/api/olivia-chat] Claude call failed:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      error: 'Olivia chat failed',
      detail: message,
      durationMs,
    });
  }
}
