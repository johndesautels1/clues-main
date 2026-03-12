/**
 * CLUES Intelligence — Gamma Report Generator
 * Conv 21-22: Report Generation
 *
 * Pushes assembled ReportData to the Gamma API to produce the
 * polished 100+ page report. Also handles:
 *   - PDF export fallback (if Gamma is unavailable)
 *   - Client-side print-to-PDF fallback (triggerPDFExport)
 *   - Report versioning (re-evaluation -> new version)
 *   - Supabase `reports` table persistence
 *
 * Flow: Results Data Page -> user clicks "Generate Report" -> this fires.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { ReportData } from './reportDataAssembler';

// ─── Types ───────────────────────────────────────────────────

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type ReportType = 'results_data' | 'llm_analysis' | 'gamma' | 'pdf_fallback';

/** Row shape for the Supabase `reports` table */
export interface ReportRow {
  id?: string;
  session_id: string;
  evaluation_id?: string | null;
  report_type: ReportType;
  version: number;
  status: ReportStatus;
  report_data_json?: ReportData;
  gamma_url?: string | null;
  pdf_url?: string | null;
  video_url?: string | null;
  page_count?: number | null;
  generation_time_ms?: number | null;
  cost_usd?: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Result from the Gamma report generation pipeline */
export interface GammaGenerationResult {
  success: boolean;
  gammaUrl?: string;
  pdfUrl?: string;
  pageCount?: number;
  generationTimeMs?: number;
  costUsd?: number;
  error?: string;
  reportId?: string;
}

/** Report version for history display */
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

// ─── Constants ───────────────────────────────────────────────

/** Timeout for Gamma report generation (3 minutes) */
const GAMMA_TIMEOUT_MS = 180_000;

/** Estimated cost per Gamma report generation */
const GAMMA_COST_PER_REPORT = 0.15;

// ─── Supabase Persistence ────────────────────────────────────

/**
 * Save or update a report row in Supabase.
 * On first call, creates the row with status='pending'.
 * On subsequent calls, updates status, URLs, etc.
 */
export async function saveReportRow(row: ReportRow): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  if (row.id) {
    const { error } = await supabase
      .from('reports')
      .update({
        status: row.status,
        gamma_url: row.gamma_url,
        pdf_url: row.pdf_url,
        page_count: row.page_count,
        generation_time_ms: row.generation_time_ms,
        cost_usd: row.cost_usd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (error) console.error('[GammaReport] Update error:', error.message);
    return row.id;
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      session_id: row.session_id,
      evaluation_id: row.evaluation_id,
      report_type: row.report_type,
      version: row.version,
      status: row.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[GammaReport] Insert error:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Get the latest report version for a session.
 * Returns 0 if no reports exist.
 */
export async function getLatestVersion(sessionId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { data, error } = await supabase
    .from('reports')
    .select('version')
    .eq('session_id', sessionId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;
  return data.version;
}

/**
 * Get all report versions for a session, ordered by version descending.
 */
export async function getReportVersions(sessionId: string): Promise<ReportVersion[]> {
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

/**
 * Get all report versions for a session (alias for backward compat).
 */
export async function getReportHistory(sessionId: string): Promise<ReportRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('session_id', sessionId)
    .order('version', { ascending: false });

  if (error) {
    console.error('[GammaReport] History fetch error:', error.message);
    return [];
  }

  return (data ?? []) as ReportRow[];
}

// ─── Gamma API Integration ──────────────────────────────────

/**
 * Build the Gamma API payload from ReportData.
 * Structures sections for the 100+ page report.
 */
function buildGammaPayload(reportData: ReportData): Record<string, unknown> {
  const { winner, rankings, categoryRollups, metricLines, stats, currency, judgeExecutiveSummary } = reportData;

  const sections: Record<string, unknown>[] = [];

  // Cover page
  sections.push({
    type: 'cover',
    title: `CLUES Intelligence Report — ${winner.location}, ${winner.country}`,
    subtitle: `Comprehensive ${stats.totalMetrics}-Metric Analysis`,
    version: `v${reportData.version}`,
    date: reportData.assembledAt,
    currency: currency.detected,
  });

  // Executive Summary
  if (judgeExecutiveSummary) {
    sections.push({
      type: 'executive_summary',
      recommendation: judgeExecutiveSummary.recommendation,
      rationale: judgeExecutiveSummary.rationale,
      keyFactors: judgeExecutiveSummary.keyFactors,
      futureOutlook: judgeExecutiveSummary.futureOutlook,
    });
  }

  // Rankings overview
  sections.push({
    type: 'rankings',
    winner: winner,
    allRankings: rankings,
    totalLocations: stats.totalLocations,
  });

  // Per-category sections (one section per category)
  for (const cat of categoryRollups) {
    const categoryMetrics = metricLines.filter(m => m.category === cat.categoryId);
    sections.push({
      type: 'category',
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      weight: cat.weight,
      locationScores: cat.locationScores,
      confidence: cat.confidence,
      metrics: categoryMetrics.map(m => ({
        id: m.metricId,
        description: m.description,
        locationScores: m.locationScores.map(ls => ({
          location: ls.location,
          score: ls.score,
          rawConsensus: ls.rawConsensusScore,
        })),
        stdDev: m.stdDev,
        confidence: m.confidenceLevel,
        sources: m.sources,
        judgeOverridden: m.judgeOverridden,
        judgeExplanation: m.judgeExplanation,
      })),
      judgeAnalysis: cat.judgeAnalysis,
      trendNotes: cat.trendNotes,
    });
  }

  // Evaluation pipeline stats
  sections.push({
    type: 'pipeline_stats',
    llmStatus: reportData.llmStatus,
    stats,
    entryPoints: reportData.entryPoints,
  });

  // Paragraph summaries (if available)
  if (reportData.paragraphSummaries && reportData.paragraphSummaries.length > 0) {
    sections.push({
      type: 'paragraph_analysis',
      summaries: reportData.paragraphSummaries,
    });
  }

  return {
    title: `CLUES Intelligence — ${winner.location}`,
    sections,
    theme: 'midnight',
    format: 'presentation',
  };
}

/**
 * Generate a polished Gamma report from assembled data.
 *
 * 1. Creates Supabase report row
 * 2. Calls /api/gamma-generate edge function
 * 3. Falls back to /api/report-pdf if Gamma fails
 * 4. Updates Supabase with results
 */
export async function generateGammaReport(
  reportData: ReportData,
  onStatusChange?: (status: ReportStatus) => void
): Promise<GammaGenerationResult> {
  const startTime = Date.now();

  // 1. Create pending report row
  const reportRowId = await saveReportRow({
    session_id: reportData.sessionId,
    report_type: 'gamma',
    version: reportData.version,
    status: 'pending',
  });

  onStatusChange?.('generating');

  if (reportRowId) {
    await saveReportRow({
      id: reportRowId,
      session_id: reportData.sessionId,
      report_type: 'gamma',
      version: reportData.version,
      status: 'generating',
    });
  }

  try {
    // 2. Build payload
    const payload = buildGammaPayload(reportData);

    // 3. Call Gamma API via edge function
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GAMMA_TIMEOUT_MS);

    const response = await fetch('/api/gamma-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: reportData.sessionId,
        reportId: reportData.reportId,
        payload,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const result = await response.json();
      const generationTimeMs = Date.now() - startTime;

      if (reportRowId) {
        await saveReportRow({
          id: reportRowId,
          session_id: reportData.sessionId,
          report_type: 'gamma',
          version: reportData.version,
          status: 'completed',
          gamma_url: result.url,
          page_count: result.pageCount,
          generation_time_ms: generationTimeMs,
          cost_usd: GAMMA_COST_PER_REPORT,
        });
      }

      onStatusChange?.('completed');

      return {
        success: true,
        gammaUrl: result.url,
        pageCount: result.pageCount,
        generationTimeMs,
        costUsd: GAMMA_COST_PER_REPORT,
        reportId: reportRowId ?? undefined,
      };
    }

    const errText = await response.text();
    console.warn('[GammaReport] Gamma API failed:', errText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[GammaReport] Gamma API error:', errorMessage);
  }

  // 4. PDF API fallback
  try {
    const pdfResponse = await fetch('/api/report-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportData }),
    });

    if (pdfResponse.ok) {
      const pdfResult = await pdfResponse.json();
      const generationTimeMs = Date.now() - startTime;

      if (reportRowId) {
        await saveReportRow({
          id: reportRowId,
          session_id: reportData.sessionId,
          report_type: 'pdf_fallback',
          version: reportData.version,
          status: 'completed',
          pdf_url: pdfResult.pdfUrl,
          page_count: pdfResult.pageCount ?? null,
          generation_time_ms: generationTimeMs,
          cost_usd: 0,
        });
      }

      onStatusChange?.('completed');

      return {
        success: true,
        pdfUrl: pdfResult.pdfUrl,
        pageCount: pdfResult.pageCount ?? undefined,
        generationTimeMs,
        costUsd: 0,
        reportId: reportRowId ?? undefined,
      };
    }
  } catch (err) {
    console.warn('[GammaReport] PDF API fallback also failed:', err);
  }

  // 5. Both APIs failed
  const generationTimeMs = Date.now() - startTime;

  if (reportRowId) {
    await saveReportRow({
      id: reportRowId,
      session_id: reportData.sessionId,
      report_type: 'gamma',
      version: reportData.version,
      status: 'failed',
      generation_time_ms: generationTimeMs,
    });
  }

  onStatusChange?.('failed');

  return {
    success: false,
    error: 'Both Gamma and PDF API generation failed. Use "Export as PDF" for client-side fallback.',
    generationTimeMs,
    reportId: reportRowId ?? undefined,
  };
}

// ─── PDF Export Fallback (Client-Side) ───────────────────────

/**
 * Generate a PDF export as fallback when both Gamma and PDF APIs are unavailable.
 * Uses the browser's print-to-PDF via window.print() on a styled hidden container.
 */
export function triggerPDFExport(reportData: ReportData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('[PDFExport] Popup blocked — cannot open print window');
    return;
  }

  const { winner, rankings, stats, currency } = reportData;

  const metricsHtml = reportData.metricLines.map(m => {
    const scores = m.locationScores
      .map(ls => `<td>${ls.score.toFixed(1)}</td>`)
      .join('');
    const sourceLinks = m.sources
      .map(s => `<a href="${encodeURI(s.url)}" target="_blank" rel="noopener noreferrer">${s.name}</a>`)
      .join(', ');
    return `<tr>
      <td>${m.metricId}</td>
      <td>${m.description}</td>
      <td>${m.category}</td>
      ${scores}
      <td>${m.stdDev.toFixed(1)}</td>
      <td>${m.confidenceLevel}</td>
      <td>${m.judgeOverridden ? 'Yes' : 'No'}</td>
      <td>${sourceLinks || '\u2014'}</td>
    </tr>`;
  }).join('\n');

  const locationHeaders = reportData.metricLines[0]?.locationScores
    .map(ls => `<th>${ls.location}</th>`)
    .join('') ?? '';

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CLUES Intelligence Report — ${winner.location}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; color: #1a1a2e; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem; }
    h2 { font-size: 1.125rem; margin-top: 2rem; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.75rem; }
    th, td { border: 1px solid #d1d5db; padding: 0.375rem 0.5rem; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0; }
    .stat-card { border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.75rem; text-align: center; }
    .stat-card .value { font-size: 1.25rem; font-weight: 700; color: #1e40af; }
    .stat-card .label { font-size: 0.75rem; color: #6b7280; }
    a { color: #2563eb; }
    @media print { body { margin: 0.5cm; } }
  </style>
</head>
<body>
  <h1>CLUES Intelligence Report — ${winner.location}, ${winner.country}</h1>
  <p>Version ${reportData.version} | ${new Date(reportData.assembledAt).toLocaleDateString()} | Currency: ${currency.detected}</p>

  <h2>Evaluation Overview</h2>
  <div class="stat-grid">
    <div class="stat-card"><div class="value">${stats.totalMetrics}</div><div class="label">Total Metrics</div></div>
    <div class="stat-card"><div class="value">${stats.totalLocations}</div><div class="label">Locations</div></div>
    <div class="stat-card"><div class="value">${stats.totalLLMSuccesses}/${stats.totalLLMCalls}</div><div class="label">LLM Success Rate</div></div>
    <div class="stat-card"><div class="value">${(stats.overallMOE * 100).toFixed(1)}%</div><div class="label">Margin of Error</div></div>
  </div>

  <h2>Rankings</h2>
  <table>
    <thead><tr><th>Rank</th><th>Location</th><th>Country</th><th>Score</th><th>Confidence</th></tr></thead>
    <tbody>${rankings.map(r => `<tr><td>#${r.rank}</td><td>${r.location}</td><td>${r.country}</td><td>${r.overallScore.toFixed(1)}</td><td>${r.confidence}</td></tr>`).join('')}</tbody>
  </table>

  <h2>Metric Details (${reportData.metricLines.length} metrics)</h2>
  <table>
    <thead><tr><th>ID</th><th>Description</th><th>Category</th>${locationHeaders}<th>\u03C3</th><th>Confidence</th><th>Judge Override</th><th>Sources</th></tr></thead>
    <tbody>${metricsHtml}</tbody>
  </table>
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

// ─── Results Data Report (Supabase) ──────────────────────────

/**
 * Save the assembled ReportData to Supabase as a 'results_data' report.
 * This is the "evidence room" data persisted before Gamma generation.
 */
export async function saveResultsDataReport(
  reportData: ReportData
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      session_id: reportData.sessionId,
      report_type: 'results_data' as ReportType,
      version: reportData.version,
      status: 'completed' as ReportStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ResultsData] Save error:', error.message);
    return null;
  }

  return data?.id ?? null;
}
