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
//
// skipKeys use section-prefixed keys to avoid cross-section collisions:
//   "q16"  = demographics Q16 (employment status)
//   "tq16" = tradeoff Q16 (education for children)
//   "gq5"  = general Q5 (family obligations detail)

export interface LogicJump {
  triggerKey: string;      // answer key, e.g. "q8" (demographics Q8: Do you have children?)
  triggerValue: string;    // answer value that triggers the skip
  skipKeys: string[];      // section-prefixed keys to skip
}

export const LOGIC_JUMPS: LogicJump[] = [
  // No partner → skip partner questions
  { triggerKey: 'q5', triggerValue: 'single', skipKeys: ['q6', 'q7'] },

  // No children → skip ALL child-related questions across ALL sections
  { triggerKey: 'q8', triggerValue: 'false', skipKeys: [
    'q9', 'q10', 'q11',          // Demographics: children ages, relocating, special needs
    'q64',                         // DNW: avoid limited education for children
    'q91',                         // MH: good education system (for children)
    'q93',                         // MH: family-friendly environment with child resources
    'tq16',                        // Tradeoff: harsh winters for best education for children
  ]},

  // Not military → skip veteran services
  { triggerKey: 'q14', triggerValue: 'false', skipKeys: ['q15'] },

  // No chronic conditions → skip medical specifics
  { triggerKey: 'q27', triggerValue: 'false', skipKeys: ['q28'] },

  // No pets → skip pet questions across sections
  { triggerKey: 'q30', triggerValue: 'false', skipKeys: ['q31', 'q32', 'q96'] },

  // No family obligations → skip obligation details
  { triggerKey: 'gq4', triggerValue: 'false', skipKeys: ['gq5'] },
];

/** Given current answers, return set of section-prefixed keys to skip */
export function getSkippedQuestions(
  answers: Record<string, string | number | boolean | string[]>
): Set<string> {
  const skipped = new Set<string>();
  for (const jump of LOGIC_JUMPS) {
    const val = answers[jump.triggerKey];
    if (val === undefined) continue;

    const strVal = String(val).toLowerCase();
    if (strVal === jump.triggerValue.toLowerCase()) {
      jump.skipKeys.forEach(k => skipped.add(k));
    }
  }
  return skipped;
}
