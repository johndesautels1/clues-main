/**
 * ReasoningTrace — Displays Gemini 3.1 Pro Preview's thinking_details array.
 *
 * Shows how the model moved from the user's story to the city recommendation.
 * Gemini 3.1 Pro Preview returns a thinking_details array when include_thinking_details: true.
 * Each step is rendered as an expandable card showing the reasoning chain.
 *
 * WCAG 2.1 AA: All text meets 4.5:1 contrast, focus-visible on all interactive elements.
 */

import { useState } from 'react';
import type { ThinkingStep } from '../../types';

interface ReasoningTraceProps {
  thinkingDetails: ThinkingStep[];
  isExpanded?: boolean;
}

export function ReasoningTrace({ thinkingDetails, isExpanded = false }: ReasoningTraceProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  if (!thinkingDetails || thinkingDetails.length === 0) {
    return null;
  }

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  return (
    <section className="reasoning-trace" aria-label="AI Reasoning Trace">
      <button
        onClick={() => setExpanded(!expanded)}
        className="reasoning-trace-toggle"
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'rgba(96, 165, 250, 0.06)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: expanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          color: 'var(--text-accent, #60a5fa)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ fontSize: '1rem' }}>&#x1F9E0;</span>
          AI Reasoning Trace ({thinkingDetails.length} steps)
        </span>
        <span
          aria-hidden="true"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease',
            fontSize: '0.75rem',
          }}
        >
          &#x25BC;
        </span>
      </button>

      {expanded && (
        <div
          style={{
            border: '1px solid rgba(96, 165, 250, 0.2)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '16px',
            background: 'rgba(10, 14, 26, 0.6)',
          }}
        >
          <p style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '0.875rem',
            color: 'var(--text-secondary, #9ca3af)',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            This trace shows how Gemini 3.1 Pro Preview reasoned through your paragraphs
            to arrive at location recommendations. Click any step to expand.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {thinkingDetails.map((step) => {
              const isOpen = expandedSteps.has(step.step);
              return (
                <div
                  key={step.step}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => toggleStep(step.step)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: isOpen ? 'rgba(96, 165, 250, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary, #f9fafb)',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isOpen ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: isOpen ? 'var(--text-accent, #60a5fa)' : 'var(--text-muted, #8b95a5)',
                        flexShrink: 0,
                      }}
                    >
                      {step.step}
                    </span>
                    <span style={{ flex: 1 }}>
                      {step.thought.length > 120
                        ? step.thought.slice(0, 120) + '...'
                        : step.thought}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--text-muted, #8b95a5)',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      &#x25B6;
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '12px 14px 14px 48px',
                      background: 'rgba(0, 0, 0, 0.15)',
                    }}>
                      <p style={{
                        fontFamily: "'Crimson Pro', Georgia, serif",
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary, #9ca3af)',
                        lineHeight: 1.7,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {step.thought}
                      </p>
                      {step.conclusion && (
                        <div style={{
                          marginTop: 10,
                          padding: '8px 12px',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: 6,
                        }}>
                          <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--score-green, #22c55e)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}>
                            Conclusion
                          </span>
                          <p style={{
                            fontFamily: "'Crimson Pro', Georgia, serif",
                            fontSize: '0.875rem',
                            color: 'var(--text-primary, #f9fafb)',
                            lineHeight: 1.6,
                            margin: '4px 0 0',
                          }}>
                            {step.conclusion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
