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
// Uses CSS custom properties for automatic dark/light mode switching.
// Dark ratios (vs #0a0e1a): primary 18.4:1, secondary 7.6:1, muted 6.4:1, accent 7.6:1
// Light ratios (vs #ffffff): primary 15.4:1, secondary 7.4:1, muted 5.0:1, accent 5.3:1

export const C = {
  pageBg: 'var(--bg-primary)',
  cardBg: 'var(--bg-secondary)',
  inputBg: 'var(--bg-secondary)',
  inputBorder: 'var(--border-glass)',
  divider: 'var(--border-glass)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textAccent: 'var(--text-accent)',
  textPlaceholder: 'var(--text-muted)',
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
  // ── Partner gating ──────────────────────────────────────────────
  // Single → skip all partner-specific questions across sections
  { triggerKey: 'q5', triggerValue: 'single', skipKeys: [
    'q6', 'q7',                    // Demographics: partner relocate, partner work auth
    'gq2',                         // General: partner/household alignment on priorities
  ]},

  // Partner NOT relocating → skip partner work authorization
  { triggerKey: 'q6', triggerValue: 'false', skipKeys: ['q7'] },

  // ── Children gating ─────────────────────────────────────────────
  // No children → skip ALL child-specific questions across ALL sections
  // NOTE: Q91 ("education for you OR your children") is intentionally NOT
  // skipped — the "(for you)" clause makes it relevant to childless users.
  { triggerKey: 'q8', triggerValue: 'false', skipKeys: [
    'q9', 'q10', 'q11',           // Demographics: children ages, relocating, special needs
    'q64',                         // DNW: avoid limited education for your CHILDREN
    'q93',                         // MH: family-friendly with CHILD-oriented resources
    'tq16',                        // Tradeoff: harsh winters for CHILDREN's education
  ]},

  // ── Military gating ─────────────────────────────────────────────
  // Not military → skip veteran services
  { triggerKey: 'q14', triggerValue: 'false', skipKeys: ['q15'] },

  // ── Health gating ───────────────────────────────────────────────
  // No chronic conditions → skip medical condition specifics
  { triggerKey: 'q27', triggerValue: 'false', skipKeys: ['q28'] },

  // ── Pet gating ──────────────────────────────────────────────────
  // No pets → skip ALL pet-specific questions across ALL sections
  { triggerKey: 'q30', triggerValue: 'false', skipKeys: [
    'q31', 'q32',                  // Demographics: pet types, breed restrictions
    'q96',                         // MH: pet-friendly environment
    'tq48',                        // Tradeoff: accept limited pet-friendliness
  ]},

  // ── Family obligations gating ───────────────────────────────────
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
