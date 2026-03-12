/**
 * ReportDownload — Download/View/Share Gamma report
 * Conv 21-22: Report Generation
 *
 * Orchestrates the full report generation flow:
 *   1. Assembles ReportData from available session data
 *   2. Shows Results Data Page (evidence room)
 *   3. On user action, fires Gamma report generation
 *   4. Shows download/view/share once complete
 *   5. PDF fallback if Gamma unavailable
 *   6. Report versioning (re-evaluation → new version)
 *
 * WCAG 2.1 AA: Focus management, aria-live for status updates.
 */

import { useState, useCallback, useEffect } from 'react';
import type { SmartScoreOutput } from '../../types/smartScore';
import type { JudgeReport, JudgeOrchestrationResult } from '../../types/judge';
import type { OrchestrationResult } from '../../types/evaluation';
import type { GeminiExtraction, CompletionTier } from '../../types';
import type { CoverageState } from '../../lib/coverageTracker';
import { assembleReportData, type ReportData } from '../../lib/reportDataAssembler';
import {
  generateGammaReport,
  triggerPDFExport,
  getLatestVersion,
  getReportHistory,
  type GammaGenerationResult,
  type ReportStatus,
  type ReportRow,
} from '../../lib/gammaReportGenerator';
import { ResultsDataPage } from './ResultsDataPage';

interface ReportDownloadProps {
  sessionId: string;
  tier: CompletionTier;
  smartScores: SmartScoreOutput;
  geminiExtraction?: GeminiExtraction | null;
  orchestration?: OrchestrationResult | null;
  judgeReport?: JudgeReport | null;
  judgeOrchestration?: JudgeOrchestrationResult | null;
  coverage?: CoverageState | null;
}

export function ReportDownload({
  sessionId,
  tier,
  smartScores,
  geminiExtraction,
  orchestration,
  judgeReport,
  judgeOrchestration,
  coverage,
}: ReportDownloadProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [gammaStatus, setGammaStatus] = useState<ReportStatus | null>(null);
  const [gammaResult, setGammaResult] = useState<GammaGenerationResult | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Assemble report data on mount
  useEffect(() => {
    async function assemble() {
      const latestVersion = await getLatestVersion(sessionId);
      const data = assembleReportData({
        sessionId,
        version: latestVersion + 1,
        tier,
        smartScores,
        geminiExtraction,
        orchestration,
        judgeReport,
        judgeOrchestration,
        coverage,
      });
      setReportData(data);

      // Fetch history
      const history = await getReportHistory(sessionId);
      setReportHistory(history);
    }
    assemble();
  }, [sessionId, tier, smartScores, geminiExtraction, orchestration, judgeReport, judgeOrchestration, coverage]);

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
    const history = await getReportHistory(sessionId);
    setReportHistory(history);
  }, [reportData, sessionId]);

  // PDF fallback
  const handlePDFExport = useCallback(() => {
    if (!reportData) return;
    triggerPDFExport(reportData);
  }, [reportData]);

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
