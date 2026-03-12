/**
 * ResultsDataPage — The "Evidence Room"
 * Conv 21-22: Report Generation
 *
 * Shows city profiles, category comparisons, judge verdicts,
 * methodology transparency — all the raw data behind the report.
 *
 * Adapted to work with the pipeline-integrated ReportData type.
 *
 * WCAG 2.1 AA: All text >= 4.5:1 contrast, tables fully accessible,
 * focus management, both dark and light mode compliant.
 */

import { useState, useMemo } from 'react';
import type {
  ReportData,
  CityProfile,
  CategoryComparison,
} from '../../lib/reportDataAssembler';

// ─── Sub-Components ──────────────────────────────────────────

/** Stats overview cards */
function StatsOverview({ data }: { data: ReportData }) {
  const { meta, methodology } = data;
  const cards = [
    { label: 'Total Metrics', value: meta.totalMetrics.toString() },
    { label: 'Cities Evaluated', value: meta.totalCities.toString() },
    { label: 'LLMs Used', value: methodology.llmsUsed.length.toString() },
    { label: 'Eval Waves', value: methodology.evaluationWaves.toString() },
    { label: 'Categories', value: `${methodology.successfulCategories}/${methodology.successfulCategories + methodology.failedCategories.length}` },
    { label: 'Confidence', value: `${meta.confidence}%` },
    { label: 'Total Cost', value: `$${meta.totalCostUsd.toFixed(2)}` },
    { label: 'Duration', value: `${(meta.pipelineDurationMs / 1000).toFixed(1)}s` },
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

/** City Profile Card */
function CityProfileCard({ profile }: { profile: CityProfile }) {
  return (
    <div className="rdp-section" role="region" aria-label={`${profile.location} profile`}>
      <div className="rdp-city-header">
        <span className="rdp-city-rank">#{profile.rank}</span>
        <h4 className="rdp-city-name">{profile.location}, {profile.country}</h4>
        <span className="rdp-city-score">{profile.overallScore.toFixed(1)}</span>
        <span className={`rdp-confidence rdp-confidence--${profile.confidence}`}>
          {profile.confidence}
        </span>
      </div>
      <div className="rdp-city-categories">
        <div className="rdp-city-top">
          <strong>Strengths:</strong>{' '}
          {profile.topCategories.map(c => `${c.name} (${c.score.toFixed(0)})`).join(', ')}
        </div>
        <div className="rdp-city-bottom">
          <strong>Weaknesses:</strong>{' '}
          {profile.bottomCategories.map(c => `${c.name} (${c.score.toFixed(0)})`).join(', ')}
        </div>
      </div>
      <div className="rdp-city-meta">
        {profile.scoredMetrics}/{profile.totalMetrics} metrics scored
        {profile.judgeTrend && ` | Judge trend: ${profile.judgeTrend}`}
      </div>
    </div>
  );
}

/** Category Comparison Table */
function CategoryComparisonTable({ categories, locations }: {
  categories: CategoryComparison[];
  locations: string[];
}) {
  return (
    <div className="rdp-section" role="region" aria-label="Category comparison">
      <h3 className="rdp-section-title">Category Comparison ({categories.length} categories)</h3>
      <div className="rdp-table-wrap">
        <table className="rdp-table" aria-label="Per-category city comparison">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Weight</th>
              {locations.map(loc => (
                <th key={loc} scope="col">{loc}</th>
              ))}
              <th scope="col">Metrics</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.categoryId}>
                <td className="rdp-cat-name">{cat.categoryName}</td>
                <td>{(cat.weight * 100).toFixed(1)}%</td>
                {locations.map(loc => {
                  const cityScore = cat.cityScores.find(cs => cs.location === loc);
                  return (
                    <td key={loc} className="rdp-score-cell">
                      {cityScore ? cityScore.score.toFixed(1) : '—'}
                    </td>
                  );
                })}
                <td>{cat.metricCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    () => reportData.cityProfiles.map(c => c.location),
    [reportData.cityProfiles]
  );

  const categories = useMemo(
    () => reportData.categoryComparison.map(c => ({ id: c.categoryId, name: c.categoryName })),
    [reportData.categoryComparison]
  );

  const filteredCategories = filterCategory
    ? reportData.categoryComparison.filter(c => c.categoryId === filterCategory)
    : reportData.categoryComparison;

  return (
    <div className="rdp-container" role="main" aria-label="Results Data Page">
      {/* Header */}
      <header className="rdp-header">
        <h2 className="rdp-title">Results Data — Evidence Room</h2>
        <p className="rdp-subtitle">
          v{reportData.meta.version} | {reportData.meta.tier} tier |{' '}
          {reportData.meta.entryPath}
        </p>
      </header>

      {/* Stats Overview */}
      <StatsOverview data={reportData} />

      {/* Winner Banner */}
      <div className="rdp-winner-banner" role="status">
        <span className="rdp-winner-label">Winner:</span>
        <span className="rdp-winner-name">
          {reportData.executive.winnerCity}, {reportData.executive.winnerCountry}
        </span>
        <span className="rdp-winner-score">{reportData.executive.winnerScore.toFixed(1)}</span>
        {reportData.executive.isTie && <span className="rdp-tie-badge">TIE</span>}
      </div>

      {/* Key Findings */}
      {reportData.executive.keyFindings.length > 0 && (
        <div className="rdp-section" role="region" aria-label="Key findings">
          <h3 className="rdp-section-title">Key Findings</h3>
          <ul className="rdp-findings-list">
            {reportData.executive.keyFindings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* City Profiles */}
      <div className="rdp-section" role="region" aria-label="City profiles">
        <h3 className="rdp-section-title">City Profiles ({reportData.cityProfiles.length})</h3>
        {reportData.cityProfiles.map(profile => (
          <CityProfileCard key={profile.location} profile={profile} />
        ))}
      </div>

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

      {/* Category Comparison */}
      <CategoryComparisonTable categories={filteredCategories} locations={locations} />

      {/* Judge Section */}
      {reportData.judgeSection && (
        <div className="rdp-section rdp-judge-summary" role="region" aria-label="Judge verdict">
          <h3 className="rdp-section-title">Opus Judge Verdict</h3>
          <div className="rdp-judge-content">
            <p className="rdp-judge-recommendation">
              <strong>Verdict:</strong> {reportData.judgeSection.executiveSummary}
            </p>
            <p>
              Metrics reviewed: {reportData.judgeSection.metricsReviewed} |
              Overridden: {reportData.judgeSection.metricsOverridden}
              {reportData.judgeSection.safeguardTriggered && ' | Safeguard triggered'}
            </p>
            {reportData.judgeSection.keyFactors.length > 0 && (
              <>
                <h4>Key Factors</h4>
                <ul>
                  {reportData.judgeSection.keyFactors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="rdp-judge-outlook">
              <strong>Future Outlook:</strong> {reportData.judgeSection.futureOutlook}
            </p>
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="rdp-section" role="region" aria-label="Methodology">
        <h3 className="rdp-section-title">Methodology</h3>
        <div className="rdp-methodology">
          <p><strong>LLMs:</strong> {reportData.methodology.llmsUsed.join(', ')}</p>
          <p><strong>Data Source:</strong> {reportData.methodology.dataSource}</p>
          <p><strong>Confidence:</strong> {reportData.methodology.confidenceExplanation}</p>
          {reportData.methodology.failedCategories.length > 0 && (
            <p><strong>Failed Categories:</strong> {reportData.methodology.failedCategories.join(', ')}</p>
          )}
        </div>
      </div>

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
