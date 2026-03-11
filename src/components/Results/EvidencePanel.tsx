/**
 * EvidencePanel — Source citations with category filter buttons.
 *
 * Conv 17-18: Results Page Assembly.
 * Aggregates all MetricSource citations across all metrics and cities.
 * Filterable by category. Each citation shows metric ID, description,
 * city, excerpt, and clickable source link.
 *
 * WCAG 2.1 AA: All text >= 11px, 4.5:1 contrast, focus-visible on filters.
 */

import { useState, useMemo } from 'react';
import type { CitySmartScore, MetricSmartScore, MetricSource } from '../../types/smartScore';
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
  food_dining: 'Food',
  shopping_services: 'Shopping',
  outdoor_recreation: 'Outdoors',
  entertainment_nightlife: 'Entertainment',
  family_children: 'Family',
  neighborhood_urban_design: 'Urban Design',
  environment_community_appearance: 'Environment',
  religion_spirituality: 'Religion',
  sexual_beliefs_practices_laws: 'Rights',
  arts_culture: 'Arts',
  cultural_heritage_traditions: 'Heritage',
  pets_animals: 'Pets',
};

interface EvidenceItem {
  metricId: string;
  description: string;
  category: string;
  city: string;
  score: number;
  source: MetricSource;
}

interface EvidencePanelProps {
  cities: CitySmartScore[];
}

export function EvidencePanel({ cities }: EvidencePanelProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Flatten all sources across all cities and metrics
  const allEvidence = useMemo(() => {
    const items: EvidenceItem[] = [];
    cities.forEach(city => {
      city.categoryScores.forEach(cat => {
        cat.metricScores.forEach((metric: MetricSmartScore) => {
          metric.sources.forEach(source => {
            items.push({
              metricId: metric.metric_id,
              description: metric.description,
              category: metric.category,
              city: city.location,
              score: metric.score,
              source,
            });
          });
        });
      });
    });
    return items;
  }, [cities]);

  // Unique categories present
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allEvidence.forEach(e => cats.add(e.category));
    return Array.from(cats).sort();
  }, [allEvidence]);

  // Filtered evidence
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allEvidence;
    return allEvidence.filter(e => e.category === activeFilter);
  }, [allEvidence, activeFilter]);

  if (allEvidence.length === 0) return null;

  return (
    <section className="evidence-panel" aria-label="Evidence and Sources">
      <h2 className="evidence-panel__title">Evidence &amp; Sources</h2>

      {/* Filter buttons */}
      <div className="evidence-panel__filters" role="tablist" aria-label="Filter by category">
        <button
          className={`evidence-panel__filter-btn${activeFilter === 'all' ? ' evidence-panel__filter-btn--active' : ''}`}
          role="tab"
          aria-selected={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        >
          All ({allEvidence.length})
        </button>
        {categories.map(cat => {
          const count = allEvidence.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              className={`evidence-panel__filter-btn${activeFilter === cat ? ' evidence-panel__filter-btn--active' : ''}`}
              role="tab"
              aria-selected={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Evidence cards */}
      <div className="evidence-panel__list" role="tabpanel">
        {filtered.slice(0, 50).map((item, idx) => (
          <div key={`${item.metricId}-${item.city}-${idx}`} className="evidence-card">
            <div className="evidence-card__header">
              <span className="evidence-card__metric-id">{item.metricId}</span>
              <span className="evidence-card__metric-desc">{item.description}</span>
              <span className="evidence-card__city">{item.city}</span>
            </div>

            {item.source.excerpt && (
              <p className="evidence-card__excerpt">
                &ldquo;{item.source.excerpt}&rdquo;
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="evidence-card__source-link"
              >
                &#x1F517; {item.source.name}
              </a>
              <span className="evidence-card__domain">
                {extractDomain(item.source.url)}
              </span>
            </div>
          </div>
        ))}

        {filtered.length > 50 && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            Showing 50 of {filtered.length} sources
          </div>
        )}
      </div>
    </section>
  );
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
