/**
 * CLUES Intelligence — ProfileSignal → EvaluationMetric Bridge
 *
 * Converts ProfileSignal[] from questionnaire answers into EvaluationMetric[]
 * that the 5-LLM evaluation cascade can consume.
 *
 * This is the MISSING BRIDGE that enables the step-in/step-out architecture:
 * - User does Paragraphical only → Gemini extracts metrics (existing path)
 * - User does Main Module only → THIS bridge converts signals to metrics
 * - User does both → THIS bridge merges both metric sources
 *
 * DOES NOT modify evaluationOrchestrator.ts, GeminiMetricObject, or EvaluationMetric types.
 * Pure function. No side effects, no LLM calls, no network.
 */

import type { EvaluationMetric } from '../types/evaluation';
import type { GeminiMetricObject, DNWAnswers, MHAnswers } from '../types';
import type { ProfileSignal, SignalSource } from './answerAggregator';
import { MODULES } from '../data/modules';
import { getModuleQuestions } from '../data/questions';
import type { QuestionItem } from '../data/questions/types';

// ─── Signal → Metric Conversion ─────────────────────────────────

/**
 * Convert ProfileSignals from questionnaire answers into EvaluationMetrics.
 *
 * Each signal becomes a metric the 5-LLM cascade can score cities against.
 * Metric IDs use "QM" prefix (Questionnaire Metric) to distinguish from
 * Gemini's "M" prefix.
 *
 * @param signals - ProfileSignal[] from answerAggregator
 * @param existingGeminiMetrics - Optional: Gemini metrics to avoid duplicates
 */
export function convertSignalsToMetrics(
  signals: ProfileSignal[],
  existingGeminiMetrics?: GeminiMetricObject[]
): EvaluationMetric[] {
  // Filter out paragraphical signals — those are already Gemini metrics
  const questionnaireSignals = signals.filter(s => s.source !== 'paragraphical');

  if (questionnaireSignals.length === 0) return [];

  // Group signals by moduleId for batch processing
  const byModule = groupBy(questionnaireSignals, s => s.moduleId);

  // Track existing Gemini metric descriptions for dedup
  const geminiDescriptions = new Set(
    (existingGeminiMetrics ?? []).map(m => m.description.toLowerCase())
  );

  const metrics: EvaluationMetric[] = [];
  let metricCounter = 1;

  for (const [moduleId, moduleSignals] of Object.entries(byModule)) {
    // Validate module exists
    if (!MODULES.find(m => m.id === moduleId)) continue;

    for (const signal of moduleSignals) {
      const description = buildMetricDescription(signal);
      if (!description) continue;

      // Skip if Gemini already extracted a metric with a very similar description
      if (geminiDescriptions.has(description.toLowerCase())) continue;

      const metric = signalToMetric(signal, `QM${metricCounter}`, description);
      metrics.push(metric);
      metricCounter++;
    }
  }

  return metrics;
}

/**
 * Merge Gemini-derived metrics with questionnaire-derived metrics.
 * Gemini metrics take priority (they have richer context from paragraphs).
 * Questionnaire metrics fill gaps for categories Gemini didn't cover deeply.
 */
export function mergeAllMetrics(
  geminiMetrics: GeminiMetricObject[],
  questionnaireMetrics: EvaluationMetric[]
): EvaluationMetric[] {
  // Convert GeminiMetricObjects to EvaluationMetrics
  const converted: EvaluationMetric[] = geminiMetrics.map(gm => ({
    id: gm.id,
    fieldId: gm.fieldId,
    description: gm.description,
    category: gm.category,
    source_paragraph: gm.source_paragraph,
    data_type: gm.data_type,
    research_query: gm.research_query,
    threshold: gm.threshold,
  }));

  // Track which categories Gemini covered and how many metrics per category
  const geminiCategoryCounts: Record<string, number> = {};
  for (const m of converted) {
    geminiCategoryCounts[m.category] = (geminiCategoryCounts[m.category] ?? 0) + 1;
  }

  // Add questionnaire metrics, but limit per-category additions to avoid overwhelming
  // categories that Gemini already covered thoroughly
  const addedPerCategory: Record<string, number> = {};

  for (const qm of questionnaireMetrics) {
    const geminiCount = geminiCategoryCounts[qm.category] ?? 0;

    // If Gemini has 10+ metrics for this category, only add high-value questionnaire metrics
    // (DNW dealbreakers and MH requirements always pass through)
    if (geminiCount >= 10) {
      const isDealbreaker = qm.id.includes('dnw') || qm.fieldId.includes('dnw');
      const isRequirement = qm.id.includes('mh') || qm.fieldId.includes('mh');
      if (!isDealbreaker && !isRequirement) continue;
    }

    // Cap questionnaire additions at 15 per category to keep evaluation focused
    const added = addedPerCategory[qm.category] ?? 0;
    if (added >= 15) continue;

    converted.push(qm);
    addedPerCategory[qm.category] = added + 1;
  }

  return converted;
}

// ─── DNW & MH Specialized Converters ─────────────────────────────

/**
 * Convert DNW answers directly into DEALBREAKER EvaluationMetrics.
 * These are high-priority metrics — cities that fail them get eliminated.
 *
 * Called separately from convertSignalsToMetrics because DNW answers
 * carry special dealbreaker semantics that generic signals lose.
 */
export function convertDNWToMetrics(
  dnw: DNWAnswers,
  startId: number = 1
): EvaluationMetric[] {
  const mainQuestions = getModuleQuestions('main_module');
  const metrics: EvaluationMetric[] = [];
  let counter = startId;

  for (const answer of dnw) {
    if (answer.severity < 3) continue; // Only convert moderate+ dealbreakers

    const qNum = parseInt(answer.questionId.replace(/\D/g, ''), 10);
    const question = mainQuestions.find((q: QuestionItem) => q.number === qNum);
    if (!question) continue;

    const severityLabel = DNW_SEVERITY_LABELS[answer.severity] ?? 'important';
    const description = `DEALBREAKER (${severityLabel}): ${question.question}`;

    for (const moduleId of question.modules) {
      metrics.push({
        id: `QM-DNW${counter}`,
        fieldId: `dnw_${answer.questionId}_${moduleId}`,
        description,
        category: moduleId,
        source_paragraph: 0, // Not from paragraphs
        data_type: 'boolean',
        research_query: buildDNWResearchQuery(question.question, answer.value),
        threshold: answer.severity >= 4
          ? { operator: 'gte', value: 70, unit: 'score' } // Hard threshold for severe dealbreakers
          : undefined,
      });
      counter++;
    }
  }

  return metrics;
}

/**
 * Convert MH answers directly into REQUIREMENT EvaluationMetrics.
 * These are positive-signal metrics — cities gain score when they have them.
 */
export function convertMHToMetrics(
  mh: MHAnswers,
  startId: number = 1
): EvaluationMetric[] {
  const mainQuestions = getModuleQuestions('main_module');
  const metrics: EvaluationMetric[] = [];
  let counter = startId;

  for (const answer of mh) {
    if (answer.importance < 3) continue; // Only convert moderate+ requirements

    const qNum = parseInt(answer.questionId.replace(/\D/g, ''), 10);
    const question = mainQuestions.find((q: QuestionItem) => q.number === qNum);
    if (!question) continue;

    const importanceLabel = MH_IMPORTANCE_LABELS[answer.importance] ?? 'important';
    const description = `REQUIREMENT (${importanceLabel}): ${question.question}`;

    for (const moduleId of question.modules) {
      metrics.push({
        id: `QM-MH${counter}`,
        fieldId: `mh_${answer.questionId}_${moduleId}`,
        description,
        category: moduleId,
        source_paragraph: 0,
        data_type: 'ranking',
        research_query: buildMHResearchQuery(question.question, answer.value),
      });
      counter++;
    }
  }

  return metrics;
}

// ─── Build Metrics By Category ──────────────────────────────────

/**
 * Group EvaluationMetrics by category for the orchestrator.
 * This is the format `runEvaluation()` expects: Record<string, EvaluationMetric[]>
 */
export function groupMetricsByCategory(
  metrics: EvaluationMetric[]
): Record<string, EvaluationMetric[]> {
  const grouped: Record<string, EvaluationMetric[]> = {};

  for (const metric of metrics) {
    if (!grouped[metric.category]) {
      grouped[metric.category] = [];
    }
    grouped[metric.category].push(metric);
  }

  return grouped;
}

// ─── Full Pipeline ──────────────────────────────────────────────

/**
 * Complete bridge: takes all available data, produces metricsByCategory
 * ready for evaluationOrchestrator.runEvaluation().
 *
 * Handles ALL entry points:
 * - Paragraphical only → returns Gemini metrics grouped by category
 * - Main Module only → returns questionnaire metrics grouped by category
 * - Both → returns merged metrics grouped by category
 */
export function buildMetricsForEvaluation(params: {
  geminiMetrics?: GeminiMetricObject[];
  signals?: ProfileSignal[];
  dnw?: DNWAnswers;
  mh?: MHAnswers;
}): Record<string, EvaluationMetric[]> {
  const { geminiMetrics, signals, dnw, mh } = params;

  const allMetrics: EvaluationMetric[] = [];

  // 1. Gemini metrics (from Paragraphical, if available)
  const gemini = geminiMetrics ?? [];

  // 2. Questionnaire signal-derived metrics (generic)
  const signalMetrics = signals
    ? convertSignalsToMetrics(signals, gemini)
    : [];

  // 3. DNW dealbreaker metrics (special handling)
  const dnwMetrics = dnw
    ? convertDNWToMetrics(dnw, signalMetrics.length + 1)
    : [];

  // 4. MH requirement metrics (special handling)
  const mhMetrics = mh
    ? convertMHToMetrics(mh, signalMetrics.length + dnwMetrics.length + 1)
    : [];

  // Combine questionnaire metrics
  const questionnaireMetrics = [...signalMetrics, ...dnwMetrics, ...mhMetrics];

  // Merge (Gemini takes priority, questionnaire fills gaps)
  if (gemini.length > 0 && questionnaireMetrics.length > 0) {
    allMetrics.push(...mergeAllMetrics(gemini, questionnaireMetrics));
  } else if (gemini.length > 0) {
    // Paragraphical-only path — convert GeminiMetricObjects to EvaluationMetrics
    allMetrics.push(...gemini.map(gm => ({
      id: gm.id,
      fieldId: gm.fieldId,
      description: gm.description,
      category: gm.category,
      source_paragraph: gm.source_paragraph,
      data_type: gm.data_type,
      research_query: gm.research_query,
      threshold: gm.threshold,
    })));
  } else {
    // Questionnaire-only path — no Gemini at all
    allMetrics.push(...questionnaireMetrics);
  }

  return groupMetricsByCategory(allMetrics);
}

// ─── Internal Helpers ───────────────────────────────────────────

const DNW_SEVERITY_LABELS: Record<number, string> = {
  1: 'mild concern',
  2: 'moderate concern',
  3: 'strong concern',
  4: 'severe dealbreaker',
  5: 'absolute dealbreaker',
};

const MH_IMPORTANCE_LABELS: Record<number, string> = {
  1: 'nice to have',
  2: 'somewhat important',
  3: 'important',
  4: 'very important',
  5: 'essential',
};

/** Map signal source to data_type for EvaluationMetric */
function inferDataType(signal: ProfileSignal): EvaluationMetric['data_type'] {
  if (signal.source === 'dnw') return 'boolean';
  if (signal.source === 'tradeoffs') return 'index';
  if (typeof signal.rawValue === 'boolean') return 'boolean';
  if (typeof signal.rawValue === 'number') return 'numeric';
  return 'ranking';
}

/** Build a human-readable metric description from a ProfileSignal */
function buildMetricDescription(signal: ProfileSignal): string | null {
  const { source, key, rawValue, moduleId } = signal;
  const moduleDef = MODULES.find(m => m.id === moduleId);
  if (!moduleDef) return null;

  // Look up the original question text if possible
  const questionText = lookupQuestionText(signal);

  switch (source) {
    case 'demographics': {
      if (key === 'demo_baseline') return null; // Skip baseline signals
      const field = key.replace('demo_', '');
      return `User demographic: ${field} = ${rawValue} (affects ${moduleDef.shortName})`;
    }
    case 'dnw':
      return questionText
        ? `Dealbreaker concern: ${questionText} (severity: ${rawValue}/5)`
        : `Dealbreaker concern in ${moduleDef.shortName} (severity: ${rawValue}/5)`;
    case 'mh':
      return questionText
        ? `Must-have requirement: ${questionText} (importance: ${rawValue}/5)`
        : `Must-have requirement in ${moduleDef.shortName} (importance: ${rawValue}/5)`;
    case 'tradeoffs':
      return questionText
        ? `Trade-off preference: ${questionText} (position: ${rawValue}/100)`
        : `Trade-off in ${moduleDef.shortName} (position: ${rawValue}/100)`;
    case 'general':
      return questionText
        ? `Lifestyle preference: ${questionText} (answer: ${rawValue})`
        : `Lifestyle preference in ${moduleDef.shortName}`;
    case 'mini_module':
      return questionText
        ? `${moduleDef.shortName} deep-dive: ${questionText} (answer: ${rawValue})`
        : `${moduleDef.shortName} preference signal (value: ${rawValue})`;
    default:
      return null;
  }
}

/** Try to find the original question text for a signal */
function lookupQuestionText(signal: ProfileSignal): string | null {
  const { key, source } = signal;

  // Extract question number from key patterns like "dnw_q35", "general_gq14", "tradeoff_tq5"
  const numMatch = key.match(/(\d+)/);
  if (!numMatch) return null;
  const qNum = parseInt(numMatch[1], 10);

  let moduleId: string;
  switch (source) {
    case 'dnw':
    case 'mh':
    case 'demographics':
      moduleId = 'main_module';
      break;
    case 'general':
      moduleId = 'general_questions';
      break;
    case 'tradeoffs':
      moduleId = 'tradeoff_questions';
      break;
    case 'mini_module':
      moduleId = signal.moduleId;
      break;
    default:
      return null;
  }

  const questions = getModuleQuestions(moduleId);
  const question = questions.find((q: QuestionItem) => q.number === qNum);
  return question?.question ?? null;
}

/** Convert a single ProfileSignal into an EvaluationMetric */
function signalToMetric(
  signal: ProfileSignal,
  id: string,
  description: string
): EvaluationMetric {
  return {
    id,
    fieldId: `${signal.source}_${signal.key}`,
    description,
    category: signal.moduleId,
    source_paragraph: 0, // Not from paragraphs
    data_type: inferDataType(signal),
    research_query: buildResearchQuery(signal, description),
  };
}

/** Build a Tavily research query for a signal-derived metric */
function buildResearchQuery(signal: ProfileSignal, description: string): string {
  const moduleDef = MODULES.find(m => m.id === signal.moduleId);
  const category = moduleDef?.name ?? signal.moduleId;

  // For DNW: research the negative (what to avoid)
  if (signal.source === 'dnw') {
    return `${description.replace('Dealbreaker concern: ', '')} risks by city 2026`;
  }

  // For MH: research the positive (what to find)
  if (signal.source === 'mh') {
    return `${description.replace('Must-have requirement: ', '')} availability by city 2026`;
  }

  // Generic: research the category dimension
  return `${category} quality comparison cities 2026`;
}

function buildDNWResearchQuery(question: string, value: string): string {
  return `${question} ${value} risk level by city country 2026`;
}

function buildMHResearchQuery(question: string, value: string): string {
  return `${question} ${value} availability quality by city country 2026`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}
