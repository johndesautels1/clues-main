/**
 * OliviaChoiceModal — Two options: Chat | Video Conversation
 */

import { useEffect } from 'react';
import { OliviaAvatar } from './OliviaAvatar';
import { C, type DiscoverySection } from './discoveryData';

interface OliviaChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectChat: () => void;
  onSelectVideo: () => void;
  section: DiscoverySection | undefined;
}

export function OliviaChoiceModal({ visible, onClose, onSelectChat, onSelectVideo, section }: OliviaChoiceModalProps) {
  useEffect(() => {
    if (!visible) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      role="dialog" aria-label="Connect with Olivia" aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,12,20,0.78)',
        backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        animation: 'discovery-overlayIn 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'clamp(320px,90vw,500px)',
          background: 'linear-gradient(145deg,rgba(17,24,39,0.99) 0%,rgba(10,14,26,0.99) 100%)',
          border: '1px solid rgba(196,168,122,0.18)', borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)',
          animation: 'discovery-modalSlideUp 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '26px 26px 18px',
          background: 'linear-gradient(135deg,rgba(196,168,122,0.06) 0%,transparent 60%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <OliviaAvatar isSpeaking={false} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant',serif", fontSize: 22, fontWeight: 300, color: C.textPrimary, letterSpacing: '0.04em' }}>
              Connect with Olivia
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
              CLUES&trade; AI Relocation Advisor
            </div>
          </div>
          <button
            onClick={onClose} aria-label="Close" className="discovery-btn"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: C.textMuted, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >&#x2715;</button>
        </div>

        {/* Section context */}
        <div style={{ padding: '12px 26px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMuted }}>
            Currently on &middot;{' '}
          </span>
          <span style={{ fontFamily: "'Crimson Pro',serif", fontSize: 14, color: C.textSecondary }}>
            {section?.icon} {section?.title}
          </span>
        </div>

        {/* Choice cards */}
        <div style={{ padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Chat */}
          <button
            onClick={onSelectChat} className="discovery-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '18px 20px', textAlign: 'left',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: 'rgba(196,168,122,0.09)', border: '1px solid rgba(196,168,122,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              &#x1F4AC;
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.textPrimary, marginBottom: 4 }}>Chat with Olivia</div>
              <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                Text conversation with AI guidance and voice playback. Instant and quiet.
              </div>
            </div>
            <div style={{ color: C.textMuted, fontSize: 16, flexShrink: 0 }}>&rarr;</div>
          </button>

          {/* Video */}
          <button
            onClick={onSelectVideo} className="discovery-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '18px 20px', textAlign: 'left', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg,rgba(196,168,122,0.08) 0%,rgba(196,168,122,0.03) 100%)',
              border: '1px solid rgba(196,168,122,0.22)', borderRadius: 16,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: -24, right: -24, width: 96, height: 96,
                borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,168,122,0.07) 0%,transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(196,168,122,0.18) 0%,rgba(196,168,122,0.08) 100%)',
              border: '1px solid rgba(196,168,122,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              &#x1F3A5;
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.textPrimary }}>Video Conversation with Olivia</span>
                <span style={{
                  fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#C4A87A', background: 'rgba(196,168,122,0.12)', border: '1px solid rgba(196,168,122,0.25)',
                  borderRadius: 4, padding: '2px 6px',
                }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                Real-time video call with Olivia&rsquo;s AI avatar. See her, hear her, speak live.
              </div>
            </div>
            <div style={{ color: '#C4A87A', fontSize: 16, flexShrink: 0 }}>&rarr;</div>
          </button>
        </div>
      </div>
    </div>
  );
}
