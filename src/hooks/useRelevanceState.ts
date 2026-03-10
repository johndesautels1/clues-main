/**
 * useRelevanceState — Reactive module relevance hook.
 *
 * Computes which of the 23 mini modules are most relevant for the current user,
 * based on all available UserSession data sources:
 *  1. Paragraphical extraction (Gemini module_relevance — strongest signal)
 *  2. Demographics (24 deterministic rules)
 *  3. DNW answers (severity-weighted)
 *  4. MH answers (importance-weighted)
 *  5. Tradeoff answers (slider deviation)
 *  6. General answers (broad confidence boost)
 *
 * This is DERIVED STATE — reads from UserContext, no new reducer actions.
 * Pure math, no LLM calls, client-side, instant, free.
 */

import { useMemo, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import {
  initializeRelevance,
  applyParagraphicalRelevance,
  applyDemographicRelevance,
  applyDNWRelevance,
  applyMHRelevance,
  applyTradeoffRelevance,
  applyGeneralRelevance,
  type RelevanceResult,
  type ModuleRelevance,
} from '../lib/moduleRelevanceEngine';

export interface UseRelevanceReturn {
  relevance: RelevanceResult;
  /** Recommended modules sorted by priority (highest first) */
  recommendedModules: ModuleRelevance[];
  /** Quick lookup: is this module recommended? */
  isRecommended: (moduleId: string) => boolean;
  /** Get relevance score for a module (0-1) */
  getRelevance: (moduleId: string) => number;
  /** Estimated total questions across all recommended modules */
  estimatedQuestions: number;
}

export function useRelevanceState(): UseRelevanceReturn {
  const { session } = useUser();
  const { paragraphical, mainModule } = session;

  const relevance = useMemo((): RelevanceResult => {
    let result = initializeRelevance();

    // 1. Paragraphical extraction (strongest signal — Gemini module_relevance)
    if (paragraphical.extraction) {
      result = applyParagraphicalRelevance(result, paragraphical.extraction);
    }

    // 2. Demographics (24 deterministic rules)
    if (mainModule.demographics && Object.keys(mainModule.demographics).length > 0) {
      result = applyDemographicRelevance(result, mainModule.demographics);
    }

    // 3. DNW (severity-weighted module signals)
    if (mainModule.dnw && mainModule.dnw.length > 0) {
      result = applyDNWRelevance(result, mainModule.dnw);
    }

    // 4. MH (importance-weighted module signals)
    if (mainModule.mh && mainModule.mh.length > 0) {
      result = applyMHRelevance(result, mainModule.mh);
    }

    // 5. Tradeoffs (slider deviation signals)
    if (mainModule.tradeoffAnswers && Object.keys(mainModule.tradeoffAnswers).length > 0) {
      result = applyTradeoffRelevance(result, mainModule.tradeoffAnswers);
    }

    // 6. General (broad confidence boost)
    if (mainModule.generalAnswers && Object.keys(mainModule.generalAnswers).length > 0) {
      result = applyGeneralRelevance(result, mainModule.generalAnswers);
    }

    return result;
  }, [
    paragraphical.extraction,
    mainModule.demographics,
    mainModule.dnw,
    mainModule.mh,
    mainModule.tradeoffAnswers,
    mainModule.generalAnswers,
  ]);

  const recommendedSet = useMemo(
    () => new Set(relevance.recommendedModules.map(m => m.moduleId)),
    [relevance.recommendedModules]
  );

  const relevanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of relevance.modules) {
      map[m.moduleId] = m.relevance;
    }
    return map;
  }, [relevance.modules]);

  const isRecommended = useCallback(
    (moduleId: string) => recommendedSet.has(moduleId),
    [recommendedSet]
  );

  const getRelevance = useCallback(
    (moduleId: string) => relevanceMap[moduleId] ?? 0.5,
    [relevanceMap]
  );

  return {
    relevance,
    recommendedModules: relevance.recommendedModules,
    isRecommended,
    getRelevance,
    estimatedQuestions: relevance.estimatedTotalQuestions,
  };
}
