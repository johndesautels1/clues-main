/**
 * useMainModuleAdaptive — Bayesian/EIG overlay for the Main Module questionnaire.
 *
 * Provides:
 *  1. Per-question EIG scores (which question gives the most information gain)
 *  2. Paragraphical pre-fill detection (questions already covered by paragraphs)
 *  3. Section priority (which section to complete next)
 *  4. Suggested next question (highest EIG unanswered)
 *
 * This is an OVERLAY — it does NOT replace sequential navigation or logic jumps.
 * The Main Module keeps its existing section-based flow. This hook provides
 * priority hints and skip indicators that the UI can display alongside.
 *
 * Pure math, no LLM calls, client-side, instant, free.
 */

import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import type { CoverageState } from '../lib/coverageTracker';
import type { GeminiMetricObject } from '../types';
import { QUESTIONNAIRE_SECTIONS } from '../components/Questionnaire/questionnaireData';
import type { QuestionItem } from '../data/questions/types';

// ─── Types ──────────────────────────────────────────────────────

export interface QuestionEIG {
  /** Question number (Q1-Q100, tq1-tq50, gq1-gq50) */
  questionKey: string;
  /** Section index (0-4) */
  sectionIndex: number;
  /** Question index within section */
  questionIndex: number;
  /** Expected Information Gain (higher = more valuable to ask) */
  eig: number;
  /** Smart score impact based on question type */
  impact: number;
  /** Prediction uncertainty (how much we don't know about this topic) */
  uncertainty: number;
}

export interface PreFillInfo {
  /** Why this question may be pre-filled */
  reason: string;
  /** Source of the pre-fill signal */
  source: 'paragraphical';
  /** How confident the pre-fill is (0-1) */
  confidence: number;
  /** Number of matching metrics from Paragraphical */
  metricCount: number;
}

export interface SectionPriority {
  sectionIndex: number;
  sectionId: string;
  title: string;
  /** Average EIG of unanswered questions in this section */
  avgEIG: number;
  /** Count of unanswered questions */
  unanswered: number;
  /** Count of pre-filled questions */
  preFilled: number;
}

export interface UseMainModuleAdaptiveReturn {
  /** Is adaptive data available? (requires coverage + paragraphical extraction) */
  isAvailable: boolean;

  /** Get EIG score for a question key (e.g., 'q5', 'tq12') */
  getQuestionEIG: (questionKey: string) => number;

  /** Get pre-fill info for a question key. null = not pre-filled. */
  getPreFillInfo: (questionKey: string) => PreFillInfo | null;

  /** Sections sorted by priority (highest average EIG first) */
  sectionPriorities: SectionPriority[];

  /** Suggested next question (highest EIG unanswered across all sections) */
  suggestedNext: { sectionIndex: number; questionIndex: number; questionKey: string; eig: number } | null;

  /** Total pre-filled question count */
  preFillCount: number;

  /** Summary text for the user */
  adaptiveSummary: string;
}

// ─── Smart Score Impact by Question Type ────────────────────────
// Same weights as adaptiveEngine.ts for consistency

function getSmartScoreImpact(type: string): number {
  const t = type.toLowerCase();
  if (t.includes('ranking')) return 0.9;
  if (t.includes('dealbreaker') || t === 'severity_scale') return 0.85;
  if (t.includes('importance') || t.includes('concern') || t === 'likert') return 0.75;
  if (t.includes('slider') || t.includes('range')) return 0.7;
  if (t.includes('comfort') || t.includes('willingness')) return 0.65;
  if (t.includes('single') || t.includes('select_one')) return 0.65;
  if (t.includes('multi') || t.includes('select_all')) return 0.6;
  if (t.includes('satisfaction') || t.includes('agreement')) return 0.6;
  if (t.includes('frequency')) return 0.55;
  if (t.includes('yes_no') || t.includes('boolean')) return 0.5;
  if (t.includes('open') || t.includes('text') || t.includes('free')) return 0.3;
  return 0.5; // default
}

// ─── Module mapping for Main Module questions ───────────────────
// Maps question categories to module IDs for cross-referencing with coverage

const SECTION_MODULE_MAP: Record<string, string[]> = {
  demographics: [
    'safety_security', 'health_wellness', 'financial_banking',
    'professional_career', 'family_children', 'pets_animals',
    'housing_property', 'legal_immigration',
  ],
  dnw: [
    'safety_security', 'health_wellness', 'climate_weather',
    'legal_immigration', 'financial_banking', 'education_learning',
    'social_values_governance', 'environment_community_appearance',
  ],
  mh: [
    'technology_connectivity', 'transportation_mobility', 'food_dining',
    'entertainment_nightlife', 'outdoor_recreation', 'arts_culture',
    'neighborhood_urban_design', 'family_children', 'pets_animals',
  ],
  tradeoffs: [
    'climate_weather', 'financial_banking', 'housing_property',
    'professional_career', 'education_learning', 'entertainment_nightlife',
    'transportation_mobility', 'shopping_services',
  ],
  general: [
    'religion_spirituality', 'sexual_beliefs_practices_laws',
    'cultural_heritage_traditions', 'social_values_governance',
    'food_dining', 'neighborhood_urban_design',
  ],
};

// ─── Hook ───────────────────────────────────────────────────────

export function useMainModuleAdaptive(
  coverage: CoverageState | null,
  answers: Record<string, unknown>,
  skippedKeys: Set<string>
): UseMainModuleAdaptiveReturn {
  const { session } = useUser();
  const extraction = session.paragraphical.extraction;

  // Build Paragraphical metric index
  const metricsPerCategory = useMemo(() => {
    const map = new Map<string, GeminiMetricObject[]>();
    if (!extraction?.metrics) return map;
    for (const metric of extraction.metrics) {
      const existing = map.get(metric.category) ?? [];
      existing.push(metric);
      map.set(metric.category, existing);
    }
    return map;
  }, [extraction?.metrics]);

  const isAvailable = !!(coverage && extraction);

  // Compute EIG and pre-fill for all questions
  const { eigMap, preFillMap, eigList } = useMemo(() => {
    const eMap = new Map<string, number>();
    const pMap = new Map<string, PreFillInfo>();
    const eList: QuestionEIG[] = [];

    if (!coverage) return { eigMap: eMap, preFillMap: pMap, eigList: eList };

    QUESTIONNAIRE_SECTIONS.forEach((section, si) => {
      const relatedModules = SECTION_MODULE_MAP[section.id] ?? [];

      // Compute average signal strength for this section's related modules
      let totalSignal = 0;
      let moduleCount = 0;
      for (const modId of relatedModules) {
        const dim = coverage.dimensions.find(d => d.moduleId === modId);
        if (dim) {
          totalSignal += dim.signalStrength;
          moduleCount++;
        }
      }
      const avgSignal = moduleCount > 0 ? totalSignal / moduleCount : 0;

      // Base uncertainty from coverage gap
      const baseUncertainty = Math.max(0.05, Math.min(0.95, 1 - avgSignal));

      section.questions.forEach((q: QuestionItem, qi: number) => {
        // Build question key
        let key: string;
        if (section.id === 'tradeoffs') key = `tq${q.number}`;
        else if (section.id === 'general') key = `gq${q.number}`;
        else key = `q${q.number}`;

        // Skip if logic-jumped
        if (skippedKeys.has(key)) return;

        const impact = getSmartScoreImpact(q.type);

        // Reduce uncertainty if we already have an answer
        const hasAnswer = answers[key] !== undefined;
        const uncertainty = hasAnswer ? 0.05 : baseUncertainty;

        const eig = uncertainty * impact;
        eMap.set(key, eig);

        eList.push({ questionKey: key, sectionIndex: si, questionIndex: qi, eig, impact, uncertainty });

        // Check Paragraphical pre-fill
        if (!hasAnswer && extraction) {
          let matchCount = 0;
          for (const modId of relatedModules) {
            const metrics = metricsPerCategory.get(modId);
            if (metrics) matchCount += metrics.length;
          }
          if (matchCount >= 2) {
            pMap.set(key, {
              reason: `Your paragraphs provided ${matchCount} data points covering this topic`,
              source: 'paragraphical',
              confidence: Math.min(0.85, 0.4 + matchCount * 0.08),
              metricCount: matchCount,
            });
          }
        }
      });
    });

    return { eigMap: eMap, preFillMap: pMap, eigList: eList };
  }, [coverage, answers, skippedKeys, extraction, metricsPerCategory]);

  // Getters
  const getQuestionEIG = useMemo(() => {
    return (key: string): number => eigMap.get(key) ?? 0;
  }, [eigMap]);

  const getPreFillInfo = useMemo(() => {
    return (key: string): PreFillInfo | null => preFillMap.get(key) ?? null;
  }, [preFillMap]);

  // Section priorities
  const sectionPriorities = useMemo((): SectionPriority[] => {
    return QUESTIONNAIRE_SECTIONS.map((section, si) => {
      const sectionQuestions = eigList.filter(e => e.sectionIndex === si);
      const unanswered = sectionQuestions.filter(e => e.uncertainty > 0.05);
      const avgEIG = unanswered.length > 0
        ? unanswered.reduce((sum, e) => sum + e.eig, 0) / unanswered.length
        : 0;

      let preFilled = 0;
      for (const e of sectionQuestions) {
        if (preFillMap.has(e.questionKey)) preFilled++;
      }

      return {
        sectionIndex: si,
        sectionId: section.id,
        title: section.title,
        avgEIG,
        unanswered: unanswered.length,
        preFilled,
      };
    }).sort((a, b) => b.avgEIG - a.avgEIG);
  }, [eigList, preFillMap]);

  // Suggested next question (highest EIG unanswered)
  const suggestedNext = useMemo(() => {
    const unanswered = eigList
      .filter(e => e.uncertainty > 0.05)
      .sort((a, b) => b.eig - a.eig);
    if (unanswered.length === 0) return null;
    const top = unanswered[0];
    return {
      sectionIndex: top.sectionIndex,
      questionIndex: top.questionIndex,
      questionKey: top.questionKey,
      eig: top.eig,
    };
  }, [eigList]);

  const preFillCount = preFillMap.size;

  const adaptiveSummary = useMemo(() => {
    if (!isAvailable) return '';
    const parts: string[] = [];
    if (preFillCount > 0) {
      parts.push(`${preFillCount} questions informed by your paragraphs`);
    }
    if (suggestedNext) {
      const sectionName = QUESTIONNAIRE_SECTIONS[suggestedNext.sectionIndex].title;
      parts.push(`highest-value question is in ${sectionName}`);
    }
    return parts.join(' · ');
  }, [isAvailable, preFillCount, suggestedNext]);

  return {
    isAvailable,
    getQuestionEIG,
    getPreFillInfo,
    sectionPriorities,
    suggestedNext,
    preFillCount,
    adaptiveSummary,
  };
}
