/**
 * CLUES Intelligence — Gamma Report Generator
 *
 * Pushes assembled ReportData to the Gamma API for polished 100+ page report
 * generation. Falls back to PDF export if Gamma is unavailable.
 *
 * Flow:
 *   1. Create a pending report row in Supabase
 *   2. Call /api/gamma-report to generate the polished report
 *   3. Update the report row with gamma_url + metadata
 *   4. If Gamma fails, fall back to /api/report-pdf for PDF export
 *
 * The Gamma API generates a beautifully formatted report with:
 *   - Executive summary with winner declaration
 *   - Per-city profiles with category breakdowns
 *   - Head-to-head category comparison tables
 *   - Judge section with override explanations
 *   - Methodology and transparency section
 *   - Source citations
 */

import type { ReportData } from './reportDataAssembler';
import { supabase, isSupabaseConfigured } from './supabase';

// ─── Types ──────────────────────────────────────────────────────

export interface ReportGenerationResult {
  /** Report ID in Supabase */
  reportId: string;
  /** Gamma report URL (null if generation failed) */
  gammaUrl: string | null;
  /** PDF fallback URL (null if not needed or failed) */
  pdfUrl: string | null;
  /** Report status */
  status: 'completed' | 'failed';
  /** Number of pages (estimated) */
  pageCount: number | null;
  /** Generation time in ms */
  generationTimeMs: number;
  /** Cost in USD */
  costUsd: number;
  /** Error message if failed */
  error?: string;
}

export interface ReportVersion {
  id: string;
  version: number;
  reportType: string;
  status: string;
  gammaUrl: string | null;
  pdfUrl: string | null;
  videoUrl: string | null;
  pageCount: number | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────

/** Timeout for Gamma report generation (3 minutes — complex reports take time) */
const GAMMA_TIMEOUT_MS = 180_000;

/** Estimated cost per Gamma report generation */
const GAMMA_COST_PER_REPORT = 0.15;

// ─── Main Generator ─────────────────────────────────────────────

/**
 * Generate a polished report from assembled data.
 *
 * Creates a Supabase report row, calls the Gamma API, and falls back
 * to PDF export if Gamma fails.
 */
export async function generateReport(
  reportData: ReportData,
  onStatus?: (status: string) => void
): Promise<ReportGenerationResult> {
  const startTime = Date.now();
  let reportId = crypto.randomUUID();

  // ─── 1. Create pending report row ────────────────────────────
  onStatus?.('Creating report record...');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        id: reportId,
        session_id: reportData.meta.sessionId,
        report_type: 'gamma',
        version: reportData.meta.version,
        status: 'generating',
      })
      .select('id')
      .single();

    if (!error && data) {
      reportId = data.id;
    }
  }

  // ─── 2. Try Gamma API ────────────────────────────────────────
  onStatus?.('Generating polished report via Gamma...');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GAMMA_TIMEOUT_MS);

    const response = await fetch('/api/gamma-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportData }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const result = await response.json();
      const generationTimeMs = Date.now() - startTime;

      // Update Supabase report row
      if (isSupabaseConfigured) {
        await supabase
          .from('reports')
          .update({
            status: 'completed',
            gamma_url: result.gammaUrl,
            page_count: result.pageCount ?? null,
            generation_time_ms: generationTimeMs,
            cost_usd: GAMMA_COST_PER_REPORT,
          })
          .eq('id', reportId);
      }

      return {
        reportId,
        gammaUrl: result.gammaUrl,
        pdfUrl: null,
        status: 'completed',
        pageCount: result.pageCount ?? null,
        generationTimeMs,
        costUsd: GAMMA_COST_PER_REPORT,
      };
    }

    // Gamma failed — fall through to PDF fallback
    const errText = await response.text();
    console.warn('[GammaReport] Gamma API failed:', errText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[GammaReport] Gamma API error:', message);
  }

  // ─── 3. PDF Fallback ─────────────────────────────────────────
  onStatus?.('Gamma unavailable, generating PDF fallback...');

  try {
    const pdfResponse = await fetch('/api/report-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportData }),
    });

    if (pdfResponse.ok) {
      const pdfResult = await pdfResponse.json();
      const generationTimeMs = Date.now() - startTime;

      if (isSupabaseConfigured) {
        await supabase
          .from('reports')
          .update({
            status: 'completed',
            report_type: 'pdf_fallback',
            pdf_url: pdfResult.pdfUrl,
            page_count: pdfResult.pageCount ?? null,
            generation_time_ms: generationTimeMs,
            cost_usd: 0,
          })
          .eq('id', reportId);
      }

      return {
        reportId,
        gammaUrl: null,
        pdfUrl: pdfResult.pdfUrl,
        status: 'completed',
        pageCount: pdfResult.pageCount ?? null,
        generationTimeMs,
        costUsd: 0,
      };
    }
  } catch (err) {
    console.warn('[GammaReport] PDF fallback also failed:', err);
  }

  // ─── 4. Both failed ──────────────────────────────────────────
  const generationTimeMs = Date.now() - startTime;

  if (isSupabaseConfigured) {
    await supabase
      .from('reports')
      .update({ status: 'failed', generation_time_ms: generationTimeMs })
      .eq('id', reportId);
  }

  return {
    reportId,
    gammaUrl: null,
    pdfUrl: null,
    status: 'failed',
    pageCount: null,
    generationTimeMs,
    costUsd: 0,
    error: 'Both Gamma and PDF generation failed. Please try again later.',
  };
}

// ─── Report Versioning ──────────────────────────────────────────

/**
 * Get all report versions for a session, ordered by version descending.
 */
export async function getReportVersions(
  sessionId: string
): Promise<ReportVersion[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('id, version, report_type, status, gamma_url, pdf_url, video_url, page_count, created_at')
    .eq('session_id', sessionId)
    .order('version', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    version: row.version,
    reportType: row.report_type,
    status: row.status,
    gammaUrl: row.gamma_url,
    pdfUrl: row.pdf_url,
    videoUrl: row.video_url,
    pageCount: row.page_count,
    createdAt: row.created_at,
  }));
}

/**
 * Get the next version number for a session's reports.
 */
export async function getNextVersionNumber(sessionId: string): Promise<number> {
  const versions = await getReportVersions(sessionId);
  return versions.length > 0 ? versions[0].version + 1 : 1;
}
