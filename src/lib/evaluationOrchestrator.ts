/**
 * CLUES Intelligence — Evaluation Orchestrator
 *
 * Fires all 5 LLM evaluators in parallel for each category,
 * organized in waves of 2 categories to avoid Vercel timeout limits.
 *
 * Wave pattern:
 *   Wave 1: Tier 1 Survival (safety_security, health_wellness, climate_weather)
 *   Wave 2: Tier 2 Foundation (legal_immigration, financial_banking, housing_property, professional_career)
 *   Wave 3: Tier 3 Infrastructure (technology_connectivity, transportation_mobility, education_learning, social_values_governance)
 *   Wave 4: Tier 4 Lifestyle (food_dining, shopping_services, outdoor_recreation, entertainment_nightlife)
 *   Wave 5: Tier 5 Connection (family_children, neighborhood_urban_design, environment_community_appearance)
 *   Wave 6: Tier 6 Identity (religion_spirituality, sexual_beliefs_practices_laws, arts_culture, cultural_heritage_traditions, pets_animals)
 *
 * Each wave fires 2 categories at a time, each category → 5 LLMs in parallel.
 * Dynamic timeout: 120s + 5s per metric (max 300s).
 * Partial success: 3/5 LLMs responding = usable result.
 */

import type {
  EvaluationMetric,
  CityCandidate,
  TavilyResult,
  EvaluatorModel,
  EvaluatorResult,
  CategoryBatchResult,
  MetricConsensus,
  LocationConsensus,
  EvaluationWave,
  OrchestrationResult,
  EvaluateResponse,
} from '../types/evaluation';
import { supabase, isSupabaseConfigured } from './supabase';

// ─── LLM Endpoint Map ────────────────────────────────────────

/**
 * Resolve the base URL for API endpoints.
 * In browser: relative paths work. In SSR/Node: need VERCEL_URL or localhost.
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''; // Browser — relative paths work
  const vercelUrl = import.meta.env.VITE_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'http://localhost:3000';
}

const LLM_ENDPOINTS: Record<EvaluatorModel, string> = {
  'claude-sonnet-4-6': '/api/evaluate-sonnet',
  'gpt-5.4': '/api/evaluate-gpt54',
  'gemini-3.1-pro-preview': '/api/evaluate-gemini',
  'grok-4-1-fast-reasoning': '/api/evaluate-grok',
  'sonar-reasoning-pro-high': '/api/evaluate-perplexity',
};

const ALL_EVALUATORS: EvaluatorModel[] = [
  'claude-sonnet-4-6',
  'gpt-5.4',
  'gemini-3.1-pro-preview',
  'grok-4-1-fast-reasoning',
  'sonar-reasoning-pro-high',
];

// ─── Category Wave Order (tier-based) ────────────────────────

const CATEGORY_WAVES: string[][] = [
  // Wave 1: Survival
  ['safety_security', 'health_wellness'],
  ['climate_weather'],
  // Wave 2: Foundation
  ['legal_immigration', 'financial_banking'],
  ['housing_property', 'professional_career'],
  // Wave 3: Infrastructure
  ['technology_connectivity', 'transportation_mobility'],
  ['education_learning', 'social_values_governance'],
  // Wave 4: Lifestyle
  ['food_dining', 'shopping_services'],
  ['outdoor_recreation', 'entertainment_nightlife'],
  // Wave 5: Connection
  ['family_children', 'neighborhood_urban_design'],
  ['environment_community_appearance'],
  // Wave 6: Identity
  ['religion_spirituality', 'sexual_beliefs_practices_laws'],
  ['arts_culture', 'cultural_heritage_traditions'],
  ['pets_animals'],
];

/** Minimum number of LLMs needed for a usable consensus */
const MIN_USABLE_LLMS = 3;

/** σ threshold for flagging metrics for judge review */
const JUDGE_REVIEW_STDDEV = 15;

/** Inter-wave delay (ms) — gives APIs breathing room */
const WAVE_DELAY_MS = 1000;

// ─── Main Orchestrator ───────────────────────────────────────

/**
 * Run the full 5-LLM evaluation across all categories with metrics.
 *
 * @param sessionId - User session ID
 * @param metricsByCategory - Metrics grouped by category ID
 * @param cities - Candidate locations to score
 * @param tavilyByMetric - Pre-fetched Tavily research indexed by metric_id
 * @param onWaveComplete - Optional callback after each wave
 */
export async function runEvaluation(
  sessionId: string,
  metricsByCategory: Record<string, EvaluationMetric[]>,
  cities: CityCandidate[],
  tavilyByMetric: Record<string, TavilyResult>,
  onWaveComplete?: (wave: EvaluationWave) => void
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const waves: EvaluationWave[] = [];
  let totalCostUsd = 0;

  // Only evaluate categories that have metrics
  const activeCategories = new Set(Object.keys(metricsByCategory));

  for (let i = 0; i < CATEGORY_WAVES.length; i++) {
    const waveCategories = CATEGORY_WAVES[i].filter(c => activeCategories.has(c));
    if (waveCategories.length === 0) continue;

    const waveStart = Date.now();

    // Fire all categories in this wave in parallel
    const categoryResults = await Promise.all(
      waveCategories.map(category =>
        evaluateCategory(
          sessionId,
          category,
          metricsByCategory[category],
          cities,
          tavilyByMetric
        )
      )
    );

    const waveDuration = Date.now() - waveStart;

    // Sum cost (guard against undefined/NaN from malformed responses)
    for (const cr of categoryResults) {
      for (const r of cr.results) {
        if (r.metadata && typeof r.metadata.costUsd === 'number' && !Number.isNaN(r.metadata.costUsd)) {
          totalCostUsd += r.metadata.costUsd;
        }
      }
    }

    const wave: EvaluationWave = {
      waveNumber: i + 1,
      categories: waveCategories,
      results: categoryResults,
      durationMs: waveDuration,
    };

    waves.push(wave);
    onWaveComplete?.(wave);

    // Inter-wave delay (skip after last wave)
    if (i < CATEGORY_WAVES.length - 1) {
      await sleep(WAVE_DELAY_MS);
    }
  }

  // Collect all metrics needing judge review
  const metricsForJudge: MetricConsensus[] = [];
  const failedCategories: string[] = [];
  let successfulCategories = 0;

  for (const wave of waves) {
    for (const batch of wave.results) {
      if (batch.isUsable) {
        successfulCategories++;
        metricsForJudge.push(...batch.consensus.filter(c => c.needsJudgeReview));
      } else {
        failedCategories.push(batch.category);
      }
    }
  }

  return {
    waves,
    totalCategories: Object.keys(metricsByCategory).length,
    successfulCategories,
    failedCategories,
    metricsForJudge,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    totalDurationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Category Evaluation ─────────────────────────────────────

/**
 * Fire all 5 LLMs for a single category in parallel.
 * Returns a CategoryBatchResult with consensus scores.
 */
async function evaluateCategory(
  sessionId: string,
  category: string,
  metrics: EvaluationMetric[],
  cities: CityCandidate[],
  tavilyByMetric: Record<string, TavilyResult>
): Promise<CategoryBatchResult> {
  // Gather Tavily research for this category's metrics
  const tavilyResearch: TavilyResult[] = metrics
    .map(m => tavilyByMetric[m.id])
    .filter((t): t is TavilyResult => !!t);

  // Dynamic timeout: 120s + 5s per metric, max 300s
  const timeoutMs = Math.min(300_000, 120_000 + metrics.length * 5_000);

  // Fire all 5 LLMs in parallel with timeout
  const results = await Promise.all(
    ALL_EVALUATORS.map(model =>
      evaluateWithModel(sessionId, model, category, metrics, cities, tavilyResearch, timeoutMs)
    )
  );

  // Count successes
  const successResults = results.filter(r => r.response !== null);
  const successCount = successResults.length;
  const isUsable = successCount >= MIN_USABLE_LLMS;

  // Build consensus from successful results
  const consensus = isUsable
    ? buildConsensus(metrics, cities, successResults)
    : [];

  return {
    category,
    results,
    successCount,
    isUsable,
    consensus,
  };
}

// ─── Single LLM Evaluation ──────────────────────────────────

/**
 * Call a single LLM evaluator endpoint with timeout and error handling.
 */
async function evaluateWithModel(
  sessionId: string,
  model: EvaluatorModel,
  category: string,
  metrics: EvaluationMetric[],
  cities: CityCandidate[],
  tavilyResearch: TavilyResult[],
  timeoutMs: number
): Promise<EvaluatorResult> {
  const startTime = Date.now();
  const endpoint = `${getBaseUrl()}${LLM_ENDPOINTS[model]}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        category,
        metrics,
        cities,
        tavilyResearch,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${model} returned ${response.status}: ${errText}`);
    }

    const data: EvaluateResponse = await response.json();

    return {
      model,
      category,
      response: data.evaluation,
      metadata: data.metadata,
      error: null,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[EvalOrchestrator] ${model} failed for ${category}:`, message);

    return {
      model,
      category,
      response: null,
      metadata: null,
      error: message,
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Consensus Builder ───────────────────────────────────────

/**
 * Build per-metric consensus from all successful LLM responses.
 * Calculates mean, median, stdDev per metric per location.
 */
function buildConsensus(
  metrics: EvaluationMetric[],
  cities: CityCandidate[],
  results: EvaluatorResult[]
): MetricConsensus[] {
  return metrics.map(metric => {
    const locations: LocationConsensus[] = cities.map(city => {
      const scores: { model: EvaluatorModel; score: number; confidence: number }[] = [];

      for (const result of results) {
        if (!result.response) continue;
        const cityEval = result.response.evaluations.find(
          e => e.location === city.location && e.country === city.country
        );
        const metricScore = cityEval?.metric_scores.find(
          ms => ms.metric_id === metric.id
        );
        if (metricScore) {
          scores.push({
            model: result.model,
            score: metricScore.score,
            confidence: metricScore.confidence,
          });
        }
      }

      const scoreValues = scores.map(s => s.score);
      const mean = scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : 0;
      const median = scoreValues.length > 0
        ? computeMedian(scoreValues)
        : 0;

      return { location: city.location, country: city.country, mean, median, scores };
    });

    // StdDev: compute per-location (LLM disagreement within each city), then take the max.
    // This avoids false positives where cities legitimately differ but LLMs agree.
    const perLocationStdDevs = locations
      .map(l => computeStdDev(l.scores.map(s => s.score)))
      .filter(sd => sd > 0);
    const stdDev = perLocationStdDevs.length > 0
      ? Math.max(...perLocationStdDevs)
      : 0;

    // Thresholds match CONFIDENCE_THRESHOLDS in smartScore.ts (§15.5)
    const confidenceLevel: MetricConsensus['confidenceLevel'] =
      stdDev < 5 ? 'unanimous' :
      stdDev < 12 ? 'strong' :
      stdDev < 20 ? 'moderate' :
      'split';

    const contributingModels = [...new Set(
      locations.flatMap(l => l.scores.map(s => s.model))
    )];

    return {
      metric_id: metric.id,
      locations,
      stdDev: Number(stdDev.toFixed(2)),
      confidenceLevel,
      contributingModels,
      needsJudgeReview: stdDev > JUDGE_REVIEW_STDDEV,
    };
  });
}

// ─── Math Helpers ────────────────────────────────────────────

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Supabase Persistence ────────────────────────────────────

/**
 * Persist evaluation results to the llm_evaluations Supabase table.
 * Called after each successful category batch.
 */
export async function persistEvaluationResults(
  sessionId: string,
  batch: CategoryBatchResult
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const rows = batch.results
    .filter(r => r.response && r.metadata)
    .map(r => ({
      session_id: sessionId,
      llm_model: r.model,
      category: r.category,
      metrics_json: r.response,
      metadata_json: r.metadata,
    }));

  if (rows.length === 0) return;

  try {
    const { error } = await supabase.from('llm_evaluations').insert(rows);
    if (error) {
      console.warn('[EvalOrchestrator] Failed to persist evaluation results:', error.message);
    }
  } catch (err) {
    console.warn('[EvalOrchestrator] Failed to persist evaluation results:', err);
  }
}
