/**
 * CLUES Intelligence — Judge Orchestrator
 *
 * Aggregates 5-LLM evaluation results, identifies high-disagreement metrics
 * (σ > 15), formats them as judge evidence, sends to Opus in batches of 30,
 * and applies anti-hallucination safeguards to the final report.
 *
 * Flow:
 *   1. Collect all MetricConsensus from OrchestrationResult
 *   2. Filter to σ > 15 (needsJudgeReview)
 *   3. Batch into groups of 30 (Opus token budget limit)
 *   4. Build JudgeMetric evidence from the raw EvaluatorResults
 *   5. Call /api/judge-opus for each batch
 *   6. Merge all JudgeReports into a single final report
 *   7. Apply anti-hallucination safeguards
 *   8. Persist to Supabase judge_reports table
 */

import type {
  OrchestrationResult,
  CategoryBatchResult,
  MetricConsensus,
  EvaluationMetric,
} from '../types/evaluation';
import type {
  JudgeMetric,
  JudgeLocationEvidence,
  JudgeLLMScore,
  JudgeCategorySummary,
  JudgeReport,
  JudgeOrchestrationResult,
  SafeguardCorrection,
  MetricOverride,
  JudgeSummary,
  JudgeReportRow,
} from '../types/judge';
import { supabase, isSupabaseConfigured } from './supabase';

// ─── Constants ───────────────────────────────────────────────

/** Max metrics per Opus call (token budget) */
const MAX_METRICS_PER_CALL = 30;

// ─── Main Orchestrator ───────────────────────────────────────

/**
 * Run the Opus judge across all high-disagreement metrics from evaluation.
 *
 * @param sessionId - User session ID
 * @param orchestrationResult - Full result from evaluationOrchestrator.runEvaluation()
 * @param metricsMap - Lookup map of metric ID → EvaluationMetric (for descriptions)
 * @param userContext - User context for personalized analysis
 */
export async function runJudge(
  sessionId: string,
  orchestrationResult: OrchestrationResult,
  metricsMap: Record<string, EvaluationMetric>,
  userContext: {
    globeRegion?: string;
    paragraphCount: number;
    completedModules: string[];
    tier: string;
  }
): Promise<JudgeOrchestrationResult> {
  const startTime = Date.now();

  // ─── 1. Collect disputed metrics ───────────────────────────
  const disputedConsensus = orchestrationResult.metricsForJudge;

  // If no disputed metrics, return a clean report
  if (disputedConsensus.length === 0) {
    return buildCleanResult(sessionId, startTime);
  }

  // ─── 2. Build judge evidence from raw evaluator results ────
  const allBatches = collectAllBatches(orchestrationResult);
  const categoryResults = buildCategorySummaries(allBatches);
  const judgeMetrics = buildJudgeMetrics(disputedConsensus, allBatches, metricsMap);

  // ─── 3. Batch into groups of 30 ───────────────────────────
  const batches: JudgeMetric[][] = [];
  for (let i = 0; i < judgeMetrics.length; i += MAX_METRICS_PER_CALL) {
    batches.push(judgeMetrics.slice(i, i + MAX_METRICS_PER_CALL));
  }

  // ─── 4. Call Opus for each batch ──────────────────────────
  const reports: JudgeReport[] = [];
  let totalCostUsd = 0;
  let invocationCount = 0;

  for (const batch of batches) {
    invocationCount++;

    try {
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const response = await fetch(`${baseUrl}/api/judge-opus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          metrics: batch,
          categoryResults,
          userContext,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[JudgeOrchestrator] Opus batch ${invocationCount} failed:`, errText);
        continue;
      }

      const data = (await response.json()) as {
        report?: JudgeReport;
        metadata?: { costUsd?: number };
      };
      if (data.report) reports.push(data.report);
      if (data.metadata?.costUsd) totalCostUsd += data.metadata.costUsd;
    } catch (err) {
      console.error(`[JudgeOrchestrator] Opus batch ${invocationCount} error:`, err);
    }
  }

  // ─── 5. Merge reports ─────────────────────────────────────
  const mergedReport = mergeReports(reports, sessionId);

  // ─── 6. Anti-hallucination safeguards ─────────────────────
  const { correctedReport, safeguardTriggered, corrections } =
    applySafeguards(mergedReport, allBatches);

  // ─── 7. Persist to Supabase ───────────────────────────────
  try {
    await persistJudgeReport(sessionId, correctedReport, safeguardTriggered, totalCostUsd, Date.now() - startTime);
  } catch (err) {
    console.error('[JudgeOrchestrator] Persistence failed:', err);
  }

  return {
    finalReport: correctedReport,
    invocationCount,
    safeguardTriggered,
    safeguardCorrections: corrections,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    totalDurationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Helper: Collect all batch results ───────────────────────

function collectAllBatches(result: OrchestrationResult): CategoryBatchResult[] {
  return result.waves.flatMap(w => w.results);
}

// ─── Helper: Build category summaries for judge context ──────

function buildCategorySummaries(batches: CategoryBatchResult[]): JudgeCategorySummary[] {
  return batches
    .filter(b => b.isUsable)
    .map(batch => {
      // Collect per-location average scores
      const locationMap = new Map<string, { location: string; country: string; scores: number[] }>();

      for (const result of batch.results) {
        if (!result.response?.evaluations) continue;
        for (const evaluation of result.response.evaluations) {
          const key = `${evaluation.location}|${evaluation.country}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, { location: evaluation.location, country: evaluation.country, scores: [] });
          }
          locationMap.get(key)!.scores.push(evaluation.overall_score);
        }
      }

      const locationScores = Array.from(locationMap.values()).map(loc => ({
        location: loc.location,
        country: loc.country,
        avgScore: loc.scores.reduce((a, b) => a + b, 0) / loc.scores.length,
      }));

      return {
        categoryId: batch.category,
        categoryName: batch.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        metricCount: batch.consensus.length,
        locationScores,
        highDisagreementCount: batch.consensus.filter(c => c.needsJudgeReview).length,
      };
    });
}

// ─── Helper: Build JudgeMetric evidence from raw results ─────

function buildJudgeMetrics(
  disputedConsensus: MetricConsensus[],
  allBatches: CategoryBatchResult[],
  metricsMap: Record<string, EvaluationMetric>
): JudgeMetric[] {
  return disputedConsensus.map(consensus => {
    const metricDef = metricsMap[consensus.metric_id];

    // Find the category batch containing this metric
    const locations: JudgeLocationEvidence[] = consensus.locations.map(locConsensus => {
      const llmScores: JudgeLLMScore[] = [];

      // Extract individual LLM scores from raw batch results
      for (const batch of allBatches) {
        for (const result of batch.results) {
          if (!result.response) continue;
          const cityEval = result.response.evaluations.find(
            e => e.location === locConsensus.location && e.country === locConsensus.country
          );
          const metricScore = cityEval?.metric_scores.find(
            ms => ms.metric_id === consensus.metric_id
          );
          if (metricScore) {
            llmScores.push({
              model: result.model,
              score: metricScore.score,
              confidence: metricScore.confidence,
              data_justification: metricScore.data_justification,
              source: metricScore.source,
              reasoning: metricScore.reasoning,
            });
          }
        }
      }

      return {
        location: locConsensus.location,
        country: locConsensus.country,
        consensusMean: locConsensus.mean,
        consensusMedian: locConsensus.median,
        llmScores,
      };
    });

    return {
      metric_id: consensus.metric_id,
      description: metricDef?.description ?? consensus.metric_id,
      category: metricDef?.category ?? 'unknown',
      locations,
      stdDev: consensus.stdDev,
      contributingModels: consensus.contributingModels,
    };
  });
}

// ─── Helper: Merge multiple judge reports ────────────────────

function mergeReports(reports: JudgeReport[], sessionId: string): JudgeReport {
  if (reports.length === 0) {
    return {
      reportId: `CLUES-JDG-${new Date().toISOString().slice(0, 10)}-${sessionId.slice(0, 8)}-${Date.now()}`,
      summaryOfFindings: {
        locationScores: [],
        overallConfidence: 'low',
        metricsReviewed: 0,
        metricsOverridden: 0,
      },
      categoryAnalysis: [],
      executiveSummary: {
        recommendation: '',
        rationale: 'No disputed metrics required judge review.',
        keyFactors: [],
        futureOutlook: '',
      },
      metricOverrides: [],
      confirmedMetrics: [],
      judgedAt: new Date().toISOString(),
    };
  }

  if (reports.length === 1) return reports[0];

  // Use the last report's executive summary (each batch only sees its own 30 metrics,
  // so multi-batch runs may have an incomplete executive summary — known limitation)
  const lastReport = reports[reports.length - 1];

  // Merge overrides and confirmed metrics from all reports
  const allOverrides: MetricOverride[] = [];
  const allConfirmed: string[] = [];
  let totalReviewed = 0;
  let totalOverridden = 0;

  for (const r of reports) {
    allOverrides.push(...(r.metricOverrides ?? []));
    allConfirmed.push(...(r.confirmedMetrics ?? []));
    totalReviewed += r.summaryOfFindings?.metricsReviewed ?? 0;
    totalOverridden += r.summaryOfFindings?.metricsOverridden ?? 0;
  }

  // Merge category analyses (dedupe by categoryId, prefer later reports)
  const categoryMap = new Map<string, typeof lastReport.categoryAnalysis[0]>();
  for (const r of reports) {
    for (const ca of r.categoryAnalysis ?? []) {
      categoryMap.set(ca.categoryId, ca);
    }
  }

  return {
    reportId: lastReport.reportId,
    summaryOfFindings: {
      ...lastReport.summaryOfFindings,
      metricsReviewed: totalReviewed,
      // Use actual array length as ground truth, not Opus's self-reported count
      metricsOverridden: allOverrides.length,
    },
    categoryAnalysis: Array.from(categoryMap.values()),
    executiveSummary: lastReport.executiveSummary,
    metricOverrides: allOverrides,
    confirmedMetrics: [...new Set(allConfirmed)],
    judgedAt: lastReport.judgedAt,
  };
}

// ─── Anti-Hallucination Safeguards ───────────────────────────

function applySafeguards(
  report: JudgeReport,
  allBatches: CategoryBatchResult[]
): {
  correctedReport: JudgeReport;
  safeguardTriggered: boolean;
  corrections: SafeguardCorrection[];
} {
  const corrections: SafeguardCorrection[] = [];
  const correctedReport = { ...report };

  // ─── Safeguard 1: Winner must match computed scores ────────
  // Compute actual overall scores per location from consensus data
  const locationTotals = new Map<string, { total: number; count: number }>();

  for (const batch of allBatches) {
    if (!batch.isUsable) continue;
    for (const consensus of batch.consensus) {
      for (const loc of consensus.locations) {
        const key = `${loc.location}|${loc.country}`;
        const existing = locationTotals.get(key) ?? { total: 0, count: 0 };
        existing.total += loc.mean;
        existing.count++;
        locationTotals.set(key, existing);
      }
    }
  }

  // Find the actual computed winner
  let computedWinner = '';
  let highestAvg = -1;
  for (const [key, data] of locationTotals) {
    const avg = data.count > 0 ? data.total / data.count : 0;
    if (avg > highestAvg) {
      highestAvg = avg;
      computedWinner = key.split('|')[0]; // location name
    }
  }

  // Check if Opus's recommendation matches (normalize: trim, lowercase, strip trailing punctuation)
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,;!]+$/, '');
  if (
    computedWinner &&
    report.executiveSummary?.recommendation &&
    normalize(report.executiveSummary.recommendation) !== 'tie' &&
    !normalize(report.executiveSummary.recommendation).includes(normalize(computedWinner)) &&
    !normalize(computedWinner).includes(normalize(report.executiveSummary.recommendation))
  ) {
    corrections.push({
      type: 'winner_override',
      description: `Opus recommended "${report.executiveSummary.recommendation}" but computed scores show "${computedWinner}" is the winner. Force-corrected.`,
      opusValue: report.executiveSummary.recommendation,
      computedValue: computedWinner,
    });

    correctedReport.executiveSummary = {
      ...report.executiveSummary,
      recommendation: computedWinner,
    };
  }

  // ─── Safeguard 2: Confidence must match StdDev ─────────────
  // Opus cannot override confidence levels — they're computed from actual StdDev.
  // We don't modify confidence here; it's enforced by the evaluation types.
  // But if Opus claims "high" confidence when the data shows "split", flag it.
  // Use max stdDev among disputed metrics (not average across ALL metrics)
  // to avoid diluting high-disagreement signals with agreeable metrics.
  const disputedMetrics = allBatches
    .filter(b => b.isUsable)
    .flatMap(b => b.consensus)
    .filter(c => c.needsJudgeReview);
  const avgStdDev = disputedMetrics.length > 0
    ? disputedMetrics.reduce((sum, c) => sum + c.stdDev, 0) / disputedMetrics.length
    : allBatches
        .filter(b => b.isUsable)
        .flatMap(b => b.consensus)
        .reduce((sum, c) => sum + c.stdDev, 0) / (allBatches.filter(b => b.isUsable).flatMap(b => b.consensus).length || 1);

  const computedConfidence: JudgeSummary['overallConfidence'] =
    avgStdDev <= 5 ? 'high' :
    avgStdDev <= 15 ? 'medium' :
    'low';

  if (
    report.summaryOfFindings?.overallConfidence &&
    report.summaryOfFindings.overallConfidence !== computedConfidence
  ) {
    // Only flag if Opus is MORE confident than the data warrants
    const confidenceRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    if (
      (confidenceRank[report.summaryOfFindings.overallConfidence] ?? 0) >
      (confidenceRank[computedConfidence] ?? 0)
    ) {
      corrections.push({
        type: 'confidence_override',
        description: `Opus claimed "${report.summaryOfFindings.overallConfidence}" confidence but average σ=${avgStdDev.toFixed(1)} warrants "${computedConfidence}". Force-corrected.`,
        opusValue: report.summaryOfFindings.overallConfidence,
        computedValue: computedConfidence,
      });

      correctedReport.summaryOfFindings = {
        ...report.summaryOfFindings,
        overallConfidence: computedConfidence,
      };
    }
  }

  return {
    correctedReport,
    safeguardTriggered: corrections.length > 0,
    corrections,
  };
}

// ─── Clean Result (no disputed metrics) ──────────────────────

function buildCleanResult(
  sessionId: string,
  startTime: number
): JudgeOrchestrationResult {
  return {
    finalReport: {
      reportId: `CLUES-JDG-${new Date().toISOString().slice(0, 10)}-${sessionId.slice(0, 8)}-${Date.now()}`,
      summaryOfFindings: {
        locationScores: [],
        overallConfidence: 'high',
        metricsReviewed: 0,
        metricsOverridden: 0,
      },
      categoryAnalysis: [],
      executiveSummary: {
        recommendation: '',
        rationale: 'All LLMs reached consensus (σ ≤ 15 for all metrics). No judge review required.',
        keyFactors: [],
        futureOutlook: '',
      },
      metricOverrides: [],
      confirmedMetrics: [],
      judgedAt: new Date().toISOString(),
    },
    invocationCount: 0,
    safeguardTriggered: false,
    safeguardCorrections: [],
    totalCostUsd: 0,
    totalDurationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Supabase Persistence ────────────────────────────────────

async function persistJudgeReport(
  sessionId: string,
  report: JudgeReport,
  safeguardTriggered: boolean,
  costUsd: number,
  durationMs: number
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const row: Omit<JudgeReportRow, 'id' | 'created_at'> = {
      session_id: sessionId,
      report_json: report,
      metrics_reviewed: report.summaryOfFindings?.metricsReviewed ?? 0,
      metrics_overridden: report.metricOverrides?.length ?? 0,
      safeguard_triggered: safeguardTriggered,
      cost_usd: costUsd,
      duration_ms: durationMs,
    };

    const { error } = await supabase.from('judge_reports').insert(row);
    if (error) {
      console.warn('[JudgeOrchestrator] Failed to persist judge report:', error.message);
    }
  } catch (err) {
    console.warn('[JudgeOrchestrator] Failed to persist judge report:', err);
  }
}
