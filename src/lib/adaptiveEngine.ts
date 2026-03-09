/**
 * CLUES Intelligence — Adaptive Question Engine (CAT)
 *
 * Computerized Adaptive Testing engine that selects which questions to ask
 * within recommended modules, maximizing information gain per question.
 *
 * Same math as GRE/GMAT — pick the question that most reduces uncertainty,
 * answer it, recalculate, repeat. Stop when MOE ≤ 2%.
 *
 * This is PURE MATH — no LLM calls. Runs client-side, instant, free.
 * The math engine selects questions. Olivia (GPT-5.4 / GPT Realtime 1.5) delivers them.
 *
 * Architecture (see LLM_PROVIDER_ARCHITECTURE.md):
 * - Deterministic math engine: module selection + question selection
 * - GPT-5.4: one refinement call per completed section (catches emergent patterns)
 * - Gemini: Paragraphical text extraction (upstream, already done before this runs)
 * - Opus: judges evaluation results (downstream, after this engine feeds data)
 *
 * CLUES predicts: best country → top 3 cities → top 3 towns → top 3 neighborhoods
 */

import { getModuleById } from '../data/questions';
import type { QuestionItem, QuestionSection } from '../data/questions/types';
import type { CoverageState } from './coverageTracker';
import type { RelevanceResult } from './moduleRelevanceEngine';

// ─── Types ────────────────────────────────────────────────────────

/** Belief state for a single question — what do we predict the user will answer? */
export interface QuestionBelief {
  questionNumber: number;
  moduleId: string;
  sectionTitle: string;

  /** How uncertain we are about this question's answer (0-1). High = should ask. */
  predictionUncertainty: number;

  /** How much this question's answer would impact SMART Scores (0-1). High = impactful. */
  smartScoreImpact: number;

  /** Expected Information Gain = predictionUncertainty × smartScoreImpact × moduleWeight */
  eig: number;

  /** Has this question been answered? */
  answered: boolean;

  /** Can we pre-fill this from upstream data? */
  preFillable: boolean;

  /** Pre-filled value (if available from Paragraphical or Main Module) */
  preFillValue?: string | number | boolean;

  /** Why we'd skip this question (if applicable) */
  skipReason?: string;
}

/** The adaptive engine's current state for one module */
export interface ModuleAdaptiveState {
  moduleId: string;
  moduleName: string;

  /** All questions with their belief states */
  questions: QuestionBelief[];

  /** Current module-level MOE (0-1). Target: ≤ 0.02 */
  moduleMOE: number;

  /** Questions answered so far in this module */
  answeredCount: number;

  /** Questions skipped (pre-filled or low EIG) */
  skippedCount: number;

  /** Is this module complete (MOE target reached)? */
  isComplete: boolean;
}

/** The full adaptive engine state */
export interface AdaptiveState {
  /** Per-module adaptive states (only for recommended modules) */
  modules: ModuleAdaptiveState[];

  /** The currently active module */
  activeModuleId: string | null;

  /** Overall MOE across all dimensions (0-1). Target: ≤ 0.02 */
  overallMOE: number;

  /** Total questions answered across all adaptive modules */
  totalAnswered: number;

  /** Total questions skipped */
  totalSkipped: number;

  /** Estimated remaining questions to reach target */
  estimatedRemaining: number;

  /** Is the overall session complete? */
  isSessionComplete: boolean;
}

/** What the UI needs to render the next question */
export interface NextQuestionResult {
  /** The question to ask (null if session is complete) */
  question: QuestionItem | null;

  /** Module this question belongs to */
  moduleId: string;
  moduleName: string;

  /** Why this question was selected (for Olivia to explain) */
  selectionReason: string;

  /** Current module progress */
  moduleProgress: {
    answered: number;
    estimated: number;
    moduleMOE: number;
  };

  /** Overall session progress */
  sessionProgress: {
    totalAnswered: number;
    estimatedTotal: number;
    overallMOE: number;
    isComplete: boolean;
  };
}

// ─── Question-to-Category Impact Mapping ──────────────────────────

/**
 * Maps question types and section titles to SMART Score impact levels.
 * Ranking questions are highest impact (they explicitly order priorities).
 * Likert-Importance/Concern are high impact (severity/importance scores).
 * Multi-select are moderate (coverage breadth).
 * Yes/No are lower (binary, less nuance).
 * Open-text is lowest (requires LLM to interpret, uncertain value).
 */
function calculateSmartScoreImpact(question: QuestionItem, _sectionTitle: string): number {
  const type = question.type.toLowerCase();

  // Ranking questions explicitly order user priorities — highest impact
  if (type === 'ranking') return 0.9;

  // Dealbreaker questions — critical for country/city filtering
  if (type === 'dealbreaker') return 0.85;

  // Likert scales with severity/importance — high impact
  if (type.includes('importance') || type.includes('concern')) return 0.75;
  if (type.includes('comfort') || type.includes('willingness')) return 0.65;
  if (type.includes('satisfaction') || type.includes('agreement')) return 0.6;
  if (type.includes('frequency')) return 0.55;

  // Selection types
  if (type === 'single-select') return 0.65;
  if (type === 'multi-select') return 0.6;

  // Quantitative
  if (type === 'slider') return 0.7;
  if (type === 'range') return 0.7;

  // Binary
  if (type === 'yes/no') return 0.5;

  // Free text — needs LLM interpretation, uncertain value
  if (type === 'open-text' || type === 'text') return 0.3;

  return 0.5; // Default
}

/**
 * Calculate prediction uncertainty based on upstream data.
 * If we already have strong signals for this question's topic from
 * Paragraphical or Main Module, uncertainty is lower.
 */
function calculatePredictionUncertainty(
  _question: QuestionItem,
  moduleId: string,
  coverage: CoverageState
): number {
  const dim = coverage.dimensions.find(d => d.moduleId === moduleId);
  if (!dim) return 0.8; // No coverage data → high uncertainty

  // Base uncertainty inversely proportional to signal strength
  const baseUncertainty = 1 - dim.signalStrength;

  // If we have data from multiple sources, prediction is more confident
  const sourceCount = dim.sources.length;
  const sourceDiscount = Math.max(0.2, 1 - sourceCount * 0.15);

  // Data points reduce uncertainty (diminishing returns)
  const dataDiscount = Math.max(0.1, 1 - Math.log2(dim.dataPoints + 1) * 0.1);

  return clamp(baseUncertainty * sourceDiscount * dataDiscount, 0.05, 0.95);
}

// ─── Core Engine ──────────────────────────────────────────────────

/**
 * Initialize the adaptive engine for recommended modules.
 * Calculates initial EIG for every question in every recommended module.
 */
export function initializeAdaptiveEngine(
  relevance: RelevanceResult,
  coverage: CoverageState
): AdaptiveState {
  const moduleStates: ModuleAdaptiveState[] = [];

  for (const rec of relevance.recommendedModules) {
    const questionModule = getModuleById(rec.moduleId);
    if (!questionModule) continue;

    const allQuestions = questionModule.sections.flatMap((s: QuestionSection) =>
      s.questions.map((q: QuestionItem) => ({ ...q, sectionTitle: s.title }))
    );

    const beliefs: QuestionBelief[] = allQuestions.map((q: QuestionItem & { sectionTitle: string }) => {
      const uncertainty = calculatePredictionUncertainty(q, rec.moduleId, coverage);
      const impact = calculateSmartScoreImpact(q, q.sectionTitle);
      const moduleWeight = rec.relevance;

      return {
        questionNumber: q.number,
        moduleId: rec.moduleId,
        sectionTitle: q.sectionTitle,
        predictionUncertainty: uncertainty,
        smartScoreImpact: impact,
        eig: uncertainty * impact * moduleWeight,
        answered: false,
        preFillable: false,
        preFillValue: undefined,
        skipReason: undefined,
      };
    });

    // Sort by EIG descending — highest information gain first
    beliefs.sort((a, b) => b.eig - a.eig);

    const dim = coverage.dimensions.find(d => d.moduleId === rec.moduleId);
    const moduleMOE = dim ? dim.moeContribution : 0.1;

    moduleStates.push({
      moduleId: rec.moduleId,
      moduleName: rec.moduleName,
      questions: beliefs,
      moduleMOE,
      answeredCount: 0,
      skippedCount: 0,
      isComplete: false,
    });
  }

  // Sort modules by their MOE contribution (highest first = most urgent)
  moduleStates.sort((a, b) => b.moduleMOE - a.moduleMOE);

  const state: AdaptiveState = {
    modules: moduleStates,
    activeModuleId: moduleStates[0]?.moduleId ?? null,
    overallMOE: coverage.overallMOE,
    totalAnswered: 0,
    totalSkipped: 0,
    estimatedRemaining: estimateRemainingQuestions(moduleStates),
    isSessionComplete: coverage.isReportReady,
  };

  return state;
}

/**
 * Get the next question to ask.
 * Selects the highest-EIG unanswered question from the highest-priority module.
 */
export function selectNextQuestion(state: AdaptiveState): NextQuestionResult | null {
  if (state.isSessionComplete) return null;

  // Find the active module (or the first incomplete one)
  let activeModule = state.modules.find(m => m.moduleId === state.activeModuleId && !m.isComplete);
  if (!activeModule) {
    activeModule = state.modules.find(m => !m.isComplete);
    if (!activeModule) {
      // All modules complete
      return null;
    }
    state.activeModuleId = activeModule.moduleId;
  }

  // Find highest-EIG unanswered, non-skipped question
  const nextBelief = activeModule.questions.find(q => !q.answered && !q.skipReason);
  if (!nextBelief) {
    // No more questions in this module — mark complete, move to next
    activeModule.isComplete = true;
    return selectNextQuestion(state); // Recurse to next module
  }

  // Look up the actual QuestionItem from the question library
  const questionModule = getModuleById(activeModule.moduleId);
  const questionItem = questionModule?.sections
    .flatMap((s: QuestionSection) => s.questions)
    .find((q: QuestionItem) => q.number === nextBelief.questionNumber) ?? null;

  if (!questionItem) return null;

  const selectionReason = generateSelectionReason(nextBelief, activeModule);

  return {
    question: questionItem,
    moduleId: activeModule.moduleId,
    moduleName: activeModule.moduleName,
    selectionReason,
    moduleProgress: {
      answered: activeModule.answeredCount,
      estimated: estimateModuleQuestions(activeModule),
      moduleMOE: activeModule.moduleMOE,
    },
    sessionProgress: {
      totalAnswered: state.totalAnswered,
      estimatedTotal: state.totalAnswered + state.estimatedRemaining,
      overallMOE: state.overallMOE,
      isComplete: state.isSessionComplete,
    },
  };
}

/**
 * Record an answer and update the adaptive state.
 * Recalculates EIG for remaining questions based on new information.
 */
export function recordAnswer(
  state: AdaptiveState,
  moduleId: string,
  questionNumber: number,
  _answerValue: unknown
): AdaptiveState {
  const updated = structuredClone(state);

  const module = updated.modules.find(m => m.moduleId === moduleId);
  if (!module) return updated;

  const belief = module.questions.find(q => q.questionNumber === questionNumber);
  if (!belief || belief.answered) return updated;

  // Mark as answered
  belief.answered = true;
  module.answeredCount++;
  updated.totalAnswered++;

  // Reduce module MOE based on the question's information gain
  const moeReduction = belief.eig * 0.15; // Each answer reduces MOE
  module.moduleMOE = Math.max(0, module.moduleMOE - moeReduction);

  // Check if module is now complete (MOE target reached)
  if (module.moduleMOE <= 0.02) {
    module.isComplete = true;
    // Skip remaining questions in this module
    for (const q of module.questions) {
      if (!q.answered) {
        q.skipReason = 'Module confidence target reached';
        module.skippedCount++;
        updated.totalSkipped++;
      }
    }
  }

  // Recalculate EIG for remaining questions in this module
  // After answering, nearby questions become less valuable (information overlap)
  recalculateModuleEIG(module, belief);

  // Recalculate overall MOE
  updated.overallMOE = calculateOverallMOE(updated);
  updated.estimatedRemaining = estimateRemainingQuestions(updated.modules);
  updated.isSessionComplete = updated.overallMOE <= 0.02;

  // If current module is complete, advance to next
  if (module.isComplete && !updated.isSessionComplete) {
    const nextModule = updated.modules.find(m => !m.isComplete);
    updated.activeModuleId = nextModule?.moduleId ?? null;
  }

  return updated;
}

/**
 * Mark a question as pre-filled from upstream data (skip it).
 */
export function markPreFilled(
  state: AdaptiveState,
  moduleId: string,
  questionNumber: number,
  preFillValue: string | number | boolean
): AdaptiveState {
  const updated = structuredClone(state);

  const module = updated.modules.find(m => m.moduleId === moduleId);
  if (!module) return updated;

  const belief = module.questions.find(q => q.questionNumber === questionNumber);
  if (!belief || belief.answered) return updated;

  belief.preFillable = true;
  belief.preFillValue = preFillValue;
  belief.skipReason = 'Pre-filled from upstream data';
  belief.answered = true;
  module.skippedCount++;
  updated.totalSkipped++;

  // Pre-fills provide partial information gain (70% of full answer)
  const partialReduction = belief.eig * 0.1;
  module.moduleMOE = Math.max(0, module.moduleMOE - partialReduction);

  return updated;
}

/**
 * Force-skip a question (user declines to answer).
 */
export function skipQuestion(
  state: AdaptiveState,
  moduleId: string,
  questionNumber: number
): AdaptiveState {
  const updated = structuredClone(state);

  const module = updated.modules.find(m => m.moduleId === moduleId);
  if (!module) return updated;

  const belief = module.questions.find(q => q.questionNumber === questionNumber);
  if (!belief || belief.answered) return updated;

  belief.skipReason = 'User skipped';
  belief.answered = true;
  module.skippedCount++;
  updated.totalSkipped++;

  // No MOE reduction for skipped questions
  return updated;
}

// ─── Internal Helpers ─────────────────────────────────────────────

/**
 * After answering a question, recalculate EIG for remaining questions.
 * Questions in the same section as the answered one get reduced EIG
 * (information overlap — nearby questions cover similar ground).
 */
function recalculateModuleEIG(module: ModuleAdaptiveState, answeredBelief: QuestionBelief): void {
  for (const q of module.questions) {
    if (q.answered || q.skipReason) continue;

    // Same section = overlap penalty (questions in same topic area)
    if (q.sectionTitle === answeredBelief.sectionTitle) {
      q.predictionUncertainty *= 0.85; // 15% reduction
    }

    // Nearby question numbers = mild overlap
    const distance = Math.abs(q.questionNumber - answeredBelief.questionNumber);
    if (distance <= 3) {
      q.predictionUncertainty *= 0.9; // 10% reduction
    }

    // Recalculate EIG
    q.eig = q.predictionUncertainty * q.smartScoreImpact;
  }

  // Re-sort by updated EIG
  module.questions.sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1; // Unanswered first
    return b.eig - a.eig;
  });
}

function calculateOverallMOE(state: AdaptiveState): number {
  if (state.modules.length === 0) return 0;

  let totalMOE = 0;
  let count = 0;
  for (const module of state.modules) {
    totalMOE += module.moduleMOE;
    count++;
  }

  return count > 0 ? totalMOE / count : 0;
}

function estimateRemainingQuestions(modules: ModuleAdaptiveState[]): number {
  let remaining = 0;
  for (const module of modules) {
    if (module.isComplete) continue;
    const unanswered = module.questions.filter(q => !q.answered && !q.skipReason).length;
    // Estimate: we'll need about 30% of remaining unanswered questions
    // (the rest will be skipped once MOE target is reached)
    remaining += Math.ceil(unanswered * 0.3);
  }
  return remaining;
}

function estimateModuleQuestions(module: ModuleAdaptiveState): number {
  if (module.isComplete) return module.answeredCount;
  const unanswered = module.questions.filter(q => !q.answered && !q.skipReason).length;
  return module.answeredCount + Math.ceil(unanswered * 0.3);
}

/**
 * Generate a human-readable reason for why this question was selected.
 * Olivia uses this to explain to the user.
 */
function generateSelectionReason(belief: QuestionBelief, module: ModuleAdaptiveState): string {
  if (belief.eig > 0.6) {
    return `This is one of the most impactful questions for your ${module.moduleName} analysis — your answer will significantly sharpen the recommendation.`;
  }
  if (belief.eig > 0.4) {
    return `This question helps fill a key gap in your ${module.moduleName} profile.`;
  }
  if (belief.predictionUncertainty > 0.7) {
    return `I don't have enough signal on this topic yet — your answer will help clarify your priorities.`;
  }
  if (belief.smartScoreImpact > 0.7) {
    return `This question directly affects how cities are scored in the ${module.moduleName} category.`;
  }
  return `This helps refine your ${module.moduleName} preferences.`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
