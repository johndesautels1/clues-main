/**
 * SideBySideMetricView — Compares City, Town, and Neighborhood metrics.
 *
 * Each row shows a metric scored across all three location levels.
 * Clicking a justification highlights the source Paragraph (P1-P30)
 * via the onParagraphClick callback.
 *
 * Blueprint requirement: "Implement a Side-by-Side Metric View where each row
 * compares the City, the Town, and the Neighborhood."
 *
 * WCAG 2.1 AA: All text >= 11px, contrast >= 4.5:1, focus-visible on interactive.
 */

import { useState, useMemo } from 'react';
import type { LocationMetrics, GeminiMetricObject } from '../../types';

interface SideBySideMetricViewProps {
  city: LocationMetrics | null;
  town: LocationMetrics | null;
  neighborhood: LocationMetrics | null;
  onParagraphClick?: (paragraphId: number) => void;
  filterCategory?: string;
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  safety_security: 'Safety & Security',
  health_wellness: 'Health & Wellness',
  climate_weather: 'Climate & Weather',
  legal_immigration: 'Legal & Immigration',
  financial_banking: 'Financial & Banking',
  housing_property: 'Housing & Property Preferences',
  professional_career: 'Professional & Career Development',
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
  environment_community_appearance: 'Environment & Community Appearance',
  religion_spirituality: 'Religion & Spirituality',
  sexual_beliefs_practices_laws: 'Sexual Beliefs, Practices & Laws',
  arts_culture: 'Arts & Culture',
  cultural_heritage_traditions: 'Cultural Heritage & Traditions',
  pets_animals: 'Pets & Animals',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--score-green, #22c55e)';
  if (score >= 60) return 'var(--score-blue, #3b82f6)';
  if (score >= 40) return 'var(--score-yellow, #eab308)';
  if (score >= 20) return 'var(--score-orange, #f97316)';
  return 'var(--score-red, #f87171)';
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.6875rem',
          color: 'var(--text-muted, #8b95a5)',
          letterSpacing: '0.04em',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: getScoreColor(score),
        }}>
          {score}
        </span>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          borderRadius: 3,
          background: getScoreColor(score),
          transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
    </div>
  );
}

export function SideBySideMetricView({
  city,
  town,
  neighborhood,
  onParagraphClick,
  filterCategory,
}: SideBySideMetricViewProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(filterCategory ?? 'all');

  // Build a unified metric ID list from all three locations
  const allMetricIds = useMemo(() => {
    const ids = new Set<string>();
    [city, town, neighborhood].forEach(loc => {
      loc?.metrics?.forEach(m => ids.add(m.id));
    });
    return Array.from(ids);
  }, [city, town, neighborhood]);

  // Get all categories present
  const categories = useMemo(() => {
    const cats = new Set<string>();
    [city, town, neighborhood].forEach(loc => {
      loc?.metrics?.forEach(m => cats.add(m.category));
    });
    return Array.from(cats).sort();
  }, [city, town, neighborhood]);

  // Filter metrics by category
  const filteredMetricIds = useMemo(() => {
    if (activeCategory === 'all') return allMetricIds;
    return allMetricIds.filter(id => {
      const m = city?.metrics?.find(x => x.id === id)
        ?? town?.metrics?.find(x => x.id === id)
        ?? neighborhood?.metrics?.find(x => x.id === id);
      return m?.category === activeCategory;
    });
  }, [allMetricIds, activeCategory, city, town, neighborhood]);

  const findMetric = (location: LocationMetrics | null, metricId: string): GeminiMetricObject | undefined => {
    return location?.metrics?.find(m => m.id === metricId);
  };

  if (!city && !town && !neighborhood) {
    return null;
  }

  return (
    <section className="side-by-side-metrics" aria-label="Side-by-Side Metric Comparison">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <h3 style={{
          fontFamily: "'Cormorant', serif",
          fontSize: '1.375rem',
          fontWeight: 400,
          color: 'var(--text-primary, #f9fafb)',
          margin: 0,
        }}>
          Metric Comparison
        </h3>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 16,
              border: activeCategory === 'all'
                ? '1px solid var(--text-accent, #60a5fa)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeCategory === 'all'
                ? 'rgba(96, 165, 250, 0.12)'
                : 'rgba(255, 255, 255, 0.03)',
              color: activeCategory === 'all'
                ? 'var(--text-accent, #60a5fa)'
                : 'var(--text-muted, #8b95a5)',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.6875rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            All ({allMetricIds.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: activeCategory === cat
                  ? '1px solid var(--text-accent, #60a5fa)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeCategory === cat
                  ? 'rgba(96, 165, 250, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: activeCategory === cat
                  ? 'var(--text-accent, #60a5fa)'
                  : 'var(--text-muted, #8b95a5)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.6875rem',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: 12,
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '10px 10px 0 0',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: 'none',
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: 'var(--text-muted, #8b95a5)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Metric
        </span>
        {[
          { loc: city, label: 'City' },
          { loc: town, label: 'Town' },
          { loc: neighborhood, label: 'Neighborhood' },
        ].map(({ loc, label }) => (
          <span key={label} style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: loc ? 'var(--text-secondary, #9ca3af)' : 'var(--text-muted, #8b95a5)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            {loc ? `${loc.location} (${label})` : label}
          </span>
        ))}
      </div>

      {/* Metric rows */}
      <div style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        overflow: 'hidden',
      }}>
        {filteredMetricIds.map((metricId, idx) => {
          const cityMetric = findMetric(city, metricId);
          const townMetric = findMetric(town, metricId);
          const nbrMetric = findMetric(neighborhood, metricId);
          const anyMetric = cityMetric ?? townMetric ?? nbrMetric;
          const isExpanded = expandedMetric === metricId;

          return (
            <div key={metricId}>
              <button
                onClick={() => setExpandedMetric(isExpanded ? null : metricId)}
                aria-expanded={isExpanded}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: 12,
                  width: '100%',
                  padding: '10px 14px',
                  background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6875rem',
                    color: 'var(--text-accent, #60a5fa)',
                    marginRight: 6,
                  }}>
                    {metricId}
                  </span>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary, #f9fafb)',
                  }}>
                    {anyMetric?.description ?? metricId}
                  </span>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted, #8b95a5)',
                    marginTop: 2,
                  }}>
                    {CATEGORY_LABELS[anyMetric?.category ?? ''] ?? anyMetric?.category} &middot; P{anyMetric?.source_paragraph}
                  </div>
                </div>
                {[cityMetric, townMetric, nbrMetric].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {m ? (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: getScoreColor(m.score),
                      }}>
                        {m.score}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted, #8b95a5)',
                      }}>
                        --
                      </span>
                    )}
                  </div>
                ))}
              </button>

              {/* Expanded justification panel */}
              {isExpanded && (
                <div style={{
                  padding: '12px 14px 16px',
                  background: 'rgba(96, 165, 250, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 12,
                  }}>
                    {[
                      { metric: cityMetric, label: city?.location ?? 'City' },
                      { metric: townMetric, label: town?.location ?? 'Town' },
                      { metric: nbrMetric, label: neighborhood?.location ?? 'Neighborhood' },
                    ].map(({ metric, label }, i) => (
                      <div key={i} style={{
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--text-secondary, #9ca3af)',
                          marginBottom: 8,
                        }}>
                          {label}
                        </div>
                        {metric ? (
                          <>
                            <ScoreBar score={metric.score} label="Score" />

                            {/* User Justification — clickable to highlight paragraph */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onParagraphClick?.(metric.source_paragraph);
                              }}
                              aria-label={`View user justification from paragraph ${metric.source_paragraph}`}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                marginTop: 8,
                                padding: '6px 8px',
                                background: 'rgba(249, 115, 22, 0.06)',
                                border: '1px solid rgba(249, 115, 22, 0.15)',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                color: 'var(--clues-orange, #f97316)',
                                letterSpacing: '0.04em',
                              }}>
                                User Justification (P{metric.source_paragraph})
                              </span>
                              <p style={{
                                fontFamily: "'Crimson Pro', Georgia, serif",
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary, #9ca3af)',
                                lineHeight: 1.5,
                                margin: '3px 0 0',
                              }}>
                                {metric.user_justification}
                              </p>
                            </button>

                            {/* Data Justification */}
                            <div style={{
                              marginTop: 6,
                              padding: '6px 8px',
                              background: 'rgba(34, 197, 94, 0.06)',
                              border: '1px solid rgba(34, 197, 94, 0.15)',
                              borderRadius: 6,
                            }}>
                              <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                color: 'var(--score-green, #22c55e)',
                                letterSpacing: '0.04em',
                              }}>
                                Data Justification
                              </span>
                              <p style={{
                                fontFamily: "'Crimson Pro', Georgia, serif",
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary, #9ca3af)',
                                lineHeight: 1.5,
                                margin: '3px 0 0',
                              }}>
                                {metric.data_justification}
                              </p>
                            </div>

                            {/* Source */}
                            <div style={{
                              marginTop: 6,
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted, #8b95a5)',
                            }}>
                              Source: {metric.source}
                            </div>
                          </>
                        ) : (
                          <p style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '0.75rem',
                            color: 'var(--text-muted, #8b95a5)',
                            fontStyle: 'italic',
                          }}>
                            No data at this level
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall scores summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12,
        marginTop: 16,
      }}>
        {[
          { loc: city, label: 'City', color: 'var(--clues-sapphire, #2563eb)' },
          { loc: town, label: 'Town', color: 'var(--clues-orange, #f97316)' },
          { loc: neighborhood, label: 'Neighborhood', color: 'var(--clues-gold, #f59e0b)' },
        ].map(({ loc, label, color }) => (
          <div key={label} style={{
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.6875rem',
              color: 'var(--text-muted, #8b95a5)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: "'Cormorant', serif",
              fontSize: '1.5rem',
              fontWeight: 300,
              color,
            }}>
              {loc ? loc.location : '--'}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: loc ? getScoreColor(loc.overall_score) : 'var(--text-muted, #8b95a5)',
            }}>
              {loc?.overall_score ?? '--'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
