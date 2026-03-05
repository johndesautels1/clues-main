/**
 * NavOverlay — Full-screen section navigation map
 */

import { useEffect } from 'react';
import { SECTIONS, CATEGORIES, CAT_COLORS, C, wordCount } from './discoveryData';

interface NavOverlayProps {
  visible: boolean;
  onClose: () => void;
  current: number;
  answers: Record<number, string>;
  onNavigate: (idx: number) => void;
}

export function NavOverlay({ visible, onClose, current, answers, onNavigate }: NavOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [visible, onClose]);

  if (!visible) return null;

  const completedCount = Object.values(answers).filter((a) => a?.trim().length > 0).length;

  return (
    <div
      role="dialog"
      aria-label="Section navigation"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(10,14,26,0.92)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'discovery-overlayIn 0.3s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: 920, maxHeight: '82vh', overflowY: 'auto',
          padding: 'clamp(32px,4vw,48px) clamp(28px,3vw,44px)',
          background: C.cardBg, border: `1px solid ${C.divider}`, borderRadius: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant',serif", fontSize: 28, fontWeight: 300, color: C.textPrimary, margin: 0 }}>
              Your Discovery Map
            </h2>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: C.textMuted, marginTop: 6 }}>
              {completedCount} of 24 sections completed
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="discovery-btn"
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.inputBorder}`,
              borderRadius: 10, width: 40, height: 40, color: C.textSecondary,
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            &#x2715;
          </button>
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 28 }} role="group" aria-label={`${cat} sections`}>
            <div
              style={{
                fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: CAT_COLORS[cat], marginBottom: 10, paddingLeft: 2,
              }}
            >
              {cat}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
              {SECTIONS.filter((s) => s.cat === cat).map((s) => {
                const idx = SECTIONS.findIndex((x) => x.id === s.id);
                const isActive = idx === current;
                const hasAnswer = (answers[s.id]?.trim().length ?? 0) > 0;
                return (
                  <button
                    key={s.id}
                    className="discovery-btn"
                    onClick={() => { onNavigate(idx); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', textAlign: 'left',
                      background: isActive ? `${s.accent}18` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? s.accent + '55' : C.divider}`,
                      borderRadius: 12, transition: 'all 0.25s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: hasAnswer ? s.accent : 'transparent',
                        border: hasAnswer ? 'none' : `1.5px solid ${C.inputBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: C.pageBg, fontWeight: 700,
                      }}
                    >
                      {hasAnswer && '\u2713'}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: isActive ? C.textPrimary : C.textSecondary }}>
                        {s.id}. {s.title}
                      </div>
                      {hasAnswer && (
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                          {wordCount(answers[s.id])} words
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
