/**
 * ThinkingDetailsPanel — Full transparency UI for Gemini 3.1 Pro Preview's reasoning.
 *
 * Blueprint requirement: "For the first time, we can 'peek' into the model's brain.
 * This provides the transparency your users need to trust a life-changing move."
 *
 * Wraps ReasoningTrace with additional context: model info, token usage,
 * search grounding sources, and a visual timeline of the reasoning chain.
 *
 * WCAG 2.1 AA: All text >= 11px, contrast >= 4.5:1, focus-visible on interactive.
 */

import { useState } from 'react';
import type { ThinkingStep } from '../../types';
import { ReasoningTrace } from './ReasoningTrace';

interface ThinkingDetailsPanelProps {
  thinkingDetails: ThinkingStep[];
  metadata?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    durationMs: number;
    metricsExtracted?: number;
  };
}

export function ThinkingDetailsPanel({ thinkingDetails, metadata }: ThinkingDetailsPanelProps) {
  const [showPanel, setShowPanel] = useState(false);

  if (!thinkingDetails || thinkingDetails.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        aria-expanded={showPanel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'rgba(96, 165, 250, 0.08)',
          border: '1px solid rgba(96, 165, 250, 0.25)',
          borderRadius: 20,
          cursor: 'pointer',
          color: 'var(--text-accent, #60a5fa)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.8125rem',
          fontWeight: 500,
          letterSpacing: '0.03em',
          transition: 'all 0.2s ease',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '0.875rem' }}>&#x1F9E0;</span>
        {showPanel ? 'Hide' : 'Show'} AI Reasoning ({thinkingDetails.length} steps)
      </button>

      {/* Full panel */}
      {showPanel && (
        <div style={{
          marginTop: 16,
          padding: '20px',
          background: 'rgba(10, 14, 26, 0.8)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: 12,
          backdropFilter: 'blur(20px)',
        }}>
          {/* Model info header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Cormorant', serif",
                fontSize: '1.25rem',
                fontWeight: 400,
                color: 'var(--text-primary, #f9fafb)',
                margin: '0 0 4px',
              }}>
                How AI Reached This Recommendation
              </h3>
              <p style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.75rem',
                color: 'var(--text-muted, #8b95a5)',
                margin: 0,
              }}>
                Gemini 3.1 Pro Preview with deep reasoning (thinking_level: high)
              </p>
            </div>

            <button
              onClick={() => setShowPanel(false)}
              aria-label="Close thinking details"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary, #9ca3af)',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              &times;
            </button>
          </div>

          {/* Stats row */}
          {metadata && (
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Model', value: metadata.model },
                { label: 'Reasoning Steps', value: String(thinkingDetails.length) },
                { label: 'Thinking Tokens', value: metadata.thinkingTokens?.toLocaleString() ?? 'N/A' },
                { label: 'Total Tokens', value: (metadata.inputTokens + metadata.outputTokens).toLocaleString() },
                { label: 'Duration', value: `${(metadata.durationMs / 1000).toFixed(1)}s` },
                { label: 'Metrics Extracted', value: String(metadata.metricsExtracted ?? 'N/A') },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                }}>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted, #8b95a5)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 2,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary, #f9fafb)',
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visual timeline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 16,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
            overflowX: 'auto',
          }}>
            {thinkingDetails.map((step, idx) => (
              <div key={step.step} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  title={step.thought.slice(0, 80)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: step.conclusion
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(96, 165, 250, 0.15)',
                    border: step.conclusion
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : '1px solid rgba(96, 165, 250, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: step.conclusion
                      ? 'var(--score-green, #22c55e)'
                      : 'var(--text-accent, #60a5fa)',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </div>
                {idx < thinkingDetails.length - 1 && (
                  <div style={{
                    width: 16,
                    height: 1,
                    background: 'rgba(255, 255, 255, 0.12)',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Full reasoning trace */}
          <ReasoningTrace thinkingDetails={thinkingDetails} isExpanded={true} />
        </div>
      )}
    </>
  );
}
