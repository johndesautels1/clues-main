/**
 * CLUES Intelligence — Relative Scoring Engine
 *
 * Cities are scored RELATIVE to each other, not in isolation (§8, §15.4).
 * This module takes the per-city Smart Scores and adjusts them
 * so that scores reflect how cities compare on each metric.
 *
 * Flow:
 *   1. computeAllMetricSmartScores() → per-location MetricSmartScore[]
 *   2. applyRelativeScoring() → adjust scores relative to peer cities
 *   3. computeCityScore() per location → CitySmartScore[]
 *   4. determineWinner() → WinnerDetermination
 *
 * Relative scoring formula per metric:
 *   For each metric, find min and max across all cities.
 *   Relative score = ((cityScore - min) / (max - min)) * 100
 *   If all cities have the same score, relative score = 50 (neutral).
 */

import type {
  MetricSmartScore,
  CitySmartScore,
  WinnerDetermination,
  SmartScoreInput,
  SmartScoreOutput,
} from '../types/smartScore';
import {
  CITY_TIE_THRESHOLD,
  CATEGORY_TIE_THRESHOLD,
} from '../types/smartScore';
import { computeAllMetricSmartScores } from './smartScoreEngine';
import { computeCityScore } from './categoryRollup';

// ─── Relative Score Adjustment ───────────────────────────────

/**
 * Apply relative scoring across cities for each metric.
 *
 * For each metric, scores are rescaled so that:
 * - The best city gets 100
 * - The worst city gets 0
 * - Other cities are linearly interpolated
 *
 * If all cities score the same on a metric, all get 50 (neutral).
 * If only one city has data, it keeps its absolute score.
 *
 * This ensures cities are compared to EACH OTHER, not to an abstract ideal.
 */
export function applyRelativeScoring(
  locationScores: Map<string, MetricSmartScore[]>
): Map<string, MetricSmartScore[]> {
  const locations = Array.from(locationScores.keys());
  if (locations.length <= 1) {
    // Only one city — no relative scoring possible, keep absolute scores
    return locationScores;
  }

  // Build metric index: metric_id → { location → MetricSmartScore }
  const metricIndex = new Map<string, Map<string, MetricSmartScore>>();
  for (const [location, scores] of locationScores) {
    for (const ms of scores) {
      if (!metricIndex.has(ms.metric_id)) {
        metricIndex.set(ms.metric_id, new Map());
      }
      metricIndex.get(ms.metric_id)!.set(location, ms);
    }
  }

  // For each metric, compute relative scores
  for (const [_metricId, locationMap] of metricIndex) {
    const scores = Array.from(locationMap.values())
      .map((ms) => ms.score)
      .filter((s) => s >= 0); // Exclude missing data

    if (scores.length < 2) continue; // Can't do relative scoring with < 2 scores

    const min = Math.min(...scores);
    const max = Math.max(...scores);

    if (max === min) {
      // All cities have the same score — set to 50 (neutral)
      for (const ms of locationMap.values()) {
        if (ms.score >= 0) {
          // Preserve absolute score in rawConsensusScore (if not already overridden by judge)
          if (!ms.judgeOverridden) {
            ms.rawConsensusScore = ms.score;
          }
          ms.score = 50;
        }
      }
    } else {
      // Linear interpolation: ((score - min) / (max - min)) * 100
      for (const ms of locationMap.values()) {
        if (ms.score >= 0) {
          if (!ms.judgeOverridden) {
            ms.rawConsensusScore = ms.score;
          }
          ms.score =
            Math.round(((ms.score - min) / (max - min)) * 100 * 100) / 100;
        }
      }
    }
  }

  return locationScores;
}

// ─── Winner Determination ────────────────────────────────────

/**
 * Determine the winner among scored cities.
 *
 * Rules (§15.4):
 * - City tie threshold: score difference < 1 point
 * - Category tie threshold: score difference < 2 points
 * - Rankings sorted by overallScore descending
 * - Advantage categories identified for top 2 cities
 */
export function determineWinner(
  cityScores: CitySmartScore[]
): WinnerDetermination {
  if (cityScores.length === 0) {
    throw new Error('determineWinner requires at least one city score');
  }

  // Sort by overall score descending
  const ranked = [...cityScores].sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks
  for (let i = 0; i < ranked.length; i++) {
    ranked[i].rank = i + 1;
  }

  const winner = ranked[0];
  const runnerUp = ranked.length > 1 ? ranked[1] : null;

  const scoreDifference = runnerUp
    ? Math.round((winner.overallScore - runnerUp.overallScore) * 100) / 100
    : winner.overallScore;

  const isTie = runnerUp !== null && Math.abs(scoreDifference) < CITY_TIE_THRESHOLD;

  // Identify advantage categories
  const winnerAdvantageCategories: string[] = [];
  const runnerUpAdvantageCategories: string[] = [];
  const tiedCategories: string[] = [];

  if (runnerUp) {
    for (const winnerCat of winner.categoryScores) {
      const runnerUpCat = runnerUp.categoryScores.find(
        (c) => c.categoryId === winnerCat.categoryId
      );
      if (!runnerUpCat) continue;

      const diff = winnerCat.score - runnerUpCat.score;
      if (Math.abs(diff) < CATEGORY_TIE_THRESHOLD) {
        tiedCategories.push(winnerCat.categoryId);
      } else if (diff > 0) {
        winnerAdvantageCategories.push(winnerCat.categoryId);
      } else {
        runnerUpAdvantageCategories.push(winnerCat.categoryId);
      }
    }
  }

  return {
    winner,
    rankings: ranked,
    isTie,
    scoreDifference,
    winnerAdvantageCategories,
    runnerUpAdvantageCategories,
    tiedCategories,
  };
}

// ─── Full Smart Score Pipeline ───────────────────────────────

/**
 * The complete Smart Score pipeline. This is the main entry point
 * that ties together all three engines:
 *
 * 1. smartScoreEngine  → MetricSmartScores from consensus + judge
 * 2. relativeScoring   → Adjust scores relative to peer cities
 * 3. categoryRollup    → Roll up to categories and overall city scores
 * 4. Winner determination
 *
 * @param input - SmartScoreInput containing orchestration result, judge report,
 *                metrics, cities, and category weights
 * @returns SmartScoreOutput with per-city scores and winner
 */
export function computeSmartScores(input: SmartScoreInput): SmartScoreOutput {
  const {
    orchestrationResult,
    judgeReport,
    metrics,
    cities,
    categoryWeights,
    useConservativeScoring = false,
  } = input;

  // Step 1: Compute raw MetricSmartScores from consensus + judge
  let locationScores = computeAllMetricSmartScores(
    orchestrationResult,
    judgeReport,
    metrics,
    useConservativeScoring
  );

  // Step 2: Apply relative scoring (cities compared to each other)
  locationScores = applyRelativeScoring(locationScores);

  // Step 3: Roll up to city-level scores
  const cityScores: CitySmartScore[] = [];
  for (const city of cities) {
    const metricScores = locationScores.get(city.location);
    if (!metricScores || metricScores.length === 0) continue;

    const cityScore = computeCityScore(
      city,
      metricScores,
      categoryWeights,
      judgeReport
    );
    cityScores.push(cityScore);
  }

  // Step 4: Determine winner
  const winner = determineWinner(cityScores);

  return {
    cityScores: winner.rankings, // Sorted by rank
    winner,
    categoryWeights,
    computedAt: new Date().toISOString(),
  };
}
