/**
 * CLUES Intelligence — Report Data Assembler
 *
 * Assembles all evaluation data into a structured report payload
 * that can be consumed by:
 *   1. Gamma API (for the 100+ page polished report)
 *   2. PDF export fallback (client-side rendering)
 *   3. Results Data Report (raw math for scrutiny)
 *
 * This is a PURE function — no network, no side effects.
 * It takes the pipeline result + session and produces a ReportData object.
 */

import type { UserSession } from '../types';
import type { SmartScoreOutput, CitySmartScore, CategorySmartScore } from '../types/smartScore';
import type { JudgeReport, JudgeOrchestrationResult } from '../types/judge';
import type { OrchestrationResult } from '../types/evaluation';
import type { PipelineResult } from './evaluationPipeline';
import { MODULES } from '../data/modules';

// ─── Report Data Types ──────────────────────────────────────────

export interface ReportData {
  /** Report metadata */
  meta: ReportMeta;
  /** Executive summary (top-level findings) */
  executive: ExecutiveSummary;
  /** Per-city detailed analysis */
  cityProfiles: CityProfile[];
  /** Category-level comparison across all cities */
  categoryComparison: CategoryComparison[];
  /** Judge section (if judge was invoked) */
  judgeSection: JudgeSection | null;
  /** Data completeness + methodology transparency */
  methodology: MethodologySection;
}

export interface ReportMeta {
  sessionId: string;
  generatedAt: string;
  tier: string;
  confidence: number;
  entryPath: string;
  totalMetrics: number;
  totalCities: number;
  totalCostUsd: number;
  pipelineDurationMs: number;
  version: number;
}

export interface ExecutiveSummary {
  winnerCity: string;
  winnerCountry: string;
  winnerScore: number;
  runnerUp: string | null;
  runnerUpScore: number | null;
  scoreDifference: number;
  isTie: boolean;
  advantageCategories: string[];
  keyFindings: string[];
  judgeVerdict: string | null;
}

export interface CityProfile {
  location: string;
  country: string;
  locationType: string;
  rank: number;
  overallScore: number;
  confidence: string;
  topCategories: { name: string; score: number; weight: number }[];
  bottomCategories: { name: string; score: number; weight: number }[];
  judgeTrend?: string;
  totalMetrics: number;
  scoredMetrics: number;
}

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  weight: number;
  cityScores: { location: string; score: number; confidence: string }[];
  metricCount: number;
  judgeAnalysis?: string;
  trendNotes?: string;
}

export interface JudgeSection {
  metricsReviewed: number;
  metricsOverridden: number;
  safeguardTriggered: boolean;
  safeguardCorrections: string[];
  executiveSummary: string;
  keyFactors: string[];
  futureOutlook: string;
  totalCostUsd: number;
}

export interface MethodologySection {
  llmsUsed: string[];
  evaluationWaves: number;
  successfulCategories: number;
  failedCategories: string[];
  dataSource: string;
  confidenceExplanation: string;
}

// ─── Module Name Lookup ─────────────────────────────────────────

const MODULE_NAME_MAP = new Map(MODULES.map(m => [m.id, m.name]));

function getModuleName(id: string): string {
  return MODULE_NAME_MAP.get(id) ?? id;
}

// ─── Main Assembler ─────────────────────────────────────────────

/**
 * Assemble all pipeline data into a structured report.
 *
 * @param pipelineResult - The full result from runPipeline()
 * @param session - The user's session (for Paragraphical data, demographics, etc.)
 * @param version - Report version number (incremented on re-evaluation)
 */
export function assembleReportData(
  pipelineResult: PipelineResult,
  session: UserSession,
  version: number = 1
): ReportData {
  const { smartScores, evaluation, judgeResult } = pipelineResult;

  return {
    meta: buildMeta(pipelineResult, session, version),
    executive: buildExecutiveSummary(smartScores, judgeResult),
    cityProfiles: buildCityProfiles(smartScores),
    categoryComparison: buildCategoryComparison(smartScores),
    judgeSection: judgeResult ? buildJudgeSection(judgeResult) : null,
    methodology: buildMethodology(evaluation),
  };
}

// ─── Section Builders ───────────────────────────────────────────

function buildMeta(
  result: PipelineResult,
  session: UserSession,
  version: number
): ReportMeta {
  return {
    sessionId: session.id,
    generatedAt: new Date().toISOString(),
    tier: result.tier,
    confidence: result.confidence,
    entryPath: result.entryPath,
    totalMetrics: result.totalMetrics,
    totalCities: result.cities.length,
    totalCostUsd: result.totalCostUsd,
    pipelineDurationMs: result.totalDurationMs,
    version,
  };
}

function buildExecutiveSummary(
  smartScores: SmartScoreOutput,
  judgeResult: JudgeOrchestrationResult | null
): ExecutiveSummary {
  const { winner, cityScores } = smartScores;
  const winnerCity = winner.winner;
  const rankings = winner.rankings;
  const runnerUp = rankings.length > 1 ? rankings[1] : null;

  const keyFindings: string[] = [];

  // Top advantage categories
  for (const catId of winner.winnerAdvantageCategories.slice(0, 3)) {
    keyFindings.push(`Strong advantage in ${getModuleName(catId)}`);
  }

  // Tied categories
  if (winner.tiedCategories.length > 0) {
    keyFindings.push(
      `Tied with runner-up in ${winner.tiedCategories.length} categories`
    );
  }

  // Confidence note
  const topCity = cityScores.find(c => c.location === winnerCity.location);
  if (topCity) {
    keyFindings.push(`Overall confidence: ${topCity.overallConfidence}`);
  }

  return {
    winnerCity: winnerCity.location,
    winnerCountry: winnerCity.country,
    winnerScore: winnerCity.overallScore,
    runnerUp: runnerUp?.location ?? null,
    runnerUpScore: runnerUp?.overallScore ?? null,
    scoreDifference: winner.scoreDifference,
    isTie: winner.isTie,
    advantageCategories: winner.winnerAdvantageCategories.map(getModuleName),
    keyFindings,
    judgeVerdict: judgeResult?.finalReport.executiveSummary?.recommendation ?? null,
  };
}

function buildCityProfiles(smartScores: SmartScoreOutput): CityProfile[] {
  return smartScores.cityScores.map((city: CitySmartScore) => {
    const sorted = [...city.categoryScores].sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3).map(c => ({
      name: getModuleName(c.categoryId),
      score: c.score,
      weight: c.weight,
    }));
    const bottom3 = sorted.slice(-3).reverse().map(c => ({
      name: getModuleName(c.categoryId),
      score: c.score,
      weight: c.weight,
    }));

    return {
      location: city.location,
      country: city.country,
      locationType: city.location_type,
      rank: city.rank,
      overallScore: city.overallScore,
      confidence: city.overallConfidence,
      topCategories: top3,
      bottomCategories: bottom3,
      judgeTrend: city.judgeTrend,
      totalMetrics: city.totalMetrics,
      scoredMetrics: city.scoredMetrics,
    };
  });
}

function buildCategoryComparison(smartScores: SmartScoreOutput): CategoryComparison[] {
  // Collect all unique categories from the winner city
  const winnerCity = smartScores.cityScores[0];
  if (!winnerCity) return [];

  return winnerCity.categoryScores.map((cat: CategorySmartScore) => ({
    categoryId: cat.categoryId,
    categoryName: getModuleName(cat.categoryId),
    weight: cat.weight,
    cityScores: smartScores.cityScores.map(city => {
      const cityCat = city.categoryScores.find(c => c.categoryId === cat.categoryId);
      return {
        location: city.location,
        score: cityCat?.score ?? 0,
        confidence: cityCat?.confidence ?? 'split',
      };
    }),
    metricCount: cat.metricCount,
    judgeAnalysis: cat.judgeAnalysis,
    trendNotes: cat.trendNotes,
  }));
}

function buildJudgeSection(judgeResult: JudgeOrchestrationResult): JudgeSection {
  const report = judgeResult.finalReport;
  return {
    metricsReviewed: report.summaryOfFindings.metricsReviewed,
    metricsOverridden: report.summaryOfFindings.metricsOverridden,
    safeguardTriggered: judgeResult.safeguardTriggered,
    safeguardCorrections: judgeResult.safeguardCorrections.map(
      c => `${c.type}: ${c.description}`
    ),
    executiveSummary: report.executiveSummary?.recommendation ?? '',
    keyFactors: report.executiveSummary?.keyFactors ?? [],
    futureOutlook: report.executiveSummary?.futureOutlook ?? '',
    totalCostUsd: judgeResult.totalCostUsd,
  };
}

function buildMethodology(evaluation: OrchestrationResult): MethodologySection {
  // Collect all unique LLM models used
  const models = new Set<string>();
  for (const wave of evaluation.waves) {
    for (const batch of wave.results) {
      for (const result of batch.results) {
        if (result.response) models.add(result.model);
      }
    }
  }

  return {
    llmsUsed: [...models],
    evaluationWaves: evaluation.waves.length,
    successfulCategories: evaluation.successfulCategories,
    failedCategories: evaluation.failedCategories,
    dataSource: 'Tavily web search (real-time data, 2025-2026)',
    confidenceExplanation:
      'Confidence is derived from inter-model agreement (standard deviation). ' +
      'Unanimous (σ<5): all models agree. Strong (σ<12): minor differences. ' +
      'Moderate (σ<20): notable spread. Split (σ≥20): significant disagreement, judge reviewed.',
  };
}
