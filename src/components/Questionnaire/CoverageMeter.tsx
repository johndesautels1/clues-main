/**
 * CoverageMeter — Real-time MOE / coverage visualization.
 *
 * Two variants:
 *  - compact: Horizontal bar with MOE %, coverage %, data points, report-readiness.
 *             Used in MiniModuleFlow topbar area.
 *  - full:    23-dimension breakdown with per-module signal bars + gap badges.
 *             Used in Dashboard between Main Module and Module Grid.
 *
 * Reads from useCoverageState (derived, no LLM calls, instant, free).
 * WCAG 2.1 AA compliant — all text ≥ 11px, colors use CSS custom properties
 * that pass 4.5:1 in both dark and light mode.
 */

import { useState } from 'react';
import { useCoverageState } from '../../hooks/useCoverageState';
import { MODULES_MAP } from '../../data/modules';
import type { DimensionCoverage, CoverageGap } from '../../lib/coverageTracker';
import { C } from './questionnaireData';

// H8 fix: Tier colors use CSS custom properties instead of hardcoded hex.
// Bar fills are decorative (not text), so they don't need 4.5:1 contrast,
// but text labels must use theme-safe tokens.
const TIER_COLORS: Record<string, string> = {
  safety_security: 'var(--score-red, #ef4444)', health_wellness: 'var(--score-red, #ef4444)', climate_weather: 'var(--score-red, #ef4444)',
  legal_immigration: 'var(--text-accent, #3b82f6)', financial_banking: 'var(--text-accent, #3b82f6)', housing_property: 'var(--text-accent, #3b82f6)', professional_career: 'var(--text-accent, #3b82f6)',
  technology_connectivity: 'var(--score-cyan, #06b6d4)', transportation_mobility: 'var(--score-cyan, #06b6d4)', education_learning: 'var(--score-cyan, #06b6d4)', social_values_governance: 'var(--score-cyan, #06b6d4)',
  food_dining: 'var(--clues-gold, #f59e0b)', shopping_services: 'var(--clues-gold, #f59e0b)', outdoor_recreation: 'var(--clues-gold, #f59e0b)', entertainment_nightlife: 'var(--clues-gold, #f59e0b)',
  family_children: 'var(--score-green, #22c55e)', neighborhood_urban_design: 'var(--score-green, #22c55e)', environment_community_appearance: 'var(--score-green, #22c55e)',
  religion_spirituality: 'var(--score-purple, #c084fc)', sexual_beliefs_practices_laws: 'var(--score-purple, #c084fc)', arts_culture: 'var(--score-purple, #c084fc)', cultural_heritage_traditions: 'var(--score-purple, #c084fc)', pets_animals: 'var(--score-purple, #c084fc)',
};

function tierColor(moduleId: string): string {
  return TIER_COLORS[moduleId] || 'var(--text-accent, #60a5fa)';
}

// H9 fix: MOE color uses CSS variables for theme safety
function moeColor(moe: number): string {
  if (moe <= 0.02) return 'var(--score-green, #22c55e)';
  if (moe <= 0.10) return 'var(--clues-gold, #f59e0b)';
  return C.textMuted;
}

// H10 fix: Gap badge colors use CSS variables
function gapBadgeColor(severity: CoverageGap['severity']): string {
  if (severity === 'critical') return 'var(--score-red, #ef4444)';
  if (severity === 'moderate') return 'var(--clues-gold, #f59e0b)';
  return C.textMuted;
}

// ─── Compact variant ────────────────────────────────────────────

function CompactMeter() {
  const { coverage, overallPercentage, isReportReady } = useCoverageState();

  const moe = coverage.overallMOE;
  const coveredPct = Math.round(coverage.overallCoverage * 100);

  return (
    <div
      role="status"
      aria-label={`Coverage: ${overallPercentage}%, MOE: ${Math.round(moe * 100)}%`}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 20px',
        background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(8px)',
        borderRadius: 10, border: '1px solid rgba(96,165,250,0.12)',
      }}
    >
      {/* MOE Ring */}
      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
        <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true">
          <circle cx={22} cy={22} r={18} fill="none" stroke="var(--bg-card)" strokeWidth={3} />
          <circle
            cx={22} cy={22} r={18}
            fill="none" stroke={moeColor(moe)} strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${(1 - moe) * 113.1} 113.1`}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
          color: moeColor(moe), letterSpacing: '-0.02em',
        }}>
          {Math.round(moe * 100)}%
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
          color: C.textPrimary, letterSpacing: '-0.01em',
        }}>
          {isReportReady ? 'Report Ready' : `${overallPercentage}% Complete`}
        </span>
        <span style={{
          fontFamily: "'Outfit',sans-serif", fontSize: 11,
          color: C.textMuted, letterSpacing: '0.03em',
        }}>
          {coveredPct}% dimensions covered · {coverage.totalDataPoints} data points
        </span>
      </div>

      {/* M14/M15 fix: Gap count badge — show total gaps with worst severity color */}
      {coverage.gapAnalysis.length > 0 && (() => {
        const critCount = coverage.gapAnalysis.filter(g => g.severity === 'critical').length;
        const totalGaps = coverage.gapAnalysis.length;
        const worstSeverity = critCount > 0 ? 'critical' : coverage.gapAnalysis[0].severity;
        return (
          <span style={{
            marginLeft: 'auto', flexShrink: 0,
            fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
            color: gapBadgeColor(worstSeverity),
            background: 'var(--bg-card)', borderRadius: 6,
            padding: '3px 8px', letterSpacing: '0.03em',
          }}>
            {totalGaps} gap{totalGaps !== 1 ? 's' : ''}
          </span>
        );
      })()}
    </div>
  );
}

// ─── Full variant ───────────────────────────────────────────────

function FullMeter() {
  const { coverage, overallPercentage, isReportReady, recommendedModules } = useCoverageState();
  const [expanded, setExpanded] = useState(false);

  const moe = coverage.overallMOE;
  const criticalGaps = coverage.gapAnalysis.filter(g => g.severity === 'critical');
  const moderateGaps = coverage.gapAnalysis.filter(g => g.severity === 'moderate');

  // Sort dimensions by signal strength (weakest first) for the bar chart
  const sortedDimensions = [...coverage.dimensions].sort((a, b) => a.signalStrength - b.signalStrength);

  return (
    <div
      role="region"
      aria-label="Coverage Meter"
      style={{
        background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
        borderRadius: 14, border: '1px solid rgba(96,165,250,0.10)',
        padding: '20px 24px',
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {/* MOE Ring (larger) */}
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} viewBox="0 0 56 56" aria-hidden="true">
            <circle cx={28} cy={28} r={23} fill="none" stroke="var(--bg-card)" strokeWidth={3.5} />
            <circle
              cx={28} cy={28} r={23}
              fill="none" stroke={moeColor(moe)} strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray={`${(1 - moe) * 144.51} 144.51`}
              transform="rotate(-90 28 28)"
              style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700,
            color: moeColor(moe), letterSpacing: '-0.02em',
          }}>
            {Math.round(moe * 100)}%
          </span>
        </div>

        {/* Title + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 16, fontWeight: 700, color: C.textPrimary,
            margin: 0, letterSpacing: '-0.01em',
          }}>
            {isReportReady ? 'Report Ready — All Dimensions Covered' : 'Coverage Meter'}
          </h3>
          <p style={{
            fontSize: 13, color: C.textSecondary, margin: '4px 0 0',
            letterSpacing: '0.01em',
          }}>
            {overallPercentage}% complete · MOE {Math.round(moe * 100)}% · {coverage.totalDataPoints} data points
          </p>
        </div>

        {/* H11 fix: Expand toggle with focus-visible outline */}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse dimension details' : 'Expand dimension details'}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--bg-card-hover)',
            borderRadius: 8, padding: '10px 14px', cursor: 'pointer', minHeight: 44, minWidth: 44,
            fontSize: 12, fontWeight: 600, color: C.textAccent,
            letterSpacing: '0.02em', flexShrink: 0,
            transition: 'background 0.15s',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--text-accent)'; }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
        >
          {expanded ? 'Collapse' : 'Details'}
        </button>
      </div>

      {/* Overall progress bar */}
      <div style={{
        height: 6, borderRadius: 3,
        background: 'var(--bg-card)',
        marginBottom: criticalGaps.length > 0 || moderateGaps.length > 0 ? 14 : 0,
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${moeColor(moe)}, ${moeColor(moe)}cc)`,
          width: `${overallPercentage}%`,
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: `0 0 8px ${moeColor(moe)}22`,
        }} />
      </div>

      {/* Gap alerts (always visible) — H8 fix: use CSS vars for text colors */}
      {criticalGaps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: moderateGaps.length > 0 ? 6 : 0 }}>
          {criticalGaps.map(gap => (
            <span key={gap.moduleId} style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
              color: 'var(--score-red, #ef4444)', background: 'rgba(239,68,68,0.08)',
              borderRadius: 6, padding: '3px 8px',
            }}>
              {MODULES_MAP[gap.moduleId]?.shortName || gap.moduleName}: critical gap (~{gap.estimatedQuestionsToResolve}q)
            </span>
          ))}
        </div>
      )}
      {moderateGaps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {moderateGaps.map(gap => (
            <span key={gap.moduleId} style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
              color: 'var(--clues-gold, #f59e0b)', background: 'rgba(245,158,11,0.08)',
              borderRadius: 6, padding: '3px 8px',
            }}>
              {MODULES_MAP[gap.moduleId]?.shortName || gap.moduleName}: needs data (~{gap.estimatedQuestionsToResolve}q)
            </span>
          ))}
        </div>
      )}

      {/* Expanded: per-dimension bars */}
      {expanded && (
        <div
          style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}
          role="list"
          aria-label="Per-dimension coverage"
        >
          {sortedDimensions.map((dim: DimensionCoverage) => (
            <DimensionBar key={dim.moduleId} dim={dim} isRecommended={recommendedModules.includes(dim.moduleId)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-dimension bar ──────────────────────────────────────────

function DimensionBar({ dim, isRecommended }: { dim: DimensionCoverage; isRecommended: boolean }) {
  const pct = Math.round(dim.signalStrength * 100);
  const color = tierColor(dim.moduleId);
  const shortName = MODULES_MAP[dim.moduleId]?.shortName || dim.moduleName;

  return (
    <div
      role="listitem"
      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
    >
      {/* Module name */}
      <span style={{
        width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 500,
        color: C.textSecondary, letterSpacing: '0.02em',
      }}>
        {shortName}
      </span>

      {/* Bar track (decorative — no text contrast requirement) */}
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--bg-card)',
        position: 'relative',
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: color,
          width: `${pct}%`,
          transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
          opacity: 0.85,
        }} />
      </div>

      {/* H8 fix: Percentage text uses CSS variables instead of hardcoded hex */}
      <span style={{
        width: 32, textAlign: 'right', flexShrink: 0,
        fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
        color: pct >= 80 ? 'var(--score-green, #22c55e)' : pct >= 40 ? C.textSecondary : C.textMuted,
        letterSpacing: '0.01em',
      }}>
        {pct}%
      </span>

      {/* Recommended badge — H8 fix: use CSS variable */}
      {isRecommended && (
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
          color: 'var(--clues-gold, #f59e0b)', flexShrink: 0,
        }} aria-label="Recommended module">
          REC
        </span>
      )}
    </div>
  );
}

// ─── Public API ─────────────────────────────────────────────────

interface CoverageMeterProps {
  variant?: 'compact' | 'full';
}

export function CoverageMeter({ variant = 'full' }: CoverageMeterProps) {
  if (variant === 'compact') return <CompactMeter />;
  return <FullMeter />;
}
