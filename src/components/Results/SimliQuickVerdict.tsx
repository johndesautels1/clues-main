/**
 * SimliQuickVerdict — Real-time avatar narration of the judge verdict.
 *
 * Conv 19-20: Cristiano Judge UI + Video.
 * Simli provides instant avatar narration (no render wait time).
 * Cristiano speaks the executive summary aloud via real-time streaming.
 *
 * Features:
 *   - Simli avatar with audio streaming
 *   - Auto-generated verdict script from JudgeReport
 *   - Play/pause controls
 *   - Speaking indicator with audio bars
 *   - Fallback to text-only if Simli unavailable
 *
 * WCAG 2.1 AA: All text >= 11px, 4.5:1 contrast, focus-visible.
 * MI6 Briefing Room aesthetic maintained.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { JudgeReport } from '../../types/judge';
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
};

/** Build a spoken verdict script from the judge report */
function buildVerdictScript(report: JudgeReport): string {
  const { summaryOfFindings, executiveSummary } = report;

  const topLocation = summaryOfFindings.locationScores.length > 0
    ? summaryOfFindings.locationScores.sort((a, b) => b.score - a.score)[0]
    : null;

  const lines: string[] = [];

  // Opening
  lines.push('Good evening. I\'m Cristiano, your judicial intelligence officer.');

  // Recommendation
  if (topLocation) {
    lines.push(
      `After reviewing ${summaryOfFindings.metricsReviewed} metrics across ${report.categoryAnalysis.length} categories, ` +
      `my recommendation is ${executiveSummary.recommendation}.`
    );
  }

  // Key factors (top 3)
  const topFactors = executiveSummary.keyFactors.slice(0, 3);
  if (topFactors.length > 0) {
    lines.push('The key factors driving this decision are:');
    topFactors.forEach((f, i) => lines.push(`${i + 1}. ${f}`));
  }

  // Overrides
  if (summaryOfFindings.metricsOverridden > 0) {
    lines.push(
      `I overrode ${summaryOfFindings.metricsOverridden} metric${summaryOfFindings.metricsOverridden !== 1 ? 's' : ''} ` +
      `where the five evaluating models disagreed significantly.`
    );
  }

  // Future outlook (first sentence only)
  if (executiveSummary.futureOutlook) {
    const firstSentence = executiveSummary.futureOutlook.split('.')[0] + '.';
    lines.push(firstSentence);
  }

  // Closing
  lines.push('The full judicial briefing is available below. Cristiano out.');

  return lines.join(' ');
}

interface SimliQuickVerdictProps {
  report: JudgeReport;
}

export function SimliQuickVerdict({ report }: SimliQuickVerdictProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'speaking' | 'done' | 'error'>('idle');
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const script = buildVerdictScript(report);

  const startNarration = useCallback(async () => {
    setStatus('connecting');
    abortRef.current = new AbortController();

    try {
      // Call Simli real-time API for avatar narration
      const res = await fetch('/api/simli-narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Simli API returned ${res.status}`);
      }

      // Stream audio response
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setStatus('done');
        audioRef.current.onerror = () => setStatus('error');
        await audioRef.current.play();
        setStatus('speaking');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus('idle');
        return;
      }
      console.error('Simli narration error:', err);
      setStatus('error');
    }
  }, [script]);

  const stopNarration = () => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: '20px 24px',
        background: `linear-gradient(160deg, ${MI6.midnight} 0%, ${MI6.cockpit} 100%)`,
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${MI6.goldBorder}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
      }}>
        {/* Avatar circle */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${MI6.gold} 0%, ${MI6.goldBright} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: status === 'speaking'
            ? `0 0 16px rgba(196, 168, 122, 0.5), 0 0 32px rgba(196, 168, 122, 0.2)`
            : 'none',
          transition: 'box-shadow 0.3s ease',
          flexShrink: 0,
        }}>
          &#x2696;
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Cormorant', serif",
            fontSize: 'var(--text-lg)',
            fontWeight: 400,
            color: MI6.textPrimary,
          }}>
            Cristiano&apos;s Quick Verdict
          </div>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            color: MI6.gold,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {status === 'idle' ? 'Ready' :
             status === 'connecting' ? 'Connecting...' :
             status === 'speaking' ? 'Speaking' :
             status === 'done' ? 'Complete' :
             'Unavailable'}
          </div>
        </div>

        {/* Controls */}
        {status === 'idle' || status === 'done' || status === 'error' ? (
          <button
            onClick={startNarration}
            aria-label="Play Cristiano's verdict narration"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              background: MI6.goldDim,
              border: `1px solid ${MI6.goldBorder}`,
              color: MI6.gold,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.2s ease',
            }}
          >
            <span aria-hidden="true">&#x25B6;</span>
            {status === 'error' ? 'Retry' : status === 'done' ? 'Replay' : 'Play Verdict'}
          </button>
        ) : status === 'speaking' ? (
          <button
            onClick={stopNarration}
            aria-label="Stop narration"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: MI6.textSecondary,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span aria-hidden="true">&#x23F9;</span>
            Stop
          </button>
        ) : (
          <div style={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-end',
            padding: '8px 16px',
          }}>
            {[3, 5, 7, 5, 4, 6, 3].map((h, i) => (
              <div key={i} style={{
                width: 3, height: h, background: MI6.gold, borderRadius: 2,
                animation: `discovery-soundBar 0.45s ease-in-out ${i * 0.07}s infinite alternate`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Speaking indicator */}
      {status === 'speaking' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: MI6.goldDim,
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: MI6.green,
            boxShadow: `0 0 8px ${MI6.green}88`,
            animation: 'pulse-sapphire 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            color: MI6.gold,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Cristiano is delivering the verdict...
          </span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(248, 113, 113, 0.06)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
          borderRadius: 8,
          marginBottom: 12,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          color: MI6.textSecondary,
        }}>
          Avatar narration unavailable. Reading the transcript below instead.
        </div>
      )}

      {/* Transcript toggle */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        aria-expanded={showTranscript}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          color: MI6.textMuted,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{
          transform: showTranscript ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
        }} aria-hidden="true">&#x25BC;</span>
        {showTranscript ? 'Hide' : 'Show'} Transcript
      </button>

      {showTranscript && (
        <div style={{
          marginTop: 8,
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 8,
        }}>
          <p style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 'var(--text-sm)',
            color: MI6.textSecondary,
            lineHeight: 1.8,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {script}
          </p>
        </div>
      )}
    </div>
  );
}
