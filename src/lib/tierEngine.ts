/**
 * Tier Calculator & Confidence Engine
 *
 * Determines the user's completion tier and confidence percentage
 * based on what data they've provided. This drives:
 * - How many LLMs fire
 * - Whether the Opus Judge is invoked
 * - How many Tavily searches run
 * - The report depth and format
 *
 * See CLUES_MAIN_BUILD_REFERENCE.md sections 6, 16, 17, 20.
 */

import type {
  CompletionTier,
  EvaluationContext,
  UserSession,
} from '../types';

// ─── Confidence Gain Values ─────────────────────────────────────
// These match the Confidence Gain Table in the build reference.
const CONFIDENCE_GAINS = {
  paragraphical: 35,
  demographics: 10,
  dnw: 15,
  mh: 10,
  generalQuestions: 20,
  miniModuleEach: 0.5,
  miniModuleCap: 10, // Max 10% from all 20 mini modules
} as const;

// ─── Calculate Tier ─────────────────────────────────────────────
// The tier is determined by the HIGHEST completed stage.
// Order matters: check from most complete to least.
export function calculateTier(context: EvaluationContext): CompletionTier {
  if (context.completedModules && context.completedModules.length > 0) return 'precision';
  if (context.generalQuestions && Object.keys(context.generalQuestions).length > 0) return 'validated';
  if (context.mh && context.mh.length > 0) return 'evaluated';
  if (context.dnw && context.dnw.length > 0) return 'filtered';
  if (context.demographics && Object.keys(context.demographics).length > 0) return 'exploratory';
  return 'discovery';
}

// ─── Calculate Confidence ───────────────────────────────────────
// Additive: each completed stage adds its gain.
export function calculateConfidence(context: EvaluationContext): number {
  let confidence = 0;

  if (context.paragraphical) {
    confidence += CONFIDENCE_GAINS.paragraphical;
  }

  if (context.demographics && Object.keys(context.demographics).length > 0) {
    confidence += CONFIDENCE_GAINS.demographics;
  }

  if (context.dnw && context.dnw.length > 0) {
    confidence += CONFIDENCE_GAINS.dnw;
  }

  if (context.mh && context.mh.length > 0) {
    confidence += CONFIDENCE_GAINS.mh;
  }

  if (context.generalQuestions && Object.keys(context.generalQuestions).length > 0) {
    confidence += CONFIDENCE_GAINS.generalQuestions;
  }

  // Mini modules: 0.5% each, capped at 10%
  const moduleCount = context.completedModules?.length ?? 0;
  const moduleBonus = moduleCount * CONFIDENCE_GAINS.miniModuleEach;
  confidence += Math.min(moduleBonus, CONFIDENCE_GAINS.miniModuleCap);

  return Math.min(confidence, 100);
}

// ─── Build EvaluationContext from UserSession ───────────────────
// Convenience: converts the full session state into the shape
// the evaluation pipeline expects.
export function buildEvaluationContext(session: UserSession): EvaluationContext {
  return {
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
}

// ─── Update Session Tier ────────────────────────────────────────
// Recalculates tier + confidence from current session state.
// Returns the dispatch payload for SET_TIER.
export function recalculateTier(session: UserSession): {
  tier: CompletionTier;
  confidence: number;
} {
  const context = buildEvaluationContext(session);
  return {
    tier: calculateTier(context),
    confidence: calculateConfidence(context),
  };
}

// ─── Next Steps Engine ──────────────────────────────────────────
// Returns actions the user can take to improve confidence,
// ordered by gain descending (highest value first).

export interface NextStep {
  action: string;
  description: string;
  confidenceGain: number;
  timeEstimate: string;
  questionCount?: number;
  completed: boolean;
}

export function calculateNextSteps(session: UserSession): NextStep[] {
  const steps: NextStep[] = [];

  const hasParagraphical = session.paragraphical.status === 'completed';
  const hasDemographics = session.mainModule.demographics &&
    Object.keys(session.mainModule.demographics).length > 0;
  const hasDNW = session.mainModule.dnw && session.mainModule.dnw.length > 0;
  const hasMH = session.mainModule.mh && session.mainModule.mh.length > 0;
  const hasGeneral = session.mainModule.generalAnswers &&
    Object.keys(session.mainModule.generalAnswers).length > 0;

  if (!hasParagraphical) {
    steps.push({
      action: 'Complete Paragraphical',
      description: 'Tell us your story in 24 paragraphs',
      confidenceGain: CONFIDENCE_GAINS.paragraphical,
      timeEstimate: '30-60 min',
      questionCount: 24,
      completed: false,
    });
  }

  // DNW has highest gain among the sub-sections — show it first even if Demographics isn't done
  steps.push({
    action: 'Complete "Do Not Wants"',
    description: 'Eliminates cities that are deal breakers',
    confidenceGain: CONFIDENCE_GAINS.dnw,
    timeEstimate: '~10 minutes',
    questionCount: 33,
    completed: !!hasDNW,
  });

  steps.push({
    action: 'Complete "Must Haves"',
    description: 'Boosts cities that match what you want',
    confidenceGain: CONFIDENCE_GAINS.mh,
    timeEstimate: '~10 minutes',
    questionCount: 33,
    completed: !!hasMH,
  });

  steps.push({
    action: 'Complete General Questions',
    description: 'Deep scoring across all 20 life modules',
    confidenceGain: CONFIDENCE_GAINS.generalQuestions,
    timeEstimate: '~30 minutes',
    questionCount: 200,
    completed: !!hasGeneral,
  });

  steps.push({
    action: 'Complete Demographics',
    description: 'Helps us understand your household needs',
    confidenceGain: CONFIDENCE_GAINS.demographics,
    timeEstimate: '~5 minutes',
    questionCount: 34,
    completed: !!hasDemographics,
  });

  // Mini modules — show as a group if general questions are done
  const moduleCount = session.completedModules.length;
  if (moduleCount < 20) {
    const remainingModules = 20 - moduleCount;
    steps.push({
      action: `Complete Mini Modules (${remainingModules} remaining)`,
      description: 'Each module narrows your recommendation further',
      confidenceGain: remainingModules * CONFIDENCE_GAINS.miniModuleEach,
      timeEstimate: `${remainingModules * 5}-${remainingModules * 10} min`,
      completed: false,
    });
  }

  // Sort: incomplete items first, then by gain descending
  return steps.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.confidenceGain - a.confidenceGain;
  });
}

// ─── LLM Count by Tier ──────────────────────────────────────────
// How many LLMs should fire at each tier.
// Used by the evaluation endpoint to determine which models to call.

export interface TierConfig {
  tier: CompletionTier;
  llmCount: number;
  llmModels: string[];
  useJudge: boolean;
  tavilySearches: number;
}

export function getTierConfig(tier: CompletionTier): TierConfig {
  switch (tier) {
    case 'discovery':
      return {
        tier,
        llmCount: 1,
        llmModels: ['gemini-3.1-pro'],
        useJudge: false,
        tavilySearches: 5,
      };
    case 'exploratory':
      return {
        tier,
        llmCount: 2,
        llmModels: ['gemini-3.1-pro', 'claude-sonnet-4-5'],
        useJudge: false,
        tavilySearches: 10,
      };
    case 'filtered':
      return {
        tier,
        llmCount: 3,
        llmModels: ['gemini-3.1-pro', 'claude-sonnet-4-5', 'gpt-4o'],
        useJudge: false,
        tavilySearches: 15,
      };
    case 'evaluated':
      return {
        tier,
        llmCount: 4,
        llmModels: ['gemini-3.1-pro', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4'],
        useJudge: false,
        tavilySearches: 20,
      };
    case 'validated':
      return {
        tier,
        llmCount: 5,
        llmModels: ['gemini-3.1-pro', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4', 'perplexity-sonar'],
        useJudge: true,
        tavilySearches: 200,
      };
    case 'precision':
      return {
        tier,
        llmCount: 5,
        llmModels: ['gemini-3.1-pro', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4', 'perplexity-sonar'],
        useJudge: true,
        tavilySearches: 200, // +20 per completed module, handled by evaluation endpoint
      };
  }
}
