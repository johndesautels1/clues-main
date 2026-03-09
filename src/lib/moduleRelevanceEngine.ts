/**
 * CLUES Intelligence — Module Relevance Engine
 *
 * Determines which of the 23 mini modules are most relevant for a specific user,
 * based on upstream data from the Paragraphical and/or Main Module.
 *
 * This is PURE MATH — no LLM calls. The structured questionnaire data maps
 * deterministically to module relevance scores. No interpretation needed.
 *
 * LLM involvement:
 * - Gemini handles Paragraphical (free-form text → module_relevance scores)
 * - GPT-5.4 fires ONE refinement call per completed section to catch emergent patterns
 * - This engine handles everything else (structured data → module weights)
 *
 * CLUES predicts: best country → top 3 cities → top 3 towns → top 3 neighborhoods
 */

import { MODULES } from '@/data/modules';
import type {
  GeminiExtraction,
  DemographicAnswers,
  DNWAnswers,
  MHAnswers,
  TradeoffAnswers,
  GeneralAnswers,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────

/** Relevance score for a single module */
export interface ModuleRelevance {
  moduleId: string;
  moduleName: string;
  /** Raw relevance score (0-1). Higher = more important for this user */
  relevance: number;
  /** Confidence in the relevance score (0-1). Higher = more data supports this score */
  confidence: number;
  /** Whether this module should be recommended to the user */
  recommended: boolean;
  /** Why this module matters (for Olivia to explain) */
  reasons: string[];
  /** Priority rank (1 = highest priority module to complete) */
  rank: number;
}

export interface RelevanceResult {
  modules: ModuleRelevance[];
  /** Modules sorted by priority (highest relevance + lowest confidence first) */
  recommendedModules: ModuleRelevance[];
  /** Total estimated questions across recommended modules */
  estimatedTotalQuestions: number;
}

// ─── Demographic Inference Rules ──────────────────────────────────

interface DemographicRule {
  condition: (d: DemographicAnswers) => boolean;
  moduleId: string;
  boost: number;     // Positive = more relevant, negative = less relevant
  reason: string;
}

const DEMOGRAPHIC_RULES: DemographicRule[] = [
  // Children
  {
    condition: d => !!(d.has_children || (typeof d.children_count === 'number' && d.children_count > 0)),
    moduleId: 'family_children',
    boost: 0.5,
    reason: 'You have children — family services, schools, and child safety are critical',
  },
  {
    condition: d => !!(d.has_children || (typeof d.children_count === 'number' && d.children_count > 0)),
    moduleId: 'education_learning',
    boost: 0.35,
    reason: 'Children in the household increase education relevance',
  },
  // No children → reduce family/education weight
  {
    condition: d => !d.has_children && (!d.children_count || d.children_count === 0),
    moduleId: 'family_children',
    boost: -0.3,
    reason: 'No children — family module is less critical',
  },

  // Pets
  {
    condition: d => !!(d.has_pets || d.pet_type),
    moduleId: 'pets_animals',
    boost: 0.5,
    reason: 'You have pets — pet-friendly policies and vet care matter',
  },
  {
    condition: d => !d.has_pets && !d.pet_type,
    moduleId: 'pets_animals',
    boost: -0.3,
    reason: 'No pets — pets module is less critical',
  },

  // Employment: remote
  {
    condition: d => d.employment_type === 'remote' || d.employment === 'remote' || d.work_style === 'remote',
    moduleId: 'technology_connectivity',
    boost: 0.4,
    reason: 'Remote work requires reliable internet and tech infrastructure',
  },
  {
    condition: d => d.employment_type === 'remote' || d.employment === 'remote' || d.work_style === 'remote',
    moduleId: 'professional_career',
    boost: 0.3,
    reason: 'Remote workers need coworking spaces and business-friendly environments',
  },

  // Employment: retired
  {
    condition: d => d.employment_type === 'retired' || d.employment === 'retired',
    moduleId: 'health_wellness',
    boost: 0.35,
    reason: 'Retirees prioritize healthcare access and wellness',
  },
  {
    condition: d => d.employment_type === 'retired' || d.employment === 'retired',
    moduleId: 'professional_career',
    boost: -0.3,
    reason: 'Retired — career opportunities are less relevant',
  },
  {
    condition: d => d.employment_type === 'retired' || d.employment === 'retired',
    moduleId: 'outdoor_recreation',
    boost: 0.2,
    reason: 'Retirees often value outdoor recreation access',
  },

  // Employment: entrepreneur
  {
    condition: d => d.employment_type === 'entrepreneur' || d.employment === 'business_owner',
    moduleId: 'professional_career',
    boost: 0.4,
    reason: 'Entrepreneurs need business-friendly regulations and startup ecosystem',
  },
  {
    condition: d => d.employment_type === 'entrepreneur' || d.employment === 'business_owner',
    moduleId: 'legal_immigration',
    boost: 0.25,
    reason: 'Business owners need clear legal frameworks for foreign enterprise',
  },

  // Age: older → health matters more
  {
    condition: d => typeof d.age === 'number' && d.age >= 55,
    moduleId: 'health_wellness',
    boost: 0.3,
    reason: 'Age increases healthcare importance',
  },
  {
    condition: d => typeof d.age === 'number' && d.age >= 55,
    moduleId: 'transportation_mobility',
    boost: 0.2,
    reason: 'Accessible transportation matters more with age',
  },

  // Age: younger → nightlife, career
  {
    condition: d => typeof d.age === 'number' && d.age < 35,
    moduleId: 'entertainment_nightlife',
    boost: 0.2,
    reason: 'Younger residents often value nightlife and social scenes',
  },
  {
    condition: d => typeof d.age === 'number' && d.age < 35,
    moduleId: 'professional_career',
    boost: 0.2,
    reason: 'Career development is typically a priority for younger professionals',
  },

  // Partner/married → housing
  {
    condition: d => d.relationship_status === 'married' || d.relationship_status === 'partnered',
    moduleId: 'housing_property',
    boost: 0.15,
    reason: 'Couples typically have higher housing requirements',
  },
];

// ─── Core Functions ───────────────────────────────────────────────

/** Initialize relevance scores with equal weights */
export function initializeRelevance(): RelevanceResult {
  const modules: ModuleRelevance[] = MODULES.map((mod, i) => ({
    moduleId: mod.id,
    moduleName: mod.name,
    relevance: 0.5,  // Neutral baseline
    confidence: 0,    // No data yet
    recommended: false,
    reasons: [],
    rank: i + 1,
  }));

  return {
    modules,
    recommendedModules: [],
    estimatedTotalQuestions: 0,
  };
}

/**
 * Apply Gemini Paragraphical extraction results.
 * Gemini's module_relevance is the strongest signal for module importance.
 */
export function applyParagraphicalRelevance(
  result: RelevanceResult,
  extraction: GeminiExtraction
): RelevanceResult {
  const updated = structuredClone(result);
  const relevance = extraction.module_relevance || {};

  for (const mod of updated.modules) {
    const geminiScore = relevance[mod.moduleId];
    if (geminiScore !== undefined) {
      // Gemini's score is 0-1, blend with existing
      mod.relevance = mod.confidence > 0
        ? mod.relevance * 0.3 + geminiScore * 0.7  // Gemini dominates
        : geminiScore;
      mod.confidence = Math.min(1, mod.confidence + 0.4);

      if (geminiScore >= 0.7) {
        mod.reasons.push('Strongly indicated by your written paragraphs');
      } else if (geminiScore >= 0.4) {
        mod.reasons.push('Moderately relevant based on your narrative');
      }
    }

    // Count Gemini metrics per category as additional signal
    const metricCount = extraction.metrics.filter(m => m.category === mod.moduleId).length;
    if (metricCount > 0) {
      mod.confidence = Math.min(1, mod.confidence + Math.min(0.3, metricCount * 0.03));
      if (metricCount >= 8) {
        mod.reasons.push(`${metricCount} specific metrics extracted from your paragraphs`);
      }
    }
  }

  return recalculateRankings(updated);
}

/**
 * Apply Demographics answers.
 * Deterministic rules map demographic facts to module relevance.
 */
export function applyDemographicRelevance(
  result: RelevanceResult,
  demographics: DemographicAnswers
): RelevanceResult {
  const updated = structuredClone(result);

  for (const rule of DEMOGRAPHIC_RULES) {
    try {
      if (rule.condition(demographics)) {
        const mod = updated.modules.find(m => m.moduleId === rule.moduleId);
        if (mod) {
          mod.relevance = clamp(mod.relevance + rule.boost, 0, 1);
          mod.confidence = Math.min(1, mod.confidence + 0.15);
          if (rule.boost > 0) {
            mod.reasons.push(rule.reason);
          }
        }
      }
    } catch {
      // Guard against malformed demographics data
    }
  }

  return recalculateRankings(updated);
}

/**
 * Apply DNW (Dealbreaker) answers.
 * Severity 4-5 = strong signal. Severity 1-2 = mild signal.
 */
export function applyDNWRelevance(
  result: RelevanceResult,
  dnwAnswers: DNWAnswers
): RelevanceResult {
  const updated = structuredClone(result);

  // Group DNW answers by which modules they signal
  for (const dnw of dnwAnswers) {
    const strengthMultiplier = dnw.severity / 5; // 0.2 to 1.0
    const text = (dnw.value || dnw.questionId || '').toLowerCase();

    const moduleHits = findModuleHitsFromText(text);

    for (const moduleId of moduleHits) {
      const mod = updated.modules.find(m => m.moduleId === moduleId);
      if (mod) {
        mod.relevance = clamp(mod.relevance + strengthMultiplier * 0.15, 0, 1);
        mod.confidence = Math.min(1, mod.confidence + 0.08);
        if (dnw.severity >= 4) {
          mod.reasons.push(`Dealbreaker (severity ${dnw.severity}/5) signals this category`);
        }
      }
    }
  }

  return recalculateRankings(updated);
}

/**
 * Apply MH (Must Have) answers.
 * Importance 4-5 = strong positive signal.
 */
export function applyMHRelevance(
  result: RelevanceResult,
  mhAnswers: MHAnswers
): RelevanceResult {
  const updated = structuredClone(result);

  for (const mh of mhAnswers) {
    const strengthMultiplier = mh.importance / 5;
    const text = (mh.value || mh.questionId || '').toLowerCase();

    const moduleHits = findModuleHitsFromText(text);

    for (const moduleId of moduleHits) {
      const mod = updated.modules.find(m => m.moduleId === moduleId);
      if (mod) {
        mod.relevance = clamp(mod.relevance + strengthMultiplier * 0.12, 0, 1);
        mod.confidence = Math.min(1, mod.confidence + 0.08);
        if (mh.importance >= 4) {
          mod.reasons.push(`Must-have (importance ${mh.importance}/5) relates to this area`);
        }
      }
    }
  }

  return recalculateRankings(updated);
}

/**
 * Apply Trade-off slider values.
 * Sliders pit categories against each other — one goes up, the other goes down.
 */
export function applyTradeoffRelevance(
  result: RelevanceResult,
  tradeoffs: TradeoffAnswers
): RelevanceResult {
  const updated = structuredClone(result);

  // These map trade-off keys to module pairs [favored_when_high, favored_when_low]
  const TRADEOFF_PAIRS: Record<string, [string, string]> = {
    tq1: ['safety_security', 'entertainment_nightlife'],
    tq2: ['climate_weather', 'financial_banking'],
    tq3: ['health_wellness', 'professional_career'],
    tq4: ['arts_culture', 'financial_banking'],
    tq5: ['outdoor_recreation', 'shopping_services'],
    tq6: ['family_children', 'entertainment_nightlife'],
    tq7: ['technology_connectivity', 'environment_community_appearance'],
    tq8: ['transportation_mobility', 'housing_property'],
    tq9: ['education_learning', 'financial_banking'],
    tq10: ['social_values_governance', 'professional_career'],
    tq11: ['food_dining', 'financial_banking'],
    tq12: ['religion_spirituality', 'entertainment_nightlife'],
    tq13: ['neighborhood_urban_design', 'housing_property'],
    tq14: ['cultural_heritage_traditions', 'technology_connectivity'],
    tq15: ['sexual_beliefs_practices_laws', 'cultural_heritage_traditions'],
  };

  for (const [key, value] of Object.entries(tradeoffs)) {
    const pair = TRADEOFF_PAIRS[key];
    if (!pair) continue;

    const sliderValue = typeof value === 'number' ? value : 50;
    const [rightMod, leftMod] = pair;

    // Slider 0 = full left, 100 = full right
    // If slider > 50, right module is favored
    const rightBoost = (sliderValue - 50) / 100 * 0.3;
    const leftBoost = -rightBoost;

    const rightModule = updated.modules.find(m => m.moduleId === rightMod);
    const leftModule = updated.modules.find(m => m.moduleId === leftMod);

    if (rightModule) {
      rightModule.relevance = clamp(rightModule.relevance + rightBoost, 0, 1);
      rightModule.confidence = Math.min(1, rightModule.confidence + 0.05);
    }
    if (leftModule) {
      leftModule.relevance = clamp(leftModule.relevance + leftBoost, 0, 1);
      leftModule.confidence = Math.min(1, leftModule.confidence + 0.05);
    }
  }

  return recalculateRankings(updated);
}

/**
 * Apply General Questions answers.
 * Broad lifestyle signals that weakly influence many modules.
 */
export function applyGeneralRelevance(
  result: RelevanceResult,
  general: GeneralAnswers
): RelevanceResult {
  const updated = structuredClone(result);

  // General questions provide modest confidence boost across all modules
  const answerCount = Object.keys(general).length;
  const boostPerModule = Math.min(0.1, answerCount * 0.002);

  for (const mod of updated.modules) {
    mod.confidence = Math.min(1, mod.confidence + boostPerModule);
  }

  return recalculateRankings(updated);
}

// ─── Recommendation Logic ─────────────────────────────────────────

/**
 * Determine which modules to recommend based on:
 * 1. High relevance (the module matters for this user)
 * 2. Low confidence (we don't have enough data yet)
 * 3. Priority = relevance × (1 - confidence)
 *
 * A module with relevance 0.9 and confidence 0.2 is TOP priority.
 * A module with relevance 0.9 and confidence 0.9 is already covered — skip it.
 * A module with relevance 0.1 and confidence 0.1 doesn't matter — skip it.
 */
function recalculateRankings(result: RelevanceResult): RelevanceResult {
  const RELEVANCE_THRESHOLD = 0.35;   // Below this, don't recommend
  const CONFIDENCE_THRESHOLD = 0.75;  // Above this, already covered

  for (const mod of result.modules) {
    const priority = mod.relevance * (1 - mod.confidence);
    mod.recommended = mod.relevance >= RELEVANCE_THRESHOLD && mod.confidence < CONFIDENCE_THRESHOLD;
  }

  // Sort by priority score descending
  const sorted = [...result.modules].sort((a, b) => {
    const aPriority = a.relevance * (1 - a.confidence);
    const bPriority = b.relevance * (1 - b.confidence);
    return bPriority - aPriority;
  });

  sorted.forEach((mod, i) => { mod.rank = i + 1; });

  result.recommendedModules = sorted.filter(m => m.recommended);
  // Estimate ~12 questions per recommended module (CAT will narrow from 100 to ~8-15)
  result.estimatedTotalQuestions = result.recommendedModules.length * 12;

  return result;
}

// ─── Text-to-Module Matching ──────────────────────────────────────

/**
 * Simple keyword matching to find which modules a text fragment relates to.
 * This is for DNW/MH answer text → module mapping.
 * NOT an LLM call — just keyword lookup.
 */
const MODULE_KEYWORDS: Record<string, string[]> = {
  safety_security: ['crime', 'violence', 'theft', 'safety', 'police', 'emergency', 'security', 'dangerous'],
  health_wellness: ['health', 'medical', 'hospital', 'doctor', 'healthcare', 'wellness', 'insurance'],
  climate_weather: ['climate', 'weather', 'humidity', 'heat', 'cold', 'temperature', 'rain', 'snow', 'disaster'],
  legal_immigration: ['visa', 'legal', 'immigration', 'residency', 'permit', 'law', 'corruption', 'bureaucracy'],
  financial_banking: ['tax', 'cost', 'expensive', 'banking', 'financial', 'income', 'salary', 'afford', 'budget'],
  housing_property: ['housing', 'rent', 'property', 'apartment', 'house', 'real estate', 'mortgage'],
  professional_career: ['job', 'career', 'work', 'employment', 'business', 'entrepreneur', 'startup', 'coworking'],
  technology_connectivity: ['internet', 'wifi', 'broadband', 'tech', '5g', 'digital', 'connectivity'],
  transportation_mobility: ['traffic', 'transit', 'metro', 'bus', 'train', 'walkable', 'bike', 'airport', 'commute'],
  education_learning: ['school', 'university', 'education', 'college', 'learning', 'tutor'],
  social_values_governance: ['democracy', 'freedom', 'governance', 'political', 'rights', 'equality', 'tolerance'],
  food_dining: ['food', 'restaurant', 'dining', 'grocery', 'cuisine', 'organic', 'vegetarian', 'vegan'],
  shopping_services: ['shopping', 'mall', 'retail', 'delivery', 'amazon', 'convenience'],
  outdoor_recreation: ['park', 'hiking', 'beach', 'mountain', 'nature', 'outdoor', 'sport', 'fitness', 'gym'],
  entertainment_nightlife: ['nightlife', 'bar', 'club', 'concert', 'festival', 'entertainment', 'cinema', 'theater'],
  family_children: ['family', 'children', 'kids', 'childcare', 'daycare', 'playground', 'pediatric'],
  neighborhood_urban_design: ['neighborhood', 'walkability', 'urban', 'streetscape', 'community', 'noise', 'quiet'],
  environment_community_appearance: ['clean', 'pollution', 'green', 'environment', 'trash', 'aesthetic', 'beautiful'],
  religion_spirituality: ['religion', 'church', 'mosque', 'temple', 'spiritual', 'worship', 'faith', 'prayer'],
  sexual_beliefs_practices_laws: ['lgbtq', 'gay', 'lesbian', 'transgender', 'reproductive', 'abortion', 'sexual'],
  arts_culture: ['museum', 'gallery', 'art', 'culture', 'theater', 'music', 'creative', 'intellectual'],
  cultural_heritage_traditions: ['heritage', 'tradition', 'custom', 'integration', 'belonging', 'cultural identity'],
  pets_animals: ['pet', 'dog', 'cat', 'animal', 'veterinary', 'vet', 'pet-friendly'],
};

function findModuleHitsFromText(text: string): string[] {
  const hits: string[] = [];
  for (const [moduleId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        hits.push(moduleId);
        break; // One hit per module is enough
      }
    }
  }
  return hits;
}

// ─── Utility ──────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
