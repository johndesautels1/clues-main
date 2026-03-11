/**
 * CourtOrder — Per-category judicial analysis with real-world examples.
 *
 * Conv 19-20: Cristiano Judge UI + Video.
 * Extends the MI6 Briefing Room aesthetic into category-level analysis.
 * Each category card shows:
 *   - Category icon + name
 *   - Per-location analysis (2-3 sentences each)
 *   - Trend notes
 *   - Metrics overridden in this category
 *   - Override details with before/after scores
 *
 * WCAG 2.1 AA: Gold (#c4a87a) on midnight navy (#0a1628) = 6.8:1 contrast.
 * All text >= 11px, focus-visible, aria-expanded on collapsible sections.
 */

import { useState } from 'react';
import type { JudgeReport, JudgeCategoryAnalysis, MetricOverride } from '../../types/judge';
import './Results.css';

const MI6 = {
  midnight: '#0a1628',
  cockpit: '#0e1f3d',
  gold: '#c4a87a',
  goldBright: '#f59e0b',
  goldDim: 'rgba(196, 168, 122, 0.15)',
  goldBorder: 'rgba(196, 168, 122, 0.25)',
  textPrimary: '#f0ece4',
  textSecondary: '#a8a090',
  textMuted: '#7a7468',
  green: '#4ade80',
  red: '#f87171',
  purple: '#c084fc',
};

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

function getScoreColor(score: number): string {
  if (score >= 80) return MI6.green;
  if (score >= 60) return '#60a5fa';
  if (score >= 40) return MI6.goldBright;
  if (score >= 20) return '#f97316';
  return MI6.red;
}

interface CourtOrderProps {
  report: JudgeReport;
}

export function CourtOrder({ report }: CourtOrderProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { categoryAnalysis, metricOverrides } = report;

  if (!categoryAnalysis || categoryAnalysis.length === 0) return null;

  const toggle = (catId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  // Group overrides by category
  const overridesByCategory: Record<string, MetricOverride[]> = {};
  metricOverrides.forEach(mo => {
    if (!overridesByCategory[mo.category]) overridesByCategory[mo.category] = [];
    overridesByCategory[mo.category].push(mo);
  });

  return (
    <section
      aria-label="Cristiano's Category-Level Court Orders"
      style={{
        padding: 'var(--space-6)',
        background: `linear-gradient(170deg, ${MI6.midnight} 0%, ${MI6.cockpit} 100%)`,
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${MI6.goldBorder}`,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: MI6.gold,
        marginBottom: 6,
      }}>
        &#x2696; Court Orders
      </div>
      <h3 style={{
        fontFamily: "'Cormorant', serif",
        fontSize: 'var(--text-2xl)',
        fontWeight: 300,
        color: MI6.textPrimary,
        margin: '0 0 20px',
      }}>
        Category-by-Category Analysis
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categoryAnalysis.map((cat: JudgeCategoryAnalysis) => {
          const isOpen = expanded.has(cat.categoryId);
          const catOverrides = overridesByCategory[cat.categoryId] ?? [];

          return (
            <div key={cat.categoryId} style={{
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isOpen ? MI6.goldBorder : 'rgba(255, 255, 255, 0.06)'}`,
              overflow: 'hidden',
              transition: 'border-color 0.2s ease',
            }}>
              {/* Header button */}
              <button
                onClick={() => toggle(cat.categoryId)}
                aria-expanded={isOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 16px',
                  gap: 10,
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isOpen
                    ? 'rgba(196, 168, 122, 0.06)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 'var(--text-lg)', flexShrink: 0 }} aria-hidden="true">
                  {CATEGORY_ICONS[cat.categoryId] ?? '\u{1F4CA}'}
                </span>
                <span style={{
                  flex: 1,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  color: MI6.textPrimary,
                }}>
                  {cat.categoryName}
                </span>
                {catOverrides.length > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(192, 132, 252, 0.12)',
                    border: '1px solid rgba(192, 132, 252, 0.3)',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: MI6.purple,
                  }}>
                    {catOverrides.length} override{catOverrides.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: MI6.textMuted,
                  transition: 'transform 0.3s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                }} aria-hidden="true">
                  &#x25BC;
                </span>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{
                  padding: '0 16px 16px',
                  background: 'rgba(196, 168, 122, 0.03)',
                }}>
                  {/* Per-location analysis */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 4,
                    marginBottom: catOverrides.length > 0 ? 16 : 0,
                  }}>
                    {cat.locationAnalyses.map(la => (
                      <div key={la.location} style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                      }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          color: MI6.gold,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}>
                          {la.location}
                        </div>
                        <p style={{
                          fontFamily: "'Crimson Pro', Georgia, serif",
                          fontSize: 'var(--text-sm)',
                          color: MI6.textSecondary,
                          lineHeight: 1.7,
                          margin: 0,
                        }}>
                          {la.analysis}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Trend notes */}
                  {cat.trendNotes && (
                    <div style={{
                      padding: '8px 12px',
                      background: MI6.goldDim,
                      border: `1px solid ${MI6.goldBorder}`,
                      borderRadius: 6,
                      marginBottom: catOverrides.length > 0 ? 16 : 0,
                    }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: MI6.gold,
                        letterSpacing: '0.04em',
                      }}>
                        Trend:
                      </span>{' '}
                      <span style={{
                        fontFamily: "'Crimson Pro', Georgia, serif",
                        fontSize: 'var(--text-sm)',
                        color: MI6.textSecondary,
                      }}>
                        {cat.trendNotes}
                      </span>
                    </div>
                  )}

                  {/* Metric overrides in this category */}
                  {catOverrides.length > 0 && (
                    <div>
                      <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: MI6.purple,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}>
                        &#x2696; Score Overrides
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {catOverrides.map((mo, i) => (
                          <div key={i} style={{
                            padding: '10px 12px',
                            background: 'rgba(192, 132, 252, 0.05)',
                            border: '1px solid rgba(192, 132, 252, 0.15)',
                            borderRadius: 6,
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 4,
                            }}>
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                color: '#60a5fa',
                              }}>
                                {mo.metric_id}
                              </span>
                              <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 'var(--text-xs)',
                                color: MI6.textMuted,
                              }}>
                                {mo.location}
                              </span>
                              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 'var(--text-sm)',
                                  color: getScoreColor(mo.originalScore),
                                  textDecoration: 'line-through',
                                  opacity: 0.7,
                                }}>
                                  {mo.originalScore}
                                </span>
                                <span style={{
                                  color: MI6.textMuted,
                                  fontSize: 'var(--text-xs)',
                                }} aria-hidden="true">&rarr;</span>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 'var(--text-sm)',
                                  fontWeight: 700,
                                  color: getScoreColor(mo.judgeScore),
                                }}>
                                  {mo.judgeScore}
                                </span>
                              </span>
                            </div>
                            <p style={{
                              fontFamily: "'Crimson Pro', Georgia, serif",
                              fontSize: 'var(--text-xs)',
                              color: MI6.textSecondary,
                              lineHeight: 1.5,
                              margin: 0,
                            }}>
                              {mo.judgeExplanation}
                            </p>
                            {mo.trustedModel && (
                              <div style={{
                                marginTop: 4,
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 'var(--text-xs)',
                                color: MI6.textMuted,
                              }}>
                                Trusted: {mo.trustedModel}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
