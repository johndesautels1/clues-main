/**
 * CristianoVideoPlayer — Video polling, playback, and Supabase Storage save.
 *
 * Conv 19-20: Cristiano Judge UI + Video.
 * The "WOW Moment" — cinematic video rendered by HeyGen.
 *
 * States:
 *   1. Idle — "Generate Video" button
 *   2. Generating storyboard — Sonnet 4.6 creating 7-scene script
 *   3. Rendering — HeyGen processing (polls every 5s, max 5 min)
 *   4. Ready — Video player with full controls
 *   5. Error — Retry with error details
 *
 * Saves completed video URL to Supabase Storage for persistence.
 * MI6 Briefing Room aesthetic throughout.
 *
 * WCAG 2.1 AA: All text >= 11px, 4.5:1 contrast, focus-visible.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { JudgeReport } from '../../types/judge';
import type { CitySmartScore } from '../../types/smartScore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import './Results.css';

const MI6 = {
  midnight: '#0a1628',
  cockpit: '#0e1f3d',
  gold: '#c4a87a',
  goldBright: '#f59e0b',
  goldDim: 'rgba(196, 168, 122, 0.15)',
  goldBorder: 'rgba(196, 168, 122, 0.25)',
  textPrimary: '#f0ece4',
  textSecondary: '#a8a090',
  textMuted: '#7a7468',
  green: '#4ade80',
  red: '#f87171',
};

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_DURATION_MS = 300_000; // 5 minutes

type VideoState = 'idle' | 'storyboard' | 'rendering' | 'ready' | 'error';

interface CristianoVideoPlayerProps {
  report: JudgeReport;
  winnerCity: CitySmartScore;
  sessionId: string;
  /** If video was already rendered, pass the URL */
  existingVideoUrl?: string;
}

export function CristianoVideoPlayer({
  report,
  winnerCity,
  sessionId,
  existingVideoUrl,
}: CristianoVideoPlayerProps) {
  const [state, setState] = useState<VideoState>(existingVideoUrl ? 'ready' : 'idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl ?? null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const generateVideo = useCallback(async () => {
    setState('storyboard');
    setError('');
    setProgress('Generating cinematic storyboard...');

    try {
      // Stage 1: Generate storyboard
      const topCategories = winnerCity.categoryScores
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(c => ({ name: c.categoryName, score: c.score }));

      const storyboardRes = await fetch('/api/cristiano-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          winnerCity: winnerCity.location,
          winnerCountry: winnerCity.country,
          winnerScore: winnerCity.overallScore,
          keyFactors: report.executiveSummary.keyFactors,
          recommendation: report.executiveSummary.recommendation,
          futureOutlook: report.executiveSummary.futureOutlook,
          topCategories,
          runnersUp: report.summaryOfFindings.locationScores
            .filter(l => l.location !== winnerCity.location)
            .slice(0, 2)
            .map(l => ({ city: l.location, country: l.country, score: l.score })),
        }),
      });

      if (!storyboardRes.ok) {
        throw new Error(`Storyboard generation failed (HTTP ${storyboardRes.status})`);
      }

      const { storyboard } = await storyboardRes.json();

      // Stage 2: Submit to HeyGen for rendering
      setState('rendering');
      setProgress(`Rendering ${storyboard.scenes.length}-scene video (${storyboard.totalDurationSeconds}s)...`);

      const renderRes = await fetch('/api/heygen-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, storyboard }),
      });

      if (!renderRes.ok) {
        throw new Error(`HeyGen render submission failed (HTTP ${renderRes.status})`);
      }

      const { video_id } = await renderRes.json();

      // Stage 3: Poll for completion
      pollStartRef.current = Date.now();
      pollTimerRef.current = setInterval(async () => {
        try {
          const elapsed = Date.now() - pollStartRef.current;
          if (elapsed > MAX_POLL_DURATION_MS) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            throw new Error('Video rendering timed out (5 minutes). Please try again.');
          }

          const secs = Math.round(elapsed / 1000);
          setProgress(`Rendering video... (${secs}s elapsed)`);

          const pollRes = await fetch(`/api/heygen-render?video_id=${video_id}`);
          if (!pollRes.ok) return; // Retry next interval

          const pollData = await pollRes.json();

          if (pollData.status === 'completed' && pollData.video_url) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVideoUrl(pollData.video_url);
            setThumbnailUrl(pollData.thumbnail_url ?? null);
            setState('ready');

            // Save to Supabase Storage
            void saveVideoToStorage(pollData.video_url, sessionId);
          } else if (pollData.status === 'failed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            throw new Error('HeyGen video rendering failed.');
          }
        } catch (pollErr) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setState('error');
          setError(pollErr instanceof Error ? pollErr.message : 'Polling error');
        }
      }, POLL_INTERVAL_MS);

    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Video generation failed');
    }
  }, [report, winnerCity, sessionId]);

  return (
    <div style={{
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      border: `1px solid ${MI6.goldBorder}`,
      background: MI6.midnight,
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: `1px solid ${MI6.goldBorder}`,
        background: `linear-gradient(180deg, rgba(196, 168, 122, 0.06) 0%, transparent 100%)`,
      }}>
        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">&#x1F3AC;</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Cormorant', serif",
            fontSize: 'var(--text-lg)',
            fontWeight: 400,
            color: MI6.textPrimary,
          }}>
            Your New Life in {winnerCity.location}
          </div>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            color: MI6.gold,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Cinematic Verdict by Cristiano
          </div>
        </div>
        {state === 'ready' && (
          <div style={{
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            color: MI6.green,
          }}>
            Ready
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{
        position: 'relative',
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050810',
      }}>
        {/* Idle state — Generate button */}
        {state === 'idle' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem' }} aria-hidden="true">&#x1F3AC;</div>
            <div style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-xl)',
              color: MI6.textPrimary,
            }}>
              Generate Your Cinematic Verdict
            </div>
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-sm)',
              color: MI6.textSecondary,
              lineHeight: 1.7,
              maxWidth: 380,
            }}>
              Cristiano will narrate a personalized cinematic video about
              your recommended city, covering key factors and lifestyle highlights.
            </p>
            <button
              onClick={generateVideo}
              style={{
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                background: `linear-gradient(135deg, ${MI6.gold} 0%, ${MI6.goldBright} 100%)`,
                border: 'none',
                color: MI6.midnight,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(196, 168, 122, 0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              Generate Video
            </button>
          </div>
        )}

        {/* Generating/Rendering state */}
        {(state === 'storyboard' || state === 'rendering') && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 40,
            textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid rgba(196, 168, 122, 0.2)`,
              borderTopColor: MI6.gold,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-base)',
              color: MI6.textPrimary,
            }}>
              {state === 'storyboard' ? 'Creating Storyboard' : 'Rendering Video'}
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-xs)',
              color: MI6.textMuted,
            }}>
              {progress}
            </div>
            {state === 'rendering' && (
              <div style={{
                display: 'flex',
                gap: 3,
                alignItems: 'flex-end',
                marginTop: 4,
              }}>
                {[3, 5, 7, 5, 4, 6, 3, 5, 4].map((h, i) => (
                  <div key={i} style={{
                    width: 3, height: h, background: MI6.gold, borderRadius: 2,
                    animation: `discovery-soundBar 0.45s ease-in-out ${i * 0.07}s infinite alternate`,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ready state — Video player */}
        {state === 'ready' && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl ?? undefined}
            controls
            preload="metadata"
            style={{
              width: '100%',
              maxHeight: 540,
              objectFit: 'contain',
              background: '#000',
            }}
          >
            <track kind="captions" label="English" />
          </video>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 40,
            textAlign: 'center',
            maxWidth: 420,
          }}>
            <div style={{ fontSize: '2rem', color: MI6.red }} aria-hidden="true">&#x26A0;</div>
            <div style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-xl)',
              color: MI6.textPrimary,
            }}>
              Video Generation Failed
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-xs)',
              color: MI6.textSecondary,
              lineHeight: 1.7,
              padding: '8px 12px',
              background: 'rgba(248, 113, 113, 0.06)',
              border: '1px solid rgba(248, 113, 113, 0.15)',
              borderRadius: 8,
            }}>
              {error}
            </div>
            <button
              onClick={generateVideo}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                background: MI6.goldDim,
                border: `1px solid ${MI6.goldBorder}`,
                color: MI6.gold,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Spin keyframe (inline for this component) */}
      {(state === 'storyboard' || state === 'rendering') && (
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      )}
    </div>
  );
}

// ─── Supabase Storage ──────────────────────────────────────────

async function saveVideoToStorage(videoUrl: string, sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // Download video
    const response = await fetch(videoUrl);
    if (!response.ok) return;
    const blob = await response.blob();

    // Upload to Supabase Storage
    const fileName = `cristiano-verdicts/${sessionId}/${Date.now()}.mp4`;
    const { error } = await supabase.storage
      .from('videos')
      .upload(fileName, blob, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (error) {
      console.warn('[CristianoVideoPlayer] Storage upload failed:', error.message);
    }
  } catch (err) {
    console.warn('[CristianoVideoPlayer] Storage save failed:', err);
  }
}
