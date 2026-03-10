/**
 * CLUES Intelligence — Quality Scorer
 *
 * Evaluates the completeness and depth of collected user data.
 * Produces a QualityReport that tells the user (via Olivia and Dashboard)
 * how close they are to report-ready and what gaps remain.
 *
 * Scoring dimensions:
 * 1. Source Completeness — how many of the 7 sources have data?
 * 2. Depth per Module — does each module have enough signals?
 * 3. Signal Diversity — are signals from multiple sources (not just one)?
 * 4. Dealbreaker Coverage — have high-severity DNWs been addressed?
 * 5. Overall Readiness — weighted aggregate of all dimensions
 *
 * Pure function. No side effects, no LLM, no network.
 */

import type { AggregatedProfile, SignalSource, ModuleProfile } from './answerAggregator';
import type { CoverageState } from './coverageTracker';
import { MODULES } from '../data/modules';

/** Total module count — used for scoring denominators. L6: Safe at module scope since MODULES is a frozen constant. */
const MODULE_COUNT = MODULES.length; // 23

// ─── Types ────────────────────────────────────────────────────────

/** Quality assessment for a single module */
export interface ModuleQuality {
  moduleId: string;
  moduleName: string;

  /** Completeness (0-100): how much of this module's data needs are met */
  completeness: number;

  /** Depth (0-100): how rich/varied the signals are */
  depth: number;

  /** Number of distinct sources contributing to this module */
  sourceCount: number;

  /** Is this module a gap (needs more data)? */
  isGap: boolean;

  /** Human-readable status */
  status: 'excellent' | 'good' | 'adequate' | 'sparse' | 'empty';
}

/** Source-level quality assessment */
export interface SourceQuality {
  source: SignalSource;

  /** Display name */
  label: string;

  /** Has any data? */
  hasData: boolean;

  /** Signal count from this source */
  signalCount: number;

  /** Quality rating (0-100) */
  rating: number;
}

/** The overall quality report */
export interface QualityReport {
  /** Overall readiness (0-100). ≥ 80 = report-ready. */
  overallReadiness: number;

  /** Human-readable readiness label */
  readinessLabel: string;

  /** Per-module quality assessments (23 entries — one per MODULES) */
  modules: ModuleQuality[];

  /** Per-source quality assessments (7 entries) */
  sources: SourceQuality[];

  /** Source completeness (0-100): how many of the 7 sources have data */
  sourceCompleteness: number;

  /** Average module depth (0-100) */
  averageDepth: number;

  /** How many modules have adequate+ data */
  adequateModuleCount: number;

  /** How many modules are gaps */
  gapModuleCount: number;

  /** Actionable next steps (sorted by impact) */
  nextSteps: QualityNextStep[];

  /** Timestamp */
  scoredAt: string;
}

/** A suggested next action to improve data quality */
export interface QualityNextStep {
  /** What to do */
  action: string;

  /** Which module or source this targets */
  target: string;

  /** Estimated readiness gain (0-20) */
  impactEstimate: number;

  /** Priority rank (1 = most impactful) */
  priority: number;
}

// ─── Source Labels ───────────────────────────────────────────────

const SOURCE_LABELS: Record<SignalSource, string> = {
  paragraphical: 'Paragraphical (30 Paragraphs)',
  demographics: 'Demographics',
  dnw: 'Dealbreakers (DNW)',
  mh: 'Must-Haves (MH)',
  tradeoffs: 'Trade-off Sliders',
  general: 'General Questions',
  mini_module: 'Mini Modules',
};

// ─── Main Scorer ─────────────────────────────────────────────────

/**
 * Score the quality of collected data.
 *
 * @param profile - The aggregated profile from answerAggregator
 * @param coverage - The coverage state from coverageTracker (for MOE data)
 */
export function scoreQuality(
  profile: AggregatedProfile,
  coverage: CoverageState
): QualityReport {
  // ─── Source Quality ─────────────────────────────────────────
  const sources = scoreSourceQuality(profile);
  const sourcesWithData = sources.filter(s => s.hasData).length;
  const sourceCompleteness = Math.round((sourcesWithData / 7) * 100);

  // ─── Module Quality ─────────────────────────────────────────
  const modules = profile.modules.map(mod => scoreModuleQuality(mod, coverage));
  const averageDepth = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.depth, 0) / modules.length)
    : 0;
  const adequateModuleCount = modules.filter(m => m.status !== 'sparse' && m.status !== 'empty').length;
  const gapModuleCount = modules.filter(m => m.isGap).length;

  // ─── Overall Readiness ──────────────────────────────────────
  // Weighted formula:
  //   40% source completeness (having data from many sources matters most)
  //   30% average module depth
  //   20% MOE-based coverage (from coverageTracker)
  //   10% completed module bonus
  // M6 fix: Use coverage.isReportReady as a floor — if coverage says ready, at least 80%
  const rawMoeCoverage = Math.max(0, Math.min(100, Math.round((1 - coverage.overallMOE) * 100)));
  const moeCoverage = coverage.isReportReady ? Math.max(80, rawMoeCoverage) : rawMoeCoverage;
  const completedBonus = Math.min(100, Math.round((profile.completedModuleIds.length / MODULE_COUNT) * 100));

  const overallReadiness = Math.max(0, Math.min(100, Math.round(
    sourceCompleteness * 0.4 +
    averageDepth * 0.3 +
    moeCoverage * 0.2 +
    completedBonus * 0.1
  )));

  // ─── Readiness Label ────────────────────────────────────────
  const readinessLabel = getReadinessLabel(overallReadiness);

  // ─── Next Steps ─────────────────────────────────────────────
  const nextSteps = generateNextSteps(sources, modules, profile, coverage);

  return {
    overallReadiness,
    readinessLabel,
    modules,
    sources,
    sourceCompleteness,
    averageDepth,
    adequateModuleCount,
    gapModuleCount,
    nextSteps,
    scoredAt: new Date().toISOString(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function scoreSourceQuality(profile: AggregatedProfile): SourceQuality[] {
  const allSources: SignalSource[] = [
    'paragraphical', 'demographics', 'dnw', 'mh', 'tradeoffs', 'general', 'mini_module',
  ];

  return allSources.map(source => {
    const count = profile.sourceCounts[source] ?? 0;
    const hasData = count > 0;

    // M7 fix: Rating scales per source — expected counts are calibrated upper-mid estimates.
    // Rating is clamped 0-100; reaching 100% means the source is well-represented.
    let rating = 0;
    if (hasData) {
      const expected: Record<SignalSource, number> = {
        paragraphical: 120,  // 100-250 metrics + relevance weights (lowered from 150)
        demographics: 40,    // 34 questions + baseline per module (lowered from 50)
        dnw: 25,             // ~33 questions × modules (lowered from 30)
        mh: 25,              // ~33 questions × modules (lowered from 30)
        tradeoffs: 30,       // 50 sliders × modules (lowered from 40)
        general: 30,         // ~50 questions × modules (lowered from 40)
        mini_module: 100,    // ~100 per completed module (lowered from 200)
      };
      rating = Math.min(100, Math.round((count / expected[source]) * 100));
    }

    return {
      source,
      label: SOURCE_LABELS[source],
      hasData,
      signalCount: count,
      rating,
    };
  });
}

function scoreModuleQuality(mod: ModuleProfile, coverage: CoverageState): ModuleQuality {
  const dim = coverage.dimensions.find(d => d.moduleId === mod.moduleId);
  const signalStrength = dim?.signalStrength ?? 0;
  const weight = dim?.weight ?? 1 / MODULE_COUNT;

  // H5 fix: Completeness based on signal count relative to weight.
  // Cap expectedSignals at 20 to prevent boosted modules from becoming unreachable.
  // Base = weight * 200, but clamped to [5, 20] for reasonable thresholds.
  const expectedSignals = Math.max(5, Math.min(20, Math.round(weight * 200)));
  const completeness = Math.min(100, Math.round((mod.dataPointCount / expectedSignals) * 100));

  // Depth: how many distinct sources contribute
  const activeSources = Object.values(mod.sourceBreakdown).filter(c => c > 0).length;
  const sourceScore = Math.min(100, Math.round((activeSources / 7) * 100)); // 7 sources total

  // Combine with signal strength from coverage tracker
  const depth = Math.round(
    sourceScore * 0.4 +
    Math.min(100, signalStrength * 100) * 0.4 +
    completeness * 0.2
  );

  // Status thresholds
  let status: ModuleQuality['status'];
  if (mod.dataPointCount === 0) status = 'empty';
  else if (depth < 25) status = 'sparse';
  else if (depth < 50) status = 'adequate';
  else if (depth < 75) status = 'good';
  else status = 'excellent';

  // L7 fix: Gap detection threshold derived from module count instead of hardcoded 0.03.
  // Any module with weight above half the equal-distribution weight is considered important.
  const gapWeightThreshold = (1 / MODULE_COUNT) * 0.5; // ~0.022 for 23 modules
  const isGap = weight > gapWeightThreshold && (status === 'empty' || status === 'sparse');

  return {
    moduleId: mod.moduleId,
    moduleName: mod.moduleName,
    completeness,
    depth,
    sourceCount: activeSources,
    isGap,
    status,
  };
}

function getReadinessLabel(readiness: number): string {
  if (readiness >= 90) return 'Report Ready';
  if (readiness >= 80) return 'Nearly Ready';
  if (readiness >= 60) return 'Good Progress';
  if (readiness >= 40) return 'Building';
  if (readiness >= 20) return 'Getting Started';
  return 'Just Beginning';
}

function generateNextSteps(
  sources: SourceQuality[],
  modules: ModuleQuality[],
  profile: AggregatedProfile,
  coverage: CoverageState
): QualityNextStep[] {
  const steps: QualityNextStep[] = [];

  // Missing sources (highest impact)
  const missingSources = sources.filter(s => !s.hasData);
  for (const src of missingSources) {
    let impact = 8;
    if (src.source === 'paragraphical') impact = 15; // Paragraphical has huge impact
    if (src.source === 'demographics') impact = 10;
    if (src.source === 'dnw') impact = 12;

    steps.push({
      action: `Complete the ${src.label} section`,
      target: src.source,
      impactEstimate: impact,
      priority: 0, // Set below
    });
  }

  // Gap modules (medium impact)
  const gaps = modules
    .filter(m => m.isGap)
    .sort((a, b) => a.depth - b.depth); // Worst first

  for (const gap of gaps.slice(0, 5)) { // Top 5 gaps
    const dim = coverage.gapAnalysis.find(g => g.moduleId === gap.moduleId);
    // M8 fix: Estimate questions from depth if gapAnalysis doesn't have this module
    const estQuestions = dim?.estimatedQuestionsToResolve
      ?? Math.max(3, Math.round((100 - gap.depth) / 10)); // Scale from depth
    steps.push({
      action: `Answer ${estQuestions} more questions in ${gap.moduleName}`,
      target: gap.moduleId,
      impactEstimate: 5,
      priority: 0,
    });
  }

  // Low-depth modules that aren't empty (low impact polish)
  const lowDepth = modules
    .filter(m => m.status === 'adequate' && !m.isGap)
    .sort((a, b) => a.depth - b.depth);

  for (const mod of lowDepth.slice(0, 3)) {
    steps.push({
      action: `Deepen your ${mod.moduleName} responses for better accuracy`,
      target: mod.moduleId,
      impactEstimate: 3,
      priority: 0,
    });
  }

  // L8 fix: Show completed modules bonus for any user who hasn't done half the modules
  const completedCount = profile.completedModuleIds.length;
  if (completedCount > 0 && completedCount < Math.ceil(MODULE_COUNT / 2)) {
    steps.push({
      action: `Complete more mini modules to reach precision tier (${completedCount}/${MODULE_COUNT} done)`,
      target: 'mini_modules',
      impactEstimate: 4,
      priority: 0,
    });
  }

  // M9 fix: Sort by impact and assign priority ranks (immutable)
  steps.sort((a, b) => b.impactEstimate - a.impactEstimate);
  return steps.map((s, i) => ({ ...s, priority: i + 1 }));
}
