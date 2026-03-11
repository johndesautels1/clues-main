/**
 * MetricDetailTable — Per-metric scores, sources, confidence dots, judge badges.
 *
 * Conv 17-18: Results Page Assembly.
 * Renders a table of MetricSmartScores for a given category.
 * Shows metric ID, description, score with color, source count,
 * confidence dots (color + text label), and judge override badge.
 *
 * Expandable rows reveal user justification, data justification,
 * raw value, and source citations.
 *
 * WCAG 2.1 AA: All text >= 11px, 4.5:1 contrast, focus-visible, aria-expanded.
 */

import { useState } from 'react';
import type { MetricSmartScore, ConfidenceLevel } from '../../types/smartScore';
import './Results.css';

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--score-green, #22c55e)';
  if (score >= 60) return 'var(--score-blue, #3b82f6)';
  if (score >= 40) return 'var(--score-yellow, #eab308)';
  if (score >= 20) return 'var(--score-orange, #f97316)';
  return 'var(--score-red, #f87171)';
}

function confidenceDotColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'unanimous': return 'var(--score-green, #22c55e)';
    case 'strong': return 'var(--text-accent, #60a5fa)';
    case 'moderate': return 'var(--clues-gold, #f59e0b)';
    case 'split': return 'var(--score-red, #f87171)';
  }
}

function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'unanimous': return 'Unanimous';
    case 'strong': return 'Strong';
    case 'moderate': return 'Moderate';
    case 'split': return 'Split';
  }
}

interface MetricDetailTableProps {
  metrics: MetricSmartScore[];
  cityName?: string;
}

export function MetricDetailTable({ metrics, cityName }: MetricDetailTableProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  if (!metrics || metrics.length === 0) {
    return (
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        padding: '8px 0',
      }}>
        No metrics scored in this category.
      </div>
    );
  }

  return (
    <div className="metric-table" role="table" aria-label={`Metric scores${cityName ? ` for ${cityName}` : ''}`}>
      {/* Header row */}
      <div className="metric-table__head" role="rowgroup">
        <div className="metric-table__head-row" role="row">
          <span className="metric-table__head-cell" role="columnheader">ID</span>
          <span className="metric-table__head-cell" role="columnheader">Metric</span>
          <span className="metric-table__head-cell" role="columnheader" style={{ textAlign: 'center' }}>Score</span>
          <span className="metric-table__head-cell" role="columnheader">Sources</span>
          <span className="metric-table__head-cell" role="columnheader" style={{ textAlign: 'center' }}>Confidence</span>
        </div>
      </div>

      {/* Metric rows */}
      <div role="rowgroup">
        {metrics.map(metric => {
          const isExpanded = expandedMetric === metric.metric_id;

          return (
            <div key={metric.metric_id}>
              <button
                className="metric-table__row"
                role="row"
                aria-expanded={isExpanded}
                onClick={() => setExpandedMetric(isExpanded ? null : metric.metric_id)}
                style={{ width: '100%', cursor: 'pointer' }}
              >
                <span className="metric-table__id" role="cell">{metric.metric_id}</span>
                <span className="metric-table__desc" role="cell">
                  {metric.description}
                  {metric.judgeOverridden && (
                    <span className="metric-table__judge-badge" title="Score adjusted by Opus Judge">
                      <span aria-hidden="true">&#x2696;</span> Judge
                    </span>
                  )}
                </span>
                <span
                  className="metric-table__score"
                  role="cell"
                  style={{ color: getScoreColor(metric.score) }}
                >
                  {metric.score}
                </span>
                <span className="metric-table__sources" role="cell">
                  {metric.sources.length} source{metric.sources.length !== 1 ? 's' : ''}
                </span>
                <span className="metric-table__confidence" role="cell">
                  <span
                    className="metric-table__confidence-dot"
                    style={{ background: confidenceDotColor(metric.confidence) }}
                    aria-hidden="true"
                  />
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 'var(--text-xs)',
                    color: confidenceDotColor(metric.confidence),
                  }}>
                    {confidenceLabel(metric.confidence)}
                  </span>
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  padding: '12px 16px 16px',
                  background: 'rgba(96, 165, 250, 0.04)',
                  borderBottom: '1px solid var(--border-glass)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {/* Raw value */}
                    {metric.rawValue && (
                      <div style={{
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: 2,
                        }}>Raw Value</div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}>{metric.rawValue}</div>
                      </div>
                    )}

                    {/* Consensus vs Judge */}
                    <div style={{
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}>
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                      }}>Scoring</div>
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                      }}>
                        Consensus: <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: getScoreColor(metric.rawConsensusScore),
                        }}>{metric.rawConsensusScore}</span>
                        {metric.judgeOverridden && (
                          <>
                            {' → '}Judge: <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600,
                              color: getScoreColor(metric.judgeScore ?? metric.score),
                            }}>{metric.judgeScore ?? metric.score}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Judge explanation */}
                  {metric.judgeOverridden && metric.judgeExplanation && (
                    <div style={{
                      padding: '8px 10px',
                      background: 'rgba(192, 132, 252, 0.06)',
                      border: '1px solid rgba(192, 132, 252, 0.2)',
                      borderRadius: 6,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--score-purple, #c084fc)',
                        letterSpacing: '0.04em',
                        marginBottom: 4,
                      }}>
                        &#x2696; Opus Judge Override
                      </div>
                      <p style={{
                        fontFamily: "'Crimson Pro', Georgia, serif",
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        margin: 0,
                      }}>
                        {metric.judgeExplanation}
                      </p>
                    </div>
                  )}

                  {/* Dual score */}
                  {metric.dualScore && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                          marginBottom: 2,
                        }}>Legal Score</div>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          color: getScoreColor(metric.dualScore.legalScore),
                        }}>{metric.dualScore.legalScore}</span>
                      </div>
                      <div style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                          marginBottom: 2,
                        }}>Enforcement Score</div>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          color: getScoreColor(metric.dualScore.enforcementScore),
                        }}>{metric.dualScore.enforcementScore}</span>
                      </div>
                    </div>
                  )}

                  {/* Source citations */}
                  {metric.sources.length > 0 && (
                    <div>
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}>Sources</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {metric.sources.map((src, i) => (
                          <div key={i} style={{
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 6,
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                          }}>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-accent)',
                                textDecoration: 'none',
                              }}
                            >
                              &#x1F517; {src.name}
                            </a>
                            {src.excerpt && (
                              <p style={{
                                fontFamily: "'Crimson Pro', Georgia, serif",
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                                margin: '3px 0 0',
                              }}>
                                &ldquo;{src.excerpt}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* StdDev + contributing models */}
                  <div style={{
                    marginTop: 10,
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}>
                    <span>StdDev: {metric.stdDev.toFixed(1)}</span>
                    <span>Models: {metric.contributingModels.join(', ')}</span>
                    <span>P{metric.source_paragraph}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
