/**
 * ReactiveJustification — Click a justification to highlight the source Paragraph (P1-P30).
 *
 * Blueprint requirement: "Ensure the 'Justification' field is reactive - clicking it
 * should highlight the specific Paragraph (P1-P30) that triggered that metric score."
 *
 * This component renders a single metric's justification with a clickable paragraph tag.
 * When clicked, it scrolls to and highlights the source paragraph in the Paragraphical view
 * or in a side panel showing the user's original text.
 *
 * WCAG 2.1 AA: Focus-visible, 4.5:1 contrast, 44x44 touch targets.
 */

import { useEffect, useRef } from 'react';
import type { GeminiMetricObject, ParagraphEntry } from '../../types';

interface ReactiveJustificationProps {
  metric: GeminiMetricObject;
  paragraphs: ParagraphEntry[];
  highlightedParagraph: number | null;
  onParagraphClick: (paragraphId: number) => void;
}

export function ReactiveJustification({
  metric,
  paragraphs,
  highlightedParagraph,
  onParagraphClick,
}: ReactiveJustificationProps) {
  const sourceParagraph = paragraphs.find(p => p.id === metric.source_paragraph);
  const isHighlighted = highlightedParagraph === metric.source_paragraph;

  return (
    <div style={{
      padding: '10px 12px',
      background: isHighlighted ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.02)',
      border: isHighlighted
        ? '1px solid rgba(249, 115, 22, 0.4)'
        : '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 8,
      transition: 'all 0.3s ease',
    }}>
      {/* Metric header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-accent, #60a5fa)',
          background: 'rgba(96, 165, 250, 0.1)',
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {metric.id}
        </span>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--text-primary, #f9fafb)',
          flex: 1,
        }}>
          {metric.description}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1rem',
          fontWeight: 700,
          color: metric.score >= 70 ? 'var(--score-green, #22c55e)'
            : metric.score >= 40 ? 'var(--score-yellow, #eab308)'
            : 'var(--score-red, #f87171)',
        }}>
          {metric.score}
        </span>
      </div>

      {/* User justification — clickable */}
      <button
        onClick={() => onParagraphClick(metric.source_paragraph)}
        aria-label={`View paragraph ${metric.source_paragraph}: ${sourceParagraph?.heading ?? ''}`}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '8px 10px',
          background: isHighlighted
            ? 'rgba(249, 115, 22, 0.12)'
            : 'rgba(249, 115, 22, 0.04)',
          border: isHighlighted
            ? '2px solid var(--clues-orange, #f97316)'
            : '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: 6,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--clues-orange, #f97316)',
            background: 'rgba(249, 115, 22, 0.15)',
            padding: '2px 6px',
            borderRadius: 4,
          }}>
            P{metric.source_paragraph}
          </span>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.6875rem',
            color: 'var(--clues-orange, #f97316)',
            letterSpacing: '0.04em',
          }}>
            {sourceParagraph?.heading ?? 'Source Paragraph'} — Click to view
          </span>
        </div>
        <p style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: '0.8125rem',
          color: 'var(--text-secondary, #9ca3af)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {metric.user_justification}
        </p>
      </button>

      {/* Data justification */}
      <div style={{
        padding: '6px 10px',
        background: 'rgba(34, 197, 94, 0.04)',
        border: '1px solid rgba(34, 197, 94, 0.12)',
        borderRadius: 6,
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: 'var(--score-green, #22c55e)',
          letterSpacing: '0.04em',
        }}>
          Data
        </span>
        <p style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: '0.8125rem',
          color: 'var(--text-secondary, #9ca3af)',
          lineHeight: 1.5,
          margin: '2px 0 0',
        }}>
          {metric.data_justification}
        </p>
      </div>

      {/* Source */}
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: '0.6875rem',
        color: 'var(--text-muted, #8b95a5)',
      }}>
        &#x1F4CE; {metric.source}
      </div>
    </div>
  );
}

// ─── Paragraph Highlight Panel ──────────────────────────────────
// Shows the user's original paragraph text when a justification is clicked.
// Scrolls to and highlights the relevant paragraph.

interface ParagraphHighlightPanelProps {
  paragraphs: ParagraphEntry[];
  highlightedParagraph: number | null;
  onClose: () => void;
}

export function ParagraphHighlightPanel({
  paragraphs,
  highlightedParagraph,
  onClose,
}: ParagraphHighlightPanelProps) {
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedParagraph && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedParagraph]);

  if (highlightedParagraph === null) return null;

  return (
    <div
      role="dialog"
      aria-label="Source Paragraph"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 'clamp(320px, 30vw, 440px)',
        background: 'var(--bg-primary, #0a0e1a)',
        borderLeft: '1px solid rgba(249, 115, 22, 0.3)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        overflowY: 'auto',
        padding: '20px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h3 style={{
          fontFamily: "'Cormorant', serif",
          fontSize: '1.25rem',
          fontWeight: 400,
          color: 'var(--text-primary, #f9fafb)',
          margin: 0,
        }}>
          Your Paragraphs
        </h3>
        <button
          onClick={onClose}
          aria-label="Close paragraph panel"
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paragraphs
          .filter(p => p.content.trim())
          .map(p => {
            const isActive = p.id === highlightedParagraph;
            return (
              <div
                key={p.id}
                ref={isActive ? highlightRef : undefined}
                style={{
                  padding: '12px 14px',
                  background: isActive
                    ? 'rgba(249, 115, 22, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isActive
                    ? '2px solid var(--clues-orange, #f97316)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--clues-orange, #f97316)' : 'var(--text-accent, #60a5fa)',
                    background: isActive
                      ? 'rgba(249, 115, 22, 0.15)'
                      : 'rgba(96, 165, 250, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}>
                    P{p.id}
                  </span>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: isActive
                      ? 'var(--clues-orange, #f97316)'
                      : 'var(--text-primary, #f9fafb)',
                  }}>
                    {p.heading}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary, #9ca3af)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {p.content.length > 300 && !isActive
                    ? p.content.slice(0, 300) + '...'
                    : p.content}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
