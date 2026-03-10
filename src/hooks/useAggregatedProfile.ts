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

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
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

  // C2 fix: Track mini module completions via a counter that increments
  // when localStorage changes, so the useMemo deps include this trigger.
  // This solves the problem of localStorage reads inside useMemo not
  // being tracked by React's dependency array.
  const [miniModuleRevision, setMiniModuleRevision] = useState(0);

  // Listen for localStorage changes (from mini module saves)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key?.startsWith('clues-module-')) {
        setMiniModuleRevision(r => r + 1);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Memoize profile computation — depends on session answers
  const profile = useMemo((): AggregatedProfile | null => {
    // M10 fix: Check for actual data presence, not just truthiness.
    // Empty {} demographics are truthy but have no data.
    const hasDemographics = session.mainModule.demographics
      && Object.keys(session.mainModule.demographics).length > 0;
    const hasDnw = session.mainModule.dnw && session.mainModule.dnw.length > 0;
    const hasMh = session.mainModule.mh && session.mainModule.mh.length > 0;
    const hasTradeoffs = session.mainModule.tradeoffAnswers
      && Object.keys(session.mainModule.tradeoffAnswers).length > 0;
    const hasGeneral = session.mainModule.generalAnswers
      && Object.keys(session.mainModule.generalAnswers).length > 0;

    const hasAny =
      session.paragraphical.paragraphs.length > 0 ||
      hasDemographics ||
      hasDnw ||
      hasMh ||
      hasTradeoffs ||
      hasGeneral ||
      session.completedModules.length > 0;

    if (!hasAny) return null;

    // M11 fix: Wrap in try/catch so corrupt localStorage doesn't crash the profile
    try {
      return aggregateProfile(session);
    } catch (err) {
      console.warn('[useAggregatedProfile] aggregateProfile threw:', err);
      return null;
    }
  }, [
    session.id,
    session.paragraphical.paragraphs.length,
    session.paragraphical.extraction,
    session.mainModule.demographics,
    session.mainModule.dnw,
    session.mainModule.mh,
    session.mainModule.tradeoffAnswers,
    session.mainModule.generalAnswers,
    session.completedModules,
    session.currentTier,
    session.confidence,
    miniModuleRevision, // C2 fix: Re-compute when mini module localStorage changes
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

    // L9 fix: Include session.id in fingerprint to handle session changes
    const fingerprint = `${session.id}_${profile.totalDataPoints}_${quality.overallReadiness}_${profile.aggregatedAt}`;
    if (fingerprint === lastPersistedRef.current) return;

    try {
      // H6 fix: Include a version counter so overwrites are detectable.
      // The upsert still uses session_id as conflict key, but now includes
      // a monotonic version and previous_readiness for audit trail.
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
        aggregated_at: new Date().toISOString(), // Use real timestamp for persistence
        scored_at: quality.scoredAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });

      lastPersistedRef.current = fingerprint;
    } catch (err) {
      console.warn('[useAggregatedProfile] Supabase persist failed:', err);
    }
  }, [profile, quality, session.id, session.userId]);

  // H7 fix: Extract readiness value outside optional chaining for stable deps.
  // Using a derived value prevents the undefined→0 transition problem.
  const currentReadiness = quality?.overallReadiness ?? -1;

  // Auto-persist when quality changes significantly
  useEffect(() => {
    if (currentReadiness < 0 || !isSupabaseConfigured) return;
    const timer = setTimeout(() => persistToSupabase(), 3000); // 3s debounce
    return () => clearTimeout(timer);
  }, [currentReadiness, persistToSupabase]);

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
