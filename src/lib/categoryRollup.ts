/**
 * CLUES Intelligence — Category Rollup Engine
 *
 * Rolls up MetricSmartScores → CategorySmartScores → CitySmartScore.
 * Applies category weights derived from user persona + paragraph emphasis.
 *
 * Flow:
 *   MetricSmartScore[] (per location)
 *     → group by category
 *     → weighted average within category → CategorySmartScore
 *     → weighted rollup across categories → CitySmartScore.overallScore
 *
 * Weight derivation:
 *   1. Start with equal weights (1/23 per category)
 *   2. Apply persona preset multipliers (if detected)
 *   3. Apply paragraph emphasis multipliers (more paragraphs about a topic = higher weight)
 *   4. Re-normalize so weights sum to 1.0
 */

import type { CityCandidate } from '../types/evaluation';
import type { JudgeReport, JudgeCategoryAnalysis } from '../types/judge';
import type {
  MetricSmartScore,
  CategorySmartScore,
  CitySmartScore,
  CategoryWeights,
  ConfidenceLevel,
} from '../types/smartScore';
import {
  DEFAULT_CATEGORY_COUNT,
  PERSONA_PRESETS,
} from '../types/smartScore';
import { getConfidenceLevel, mean } from './smartScoreEngine';
import { MODULES } from '../data/modules';

// ─── Category Weight Derivation ──────────────────────────────

/** All 23 category IDs from modules.ts */
const ALL_CATEGORY_IDS = MODULES.map((m) => m.id);

/**
 * Derive category weights from persona preset and/or paragraph emphasis.
 *
 * @param personaId  - persona preset ID (e.g., 'digital_nomad'), or null for balanced
 * @param paragraphEmphasis - Record<categoryId, emphasis_score> from Gemini extraction
 *                            Higher values = user wrote more about this category
 * @returns CategoryWeights with all 23 categories summing to 1.0
 */
export function deriveCategoryWeights(
  personaId?: string,
  paragraphEmphasis?: Record<string, number>
): CategoryWeights {
  // Step 1: Start with equal weights
  const rawWeights: Record<string, number> = {};
  const baseWeight = 1.0 / DEFAULT_CATEGORY_COUNT;
  for (const catId of ALL_CATEGORY_IDS) {
    rawWeights[catId] = baseWeight;
  }

  let derivation: CategoryWeights['derivation'] = 'default';

  // Step 2: Apply persona preset multipliers
  const preset = personaId
    ? PERSONA_PRESETS.find((p) => p.id === personaId)
    : null;
  if (preset && Object.keys(preset.weightMultipliers).length > 0) {
    derivation = 'persona';
    for (const [catId, multiplier] of Object.entries(preset.weightMultipliers)) {
      if (rawWeights[catId] !== undefined) {
        rawWeights[catId] *= multiplier;
      }
    }
  }

  // Step 3: Apply paragraph emphasis
  if (paragraphEmphasis && Object.keys(paragraphEmphasis).length > 0) {
    derivation = preset ? 'paragraph_emphasis' : 'custom';
    for (const [catId, emphasis] of Object.entries(paragraphEmphasis)) {
      if (rawWeights[catId] !== undefined && emphasis > 0) {
        // Emphasis is 0-1 scale; convert to multiplier (1.0 to 2.0 range)
        rawWeights[catId] *= 1.0 + emphasis;
      }
    }
  }

  // Step 4: Normalize so all weights sum to 1.0
  const weights = normalizeWeights(rawWeights);

  return {
    weights,
    derivation,
    personaPreset: preset?.id,
  };
}

/**
 * Normalize a weight map so values sum to 1.0.
 */
function normalizeWeights(raw: Record<string, number>): Record<string, number> {
  const total = Object.values(raw).reduce((sum, w) => sum + w, 0);
  if (total === 0) {
    // Fallback to equal weights
    const equal = 1.0 / Object.keys(raw).length;
    const result: Record<string, number> = {};
    for (const key of Object.keys(raw)) {
      result[key] = equal;
    }
    return result;
  }

  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = value / total;
  }
  return result;
}

// ─── Metric → Category Rollup ────────────────────────────────

/**
 * Group MetricSmartScores by category and compute CategorySmartScore for each.
 *
 * Within each category, metrics are averaged with equal intra-category weight.
 * Metrics with score === -1 (insufficient data) are excluded from the average.
 */
export function rollupToCategories(
  metricScores: MetricSmartScore[],
  categoryWeights: CategoryWeights,
  judgeReport: JudgeReport | null,
  locationName?: string
): CategorySmartScore[] {
  // Group metrics by category
  const grouped = new Map<string, MetricSmartScore[]>();
  for (const ms of metricScores) {
    if (!grouped.has(ms.category)) {
      grouped.set(ms.category, []);
    }
    grouped.get(ms.category)!.push(ms);
  }

  // Find module definitions for category names
  const moduleMap = new Map(MODULES.map((m) => [m.id, m]));

  // Build judge analysis lookup
  const judgeAnalysisMap = new Map<string, JudgeCategoryAnalysis>();
  if (judgeReport) {
    for (const ca of judgeReport.categoryAnalysis) {
      judgeAnalysisMap.set(ca.categoryId, ca);
    }
  }

  const categoryScores: CategorySmartScore[] = [];

  for (const [categoryId, metrics] of grouped) {
    const moduleDef = moduleMap.get(categoryId);
    const categoryName = moduleDef?.name ?? categoryId;
    const weight = categoryWeights.weights[categoryId] ?? (1.0 / DEFAULT_CATEGORY_COUNT);

    // Only score metrics with valid data (score >= 0)
    const validMetrics = metrics.filter((m) => m.score >= 0);
    const scoredCount = validMetrics.length;

    // Weighted average within category (all intra-category metrics equal weight for now)
    const categoryScore =
      scoredCount > 0
        ? mean(validMetrics.map((m) => m.score))
        : 0;

    const weightedContribution = categoryScore * weight;

    // Aggregate confidence: use mean stdDev
    const avgStdDev =
      validMetrics.length > 0
        ? mean(validMetrics.map((m) => m.stdDev))
        : 0;
    const confidence = getConfidenceLevel(avgStdDev);

    // Judge analysis for this category (first location analysis, if any)
    const judgeAnalysis = judgeAnalysisMap.get(categoryId);

    categoryScores.push({
      categoryId,
      categoryName,
      score: Math.round(categoryScore * 100) / 100,
      weight,
      weightedContribution: Math.round(weightedContribution * 100) / 100,
      metricCount: metrics.length,
      scoredMetricCount: scoredCount,
      metricScores: metrics,
      confidence,
      avgStdDev: Math.round(avgStdDev * 100) / 100,
      judgeAnalysis: locationName
        ? judgeAnalysis?.locationAnalyses?.find(la => la.location === locationName)?.analysis
          ?? judgeAnalysis?.locationAnalyses?.[0]?.analysis
        : judgeAnalysis?.locationAnalyses?.[0]?.analysis,
      trendNotes: judgeAnalysis?.trendNotes,
    });
  }

  // Sort by weight descending (most important categories first)
  categoryScores.sort((a, b) => b.weight - a.weight);

  return categoryScores;
}

// ─── Category → City Rollup ──────────────────────────────────

/**
 * Roll up CategorySmartScores into a single CitySmartScore.
 *
 * Overall score = SUM(category.score * category.weight) for all categories.
 * This produces a 0-100 overall score.
 */
export function rollupToCity(
  location: CityCandidate,
  categoryScores: CategorySmartScore[],
  judgeReport: JudgeReport | null
): CitySmartScore {
  // Overall score = weighted sum of category scores
  const overallScore = categoryScores.reduce(
    (sum, cs) => sum + cs.weightedContribution,
    0
  );

  // Build flat category score map
  const categoryScoreMap: Record<string, number> = {};
  for (const cs of categoryScores) {
    categoryScoreMap[cs.categoryId] = cs.score;
  }

  // Total metrics
  const totalMetrics = categoryScores.reduce((sum, cs) => sum + cs.metricCount, 0);
  const scoredMetrics = categoryScores.reduce(
    (sum, cs) => sum + cs.scoredMetricCount,
    0
  );

  // Overall confidence: weighted by metric count
  const totalStdDev =
    scoredMetrics > 0
      ? categoryScores.reduce(
          (sum, cs) => sum + cs.avgStdDev * cs.scoredMetricCount,
          0
        ) / scoredMetrics
      : 0;
  const overallConfidence = getConfidenceLevel(totalStdDev);

  // Judge trend for this location
  let judgeTrend: CitySmartScore['judgeTrend'];
  if (judgeReport) {
    const locationSummary = judgeReport.summaryOfFindings.locationScores.find(
      (ls) => ls.location === location.location
    );
    judgeTrend = locationSummary?.trend;
  }

  return {
    location: location.location,
    country: location.country,
    location_type: location.location_type,
    parent: location.parent,
    overallScore: Math.round(overallScore * 100) / 100,
    categoryScores,
    categoryScoreMap,
    totalMetrics,
    scoredMetrics,
    overallConfidence,
    judgeTrend,
    rank: 0, // Assigned later during relative scoring
  };
}

// ─── Full Pipeline: Metrics → City Score ─────────────────────

/**
 * Complete rollup pipeline for a single city:
 * MetricSmartScore[] → CategorySmartScore[] → CitySmartScore
 */
export function computeCityScore(
  location: CityCandidate,
  metricScores: MetricSmartScore[],
  categoryWeights: CategoryWeights,
  judgeReport: JudgeReport | null
): CitySmartScore {
  const categoryScores = rollupToCategories(
    metricScores,
    categoryWeights,
    judgeReport,
    location.location
  );
  return rollupToCity(location, categoryScores, judgeReport);
}
