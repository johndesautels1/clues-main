/**
 * ReportDownload — Download/View/Share Gamma report
 * Conv 21-22: Report Generation
 *
 * Orchestrates the full report generation flow:
 *   1. Assembles ReportData from PipelineResult + Session
 *   2. Shows Results Data Page (evidence room) with metric-by-metric detail
 *   3. On user action, fires Gamma report generation
 *   4. Shows download/view/share once complete
 *   5. PDF fallback if Gamma unavailable
 *   6. Report versioning (re-evaluation -> new version)
 *
 * WCAG 2.1 AA: Focus management, aria-live for status updates.
 */

import { useState, useCallback, useEffect } from 'react';
import type { PipelineResult } from '../../lib/evaluationPipeline';
import type { UserSession } from '../../types';
import { assembleReportData, type ReportData } from '../../lib/reportDataAssembler';
import {
  generateGammaReport,
  triggerPDFExport,
  getNextVersionNumber,
  getReportHistory,
  type GammaGenerationResult,
  type ReportStatus,
  type ReportRow,
} from '../../lib/gammaReportGenerator';
import { ResultsDataPage } from './ResultsDataPage';

interface ReportDownloadProps {
  /** Pipeline result (needed for report assembly) */
  pipelineResult: PipelineResult | null;
  /** User session */
  session: UserSession;
}

export function ReportDownload({ pipelineResult, session }: ReportDownloadProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [gammaStatus, setGammaStatus] = useState<ReportStatus | null>(null);
  const [gammaResult, setGammaResult] = useState<GammaGenerationResult | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Assemble report data when pipeline result is available
  useEffect(() => {
    if (!pipelineResult) return;

    async function assemble() {
      const nextVersion = await getNextVersionNumber(session.id);
      const data = assembleReportData(pipelineResult!, session, nextVersion);
      setReportData(data);

      // Fetch history
      const history = await getReportHistory(session.id);
      setReportHistory(history);
    }
    assemble();
  }, [pipelineResult, session]);

  // Generate Gamma report
  const handleGenerateGamma = useCallback(async () => {
    if (!reportData) return;
    setError(null);
    setGammaStatus('generating');

    const result = await generateGammaReport(reportData, setGammaStatus);
    setGammaResult(result);

    if (!result.success) {
      setError(result.error ?? 'Gamma generation failed');
    }

    // Refresh history
    const history = await getReportHistory(session.id);
    setReportHistory(history);
  }, [reportData, session]);

  // PDF fallback
  const handlePDFExport = useCallback(() => {
    if (!reportData) return;
    triggerPDFExport(reportData);
  }, [reportData]);

  if (!pipelineResult) {
    return (
      <div className="rdp-loading" role="status" aria-label="No pipeline data">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Run the evaluation first to see your report.
        </p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rdp-loading" role="status" aria-label="Assembling report data">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Assembling report data...
        </p>
      </div>
    );
  }

  return (
    <div className="report-download-container">
      {/* Results Data Page — the evidence room */}
      <ResultsDataPage
        reportData={reportData}
        onGenerateGamma={handleGenerateGamma}
        onPDFExport={handlePDFExport}
        gammaLoading={gammaStatus === 'generating'}
        gammaUrl={gammaResult?.gammaUrl}
      />

      {/* Status announcements for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {gammaStatus === 'generating' && 'Generating GAMMA report...'}
        {gammaStatus === 'completed' && 'GAMMA report ready.'}
        {gammaStatus === 'failed' && `Report generation failed: ${error}`}
      </div>

      {/* Error display */}
      {error && (
        <div className="rdp-error" role="alert">
          <p>{error}</p>
          <button
            className="rdp-pdf-fallback-btn"
            onClick={handlePDFExport}
          >
            Export as PDF Instead
          </button>
        </div>
      )}

      {/* Report History */}
      {reportHistory.length > 1 && (
        <div className="rdp-section rdp-history" role="region" aria-label="Report history">
          <h3 className="rdp-section-title">Report Versions</h3>
          <div className="rdp-history-list">
            {reportHistory.map(report => (
              <div key={report.id} className="rdp-history-item">
                <span className="rdp-history-version">v{report.version}</span>
                <span className="rdp-history-type">{report.report_type}</span>
                <span className={`rdp-history-status rdp-history-status--${report.status}`}>
                  {report.status}
                </span>
                <span className="rdp-history-date">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                </span>
                {report.gamma_url && (
                  <a
                    href={report.gamma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rdp-history-link"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
