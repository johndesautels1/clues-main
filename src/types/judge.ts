/**
 * CLUES Intelligence — Opus Judge System Types
 *
 * Types for the Claude Opus 4.6 judge that reviews high-disagreement
 * metrics (σ > 15) from the 5-LLM evaluation pipeline.
 *
 * Opus is the JUDGE — he does NOT do web search.
 * He reviews evidence from the 5 evaluating LLMs and renders verdicts.
 *
 * What Opus CAN do:
 *   - Upscore/downscore any metric's consensus score
 *   - Update legal vs enforcement scores (dual scoring)
 *   - Provide judge explanation per metric
 *   - Weigh which LLM to trust more for specific metrics
 *
 * What Opus CANNOT do:
 *   - Override confidence level (must match actual StdDev)
 *   - Override the computed winner (anti-hallucination safeguard force-corrects)
 */

import type { EvaluatorModel, MetricConsensus } from './evaluation';

// ─── Judge Request Types ──────────────────────────────────────

/** A metric flagged for judge review with all LLM evidence */
export interface JudgeMetric {
  metric_id: string;
  description: string;
  category: string;
  /** Per-location scores from each LLM */
  locations: JudgeLocationEvidence[];
  /** Standard deviation across all LLM scores */
  stdDev: number;
  /** Which LLMs provided scores */
  contributingModels: EvaluatorModel[];
}

/** Evidence for one location on one metric */
export interface JudgeLocationEvidence {
  location: string;
  country: string;
  /** Mean score across LLMs */
  consensusMean: number;
  /** Median score across LLMs */
  consensusMedian: number;
  /** Individual LLM scores with their reasoning */
  llmScores: JudgeLLMScore[];
}

/** One LLM's score + reasoning for judge review */
export interface JudgeLLMScore {
  model: EvaluatorModel;
  score: number;
  confidence: number;
  data_justification: string;
  source: string;
  reasoning: string;
}

/** Request body for the judge-opus API endpoint */
export interface JudgeOpusRequest {
  sessionId: string;
  /** High-disagreement metrics to review (max 30 per prompt) */
  metrics: JudgeMetric[];
  /** Category analyses across all evaluated categories */
  categoryResults: JudgeCategorySummary[];
  /** User context for personalized analysis */
  userContext: {
    globeRegion?: string;
    paragraphCount: number;
    completedModules: string[];
    tier: string;
  };
}

/** Summary of one category's evaluation for the judge */
export interface JudgeCategorySummary {
  categoryId: string;
  categoryName: string;
  /** Number of metrics in this category */
  metricCount: number;
  /** Per-location average scores */
  locationScores: { location: string; country: string; avgScore: number }[];
  /** How many metrics have σ > 15 */
  highDisagreementCount: number;
}

// ─── Judge Response Types ─────────────────────────────────────

/** The full report from Opus judge */
export interface JudgeReport {
  reportId: string;

  /** Summary of findings across all locations */
  summaryOfFindings: JudgeSummary;

  /** Per-category analysis */
  categoryAnalysis: JudgeCategoryAnalysis[];

  /** Executive summary with recommendation */
  executiveSummary: JudgeExecutiveSummary;

  /** Per-metric overrides (score adjustments) */
  metricOverrides: MetricOverride[];

  /** Metrics where the judge agreed with consensus (no override needed) */
  confirmedMetrics: string[];

  /** Timestamp */
  judgedAt: string;
}

/** Top-level findings summary */
export interface JudgeSummary {
  /** Per-location overall scores (post-judge) */
  locationScores: {
    location: string;
    country: string;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  overallConfidence: 'high' | 'medium' | 'low';
  /** Total metrics reviewed */
  metricsReviewed: number;
  /** How many metrics were overridden */
  metricsOverridden: number;
}

/** Judge's analysis of one category */
export interface JudgeCategoryAnalysis {
  categoryId: string;
  categoryName: string;
  /** Per-location analysis (2-3 sentences each) */
  locationAnalyses: {
    location: string;
    analysis: string;
  }[];
  trendNotes: string;
}

/** Executive summary with recommendation */
export interface JudgeExecutiveSummary {
  /** Which location wins (or 'tie') */
  recommendation: string;
  /** 2-3 paragraph rationale */
  rationale: string;
  /** Top 5 key factors */
  keyFactors: string[];
  /** 1-2 paragraph forecast */
  futureOutlook: string;
}

/** A single metric score override by the judge */
export interface MetricOverride {
  metric_id: string;
  category: string;
  location: string;
  /** The consensus score before judge review */
  originalScore: number;
  /** The judge's adjusted score */
  judgeScore: number;
  /** Why the judge adjusted this score */
  judgeExplanation: string;
  /** Which LLM the judge found most trustworthy for this metric */
  trustedModel?: EvaluatorModel;
  /** Legal vs enforcement dual scoring (if applicable) */
  legalScore?: number;
  enforcementScore?: number;
}

// ─── Judge Orchestrator Types ─────────────────────────────────

/** Result from one judge invocation (may need multiple for > 30 metrics) */
export interface JudgeInvocationResult {
  report: JudgeReport | null;
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
}

/** Complete result from the judge orchestrator */
export interface JudgeOrchestrationResult {
  /** Merged report from all judge invocations */
  finalReport: JudgeReport;
  /** Number of separate Opus calls made */
  invocationCount: number;
  /** Whether anti-hallucination safeguard was triggered */
  safeguardTriggered: boolean;
  /** If safeguard triggered, what was corrected */
  safeguardCorrections: SafeguardCorrection[];
  /** Total cost across all invocations */
  totalCostUsd: number;
  /** Total duration */
  totalDurationMs: number;
  timestamp: string;
}

/** Record of an anti-hallucination safeguard correction */
export interface SafeguardCorrection {
  type: 'winner_override' | 'confidence_override';
  description: string;
  /** What Opus said */
  opusValue: string;
  /** What the math says */
  computedValue: string;
}

// ─── Supabase Table Types ─────────────────────────────────────

/** Row shape for the judge_reports Supabase table */
export interface JudgeReportRow {
  id?: string;
  session_id: string;
  report_json: JudgeReport;
  metrics_reviewed: number;
  metrics_overridden: number;
  safeguard_triggered: boolean;
  cost_usd: number;
  duration_ms: number;
  created_at?: string;
}
