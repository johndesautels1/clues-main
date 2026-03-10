/**
 * /api/gpt-realtime — GPT Realtime 1.5 (OpenAI) — Olivia Live Voice/Video
 *
 * Creates an ephemeral session token for GPT Realtime 1.5 WebRTC connections.
 * Used by the Olivia avatar for real-time voice and video interaction.
 *
 * Flow:
 *   1. Client requests a session token via POST
 *   2. This endpoint creates an ephemeral token from OpenAI's Realtime API
 *   3. Client uses the token to establish a direct WebRTC connection
 *   4. All subsequent audio/video streams go directly to OpenAI (not through us)
 *
 * The ephemeral token expires after 60 seconds (OpenAI default).
 * The client must establish the WebRTC connection within that window.
 *
 * Pricing (per 1M tokens): Input $5.00, Output $20.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Config ─────────────────────────────────────────────────────
const MODEL_ID = 'gpt-realtime-1.5';
const ALLOWED_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse']);
const SESSION_TIMEOUT_MS = 15_000; // 15s timeout for session creation
const MAX_INSTRUCTIONS_LENGTH = 2000;

// ─── Cost tracking helper ───────────────────────────────────────
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

// ─── Default Olivia system instructions ──────────────────────────
const DEFAULT_OLIVIA_INSTRUCTIONS = `You are Olivia, the CLUES Intelligence AI advisor. You help users understand their relocation evaluation results through live voice conversation.

Your personality:
- Warm, professional, and knowledgeable
- You explain complex data in simple terms
- You reference specific metrics and scores when discussing locations
- You never make up data — if you don't know something, say so
- You encourage users to complete more questionnaire sections for better accuracy

Keep responses concise for voice — 2-3 sentences max per turn unless the user asks for detail.`;

// ─── Handler ─────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    return;
  }

  const body = req.body as { sessionId?: string; voice?: string; instructions?: string };

  if (!body.sessionId || typeof body.sessionId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid sessionId' });
    return;
  }

  const startTime = Date.now();

  try {
    // Validate voice against whitelist (runtime check)
    const voice = ALLOWED_VOICES.has(body.voice ?? '') ? body.voice! : 'shimmer';

    // Sanitize instructions: use default if not provided, or truncate + strip HTML
    const instructions = body.instructions
      ? body.instructions
          .replace(/<[^>]*>/g, '')
          .replace(/[\x00-\x1f\x7f]/g, '')
          .trim()
          .slice(0, MAX_INSTRUCTIONS_LENGTH)
      : DEFAULT_OLIVIA_INSTRUCTIONS;

    // Create ephemeral session token with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);

    let realtimeResponse: Response;
    try {
      realtimeResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          voice,
          instructions,
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!realtimeResponse.ok) {
      const errText = await realtimeResponse.text();
      console.error(`[/api/gpt-realtime] OpenAI returned ${realtimeResponse.status}: ${errText}`);
      throw new Error('OpenAI Realtime API error');
    }

    const sessionData = await realtimeResponse.json();
    const durationMs = Date.now() - startTime;

    // Track session creation (cost is 0 — usage billed per audio token during stream)
    void trackCost({
      sessionId: body.sessionId,
      model: MODEL_ID,
      endpoint: '/api/gpt-realtime',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs,
    });

    // Validate token was returned
    const token = sessionData.client_secret?.value ?? sessionData.token;
    const expiresAt = sessionData.client_secret?.expires_at ?? sessionData.expires_at;

    if (!token) {
      console.error('[/api/gpt-realtime] No token in OpenAI response (session ID:', sessionData.id ?? 'unknown', ')');
      res.status(502).json({ error: 'OpenAI Realtime session created but no token returned' });
      return;
    }

    res.status(200).json({
      token,
      expiresAt,
      realtimeSessionId: sessionData.id,
      voice,
      metadata: {
        model: MODEL_ID,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/gpt-realtime] Failed:', message);
    // Error detail removed — logged server-side only
    res.status(500).json({ error: 'GPT Realtime session creation failed', durationMs });
  }
}
