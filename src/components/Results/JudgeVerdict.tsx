/**
 * JudgeVerdict — MI6 Briefing Room styled verdict display.
 *
 * Conv 19-20: Cristiano Judge UI + Video.
 * Midnight navy background with gold accents, glassmorphic cards.
 * Displays:
 *   - Executive summary with recommendation
 *   - Key factors (top 5)
 *   - Future outlook
 *   - Overall confidence badge
 *   - Safeguard correction alerts (if triggered)
 *
 * WCAG 2.1 AA: Gold (#f59e0b) on midnight navy (#0a1628) = 8.2:1 contrast.
 * All text >= 11px, focus-visible on interactive.
 */

import type { JudgeReport, JudgeOrchestrationResult, SafeguardCorrection } from '../../types/judge';
import './Results.css';

// MI6 Briefing Room palette
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
  purple: '#c084fc',
};

function confidenceBadgeStyle(confidence: 'high' | 'medium' | 'low') {
  const colors = {
    high: { bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.3)', text: MI6.green, label: 'HIGH CONFIDENCE' },
    medium: { bg: MI6.goldDim, border: MI6.goldBorder, text: MI6.gold, label: 'MODERATE CONFIDENCE' },
    low: { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.3)', text: MI6.red, label: 'LOW CONFIDENCE' },
  };
  return colors[confidence];
}

interface JudgeVerdictProps {
  report: JudgeReport;
  /** Full orchestration result for safeguard info */
  orchestration?: JudgeOrchestrationResult;
}

export function JudgeVerdict({ report, orchestration }: JudgeVerdictProps) {
  const { summaryOfFindings, executiveSummary } = report;
  const conf = confidenceBadgeStyle(summaryOfFindings.overallConfidence);
  const safeguards = orchestration?.safeguardCorrections ?? [];

  return (
    <section
      className="judge-verdict"
      aria-label="Cristiano's Judicial Verdict"
      style={{
        padding: 'var(--space-8)',
        background: `linear-gradient(160deg, ${MI6.midnight} 0%, ${MI6.cockpit} 60%, ${MI6.midnight} 100%)`,
        borderRadius: 'var(--radius-2xl)',
        border: `1px solid ${MI6.goldBorder}`,
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(196, 168, 122, 0.08)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(196, 168, 122, 0.06) 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: MI6.gold,
          marginBottom: 8,
        }}>
          &#x2696; Cristiano&apos;s Verdict
        </div>
        <h2 style={{
          fontFamily: "'Cormorant', serif",
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 300,
          color: MI6.textPrimary,
          lineHeight: 1.2,
          margin: '0 0 12px',
        }}>
          Judicial Intelligence Briefing
        </h2>

        {/* Confidence badge */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          borderRadius: 'var(--radius-full)',
          background: conf.bg,
          border: `1px solid ${conf.border}`,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.1em',
          color: conf.text,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: conf.text,
          }} aria-hidden="true" />
          {conf.label}
        </span>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 16,
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Metrics Reviewed', value: summaryOfFindings.metricsReviewed },
            { label: 'Overrides', value: summaryOfFindings.metricsOverridden },
            { label: 'Categories', value: report.categoryAnalysis.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: MI6.goldBright,
              }}>{value}</div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-xs)',
                color: MI6.textMuted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safeguard alerts */}
      {safeguards.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(248, 113, 113, 0.08)',
          border: '1px solid rgba(248, 113, 113, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: MI6.red,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            &#x26A0; Anti-Hallucination Safeguard Triggered
          </div>
          {safeguards.map((sg: SafeguardCorrection, i: number) => (
            <div key={i} style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-sm)',
              color: MI6.textSecondary,
              lineHeight: 1.6,
              marginTop: i > 0 ? 6 : 0,
            }}>
              {sg.description} — Opus said &ldquo;{sg.opusValue}&rdquo;, math computed &ldquo;{sg.computedValue}&rdquo;
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(196, 168, 122, 0.06)',
        border: `1px solid ${MI6.goldBorder}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: 20,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: MI6.gold,
          marginBottom: 8,
        }}>
          Recommendation
        </div>
        <div style={{
          fontFamily: "'Cormorant', serif",
          fontSize: 'var(--text-2xl)',
          fontWeight: 300,
          color: MI6.textPrimary,
          marginBottom: 12,
        }}>
          {executiveSummary.recommendation}
        </div>
        <div style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 'var(--text-base)',
          color: MI6.textSecondary,
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
        }}>
          {executiveSummary.rationale}
        </div>
      </div>

      {/* Key Factors */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: MI6.gold,
          marginBottom: 10,
        }}>
          Key Factors
        </div>
        <ol style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {executiveSummary.keyFactors.map((factor, i) => (
            <li key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: MI6.gold,
                minWidth: 20,
                textAlign: 'right',
                flexShrink: 0,
                marginTop: 2,
              }}>
                {i + 1}.
              </span>
              <span style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: 'var(--text-base)',
                color: MI6.textSecondary,
                lineHeight: 1.6,
              }}>
                {factor}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Future Outlook */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: MI6.gold,
          marginBottom: 8,
        }}>
          Future Outlook
        </div>
        <p style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 'var(--text-base)',
          color: MI6.textSecondary,
          lineHeight: 1.8,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}>
          {executiveSummary.futureOutlook}
        </p>
      </div>

      {/* Location scores with trend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {summaryOfFindings.locationScores.map(loc => (
          <div key={loc.location} style={{
            padding: '14px 16px',
            background: 'rgba(196, 168, 122, 0.04)',
            border: `1px solid ${MI6.goldBorder}`,
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-lg)',
              fontWeight: 400,
              color: MI6.textPrimary,
              marginBottom: 2,
            }}>
              {loc.location}
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-xs)',
              color: MI6.textMuted,
              marginBottom: 6,
            }}>
              {loc.country}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: MI6.goldBright,
            }}>
              {loc.score}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-xs)',
              color: loc.trend === 'improving' ? MI6.green
                : loc.trend === 'declining' ? MI6.red
                : MI6.textMuted,
            }}>
              <span aria-hidden="true">
                {loc.trend === 'improving' ? '\u2191' : loc.trend === 'declining' ? '\u2193' : '\u2192'}
              </span>
              {loc.trend.charAt(0).toUpperCase() + loc.trend.slice(1)}
            </div>
          </div>
        ))}
      </div>

      {/* Orchestration metadata */}
      {orchestration && (
        <div style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
          fontFamily: "'Outfit', sans-serif",
          fontSize: 'var(--text-xs)',
          color: MI6.textMuted,
        }}>
          <span>{orchestration.invocationCount} Opus call{orchestration.invocationCount !== 1 ? 's' : ''}</span>
          <span>&middot;</span>
          <span>${orchestration.totalCostUsd.toFixed(4)} USD</span>
          <span>&middot;</span>
          <span>{(orchestration.totalDurationMs / 1000).toFixed(1)}s</span>
        </div>
      )}
    </section>
  );
}
