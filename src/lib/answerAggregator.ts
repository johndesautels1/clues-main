/**
 * CLUES Intelligence — Answer Aggregator
 *
 * Merges all 7 data sources into a single AggregatedProfile that
 * downstream systems (evaluation pipeline, report generator) consume.
 *
 * Sources (in collection order):
 * 1. Paragraphical — 30 free-form paragraphs + Gemini extraction
 * 2. Demographics — structured personal data (q1-q34)
 * 3. DNW — Dealbreaker severity ratings (q35-q67)
 * 4. MH — Must-have importance ratings (q68-q100)
 * 5. Tradeoffs — 50 slider comparisons (tq1-tq50)
 * 6. General — lifestyle/preference questions (gq1-gq50)
 * 7. Mini Modules — 100 questions each across up to 23 modules
 *
 * Pure function. No side effects, no LLM calls, no network.
 */

import { MODULES } from '../data/modules';
import { getModuleQuestions } from '../data/questions';
import type { QuestionItem } from '../data/questions/types';
import type {
  UserSession,
  GeminiExtraction,
  DemographicAnswers,
  DNWAnswers,
  MHAnswers,
  TradeoffAnswers,
  GeneralAnswers,
  CompletionTier,
} from '../types';

// ─── Types ────────────────────────────────────────────────────────

/** Signal extracted from any answer source */
export interface ProfileSignal {
  /** Which of the 23 category modules this signal affects */
  moduleId: string;

  /** Signal key (e.g., "dnw_q35_severity", "demo_has_children", "metric_M14") */
  key: string;

  /** Normalized value (0-1 scale where applicable) */
  value: number;

  /** Where this signal came from */
  source: SignalSource;

  /** How confident we are in this signal (0-1) */
  confidence: number;

  /** Original raw value (for debugging/display) */
  rawValue: string | number | boolean;
}

export type SignalSource =
  | 'paragraphical'
  | 'demographics'
  | 'dnw'
  | 'mh'
  | 'tradeoffs'
  | 'general'
  | 'mini_module';

/** Per-module aggregated data */
export interface ModuleProfile {
  moduleId: string;
  moduleName: string;

  /** All signals affecting this module, sorted by confidence desc */
  signals: ProfileSignal[];

  /** Average signal value (0-1) — the user's affinity to this dimension */
  avgSignalValue: number;

  /** Number of data points from all sources */
  dataPointCount: number;

  /** Source breakdown: how many signals from each source */
  sourceBreakdown: Record<SignalSource, number>;

  /** Is this module completed (all 100 mini module questions answered)? */
  isComplete: boolean;
}

/** The unified profile — single object for all downstream consumers */
export interface AggregatedProfile {
  /** Session ID for tracing */
  sessionId: string;

  /** Current completion tier */
  tier: CompletionTier;

  /** Confidence (0-100) */
  confidence: number;

  /** Per-module aggregated profiles (23 entries) */
  modules: ModuleProfile[];

  /** Flat list of all signals (for cross-module analysis) */
  allSignals: ProfileSignal[];

  /** Total data points across all sources */
  totalDataPoints: number;

  /** Source-level counts */
  sourceCounts: Record<SignalSource, number>;

  /** Which modules are completed */
  completedModuleIds: string[];

  /** Globe region preference (if set) */
  globeRegion: string | null;

  /** Aggregation timestamp */
  aggregatedAt: string;
}

// ─── Main Aggregator ─────────────────────────────────────────────

/**
 * Build the unified profile from the current session state.
 * Reads mini module answers from localStorage (only source for those).
 */
export function aggregateProfile(session: UserSession): AggregatedProfile {
  const allSignals: ProfileSignal[] = [];

  // 1. Paragraphical signals
  if (session.paragraphical.extraction) {
    allSignals.push(...extractParagraphicalSignals(session.paragraphical.extraction));
  }

  // 2. Demographic signals
  if (session.mainModule.demographics) {
    allSignals.push(...extractDemographicSignals(session.mainModule.demographics));
  }

  // 3. DNW signals
  if (session.mainModule.dnw) {
    allSignals.push(...extractDNWSignals(session.mainModule.dnw));
  }

  // 4. MH signals
  if (session.mainModule.mh) {
    allSignals.push(...extractMHSignals(session.mainModule.mh));
  }

  // 5. Tradeoff signals
  if (session.mainModule.tradeoffAnswers) {
    allSignals.push(...extractTradeoffSignals(session.mainModule.tradeoffAnswers));
  }

  // 6. General signals
  if (session.mainModule.generalAnswers) {
    allSignals.push(...extractGeneralSignals(session.mainModule.generalAnswers));
  }

  // 7. Mini module signals (from localStorage)
  for (const mod of MODULES) {
    const moduleSignals = extractMiniModuleSignals(mod.id);
    allSignals.push(...moduleSignals);
  }

  // ─── Build per-module profiles ──────────────────────────────
  const moduleProfiles: ModuleProfile[] = MODULES.map(mod => {
    const signals = allSignals.filter(s => s.moduleId === mod.id);
    signals.sort((a, b) => b.confidence - a.confidence);

    const sourceBreakdown: Record<SignalSource, number> = {
      paragraphical: 0, demographics: 0, dnw: 0, mh: 0,
      tradeoffs: 0, general: 0, mini_module: 0,
    };
    for (const s of signals) {
      sourceBreakdown[s.source]++;
    }

    const avgSignalValue = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.value, 0) / signals.length
      : 0;

    return {
      moduleId: mod.id,
      moduleName: mod.name,
      signals,
      avgSignalValue,
      dataPointCount: signals.length,
      sourceBreakdown,
      isComplete: session.completedModules.includes(mod.id),
    };
  });

  // ─── Source-level totals ────────────────────────────────────
  const sourceCounts: Record<SignalSource, number> = {
    paragraphical: 0, demographics: 0, dnw: 0, mh: 0,
    tradeoffs: 0, general: 0, mini_module: 0,
  };
  for (const s of allSignals) {
    sourceCounts[s.source]++;
  }

  return {
    sessionId: session.id,
    tier: session.currentTier,
    confidence: session.confidence,
    modules: moduleProfiles,
    allSignals,
    totalDataPoints: allSignals.length,
    sourceCounts,
    completedModuleIds: [...session.completedModules],
    globeRegion: session.globe?.region ?? null,
    aggregatedAt: new Date().toISOString(),
  };
}

// ─── Source Extractors ───────────────────────────────────────────

/** Extract signals from Gemini extraction (100-250 metrics) */
function extractParagraphicalSignals(extraction: GeminiExtraction): ProfileSignal[] {
  const signals: ProfileSignal[] = [];

  // Metric signals (each metric belongs to a category/module)
  for (const metric of extraction.metrics ?? []) {
    signals.push({
      moduleId: metric.category,
      key: `metric_${metric.id}`,
      value: metric.score / 100, // Normalize 0-100 → 0-1
      source: 'paragraphical',
      confidence: 0.7, // Gemini extraction confidence
      rawValue: metric.score,
    });
  }

  // Module relevance weights
  for (const [moduleId, relevance] of Object.entries(extraction.module_relevance)) {
    signals.push({
      moduleId,
      key: `relevance_${moduleId}`,
      value: relevance,
      source: 'paragraphical',
      confidence: 0.8,
      rawValue: relevance,
    });
  }

  // DNW signals from paragraph text
  if (extraction.dnw_signals) {
    for (const signal of extraction.dnw_signals) {
      // Spread across matching modules using keyword matching
      for (const mod of MODULES) {
        if (signal.toLowerCase().includes(mod.shortName.toLowerCase())) {
          signals.push({
            moduleId: mod.id,
            key: `para_dnw_${signal.slice(0, 30)}`,
            value: 0.7, // Strong negative signal
            source: 'paragraphical',
            confidence: 0.5,
            rawValue: signal,
          });
        }
      }
    }
  }

  // MH signals from paragraph text
  if (extraction.mh_signals) {
    for (const signal of extraction.mh_signals) {
      for (const mod of MODULES) {
        if (signal.toLowerCase().includes(mod.shortName.toLowerCase())) {
          signals.push({
            moduleId: mod.id,
            key: `para_mh_${signal.slice(0, 30)}`,
            value: 0.7,
            source: 'paragraphical',
            confidence: 0.5,
            rawValue: signal,
          });
        }
      }
    }
  }

  return signals;
}

/** Extract signals from demographic answers */
function extractDemographicSignals(demo: DemographicAnswers): ProfileSignal[] {
  const signals: ProfileSignal[] = [];

  // Map known demographic fields to modules
  const demoRules: Array<{ key: string; test: (v: unknown) => boolean; moduleId: string; value: number }> = [
    { key: 'has_children', test: v => v === true || v === 'true' || v === 'yes', moduleId: 'family_children', value: 0.8 },
    { key: 'has_pets', test: v => v === true || v === 'true' || v === 'yes', moduleId: 'pets_animals', value: 0.8 },
    { key: 'employment', test: v => v === 'remote', moduleId: 'technology_connectivity', value: 0.7 },
    { key: 'employment', test: v => v === 'retired', moduleId: 'health_wellness', value: 0.6 },
    { key: 'relationship', test: v => typeof v === 'string' && ['married', 'partnered'].includes(v), moduleId: 'housing_property', value: 0.5 },
  ];

  for (const rule of demoRules) {
    const rawValue = demo[rule.key];
    if (rawValue !== undefined && rule.test(rawValue)) {
      signals.push({
        moduleId: rule.moduleId,
        key: `demo_${rule.key}`,
        value: rule.value,
        source: 'demographics',
        confidence: 0.9, // Demographics are factual
        rawValue: rawValue as string | number | boolean,
      });
    }
  }

  // All demographics contribute a baseline signal to every module
  const demoCount = Object.keys(demo).length;
  if (demoCount > 0) {
    for (const mod of MODULES) {
      signals.push({
        moduleId: mod.id,
        key: 'demo_baseline',
        value: Math.min(1, demoCount / 34), // Normalize by total demo questions
        source: 'demographics',
        confidence: 0.3,
        rawValue: demoCount,
      });
    }
  }

  return signals;
}

/** Extract signals from Dealbreaker answers */
function extractDNWSignals(dnw: DNWAnswers): ProfileSignal[] {
  const signals: ProfileSignal[] = [];
  const mainQuestions = getModuleQuestions('main_module');

  for (const answer of dnw) {
    const qNum = parseInt(answer.questionId.replace(/\D/g, ''), 10);
    const question = mainQuestions.find((q: QuestionItem) => q.number === qNum);
    const moduleIds = question?.modules ?? [];
    const normalizedSeverity = answer.severity / 5; // 1-5 → 0.2-1.0

    for (const moduleId of moduleIds) {
      signals.push({
        moduleId,
        key: `dnw_${answer.questionId}`,
        value: normalizedSeverity,
        source: 'dnw',
        confidence: 0.85,
        rawValue: answer.severity,
      });
    }
  }

  return signals;
}

/** Extract signals from Must-Have answers */
function extractMHSignals(mh: MHAnswers): ProfileSignal[] {
  const signals: ProfileSignal[] = [];
  const mainQuestions = getModuleQuestions('main_module');

  for (const answer of mh) {
    const qNum = parseInt(answer.questionId.replace(/\D/g, ''), 10);
    const question = mainQuestions.find((q: QuestionItem) => q.number === qNum);
    const moduleIds = question?.modules ?? [];
    const normalizedImportance = answer.importance / 5;

    for (const moduleId of moduleIds) {
      signals.push({
        moduleId,
        key: `mh_${answer.questionId}`,
        value: normalizedImportance,
        source: 'mh',
        confidence: 0.75,
        rawValue: answer.importance,
      });
    }
  }

  return signals;
}

/** Extract signals from tradeoff slider values */
function extractTradeoffSignals(tradeoffs: TradeoffAnswers): ProfileSignal[] {
  const signals: ProfileSignal[] = [];
  const tradeoffQuestions = getModuleQuestions('tradeoff_questions');

  for (const [key, sliderValue] of Object.entries(tradeoffs)) {
    const qNum = parseInt(key.replace(/\D/g, ''), 10);
    const question = tradeoffQuestions.find((q: QuestionItem) => q.number === qNum);
    const moduleIds = question?.modules ?? [];
    const strength = Math.abs(sliderValue - 50) / 50;

    for (const moduleId of moduleIds) {
      signals.push({
        moduleId,
        key: `tradeoff_${key}`,
        value: strength,
        source: 'tradeoffs',
        confidence: 0.6,
        rawValue: sliderValue,
      });
    }
  }

  return signals;
}

/** Extract signals from general answers */
function extractGeneralSignals(general: GeneralAnswers): ProfileSignal[] {
  const signals: ProfileSignal[] = [];
  const generalQuestions = getModuleQuestions('general_questions');

  for (const [key, value] of Object.entries(general)) {
    const qNum = parseInt(key.replace(/\D/g, ''), 10);
    const question = generalQuestions.find((q: QuestionItem) => q.number === qNum);
    const moduleIds = question?.modules ?? [];

    // Normalize answer value to 0-1
    let normalized = 0.5;
    if (typeof value === 'number') {
      normalized = Math.min(1, Math.max(0, value / 10)); // Assume 0-10 scale
    } else if (value === 'yes' || value === 'true') {
      normalized = 0.8;
    } else if (value === 'no' || value === 'false') {
      normalized = 0.2;
    }

    for (const moduleId of moduleIds) {
      signals.push({
        moduleId,
        key: `general_${key}`,
        value: normalized,
        source: 'general',
        confidence: 0.5,
        rawValue: value,
      });
    }
  }

  return signals;
}

/** Extract signals from a mini module's localStorage answers */
function extractMiniModuleSignals(moduleId: string): ProfileSignal[] {
  const signals: ProfileSignal[] = [];

  try {
    const stored = localStorage.getItem(`clues-module-${moduleId}`);
    if (!stored) return signals;

    const answers = JSON.parse(stored) as Record<string, string | number | boolean | string[]>;
    const keys = Object.keys(answers).filter(k => k.startsWith(`${moduleId}__q`));

    for (const key of keys) {
      const rawValue = answers[key];
      let normalized = 0.5;

      if (typeof rawValue === 'number') {
        // Slider (0-100) or Likert (1-5)
        normalized = rawValue <= 5 ? rawValue / 5 : rawValue / 100;
      } else if (typeof rawValue === 'boolean') {
        normalized = rawValue ? 0.8 : 0.2;
      } else if (rawValue === 'true' || rawValue === 'yes') {
        normalized = 0.8;
      } else if (rawValue === 'false' || rawValue === 'no') {
        normalized = 0.2;
      } else if (Array.isArray(rawValue)) {
        normalized = Math.min(1, rawValue.length / 5); // Multi-select: more = stronger
      } else if (typeof rawValue === 'string' && rawValue.length > 0) {
        normalized = 0.6; // Has text answer
      }

      signals.push({
        moduleId,
        key: `mini_${key}`,
        value: normalized,
        source: 'mini_module',
        confidence: 0.9, // Direct, focused answer
        rawValue: Array.isArray(rawValue) ? rawValue.join(', ') : rawValue,
      });
    }
  } catch {
    // localStorage read failure — skip silently
  }

  return signals;
}
