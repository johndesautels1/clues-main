/**
 * CategoryBreakdown — Collapsible category sections with comparison bars.
 *
 * Conv 17-18: Results Page Assembly.
 * For each of the 23 categories, shows:
 *  - Category name, icon, aggregate score, confidence dot, metric count
 *  - Comparison bars across cities when expanded
 *  - Embedded MetricDetailTable for the winning city's metrics in that category
 *  - Judge analysis if available
 *
 * WCAG 2.1 AA: aria-expanded, focus-visible, 4.5:1 contrast, no color-only.
 */

import { useState } from 'react';
import type { CitySmartScore, CategorySmartScore, ConfidenceLevel } from '../../types/smartScore';
import { MetricDetailTable } from './MetricDetailTable';
import './Results.css';

const CATEGORY_ICONS: Record<string, string> = {
  safety_security: '\u{1F6E1}',
  health_wellness: '\u{1FA7A}',
  climate_weather: '\u{2600}',
  legal_immigration: '\u{2696}',
  financial_banking: '\u{1F4B0}',
  housing_property: '\u{1F3E0}',
  professional_career: '\u{1F4BC}',
  technology_connectivity: '\u{1F4F6}',
  transportation_mobility: '\u{1F68C}',
  education_learning: '\u{1F393}',
  social_values_governance: '\u{1F3DB}',
  food_dining: '\u{1F37D}',
  shopping_services: '\u{1F6CD}',
  outdoor_recreation: '\u{26F0}',
  entertainment_nightlife: '\u{1F3B6}',
  family_children: '\u{1F46A}',
  neighborhood_urban_design: '\u{1F3D9}',
  environment_community_appearance: '\u{1F333}',
  religion_spirituality: '\u{1F54C}',
  sexual_beliefs_practices_laws: '\u{1F3F3}',
  arts_culture: '\u{1F3A8}',
  cultural_heritage_traditions: '\u{1F3DB}',
  pets_animals: '\u{1F43E}',
};

const CATEGORY_LABELS: Record<string, string> = {
  safety_security: 'Safety & Security',
  health_wellness: 'Health & Wellness',
  climate_weather: 'Climate & Weather',
  legal_immigration: 'Legal & Immigration',
  financial_banking: 'Financial & Banking',
  housing_property: 'Housing & Property',
  professional_career: 'Professional & Career',
  technology_connectivity: 'Technology & Connectivity',
  transportation_mobility: 'Transportation & Mobility',
  education_learning: 'Education & Learning',
  social_values_governance: 'Social Values & Governance',
  food_dining: 'Food & Dining',
  shopping_services: 'Shopping & Services',
  outdoor_recreation: 'Outdoor & Recreation',
  entertainment_nightlife: 'Entertainment & Nightlife',
  family_children: 'Family & Children',
  neighborhood_urban_design: 'Neighborhood & Urban Design',
  environment_community_appearance: 'Environment & Community',
  religion_spirituality: 'Religion & Spirituality',
  sexual_beliefs_practices_laws: 'Laws, Rights & Beliefs',
  arts_culture: 'Arts & Culture',
  cultural_heritage_traditions: 'Cultural Heritage',
  pets_animals: 'Pets & Animals',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--score-green, #22c55e)';
  if (score >= 60) return 'var(--score-blue, #3b82f6)';
  if (score >= 40) return 'var(--score-yellow, #eab308)';
  if (score >= 20) return 'var(--score-orange, #f97316)';
  return 'var(--score-red, #f87171)';
}

function getScoreColorRaw(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#f87171';
}

function confidenceDotColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'unanimous': return 'var(--score-green, #22c55e)';
    case 'strong': return 'var(--text-accent, #60a5fa)';
    case 'moderate': return 'var(--clues-gold, #f59e0b)';
    case 'split': return 'var(--score-red, #f87171)';
  }
}

interface CategoryBreakdownProps {
  /** All cities (ranked) — used for comparison bars */
  cities: CitySmartScore[];
  /** Optionally start with some categories expanded */
  initialExpanded?: string[];
}

export function CategoryBreakdown({ cities, initialExpanded = [] }: CategoryBreakdownProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialExpanded));

  if (!cities || cities.length === 0) return null;

  // Use the winner (rank 1) as the primary view
  const winner = cities.find(c => c.rank === 1) ?? cities[0];

  // Sort categories by weight (most important first)
  const sortedCategories = [...winner.categoryScores].sort((a, b) => b.weight - a.weight);

  const toggle = (catId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const getCategoryForCity = (city: CitySmartScore, catId: string): CategorySmartScore | undefined => {
    return city.categoryScores.find(c => c.categoryId === catId);
  };

  return (
    <section className="category-breakdown" aria-label="Category Breakdown">
      <h2 className="category-breakdown__title">Category Breakdown</h2>

      {sortedCategories.map(cat => {
        const isOpen = expanded.has(cat.categoryId);

        return (
          <div key={cat.categoryId} className="category-section">
            <button
              className="category-section__header"
              aria-expanded={isOpen}
              onClick={() => toggle(cat.categoryId)}
            >
              <span className="category-section__icon" aria-hidden="true">
                {CATEGORY_ICONS[cat.categoryId] ?? '\u{1F4CA}'}
              </span>
              <span className="category-section__name">
                {CATEGORY_LABELS[cat.categoryId] ?? cat.categoryName}
              </span>
              <span
                className="category-section__score"
                style={{ color: getScoreColor(cat.score) }}
              >
                {cat.score}
              </span>
              <span
                className="category-section__confidence-dot"
                style={{ background: confidenceDotColor(cat.confidence) }}
                aria-hidden="true"
              />
              <span className="category-section__metric-count">
                {cat.scoredMetricCount} metric{cat.scoredMetricCount !== 1 ? 's' : ''}
              </span>
              <span
                className={`category-section__chevron${isOpen ? ' category-section__chevron--open' : ''}`}
                aria-hidden="true"
              >
                &#x25BC;
              </span>
            </button>

            {isOpen && (
              <div className="category-section__body">
                {/* Comparison bars across cities */}
                {cities.length > 1 && (
                  <div className="category-section__comparison-bars">
                    {cities
                      .slice()
                      .sort((a, b) => a.rank - b.rank)
                      .map(city => {
                        const cityCat = getCategoryForCity(city, cat.categoryId);
                        const score = cityCat?.score ?? 0;
                        return (
                          <div key={city.location} className="category-section__city-bar">
                            <div className="category-section__city-label">
                              <span>{city.location}</span>
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                color: getScoreColor(score),
                              }}>
                                {score}
                              </span>
                            </div>
                            <div className="city-card__bar-track" aria-hidden="true">
                              <div
                                className="city-card__bar-fill"
                                style={{
                                  width: `${score}%`,
                                  background: getScoreColorRaw(score),
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Judge analysis */}
                {cat.judgeAnalysis && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(192, 132, 252, 0.06)',
                    border: '1px solid rgba(192, 132, 252, 0.2)',
                    borderRadius: 8,
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
                      &#x2696; Cristiano&apos;s Analysis
                    </div>
                    <p style={{
                      fontFamily: "'Crimson Pro', Georgia, serif",
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {cat.judgeAnalysis}
                    </p>
                    {cat.trendNotes && (
                      <div style={{
                        marginTop: 6,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}>
                        Trend: {cat.trendNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Metric detail table (winner city) */}
                <MetricDetailTable
                  metrics={cat.metricScores}
                  cityName={winner.location}
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
