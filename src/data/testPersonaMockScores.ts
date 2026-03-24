/**
 * CLUES Intelligence — Test Persona Mock Scores
 *
 * Synthetic mock data for the CLUES Intelligence Results UI.
 * Provides SmartScoreOutput, JudgeReport, and JudgeOrchestrationResult
 * for Marcus & Elena's Southern Europe relocation evaluation.
 *
 * 9 locations evaluated:
 *   Cities:         Cascais (PT), Valencia (ES), Dubrovnik (HR)
 *   Towns:          Sintra (PT), Ericeira (PT), Benicassim (ES)
 *   Neighborhoods:  Monte Estoril (PT), El Cabanyal (ES), Carcavelos (PT)
 */

import type {
  SmartScoreOutput,
  CitySmartScore,
  CategorySmartScore,
  MetricSmartScore,
  WinnerDetermination,
  CategoryWeights,
  MetricSource,
  ConfidenceLevel,
} from '../types/smartScore';

import type {
  JudgeReport,
  JudgeOrchestrationResult,
  JudgeSummary,
  JudgeCategoryAnalysis,
  JudgeExecutiveSummary,
  MetricOverride,
} from '../types/judge';

import type { EvaluatorModel } from '../types/evaluation';

// ─── Constants ───────────────────────────────────────────────

const ALL_MODELS: EvaluatorModel[] = [
  'claude-sonnet-4-6',
  'gpt-5.4',
  'gemini-3.1-pro-preview',
  'grok-4-1-fast-reasoning',
  'sonar-reasoning-pro-high',
];

const CATEGORY_IDS = [
  'safety_security',
  'health_wellness',
  'climate_weather',
  'legal_immigration',
  'financial_banking',
  'housing_property',
  'professional_career',
  'technology_connectivity',
  'transportation_mobility',
  'education_learning',
  'social_values_governance',
  'food_dining',
  'shopping_services',
  'outdoor_recreation',
  'entertainment_nightlife',
  'family_children',
  'neighborhood_urban_design',
  'environment_community_appearance',
  'religion_spirituality',
  'sexual_beliefs_practices_laws',
  'arts_culture',
  'cultural_heritage_traditions',
  'pets_animals',
] as const;

const CATEGORY_NAMES: Record<string, string> = {
  safety_security: 'Safety & Security',
  health_wellness: 'Health & Wellness',
  climate_weather: 'Climate & Weather',
  legal_immigration: 'Legal & Immigration',
  financial_banking: 'Financial & Banking',
  housing_property: 'Housing & Property',
  professional_career: 'Professional & Career',
  technology_connectivity: 'Technology & Connectivity',
  transportation_mobility: 'Transportation & Mobility',
  education_learning: 'Education & Learning',
  social_values_governance: 'Social Values & Governance',
  food_dining: 'Food & Dining',
  shopping_services: 'Shopping & Services',
  outdoor_recreation: 'Outdoor Recreation',
  entertainment_nightlife: 'Entertainment & Nightlife',
  family_children: 'Family & Children',
  neighborhood_urban_design: 'Neighborhood & Urban Design',
  environment_community_appearance: 'Environment & Community Appearance',
  religion_spirituality: 'Religion & Spirituality',
  sexual_beliefs_practices_laws: 'Sexual Beliefs, Practices & Laws',
  arts_culture: 'Arts & Culture',
  cultural_heritage_traditions: 'Cultural Heritage & Traditions',
  pets_animals: 'Pets & Animals',
};

const WEIGHT = 1 / 23; // ~0.04347826

// ─── Helper Functions ────────────────────────────────────────

function makeSource(name: string, url: string, excerpt: string): MetricSource {
  return { name, url, excerpt };
}

function makeMetric(
  id: string,
  fieldId: string,
  desc: string,
  cat: string,
  paragraph: number,
  score: number,
  rawScore: number,
  confidence: ConfidenceLevel,
  stdDev: number,
  rawValue?: string,
): MetricSmartScore {
  const overridden = score !== rawScore;
  return {
    metric_id: id,
    fieldId,
    description: desc,
    category: cat,
    source_paragraph: paragraph,
    data_type: 'numeric',
    score,
    rawConsensusScore: rawScore,
    judgeOverridden: overridden,
    judgeScore: overridden ? score : undefined,
    judgeExplanation: overridden ? `Judge adjusted from ${rawScore} to ${score} based on cross-referencing local data sources.` : undefined,
    confidence,
    stdDev,
    contributingModels: ALL_MODELS,
    rawValue,
    sources: [
      makeSource(
        `${CATEGORY_NAMES[cat]} Report 2025`,
        `https://data.europa.eu/${cat.replace(/_/g, '-')}`,
        `Data sourced from European statistical databases for ${desc.toLowerCase()}.`,
      ),
    ],
  };
}

function makeCategory(
  id: string,
  name: string,
  score: number,
  weight: number,
  metrics: MetricSmartScore[],
  confidence: ConfidenceLevel,
  avgStdDev: number,
  judgeAnalysis?: string,
): CategorySmartScore {
  return {
    categoryId: id,
    categoryName: name,
    score,
    weight,
    weightedContribution: score * weight,
    metricCount: metrics.length,
    scoredMetricCount: metrics.length,
    metricScores: metrics,
    confidence,
    avgStdDev,
    judgeAnalysis,
  };
}

function makeCity(
  location: string,
  country: string,
  type: 'city' | 'town' | 'neighborhood',
  overallScore: number,
  rank: number,
  categories: CategorySmartScore[],
  parent?: string,
): CitySmartScore {
  const scoreMap: Record<string, number> = {};
  let totalMetrics = 0;
  for (const cat of categories) {
    scoreMap[cat.categoryId] = cat.score;
    totalMetrics += cat.metricCount;
  }
  return {
    location,
    country,
    location_type: type,
    parent,
    overallScore,
    categoryScores: categories,
    categoryScoreMap: scoreMap,
    totalMetrics,
    scoredMetrics: totalMetrics,
    overallConfidence: 'strong',
    judgeTrend: rank <= 2 ? 'improving' : 'stable',
    rank,
  };
}

// ─── Metric Definitions per Category ─────────────────────────
// Each category has a set of metric templates. Cities get 3-5, towns/neighborhoods get 2-3.

interface MetricTemplate {
  suffix: string;
  fieldId: string;
  desc: string;
  paragraph: number;
}

const METRIC_TEMPLATES: Record<string, MetricTemplate[]> = {
  safety_security: [
    { suffix: '01', fieldId: 'safety_01_violent_crime', desc: 'Violent crime rate per 100k', paragraph: 6 },
    { suffix: '02', fieldId: 'safety_02_petty_crime', desc: 'Petty crime and theft rate', paragraph: 6 },
    { suffix: '03', fieldId: 'safety_03_gun_violence', desc: 'Gun violence incidents per year', paragraph: 6 },
    { suffix: '04', fieldId: 'safety_04_neighborhood_safety', desc: 'Neighborhood safety perception index', paragraph: 6 },
    { suffix: '05', fieldId: 'safety_05_police_response', desc: 'Average police response time (minutes)', paragraph: 6 },
  ],
  health_wellness: [
    { suffix: '01', fieldId: 'health_01_hospital_access', desc: 'Hospital within 30 minutes', paragraph: 7 },
    { suffix: '02', fieldId: 'health_02_pediatric_specialists', desc: 'Pediatric specialist availability', paragraph: 7 },
    { suffix: '03', fieldId: 'health_03_english_doctors', desc: 'English-speaking doctors ratio', paragraph: 7 },
    { suffix: '04', fieldId: 'health_04_insurance_cost', desc: 'Family health insurance monthly cost', paragraph: 7 },
    { suffix: '05', fieldId: 'health_05_pharmacy_access', desc: 'Pharmacy accessibility score', paragraph: 7 },
  ],
  climate_weather: [
    { suffix: '01', fieldId: 'climate_01_avg_summer_temp', desc: 'Average summer temperature (C)', paragraph: 8 },
    { suffix: '02', fieldId: 'climate_02_sunny_days', desc: 'Sunny days per year', paragraph: 8 },
    { suffix: '03', fieldId: 'climate_03_humidity', desc: 'Average summer humidity (%)', paragraph: 8 },
    { suffix: '04', fieldId: 'climate_04_winter_temp', desc: 'Average winter temperature (C)', paragraph: 8 },
    { suffix: '05', fieldId: 'climate_05_outdoor_months', desc: 'Months suitable for outdoor dining', paragraph: 8 },
  ],
  legal_immigration: [
    { suffix: '01', fieldId: 'legal_01_visa_ease', desc: 'Visa/residency ease for EU citizens', paragraph: 9 },
    { suffix: '02', fieldId: 'legal_02_spouse_visa', desc: 'Spouse visa processing time (weeks)', paragraph: 9 },
    { suffix: '03', fieldId: 'legal_03_tax_regime', desc: 'Favorable tax regime for entrepreneurs', paragraph: 9 },
    { suffix: '04', fieldId: 'legal_04_llc_operation', desc: 'US LLC operation legality score', paragraph: 9 },
  ],
  financial_banking: [
    { suffix: '01', fieldId: 'finance_01_intl_banking', desc: 'International banking accessibility', paragraph: 10 },
    { suffix: '02', fieldId: 'finance_02_transfer_fees', desc: 'USD/EUR transfer fee score', paragraph: 10 },
    { suffix: '03', fieldId: 'finance_03_col_index', desc: 'Cost of living index (Numbeo)', paragraph: 10 },
    { suffix: '04', fieldId: 'finance_04_grocery_cost', desc: 'Monthly grocery cost for family of 4', paragraph: 10 },
  ],
  housing_property: [
    { suffix: '01', fieldId: 'housing_01_3bed_rent', desc: '3-bedroom rent in good area (EUR/month)', paragraph: 11 },
    { suffix: '02', fieldId: 'housing_02_furnished_avail', desc: 'Furnished rental availability', paragraph: 11 },
    { suffix: '03', fieldId: 'housing_03_outdoor_space', desc: 'Terrace/garden availability ratio', paragraph: 11 },
    { suffix: '04', fieldId: 'housing_04_sqm_price', desc: 'Price per sqm to buy (EUR)', paragraph: 11 },
    { suffix: '05', fieldId: 'housing_05_near_school', desc: 'Housing near international school availability', paragraph: 11 },
  ],
  professional_career: [
    { suffix: '01', fieldId: 'career_01_startup_ecosystem', desc: 'Startup ecosystem rating', paragraph: 12 },
    { suffix: '02', fieldId: 'career_02_coworking', desc: 'Coworking spaces within 20 min', paragraph: 12 },
    { suffix: '03', fieldId: 'career_03_tech_meetups', desc: 'Monthly tech meetup frequency', paragraph: 12 },
    { suffix: '04', fieldId: 'career_04_timezone_overlap', desc: 'US East Coast timezone overlap (hours)', paragraph: 12 },
  ],
  technology_connectivity: [
    { suffix: '01', fieldId: 'tech_01_fiber_speed', desc: 'Fiber internet speed (Mbps)', paragraph: 13 },
    { suffix: '02', fieldId: 'tech_02_5g_coverage', desc: '5G coverage percentage', paragraph: 13 },
    { suffix: '03', fieldId: 'tech_03_backup_options', desc: 'Mobile hotspot reliability score', paragraph: 13 },
    { suffix: '04', fieldId: 'tech_04_streaming_access', desc: 'US streaming service availability', paragraph: 13 },
  ],
  transportation_mobility: [
    { suffix: '01', fieldId: 'transport_01_walkability', desc: 'Walkability score (Walk Score)', paragraph: 14 },
    { suffix: '02', fieldId: 'transport_02_public_transit', desc: 'Public transit frequency/coverage', paragraph: 14 },
    { suffix: '03', fieldId: 'transport_03_airport_distance', desc: 'International airport distance (min)', paragraph: 14 },
    { suffix: '04', fieldId: 'transport_04_bike_infra', desc: 'Cycling infrastructure score', paragraph: 14 },
  ],
  education_learning: [
    { suffix: '01', fieldId: 'edu_01_intl_school', desc: 'International school IB/British availability', paragraph: 15 },
    { suffix: '02', fieldId: 'edu_02_class_size', desc: 'Average class size at international schools', paragraph: 15 },
    { suffix: '03', fieldId: 'edu_03_tuition_cost', desc: 'Annual tuition cost (EUR)', paragraph: 15 },
    { suffix: '04', fieldId: 'edu_04_bilingual_programs', desc: 'Bilingual education program availability', paragraph: 15 },
    { suffix: '05', fieldId: 'edu_05_extracurricular', desc: 'Extracurricular activities score', paragraph: 15 },
  ],
  social_values_governance: [
    { suffix: '01', fieldId: 'social_01_democracy_index', desc: 'Democracy Index score', paragraph: 16 },
    { suffix: '02', fieldId: 'social_02_press_freedom', desc: 'Press Freedom Index rank', paragraph: 16 },
    { suffix: '03', fieldId: 'social_03_corruption', desc: 'Corruption Perceptions Index', paragraph: 16 },
    { suffix: '04', fieldId: 'social_04_lgbtq_rights', desc: 'LGBTQ+ rights and acceptance score', paragraph: 16 },
  ],
  food_dining: [
    { suffix: '01', fieldId: 'food_01_local_markets', desc: 'Fresh food markets within walking distance', paragraph: 17 },
    { suffix: '02', fieldId: 'food_02_cuisine_diversity', desc: 'Cuisine diversity score', paragraph: 17 },
    { suffix: '03', fieldId: 'food_03_vegetarian_options', desc: 'Vegetarian/plant-based dining availability', paragraph: 17 },
    { suffix: '04', fieldId: 'food_04_coffee_culture', desc: 'Coffee culture and cafe density', paragraph: 17 },
    { suffix: '05', fieldId: 'food_05_wine_region', desc: 'Wine region proximity score', paragraph: 17 },
  ],
  shopping_services: [
    { suffix: '01', fieldId: 'shop_01_supermarket', desc: 'Supermarket within 10 minutes', paragraph: 18 },
    { suffix: '02', fieldId: 'shop_02_delivery', desc: 'Online delivery service coverage (Amazon etc)', paragraph: 18 },
    { suffix: '03', fieldId: 'shop_03_pharmacy', desc: 'Pharmacy accessibility score', paragraph: 18 },
    { suffix: '04', fieldId: 'shop_04_postal_service', desc: 'International postal service reliability', paragraph: 18 },
  ],
  outdoor_recreation: [
    { suffix: '01', fieldId: 'outdoor_01_hiking', desc: 'Hiking trails within 30 minutes', paragraph: 19 },
    { suffix: '02', fieldId: 'outdoor_02_beach', desc: 'Beach quality and proximity', paragraph: 19 },
    { suffix: '03', fieldId: 'outdoor_03_cycling', desc: 'Family cycling path network', paragraph: 19 },
    { suffix: '04', fieldId: 'outdoor_04_parks', desc: 'Parks and playgrounds density', paragraph: 19 },
    { suffix: '05', fieldId: 'outdoor_05_water_sports', desc: 'Water sports availability (surf, sail)', paragraph: 19 },
  ],
  entertainment_nightlife: [
    { suffix: '01', fieldId: 'ent_01_restaurants', desc: 'Late-seating restaurant availability', paragraph: 20 },
    { suffix: '02', fieldId: 'ent_02_cinema', desc: 'English-language cinema availability', paragraph: 20 },
    { suffix: '03', fieldId: 'ent_03_festivals', desc: 'Annual cultural festival count', paragraph: 20 },
    { suffix: '04', fieldId: 'ent_04_live_music', desc: 'Live music venue density', paragraph: 20 },
  ],
  family_children: [
    { suffix: '01', fieldId: 'family_01_playgrounds', desc: 'Playgrounds within 5 min walk', paragraph: 21 },
    { suffix: '02', fieldId: 'family_02_activities', desc: 'After-school activities availability', paragraph: 21 },
    { suffix: '03', fieldId: 'family_03_pediatric_dental', desc: 'Pediatric dentist availability', paragraph: 21 },
    { suffix: '04', fieldId: 'family_04_summer_camps', desc: 'Summer camp and holiday program options', paragraph: 21 },
    { suffix: '05', fieldId: 'family_05_family_restaurants', desc: 'Family-friendly restaurant density', paragraph: 21 },
  ],
  neighborhood_urban_design: [
    { suffix: '01', fieldId: 'nbhd_01_village_feel', desc: 'Village-within-city character score', paragraph: 22 },
    { suffix: '02', fieldId: 'nbhd_02_pedestrian_zones', desc: 'Pedestrian zone coverage', paragraph: 22 },
    { suffix: '03', fieldId: 'nbhd_03_mixed_use', desc: 'Mixed-use zoning (residential + commercial)', paragraph: 22 },
    { suffix: '04', fieldId: 'nbhd_04_green_streets', desc: 'Tree-lined street coverage', paragraph: 22 },
  ],
  environment_community_appearance: [
    { suffix: '01', fieldId: 'env_01_air_quality', desc: 'Air quality index (WHO standards)', paragraph: 23 },
    { suffix: '02', fieldId: 'env_02_noise_pollution', desc: 'Noise pollution level (dB)', paragraph: 23 },
    { suffix: '03', fieldId: 'env_03_green_spaces', desc: 'Green space per capita (sqm)', paragraph: 23 },
    { suffix: '04', fieldId: 'env_04_recycling', desc: 'Recycling infrastructure rating', paragraph: 23 },
  ],
  religion_spirituality: [
    { suffix: '01', fieldId: 'rel_01_secularism', desc: 'Government secularism index', paragraph: 24 },
    { suffix: '02', fieldId: 'rel_02_tolerance', desc: 'Religious tolerance score', paragraph: 24 },
    { suffix: '03', fieldId: 'rel_03_cultural_festivals', desc: 'Religious-heritage cultural festival count', paragraph: 24 },
  ],
  sexual_beliefs_practices_laws: [
    { suffix: '01', fieldId: 'sex_01_lgbtq_legal', desc: 'LGBTQ+ legal protection score', paragraph: 25 },
    { suffix: '02', fieldId: 'sex_02_same_sex_marriage', desc: 'Same-sex marriage/civil union status', paragraph: 25 },
    { suffix: '03', fieldId: 'sex_03_gender_equality', desc: 'Gender equality index', paragraph: 25 },
    { suffix: '04', fieldId: 'sex_04_reproductive_rights', desc: 'Reproductive rights score', paragraph: 25 },
  ],
  arts_culture: [
    { suffix: '01', fieldId: 'arts_01_museums', desc: 'Museums and galleries per 100k residents', paragraph: 26 },
    { suffix: '02', fieldId: 'arts_02_theater', desc: 'Live theater and performance venues', paragraph: 26 },
    { suffix: '03', fieldId: 'arts_03_art_classes', desc: 'Art classes and workshops availability', paragraph: 26 },
    { suffix: '04', fieldId: 'arts_04_architecture', desc: 'Architectural beauty and heritage score', paragraph: 26 },
  ],
  cultural_heritage_traditions: [
    { suffix: '01', fieldId: 'heritage_01_historical_depth', desc: 'Historical depth and heritage sites', paragraph: 27 },
    { suffix: '02', fieldId: 'heritage_02_local_traditions', desc: 'Living local traditions score', paragraph: 27 },
    { suffix: '03', fieldId: 'heritage_03_language_classes', desc: 'Local language class availability', paragraph: 27 },
    { suffix: '04', fieldId: 'heritage_04_seasonal_festivals', desc: 'Seasonal festival calendar richness', paragraph: 27 },
  ],
  pets_animals: [
    { suffix: '01', fieldId: 'pets_01_dog_parks', desc: 'Dog parks and off-leash areas', paragraph: 28 },
    { suffix: '02', fieldId: 'pets_02_pet_housing', desc: 'Pet-friendly housing availability', paragraph: 28 },
    { suffix: '03', fieldId: 'pets_03_veterinarian', desc: 'Veterinary care quality and access', paragraph: 28 },
    { suffix: '04', fieldId: 'pets_04_dog_friendly_venues', desc: 'Dog-friendly cafes and restaurants', paragraph: 28 },
  ],
};

// ─── Score Tables ────────────────────────────────────────────
// Base scores per location per category. These drive all the metric generation.
// Format: [Cascais, Valencia, Dubrovnik, Sintra, Ericeira, Benicassim, MonteEstoril, ElCabanyal, Carcavelos]

const BASE_SCORES: Record<string, number[]> = {
  safety_security:                    [87, 78, 76, 85, 83, 74, 89, 77, 86],
  health_wellness:                    [84, 81, 68, 82, 74, 70, 85, 80, 83],
  climate_weather:                    [88, 85, 72, 86, 87, 82, 88, 84, 89],
  legal_immigration:                  [82, 79, 62, 82, 82, 79, 82, 79, 82],
  financial_banking:                  [78, 76, 65, 76, 72, 71, 79, 75, 77],
  housing_property:                   [75, 72, 60, 78, 70, 76, 80, 73, 74],
  professional_career:                [76, 82, 58, 68, 65, 60, 74, 80, 72],
  technology_connectivity:            [83, 83, 70, 80, 78, 75, 84, 82, 82],
  transportation_mobility:            [79, 85, 65, 72, 68, 62, 78, 84, 76],
  education_learning:                 [86, 80, 64, 84, 72, 68, 87, 78, 84],
  social_values_governance:           [82, 80, 72, 82, 82, 80, 82, 80, 82],
  food_dining:                        [83, 88, 74, 80, 78, 72, 82, 87, 81],
  shopping_services:                  [78, 82, 66, 72, 65, 70, 79, 81, 76],
  outdoor_recreation:                 [88, 78, 82, 90, 92, 76, 86, 74, 87],
  entertainment_nightlife:            [72, 84, 70, 64, 62, 66, 70, 82, 68],
  family_children:                    [85, 79, 68, 83, 76, 72, 86, 78, 84],
  neighborhood_urban_design:          [86, 76, 80, 88, 82, 70, 88, 74, 85],
  environment_community_appearance:   [87, 74, 82, 90, 88, 72, 89, 73, 88],
  religion_spirituality:              [80, 78, 74, 80, 80, 78, 80, 78, 80],
  sexual_beliefs_practices_laws:      [84, 82, 62, 84, 84, 82, 84, 82, 84],
  arts_culture:                       [82, 80, 78, 80, 70, 65, 83, 79, 76],
  cultural_heritage_traditions:       [85, 80, 84, 88, 82, 74, 84, 78, 83],
  pets_animals:                       [82, 74, 66, 84, 86, 70, 83, 72, 84],
};

const LOCATION_NAMES = [
  'Cascais', 'Valencia', 'Dubrovnik',
  'Sintra', 'Ericeira', 'Benicassim',
  'Monte Estoril', 'El Cabanyal', 'Carcavelos',
] as const;

const LOCATION_COUNTRIES = [
  'Portugal', 'Spain', 'Croatia',
  'Portugal', 'Portugal', 'Spain',
  'Portugal', 'Spain', 'Portugal',
] as const;

const LOCATION_TYPES: ('city' | 'town' | 'neighborhood')[] = [
  'city', 'city', 'city',
  'town', 'town', 'town',
  'neighborhood', 'neighborhood', 'neighborhood',
];

const LOCATION_PARENTS: (string | undefined)[] = [
  undefined, undefined, undefined,
  'Cascais', 'Cascais', 'Valencia',
  'Cascais', 'Valencia', 'Cascais',
];

const OVERALL_SCORES = [82, 78, 71, 80, 76, 73, 84, 77, 79];
const RANKS =          [3,   5,  9,  4,  7,  8,  1,  6,  2];

// ─── Confidence & StdDev Generation ─────────────────────────

function confFromScore(score: number): ConfidenceLevel {
  if (score >= 85) return 'unanimous';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  return 'split';
}

function stdDevFromConf(conf: ConfidenceLevel): number {
  switch (conf) {
    case 'unanimous': return 3.2 + Math.random() * 1.5;
    case 'strong': return 7.0 + Math.random() * 4.0;
    case 'moderate': return 13.0 + Math.random() * 6.0;
    case 'split': return 21.0 + Math.random() * 5.0;
  }
}

// ─── Generate Metrics for a Category at a Location ──────────

function generateMetrics(
  catId: string,
  locationIdx: number,
  maxMetrics: number,
): MetricSmartScore[] {
  const templates = METRIC_TEMPLATES[catId];
  if (!templates) return [];
  const count = Math.min(templates.length, maxMetrics);
  const baseScore = BASE_SCORES[catId]?.[locationIdx] ?? 70;
  const location = LOCATION_NAMES[locationIdx];
  const metrics: MetricSmartScore[] = [];

  for (let i = 0; i < count; i++) {
    const t = templates[i];
    // Vary individual metric scores around the category base score
    const variance = (i % 3 === 0 ? 4 : i % 3 === 1 ? -3 : 2) + (locationIdx % 2 === 0 ? 1 : -1);
    const rawScore = Math.max(10, Math.min(98, baseScore + variance));
    // Some metrics get judge overrides (about 1 in 12)
    const isOverridden = (locationIdx * 7 + i * 3) % 12 === 0;
    const finalScore = isOverridden ? Math.max(10, Math.min(98, rawScore + (rawScore > 75 ? -5 : 6))) : rawScore;
    const conf = confFromScore(finalScore);
    const sd = stdDevFromConf(conf);

    metrics.push(
      makeMetric(
        `${catId}_${t.suffix}_${location.replace(/\s/g, '_').toLowerCase()}`,
        t.fieldId,
        t.desc,
        catId,
        t.paragraph,
        Math.round(finalScore * 10) / 10,
        Math.round(rawScore * 10) / 10,
        conf,
        Math.round(sd * 100) / 100,
        i === 0 ? `${baseScore} (index)` : undefined,
      ),
    );
  }

  return metrics;
}

// ─── Build Category Scores for One Location ─────────────────

function buildCategoriesForLocation(locationIdx: number, isCityType: boolean): CategorySmartScore[] {
  const maxMetrics = isCityType ? 5 : 3; // cities get more metrics
  return CATEGORY_IDS.map((catId) => {
    const metrics = generateMetrics(catId, locationIdx, maxMetrics);
    const baseScore = BASE_SCORES[catId]?.[locationIdx] ?? 70;
    const conf = confFromScore(baseScore);
    const avgStd = metrics.length > 0
      ? Math.round((metrics.reduce((s, m) => s + m.stdDev, 0) / metrics.length) * 100) / 100
      : 8.0;

    return makeCategory(
      catId,
      CATEGORY_NAMES[catId],
      baseScore,
      WEIGHT,
      metrics,
      conf,
      avgStd,
    );
  });
}

// ─── Build All 9 CitySmartScore Objects ──────────────────────

function buildAllCityScores(): CitySmartScore[] {
  return LOCATION_NAMES.map((_, idx) => {
    const isCity = LOCATION_TYPES[idx] === 'city';
    const categories = buildCategoriesForLocation(idx, isCity);

    return makeCity(
      LOCATION_NAMES[idx],
      LOCATION_COUNTRIES[idx],
      LOCATION_TYPES[idx],
      OVERALL_SCORES[idx],
      RANKS[idx],
      categories,
      LOCATION_PARENTS[idx],
    );
  });
}

// ─── Build Winner Determination ──────────────────────────────

function buildWinner(cityScores: CitySmartScore[]): WinnerDetermination {
  const sorted = [...cityScores].sort((a, b) => a.rank - b.rank);
  const winner = sorted[0]; // Monte Estoril (rank 1, score 84)
  const runnerUp = sorted[1]; // Carcavelos (rank 2, score 79)

  return {
    winner,
    rankings: sorted,
    isTie: false,
    scoreDifference: winner.overallScore - runnerUp.overallScore,
    winnerAdvantageCategories: [
      'safety_security',
      'climate_weather',
      'housing_property',
      'outdoor_recreation',
      'neighborhood_urban_design',
      'environment_community_appearance',
      'arts_culture',
      'cultural_heritage_traditions',
      'pets_animals',
    ],
    runnerUpAdvantageCategories: [
      'entertainment_nightlife',
      'food_dining',
      'shopping_services',
      'transportation_mobility',
      'professional_career',
    ],
    tiedCategories: ['technology_connectivity'],
  };
}

// ─── Build Category Weights ──────────────────────────────────

function buildCategoryWeights(): CategoryWeights {
  const weights: Record<string, number> = {};
  for (const catId of CATEGORY_IDS) {
    weights[catId] = WEIGHT;
  }
  return {
    weights,
    derivation: 'persona',
    personaPreset: 'balanced',
  };
}

// ─── Build SmartScoreOutput ──────────────────────────────────

function buildSmartScoreOutput(): SmartScoreOutput {
  const cityScores = buildAllCityScores();
  return {
    cityScores,
    winner: buildWinner(cityScores),
    categoryWeights: buildCategoryWeights(),
    computedAt: new Date().toISOString(),
  };
}

// ─── Build JudgeReport ───────────────────────────────────────

function buildJudgeReport(): JudgeReport {
  const summaryOfFindings: JudgeSummary = {
    locationScores: [
      { location: 'Cascais', country: 'Portugal', score: 82, trend: 'improving' },
      { location: 'Valencia', country: 'Spain', score: 78, trend: 'stable' },
      { location: 'Dubrovnik', country: 'Croatia', score: 71, trend: 'stable' },
    ],
    overallConfidence: 'high',
    metricsReviewed: 47,
    metricsOverridden: 9,
  };

  const categoryAnalysis: JudgeCategoryAnalysis[] = [
    {
      categoryId: 'safety_security',
      categoryName: 'Safety & Security',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'Cascais demonstrates exceptionally low crime rates, ranking among the safest municipalities in Portugal. The neighborhood-level data confirms consistent safety across Monte Estoril and Carcavelos, with active community policing programs and well-lit pedestrian areas.' },
        { location: 'Valencia', analysis: 'Valencia shows moderate safety metrics with some variation between neighborhoods. El Cabanyal has undergone significant revitalization, improving safety perceptions, though petty theft in tourist areas remains slightly elevated compared to Portuguese counterparts.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik benefits from Croatias generally low violent crime rate, but the heavy tourist presence creates seasonal spikes in petty crime. The Old Town area shows higher incident rates during summer months.' },
      ],
      trendNotes: 'Portugal continues to rank as one of the safest countries globally. Spain maintains stable safety metrics. Croatia shows improvement but seasonal variation remains a factor.',
    },
    {
      categoryId: 'climate_weather',
      categoryName: 'Climate & Weather',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'Cascais offers a near-ideal Mediterranean climate with Atlantic moderation preventing extreme heat. Average summer temperatures of 26-28C with low humidity make it one of the most comfortable coastal locations in Southern Europe for families.' },
        { location: 'Valencia', analysis: 'Valencia provides classic Mediterranean warmth with 300+ sunny days per year. Summer temperatures can peak at 35C with moderate humidity, which may exceed the personas stated 34C comfort threshold. The Benicassim coastal area offers slight cooling.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik has a Mediterranean climate but with greater temperature extremes. Summers can exceed 35C with higher humidity from the Adriatic. Winters are milder than inland Croatia but cooler than the Iberian alternatives.' },
      ],
      trendNotes: 'Climate projections suggest Iberian coastal cities will see 1-2C warming by 2030, with Portugal Atlantic coast remaining more moderate than Mediterranean Spain.',
    },
    {
      categoryId: 'education_learning',
      categoryName: 'Education & Learning',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'The Cascais-Estoril corridor has multiple established international schools including TASIS Portugal and St Julians, offering IB and British curricula. Class sizes average 16-18 students, and the bilingual Portuguese-English programs are particularly strong.' },
        { location: 'Valencia', analysis: 'Valencia has a growing international school sector with Caxton College and The British School of Valencia among top options. The Beckham Law attracts international families, creating demand that has improved school quality and variety over the past five years.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik has limited international school options, with only one English-medium school serving the region. Families typically need to consider Zagreb or split for broader educational choices, which presents a significant challenge for this personas needs.' },
      ],
      trendNotes: 'International school enrollment across Southern Europe is up 23% since 2022, driven by remote worker migration. Portugal leads in new school openings.',
    },
    {
      categoryId: 'housing_property',
      categoryName: 'Housing & Property',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'The Cascais rental market is competitive with strong demand from international families. A 3-bedroom apartment in Monte Estoril or Carcavelos ranges EUR 2,200-3,800/month. Furnished options are available but command a 15-20% premium. Properties with terraces near international schools are the most sought-after.' },
        { location: 'Valencia', analysis: 'Valencia offers better value in housing, with 3-bedroom apartments in desirable areas like Ruzafa or near the beach at EUR 1,500-2,800/month. El Cabanyal provides a unique opportunity with renovated historic properties at competitive rates following the neighborhoods revitalization.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik housing is constrained and tourist-oriented, making family rentals challenging. Long-term 3-bedroom apartments range EUR 1,200-2,200/month but selection is limited, and many landlords prefer short-term tourist lets during peak season.' },
      ],
      trendNotes: 'Portuguese coastal rents have increased 18% year-over-year. Spanish markets remain more stable with 8% growth. Croatian long-term rental supply is improving as regulations tighten on short-term lets.',
    },
    {
      categoryId: 'food_dining',
      categoryName: 'Food & Dining',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'Cascais provides excellent access to fresh seafood markets, the historic Mercado da Vila, and a growing diverse dining scene. The farm-to-table culture is authentic, with daily fish markets and weekend farmers markets in Carcavelos. Wine region proximity (Colares, Carcavelos DOC) is a standout advantage.' },
        { location: 'Valencia', analysis: 'Valencia is a culinary powerhouse, with the Mercado Central among Europes finest food markets. The paella tradition, Mediterranean vegetable culture, and Spains late-dining lifestyle align perfectly with the persona. El Cabanyals revitalized restaurant scene adds neighborhood-level gastronomy that is genuinely world-class.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik has a solid but less diverse food scene focused on Dalmatian cuisine. Fresh seafood and local produce are excellent, but vegetarian options and cuisine diversity lag behind the Iberian cities. The Gruz market provides good local produce access.' },
      ],
      trendNotes: 'Both Portugal and Spain have seen significant growth in plant-based dining options, with Lisbon and Valencia leading the Southern European vegan restaurant boom.',
    },
    {
      categoryId: 'outdoor_recreation',
      categoryName: 'Outdoor Recreation',
      locationAnalyses: [
        { location: 'Cascais', analysis: 'Cascais excels in outdoor recreation with the Sintra-Cascais Natural Park providing world-class hiking, Guincho beach for surfing and kiteboarding, and an extensive coastal cycling path. The Estoril promenade offers scenic family walks, and golf courses including Oitavos Dunes are nearby.' },
        { location: 'Valencia', analysis: 'Valencia provides the Turia Gardens park (9km through the city), Albufera Natural Park, and excellent urban beaches. The flat terrain is ideal for cycling, and the city has invested heavily in bike infrastructure. Water sports are accessible but less dramatic than Portugals Atlantic coast.' },
        { location: 'Dubrovnik', analysis: 'Dubrovnik offers stunning coastal hiking along the Adriatic, kayaking around Lokrum Island, and proximity to national parks including Mljet. The rugged terrain provides excellent adventure recreation, though family-friendly cycling infrastructure lags behind the other cities.' },
      ],
      trendNotes: 'Portugal continues to be ranked #1 in Europe for surf quality. All three countries are investing in cycling infrastructure, with Valencia leading in urban bike lanes.',
    },
  ];

  const executiveSummary: JudgeExecutiveSummary = {
    recommendation: 'Cascais, Portugal',
    rationale: `Based on comprehensive analysis across all 23 evaluation categories, Cascais, Portugal emerges as the strongest recommendation for Marcus and Elena's family relocation. The Cascais-Estoril corridor delivers an exceptional combination of safety, climate, education, and lifestyle quality that closely aligns with the family's stated priorities and non-negotiables.

Cascais's primary advantages center on the factors this family values most: neighborhood-level safety that allows children to walk to school independently, established international schools with IB curricula within walking distance, a moderate Atlantic-tempered climate that avoids the extreme heat Marcus specifically flagged as a dealbreaker, and a thriving yet family-oriented community that blends Portuguese authenticity with international accessibility. Marcus's Italian EU citizenship eliminates visa complexity, and Portugal's NHR successor regime offers favorable tax treatment for his SaaS income.

The runner-up, Valencia, excels in food culture, professional networking, entertainment, and transportation — categories where it outperforms Cascais — but falls short on the family's highest-priority dimensions: safety perception at the neighborhood level, climate comfort (Valencia summers exceed their 34C threshold), and the village-within-a-city character they described in their ideal day narrative.`,
    keyFactors: [
      'Cascais achieves the highest safety scores at neighborhood level, with Monte Estoril and Carcavelos ranking among Portugal\'s safest residential areas — directly addressing the family\'s #1 stated priority.',
      'The Cascais-Estoril corridor has 4 established international schools (IB and British) within a 15-minute radius, compared to Valencia\'s 3 and Dubrovnik\'s 1, with class sizes averaging 16 students.',
      'Atlantic climate moderation keeps Cascais summer peaks at 28-30C versus Valencia\'s 34-36C, staying within the family\'s explicitly stated comfort range of 28-34C.',
      'Portugal\'s updated tax regime for new residents offers a 20% flat rate on qualifying foreign income for 10 years, competitive with Spain\'s Beckham Law, while Marcus\'s EU citizenship streamlines residency for the entire family.',
      'The Sintra-Cascais Natural Park, Guincho beach surfing, and the 30km coastal cycling path deliver the outdoor lifestyle described in the family\'s ideal day, with Biscuit-friendly beaches and off-leash areas throughout the municipality.',
    ],
    futureOutlook: `Cascais is well-positioned for the family's 5-year vision. The municipality has committed EUR 45M to infrastructure improvements through 2028, including expanded cycling paths, a new pediatric wing at the Cascais Hospital, and fiber optic extension to 98% coverage. The growing tech-entrepreneur community around Web Summit's permanent Lisbon presence creates the networking ecosystem Marcus seeks, with Cascais-based coworking spaces like Outsite and the Cascais CoWork Hub hosting regular tech meetups.

The primary risk factor is housing cost inflation, with Cascais rents increasing 15-20% annually. However, the family's EUR 6,000-9,000 monthly budget positions them comfortably above median rents, and their plan to rent for 12-18 months before buying provides flexibility to time a purchase strategically.`,
  };

  const metricOverrides: MetricOverride[] = [
    {
      metric_id: 'safety_02_petty_crime_cascais',
      category: 'safety_security',
      location: 'Cascais',
      originalScore: 84,
      judgeScore: 88,
      judgeExplanation: 'Municipal crime statistics from 2025 show a 12% decline in petty theft, which the consensus models did not fully account for. Upgrading to reflect the latest PSP (Portuguese Public Security Police) data.',
      trustedModel: 'sonar-reasoning-pro-high',
    },
    {
      metric_id: 'climate_03_humidity_valencia',
      category: 'climate_weather',
      location: 'Valencia',
      originalScore: 82,
      judgeScore: 76,
      judgeExplanation: 'Consensus overstated Valencia\'s humidity comfort. AEMET records show August humidity averages 68%, which is above the persona\'s stated comfort threshold. Adjusting downward.',
      trustedModel: 'gemini-3.1-pro-preview',
    },
    {
      metric_id: 'edu_01_intl_school_dubrovnik',
      category: 'education_learning',
      location: 'Dubrovnik',
      originalScore: 68,
      judgeScore: 58,
      judgeExplanation: 'Only one international school operates in Dubrovnik proper (QSI Dubrovnik). The consensus score was inflated by including Zagreb-based schools. For a family requiring same-campus enrollment for two children, this represents a significant limitation.',
      trustedModel: 'claude-sonnet-4-6',
    },
    {
      metric_id: 'housing_01_3bed_rent_cascais',
      category: 'housing_property',
      location: 'Cascais',
      originalScore: 72,
      judgeScore: 68,
      judgeExplanation: 'Idealista and Imovirtual listings from Q1 2026 show median 3-bed rents in Cascais at EUR 2,850, up 18% from 2025. The consensus did not fully reflect this recent price acceleration.',
      trustedModel: 'sonar-reasoning-pro-high',
    },
    {
      metric_id: 'transport_01_walkability_valencia',
      category: 'transportation_mobility',
      location: 'Valencia',
      originalScore: 82,
      judgeScore: 87,
      judgeExplanation: 'Valencia\'s Turia Gardens linear park and comprehensive EMT bus network make it one of the most walkable cities in Spain. The consensus underrated the impact of the 2025 superblock expansion in Ciutat Vella.',
      trustedModel: 'gpt-5.4',
    },
    {
      metric_id: 'food_02_cuisine_diversity_valencia',
      category: 'food_dining',
      location: 'Valencia',
      originalScore: 85,
      judgeScore: 91,
      judgeExplanation: 'Valencia\'s culinary scene is significantly stronger than the consensus reflected. With Ricard Camarena and Quique Dacosta operating in the metropolitan area, plus the Mercado Central, the food diversity score should reflect Michelin-level access.',
      trustedModel: 'gpt-5.4',
    },
    {
      metric_id: 'outdoor_05_water_sports_ericeira',
      category: 'outdoor_recreation',
      location: 'Ericeira',
      originalScore: 88,
      judgeScore: 94,
      judgeExplanation: 'Ericeira is a UNESCO World Surfing Reserve — one of only two in Europe. The consensus did not adequately reflect this distinction. Surf schools, equipment rental, and family-friendly beach breaks are world-class.',
      trustedModel: 'sonar-reasoning-pro-high',
    },
    {
      metric_id: 'pets_02_pet_housing_dubrovnik',
      category: 'pets_animals',
      location: 'Dubrovnik',
      originalScore: 62,
      judgeScore: 54,
      judgeExplanation: 'Croatian rental contracts frequently include pet restrictions. Local real estate agents confirm that fewer than 30% of available long-term rentals in Dubrovnik accept dogs over 20kg, which is problematic for a 30kg Labrador.',
      trustedModel: 'claude-sonnet-4-6',
    },
    {
      metric_id: 'legal_03_tax_regime_cascais',
      category: 'legal_immigration',
      location: 'Cascais',
      originalScore: 80,
      judgeScore: 76,
      judgeExplanation: 'Portugal\'s NHR successor regime (IFICI) that launched in 2024 is more restrictive than the original NHR. SaaS income from a US LLC may not qualify under the "highly qualified activities" definition without careful structuring. Adjusting slightly downward to reflect this complexity.',
      trustedModel: 'gemini-3.1-pro-preview',
    },
  ];

  const confirmedMetrics: string[] = [
    'safety_01_violent_crime_cascais', 'safety_01_violent_crime_valencia', 'safety_01_violent_crime_dubrovnik',
    'health_01_hospital_access_cascais', 'health_01_hospital_access_valencia',
    'health_02_pediatric_specialists_cascais', 'health_03_english_doctors_cascais',
    'climate_01_avg_summer_temp_cascais', 'climate_02_sunny_days_cascais', 'climate_01_avg_summer_temp_valencia',
    'tech_01_fiber_speed_cascais', 'tech_01_fiber_speed_valencia', 'tech_02_5g_coverage_cascais',
    'edu_01_intl_school_cascais', 'edu_02_class_size_cascais', 'edu_01_intl_school_valencia',
    'transport_02_public_transit_valencia', 'transport_03_airport_distance_cascais',
    'food_01_local_markets_cascais', 'food_01_local_markets_valencia',
    'social_01_democracy_index_cascais', 'social_02_press_freedom_cascais',
    'housing_02_furnished_avail_cascais', 'housing_03_outdoor_space_cascais',
    'career_01_startup_ecosystem_cascais', 'career_02_coworking_cascais',
    'family_01_playgrounds_cascais', 'family_02_activities_cascais',
    'nbhd_01_village_feel_cascais', 'nbhd_02_pedestrian_zones_cascais',
    'env_01_air_quality_cascais', 'env_02_noise_pollution_cascais',
    'outdoor_01_hiking_cascais', 'outdoor_02_beach_cascais',
    'sex_01_lgbtq_legal_cascais', 'sex_03_gender_equality_cascais',
    'arts_01_museums_cascais', 'heritage_01_historical_depth_cascais',
  ];

  return {
    reportId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    summaryOfFindings,
    categoryAnalysis,
    executiveSummary,
    metricOverrides,
    confirmedMetrics,
    judgedAt: new Date().toISOString(),
  };
}

// ─── Build JudgeOrchestrationResult ──────────────────────────

function buildJudgeOrchestrationResult(report: JudgeReport): JudgeOrchestrationResult {
  return {
    finalReport: report,
    invocationCount: 2,
    safeguardTriggered: false,
    safeguardCorrections: [],
    totalCostUsd: 0.47,
    totalDurationMs: 12340,
    timestamp: new Date().toISOString(),
  };
}

// ─── Exported Constants ──────────────────────────────────────

export const TEST_SMART_SCORES: SmartScoreOutput = buildSmartScoreOutput();

export const TEST_JUDGE_REPORT: JudgeReport = buildJudgeReport();

export const TEST_JUDGE_ORCHESTRATION: JudgeOrchestrationResult = buildJudgeOrchestrationResult(TEST_JUDGE_REPORT);
