/**
 * ReportDownload — Report generation trigger + download/view UI.
 *
 * Conv 21-22: Report Generation.
 * Generates a polished report via Gamma (or PDF fallback), shows progress,
 * and provides download/view links. Supports report versioning.
 *
 * WCAG 2.1 AA: All text ≥ 11px, contrast verified, focus management.
 * Interactive elements ≥ 44px touch targets.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SmartScoreOutput } from '../../types/smartScore';
import type { PipelineResult } from '../../lib/evaluationPipeline';
import type { UserSession } from '../../types';
import { assembleReportData } from '../../lib/reportDataAssembler';
import {
  generateReport,
  getReportVersions,
  getNextVersionNumber,
  type ReportGenerationResult,
  type ReportVersion,
} from '../../lib/gammaReportGenerator';

// ─── Types ──────────────────────────────────────────────────────

interface ReportDownloadProps {
  /** Pipeline result (needed for report assembly) */
  pipelineResult: PipelineResult | null;
  /** User session */
  session: UserSession;
}

type ReportStatus = 'idle' | 'generating' | 'completed' | 'failed';

// ─── Component ──────────────────────────────────────────────────

export function ReportDownload({ pipelineResult, session }: ReportDownloadProps) {
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<ReportGenerationResult | null>(null);
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // Load existing report versions on mount
  useEffect(() => {
    getReportVersions(session.id).then(setVersions);
  }, [session.id]);

  const handleGenerate = useCallback(async () => {
    if (!pipelineResult) return;

    setStatus('generating');
    setResult(null);

    try {
      const version = await getNextVersionNumber(session.id);
      const reportData = assembleReportData(pipelineResult, session, version);
      const generationResult = await generateReport(reportData, setStatusMessage);

      setResult(generationResult);
      setStatus(generationResult.status === 'completed' ? 'completed' : 'failed');

      // Refresh versions list
      const updatedVersions = await getReportVersions(session.id);
      setVersions(updatedVersions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setResult({
        reportId: '',
        gammaUrl: null,
        pdfUrl: null,
        status: 'failed',
        pageCount: null,
        generationTimeMs: 0,
        costUsd: 0,
        error: message,
      });
      setStatus('failed');
    }
  }, [pipelineResult, session]);

  const latestCompleted = versions.find(v => v.status === 'completed');

  return (
    <div style={{
      padding: 'var(--space-6)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glass)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
      }}>
        <h3 style={{
          fontFamily: "'Cormorant', serif",
          fontSize: 'var(--text-xl)',
          fontWeight: 400,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Your Report
        </h3>
        {versions.length > 1 && (
          <button
            onClick={() => setShowVersions(!showVersions)}
            aria-expanded={showVersions}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-xs)',
              color: 'var(--text-accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              minHeight: 44,
              minWidth: 44,
            }}
          >
            {showVersions ? 'Hide' : 'Show'} {versions.length} versions
          </button>
        )}
      </div>

      {/* Generate Button */}
      {status === 'idle' && (
        <div>
          {latestCompleted ? (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <p style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: '0 0 12px 0',
              }}>
                {latestCompleted.gammaUrl
                  ? 'Your Gamma report is ready.'
                  : latestCompleted.pdfUrl
                    ? 'Your PDF report is ready.'
                    : 'Report available.'}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {latestCompleted.gammaUrl && (
                  <a
                    href={latestCompleted.gammaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkButtonStyle}
                  >
                    View Gamma Report
                  </a>
                )}
                {latestCompleted.pdfUrl && (
                  <a
                    href={latestCompleted.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkButtonStyle}
                  >
                    Download PDF
                  </a>
                )}
                {pipelineResult && (
                  <button onClick={handleGenerate} style={secondaryButtonStyle}>
                    Regenerate Report
                  </button>
                )}
              </div>
            </div>
          ) : pipelineResult ? (
            <button onClick={handleGenerate} style={primaryButtonStyle}>
              Generate Report
            </button>
          ) : (
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              margin: 0,
            }}>
              Run the evaluation first to generate your report.
            </p>
          )}
        </div>
      )}

      {/* Generating State */}
      {status === 'generating' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 24,
            height: 24,
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--clues-sapphire, #2563eb)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            flexShrink: 0,
          }} />
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-sm)',
            color: 'var(--text-accent)',
            margin: 0,
          }}>
            {statusMessage || 'Generating report...'}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Completed State */}
      {status === 'completed' && result && (
        <div>
          <p style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 'var(--text-sm)',
            color: 'var(--score-green, #22c55e)',
            margin: '0 0 12px 0',
          }}>
            Report generated successfully
            {result.pageCount ? ` (${result.pageCount} pages)` : ''}
            {` in ${(result.generationTimeMs / 1000).toFixed(1)}s`}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {result.gammaUrl && (
              <a
                href={result.gammaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={linkButtonStyle}
              >
                View Gamma Report
              </a>
            )}
            {result.pdfUrl && (
              <a
                href={result.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={linkButtonStyle}
              >
                Download PDF
              </a>
            )}
            <button onClick={() => setStatus('idle')} style={secondaryButtonStyle}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'failed' && (
        <div>
          <p style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 'var(--text-sm)',
            color: 'var(--clues-orange, #f97316)',
            margin: '0 0 12px 0',
          }}>
            {result?.error ?? 'Report generation failed.'}
          </p>
          <button onClick={handleGenerate} style={primaryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {/* Version History */}
      {showVersions && versions.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-glass)', paddingTop: 'var(--space-3)' }}>
          <h4 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Report History
          </h4>
          {versions.map(v => (
            <div key={v.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-glass)',
            }}>
              <div>
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                }}>
                  v{v.version}
                </span>
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginLeft: 8,
                }}>
                  {v.reportType} — {v.status}
                  {v.pageCount ? ` (${v.pageCount}p)` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {v.gammaUrl && (
                  <a href={v.gammaUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...smallLinkStyle }}>
                    Gamma
                  </a>
                )}
                {v.pdfUrl && (
                  <a href={v.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...smallLinkStyle }}>
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--clues-sapphire, #2563eb)',
  color: '#ffffff',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  minHeight: 44,
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-glass, rgba(255,255,255,0.06))',
  color: 'var(--text-secondary)',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  border: '1px solid var(--border-glass)',
  cursor: 'pointer',
  minHeight: 44,
};

const linkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 24px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--clues-sapphire, #2563eb)',
  color: '#ffffff',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  textDecoration: 'none',
  minHeight: 44,
};

const smallLinkStyle: React.CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 'var(--text-xs)',
  color: 'var(--text-accent)',
  textDecoration: 'none',
  padding: '4px 8px',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
};
