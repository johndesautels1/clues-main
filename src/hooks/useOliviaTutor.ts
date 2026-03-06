/**
 * useOliviaTutor — Layer 2: Keyword Detection Engine
 *
 * Monitors paragraph text in real-time and triggers Olivia interjections
 * when coverage targets are missing. Zero API cost — runs locally.
 *
 * Rules:
 * - Debounce: triggers after 3s pause OR every 150 words
 * - Minimum 80 words before first trigger
 * - Maximum 2 interjections per paragraph
 * - Tracks dismissed interjections (don't repeat)
 * - Returns the current interjection (or null) for OliviaBubble to display
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTargetsForParagraph, type CoverageTarget } from '../data/paragraphTargets';

export interface OliviaInterjection {
  paragraphId: number;
  targetId: string;
  targetLabel: string;
  message: string;
}

interface TutorState {
  /** Currently displayed interjection (null = nothing to show) */
  interjection: OliviaInterjection | null;
  /** Number of pending suggestions Olivia has for this paragraph */
  pendingCount: number;
  /** Coverage targets that have been addressed */
  coveredTargets: string[];
  /** Coverage targets that are missing */
  missingTargets: string[];
}

/** Dismissed targets: persisted per paragraph across navigations */
type DismissedMap = Record<number, Set<string>>;

const DEBOUNCE_MS = 3000;
const MIN_WORDS = 80;
const MAX_INTERJECTIONS_PER_PARAGRAPH = 2;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkKeywordCoverage(text: string, targets: CoverageTarget[]): { covered: string[]; missing: string[] } {
  const lower = text.toLowerCase();
  const covered: string[] = [];
  const missing: string[] = [];

  for (const target of targets) {
    const found = target.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (found) {
      covered.push(target.id);
    } else {
      missing.push(target.id);
    }
  }

  return { covered, missing };
}

export function useOliviaTutor(paragraphId: number, text: string): TutorState & {
  dismiss: () => void;
  dismissAll: () => void;
} {
  const [interjection, setInterjection] = useState<OliviaInterjection | null>(null);
  const [coveredTargets, setCoveredTargets] = useState<string[]>([]);
  const [missingTargets, setMissingTargets] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Track dismissed targets per paragraph (survives paragraph navigation)
  const dismissedRef = useRef<DismissedMap>({});
  // Track how many interjections have been shown for current paragraph
  const shownCountRef = useRef<Record<number, number>>({});
  // Track last word count that triggered analysis (for 150-word interval)
  const lastAnalyzedWordCountRef = useRef(0);

  const getDismissed = useCallback((pId: number): Set<string> => {
    if (!dismissedRef.current[pId]) {
      dismissedRef.current[pId] = new Set();
    }
    return dismissedRef.current[pId];
  }, []);

  const getShownCount = useCallback((pId: number): number => {
    return shownCountRef.current[pId] ?? 0;
  }, []);

  // Dismiss current interjection
  const dismiss = useCallback(() => {
    if (interjection) {
      getDismissed(interjection.paragraphId).add(interjection.targetId);
      setInterjection(null);
    }
  }, [interjection, getDismissed]);

  // Dismiss all pending for this paragraph
  const dismissAll = useCallback(() => {
    const targets = getTargetsForParagraph(paragraphId);
    if (targets) {
      const dismissed = getDismissed(paragraphId);
      for (const t of targets.coverageTargets) {
        dismissed.add(t.id);
      }
    }
    setInterjection(null);
    setPendingCount(0);
  }, [paragraphId, getDismissed]);

  // Track which paragraphs have already shown a welcome message
  const welcomeShownRef = useRef<Set<number>>(new Set());

  // Reset interjection when paragraph changes + fire welcome message
  useEffect(() => {
    setInterjection(null);
    lastAnalyzedWordCountRef.current = 0;

    // Fire a welcome interjection if this paragraph hasn't shown one yet
    // and the user hasn't started writing much
    const wordCount = countWords(text);
    if (wordCount < MIN_WORDS && !welcomeShownRef.current.has(paragraphId)) {
      const targets = getTargetsForParagraph(paragraphId);
      if (targets?.welcomeMessage) {
        welcomeShownRef.current.add(paragraphId);
        // Small delay so the UI transition completes first
        const timer = setTimeout(() => {
          setInterjection({
            paragraphId,
            targetId: '__welcome__',
            targetLabel: targets.heading,
            message: targets.welcomeMessage!,
          });
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [paragraphId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Main analysis — debounced
  useEffect(() => {
    const wordCount = countWords(text);
    const targets = getTargetsForParagraph(paragraphId);

    if (!targets || wordCount < MIN_WORDS) {
      setCoveredTargets([]);
      setMissingTargets([]);
      setPendingCount(0);
      return;
    }

    // Check if we should trigger: either debounce timeout or 150-word interval
    const wordsSinceLastAnalysis = wordCount - lastAnalyzedWordCountRef.current;
    const shouldAnalyzeByWords = wordsSinceLastAnalysis >= 150;

    const timer = setTimeout(() => {
      // Run keyword detection
      const { covered, missing } = checkKeywordCoverage(text, targets.coverageTargets);
      setCoveredTargets(covered);
      setMissingTargets(missing);

      const dismissed = getDismissed(paragraphId);
      const shown = getShownCount(paragraphId);

      // Filter missing targets: remove already dismissed ones
      const actionableMissing = missing.filter(id => !dismissed.has(id));
      setPendingCount(actionableMissing.length);

      // Don't show more interjections if we've hit the max
      if (shown >= MAX_INTERJECTIONS_PER_PARAGRAPH) return;

      // Don't show if there's already an active interjection
      if (interjection) return;

      // Pick the first actionable missing target that has a template
      for (const targetId of actionableMissing) {
        const template = targets.templateInterjections[targetId];
        if (template) {
          const target = targets.coverageTargets.find(t => t.id === targetId);
          setInterjection({
            paragraphId,
            targetId,
            targetLabel: target?.label ?? targetId,
            message: template,
          });
          shownCountRef.current[paragraphId] = shown + 1;
          lastAnalyzedWordCountRef.current = wordCount;
          break;
        }
      }
    }, shouldAnalyzeByWords ? 0 : DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, paragraphId, getDismissed, getShownCount, interjection]);

  return {
    interjection,
    pendingCount,
    coveredTargets,
    missingTargets,
    dismiss,
    dismissAll,
  };
}
