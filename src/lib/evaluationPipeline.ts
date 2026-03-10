/**
 * CLUES Intelligence — Evaluation Pipeline Entry Point
 *
 * The single entry point that orchestrates the full evaluation flow
 * regardless of how the user entered the system:
 *
 *   Globe click → [Paragraphical | Main Module | Mini Modules | Any combo]
 *     → This pipeline → City recommendations → Metric evaluation → Judge → Smart Score → Report
 *
 * This file wires together:
 *   - profileSignalBridge.ts (ProfileSignal → EvaluationMetric conversion)
 *   - cityRecommendationOrchestrator.ts (5-LLM city recommendations)
 *   - evaluationOrchestrator.ts (5-LLM metric evaluation)
 *   - judgeOrchestrator.ts (Opus judge for disputed metrics)
 *   - answerAggregator.ts (raw answers → ProfileSignals)
 *   - tierEngine.ts (tier determination)
 *
 * Step-in/step-out: User can have ANY combination of data sources.
 * This pipeline handles all 6+ entry scenarios.
 */

import type { UserSession } from '../types';
import type { CityCandidate, OrchestrationResult, EvaluationWave, TavilyResult } from '../types/evaluation';
import { aggregateProfile } from './answerAggregator';
import { buildMetricsForEvaluation } from './profileSignalBridge';
import { recommendCities, buildSignalSummary } from './cityRecommendationOrchestrator';
import type { CityRecommendationResult } from './cityRecommendationOrchestrator';
import { runEvaluation } from './evaluationOrchestrator';
import { calculateTier, calculateConfidence } from './tierEngine';

// ─── Types ──────────────────────────────────────────────────────

export interface PipelineResult {
  /** Which path was taken */
  entryPath: 'paragraphical_only' | 'questionnaire_only' | 'combined';

  /** Tier determined from available data */
  tier: string;
  confidence: number;

  /** Cities: from Gemini extraction or 5-LLM recommendation */
  cities: CityCandidate[];
  citySource: 'gemini_extraction' | 'llm_recommendation';
  cityRecommendation?: CityRecommendationResult;

  /** Evaluation results from the 5-LLM cascade */
  evaluation: OrchestrationResult;

  /** Total metrics evaluated */
  totalMetrics: number;

  /** Total cost across all calls */
  totalCostUsd: number;

  /** Total duration */
  totalDurationMs: number;
}

export interface PipelineCallbacks {
  onPhase?: (phase: string) => void;
  onWaveComplete?: (wave: EvaluationWave) => void;
  onCitiesRecommended?: (cities: CityCandidate[]) => void;
}

// ─── Main Pipeline ──────────────────────────────────────────────

/**
 * Run the full evaluation pipeline for a user session.
 *
 * Automatically determines the entry path, converts signals to metrics,
 * recommends cities if needed, and fires the evaluation cascade.
 */
export async function runPipeline(
  session: UserSession,
  tavilyByMetric: Record<string, TavilyResult>, // H5 fix: Proper type instead of unknown
  callbacks?: PipelineCallbacks
): Promise<PipelineResult> {
  const startTime = Date.now();

  // ─── Phase 1: Determine what data we have ────────────────────
  callbacks?.onPhase?.('aggregating');

  const hasParagraphical = !!session.paragraphical.extraction;
  const hasMainModule = !!(
    session.mainModule.demographics ||
    session.mainModule.dnw ||
    session.mainModule.mh ||
    session.mainModule.generalAnswers ||
    session.mainModule.tradeoffAnswers
  );
  const hasMiniModules = session.completedModules.length > 0;

  const entryPath: PipelineResult['entryPath'] =
    hasParagraphical && (hasMainModule || hasMiniModules) ? 'combined' :
    hasParagraphical ? 'paragraphical_only' :
    'questionnaire_only';

  // ─── Phase 2: Build evaluation context ───────────────────────
  const context = {
    tier: session.currentTier,
    confidence: session.confidence,
    paragraphical: session.paragraphical.extraction,
    demographics: session.mainModule.demographics,
    dnw: session.mainModule.dnw,
    mh: session.mainModule.mh,
    generalQuestions: session.mainModule.generalAnswers,
    completedModules: session.completedModules,
    globeRegion: session.globe?.region,
  };

  const tier = calculateTier(context);
  const confidence = calculateConfidence(context);

  // ─── Phase 3: Aggregate signals ──────────────────────────────
  const profile = aggregateProfile(session);

  // ─── Phase 4: Build metrics ──────────────────────────────────
  callbacks?.onPhase?.('building_metrics');

  const metricsByCategory = buildMetricsForEvaluation({
    geminiMetrics: session.paragraphical.extraction?.metrics,
    signals: profile.allSignals,
    dnw: session.mainModule.dnw,
    mh: session.mainModule.mh,
  });

  const totalMetrics = Object.values(metricsByCategory).reduce(
    (sum, metrics) => sum + metrics.length, 0
  );

  // ─── Phase 5: Get city candidates ───────────────────────────
  callbacks?.onPhase?.('recommending_cities');

  let cities: CityCandidate[];
  let citySource: PipelineResult['citySource'];
  let cityRecommendation: CityRecommendationResult | undefined;

  if (hasParagraphical && session.paragraphical.extraction) {
    // Paragraphical path: Gemini already recommended cities
    const extraction = session.paragraphical.extraction;
    cities = [
      ...(extraction.recommended_cities ?? []).map(c => ({
        location: c.location,
        country: c.country,
        location_type: c.location_type,
        parent: c.parent,
      })),
      ...(extraction.recommended_towns ?? []).map(t => ({
        location: t.location,
        country: t.country,
        location_type: t.location_type,
        parent: t.parent,
      })),
    ];
    citySource = 'gemini_extraction';
  } else {
    // Non-paragraphical path: fire all 5 LLMs to recommend cities
    const { dnwSummary, mhSummary, demographicSummary } = buildSignalSummary(profile.allSignals);

    cityRecommendation = await recommendCities({
      sessionId: session.id,
      signals: profile.allSignals,
      globeRegion: session.globe?.region ?? 'Global',
      tier,
      dnwSummary,
      mhSummary,
      demographicSummary,
    });

    cities = cityRecommendation.cities;
    citySource = 'llm_recommendation';
  }

  callbacks?.onCitiesRecommended?.(cities);

  // Guard: if no cities were found, we can't evaluate
  if (cities.length === 0) {
    throw new Error(
      'No city candidates found. Ensure globe region is set and sufficient questionnaire data is provided.'
    );
  }

  // ─── Phase 6: Run the 5-LLM evaluation cascade ──────────────
  callbacks?.onPhase?.('evaluating');

  const evaluation = await runEvaluation(
    session.id,
    metricsByCategory,
    cities,
    tavilyByMetric, // H5 fix: No cast needed with proper typing
    callbacks?.onWaveComplete
  );

  // ─── Done ────────────────────────────────────────────────────
  const totalDurationMs = Date.now() - startTime;
  const totalCostUsd = evaluation.totalCostUsd + (cityRecommendation
    ? cityRecommendation.individualResults.reduce((sum, r) => sum + (r.response ? 0.005 : 0), 0)
    : 0);

  return {
    entryPath,
    tier,
    confidence,
    cities,
    citySource,
    cityRecommendation,
    evaluation,
    totalMetrics,
    totalCostUsd,
    totalDurationMs,
  };
}
