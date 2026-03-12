/**
 * CLUES Intelligence — Report Data Assembler
 * Conv 21-22: Report Generation
 *
 * Assembles ALL evaluation data from any entry point into a unified
 * report data structure. This is the "evidence room" — every metric,
 * every LLM score, every source citation, all in one place.
 *
 * Entry points handled:
 *   1. Paragraphical only (Gemini + Opus)
 *   2. Main Module only (5 LLMs + Opus judge)
 *   3. Both combined (merged data, lowest MOE)
 *
 * Outputs: ReportData — consumed by ResultsDataPage and GammaReportGenerator.
 */

import type { SmartScoreOutput, MetricSource } from '../types/smartScore';
import type { JudgeReport, JudgeOrchestrationResult } from '../types/judge';
import type {
  OrchestrationResult,
  EvaluatorModel,
} from '../types/evaluation';
import type { GeminiExtraction, CompletionTier } from '../types';
import type { CoverageState } from './coverageTracker';
import type { QualityReport } from './qualityScorer';

// ─── Report Data Types ───────────────────────────────────────

/** Which entry points contributed data to this report */
export interface EntryPointSummary {
  paragraphical: boolean;
  mainModule: boolean;
  /** Which of the 5 evaluation LLMs fired and succeeded */
  llmsFired: EvaluatorModel[];
  llmsSucceeded: EvaluatorModel[];
  /** Whether Opus judge was invoked */
  judgeInvoked: boolean;
  /** Completion tier at time of report */
  tier: CompletionTier;
}

/** Per-LLM success/failure breakdown */
export interface LLMStatusEntry {
  model: EvaluatorModel;
  categoriesAttempted: number;
  categoriesSucceeded: number;
  totalMetricsScored: number;
  avgDurationMs: number;
  totalCostUsd: number;
  errors: string[];
}

/** A single metric line item in the report — the atomic unit of evidence */
export interface ReportMetricLine {
  metricId: string;
  fieldId: string;
  description: string;
  category: string;
  sourceParagraph: number;
  dataType: 'numeric' | 'boolean' | 'ranking' | 'index';

  /** Per-location scores */
  locationScores: ReportLocationScore[];

  /** Consensus data */
  stdDev: number;
  confidenceLevel: 'unanimous' | 'strong' | 'moderate' | 'split';
  contributingModels: EvaluatorModel[];

  /** Judge override (if any) */
  judgeOverridden: boolean;
  judgeScore?: number;
  judgeExplanation?: string;

  /** Source citations with clickable URLs */
  sources: MetricSource[];

  /** Raw real-world value */
  rawValue?: string;
}

/** Score for one metric at one location */
export interface ReportLocationScore {
  location: string;
  country: string;
  locationType: 'city' | 'town' | 'neighborhood';
  /** Final Smart Score (0-100) */
  score: number;
  /** Raw consensus before judge */
  rawConsensusScore: number;
  /** Per-LLM individual scores for full transparency */
  perLLMScores: { model: EvaluatorModel; score: number; confidence: number }[];
}

/** Category-level rollup in the report */
export interface ReportCategoryRollup {
  categoryId: string;
  categoryName: string;
  weight: number;
  metricCount: number;
  scoredMetricCount: number;
  /** Per-location category scores */
  locationScores: { location: string; score: number; weightedContribution: number }[];
  avgStdDev: number;
  confidence: 'unanimous' | 'strong' | 'moderate' | 'split';
  judgeAnalysis?: string;
  trendNotes?: string;
}

/** Currency detection result */
export interface CurrencyInfo {
  detected: string;
  budgetMin: number;
  budgetMax: number;
  /** Secondary display currency (always USD if detected !== USD) */
  secondaryCurrency?: string;
}

/** Overall evaluation statistics */
export interface EvaluationStats {
  totalMetrics: number;
  totalScoredMetrics: number;
  totalLocations: number;
  totalCategories: number;
  successfulCategories: number;
  failedCategories: string[];
  totalLLMCalls: number;
  totalLLMSuccesses: number;
  overallMOE: number;
  metricsReviewedByJudge: number;
  metricsOverriddenByJudge: number;
  safeguardTriggered: boolean;
  totalCostUsd: number;
  totalDurationMs: number;
}

/** The complete assembled report data — everything needed for Results Data Page + Gamma */
export interface ReportData {
  /** Unique report identifier */
  reportId: string;
  /** Session ID */
  sessionId: string;
  /** Report version (increments on re-evaluation) */
  version: number;

  /** Which entry points contributed */
  entryPoints: EntryPointSummary;

  /** Currency info (detected from paragraphical or demographics) */
  currency: CurrencyInfo;

  /** Winner and rankings */
  winner: {
    location: string;
    country: string;
    overallScore: number;
    isTie: boolean;
    scoreDifference: number;
  };
  rankings: {
    location: string;
    country: string;
    locationType: 'city' | 'town' | 'neighborhood';
    overallScore: number;
    rank: number;
    confidence: 'unanimous' | 'strong' | 'moderate' | 'split';
  }[];

  /** Per-LLM status breakdown */
  llmStatus: LLMStatusEntry[];

  /** Every metric line by line */
  metricLines: ReportMetricLine[];

  /** Category rollups */
  categoryRollups: ReportCategoryRollup[];

  /** Overall evaluation statistics */
  stats: EvaluationStats;

  /** Judge executive summary */
  judgeExecutiveSummary?: {
    recommendation: string;
    rationale: string;
    keyFactors: string[];
    futureOutlook: string;
  };

  /** Gemini paragraph summaries (if Paragraphical was completed) */
  paragraphSummaries?: {
    id: number;
    keyThemes: string[];
    extractedPreferences: string[];
    metricsDerived: string[];
  }[];

  /** Timestamp */
  assembledAt: string;
}

// ─── Assembly Functions ──────────────────────────────────────

/** Generate a unique report ID */
function generateReportId(): string {
  return `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Determine entry point summary from available data */
function buildEntryPointSummary(
  geminiExtraction: GeminiExtraction | null,
  orchestration: OrchestrationResult | null,
  judgeReport: JudgeReport | null,
  tier: CompletionTier
): EntryPointSummary {
  const llmsFired: EvaluatorModel[] = [];
  const llmsSucceeded: EvaluatorModel[] = [];

  if (orchestration) {
    const allModels = new Set<EvaluatorModel>();
    const succeededModels = new Set<EvaluatorModel>();

    for (const wave of orchestration.waves) {
      for (const batch of wave.results) {
        for (const result of batch.results) {
          allModels.add(result.model);
          if (result.response !== null) {
            succeededModels.add(result.model);
          }
        }
      }
    }
    llmsFired.push(...allModels);
    llmsSucceeded.push(...succeededModels);
  }

  return {
    paragraphical: geminiExtraction !== null,
    mainModule: orchestration !== null,
    llmsFired,
    llmsSucceeded,
    judgeInvoked: judgeReport !== null,
    tier,
  };
}

/** Extract currency info from Gemini extraction or fall back to context detection */
function buildCurrencyInfo(geminiExtraction: GeminiExtraction | null): CurrencyInfo {
  if (geminiExtraction) {
    const detected = geminiExtraction.detected_currency || 'UNKNOWN';
    return {
      detected,
      budgetMin: geminiExtraction.budget_range?.min ?? 0,
      budgetMax: geminiExtraction.budget_range?.max ?? 0,
      secondaryCurrency: detected !== 'USD' ? 'USD' : undefined,
    };
  }
  return {
    detected: 'UNKNOWN',
    budgetMin: 0,
    budgetMax: 0,
  };
}

/** Build per-LLM status entries from orchestration */
function buildLLMStatus(orchestration: OrchestrationResult | null): LLMStatusEntry[] {
  if (!orchestration) return [];

  const modelMap = new Map<EvaluatorModel, {
    attempted: number;
    succeeded: number;
    metrics: number;
    durations: number[];
    costs: number[];
    errors: string[];
  }>();

  for (const wave of orchestration.waves) {
    for (const batch of wave.results) {
      for (const result of batch.results) {
        if (!modelMap.has(result.model)) {
          modelMap.set(result.model, {
            attempted: 0, succeeded: 0, metrics: 0,
            durations: [], costs: [], errors: [],
          });
        }
        const entry = modelMap.get(result.model)!;
        entry.attempted++;
        if (result.response !== null) {
          entry.succeeded++;
          entry.metrics += result.response.evaluations.reduce(
            (sum, ev) => sum + ev.metric_scores.length, 0
          );
        }
        if (result.error) entry.errors.push(result.error);
        entry.durations.push(result.durationMs);
        if (result.metadata) entry.costs.push(result.metadata.costUsd);
      }
    }
  }

  return Array.from(modelMap.entries()).map(([model, data]) => ({
    model,
    categoriesAttempted: data.attempted,
    categoriesSucceeded: data.succeeded,
    totalMetricsScored: data.metrics,
    avgDurationMs: data.durations.length > 0
      ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
      : 0,
    totalCostUsd: data.costs.reduce((a, b) => a + b, 0),
    errors: data.errors,
  }));
}

/** Build metric lines from SmartScoreOutput (the primary scored data) */
function buildMetricLines(smartScores: SmartScoreOutput): ReportMetricLine[] {
  const metricMap = new Map<string, ReportMetricLine>();

  for (const cityScore of smartScores.cityScores) {
    for (const catScore of cityScore.categoryScores) {
      for (const metric of catScore.metricScores) {
        if (!metricMap.has(metric.metric_id)) {
          metricMap.set(metric.metric_id, {
            metricId: metric.metric_id,
            fieldId: metric.fieldId,
            description: metric.description,
            category: metric.category,
            sourceParagraph: metric.source_paragraph,
            dataType: metric.data_type,
            locationScores: [],
            stdDev: metric.stdDev,
            confidenceLevel: metric.confidence,
            contributingModels: metric.contributingModels,
            judgeOverridden: metric.judgeOverridden,
            judgeScore: metric.judgeScore,
            judgeExplanation: metric.judgeExplanation,
            sources: metric.sources,
            rawValue: metric.rawValue,
          });
        }

        const line = metricMap.get(metric.metric_id)!;
        line.locationScores.push({
          location: cityScore.location,
          country: cityScore.country,
          locationType: cityScore.location_type,
          score: metric.score,
          rawConsensusScore: metric.rawConsensusScore,
          perLLMScores: [], // Populated below from orchestration if available
        });
      }
    }
  }

  return Array.from(metricMap.values());
}

/** Enrich metric lines with per-LLM individual scores from orchestration */
function enrichWithPerLLMScores(
  metricLines: ReportMetricLine[],
  orchestration: OrchestrationResult | null
): void {
  if (!orchestration) return;

  // Build lookup: metric_id → location → per-LLM scores
  const consensusLookup = new Map<string, Map<string, { model: EvaluatorModel; score: number; confidence: number }[]>>();

  for (const wave of orchestration.waves) {
    for (const batch of wave.results) {
      for (const consensus of batch.consensus) {
        if (!consensusLookup.has(consensus.metric_id)) {
          consensusLookup.set(consensus.metric_id, new Map());
        }
        const locMap = consensusLookup.get(consensus.metric_id)!;
        for (const loc of consensus.locations) {
          locMap.set(loc.location, loc.scores);
        }
      }
    }
  }

  // Enrich each metric line
  for (const line of metricLines) {
    const locMap = consensusLookup.get(line.metricId);
    if (!locMap) continue;
    for (const locScore of line.locationScores) {
      const llmScores = locMap.get(locScore.location);
      if (llmScores) {
        locScore.perLLMScores = llmScores;
      }
    }
  }
}

/** Build category rollups from SmartScoreOutput */
function buildCategoryRollups(
  smartScores: SmartScoreOutput,
  judgeReport: JudgeReport | null
): ReportCategoryRollup[] {
  // Gather unique categories from the winner (or first city)
  const refCity = smartScores.winner.winner;
  const judgeAnalysisMap = new Map<string, { analysis?: string; trend?: string }>();

  if (judgeReport) {
    for (const ca of judgeReport.categoryAnalysis) {
      judgeAnalysisMap.set(ca.categoryId, {
        analysis: ca.locationAnalyses.map(la => `${la.location}: ${la.analysis}`).join(' | '),
        trend: ca.trendNotes,
      });
    }
  }

  return refCity.categoryScores.map(cat => {
    const locationScores = smartScores.cityScores.map(city => {
      const cityCat = city.categoryScores.find(c => c.categoryId === cat.categoryId);
      return {
        location: city.location,
        score: cityCat?.score ?? 0,
        weightedContribution: cityCat?.weightedContribution ?? 0,
      };
    });

    const judgeInfo = judgeAnalysisMap.get(cat.categoryId);

    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      weight: cat.weight,
      metricCount: cat.metricCount,
      scoredMetricCount: cat.scoredMetricCount,
      locationScores,
      avgStdDev: cat.avgStdDev,
      confidence: cat.confidence,
      judgeAnalysis: judgeInfo?.analysis,
      trendNotes: judgeInfo?.trend,
    };
  });
}

/** Build overall evaluation statistics */
function buildStats(
  smartScores: SmartScoreOutput,
  orchestration: OrchestrationResult | null,
  judgeReport: JudgeReport | null,
  judgeOrchestration: JudgeOrchestrationResult | null,
  coverage: CoverageState | null
): EvaluationStats {
  const totalLocations = smartScores.cityScores.length;
  const refCity = smartScores.winner.winner;
  const totalMetrics = refCity.totalMetrics;
  const totalScoredMetrics = refCity.scoredMetrics;

  let totalLLMCalls = 0;
  let totalLLMSuccesses = 0;

  if (orchestration) {
    for (const wave of orchestration.waves) {
      for (const batch of wave.results) {
        totalLLMCalls += batch.results.length;
        totalLLMSuccesses += batch.results.filter(r => r.response !== null).length;
      }
    }
  }

  const evalCost = orchestration?.totalCostUsd ?? 0;
  const judgeCost = judgeOrchestration?.totalCostUsd ?? 0;

  return {
    totalMetrics,
    totalScoredMetrics,
    totalLocations,
    totalCategories: orchestration?.totalCategories ?? refCity.categoryScores.length,
    successfulCategories: orchestration?.successfulCategories ?? refCity.categoryScores.length,
    failedCategories: orchestration?.failedCategories ?? [],
    totalLLMCalls,
    totalLLMSuccesses,
    overallMOE: coverage?.overallMOE ?? 0,
    metricsReviewedByJudge: judgeReport?.summaryOfFindings.metricsReviewed ?? 0,
    metricsOverriddenByJudge: judgeReport?.summaryOfFindings.metricsOverridden ?? 0,
    safeguardTriggered: judgeOrchestration?.safeguardTriggered ?? false,
    totalCostUsd: evalCost + judgeCost,
    totalDurationMs: (orchestration?.totalDurationMs ?? 0) + (judgeOrchestration?.totalDurationMs ?? 0),
  };
}

// ─── Main Assembler ──────────────────────────────────────────

export interface AssembleReportInput {
  sessionId: string;
  version?: number;
  tier: CompletionTier;

  /** Required: SmartScoreOutput is always present (computed from either entry point) */
  smartScores: SmartScoreOutput;

  /** Optional: Gemini extraction (present if Paragraphical was completed) */
  geminiExtraction?: GeminiExtraction | null;

  /** Optional: Orchestration result (present if Main Module was completed) */
  orchestration?: OrchestrationResult | null;

  /** Optional: Judge report (present if Opus judged) */
  judgeReport?: JudgeReport | null;
  judgeOrchestration?: JudgeOrchestrationResult | null;

  /** Optional: Coverage state for MOE */
  coverage?: CoverageState | null;

  /** Optional: Quality report */
  quality?: QualityReport | null;
}

/**
 * Assemble all available evaluation data into a unified ReportData structure.
 * Handles any entry point combination: Paragraphical only, Main Module only, or both.
 */
export function assembleReportData(input: AssembleReportInput): ReportData {
  const {
    sessionId,
    version = 1,
    tier,
    smartScores,
    geminiExtraction = null,
    orchestration = null,
    judgeReport = null,
    judgeOrchestration = null,
    coverage = null,
  } = input;

  // 1. Entry point summary
  const entryPoints = buildEntryPointSummary(geminiExtraction, orchestration, judgeReport, tier);

  // 2. Currency detection
  const currency = buildCurrencyInfo(geminiExtraction);

  // 3. Winner and rankings
  const { winner } = smartScores;
  const winnerData = {
    location: winner.winner.location,
    country: winner.winner.country,
    overallScore: winner.winner.overallScore,
    isTie: winner.isTie,
    scoreDifference: winner.scoreDifference,
  };
  const rankings = winner.rankings.map(city => ({
    location: city.location,
    country: city.country,
    locationType: city.location_type,
    overallScore: city.overallScore,
    rank: city.rank,
    confidence: city.overallConfidence,
  }));

  // 4. LLM status
  const llmStatus = buildLLMStatus(orchestration);

  // 5. Metric lines — the core evidence
  const metricLines = buildMetricLines(smartScores);
  enrichWithPerLLMScores(metricLines, orchestration);

  // 6. Category rollups
  const categoryRollups = buildCategoryRollups(smartScores, judgeReport);

  // 7. Stats
  const stats = buildStats(smartScores, orchestration, judgeReport, judgeOrchestration, coverage);

  // 8. Judge executive summary
  const judgeExecutiveSummary = judgeReport?.executiveSummary
    ? {
        recommendation: judgeReport.executiveSummary.recommendation,
        rationale: judgeReport.executiveSummary.rationale,
        keyFactors: judgeReport.executiveSummary.keyFactors,
        futureOutlook: judgeReport.executiveSummary.futureOutlook,
      }
    : undefined;

  // 9. Paragraph summaries (from Gemini extraction)
  const paragraphSummaries = geminiExtraction?.paragraph_summaries?.map(ps => ({
    id: ps.id,
    keyThemes: ps.key_themes,
    extractedPreferences: ps.extracted_preferences,
    metricsDerived: ps.metrics_derived,
  }));

  return {
    reportId: generateReportId(),
    sessionId,
    version,
    entryPoints,
    currency,
    winner: winnerData,
    rankings,
    llmStatus,
    metricLines,
    categoryRollups,
    stats,
    judgeExecutiveSummary,
    paragraphSummaries,
    assembledAt: new Date().toISOString(),
  };
}
