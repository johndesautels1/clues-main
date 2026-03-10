/**
 * useAdaptiveState — Reactive hook wrapping the CAT adaptive question engine.
 *
 * Initializes the adaptive engine from current coverage + relevance state,
 * then provides question selection, answer recording, and session progress.
 *
 * This hook does NOT replace useModuleState — it provides an OVERLAY.
 * When adaptive mode is active, MiniModuleFlow uses this to determine
 * which question to show next (sorted by EIG), while useModuleState
 * still handles answer persistence and localStorage.
 *
 * The adaptive engine is initialized once per module entry. It requires
 * both useCoverageState and useRelevanceState to provide upstream data.
 *
 * Pure math, no LLM calls, client-side, instant, free.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  initializeAdaptiveEngine,
  selectNextQuestion,
  recordAnswer,
  skipQuestion,
  markPreFilled,
  type AdaptiveState,
  type NextQuestionResult,
} from '../lib/adaptiveEngine';
import type { CoverageState } from '../lib/coverageTracker';
import type { RelevanceResult } from '../lib/moduleRelevanceEngine';

export interface UseAdaptiveReturn {
  /** The adaptive engine state (null if not initialized) */
  adaptiveState: AdaptiveState | null;

  /** The next question to present (null if session complete) */
  nextQuestion: NextQuestionResult | null;

  /** Record an answer and advance to the next highest-EIG question */
  recordAdaptiveAnswer: (moduleId: string, questionNumber: number, value: unknown) => void;

  /** User declines to answer — skip without MOE reduction */
  skipAdaptiveQuestion: (moduleId: string, questionNumber: number) => void;

  /** Mark a question as pre-filled from upstream data (partial MOE reduction) */
  markAdaptivePreFilled: (moduleId: string, questionNumber: number, value: string | number | boolean) => void;

  /** Is the adaptive session complete? (MOE ≤ 2%) */
  isSessionComplete: boolean;

  /** Overall MOE (0-1) */
  overallMOE: number;

  /** Total questions answered across all adaptive modules */
  totalAnswered: number;

  /** Estimated remaining questions to reach target */
  estimatedRemaining: number;

  /** Is adaptive mode available? (requires relevance + coverage data) */
  isAvailable: boolean;
}

/**
 * Initialize and manage the adaptive question engine.
 *
 * @param relevance - Module relevance result from useRelevanceState
 * @param coverage - Coverage state from useCoverageState
 * @param enabled - Whether adaptive mode is enabled (false = sequential mode)
 */
export function useAdaptiveState(
  relevance: RelevanceResult | null,
  coverage: CoverageState | null,
  enabled: boolean = true
): UseAdaptiveReturn {
  const [state, setState] = useState<AdaptiveState | null>(null);

  // Initialize the engine when relevance + coverage are available
  const isAvailable = !!(relevance && coverage && relevance.recommendedModules.length > 0 && enabled);

  // Initialize the engine when inputs become available (useEffect, not useMemo — side effect)
  useEffect(() => {
    if (!isAvailable || !relevance || !coverage) {
      return;
    }

    // Only initialize if we don't have a state yet
    if (!state) {
      setState(initializeAdaptiveEngine(relevance, coverage));
    }
  }, [isAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get next question from current state
  const nextQuestion = useMemo((): NextQuestionResult | null => {
    if (!state) return null;
    return selectNextQuestion(state);
  }, [state]);

  // Record an answer
  const recordAdaptiveAnswer = useCallback((moduleId: string, questionNumber: number, value: unknown) => {
    setState(prev => {
      if (!prev) return prev;
      return recordAnswer(prev, moduleId, questionNumber, value);
    });
  }, []);

  // Skip a question
  const skipAdaptiveQuestion = useCallback((moduleId: string, questionNumber: number) => {
    setState(prev => {
      if (!prev) return prev;
      return skipQuestion(prev, moduleId, questionNumber);
    });
  }, []);

  // Mark a question as pre-filled from upstream data
  const markAdaptivePreFilled = useCallback((moduleId: string, questionNumber: number, value: string | number | boolean) => {
    setState(prev => {
      if (!prev) return prev;
      return markPreFilled(prev, moduleId, questionNumber, value);
    });
  }, []);

  return {
    adaptiveState: state,
    nextQuestion,
    recordAdaptiveAnswer,
    skipAdaptiveQuestion,
    markAdaptivePreFilled,
    isSessionComplete: state?.isSessionComplete ?? false,
    overallMOE: state?.overallMOE ?? 1,
    totalAnswered: state?.totalAnswered ?? 0,
    estimatedRemaining: state?.estimatedRemaining ?? 0,
    isAvailable,
  };
}
