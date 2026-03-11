/**
 * CityComparisonGrid — Side-by-side city scoring cards with category bars.
 *
 * Conv 17-18: Results Page Assembly.
 * Shows ranked city cards with overall scores, confidence badges,
 * and top category score bars. Gold glow on the winner card.
 *
 * WCAG 2.1 AA: All text >= 4.5:1, focus-visible, no color-only indicators.
 */

import type { CitySmartScore, ConfidenceLevel } from '../../types/smartScore';
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

function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'unanimous': return 'Unanimous';
    case 'strong': return 'Strong';
    case 'moderate': return 'Moderate';
    case 'split': return 'Split';
  }
}

interface CityComparisonGridProps {
  cities: CitySmartScore[];
  /** Max category bars to show per card (default 5) */
  maxCategories?: number;
}

export function CityComparisonGrid({ cities, maxCategories = 5 }: CityComparisonGridProps) {
  if (!cities || cities.length === 0) return null;

  const sorted = [...cities].sort((a, b) => a.rank - b.rank);

  return (
    <section className="city-comparison-grid" aria-label="City Comparison">
      <div className="city-comparison-grid__header">
        <h2 className="city-comparison-grid__title">City Comparison</h2>
      </div>

      <div className="city-comparison-grid__cards">
        {sorted.map(city => {
          const topCategories = [...city.categoryScores]
            .sort((a, b) => b.weight - a.weight)
            .slice(0, maxCategories);

          return (
            <div
              key={city.location}
              className={`city-card${city.rank === 1 ? ' city-card--winner' : ''}`}
              role="article"
              aria-label={`${city.location} — Rank #${city.rank}, Score ${city.overallScore}`}
            >
              {/* Rank badge */}
              <div
                className={`city-card__rank city-card__rank--${Math.min(city.rank, 3)}`}
                aria-label={`Rank ${city.rank}`}
              >
                {city.rank}
              </div>

              {/* City name + country */}
              <h3 className="city-card__name">{city.location}</h3>
              <div className="city-card__country">{city.country}</div>

              {/* Overall score */}
              <div className="city-card__score-block">
                <span
                  className="city-card__score-number"
                  style={{ color: getScoreColor(city.overallScore) }}
                >
                  {city.overallScore}
                </span>
                <span className="city-card__score-label">Smart Score</span>
              </div>

              {/* Confidence badge */}
              <span className={`city-card__confidence city-card__confidence--${city.overallConfidence}`}>
                <span
                  className={`city-card__confidence-dot confidence-dot--${city.overallConfidence}`}
                  style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }}
                  aria-hidden="true"
                />
                {confidenceLabel(city.overallConfidence)}
              </span>

              {/* Top category bars */}
              <div className="city-card__category-bars" role="list" aria-label="Top category scores">
                {topCategories.map(cat => (
                  <div key={cat.categoryId} className="city-card__bar-row" role="listitem">
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

              {/* Metrics count */}
              <div style={{
                marginTop: 12,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}>
                {city.scoredMetrics} of {city.totalMetrics} metrics scored
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
