/**
 * useModuleState — State management hook for mini module questionnaires.
 * Handles answer persistence (localStorage + UserContext → Supabase),
 * section navigation, progress tracking, and save/resume.
 *
 * Each mini module has 100 questions in 10 sections of 10 each.
 * Answer keys are prefixed by moduleId to avoid collisions: `{moduleId}__q{number}`
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import type { QuestionModule, QuestionItem } from '../data/questions/types';

// ─── Types ──────────────────────────────────────────────────────

export interface ModuleNav {
  sectionIndex: number;
  questionIndex: number;
}

export interface ModuleProgress {
  answeredCount: number;
  totalQuestions: number;
  percentage: number;
  sectionProgress: { answered: number; total: number }[];
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

export interface UseModuleStateReturn {
  answers: Record<string, string | number | boolean | string[]>;
  nav: ModuleNav;
  saveStatus: SaveStatus;
  currentSection: { title: string; questions: QuestionItem[] };
  currentQuestion: QuestionItem;
  visibleQuestions: QuestionItem[];
  progress: ModuleProgress;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSectionComplete: boolean;
  isAllComplete: boolean;
  getAnswer: (questionNumber: number) => string | number | boolean | string[] | undefined;
  setAnswer: (questionNumber: number, value: string | number | boolean | string[]) => void;
  goNext: () => void;
  goPrev: () => void;
  goToSection: (sectionIndex: number) => void;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;
}

// ─── Constants ──────────────────────────────────────────────────

const SAVE_DEBOUNCE_MS = 1500;

// ─── Local Storage Key ──────────────────────────────────────────

function storageKey(moduleId: string): string {
  return `clues-module-${moduleId}`;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useModuleState(moduleData: QuestionModule): UseModuleStateReturn {
  const { dispatch } = useUser();
  const moduleId = moduleData.moduleId;

  // Load from localStorage on mount
  const loadInitial = useCallback((): Record<string, string | number | boolean | string[]> => {
    try {
      const stored = localStorage.getItem(storageKey(moduleId));
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {};
  }, [moduleId]);

  const [answers, setAnswers] = useState(loadInitial);
  const [nav, setNav] = useState<ModuleNav>(() => {
    // Resume at the first unanswered question
    const saved = loadInitial();
    for (let si = 0; si < moduleData.sections.length; si++) {
      const questions = moduleData.sections[si].questions;
      for (let qi = 0; qi < questions.length; qi++) {
        const key = `${moduleId}__q${questions[qi].number}`;
        if (saved[key] === undefined) {
          return { sectionIndex: si, questionIndex: qi };
        }
      }
    }
    return { sectionIndex: 0, questionIndex: 0 };
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Persist to localStorage immediately on answer change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(moduleId), JSON.stringify(answers));
    } catch { /* quota exceeded — ignore */ }
  }, [answers, moduleId]);

  // Debounced persist to UserContext (→ Supabase)
  const persistToContext = useCallback((updated: Record<string, string | number | boolean | string[]>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(() => {
      // Count answered questions for this module
      const totalAnswered = Object.keys(updated).filter(k => k.startsWith(`${moduleId}__`)).length;
      const totalQuestions = moduleData.sections.reduce((sum, s) => sum + s.questions.length, 0);

      if (totalAnswered >= totalQuestions) {
        dispatch({ type: 'COMPLETE_MODULE', payload: moduleId });
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1200);
    }, SAVE_DEBOUNCE_MS);
  }, [moduleId, moduleData.sections, dispatch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ─── Answer Operations ──────────────────────────────────────────

  const getAnswer = useCallback((questionNumber: number) => {
    return answers[`${moduleId}__q${questionNumber}`];
  }, [answers, moduleId]);

  const setAnswer = useCallback((questionNumber: number, value: string | number | boolean | string[]) => {
    setAnswers(prev => {
      const updated = { ...prev, [`${moduleId}__q${questionNumber}`]: value };
      persistToContext(updated);
      return updated;
    });
  }, [moduleId, persistToContext]);

  // ─── Navigation ─────────────────────────────────────────────────

  const sections = moduleData.sections;
  const currentSection = sections[nav.sectionIndex];
  const visibleQuestions = currentSection?.questions ?? [];
  const currentQuestion = visibleQuestions[nav.questionIndex];

  const goNext = useCallback(() => {
    setNav(prev => {
      const sec = sections[prev.sectionIndex];
      if (!sec) return prev;

      // Next question in current section
      if (prev.questionIndex < sec.questions.length - 1) {
        return { ...prev, questionIndex: prev.questionIndex + 1 };
      }

      // Next section
      if (prev.sectionIndex < sections.length - 1) {
        return { sectionIndex: prev.sectionIndex + 1, questionIndex: 0 };
      }

      return prev; // Already at end
    });
  }, [sections]);

  const goPrev = useCallback(() => {
    setNav(prev => {
      // Previous question in current section
      if (prev.questionIndex > 0) {
        return { ...prev, questionIndex: prev.questionIndex - 1 };
      }

      // Previous section, last question
      if (prev.sectionIndex > 0) {
        const prevSection = sections[prev.sectionIndex - 1];
        return {
          sectionIndex: prev.sectionIndex - 1,
          questionIndex: prevSection.questions.length - 1,
        };
      }

      return prev; // Already at start
    });
  }, [sections]);

  const goToSection = useCallback((sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      setNav({ sectionIndex, questionIndex: 0 });
    }
  }, [sections]);

  const goToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    if (
      sectionIndex >= 0 && sectionIndex < sections.length &&
      questionIndex >= 0 && questionIndex < sections[sectionIndex].questions.length
    ) {
      setNav({ sectionIndex, questionIndex });
    }
  }, [sections]);

  // ─── Progress ───────────────────────────────────────────────────

  const progress = useMemo((): ModuleProgress => {
    let answeredCount = 0;
    let totalQuestions = 0;
    const sectionProgress: { answered: number; total: number }[] = [];

    for (const section of sections) {
      let sectionAnswered = 0;
      for (const q of section.questions) {
        totalQuestions++;
        if (answers[`${moduleId}__q${q.number}`] !== undefined) {
          answeredCount++;
          sectionAnswered++;
        }
      }
      sectionProgress.push({ answered: sectionAnswered, total: section.questions.length });
    }

    return {
      answeredCount,
      totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
      sectionProgress,
    };
  }, [answers, sections, moduleId]);

  const isFirstQuestion = nav.sectionIndex === 0 && nav.questionIndex === 0;

  const isLastQuestion = useMemo(() => {
    const lastSec = sections.length - 1;
    if (nav.sectionIndex < lastSec) return false;
    return nav.questionIndex >= sections[lastSec].questions.length - 1;
  }, [nav, sections]);

  const isSectionComplete = useMemo(() => {
    if (!currentSection) return false;
    return currentSection.questions.every(
      q => answers[`${moduleId}__q${q.number}`] !== undefined
    );
  }, [currentSection, answers, moduleId]);

  const isAllComplete = progress.answeredCount === progress.totalQuestions && progress.totalQuestions > 0;

  // ─── Return ─────────────────────────────────────────────────────

  return {
    answers,
    nav,
    saveStatus,
    currentSection: currentSection
      ? { title: currentSection.title, questions: currentSection.questions }
      : { title: '', questions: [] },
    currentQuestion,
    visibleQuestions,
    progress,
    isFirstQuestion,
    isLastQuestion,
    isSectionComplete,
    isAllComplete,
    getAnswer,
    setAnswer,
    goNext,
    goPrev,
    goToSection,
    goToQuestion,
  };
}
