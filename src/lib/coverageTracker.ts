/**
 * CLUES Intelligence — Coverage Tracker
 *
 * Tracks data coverage across 23 life dimensions (modules).
 * Each dimension has a signal strength, consistency score, and data point count.
 * Used by the Adaptive Engine to determine which modules need more data.
 *
 * This is PURE MATH — no LLM calls. Runs client-side, instant, free.
 *
 * CLUES predicts: best country → top 3 cities → top 3 towns → top 3 neighborhoods
 * Coverage determines how confident those predictions are.
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

/** Coverage state for a single module/dimension */
export interface DimensionCoverage {
  moduleId: string;
  moduleName: string;

  /** Number of data points collected for this dimension */
  dataPoints: number;

  /** How strong the signal is (0-1). More data points + higher severity/importance = stronger */
  signalStrength: number;

  /** Do the signals agree with each other? (0-1). 1 = all signals consistent, 0 = contradictory */
  signalConsistency: number;

  /** How much this dimension matters for THIS user's recommendation (0-1) */
  weight: number;

  /** This dimension's contribution to overall MOE (0-1) */
  moeContribution: number;

  /** Sources: which upstream data contributed */
  sources: CoverageSource[];
}

export type CoverageSourceType =
  | 'paragraphical'
  | 'demographics'
  | 'dnw'
  | 'mh'
  | 'tradeoffs'
  | 'general'
  | 'mini_module';

export interface CoverageSource {
  type: CoverageSourceType;
  dataPoints: number;
  avgStrength: number;
}

/** Overall coverage state across all 23 dimensions */
export interface CoverageState {
  dimensions: DimensionCoverage[];
  overallMOE: number;          // 0-1 (0.02 = 2% target)
  overallCoverage: number;     // 0-1 (percentage of dimensions with adequate data)
  totalDataPoints: number;
  isReportReady: boolean;      // true when overallMOE <= 0.02
  gapAnalysis: CoverageGap[];
}

export interface CoverageGap {
  moduleId: string;
  moduleName: string;
  severity: 'critical' | 'moderate' | 'minor';
  reason: string;
  estimatedQuestionsToResolve: number;
}

// ─── Module-to-category mapping ───────────────────────────────────

/**
 * Maps Main Module question ranges to the 23 category modules.
 * DNW and MH questions have known mappings to specific modules.
 * These mappings are deterministic — no LLM needed.
 */
const DNW_MODULE_MAP: Record<string, string[]> = {
  // DNW question keywords → module IDs they signal
  crime: ['safety_security'],
  violence: ['safety_security'],
  theft: ['safety_security'],
  healthcare: ['health_wellness'],
  medical: ['health_wellness'],
  hospital: ['health_wellness'],
  humidity: ['climate_weather'],
  heat: ['climate_weather'],
  cold: ['climate_weather'],
  weather: ['climate_weather'],
  natural_disaster: ['climate_weather'],
  visa: ['legal_immigration'],
  immigration: ['legal_immigration'],
  corruption: ['legal_immigration', 'social_values_governance'],
  tax: ['financial_banking'],
  expensive: ['financial_banking'],
  cost: ['financial_banking'],
  housing_cost: ['housing_property'],
  internet: ['technology_connectivity'],
  traffic: ['transportation_mobility'],
  pollution: ['climate_weather', 'environment_community_appearance'],
  noise: ['neighborhood_urban_design'],
  isolation: ['entertainment_nightlife', 'arts_culture'],
  discrimination: ['sexual_beliefs_practices_laws', 'social_values_governance'],
  religion_intolerance: ['religion_spirituality'],
  pet_restrictions: ['pets_animals'],
  school_quality: ['education_learning', 'family_children'],
};

const MH_MODULE_MAP: Record<string, string[]> = {
  safety: ['safety_security'],
  healthcare: ['health_wellness'],
  climate: ['climate_weather'],
  sunshine: ['climate_weather'],
  legal_rights: ['legal_immigration'],
  affordable: ['financial_banking'],
  banking: ['financial_banking'],
  housing: ['housing_property'],
  remote_work: ['professional_career', 'technology_connectivity'],
  job_market: ['professional_career'],
  fast_internet: ['technology_connectivity'],
  public_transit: ['transportation_mobility'],
  walkable: ['transportation_mobility', 'neighborhood_urban_design'],
  schools: ['education_learning'],
  democracy: ['social_values_governance'],
  restaurants: ['food_dining'],
  grocery: ['food_dining'],
  shopping: ['shopping_services'],
  parks: ['outdoor_recreation'],
  beaches: ['outdoor_recreation'],
  nightlife: ['entertainment_nightlife'],
  family_friendly: ['family_children'],
  clean: ['environment_community_appearance'],
  worship: ['religion_spirituality'],
  lgbtq: ['sexual_beliefs_practices_laws'],
  museums: ['arts_culture'],
  culture: ['arts_culture', 'cultural_heritage_traditions'],
  pet_friendly: ['pets_animals'],
};

// ─── Core Functions ───────────────────────────────────────────────

/** Initialize empty coverage state for all 23 dimensions */
export function initializeCoverage(): CoverageState {
  const dimensions: DimensionCoverage[] = MODULES.map(mod => ({
    moduleId: mod.id,
    moduleName: mod.name,
    dataPoints: 0,
    signalStrength: 0,
    signalConsistency: 1,  // No contradictions when no data
    weight: 1 / MODULES.length, // Equal weight until we know the user
    moeContribution: 1 / MODULES.length, // Equal contribution initially
    sources: [],
  }));

  return {
    dimensions,
    overallMOE: 1.0, // 100% MOE with no data
    overallCoverage: 0,
    totalDataPoints: 0,
    isReportReady: false,
    gapAnalysis: [],
  };
}

/**
 * Update coverage state from Paragraphical extraction.
 * Gemini's module_relevance scores directly inform dimension weights.
 * Gemini's metrics tell us which dimensions have data.
 */
export function applyCoverageFromParagraphical(
  state: CoverageState,
  extraction: GeminiExtraction
): CoverageState {
  const updated = structuredClone(state);

  // Count metrics per category from Gemini extraction
  const metricsByCategory: Record<string, number> = {};
  for (const metric of extraction.metrics) {
    const cat = metric.category;
    metricsByCategory[cat] = (metricsByCategory[cat] || 0) + 1;
  }

  // Apply module_relevance as weights
  const relevance = extraction.module_relevance || {};
  let totalRelevance = 0;
  for (const dim of updated.dimensions) {
    const rel = relevance[dim.moduleId] ?? 0.3; // Default modest relevance
    dim.weight = rel;
    totalRelevance += rel;
  }
  // Normalize weights to sum to 1
  if (totalRelevance > 0) {
    for (const dim of updated.dimensions) {
      dim.weight = dim.weight / totalRelevance;
    }
  }

  // Apply metric counts as signal strength from Paragraphical
  for (const dim of updated.dimensions) {
    const count = metricsByCategory[dim.moduleId] || 0;
    if (count > 0) {
      const paragraphicalSource: CoverageSource = {
        type: 'paragraphical',
        dataPoints: count,
        avgStrength: Math.min(1, count / 10), // 10+ metrics = full strength
      };
      dim.sources.push(paragraphicalSource);
      dim.dataPoints += count;
      dim.signalStrength = Math.min(1, dim.signalStrength + paragraphicalSource.avgStrength * 0.6);
    }
  }

  // DNW signals boost relevant modules
  if (extraction.dnw_signals?.length) {
    applySignalHits(updated, extraction.dnw_signals, DNW_MODULE_MAP, 'paragraphical', 0.15);
  }

  // MH signals boost relevant modules
  if (extraction.mh_signals?.length) {
    applySignalHits(updated, extraction.mh_signals, MH_MODULE_MAP, 'paragraphical', 0.15);
  }

  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from Demographics answers.
 * Certain demographic facts deterministically boost module relevance.
 */
export function applyCoverageFromDemographics(
  state: CoverageState,
  demographics: DemographicAnswers
): CoverageState {
  const updated = structuredClone(state);

  const boosts: Array<{ moduleId: string; strength: number }> = [];

  // Has children → family_children, education_learning
  if (demographics.has_children || demographics.children_count) {
    boosts.push({ moduleId: 'family_children', strength: 0.4 });
    boosts.push({ moduleId: 'education_learning', strength: 0.3 });
  }

  // Has pets → pets_animals
  if (demographics.has_pets || demographics.pet_type) {
    boosts.push({ moduleId: 'pets_animals', strength: 0.4 });
  }

  // Remote work → technology_connectivity, professional_career
  if (demographics.employment_type === 'remote' || demographics.employment === 'remote') {
    boosts.push({ moduleId: 'technology_connectivity', strength: 0.3 });
    boosts.push({ moduleId: 'professional_career', strength: 0.3 });
  }

  // Retiree → health_wellness up, professional_career down
  if (demographics.employment_type === 'retired' || demographics.employment === 'retired') {
    boosts.push({ moduleId: 'health_wellness', strength: 0.3 });
    boosts.push({ moduleId: 'professional_career', strength: -0.2 });
  }

  // Has partner → housing needs increase
  if (demographics.relationship_status === 'partnered' || demographics.relationship_status === 'married') {
    boosts.push({ moduleId: 'housing_property', strength: 0.15 });
  }

  // Apply boosts
  for (const boost of boosts) {
    const dim = updated.dimensions.find(d => d.moduleId === boost.moduleId);
    if (dim) {
      dim.signalStrength = Math.max(0, Math.min(1, dim.signalStrength + boost.strength * 0.4));
      dim.dataPoints += 1;
      addOrUpdateSource(dim, 'demographics', 1, Math.abs(boost.strength));
    }
  }

  // Demographics provides data points to ALL modules (baseline persona)
  const answerCount = Object.keys(demographics).length;
  for (const dim of updated.dimensions) {
    dim.dataPoints += 1; // Everyone gets 1 point from demographics
    addOrUpdateSource(dim, 'demographics', 1, 0.1);
  }

  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from DNW (Deal 'N' Wanna) answers.
 * High severity scores on specific dealbreakers strongly signal module relevance.
 */
export function applyCoverageFromDNW(
  state: CoverageState,
  dnwAnswers: DNWAnswers
): CoverageState {
  const updated = structuredClone(state);

  for (const dnw of dnwAnswers) {
    // Severity 1-5 maps to signal strength 0.1-0.5
    const strength = dnw.severity * 0.1;
    const questionText = (dnw.value || dnw.questionId || '').toLowerCase();

    // Find matching modules from keyword mapping
    const matchedModules = new Set<string>();
    for (const [keyword, modules] of Object.entries(DNW_MODULE_MAP)) {
      if (questionText.includes(keyword)) {
        for (const modId of modules) matchedModules.add(modId);
      }
    }

    // If no keyword match, use questionId patterns (e.g., "dnw_safety_*")
    if (matchedModules.size === 0) {
      for (const dim of updated.dimensions) {
        if (dnw.questionId?.includes(dim.moduleId)) {
          matchedModules.add(dim.moduleId);
        }
      }
    }

    for (const modId of matchedModules) {
      const dim = updated.dimensions.find(d => d.moduleId === modId);
      if (dim) {
        dim.dataPoints += 1;
        dim.signalStrength = Math.min(1, dim.signalStrength + strength * 0.3);
        // High severity DNW = this module REALLY matters
        if (dnw.severity >= 4) {
          dim.weight = Math.min(1, dim.weight * 1.5);
        }
        addOrUpdateSource(dim, 'dnw', 1, strength);
      }
    }
  }

  // Normalize weights after DNW boosts
  normalizeWeights(updated);
  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from MH (Must Have) answers.
 * High importance scores signal which modules matter most.
 */
export function applyCoverageFromMH(
  state: CoverageState,
  mhAnswers: MHAnswers
): CoverageState {
  const updated = structuredClone(state);

  for (const mh of mhAnswers) {
    const strength = mh.importance * 0.1;
    const questionText = (mh.value || mh.questionId || '').toLowerCase();

    const matchedModules = new Set<string>();
    for (const [keyword, modules] of Object.entries(MH_MODULE_MAP)) {
      if (questionText.includes(keyword)) {
        for (const modId of modules) matchedModules.add(modId);
      }
    }

    if (matchedModules.size === 0) {
      for (const dim of updated.dimensions) {
        if (mh.questionId?.includes(dim.moduleId)) {
          matchedModules.add(dim.moduleId);
        }
      }
    }

    for (const modId of matchedModules) {
      const dim = updated.dimensions.find(d => d.moduleId === modId);
      if (dim) {
        dim.dataPoints += 1;
        dim.signalStrength = Math.min(1, dim.signalStrength + strength * 0.3);
        if (mh.importance >= 4) {
          dim.weight = Math.min(1, dim.weight * 1.3);
        }
        addOrUpdateSource(dim, 'mh', 1, strength);
      }
    }
  }

  normalizeWeights(updated);
  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from Trade-off answers.
 * Slider values directly weight categories against each other.
 */
export function applyCoverageFromTradeoffs(
  state: CoverageState,
  tradeoffs: TradeoffAnswers
): CoverageState {
  const updated = structuredClone(state);

  // Trade-off slider keys map to category pairs
  // e.g., "culture_vs_cost" → slider 80 = 80% culture, 20% cost
  const tradeoffPairs: Record<string, [string, string]> = {
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
    const pair = tradeoffPairs[key];
    if (!pair) continue;

    const sliderValue = typeof value === 'number' ? value : 50;
    const [leftMod, rightMod] = pair;

    // Slider 0-100: 0 = fully left, 100 = fully right
    const leftWeight = (100 - sliderValue) / 100;
    const rightWeight = sliderValue / 100;

    const leftDim = updated.dimensions.find(d => d.moduleId === leftMod);
    const rightDim = updated.dimensions.find(d => d.moduleId === rightMod);

    if (leftDim) {
      leftDim.weight = Math.max(0.05, leftDim.weight * (0.5 + leftWeight));
      leftDim.dataPoints += 1;
      addOrUpdateSource(leftDim, 'tradeoffs', 1, leftWeight);
    }
    if (rightDim) {
      rightDim.weight = Math.max(0.05, rightDim.weight * (0.5 + rightWeight));
      rightDim.dataPoints += 1;
      addOrUpdateSource(rightDim, 'tradeoffs', 1, rightWeight);
    }
  }

  normalizeWeights(updated);
  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from General Questions answers.
 */
export function applyCoverageFromGeneral(
  state: CoverageState,
  general: GeneralAnswers
): CoverageState {
  const updated = structuredClone(state);

  const answerCount = Object.keys(general).length;
  // General questions provide broad coverage signal across all dimensions
  const strengthPerQuestion = Math.min(0.02, 0.5 / Math.max(1, answerCount));

  for (const dim of updated.dimensions) {
    dim.dataPoints += Math.ceil(answerCount / MODULES.length);
    dim.signalStrength = Math.min(1, dim.signalStrength + strengthPerQuestion * answerCount * 0.1);
    addOrUpdateSource(dim, 'general', Math.ceil(answerCount / MODULES.length), 0.2);
  }

  recalculateMOE(updated);
  return updated;
}

/**
 * Update coverage from completed mini module answers.
 * Mini module completion provides strong, focused signal for that dimension.
 */
export function applyCoverageFromMiniModule(
  state: CoverageState,
  moduleId: string,
  answeredCount: number,
  totalQuestions: number
): CoverageState {
  const updated = structuredClone(state);

  const dim = updated.dimensions.find(d => d.moduleId === moduleId);
  if (!dim) return updated;

  const completionRatio = answeredCount / totalQuestions;
  dim.dataPoints += answeredCount;
  dim.signalStrength = Math.min(1, dim.signalStrength + completionRatio * 0.8);
  dim.signalConsistency = Math.max(dim.signalConsistency, completionRatio);
  addOrUpdateSource(dim, 'mini_module', answeredCount, completionRatio);

  recalculateMOE(updated);
  return updated;
}

// ─── Gap Analysis ─────────────────────────────────────────────────

/**
 * Identify which dimensions have the weakest signal relative to their weight.
 * Returns gaps sorted by severity (worst first).
 */
export function analyzeGaps(state: CoverageState): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  for (const dim of state.dimensions) {
    // Skip dimensions with low weight — they don't matter much for this user
    if (dim.weight < 0.02) continue;

    const adequacy = dim.signalStrength / Math.max(0.01, dim.weight);

    if (adequacy < 0.3) {
      gaps.push({
        moduleId: dim.moduleId,
        moduleName: dim.moduleName,
        severity: 'critical',
        reason: `High weight (${(dim.weight * 100).toFixed(0)}%) but very low signal (${(dim.signalStrength * 100).toFixed(0)}%)`,
        estimatedQuestionsToResolve: Math.ceil((0.8 - dim.signalStrength) / 0.05),
      });
    } else if (adequacy < 0.6) {
      gaps.push({
        moduleId: dim.moduleId,
        moduleName: dim.moduleName,
        severity: 'moderate',
        reason: `Weight (${(dim.weight * 100).toFixed(0)}%) exceeds signal confidence (${(dim.signalStrength * 100).toFixed(0)}%)`,
        estimatedQuestionsToResolve: Math.ceil((0.7 - dim.signalStrength) / 0.05),
      });
    } else if (adequacy < 0.8 && dim.weight > 0.05) {
      gaps.push({
        moduleId: dim.moduleId,
        moduleName: dim.moduleName,
        severity: 'minor',
        reason: `Could benefit from more data (signal: ${(dim.signalStrength * 100).toFixed(0)}%)`,
        estimatedQuestionsToResolve: Math.ceil((0.6 - dim.signalStrength) / 0.05),
      });
    }
  }

  // Sort: critical first, then moderate, then minor
  const severityOrder = { critical: 0, moderate: 1, minor: 2 };
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return gaps;
}

// ─── Internal Helpers ─────────────────────────────────────────────

function recalculateMOE(state: CoverageState): void {
  let totalWeightedUncertainty = 0;
  let totalWeight = 0;
  let coveredDimensions = 0;

  for (const dim of state.dimensions) {
    const uncertainty = 1 - dim.signalStrength;
    const consistencyPenalty = 1 - dim.signalConsistency * 0.3;
    dim.moeContribution = dim.weight * uncertainty * consistencyPenalty;
    totalWeightedUncertainty += dim.moeContribution;
    totalWeight += dim.weight;

    if (dim.signalStrength >= 0.5) coveredDimensions++;
  }

  state.overallMOE = totalWeight > 0 ? totalWeightedUncertainty / totalWeight : 1;
  state.overallCoverage = coveredDimensions / MODULES.length;
  state.totalDataPoints = state.dimensions.reduce((sum, d) => sum + d.dataPoints, 0);
  state.isReportReady = state.overallMOE <= 0.02;
  state.gapAnalysis = analyzeGaps(state);
}

function normalizeWeights(state: CoverageState): void {
  const totalWeight = state.dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight > 0 && totalWeight !== 1) {
    for (const dim of state.dimensions) {
      dim.weight = dim.weight / totalWeight;
    }
  }
}

function addOrUpdateSource(
  dim: DimensionCoverage,
  type: CoverageSourceType,
  dataPoints: number,
  strength: number
): void {
  const existing = dim.sources.find(s => s.type === type);
  if (existing) {
    existing.dataPoints += dataPoints;
    existing.avgStrength = (existing.avgStrength + strength) / 2;
  } else {
    dim.sources.push({ type, dataPoints, avgStrength: strength });
  }
}

function applySignalHits(
  state: CoverageState,
  signals: string[],
  moduleMap: Record<string, string[]>,
  sourceType: CoverageSourceType,
  strength: number
): void {
  for (const signal of signals) {
    const lower = signal.toLowerCase();
    for (const [keyword, modIds] of Object.entries(moduleMap)) {
      if (lower.includes(keyword)) {
        for (const modId of modIds) {
          const dim = state.dimensions.find(d => d.moduleId === modId);
          if (dim) {
            dim.dataPoints += 1;
            dim.signalStrength = Math.min(1, dim.signalStrength + strength);
            addOrUpdateSource(dim, sourceType, 1, strength);
          }
        }
      }
    }
  }
}
