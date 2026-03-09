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
 * Pricing (per 1M tokens):
 *   - Input:  $5.00
 *   - Output: $20.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Request type ─────────────────────────────────────────────
interface GPTRealtimeRequest {
  sessionId: string;
  /** Voice preset for Olivia */
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  /** System instructions for Olivia's persona */
  instructions?: string;
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

// ─── Default Olivia system instructions ──────────────────────
const DEFAULT_OLIVIA_INSTRUCTIONS = `You are Olivia, the CLUES Intelligence AI advisor. You help users understand their relocation evaluation results through live voice conversation.

Your personality:
- Warm, professional, and knowledgeable
- You explain complex data in simple terms
- You reference specific metrics and scores when discussing locations
- You never make up data — if you don't know something, say so
- You encourage users to complete more questionnaire sections for better accuracy

Keep responses concise for voice — 2-3 sentences max per turn unless the user asks for detail.`;

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

  const body = req.body as GPTRealtimeRequest;

  if (!body.sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }

  const startTime = Date.now();

  try {
    // ─── Create ephemeral session token ──────────────────────
    const realtimeResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-realtime-1.5',
        voice: body.voice ?? 'shimmer',
        instructions: body.instructions ?? DEFAULT_OLIVIA_INSTRUCTIONS,
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!realtimeResponse.ok) {
      const errText = await realtimeResponse.text();
      throw new Error(`OpenAI Realtime API returned ${realtimeResponse.status}: ${errText}`);
    }

    const sessionData = await realtimeResponse.json();
    const durationMs = Date.now() - startTime;

    // Track the session creation cost (minimal — just the API call)
    trackCost({
      sessionId: body.sessionId,
      model: 'gpt-realtime-1.5',
      endpoint: '/api/gpt-realtime',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0, // Session creation is free; usage billed per audio token
      durationMs,
    }).catch(() => {});

    // ─── Validate token was returned ─────────────────────────
    const token = sessionData.client_secret?.value ?? sessionData.token;
    const expiresAt = sessionData.client_secret?.expires_at ?? sessionData.expires_at;

    if (!token) {
      console.error('[/api/gpt-realtime] No token in OpenAI response:', JSON.stringify(sessionData).slice(0, 500));
      res.status(502).json({ error: 'OpenAI Realtime session created but no token returned' });
      return;
    }

    // ─── Return session token + config ───────────────────────
    res.status(200).json({
      /** Ephemeral token for WebRTC connection (expires in 60s) */
      token,
      /** Token expiry timestamp */
      expiresAt,
      /** Session ID from OpenAI */
      realtimeSessionId: sessionData.id,
      /** Voice used */
      voice: body.voice ?? 'shimmer',
      metadata: {
        model: 'gpt-realtime-1.5',
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('[/api/gpt-realtime] GPT Realtime 1.5 session creation failed:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/gpt-realtime] Detail:', message);
    res.status(500).json({
      error: 'GPT Realtime session creation failed',
      durationMs,
    });
  }
}
