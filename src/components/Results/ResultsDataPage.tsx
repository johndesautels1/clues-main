/**
 * ResultsDataPage — The "Evidence Room"
 * Conv 21-22: Report Generation
 *
 * Shows line-by-line field metrics, per-LLM scores, success/fail counts,
 * standard deviations, confidence levels, Opus adjustments, source citations
 * with clickable URLs, section rollups, and total evaluation stats.
 *
 * This page MUST exist BEFORE Gamma report can be fired.
 * The user reviews raw math here, then clicks "Generate GAMMA Report".
 *
 * WCAG 2.1 AA: All text ≥ 4.5:1 contrast, tables fully accessible,
 * focus management, both dark and light mode compliant.
 */

import { useState, useMemo } from 'react';
import type { ReportData, ReportMetricLine, ReportCategoryRollup, LLMStatusEntry } from '../../lib/reportDataAssembler';

// ─── Sub-Components ──────────────────────────────────────────

/** Stats overview cards */
function StatsOverview({ stats }: {
  stats: ReportData['stats'];
}) {
  const cards = [
    { label: 'Total Metrics', value: stats.totalMetrics.toString() },
    { label: 'Scored Metrics', value: stats.totalScoredMetrics.toString() },
    { label: 'Locations', value: stats.totalLocations.toString() },
    { label: 'Categories', value: `${stats.successfulCategories}/${stats.totalCategories}` },
    { label: 'LLM Success', value: `${stats.totalLLMSuccesses}/${stats.totalLLMCalls}` },
    { label: 'Margin of Error', value: `${(stats.overallMOE * 100).toFixed(1)}%` },
    { label: 'Judge Overrides', value: `${stats.metricsOverriddenByJudge}/${stats.metricsReviewedByJudge}` },
    { label: 'Total Cost', value: `$${stats.totalCostUsd.toFixed(2)}` },
  ];

  return (
    <div className="rdp-stats-grid" role="region" aria-label="Evaluation statistics">
      {cards.map(card => (
        <div key={card.label} className="rdp-stat-card">
          <span className="rdp-stat-value">{card.value}</span>
          <span className="rdp-stat-label">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

/** LLM Status Table */
function LLMStatusTable({ llmStatus }: { llmStatus: LLMStatusEntry[] }) {
  if (llmStatus.length === 0) return null;

  return (
    <div className="rdp-section" role="region" aria-label="LLM status breakdown">
      <h3 className="rdp-section-title">LLM Pipeline Status</h3>
      <div className="rdp-table-wrap">
        <table className="rdp-table" aria-label="Per-LLM evaluation results">
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Categories</th>
              <th scope="col">Metrics Scored</th>
              <th scope="col">Avg Duration</th>
              <th scope="col">Cost</th>
              <th scope="col">Errors</th>
            </tr>
          </thead>
          <tbody>
            {llmStatus.map(llm => (
              <tr key={llm.model}>
                <td className="rdp-model-name">{llm.model}</td>
                <td>
                  <span className={llm.categoriesSucceeded === llm.categoriesAttempted ? 'rdp-badge-success' : 'rdp-badge-warn'}>
                    {llm.categoriesSucceeded}/{llm.categoriesAttempted}
                  </span>
                </td>
                <td>{llm.totalMetricsScored}</td>
                <td>{(llm.avgDurationMs / 1000).toFixed(1)}s</td>
                <td>${llm.totalCostUsd.toFixed(3)}</td>
                <td>{llm.errors.length > 0 ? llm.errors.length : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Category Rollup Section */
function CategoryRollupSection({ rollups, locations }: {
  rollups: ReportCategoryRollup[];
  locations: string[];
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <div className="rdp-section" role="region" aria-label="Category rollups">
      <h3 className="rdp-section-title">Category Rollups ({rollups.length} categories)</h3>
      <div className="rdp-table-wrap">
        <table className="rdp-table" aria-label="Per-category score rollups">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Weight</th>
              {locations.map(loc => (
                <th key={loc} scope="col">{loc}</th>
              ))}
              <th scope="col">Avg σ</th>
              <th scope="col">Confidence</th>
              <th scope="col">Metrics</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map(cat => (
              <tr
                key={cat.categoryId}
                className={expandedCat === cat.categoryId ? 'rdp-row-expanded' : ''}
                onClick={() => setExpandedCat(expandedCat === cat.categoryId ? null : cat.categoryId)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-expanded={expandedCat === cat.categoryId}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedCat(expandedCat === cat.categoryId ? null : cat.categoryId);
                  }
                }}
              >
                <td className="rdp-cat-name">{cat.categoryName}</td>
                <td>{(cat.weight * 100).toFixed(1)}%</td>
                {locations.map(loc => {
                  const locScore = cat.locationScores.find(ls => ls.location === loc);
                  return (
                    <td key={loc} className="rdp-score-cell">
                      {locScore ? locScore.score.toFixed(1) : '—'}
                    </td>
                  );
                })}
                <td>{cat.avgStdDev.toFixed(1)}</td>
                <td>
                  <span className={`rdp-confidence rdp-confidence--${cat.confidence}`}>
                    {cat.confidence}
                  </span>
                </td>
                <td>{cat.scoredMetricCount}/{cat.metricCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Metric Lines Table — the core evidence */
function MetricLinesTable({ metricLines, locations, filterCategory }: {
  metricLines: ReportMetricLine[];
  locations: string[];
  filterCategory: string | null;
}) {
  const filtered = filterCategory
    ? metricLines.filter(m => m.category === filterCategory)
    : metricLines;

  return (
    <div className="rdp-section" role="region" aria-label="Metric details">
      <h3 className="rdp-section-title">
        Metric Evidence ({filtered.length} metrics)
        {filterCategory && (
          <span className="rdp-filter-badge"> — {filterCategory}</span>
        )}
      </h3>
      <div className="rdp-table-wrap">
        <table className="rdp-table rdp-table--metrics" aria-label="Line-by-line metric scores">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Description</th>
              <th scope="col">Category</th>
              {locations.map(loc => (
                <th key={loc} scope="col">{loc}</th>
              ))}
              <th scope="col">σ</th>
              <th scope="col">Conf</th>
              <th scope="col">Judge</th>
              <th scope="col">Sources</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(metric => (
              <MetricRow key={metric.metricId} metric={metric} locations={locations} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Single metric row with expandable per-LLM scores */
function MetricRow({ metric, locations }: {
  metric: ReportMetricLine;
  locations: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={metric.judgeOverridden ? 'rdp-row-overridden' : ''}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <td className="rdp-metric-id">{metric.metricId}</td>
        <td className="rdp-metric-desc">{metric.description}</td>
        <td className="rdp-metric-cat">{metric.category}</td>
        {locations.map(loc => {
          const ls = metric.locationScores.find(s => s.location === loc);
          return (
            <td key={loc} className="rdp-score-cell">
              {ls ? ls.score.toFixed(1) : '—'}
            </td>
          );
        })}
        <td className={metric.stdDev > 15 ? 'rdp-high-sigma' : ''}>{metric.stdDev.toFixed(1)}</td>
        <td>
          <span className={`rdp-confidence rdp-confidence--${metric.confidenceLevel}`}>
            {metric.confidenceLevel}
          </span>
        </td>
        <td>{metric.judgeOverridden ? `${metric.judgeScore?.toFixed(0)}` : '—'}</td>
        <td className="rdp-sources-cell">
          {metric.sources.length > 0 ? (
            metric.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rdp-source-link"
                title={s.excerpt}
                onClick={(e) => e.stopPropagation()}
              >
                {s.name}
              </a>
            ))
          ) : '—'}
        </td>
      </tr>
      {expanded && (
        <tr className="rdp-expanded-row">
          <td colSpan={locations.length + 7}>
            <div className="rdp-expanded-content">
              {metric.judgeOverridden && metric.judgeExplanation && (
                <div className="rdp-judge-note">
                  <strong>Judge Override:</strong> {metric.judgeExplanation}
                </div>
              )}
              <div className="rdp-per-llm-grid">
                {metric.locationScores.map(ls => (
                  <div key={ls.location} className="rdp-per-llm-location">
                    <strong>{ls.location}</strong>
                    <span className="rdp-raw-score">Raw consensus: {ls.rawConsensusScore.toFixed(1)}</span>
                    {ls.perLLMScores.length > 0 && (
                      <div className="rdp-llm-scores">
                        {ls.perLLMScores.map((llm, i) => (
                          <span key={i} className="rdp-llm-score-chip">
                            {llm.model.split('-')[0]}: {llm.score.toFixed(0)}
                            <span className="rdp-llm-conf">({(llm.confidence * 100).toFixed(0)}%)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {metric.rawValue && (
                <div className="rdp-raw-value">Raw value: {metric.rawValue}</div>
              )}
              <div className="rdp-contributing">
                Contributing models: {metric.contributingModels.join(', ')}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface ResultsDataPageProps {
  reportData: ReportData;
  onGenerateGamma: () => void;
  gammaLoading?: boolean;
  gammaUrl?: string | null;
}

export function ResultsDataPage({
  reportData,
  onGenerateGamma,
  gammaLoading = false,
  gammaUrl = null,
}: ResultsDataPageProps) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const locations = useMemo(
    () => reportData.rankings.map(r => r.location),
    [reportData.rankings]
  );

  const categories = useMemo(
    () => reportData.categoryRollups.map(c => ({ id: c.categoryId, name: c.categoryName })),
    [reportData.categoryRollups]
  );

  return (
    <div className="rdp-container" role="main" aria-label="Results Data Page">
      {/* Header */}
      <header className="rdp-header">
        <h2 className="rdp-title">Results Data — Evidence Room</h2>
        <p className="rdp-subtitle">
          v{reportData.version} | {reportData.entryPoints.tier} tier |{' '}
          {reportData.entryPoints.paragraphical ? 'Paragraphical' : ''}
          {reportData.entryPoints.paragraphical && reportData.entryPoints.mainModule ? ' + ' : ''}
          {reportData.entryPoints.mainModule ? 'Main Module' : ''}
          {reportData.entryPoints.judgeInvoked ? ' + Opus Judge' : ''}
        </p>
      </header>

      {/* Stats Overview */}
      <StatsOverview stats={reportData.stats} />

      {/* Winner Banner */}
      <div className="rdp-winner-banner" role="status">
        <span className="rdp-winner-label">Winner:</span>
        <span className="rdp-winner-name">
          {reportData.winner.location}, {reportData.winner.country}
        </span>
        <span className="rdp-winner-score">{reportData.winner.overallScore.toFixed(1)}</span>
        {reportData.winner.isTie && <span className="rdp-tie-badge">TIE</span>}
      </div>

      {/* LLM Status */}
      <LLMStatusTable llmStatus={reportData.llmStatus} />

      {/* Category Filter */}
      <div className="rdp-filter-bar" role="toolbar" aria-label="Category filter">
        <button
          className={`rdp-filter-btn ${filterCategory === null ? 'rdp-filter-btn--active' : ''}`}
          onClick={() => setFilterCategory(null)}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`rdp-filter-btn ${filterCategory === cat.id ? 'rdp-filter-btn--active' : ''}`}
            onClick={() => setFilterCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Category Rollups */}
      <CategoryRollupSection rollups={reportData.categoryRollups} locations={locations} />

      {/* Metric Lines — Core Evidence */}
      <MetricLinesTable
        metricLines={reportData.metricLines}
        locations={locations}
        filterCategory={filterCategory}
      />

      {/* Judge Executive Summary */}
      {reportData.judgeExecutiveSummary && (
        <div className="rdp-section rdp-judge-summary" role="region" aria-label="Judge executive summary">
          <h3 className="rdp-section-title">Opus Judge Executive Summary</h3>
          <div className="rdp-judge-content">
            <p className="rdp-judge-recommendation">
              <strong>Recommendation:</strong> {reportData.judgeExecutiveSummary.recommendation}
            </p>
            <p>{reportData.judgeExecutiveSummary.rationale}</p>
            <h4>Key Factors</h4>
            <ul>
              {reportData.judgeExecutiveSummary.keyFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <p className="rdp-judge-outlook">
              <strong>Future Outlook:</strong> {reportData.judgeExecutiveSummary.futureOutlook}
            </p>
          </div>
        </div>
      )}

      {/* Generate Gamma Button */}
      <div className="rdp-actions">
        {gammaUrl ? (
          <a
            href={gammaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rdp-gamma-btn rdp-gamma-btn--done"
          >
            View GAMMA Report
          </a>
        ) : (
          <button
            className="rdp-gamma-btn"
            onClick={onGenerateGamma}
            disabled={gammaLoading}
            aria-busy={gammaLoading}
          >
            {gammaLoading ? 'Generating GAMMA Report...' : 'Generate GAMMA Report'}
          </button>
        )}
      </div>
    </div>
  );
}
