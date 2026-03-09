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
 * WCAG 2.1 AA compliant — all text ≥ 11px, all colors verified against #0a0e1a.
 */

import { useState } from 'react';
import { useCoverageState } from '../../hooks/useCoverageState';
import { MODULES_MAP } from '../../data/modules';
import type { DimensionCoverage, CoverageGap } from '../../lib/coverageTracker';
import { C } from './questionnaireData';

// ─── Tier colors (same as MiniModuleFlow.getModuleAccent) ────────
const TIER_COLORS: Record<string, string> = {
  safety_security: '#ef4444', health_wellness: '#ef4444', climate_weather: '#ef4444',
  legal_immigration: '#3b82f6', financial_banking: '#3b82f6', housing_property: '#3b82f6', professional_career: '#3b82f6',
  technology_connectivity: '#06b6d4', transportation_mobility: '#06b6d4', education_learning: '#06b6d4', social_values_governance: '#06b6d4',
  food_dining: '#f59e0b', shopping_services: '#f59e0b', outdoor_recreation: '#f59e0b', entertainment_nightlife: '#f59e0b',
  family_children: '#22c55e', neighborhood_urban_design: '#22c55e', environment_community_appearance: '#22c55e',
  religion_spirituality: '#a855f7', sexual_beliefs_practices_laws: '#a855f7', arts_culture: '#a855f7', cultural_heritage_traditions: '#a855f7', pets_animals: '#a855f7',
};

function tierColor(moduleId: string): string {
  return TIER_COLORS[moduleId] || '#60a5fa';
}

// ─── MOE color helper (same thresholds as adaptive insight bar) ──
function moeColor(moe: number): string {
  if (moe <= 0.02) return '#22c55e';   // 8.5:1 — target reached
  if (moe <= 0.10) return '#f59e0b';   // 9.0:1 — close
  return C.textMuted;                  // 6.4:1 — still working
}

// ─── Gap severity badge colors ──────────────────────────────────
function gapBadgeColor(severity: CoverageGap['severity']): string {
  if (severity === 'critical') return '#ef4444';  // 5.4:1 vs #0a0e1a (passes 4.5:1 normal text)
  if (severity === 'moderate') return '#f59e0b';  // 9.0:1
  return C.textMuted;                             // 6.4:1
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

      {/* Gap count badge */}
      {coverage.gapAnalysis.length > 0 && (
        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
          color: gapBadgeColor(coverage.gapAnalysis[0].severity),
          background: 'var(--bg-card)', borderRadius: 6,
          padding: '3px 8px', letterSpacing: '0.03em',
        }}>
          {coverage.gapAnalysis.filter(g => g.severity === 'critical').length} gaps
        </span>
      )}
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

        {/* Expand toggle */}
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
          }}
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

      {/* Gap alerts (always visible) */}
      {criticalGaps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: moderateGaps.length > 0 ? 6 : 0 }}>
          {criticalGaps.map(gap => (
            <span key={gap.moduleId} style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
              color: '#ef4444', background: 'rgba(239,68,68,0.08)',
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
              color: '#f59e0b', background: 'rgba(245,158,11,0.08)',
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

      {/* Bar track */}
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

      {/* Percentage */}
      <span style={{
        width: 32, textAlign: 'right', flexShrink: 0,
        fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
        color: pct >= 80 ? '#22c55e' : pct >= 40 ? C.textSecondary : C.textMuted,
        letterSpacing: '0.01em',
      }}>
        {pct}%
      </span>

      {/* Recommended badge */}
      {isRecommended && (
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
          color: '#f59e0b', flexShrink: 0,
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
