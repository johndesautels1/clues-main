/**
 * ReadinessIndicator — Dashboard component showing overall report readiness.
 *
 * Displays:
 * - Readiness percentage with animated progress bar
 * - Source completeness (X/7 sources)
 * - Module coverage (X/23 adequate)
 * - Top 3 next steps for the user
 * - "Report Ready" celebration state at ≥ 80%
 *
 * WCAG 2.1 AA compliant:
 * - All text ≥ 11px (0.6875rem)
 * - Contrast ratios verified against both dark (#0a0e1a) and light (#ffffff) backgrounds
 * - Color never sole indicator (text labels on all states)
 * - role="status" for live readiness updates
 */

import { useAggregatedProfile } from '../../hooks/useAggregatedProfile';
import { MODULES } from '../../data/modules';
import './DashboardCard.css';
import './ReadinessIndicator.css';

// CSS custom properties auto-switch between dark and light mode via globals.css
const C = {
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textAccent: 'var(--text-accent)',
  scoreGreen: 'var(--score-green)',
  gold: 'var(--clues-gold)',
};

export function ReadinessIndicator() {
  const { quality, readiness, readinessLabel, activeSourceCount, totalSignals, hasData } = useAggregatedProfile();

  // Don't render if there's no data at all
  if (!hasData || !quality) return null;

  const isReady = readiness >= 80;
  const accentColor = isReady ? C.scoreGreen : readiness >= 50 ? C.gold : C.textAccent;

  // M12 fix: Removed unnecessary useMemo for trivial .slice(0, 3)
  const topSteps = quality.nextSteps.slice(0, 3);

  return (
    <div className={`dash-card readiness ${isReady ? 'dash-card--completed' : readiness > 0 ? 'dash-card--in-progress' : 'dash-card--not-started'}`} role="status" aria-label={`Report readiness: ${readiness}% — ${readinessLabel}`}>
      {/* Header row */}
      <div className="readiness__header">
        <div className="readiness__title-group">
          <h3 className="readiness__title">
            {isReady ? 'Report Ready' : 'Report Readiness'}
          </h3>
          <span className="readiness__label" style={{ color: accentColor }}>
            {readinessLabel}
          </span>
        </div>

        <div className="readiness__percentage" style={{ color: accentColor }}>
          {readiness}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="readiness__bar" role="progressbar" aria-valuenow={readiness} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="readiness__bar-fill"
          style={{
            width: `${readiness}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
            boxShadow: `0 0 8px ${accentColor}33`,
          }}
        />
      </div>

      {/* Stats row — user-friendly labels */}
      <div className="readiness__stats">
        <div className="readiness__stat">
          <span className="readiness__stat-value" style={{ color: accentColor }}>{activeSourceCount}</span>
          <span className="readiness__stat-label">/7 data sources completed</span>
        </div>
        <div className="readiness__stat">
          <span className="readiness__stat-value" style={{ color: accentColor }}>{quality.adequateModuleCount}</span>
          <span className="readiness__stat-label">/{MODULES.length} categories covered</span>
        </div>
        <div className="readiness__stat">
          <span className="readiness__stat-value" style={{ color: accentColor }}>{totalSignals}</span>
          <span className="readiness__stat-label">data points collected</span>
        </div>
        {quality.gapModuleCount > 0 && (
          <div className="readiness__stat">
            <span className="readiness__stat-value" style={{ color: C.gold }}>{quality.gapModuleCount}</span>
            <span className="readiness__stat-label">categories need more data</span>
          </div>
        )}
      </div>

      {/* Next steps (only when not ready) */}
      {!isReady && topSteps.length > 0 && (
        <div className="readiness__steps">
          <p className="readiness__steps-title">Next Steps</p>
          <ul className="readiness__steps-list">
            {topSteps.map((step) => (
              <li key={`${step.target}_${step.priority}`} className="readiness__step">
                <span className="readiness__step-priority">{step.priority}</span>
                <span className="readiness__step-action">{step.action}</span>
                <span className="readiness__step-impact" style={{ color: C.scoreGreen }}>
                  +{step.impactEstimate}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Celebration state */}
      {isReady && (
        <p className="readiness__celebration">
          Your data is comprehensive enough to generate a full evaluation report.
        </p>
      )}
    </div>
  );
}
