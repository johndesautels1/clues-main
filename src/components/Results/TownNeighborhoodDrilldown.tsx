/**
 * TownNeighborhoodDrilldown — Town + neighborhood drill-down cards.
 *
 * Conv 17-18: Results Page Assembly.
 * Shows top 3 towns in the winning city, then top 3 neighborhoods
 * in the winning town. Each card is expandable to reveal category
 * scores and highlights.
 *
 * WCAG 2.1 AA: All text >= 11px, 4.5:1 contrast, aria-expanded, focus-visible.
 */

import { useState } from 'react';
import type { CitySmartScore } from '../../types/smartScore';
import './Results.css';

const CATEGORY_LABELS: Record<string, string> = {
  safety_security: 'Safety',
  health_wellness: 'Health',
  climate_weather: 'Climate',
  legal_immigration: 'Legal',
  financial_banking: 'Financial',
  housing_property: 'Housing',
  professional_career: 'Career',
  technology_connectivity: 'Technology',
  transportation_mobility: 'Transport',
  education_learning: 'Education',
  social_values_governance: 'Governance',
  food_dining: 'Food & Dining',
  shopping_services: 'Shopping',
  outdoor_recreation: 'Outdoors',
  entertainment_nightlife: 'Entertainment',
  family_children: 'Family',
  neighborhood_urban_design: 'Urban Design',
  environment_community_appearance: 'Environment',
  religion_spirituality: 'Religion',
  sexual_beliefs_practices_laws: 'Laws & Rights',
  arts_culture: 'Arts & Culture',
  cultural_heritage_traditions: 'Heritage',
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

interface TownNeighborhoodDrilldownProps {
  /** Towns sorted by rank */
  towns: CitySmartScore[];
  /** Neighborhoods sorted by rank */
  neighborhoods: CitySmartScore[];
  /** Parent city name for context */
  winningCity: string;
}

export function TownNeighborhoodDrilldown({ towns, neighborhoods, winningCity }: TownNeighborhoodDrilldownProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if ((!towns || towns.length === 0) && (!neighborhoods || neighborhoods.length === 0)) {
    return null;
  }

  const toggle = (id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  };

  return (
    <section className="drilldown" aria-label="Town and Neighborhood Drilldown">
      <h2 className="drilldown__title">Towns &amp; Neighborhoods</h2>
      <p className="drilldown__subtitle">
        Drilling down from {winningCity} to find your ideal location
      </p>

      {/* Towns */}
      {towns.length > 0 && (
        <div className="drilldown__level">
          <div className="drilldown__level-label">
            <span className="drilldown__level-icon" aria-hidden="true">&#x1F3D8;</span>
            <span className="drilldown__level-text">
              Towns in {winningCity} ({towns.length})
            </span>
          </div>

          <div className="drilldown__cards">
            {towns.map(town => {
              const isExpanded = expandedCard === `town-${town.location}`;
              const topCategories = [...town.categoryScores]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

              return (
                <button
                  key={town.location}
                  className={`drilldown-card${isExpanded ? ' drilldown-card--expanded' : ''}`}
                  aria-expanded={isExpanded}
                  onClick={() => toggle(`town-${town.location}`)}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <div className="drilldown-card__head">
                    <h4 className="drilldown-card__name">
                      #{town.rank} {town.location}
                    </h4>
                    <span
                      className="drilldown-card__score"
                      style={{ color: getScoreColor(town.overallScore) }}
                    >
                      {town.overallScore}
                    </span>
                  </div>

                  <div className="drilldown-card__parent">
                    {town.parent ?? winningCity}, {town.country}
                  </div>

                  {/* Top 3 highlights */}
                  <div className="drilldown-card__highlights">
                    {topCategories.map(cat => (
                      <div key={cat.categoryId} className="drilldown-card__highlight">
                        <span className="drilldown-card__highlight-icon" aria-hidden="true">&#x2713;</span>
                        <span>{CATEGORY_LABELS[cat.categoryId] ?? cat.categoryName}</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: getScoreColor(cat.score),
                          marginLeft: 'auto',
                        }}>{cat.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="drilldown-card__detail-body">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {town.categoryScores
                          .slice()
                          .sort((a, b) => b.weight - a.weight)
                          .map(cat => (
                            <div key={cat.categoryId} className="city-card__bar-row">
                              <span className="city-card__bar-label">
                                {CATEGORY_LABELS[cat.categoryId] ?? cat.categoryName}
                              </span>
                              <div className="city-card__bar-track" aria-hidden="true">
                                <div
                                  className="city-card__bar-fill"
                                  style={{
                                    width: `${cat.score}%`,
                                    background: getScoreColorRaw(cat.score),
                                  }}
                                />
                              </div>
                              <span
                                className="city-card__bar-score"
                                style={{ color: getScoreColor(cat.score) }}
                              >
                                {cat.score}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div style={{
                        marginTop: 10,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}>
                        {town.scoredMetrics} of {town.totalMetrics} metrics scored
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Neighborhoods */}
      {neighborhoods.length > 0 && (
        <div className="drilldown__level">
          <div className="drilldown__level-label">
            <span className="drilldown__level-icon" aria-hidden="true">&#x1F3E0;</span>
            <span className="drilldown__level-text">
              Neighborhoods in {neighborhoods[0]?.parent ?? towns[0]?.location ?? winningCity} ({neighborhoods.length})
            </span>
          </div>

          <div className="drilldown__cards">
            {neighborhoods.map(nbr => {
              const isExpanded = expandedCard === `nbr-${nbr.location}`;
              const topCategories = [...nbr.categoryScores]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

              return (
                <button
                  key={nbr.location}
                  className={`drilldown-card${isExpanded ? ' drilldown-card--expanded' : ''}`}
                  aria-expanded={isExpanded}
                  onClick={() => toggle(`nbr-${nbr.location}`)}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <div className="drilldown-card__head">
                    <h4 className="drilldown-card__name">
                      #{nbr.rank} {nbr.location}
                    </h4>
                    <span
                      className="drilldown-card__score"
                      style={{ color: getScoreColor(nbr.overallScore) }}
                    >
                      {nbr.overallScore}
                    </span>
                  </div>

                  <div className="drilldown-card__parent">
                    {nbr.parent ?? 'Neighborhood'}, {nbr.country}
                  </div>

                  <div className="drilldown-card__highlights">
                    {topCategories.map(cat => (
                      <div key={cat.categoryId} className="drilldown-card__highlight">
                        <span className="drilldown-card__highlight-icon" aria-hidden="true">&#x2713;</span>
                        <span>{CATEGORY_LABELS[cat.categoryId] ?? cat.categoryName}</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: getScoreColor(cat.score),
                          marginLeft: 'auto',
                        }}>{cat.score}</span>
                      </div>
                    ))}
                  </div>

                  {isExpanded && (
                    <div className="drilldown-card__detail-body">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {nbr.categoryScores
                          .slice()
                          .sort((a, b) => b.weight - a.weight)
                          .map(cat => (
                            <div key={cat.categoryId} className="city-card__bar-row">
                              <span className="city-card__bar-label">
                                {CATEGORY_LABELS[cat.categoryId] ?? cat.categoryName}
                              </span>
                              <div className="city-card__bar-track" aria-hidden="true">
                                <div
                                  className="city-card__bar-fill"
                                  style={{
                                    width: `${cat.score}%`,
                                    background: getScoreColorRaw(cat.score),
                                  }}
                                />
                              </div>
                              <span
                                className="city-card__bar-score"
                                style={{ color: getScoreColor(cat.score) }}
                              >
                                {cat.score}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div style={{
                        marginTop: 10,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}>
                        {nbr.scoredMetrics} of {nbr.totalMetrics} metrics scored
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
