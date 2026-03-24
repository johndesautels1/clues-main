/**
 * useEvaluationPipeline — React hook that orchestrates the full evaluation pipeline.
 *
 * Wraps evaluationPipeline.runPipeline() with React state management.
 * Provides phase progress, error handling, and dispatches results to UserContext.
 *
 * Phases: idle → aggregating → building_metrics → recommending_cities →
 *         evaluating → judging → scoring → complete
 *
 * The hook also handles Tavily research (fetching data for metrics before evaluation).
 */

import { useState, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { runPipeline } from '../lib/evaluationPipeline';
import type { PipelineResult } from '../lib/evaluationPipeline';
import type { CityCandidate, EvaluationWave, TavilyResult } from '../types/evaluation';
import { searchMetrics } from '../lib/tavilyClient';
import { buildMetricsForEvaluation } from '../lib/profileSignalBridge';
import { aggregateProfile } from '../lib/answerAggregator';

// ─── Types ──────────────────────────────────────────────────────

export type PipelinePhase =
  | 'idle'
  | 'researching'
  | 'aggregating'
  | 'building_metrics'
  | 'recommending_cities'
  | 'evaluating'
  | 'judging'
  | 'scoring'
  | 'complete'
  | 'error';

export interface PipelineProgress {
  phase: PipelinePhase;
  /** Human-readable phase label */
  phaseLabel: string;
  /** Completed evaluation waves */
  wavesCompleted: number;
  /** Cities found during recommendation */
  citiesFound: number;
  /** Error message if phase === 'error' */
  error?: string;
}

const PHASE_LABELS: Record<PipelinePhase, string> = {
  idle: 'Ready',
  researching: 'Researching your metrics with Tavily...',
  aggregating: 'Aggregating your profile signals...',
  building_metrics: 'Building evaluation metrics...',
  recommending_cities: 'Finding cities that match your profile...',
  evaluating: 'Running 5-LLM evaluation cascade...',
  judging: 'Opus judge reviewing disputed metrics...',
  scoring: 'Computing Smart Scores...',
  complete: 'Evaluation complete!',
  error: 'Evaluation failed',
};

// ─── Hook ───────────────────────────────────────────────────────

export function useEvaluationPipeline() {
  const { session, dispatch } = useUser();
  const [progress, setProgress] = useState<PipelineProgress>({
    phase: 'idle',
    phaseLabel: PHASE_LABELS.idle,
    wavesCompleted: 0,
    citiesFound: 0,
  });
  const [result, setResult] = useState<PipelineResult | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const updatePhase = (phase: PipelinePhase) => {
      setProgress(prev => ({
        ...prev,
        phase,
        phaseLabel: PHASE_LABELS[phase],
      }));
    };

    try {
      // ─── Pre-flight: Tavily research ─────────────────────────
      updatePhase('researching');

      // Build metrics to know what Tavily needs to search
      const profile = aggregateProfile(session);
      const metricsByCategory = buildMetricsForEvaluation({
        geminiMetrics: session.paragraphical.extraction?.metrics,
        signals: profile.allSignals,
        dnw: session.mainModule.dnw,
        mh: session.mainModule.mh,
      });

      const allMetrics = Object.values(metricsByCategory).flat();

      // Determine cities for Tavily searches
      const extraction = session.paragraphical.extraction;
      const cityCandidates: { city: string; country: string }[] = [];
      if (extraction) {
        for (const c of extraction.recommended_cities ?? []) {
          cityCandidates.push({ city: c.location, country: c.country });
        }
        for (const t of extraction.recommended_towns ?? []) {
          cityCandidates.push({ city: t.location, country: t.country });
        }
      }

      // Fetch Tavily research for each city × metric combination
      // Gracefully degrades if Tavily API is unavailable (e.g., vite dev without Vercel)
      const tavilyByMetric: Record<string, TavilyResult> = {};
      const metricsForSearch = allMetrics.map(m => ({
        metricId: m.id,
        researchQuery: m.research_query,
      }));

      for (const { city, country } of cityCandidates) {
        try {
          const results = await searchMetrics(
            session.id,
            metricsForSearch,
            city,
            country
          );
          for (const r of results) {
            if (!tavilyByMetric[r.metricId]) {
              tavilyByMetric[r.metricId] = {
                metric_id: r.metricId,
                query: r.query,
                results: [],
              };
            }
            for (const s of r.results) {
              tavilyByMetric[r.metricId].results.push({
                title: s.title,
                url: s.url,
                content: s.content,
              });
            }
          }
        } catch (tavilyErr) {
          console.warn(
            `[useEvaluationPipeline] Tavily search failed for ${city}, ${country} — proceeding without research data:`,
            tavilyErr instanceof Error ? tavilyErr.message : tavilyErr
          );
        }
      }

      // ─── Run the pipeline ────────────────────────────────────
      const pipelineResult = await runPipeline(session, tavilyByMetric, {
        onPhase: (phase) => {
          updatePhase(phase as PipelinePhase);
        },
        onWaveComplete: (wave: EvaluationWave) => {
          setProgress(prev => ({
            ...prev,
            wavesCompleted: wave.waveNumber,
          }));
        },
        onCitiesRecommended: (cities: CityCandidate[]) => {
          setProgress(prev => ({
            ...prev,
            citiesFound: cities.length,
          }));
        },
      });

      // ─── Dispatch results to UserContext ──────────────────────
      dispatch({ type: 'SET_SMART_SCORES', payload: pipelineResult.smartScores });
      dispatch({
        type: 'SET_TIER',
        payload: { tier: pipelineResult.tier as import('../types').CompletionTier, confidence: pipelineResult.confidence },
      });

      if (pipelineResult.judgeResult) {
        dispatch({
          type: 'SET_JUDGE_REPORT',
          payload: {
            report: pipelineResult.judgeResult.finalReport,
            orchestration: pipelineResult.judgeResult,
          },
        });
      }

      setResult(pipelineResult);
      updatePhase('complete');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown pipeline error';
      console.error('[useEvaluationPipeline] Failed:', message);
      setProgress(prev => ({
        ...prev,
        phase: 'error',
        phaseLabel: PHASE_LABELS.error,
        error: message,
      }));
    } finally {
      runningRef.current = false;
    }
  }, [session, dispatch]);

  const isRunning = progress.phase !== 'idle' && progress.phase !== 'complete' && progress.phase !== 'error';

  return {
    run,
    progress,
    result,
    isRunning,
    isComplete: progress.phase === 'complete',
    hasError: progress.phase === 'error',
  };
}
