/**
 * useQuestionnaireState — Manages answers, navigation, persistence, and logic jumps
 * for the Main Module questionnaire.
 *
 * Follows the same three-layer persistence pattern as DiscoveryFlow:
 *  1. In-memory state (useState)
 *  2. localStorage (immediate, for anonymous / returning users)
 *  3. UserContext dispatch (debounced 1500ms → Supabase)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import {
  QUESTIONNAIRE_SECTIONS,
  getSkippedQuestions,
  getResponseLabels,
  type SectionId,
} from '../components/Questionnaire/questionnaireData';
import type { SubSection, DNWAnswer, MHAnswer } from '../types';

const STORAGE_KEY = 'clues-main-questionnaire';

export type AnswerMap = Record<string, string | number | boolean | string[]>;

export interface QuestionnaireNav {
  sectionIndex: number;
  questionIndex: number;  // index within the visible (non-skipped) questions
}

export interface QuestionnaireProgress {
  answeredCount: number;
  totalVisible: number;    // total minus skipped
  totalAll: number;
  percentage: number;
  sectionProgress: { id: SectionId; answered: number; total: number }[];
}

export interface UseQuestionnaireReturn {
  // State
  answers: AnswerMap;
  nav: QuestionnaireNav;
  saveStatus: 'idle' | 'saving' | 'saved';

  // Current position
  currentSection: typeof QUESTIONNAIRE_SECTIONS[number];
  currentQuestion: typeof QUESTIONNAIRE_SECTIONS[number]['questions'][number];
  visibleQuestions: typeof QUESTIONNAIRE_SECTIONS[number]['questions'];
  skippedQuestions: Set<string>;

  // Navigation
  goNext: () => boolean;  // returns false if at end
  goPrev: () => boolean;
  goToSection: (sectionIndex: number) => void;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;

  // Answers
  setAnswer: (questionNumber: number, value: string | number | boolean | string[]) => void;
  getAnswer: (questionNumber: number) => string | number | boolean | string[] | undefined;

  // Progress
  progress: QuestionnaireProgress;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSectionComplete: boolean;
  isAllComplete: boolean;
}

export function useQuestionnaireState(): UseQuestionnaireReturn {
  const { session, dispatch } = useUser();

  // ─── Core State ────────────────────────────────────────────────
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [nav, setNav] = useState<QuestionnaireNav>({ sectionIndex: 0, questionIndex: 0 });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const hasLoadedRef = useRef(false);

  // ─── Derived: skipped questions based on current answers ───────
  // Returns Set<string> of section-prefixed keys like "q8", "tq16", "gq5"
  const skippedQuestions = getSkippedQuestions(answers);

  // Build the correct section-prefixed key for a question number in a given section
  const buildKey = useCallback((sectionId: SectionId, questionNumber: number): string => {
    if (sectionId === 'tradeoffs') return `tq${questionNumber}`;
    if (sectionId === 'general') return `gq${questionNumber}`;
    return `q${questionNumber}`;
  }, []);

  // Visible questions for a given section (filtered by logic jumps)
  const getVisibleQuestions = useCallback(
    (sectionIndex: number) => {
      const section = QUESTIONNAIRE_SECTIONS[sectionIndex];
      if (!section) return [];
      return section.questions.filter(q => !skippedQuestions.has(buildKey(section.id, q.number)));
    },
    [skippedQuestions, buildKey]
  );

  const currentSection = QUESTIONNAIRE_SECTIONS[nav.sectionIndex];
  const visibleQuestions = getVisibleQuestions(nav.sectionIndex);
  const currentQuestion = visibleQuestions[nav.questionIndex] || visibleQuestions[0];

  // ─── Load from UserContext + localStorage on mount ─────────────
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loaded: AnswerMap = {};
    let hasData = false;

    // 1. Load from UserContext (Supabase-backed)
    if (session.mainModule.demographics) {
      Object.entries(session.mainModule.demographics).forEach(([k, v]) => {
        loaded[k] = v;
        hasData = true;
      });
    }
    if (session.mainModule.dnw) {
      // DNWAnswer[] → flat q{number} keys with severity as the value (1-5 Dealbreaker scale)
      session.mainModule.dnw.forEach(a => {
        loaded[`q${a.questionId}`] = a.severity;
        hasData = true;
      });
    }
    if (session.mainModule.mh) {
      // MHAnswer[] → flat q{number} keys with importance as the value (1-5 Likert scale)
      session.mainModule.mh.forEach(a => {
        loaded[`q${a.questionId}`] = a.importance;
        hasData = true;
      });
    }
    if (session.mainModule.tradeoffAnswers) {
      // Keys already stored with "tq" prefix — load as-is
      Object.entries(session.mainModule.tradeoffAnswers).forEach(([k, v]) => {
        loaded[k] = v;
        hasData = true;
      });
    }
    if (session.mainModule.generalAnswers) {
      // Keys already stored with "gq" prefix — load as-is
      Object.entries(session.mainModule.generalAnswers).forEach(([k, v]) => {
        loaded[k] = v;
        hasData = true;
      });
    }

    // 2. Merge localStorage fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AnswerMap;
        Object.entries(parsed).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && loaded[k] === undefined) {
            loaded[k] = v;
            hasData = true;
          }
        });
      }
    } catch { /* ignore corrupt localStorage */ }

    if (hasData) {
      setAnswers(loaded);
      // Find first unanswered question to resume from
      const skipped = getSkippedQuestions(loaded);
      for (let si = 0; si < QUESTIONNAIRE_SECTIONS.length; si++) {
        const section = QUESTIONNAIRE_SECTIONS[si];
        const prefix = section.id === 'tradeoffs' ? 'tq' : section.id === 'general' ? 'gq' : 'q';
        const visible = section.questions.filter(q => !skipped.has(`${prefix}${q.number}`));
        const firstUnanswered = visible.findIndex(q => loaded[`${prefix}${q.number}`] === undefined);
        if (firstUnanswered >= 0) {
          setNav({ sectionIndex: si, questionIndex: firstUnanswered });
          break;
        }
      }
    }
  }, []); // Run once on mount

  // ─── Persist to localStorage on every answer change ────────────
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch { /* quota exceeded */ }
  }, [answers]);

  // ─── Sync to UserContext (debounced 1500ms) → Supabase ──────────
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    setSaveStatus('saving');

    const timer = setTimeout(() => {
      // ── Section 0: Demographics (Q1-Q34) ──
      // Stored as flat Record<string, string|number|boolean> — matches DemographicAnswers
      const demoAnswers: Record<string, string | number | boolean> = {};
      QUESTIONNAIRE_SECTIONS[0].questions.forEach(q => {
        const key = `q${q.number}`;
        if (answers[key] !== undefined) {
          demoAnswers[key] = answers[key] as string | number | boolean;
        }
      });
      if (Object.keys(demoAnswers).length > 0) {
        dispatch({ type: 'SET_DEMOGRAPHICS', payload: demoAnswers });
        if (session.mainModule.subSectionStatus.demographics === 'not_started') {
          dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: 'demographics', status: 'in_progress' } });
        }
      }

      // ── Section 1: Do Not Wants (Q35-Q67) ──
      // Must convert flat q35: 3 → DNWAnswer{ questionId, value, severity }
      const dnwAnswers: DNWAnswer[] = [];
      const dealLabels = getResponseLabels('Dealbreaker') || [];
      QUESTIONNAIRE_SECTIONS[1].questions.forEach(q => {
        const key = `q${q.number}`;
        const val = answers[key];
        if (val !== undefined && typeof val === 'number') {
          dnwAnswers.push({
            questionId: String(q.number),
            value: dealLabels[val - 1] || String(val),
            severity: val as 1 | 2 | 3 | 4 | 5,
          });
        }
      });
      if (dnwAnswers.length > 0) {
        dispatch({ type: 'SET_DNW', payload: dnwAnswers });
        if (session.mainModule.subSectionStatus.dnw !== 'completed' &&
            session.mainModule.subSectionStatus.dnw !== 'in_progress') {
          dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: 'dnw', status: 'in_progress' } });
        }
      }

      // ── Section 2: Must Haves (Q68-Q100) ──
      // Must convert flat q68: 4 → MHAnswer{ questionId, value, importance }
      const mhAnswers: MHAnswer[] = [];
      const importLabels = getResponseLabels('Likert-Importance') || [];
      QUESTIONNAIRE_SECTIONS[2].questions.forEach(q => {
        const key = `q${q.number}`;
        const val = answers[key];
        if (val !== undefined && typeof val === 'number') {
          mhAnswers.push({
            questionId: String(q.number),
            value: importLabels[val - 1] || String(val),
            importance: val as 1 | 2 | 3 | 4 | 5,
          });
        }
      });
      if (mhAnswers.length > 0) {
        dispatch({ type: 'SET_MH', payload: mhAnswers });
        if (session.mainModule.subSectionStatus.mh !== 'completed' &&
            session.mainModule.subSectionStatus.mh !== 'in_progress') {
          dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: 'mh', status: 'in_progress' } });
        }
      }

      // ── Section 3: Trade-offs (Q1-Q50 from tradeoff module) ──
      // Stored with "tq" prefix to avoid collision with demographics Q1-Q34
      const tradeoffAnswers: Record<string, number> = {};
      QUESTIONNAIRE_SECTIONS[3].questions.forEach(q => {
        const key = `tq${q.number}`;
        const val = answers[key];
        if (val !== undefined && typeof val === 'number') {
          tradeoffAnswers[key] = val;
        }
      });
      if (Object.keys(tradeoffAnswers).length > 0) {
        dispatch({ type: 'SET_TRADEOFFS', payload: tradeoffAnswers });
        if (session.mainModule.subSectionStatus.tradeoffs !== 'completed' &&
            session.mainModule.subSectionStatus.tradeoffs !== 'in_progress') {
          dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: 'tradeoffs', status: 'in_progress' } });
        }
      }

      // ── Section 4: General Questions (Q1-Q50 from general module) ──
      // Stored with "gq" prefix to avoid collision with demographics Q1-Q34
      const genAnswers: Record<string, string | number> = {};
      QUESTIONNAIRE_SECTIONS[4].questions.forEach(q => {
        const key = `gq${q.number}`;
        if (answers[key] !== undefined) {
          genAnswers[key] = answers[key] as string | number;
        }
      });
      if (Object.keys(genAnswers).length > 0) {
        dispatch({ type: 'SET_GENERAL_ANSWERS', payload: genAnswers });
        if (session.mainModule.subSectionStatus.general !== 'completed' &&
            session.mainModule.subSectionStatus.general !== 'in_progress') {
          dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: 'general', status: 'in_progress' } });
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [answers, dispatch, session.mainModule.subSectionStatus]);

  // ─── Answer Management ─────────────────────────────────────────
  // Keys are namespaced by section to avoid collisions:
  //   main_module questions (Q1-Q100): "q1" through "q100" (unique range)
  //   tradeoff questions (Q1-Q50): "tq1" through "tq50"
  //   general questions (Q1-Q50): "gq1" through "gq50"
  const getKey = useCallback((questionNumber: number) => {
    const sectionId = QUESTIONNAIRE_SECTIONS[nav.sectionIndex]?.id;
    if (sectionId === 'tradeoffs') return `tq${questionNumber}`;
    if (sectionId === 'general') return `gq${questionNumber}`;
    return `q${questionNumber}`;
  }, [nav.sectionIndex]);

  const getKeyForSection = useCallback((sectionId: SectionId, questionNumber: number) => {
    if (sectionId === 'tradeoffs') return `tq${questionNumber}`;
    if (sectionId === 'general') return `gq${questionNumber}`;
    return `q${questionNumber}`;
  }, []);

  const setAnswer = useCallback((questionNumber: number, value: string | number | boolean | string[]) => {
    const key = getKey(questionNumber);
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, [getKey]);

  const getAnswer = useCallback((questionNumber: number) => {
    const key = getKey(questionNumber);
    return answers[key];
  }, [answers, getKey]);

  // ─── Navigation ────────────────────────────────────────────────
  const goNext = useCallback((): boolean => {
    const nextQIdx = nav.questionIndex + 1;
    if (nextQIdx < visibleQuestions.length) {
      setNav({ sectionIndex: nav.sectionIndex, questionIndex: nextQIdx });
      return true;
    }
    // Move to next section
    const nextSec = nav.sectionIndex + 1;
    if (nextSec < QUESTIONNAIRE_SECTIONS.length) {
      setNav({ sectionIndex: nextSec, questionIndex: 0 });

      // Mark previous section complete
      const prevSectionId = QUESTIONNAIRE_SECTIONS[nav.sectionIndex].id as SubSection;
      dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: prevSectionId, status: 'completed' } });

      // Unlock next section
      const nextSectionId = QUESTIONNAIRE_SECTIONS[nextSec].id as SubSection;
      if (session.mainModule.subSectionStatus[nextSectionId] === 'locked') {
        dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section: nextSectionId, status: 'not_started' } });
      }

      return true;
    }
    return false; // at the very end
  }, [nav, visibleQuestions.length, dispatch, session.mainModule.subSectionStatus]);

  const goPrev = useCallback((): boolean => {
    if (nav.questionIndex > 0) {
      setNav({ sectionIndex: nav.sectionIndex, questionIndex: nav.questionIndex - 1 });
      return true;
    }
    // Move to previous section's last question
    if (nav.sectionIndex > 0) {
      const prevSec = nav.sectionIndex - 1;
      const prevVisible = getVisibleQuestions(prevSec);
      setNav({ sectionIndex: prevSec, questionIndex: prevVisible.length - 1 });
      return true;
    }
    return false;
  }, [nav, getVisibleQuestions]);

  const goToSection = useCallback((sectionIndex: number) => {
    if (sectionIndex >= 0 && sectionIndex < QUESTIONNAIRE_SECTIONS.length) {
      setNav({ sectionIndex, questionIndex: 0 });
    }
  }, []);

  const goToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    setNav({ sectionIndex, questionIndex });
  }, []);

  // ─── Progress Computation ──────────────────────────────────────
  const sectionProgress = QUESTIONNAIRE_SECTIONS.map((s, si) => {
    const visible = getVisibleQuestions(si);
    const answered = visible.filter(q => {
      const key = getKeyForSection(s.id, q.number);
      return answers[key] !== undefined;
    }).length;
    return { id: s.id, answered, total: visible.length };
  });

  const totalVisible = sectionProgress.reduce((s, p) => s + p.total, 0);
  const answeredCount = sectionProgress.reduce((s, p) => s + p.answered, 0);
  const totalAll = QUESTIONNAIRE_SECTIONS.reduce((s, sec) => s + sec.questions.length, 0);

  const progress: QuestionnaireProgress = {
    answeredCount,
    totalVisible,
    totalAll,
    percentage: totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 0,
    sectionProgress,
  };

  // ─── Position Booleans ─────────────────────────────────────────
  const isFirstQuestion = nav.sectionIndex === 0 && nav.questionIndex === 0;
  const isLastQuestion =
    nav.sectionIndex === QUESTIONNAIRE_SECTIONS.length - 1 &&
    nav.questionIndex >= visibleQuestions.length - 1;

  const currentSectionProgress = sectionProgress[nav.sectionIndex];
  const isSectionComplete =
    currentSectionProgress.answered === currentSectionProgress.total;
  const isAllComplete = answeredCount === totalVisible;

  return {
    answers,
    nav,
    saveStatus,
    currentSection,
    currentQuestion,
    visibleQuestions,
    skippedQuestions,
    goNext,
    goPrev,
    goToSection,
    goToQuestion,
    setAnswer,
    getAnswer,
    progress,
    isFirstQuestion,
    isLastQuestion,
    isSectionComplete,
    isAllComplete,
  };
}
