/**
 * useParagraphAdaptive — Bayesian priority suggestions for Paragraphical writing.
 *
 * Analyzes which paragraphs would provide the most information gain based on:
 *  1. Coverage gaps — modules with low signal strength need more data
 *  2. Module relevance — high-relevance modules benefit more from paragraphs
 *  3. Completion state — skip already-written paragraphs
 *
 * Returns paragraph priority rankings and a "suggested next" indicator
 * that the ParagraphicalFlow UI can display as a non-intrusive overlay.
 *
 * The 30 paragraphs stay sequential — this hook suggests which to PRIORITIZE,
 * not reorder. Users see "High Value" badges on high-priority paragraphs.
 *
 * Pure math, no LLM calls, client-side, instant, free.
 */

import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { PARAGRAPH_DEFS } from '../data/paragraphs';
import type { CoverageState } from '../lib/coverageTracker';
import type { RelevanceResult } from '../lib/moduleRelevanceEngine';

// ─── Types ──────────────────────────────────────────────────────

export interface ParagraphPriority {
  paragraphId: number;
  heading: string;
  moduleId: string | undefined;
  /** Expected information gain (0-1). Higher = more valuable to write. */
  eig: number;
  /** Is this paragraph already written? */
  completed: boolean;
  /** Why this paragraph is valuable (user-facing) */
  reason: string;
}

export interface UseParagraphAdaptiveReturn {
  /** Is adaptive data available? (requires coverage) */
  isAvailable: boolean;

  /** Get priority info for a paragraph. */
  getPriority: (paragraphId: number) => ParagraphPriority | null;

  /** Is this paragraph high-priority? (top 5 uncompleted by EIG) */
  isHighPriority: (paragraphId: number) => boolean;

  /** Suggested next paragraph to write (highest EIG uncompleted) */
  suggestedNext: ParagraphPriority | null;

  /** All priorities sorted by EIG (highest first) */
  priorities: ParagraphPriority[];

  /** Summary text */
  adaptiveSummary: string;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useParagraphAdaptive(
  coverage: CoverageState | null,
  relevance: RelevanceResult | null
): UseParagraphAdaptiveReturn {
  const { session } = useUser();
  const paragraphs = session.paragraphical.paragraphs;

  // Set of completed paragraph IDs
  const completedIds = useMemo(() => {
    return new Set(
      paragraphs
        .filter(p => p.content.trim().length > 0)
        .map(p => p.id)
    );
  }, [paragraphs]);

  const isAvailable = !!(coverage);

  // Compute priorities
  const priorities = useMemo((): ParagraphPriority[] => {
    return PARAGRAPH_DEFS.map(def => {
      const completed = completedIds.has(def.id);
      let eig = 0;
      let reason = '';

      if (completed) {
        reason = 'Already written';
        return { paragraphId: def.id, heading: def.heading, moduleId: def.moduleId, eig: 0, completed, reason };
      }

      // Phase 1-4 (P1-P5): Core profile paragraphs — always high priority if unwritten
      if (def.id <= 5) {
        // Core paragraphs have base high EIG since they feed demographics/DNW/MH/tradeoffs
        eig = 0.8 - (def.id - 1) * 0.05; // P1=0.80, P2=0.75, P3=0.70, P4=0.65, P5=0.60
        reason = 'Core profile paragraph — high impact on all recommendations';
        return { paragraphId: def.id, heading: def.heading, moduleId: def.moduleId, eig, completed, reason };
      }

      // Phase 5 (P6-P28): Module paragraphs — EIG from coverage gap + relevance
      if (def.moduleId && coverage) {
        const dim = coverage.dimensions.find(d => d.moduleId === def.moduleId);
        const signalStrength = dim?.signalStrength ?? 0;
        const uncertainty = Math.max(0.05, 1 - signalStrength);

        // Get relevance for this module
        let moduleRelevance = 0.5; // default
        if (relevance) {
          const modRel = relevance.modules.find(m => m.moduleId === def.moduleId);
          if (modRel) moduleRelevance = modRel.relevance;
        }

        // EIG = uncertainty * relevance weight
        // High uncertainty + high relevance = high EIG
        eig = uncertainty * (0.4 + moduleRelevance * 0.6);

        if (eig >= 0.5) {
          reason = 'This category has limited data — your writing here would significantly improve results';
        } else if (eig >= 0.3) {
          reason = 'Your data for this category could use more depth';
        } else {
          reason = 'Good coverage already — write this when you have time';
        }

        return { paragraphId: def.id, heading: def.heading, moduleId: def.moduleId, eig, completed, reason };
      }

      // Phase 6 (P29-P30): Vision paragraphs — moderate priority
      eig = 0.35;
      reason = 'Helps paint the full picture of your ideal life';
      return { paragraphId: def.id, heading: def.heading, moduleId: def.moduleId, eig, completed, reason };
    }).sort((a, b) => b.eig - a.eig);
  }, [completedIds, coverage, relevance]);

  // Lookup map
  const priorityMap = useMemo(() => {
    const map = new Map<number, ParagraphPriority>();
    for (const p of priorities) map.set(p.paragraphId, p);
    return map;
  }, [priorities]);

  // Top 5 uncompleted by EIG
  const highPriorityIds = useMemo(() => {
    return new Set(
      priorities
        .filter(p => !p.completed && p.eig > 0)
        .slice(0, 5)
        .map(p => p.paragraphId)
    );
  }, [priorities]);

  const getPriority = useMemo(() => {
    return (id: number): ParagraphPriority | null => priorityMap.get(id) ?? null;
  }, [priorityMap]);

  const isHighPriority = useMemo(() => {
    return (id: number): boolean => highPriorityIds.has(id);
  }, [highPriorityIds]);

  const suggestedNext = useMemo(() => {
    return priorities.find(p => !p.completed && p.eig > 0) ?? null;
  }, [priorities]);

  const adaptiveSummary = useMemo(() => {
    if (!isAvailable) return '';
    const highCount = highPriorityIds.size;
    if (highCount === 0) return 'All high-priority paragraphs are complete';
    if (suggestedNext) {
      return `${highCount} high-value paragraphs remaining — start with "${suggestedNext.heading}"`;
    }
    return `${highCount} high-value paragraphs remaining`;
  }, [isAvailable, highPriorityIds.size, suggestedNext]);

  return {
    isAvailable,
    getPriority,
    isHighPriority,
    suggestedNext,
    priorities,
    adaptiveSummary,
  };
}
