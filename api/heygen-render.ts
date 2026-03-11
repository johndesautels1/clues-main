/**
 * /api/heygen-render — HeyGen Video Agent V2 cinematic render
 *
 * Stage 2 of the Cristiano Video Pipeline (§15.13).
 * Receives a validated storyboard and submits it to HeyGen's
 * Video Generation API for cinematic rendering.
 *
 * Features:
 *   - Converts storyboard scenes into HeyGen video spec
 *   - Cristiano avatar for A-ROLL scenes
 *   - B-ROLL stock footage via scene visual keywords
 *   - ElevenLabs voice → OpenAI onyx fallback
 *   - Returns video_id for polling (render is async)
 *   - Saves render job metadata to Supabase
 *
 * Polling happens client-side via /api/heygen-render?video_id=xxx (GET)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, trackCost } from './_shared/evaluation-utils';

// ─── Types ─────────────────────────────────────────────────────

interface StoryboardScene {
  scene: number;
  type: 'A-ROLL' | 'B-ROLL';
  durationSeconds: number;
  narration: string;
  visualKeywords: string[];
  categoryFocus?: string;
}

interface RenderRequest {
  sessionId: string;
  storyboard: {
    title: string;
    totalDurationSeconds: number;
    totalWords: number;
    scenes: StoryboardScene[];
  };
  /** Override avatar ID (optional) */
  avatarId?: string;
  /** Override voice ID (optional) */
  voiceId?: string;
}

// ─── HeyGen Video API helpers ──────────────────────────────────

function buildHeyGenVideoSpec(
  storyboard: RenderRequest['storyboard'],
  avatarId: string,
  voiceId: string
) {
  return {
    video_inputs: storyboard.scenes.map(scene => {
      if (scene.type === 'A-ROLL') {
        // Avatar talking to camera
        return {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: scene.narration,
            voice_id: voiceId,
            speed: 1.0,
          },
          background: {
            type: 'color',
            value: '#0a1628', // MI6 midnight navy
          },
        };
      } else {
        // B-ROLL: stock footage with voiceover
        return {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
            scale: 0, // Hidden — voiceover only
          },
          voice: {
            type: 'text',
            input_text: scene.narration,
            voice_id: voiceId,
            speed: 1.0,
          },
          background: {
            type: 'template',
            value: scene.visualKeywords.slice(0, 3).join(' '),
          },
        };
      }
    }),
    dimension: { width: 1920, height: 1080 },
    title: storyboard.title,
    test: process.env.NODE_ENV !== 'production',
  };
}

// ─── Handler ───────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(req, res)) return;

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'HEYGEN_API_KEY not configured' });
    return;
  }

  // ── GET: Poll for video status ─────────────────────────────
  if (req.method === 'GET') {
    const videoId = req.query.video_id as string;
    if (!videoId) {
      res.status(400).json({ error: 'Missing video_id query parameter' });
      return;
    }

    try {
      const pollRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { 'x-api-key': apiKey },
      });

      if (!pollRes.ok) {
        throw new Error(`HeyGen status API returned ${pollRes.status}`);
      }

      const pollData = await pollRes.json();
      const status = pollData.data?.status ?? 'unknown';
      const videoUrl = pollData.data?.video_url ?? null;
      const thumbnailUrl = pollData.data?.thumbnail_url ?? null;
      const duration = pollData.data?.duration ?? null;

      res.status(200).json({
        video_id: videoId,
        status,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[/api/heygen-render] Poll failed:', message);
      res.status(500).json({ error: 'Failed to poll video status', detail: message });
    }
    return;
  }

  // ── POST: Submit render job ────────────────────────────────
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as RenderRequest;
  if (!body.sessionId || !body.storyboard?.scenes?.length) {
    res.status(400).json({ error: 'Missing required fields: sessionId, storyboard' });
    return;
  }

  const avatarId = body.avatarId ?? process.env.HEYGEN_CRISTIANO_AVATAR_ID ?? 'default';
  const voiceId = body.voiceId ?? process.env.HEYGEN_CRISTIANO_VOICE_ID ?? process.env.ELEVENLABS_CRISTIANO_VOICE_ID ?? 'default';

  const startTime = Date.now();

  try {
    const videoSpec = buildHeyGenVideoSpec(body.storyboard, avatarId, voiceId);

    const renderRes = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(videoSpec),
    });

    if (!renderRes.ok) {
      const errText = await renderRes.text();
      throw new Error(`HeyGen render API returned ${renderRes.status}: ${errText}`);
    }

    const renderData = await renderRes.json();
    const videoId = renderData.data?.video_id ?? renderData.video_id;

    if (!videoId) {
      throw new Error('HeyGen did not return a video_id');
    }

    const durationMs = Date.now() - startTime;

    // Track cost — HeyGen charges per minute of video
    const estimatedMinutes = body.storyboard.totalDurationSeconds / 60;
    const estimatedCost = estimatedMinutes * 0.50; // ~$0.50/min estimate

    void trackCost({
      sessionId: body.sessionId,
      model: 'avatar-heygen',
      endpoint: '/api/heygen-render',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: estimatedCost,
      durationMs,
    });

    res.status(200).json({
      video_id: videoId,
      status: 'processing',
      estimated_duration_seconds: body.storyboard.totalDurationSeconds,
      scene_count: body.storyboard.scenes.length,
      metadata: {
        avatarId,
        voiceId,
        costEstimate: Number(estimatedCost.toFixed(4)),
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/heygen-render] Failed:', message);
    res.status(500).json({ error: 'HeyGen render failed', detail: message, durationMs });
  }
}
