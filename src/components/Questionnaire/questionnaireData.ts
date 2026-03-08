/**
 * CLUES Main Module Questionnaire — Data & Configuration
 *
 * Defines the 5 sections (Demographics → DNW → MH → Tradeoffs → General),
 * flattens questions from the split library files, and provides color tokens.
 */

import { mainModuleQuestions } from '../../data/questions/main_module';
import { tradeoffQuestionsQuestions } from '../../data/questions/tradeoff_questions';
import { generalQuestionsQuestions } from '../../data/questions/general_questions';
import { RESPONSE_TYPES } from '../../data/questions/meta';
import type { QuestionItem } from '../../data/questions/types';

// ─── Section Definitions ─────────────────────────────────────────

export type SectionId = 'demographics' | 'dnw' | 'mh' | 'tradeoffs' | 'general';

export interface QuestionnaireSection {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  questions: QuestionItem[];
}

// Extract sections from the split module files
const mainSections = mainModuleQuestions.sections;

export const QUESTIONNAIRE_SECTIONS: QuestionnaireSection[] = [
  {
    id: 'demographics',
    title: 'Demographics',
    subtitle: 'Tell us about yourself — your household, career, and lifestyle basics.',
    icon: '\u{1F464}',
    accent: '#60a5fa',
    questions: mainSections[0].questions, // Q1-Q34
  },
  {
    id: 'dnw',
    title: 'Do Not Wants',
    subtitle: 'What are your absolute deal-breakers? The things you cannot tolerate.',
    icon: '\u{1F6AB}',
    accent: '#ef4444',
    questions: mainSections[1].questions, // Q35-Q67
  },
  {
    id: 'mh',
    title: 'Must Haves',
    subtitle: 'What matters most to you? The non-negotiables for your ideal life.',
    icon: '\u2B50',
    accent: '#22c55e',
    questions: mainSections[2].questions, // Q68-Q100
  },
  {
    id: 'tradeoffs',
    title: 'Trade-offs',
    subtitle: 'Life is about balance. Help us understand your priorities when choices conflict.',
    icon: '\u2696\uFE0F',
    accent: '#f59e0b',
    questions: tradeoffQuestionsQuestions.sections.flatMap(s => s.questions), // 50Q
  },
  {
    id: 'general',
    title: 'General Questions',
    subtitle: 'A few final questions to complete your relocation profile.',
    icon: '\u{1F4AC}',
    accent: '#a855f7',
    questions: generalQuestionsQuestions.sections.flatMap(s => s.questions), // 50Q
  },
];

// Total question count across all sections
export const TOTAL_QUESTIONS = QUESTIONNAIRE_SECTIONS.reduce(
  (sum, s) => sum + s.questions.length, 0
);

// ─── Response Type Helpers ───────────────────────────────────────

/** Get labels for a Likert/Dealbreaker type */
export function getResponseLabels(type: string): string[] | undefined {
  return RESPONSE_TYPES[type]?.labels;
}

/** Extract inline options from question text: "(Select one: a, b, c)" */
export function extractInlineOptions(questionText: string): string[] {
  // First try to match the explicit "Select one/all" parenthetical
  const selectMatch = questionText.match(
    /\(Select (?:one|all that apply)[:\s]*([^)]+)\)/i
  );
  if (selectMatch) {
    return selectMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  // Fallback: match the last parenthetical (skip descriptive ones like "(USD equivalent)")
  const allParens = [...questionText.matchAll(/\(([^)]+)\)/g)];
  if (allParens.length > 0) {
    const last = allParens[allParens.length - 1][1];
    // Only treat as options if it contains commas (multiple choices)
    if (last.includes(',')) {
      return last.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/** Get the clean question text (without the options parenthetical) */
export function getCleanQuestion(questionText: string): string {
  // Remove the "Select one/all: ..." parenthetical specifically
  let cleaned = questionText.replace(/\s*\(Select (?:one|all that apply)[:\s]*[^)]+\)\s*$/i, '');
  // If no Select pattern was found, remove trailing parenthetical with commas (option lists)
  if (cleaned === questionText) {
    cleaned = questionText.replace(/\s*\([^)]*,[^)]+\)\s*$/, '');
  }
  return cleaned.trim();
}

// ─── WCAG-Verified Color Tokens ──────────────────────────────────
// Same token set as Discovery, reused for consistency.

export const C = {
  pageBg: '#0a0e1a',
  cardBg: '#111827',
  inputBg: '#0d1222',
  inputBorder: '#374151',
  divider: '#1f2937',
  textPrimary: '#f9fafb',    // 18.3:1
  textSecondary: '#9ca3af',  // 6.3:1
  textMuted: '#8b95a5',      // 5.2:1
  textAccent: '#60a5fa',     // 5.1:1
  textPlaceholder: '#8b95a5', // 5.2:1
  focusDefault: '#C4A87A',
  gold: '#C4A87A',
  dealbreaker: ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'],
} as const;

// ─── Logic Jump Rules ────────────────────────────────────────────
// Returns questions to SKIP based on a given answer.
// E.g., if "Do you have children?" = No, skip children-related follow-ups.

export interface LogicJump {
  triggerQuestion: number; // question number
  triggerValue: string;    // answer value that triggers the skip
  skipQuestions: number[]; // question numbers to skip
}

export const LOGIC_JUMPS: LogicJump[] = [
  // Demographics logic jumps
  { triggerQuestion: 5, triggerValue: 'single', skipQuestions: [6, 7] }, // No partner → skip partner Qs
  { triggerQuestion: 8, triggerValue: 'false', skipQuestions: [9, 10, 11, 64, 91, 93] }, // No children → skip child Qs + child dealbreakers/must-haves
  { triggerQuestion: 14, triggerValue: 'false', skipQuestions: [15] }, // Not military → skip veteran services Q
  { triggerQuestion: 27, triggerValue: 'false', skipQuestions: [28] }, // No chronic conditions → skip specifics
  { triggerQuestion: 30, triggerValue: 'false', skipQuestions: [31, 32, 96] }, // No pets → skip pet Qs + pet must-have
];

/** Given current answers, return set of question numbers to skip */
export function getSkippedQuestions(
  answers: Record<string, string | number | boolean | string[]>
): Set<number> {
  const skipped = new Set<number>();
  for (const jump of LOGIC_JUMPS) {
    const key = `q${jump.triggerQuestion}`;
    const val = answers[key];
    if (val === undefined) continue;

    const strVal = String(val).toLowerCase();
    if (strVal === jump.triggerValue.toLowerCase()) {
      jump.skipQuestions.forEach(q => skipped.add(q));
    }
  }
  return skipped;
}
