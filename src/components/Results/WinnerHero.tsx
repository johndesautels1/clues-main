/**
 * WinnerHero — Full-width winner declaration with gold score ring.
 *
 * Conv 17-18: Results Page Assembly.
 * Displays the winning city prominently with trophy, score ring,
 * advantage categories, tie detection, and runner-up row.
 *
 * WCAG 2.1 AA: All text >= 4.5:1 contrast, focus-visible on interactive.
 */

import type { WinnerDetermination } from '../../types/smartScore';
import './Results.css';

// Category display labels (shared with SideBySideMetricView)
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

interface WinnerHeroProps {
  winner: WinnerDetermination;
}

export function WinnerHero({ winner }: WinnerHeroProps) {
  const { winner: topCity, rankings, isTie, scoreDifference, winnerAdvantageCategories } = winner;

  const runnersUp = rankings.filter(c => c.rank > 1).slice(0, 2);

  return (
    <section className="winner-hero" aria-label="Winner Declaration">
      <span className="winner-hero__trophy" aria-hidden="true">
        &#x1F3C6;
      </span>

      <div className="winner-hero__label">
        {isTie ? 'Statistical Tie — Your Top Match' : 'Your #1 Match'}
      </div>

      <h1 className="winner-hero__city">{topCity.location}</h1>
      <div className="winner-hero__country">{topCity.country}</div>

      {/* Gold score ring */}
      <div className="winner-hero__score-ring">
        <span className="winner-hero__score-value">{topCity.overallScore}</span>
      </div>

      {/* Tie badge */}
      {isTie && (
        <div className="winner-hero__tie-badge">
          <span aria-hidden="true">&#x2194;</span>
          Within {scoreDifference.toFixed(1)} points — effectively tied
        </div>
      )}

      {/* Advantage categories */}
      {winnerAdvantageCategories.length > 0 && (
        <div className="winner-hero__advantages" role="list" aria-label="Advantage categories">
          {winnerAdvantageCategories.slice(0, 6).map(catId => (
            <span key={catId} className="winner-hero__advantage-tag" role="listitem">
              <span aria-hidden="true">&#x2713;</span>
              {CATEGORY_LABELS[catId] ?? catId}
            </span>
          ))}
        </div>
      )}

      {/* Runners up */}
      {runnersUp.length > 0 && (
        <div className="winner-hero__runner-up">
          <div className="winner-hero__runner-up-label">Also Recommended</div>
          <div className="winner-hero__runner-up-row">
            {runnersUp.map(city => (
              <div key={city.location} className="winner-hero__runner-up-city">
                <span className="winner-hero__runner-up-name">
                  #{city.rank} {city.location}
                </span>
                <span
                  className="winner-hero__runner-up-score"
                  style={{ color: getScoreColor(city.overallScore) }}
                >
                  {city.overallScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
