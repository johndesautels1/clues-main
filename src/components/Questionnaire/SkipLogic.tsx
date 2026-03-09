/**
 * SkipLogic — Visual indicators for skippable questions.
 *
 * Two components:
 *  - SkipIndicator: Inline badge shown on questions that can be skipped.
 *    Appears below the question text with reason + "Skip" button.
 *  - SkipSummaryBar: Module-level summary bar showing total skippable count.
 *    Appears at the top of MiniModuleFlow when skip data is available.
 *
 * WCAG 2.1 AA compliant — all text ≥ 11px, all colors verified against #0a0e1a.
 * Skip is OPTIONAL — the user can always answer the question anyway.
 */

import { C } from './questionnaireData';
import type { SkipInfo } from '../../hooks/useSkipLogic';

// ─── Source icons (text, not emoji, for WCAG) ───────────────────

function sourceLabel(source: SkipInfo['source']): string {
  if (source === 'paragraphical') return 'Paragraphs';
  if (source === 'main_module') return 'Main Module';
  return 'Coverage';
}

// ─── SkipIndicator ──────────────────────────────────────────────

interface SkipIndicatorProps {
  skipInfo: SkipInfo;
  onSkip: () => void;
}

/**
 * Inline badge shown below a question when it can be skipped.
 * Displays: reason text + source label + "Skip" button.
 * The user can always dismiss and answer anyway.
 */
export function SkipIndicator({ skipInfo, onSkip }: SkipIndicatorProps) {
  const confidencePct = Math.round(skipInfo.confidence * 100);

  return (
    <div
      role="status"
      aria-label={`This question can be skipped: ${skipInfo.reason}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', marginTop: 8,
        background: 'rgba(96,165,250,0.06)',
        border: '1px solid rgba(96,165,250,0.15)',
        borderRadius: 8,
      }}
    >
      {/* Reason text */}
      <span style={{
        flex: 1, minWidth: 0,
        fontFamily: "'Outfit',sans-serif", fontSize: 12,
        color: C.textSecondary, letterSpacing: '0.02em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {skipInfo.reason}
      </span>

      {/* Source + confidence badge */}
      <span style={{
        flexShrink: 0,
        fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
        color: C.textMuted, letterSpacing: '0.03em',
      }}>
        {sourceLabel(skipInfo.source)} · {confidencePct}%
      </span>

      {/* Skip button */}
      <button
        onClick={onSkip}
        aria-label="Skip this question"
        style={{
          flexShrink: 0, minHeight: 44, minWidth: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px 14px',
          background: 'rgba(96,165,250,0.10)',
          border: '1px solid rgba(96,165,250,0.20)',
          borderRadius: 6, cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
          color: C.textAccent, letterSpacing: '0.02em',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.18)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.10)')}
      >
        Skip
      </button>
    </div>
  );
}

// ─── SkipSummaryBar ─────────────────────────────────────────────

interface SkipSummaryBarProps {
  skipSummary: string;
  skippableCount: number;
}

/**
 * Module-level summary bar shown when skip data is available.
 * "Olivia" explains that some questions are already covered.
 */
export function SkipSummaryBar({ skipSummary, skippableCount }: SkipSummaryBarProps) {
  if (skippableCount === 0 || !skipSummary) return null;

  return (
    <div
      role="status"
      aria-label={skipSummary}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 10,
        marginBottom: 12,
      }}
    >
      {/* Olivia attribution */}
      <span style={{
        fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
        color: '#22c55e', letterSpacing: '0.02em', flexShrink: 0,
      }}>
        Olivia
      </span>

      {/* Summary text */}
      <span style={{
        fontFamily: "'Outfit',sans-serif", fontSize: 12,
        color: C.textSecondary, letterSpacing: '0.02em',
        flex: 1, minWidth: 0,
      }}>
        {skipSummary} — you can skip these or answer for extra precision.
      </span>
    </div>
  );
}
