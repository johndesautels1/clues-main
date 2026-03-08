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
  miniModuleCap: 10, // Max 10% from all 23 mini modules
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
      description: 'Tell us your story in 30 paragraphs',
      confidenceGain: CONFIDENCE_GAINS.paragraphical,
      timeEstimate: '30-60 min',
      questionCount: 30,
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
    description: 'Deep scoring across all 23 life modules',
    confidenceGain: CONFIDENCE_GAINS.generalQuestions,
    timeEstimate: '~30 minutes',
    questionCount: 50,
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
  if (moduleCount < 23) {
    const remainingModules = 23 - moduleCount;
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

// ─── GQ Signal → Module Relevance Mapping ───────────────────────
// Maps General Question answers to downstream module relevance boosts.
// Likert-Importance answers are 1-5 scale; Single-select answers are strings.
// Returns a Record<moduleId, relevance 0.0-1.0> for modules signaled by GQ answers.
// This supplements (not replaces) the Paragraphical's module_relevance.

/** GQ keys that map to specific downstream modules */
const GQ_MODULE_SIGNALS: Record<string, { modules: string[]; type: 'likert' | 'select' }> = {
  // gq14: Religion/spirituality importance → religion_spirituality module
  gq14: { modules: ['religion_spirituality', 'cultural_heritage_traditions'], type: 'likert' },
  // gq41: Food/cuisine importance → food_dining module
  gq41: { modules: ['food_dining', 'shopping_services'], type: 'likert' },
  // gq44: Dwelling type preference → housing_property, neighborhood modules
  gq44: { modules: ['housing_property', 'neighborhood_urban_design'], type: 'select' },
  // gq45: Urban/suburban/rural preference → neighborhood, transportation, housing
  gq45: { modules: ['neighborhood_urban_design', 'transportation_mobility', 'housing_property'], type: 'select' },
  // gq46: Firearm/weapon law importance → safety_security, social_values_governance
  gq46: { modules: ['safety_security', 'social_values_governance', 'legal_immigration'], type: 'likert' },
  // gq47: Music/arts/entertainment importance → entertainment_nightlife, arts_culture
  gq47: { modules: ['entertainment_nightlife', 'arts_culture'], type: 'likert' },
  // gq48: Sports/fitness/recreation importance → outdoor_recreation, health_wellness
  gq48: { modules: ['outdoor_recreation', 'health_wellness'], type: 'likert' },
  // gq49: LGBTQ+ acceptance importance → sexual_beliefs_practices_laws, social_values
  gq49: { modules: ['sexual_beliefs_practices_laws', 'social_values_governance', 'safety_security'], type: 'likert' },
  // gq50: Political/social values alignment → social_values_governance
  gq50: { modules: ['social_values_governance', 'legal_immigration'], type: 'likert' },
};

/** Convert a Likert-Importance answer (1-5) to a relevance score (0.0-1.0) */
function likertToRelevance(value: string | number | boolean | string[]): number {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return 0.5; // default to moderate if unparseable
  // 1=not important → 0.2, 2→0.4, 3→0.6, 4→0.8, 5=extremely important → 1.0
  return Math.min(1.0, Math.max(0.2, num * 0.2));
}

/**
 * Derive module relevance signals from General Question answers.
 * Returns a map of moduleId → relevance (0.0-1.0).
 * Modules not signaled by any GQ answer are omitted (not 0).
 */
export function deriveModuleRelevanceFromGQ(
  gqAnswers: Record<string, string | number | boolean | string[]>
): Record<string, number> {
  const relevance: Record<string, number> = {};

  for (const [gqKey, config] of Object.entries(GQ_MODULE_SIGNALS)) {
    const val = gqAnswers[gqKey];
    if (val === undefined) continue;

    let score: number;
    if (config.type === 'likert') {
      score = likertToRelevance(val);
    } else {
      // Single-select: any answer means the module is relevant (0.7 baseline)
      score = 0.7;
    }

    for (const moduleId of config.modules) {
      // Take the higher score if multiple GQs signal the same module
      relevance[moduleId] = Math.max(relevance[moduleId] ?? 0, score);
    }
  }

  return relevance;
}

/**
 * Merge Paragraphical module_relevance with GQ-derived signals.
 * GQ signals boost relevance but never reduce it.
 * Final score = max(paragraphical_score, gq_score) for each module.
 */
export function mergeModuleRelevance(
  paragraphicalRelevance: Record<string, number>,
  gqRelevance: Record<string, number>
): Record<string, number> {
  const merged = { ...paragraphicalRelevance };
  for (const [moduleId, gqScore] of Object.entries(gqRelevance)) {
    merged[moduleId] = Math.max(merged[moduleId] ?? 0, gqScore);
  }
  return merged;
}

/**
 * Get recommended modules sorted by relevance (highest first).
 * Modules below the threshold are excluded (not recommended).
 */
export function getRecommendedModules(
  relevance: Record<string, number>,
  threshold = 0.5
): { moduleId: string; relevance: number }[] {
  return Object.entries(relevance)
    .filter(([, score]) => score >= threshold)
    .map(([moduleId, score]) => ({ moduleId, relevance: score }))
    .sort((a, b) => b.relevance - a.relevance);
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
        llmModels: ['gemini-3.1-pro-preview'],
        useJudge: false,
        tavilySearches: 5,
      };
    case 'exploratory':
      return {
        tier,
        llmCount: 2,
        llmModels: ['gemini-3.1-pro-preview', 'claude-sonnet-4-5'],
        useJudge: false,
        tavilySearches: 10,
      };
    case 'filtered':
      return {
        tier,
        llmCount: 3,
        llmModels: ['gemini-3.1-pro-preview', 'claude-sonnet-4-5', 'gpt-4o'],
        useJudge: false,
        tavilySearches: 15,
      };
    case 'evaluated':
      return {
        tier,
        llmCount: 4,
        llmModels: ['gemini-3.1-pro-preview', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4'],
        useJudge: false,
        tavilySearches: 20,
      };
    case 'validated':
      return {
        tier,
        llmCount: 5,
        llmModels: ['gemini-3.1-pro-preview', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4', 'perplexity-sonar'],
        useJudge: true,
        tavilySearches: 200,
      };
    case 'precision':
      return {
        tier,
        llmCount: 5,
        llmModels: ['gemini-3.1-pro-preview', 'claude-sonnet-4-5', 'gpt-4o', 'grok-4', 'perplexity-sonar'],
        useJudge: true,
        tavilySearches: 200, // +20 per completed module, handled by evaluation endpoint
      };
  }
}
