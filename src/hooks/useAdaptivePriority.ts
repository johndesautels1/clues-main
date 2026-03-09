/**
 * useAdaptivePriority — EIG-driven question ordering for MiniModuleFlow.
 *
 * Bridges the adaptive engine (which knows EIG per question) with useModuleState
 * (which handles answer persistence + section/question navigation).
 *
 * When adaptive mode is available, questions are presented in EIG-descending order
 * (highest information gain first). When not available, falls back to sequential.
 *
 * Maintains a navigation history stack so "Previous" retraces the user's actual path,
 * not the sequential order.
 *
 * Pure client-side, no LLM calls.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { QuestionModule } from '../data/questions/types';
import type { UseAdaptiveReturn } from './useAdaptiveState';
import type { UseModuleStateReturn } from './useModuleState';

/** Location of a question within the section/question grid */
interface QuestionLocation {
  sectionIndex: number;
  questionIndex: number;
  questionNumber: number;
  eig: number;
}

export interface UseAdaptivePriorityReturn {
  /** Navigate to the next highest-EIG unanswered question */
  goNextAdaptive: () => void;

  /** Navigate back through the visited-question history */
  goPrevAdaptive: () => void;

  /** Whether we're at the start of the history (no prev available) */
  isFirstInHistory: boolean;

  /** Whether all questions are answered or MOE target reached */
  isAdaptiveComplete: boolean;

  /** Whether adaptive priority mode is active (vs sequential fallback) */
  isAdaptivePriority: boolean;

  /** Current question's EIG rank (1 = highest EIG in module, null if sequential) */
  eigRank: number | null;

  /** Total questions in the EIG-prioritized sequence */
  totalPrioritized: number;

  /** How many from the prioritized sequence have been answered */
  answeredPrioritized: number;
}

/**
 * Build an EIG-priority navigation layer on top of useModuleState.
 *
 * @param moduleData - The module's question structure (sections + questions)
 * @param ms - The useModuleState return (handles persistence + raw navigation)
 * @param adaptive - The useAdaptiveState return (provides EIG data)
 */
export function useAdaptivePriority(
  moduleData: QuestionModule,
  ms: UseModuleStateReturn,
  adaptive: UseAdaptiveReturn
): UseAdaptivePriorityReturn {
  // History of visited question locations (for "Previous" navigation)
  const [history, setHistory] = useState<QuestionLocation[]>([]);
  const historyRef = useRef(history);
  historyRef.current = history;

  // ─── Build question-number → location index ────────────────────
  const locationMap = useMemo(() => {
    const map = new Map<number, { sectionIndex: number; questionIndex: number }>();
    for (let si = 0; si < moduleData.sections.length; si++) {
      const questions = moduleData.sections[si].questions;
      for (let qi = 0; qi < questions.length; qi++) {
        map.set(questions[qi].number, { sectionIndex: si, questionIndex: qi });
      }
    }
    return map;
  }, [moduleData.sections]);

  // ─── Build EIG-sorted question sequence for this module ────────
  const eigSequence = useMemo((): QuestionLocation[] => {
    if (!adaptive.isAvailable || !adaptive.adaptiveState) return [];

    const moduleState = adaptive.adaptiveState.modules.find(
      m => m.moduleId === moduleData.moduleId
    );
    if (!moduleState) return [];

    // moduleState.questions is already sorted by EIG descending
    const sequence: QuestionLocation[] = [];
    for (const belief of moduleState.questions) {
      const loc = locationMap.get(belief.questionNumber);
      if (!loc) continue;

      // Skip already-skipped questions (pre-filled by skip logic)
      if (belief.skipReason) continue;

      sequence.push({
        sectionIndex: loc.sectionIndex,
        questionIndex: loc.questionIndex,
        questionNumber: belief.questionNumber,
        eig: belief.eig,
      });
    }

    return sequence;
  }, [adaptive.isAvailable, adaptive.adaptiveState, moduleData.moduleId, locationMap]);

  const isAdaptivePriority = eigSequence.length > 0;

  // ─── Find next unanswered question in EIG order ────────────────
  const findNextUnanswered = useCallback((): QuestionLocation | null => {
    for (const loc of eigSequence) {
      if (ms.getAnswer(loc.questionNumber) === undefined) {
        return loc;
      }
    }
    return null; // All answered
  }, [eigSequence, ms]);

  // ─── Count answered in prioritized sequence ────────────────────
  const answeredPrioritized = useMemo(() => {
    let count = 0;
    for (const loc of eigSequence) {
      if (ms.getAnswer(loc.questionNumber) !== undefined) count++;
    }
    return count;
  }, [eigSequence, ms]);

  // ─── Current question's EIG rank ───────────────────────────────
  const eigRank = useMemo((): number | null => {
    if (!isAdaptivePriority || !ms.currentQuestion) return null;
    const idx = eigSequence.findIndex(l => l.questionNumber === ms.currentQuestion.number);
    return idx >= 0 ? idx + 1 : null;
  }, [isAdaptivePriority, eigSequence, ms.currentQuestion]);

  // ─── Adaptive "Next" — jump to highest-EIG unanswered ─────────
  const goNextAdaptive = useCallback(() => {
    if (!isAdaptivePriority) {
      ms.goNext();
      return;
    }

    // Push current position to history before navigating away
    if (ms.currentQuestion) {
      const currentLoc: QuestionLocation = {
        sectionIndex: ms.nav.sectionIndex,
        questionIndex: ms.nav.questionIndex,
        questionNumber: ms.currentQuestion.number,
        eig: eigSequence.find(l => l.questionNumber === ms.currentQuestion.number)?.eig ?? 0,
      };
      setHistory(prev => [...prev, currentLoc]);
    }

    const next = findNextUnanswered();
    if (next) {
      ms.goToQuestion(next.sectionIndex, next.questionIndex);
    }
    // If null, all answered — MiniModuleFlow will detect isLastQuestion or isAllComplete
  }, [isAdaptivePriority, ms, eigSequence, findNextUnanswered]);

  // ─── Adaptive "Prev" — retrace visited-question history ────────
  const goPrevAdaptive = useCallback(() => {
    if (!isAdaptivePriority) {
      ms.goPrev();
      return;
    }

    const h = historyRef.current;
    if (h.length === 0) return;

    const prev = h[h.length - 1];
    setHistory(h.slice(0, -1));
    ms.goToQuestion(prev.sectionIndex, prev.questionIndex);
  }, [isAdaptivePriority, ms]);

  // ─── Completion detection ──────────────────────────────────────
  const isAdaptiveComplete = isAdaptivePriority && findNextUnanswered() === null;

  return {
    goNextAdaptive,
    goPrevAdaptive,
    isFirstInHistory: isAdaptivePriority ? history.length === 0 : ms.isFirstQuestion,
    isAdaptiveComplete,
    isAdaptivePriority,
    eigRank,
    totalPrioritized: eigSequence.length,
    answeredPrioritized,
  };
}
