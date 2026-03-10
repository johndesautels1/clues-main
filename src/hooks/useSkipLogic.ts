/**
 * useSkipLogic — Cross-module pre-fill and skip detection.
 *
 * Analyzes upstream data (Paragraphical extraction, Main Module answers,
 * coverage state) to detect which mini module questions can be skipped
 * or pre-filled. Returns a lookup function: questionNumber → SkipInfo | null.
 *
 * Three skip sources:
 *  1. Paragraphical metrics: Gemini extracted a metric in the same category
 *     as this question's module → we already have signal, skip with explanation.
 *  2. Main Module answers: DNW/MH answers with matching modules[] → we have
 *     explicit user preferences for this topic.
 *  3. High coverage: The dimension's signalStrength is already ≥ 0.8 →
 *     additional questions add diminishing value.
 *
 * Pure math, no LLM calls, client-side, instant, free.
 */

import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import type { CoverageState } from '../lib/coverageTracker';
import type { GeminiMetricObject } from '../types';

// ─── Types ──────────────────────────────────────────────────────

export interface SkipInfo {
  /** Why this question can be skipped */
  reason: string;
  /** Source of the skip signal */
  source: 'paragraphical' | 'main_module' | 'high_coverage';
  /** Confidence in the skip (0-1). Higher = safer to skip. */
  confidence: number;
  /** Pre-fill value if available (from demographics or extraction) */
  preFillValue?: string | number | boolean;
}

export interface UseSkipLogicReturn {
  /** Look up skip info for a question. Returns null if the question should be asked. */
  getSkipInfo: (questionNumber: number) => SkipInfo | null;
  /** Total skippable questions in this module */
  skippableCount: number;
  /** Module-level summary: "X of Y questions covered by your paragraphs" */
  skipSummary: string;
}

// ─── Hook ───────────────────────────────────────────────────────

/**
 * @param moduleId - The mini module being answered (e.g., 'safety_security')
 * @param coverage - CoverageState from useCoverageState
 * @param questionModules - Map of questionNumber → modules[] from the question data
 */
export function useSkipLogic(
  moduleId: string,
  coverage: CoverageState | null,
  questionModules: Map<number, string[]>
): UseSkipLogicReturn {
  const { session } = useUser();
  const extraction = session.paragraphical.extraction;
  const mainModule = session.mainModule;

  const skipMap = useMemo(() => {
    const map = new Map<number, SkipInfo>();
    if (!coverage) return map;

    const dim = coverage.dimensions.find(d => d.moduleId === moduleId);
    const signalStrength = dim?.signalStrength ?? 0;

    // Build set of module IDs that have Paragraphical metric coverage
    const paragraphicalModules = new Set<string>();
    const metricsPerModule = new Map<string, GeminiMetricObject[]>();
    if (extraction?.metrics) {
      for (const metric of extraction.metrics) {
        paragraphicalModules.add(metric.category);
        const existing = metricsPerModule.get(metric.category) ?? [];
        existing.push(metric);
        metricsPerModule.set(metric.category, existing);
      }
    }

    // H7 fix: Build set of module IDs covered by DNW answers.
    // Previously always added the current moduleId regardless of whether
    // the DNW question actually references this module. Now we only flag
    // the module if high-severity DNW questions exist AND the questionModules
    // map confirms this module's questions reference it.
    const dnwModules = new Set<string>();
    if (mainModule.dnw) {
      const hasHighSeverityDnw = mainModule.dnw.some(dnw => dnw.severity >= 4);
      if (hasHighSeverityDnw) {
        // Only add moduleId if at least one question in this module references it
        for (const [, modules] of questionModules) {
          if (modules.includes(moduleId)) {
            dnwModules.add(moduleId);
            break;
          }
        }
      }
    }

    // H7 fix: Same pattern for MH answers
    const mhModules = new Set<string>();
    if (mainModule.mh) {
      const hasHighImportanceMh = mainModule.mh.some(mh => mh.importance >= 4);
      if (hasHighImportanceMh) {
        for (const [, modules] of questionModules) {
          if (modules.includes(moduleId)) {
            mhModules.add(moduleId);
            break;
          }
        }
      }
    }

    // Evaluate each question
    for (const [qNum, modules] of questionModules) {
      // Skip source 1: Paragraphical metrics cover this module
      if (extraction && modules.some(m => paragraphicalModules.has(m))) {
        const matchingMetrics = modules.flatMap(m => metricsPerModule.get(m) ?? []);
        if (matchingMetrics.length >= 2) {
          // Multiple metrics = strong coverage
          map.set(qNum, {
            reason: `Your paragraphs already provided ${matchingMetrics.length} data points for this topic`,
            source: 'paragraphical',
            confidence: Math.min(0.9, 0.5 + matchingMetrics.length * 0.1),
          });
          continue;
        }
      }

      // Skip source 2: Main Module DNW/MH answers with high severity/importance
      // that touch the same module as this question
      if (modules.includes(moduleId)) {
        const hasDnwCoverage = dnwModules.has(moduleId) && signalStrength >= 0.5;
        const hasMhCoverage = mhModules.has(moduleId) && signalStrength >= 0.5;
        if (hasDnwCoverage || hasMhCoverage) {
          const sourceLabel = hasDnwCoverage ? 'your dealbreakers' : 'your must-haves';
          map.set(qNum, {
            reason: `Already covered by ${sourceLabel} in the main questionnaire`,
            source: 'main_module',
            confidence: 0.6,
          });
          continue;
        }
      }

      // Skip source 3: High coverage — this dimension is already well-covered
      if (signalStrength >= 0.8 && modules.includes(moduleId)) {
        map.set(qNum, {
          reason: 'This dimension is already well-covered from your other answers',
          source: 'high_coverage',
          confidence: Math.min(0.85, signalStrength),
        });
      }
    }

    return map;
  }, [moduleId, coverage, extraction, mainModule.dnw, mainModule.mh, questionModules]);

  const skippableCount = skipMap.size;

  const skipSummary = useMemo(() => {
    const total = questionModules.size;
    if (skippableCount === 0) return '';
    const pct = Math.round((skippableCount / total) * 100);
    return `${skippableCount} of ${total} questions covered by prior answers (${pct}%)`;
  }, [skippableCount, questionModules.size]);

  const getSkipInfo = useMemo(() => {
    return (questionNumber: number): SkipInfo | null => {
      return skipMap.get(questionNumber) ?? null;
    };
  }, [skipMap]);

  return { getSkipInfo, skippableCount, skipSummary };
}
