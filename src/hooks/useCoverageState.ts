/**
 * useCoverageState — Reactive coverage tracking hook.
 *
 * Computes CoverageState from all available UserSession data sources:
 *  1. Paragraphical extraction (Gemini metrics + module_relevance)
 *  2. Demographics answers
 *  3. DNW answers
 *  4. MH answers
 *  5. Tradeoff answers
 *  6. General answers
 *  7. Mini module answers (from localStorage per module)
 *
 * This is DERIVED STATE — it reads from UserContext and computes coverage
 * on every relevant change. No new reducer actions needed.
 *
 * Pure math, no LLM calls, runs client-side, instant, free.
 */

import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { MODULES } from '../data/modules';
import {
  initializeCoverage,
  applyCoverageFromParagraphical,
  applyCoverageFromDemographics,
  applyCoverageFromDNW,
  applyCoverageFromMH,
  applyCoverageFromTradeoffs,
  applyCoverageFromGeneral,
  applyCoverageFromMiniModule,
  type CoverageState,
} from '../lib/coverageTracker';

/**
 * Read mini module answer counts from localStorage.
 * Returns { moduleId: answeredCount } for each module with saved answers.
 */
function getMiniModuleAnswerCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const mod of MODULES) {
    try {
      const stored = localStorage.getItem(`clues-module-${mod.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const count = Object.keys(parsed).filter(k => k.startsWith(`${mod.id}__`)).length;
        if (count > 0) counts[mod.id] = count;
      }
    } catch { /* ignore corrupt data */ }
  }
  return counts;
}

export interface UseCoverageReturn {
  coverage: CoverageState;
  /** Module IDs sorted by gap severity (worst gaps first) */
  recommendedModules: string[];
  /** True when MOE ≤ 2% — ready for LLM evaluation */
  isReportReady: boolean;
  /** 0-100 overall percentage (inverse of MOE) */
  overallPercentage: number;
}

export function useCoverageState(): UseCoverageReturn {
  const { session } = useUser();
  const { paragraphical, mainModule, completedModules } = session;

  const coverage = useMemo((): CoverageState => {
    let state = initializeCoverage();

    // 1. Paragraphical extraction (weights + metric signals)
    if (paragraphical.extraction) {
      state = applyCoverageFromParagraphical(state, paragraphical.extraction);
    }

    // 2. Demographics
    if (mainModule.demographics && Object.keys(mainModule.demographics).length > 0) {
      state = applyCoverageFromDemographics(state, mainModule.demographics);
    }

    // 3. DNW
    if (mainModule.dnw && mainModule.dnw.length > 0) {
      state = applyCoverageFromDNW(state, mainModule.dnw);
    }

    // 4. MH
    if (mainModule.mh && mainModule.mh.length > 0) {
      state = applyCoverageFromMH(state, mainModule.mh);
    }

    // 5. Tradeoffs
    if (mainModule.tradeoffAnswers && Object.keys(mainModule.tradeoffAnswers).length > 0) {
      state = applyCoverageFromTradeoffs(state, mainModule.tradeoffAnswers);
    }

    // 6. General
    if (mainModule.generalAnswers && Object.keys(mainModule.generalAnswers).length > 0) {
      state = applyCoverageFromGeneral(state, mainModule.generalAnswers);
    }

    // 7. Mini module answers (from localStorage)
    const miniCounts = getMiniModuleAnswerCounts();
    for (const [modId, count] of Object.entries(miniCounts)) {
      const mod = MODULES.find(m => m.id === modId);
      if (mod) {
        state = applyCoverageFromMiniModule(state, modId, count, mod.questionCount);
      }
    }

    return state;
  }, [
    paragraphical.extraction,
    mainModule.demographics,
    mainModule.dnw,
    mainModule.mh,
    mainModule.tradeoffAnswers,
    mainModule.generalAnswers,
    completedModules, // Triggers recompute when a module is marked complete
  ]);

  const recommendedModules = useMemo(() => {
    return coverage.gapAnalysis
      .filter(g => g.severity === 'critical' || g.severity === 'moderate')
      .map(g => g.moduleId);
  }, [coverage.gapAnalysis]);

  const overallPercentage = Math.round((1 - coverage.overallMOE) * 100);

  return {
    coverage,
    recommendedModules,
    isReportReady: coverage.isReportReady,
    overallPercentage,
  };
}
