/**
 * useAggregatedProfile — Reactive wrapper for answer aggregation + quality scoring.
 *
 * Composes:
 * - answerAggregator (merges 7 sources → AggregatedProfile)
 * - qualityScorer (profile + coverage → QualityReport)
 * - useCoverageState (23-dimension MOE data)
 *
 * Re-computes when session state changes. Memoized to avoid re-computation
 * on every render.
 *
 * Also provides a `persistToSupabase()` callback for saving the computed
 * profile to the user_profiles_computed table.
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useCoverageState } from './useCoverageState';
import { aggregateProfile, type AggregatedProfile } from '../lib/answerAggregator';
import { scoreQuality, type QualityReport } from '../lib/qualityScorer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UseAggregatedProfileReturn {
  /** The unified profile (null if no data yet) */
  profile: AggregatedProfile | null;

  /** Quality report (null if no profile) */
  quality: QualityReport | null;

  /** Overall readiness (0-100) */
  readiness: number;

  /** Human-readable readiness label */
  readinessLabel: string;

  /** Number of active data sources (out of 7) */
  activeSourceCount: number;

  /** Total signals across all sources */
  totalSignals: number;

  /** Persist the computed profile to Supabase */
  persistToSupabase: () => Promise<void>;

  /** Whether the profile has enough data to be meaningful */
  hasData: boolean;
}

export function useAggregatedProfile(): UseAggregatedProfileReturn {
  const { session } = useUser();
  const { coverage } = useCoverageState();

  // Memoize profile computation — depends on session answers
  const profile = useMemo((): AggregatedProfile | null => {
    // Need at least some data to aggregate
    const hasAny =
      session.paragraphical.paragraphs.length > 0 ||
      session.mainModule.demographics ||
      session.mainModule.dnw ||
      session.mainModule.mh ||
      session.mainModule.tradeoffAnswers ||
      session.mainModule.generalAnswers ||
      session.completedModules.length > 0;

    if (!hasAny) return null;
    return aggregateProfile(session);
  }, [
    session.id,
    session.paragraphical.extraction,
    session.mainModule.demographics,
    session.mainModule.dnw,
    session.mainModule.mh,
    session.mainModule.tradeoffAnswers,
    session.mainModule.generalAnswers,
    session.completedModules,
    session.currentTier,
    session.confidence,
  ]);

  // Memoize quality scoring — depends on profile + coverage
  const quality = useMemo((): QualityReport | null => {
    if (!profile || !coverage) return null;
    return scoreQuality(profile, coverage);
  }, [profile, coverage]);

  // ─── Supabase persistence (debounced) ──────────────────────
  const lastPersistedRef = useRef<string>('');

  const persistToSupabase = useCallback(async () => {
    if (!profile || !quality || !isSupabaseConfigured) return;

    // Avoid persisting the same data twice
    const fingerprint = `${profile.totalDataPoints}_${quality.overallReadiness}_${profile.aggregatedAt}`;
    if (fingerprint === lastPersistedRef.current) return;

    try {
      await supabase.from('user_profiles_computed').upsert({
        session_id: session.id,
        user_id: session.userId ?? null,
        tier: profile.tier,
        confidence: profile.confidence,
        overall_readiness: quality.overallReadiness,
        readiness_label: quality.readinessLabel,
        total_signals: profile.totalDataPoints,
        source_counts: profile.sourceCounts,
        completed_modules: profile.completedModuleIds,
        gap_module_count: quality.gapModuleCount,
        adequate_module_count: quality.adequateModuleCount,
        next_steps: quality.nextSteps.slice(0, 5), // Top 5 only
        globe_region: profile.globeRegion,
        aggregated_at: profile.aggregatedAt,
        scored_at: quality.scoredAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });

      lastPersistedRef.current = fingerprint;
    } catch {
      // Supabase write failure — non-critical, ignore
    }
  }, [profile, quality, session.id, session.userId]);

  // Auto-persist when quality changes significantly
  useEffect(() => {
    if (!quality || !isSupabaseConfigured) return;
    const timer = setTimeout(() => persistToSupabase(), 3000); // 3s debounce
    return () => clearTimeout(timer);
  }, [quality?.overallReadiness, persistToSupabase]);

  return {
    profile,
    quality,
    readiness: quality?.overallReadiness ?? 0,
    readinessLabel: quality?.readinessLabel ?? 'Just Beginning',
    activeSourceCount: quality?.sources.filter(s => s.hasData).length ?? 0,
    totalSignals: profile?.totalDataPoints ?? 0,
    persistToSupabase,
    hasData: profile !== null && profile.totalDataPoints > 0,
  };
}
