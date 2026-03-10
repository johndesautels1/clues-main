/**
 * Supabase Normalized Persistence
 * Writes session data to both the JSONB blob (backward compat)
 * AND the normalized tables (paragraphs, questionnaire_answers, module_progress).
 *
 * Read path: still loads from session_data JSONB for fast full-session restore.
 * Write path: dual-writes to JSONB + normalized tables.
 *
 * This ensures:
 *   - Fast session restore (single JSONB read)
 *   - Rich analytics queries (normalized tables)
 *   - Question performance tracking (questionnaire_answers rows)
 *   - Paragraph-level tracking (paragraphs table)
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { UserSession } from '../types';

// ─── Save paragraphs to normalized table ─────────────────────
export async function saveParagraphs(session: UserSession): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!session.paragraphical?.paragraphs?.length) return;

  const rows = session.paragraphical.paragraphs
    .filter(p => p.content.trim().length > 0)
    .map(p => ({
      session_id: session.id,
      paragraph_number: p.id,
      heading: p.heading,
      content: p.content,
      updated_at: p.updatedAt || new Date().toISOString(),
    }));

  if (rows.length === 0) return;

  try {
    await supabase
      .from('paragraphs')
      .upsert(rows, { onConflict: 'session_id,paragraph_number' });
  } catch (err) {
    console.error('[CLUES] Failed to save paragraphs:', err);
  }
}

// ─── Save questionnaire answers to normalized table ──────────
export async function saveQuestionnaireAnswers(
  session: UserSession
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const rows: Array<{
    session_id: string;
    section: string;
    question_number: number;
    question_key: string;
    answer_text?: string | null;
    answer_number?: number | null;
    answer_boolean?: boolean | null;
    answer_array?: string[] | null;
    severity?: number | null;
    importance?: number | null;
    response_type?: string | null;
    answered_at: string;
  }> = [];

  const now = new Date().toISOString();
  const mm = session.mainModule;

  // Demographics (q1 - q34)
  if (mm.demographics) {
    Object.entries(mm.demographics).forEach(([key, value]) => {
      const match = key.match(/^q(\d+)$/);
      if (!match) return;
      const qNum = parseInt(match[1], 10);
      rows.push({
        session_id: session.id,
        section: 'demographics',
        question_number: qNum,
        question_key: key,
        answer_text: typeof value === 'string' ? value : null,
        answer_number: typeof value === 'number' ? value : null,
        answer_boolean: typeof value === 'boolean' ? value : null,
        answer_array: null,
        severity: null,
        importance: null,
        response_type: null,
        answered_at: now,
      });
    });
  }

  // DNW answers
  if (mm.dnw) {
    mm.dnw.forEach(a => {
      rows.push({
        session_id: session.id,
        section: 'dnw',
        question_number: parseInt(a.questionId.replace(/\D/g, ''), 10),
        question_key: `q${a.questionId}`,
        answer_text: a.value,
        answer_number: a.severity,
        answer_boolean: null,
        answer_array: null,
        severity: a.severity,
        importance: null,
        response_type: 'Dealbreaker',
        answered_at: now,
      });
    });
  }

  // MH answers
  if (mm.mh) {
    mm.mh.forEach(a => {
      rows.push({
        session_id: session.id,
        section: 'mh',
        question_number: parseInt(a.questionId.replace(/\D/g, ''), 10),
        question_key: `q${a.questionId}`,
        answer_text: a.value,
        answer_number: a.importance,
        answer_boolean: null,
        answer_array: null,
        severity: null,
        importance: a.importance,
        response_type: 'Likert-Importance',
        answered_at: now,
      });
    });
  }

  // Tradeoff answers
  if (mm.tradeoffAnswers) {
    Object.entries(mm.tradeoffAnswers).forEach(([key, value]) => {
      const match = key.match(/^tq(\d+)$/);
      if (!match) return;
      const qNum = parseInt(match[1], 10);
      rows.push({
        session_id: session.id,
        section: 'tradeoffs',
        question_number: qNum,
        question_key: key,
        answer_text: null,
        answer_number: value,
        answer_boolean: null,
        answer_array: null,
        severity: null,
        importance: null,
        response_type: 'Slider',
        answered_at: now,
      });
    });
  }

  // General answers
  if (mm.generalAnswers) {
    Object.entries(mm.generalAnswers).forEach(([key, value]) => {
      const match = key.match(/^gq(\d+)$/);
      if (!match) return;
      const qNum = parseInt(match[1], 10);
      rows.push({
        session_id: session.id,
        section: 'general',
        question_number: qNum,
        question_key: key,
        answer_text: typeof value === 'string' ? value : null,
        answer_number: typeof value === 'number' ? value : null,
        answer_boolean: null,
        answer_array: null,
        severity: null,
        importance: null,
        response_type: null,
        answered_at: now,
      });
    });
  }

  if (rows.length === 0) return;

  try {
    await supabase
      .from('questionnaire_answers')
      .upsert(rows, { onConflict: 'session_id,question_key' });
  } catch (err) {
    console.error('[CLUES] Failed to save questionnaire answers:', err);
  }
}

// ─── Save module progress to normalized table ────────────────
export async function saveModuleProgress(
  session: UserSession
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const rows: Array<{
    session_id: string;
    module_id: string;
    module_type: string;
    status: string;
    questions_total: number;
    questions_answered: number;
  }> = [];

  const ss = session.mainModule.subSectionStatus;

  // Main module sub-sections
  const mainSections: Array<{ id: string; totalQs: number }> = [
    { id: 'demographics', totalQs: 34 },
    { id: 'dnw', totalQs: 33 },
    { id: 'mh', totalQs: 33 },
    { id: 'tradeoffs', totalQs: 50 },
    { id: 'general', totalQs: 50 },
  ];

  for (const sec of mainSections) {
    const status = ss[sec.id as keyof typeof ss] || 'locked';
    let answered = 0;

    if (sec.id === 'demographics' && session.mainModule.demographics) {
      answered = Object.keys(session.mainModule.demographics).length;
    } else if (sec.id === 'dnw' && session.mainModule.dnw) {
      answered = session.mainModule.dnw.length;
    } else if (sec.id === 'mh' && session.mainModule.mh) {
      answered = session.mainModule.mh.length;
    } else if (sec.id === 'tradeoffs' && session.mainModule.tradeoffAnswers) {
      answered = Object.keys(session.mainModule.tradeoffAnswers).length;
    } else if (sec.id === 'general' && session.mainModule.generalAnswers) {
      answered = Object.keys(session.mainModule.generalAnswers).length;
    }

    rows.push({
      session_id: session.id,
      module_id: sec.id,
      module_type: 'main',
      status,
      questions_total: sec.totalQs,
      questions_answered: answered,
    });
  }

  if (rows.length === 0) return;

  try {
    await supabase
      .from('module_progress')
      .upsert(rows, { onConflict: 'session_id,module_id' });
  } catch (err) {
    console.error('[CLUES] Failed to save module progress:', err);
  }
}

// ─── Save Gemini extraction to normalized tables ─────────────
export async function saveGeminiExtraction(
  session: UserSession
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const extraction = session.paragraphical?.extraction;
  if (!extraction) return;

  try {
    // Upsert extraction metadata
    const { data: extRow, error: extErr } = await supabase
      .from('gemini_extractions')
      .upsert({
        session_id: session.id,
        personality_profile: extraction.personality_profile,
        detected_currency: extraction.detected_currency,
        budget_min: extraction.budget_range?.min,
        budget_max: extraction.budget_range?.max,
        budget_currency: extraction.budget_range?.currency,
        age: extraction.demographic_signals?.age,
        gender: extraction.demographic_signals?.gender,
        household_size: extraction.demographic_signals?.household_size,
        has_children: extraction.demographic_signals?.has_children,
        has_pets: extraction.demographic_signals?.has_pets,
        employment_type: extraction.demographic_signals?.employment_type,
        income_bracket: extraction.demographic_signals?.income_bracket,
        metric_count: extraction.metrics?.length || 0,
        country_count: extraction.recommended_countries?.length || 0,
        city_count: extraction.recommended_cities?.length || 0,
        town_count: extraction.recommended_towns?.length || 0,
        neighborhood_count: extraction.recommended_neighborhoods?.length || 0,
        dnw_signals: extraction.dnw_signals || [],
        mh_signals: extraction.mh_signals || [],
        tradeoff_signals: extraction.tradeoff_signals || [],
        module_relevance: extraction.module_relevance || {},
        globe_region_preference: extraction.globe_region_preference,
        status: 'completed',
      }, { onConflict: 'session_id' })
      .select('id')
      .single();

    if (extErr || !extRow) {
      console.error('[CLUES] Failed to save extraction:', extErr);
      return;
    }

    const extractionId = extRow.id;

    // Save individual metrics
    if (extraction.metrics?.length) {
      const metricRows = extraction.metrics.map(m => ({
        extraction_id: extractionId,
        session_id: session.id,
        metric_id: m.id,
        field_id: m.fieldId,
        description: m.description,
        category: m.category,
        source_paragraph: m.source_paragraph,
        score: m.score,
        data_type: m.data_type,
        user_justification: m.user_justification,
        data_justification: m.data_justification,
        source: m.source,
        research_query: m.research_query,
        threshold_operator: m.threshold?.operator,
        threshold_value: Array.isArray(m.threshold?.value) ? m.threshold.value[0] : m.threshold?.value,
        threshold_value_high: Array.isArray(m.threshold?.value) ? m.threshold.value[1] : null,
        threshold_unit: m.threshold?.unit,
      }));

      // Delete existing metrics for this extraction, then insert fresh
      await supabase
        .from('gemini_metrics')
        .delete()
        .eq('extraction_id', extractionId);

      // Insert in batches of 50 to avoid payload limits
      for (let i = 0; i < metricRows.length; i += 50) {
        const batch = metricRows.slice(i, i + 50);
        await supabase.from('gemini_metrics').insert(batch);
      }
    }

    // Save location recommendations
    const locationRows: Array<Record<string, unknown>> = [];

    extraction.recommended_countries?.forEach((c, i) => {
      locationRows.push({
        extraction_id: extractionId,
        session_id: session.id,
        location_type: 'country',
        location_name: c.name,
        country: c.name,
        iso_code: c.iso_code,
        reasoning: c.reasoning,
        local_currency: c.local_currency,
        rank: i + 1,
      });
    });

    extraction.recommended_cities?.forEach((c, i) => {
      locationRows.push({
        extraction_id: extractionId,
        session_id: session.id,
        location_type: 'city',
        location_name: c.location,
        country: c.country,
        overall_score: c.overall_score,
        rank: i + 1,
        metrics_snapshot: c.metrics || [],
      });
    });

    extraction.recommended_towns?.forEach((t, i) => {
      locationRows.push({
        extraction_id: extractionId,
        session_id: session.id,
        location_type: 'town',
        location_name: t.location,
        country: t.country,
        parent_location: t.parent,
        overall_score: t.overall_score,
        rank: i + 1,
        metrics_snapshot: t.metrics || [],
      });
    });

    extraction.recommended_neighborhoods?.forEach((n, i) => {
      locationRows.push({
        extraction_id: extractionId,
        session_id: session.id,
        location_type: 'neighborhood',
        location_name: n.location,
        country: n.country,
        parent_location: n.parent,
        overall_score: n.overall_score,
        rank: i + 1,
        metrics_snapshot: n.metrics || [],
      });
    });

    if (locationRows.length > 0) {
      await supabase
        .from('location_recommendations')
        .delete()
        .eq('extraction_id', extractionId);
      await supabase.from('location_recommendations').insert(locationRows);
    }

    // Save paragraph summaries
    if (extraction.paragraph_summaries?.length) {
      const summaryRows = extraction.paragraph_summaries.map(ps => ({
        extraction_id: extractionId,
        session_id: session.id,
        paragraph_number: ps.id,
        key_themes: ps.key_themes || [],
        extracted_preferences: ps.extracted_preferences || [],
        metrics_derived: ps.metrics_derived || [],
      }));

      await supabase
        .from('paragraph_summaries')
        .delete()
        .eq('extraction_id', extractionId);
      await supabase.from('paragraph_summaries').insert(summaryRows);
    }

    // Save thinking steps
    if (extraction.thinking_details?.length) {
      const thinkingRows = extraction.thinking_details.map(ts => ({
        extraction_id: extractionId,
        session_id: session.id,
        step_number: ts.step,
        thought: ts.thought,
        conclusion: ts.conclusion,
      }));

      await supabase
        .from('thinking_steps')
        .delete()
        .eq('extraction_id', extractionId);
      await supabase.from('thinking_steps').insert(thinkingRows);
    }
  } catch (err) {
    console.error('[CLUES] Failed to save Gemini extraction:', err);
  }
}

// ─── Master save: writes all normalized tables ───────────────
// Called alongside the JSONB session save for dual-write.
export async function saveNormalizedData(session: UserSession): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Fire all saves in parallel — they're independent
  await Promise.allSettled([
    saveParagraphs(session),
    saveQuestionnaireAnswers(session),
    saveModuleProgress(session),
    saveGeminiExtraction(session),
  ]);
}
