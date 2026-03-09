/**
 * HeyGenVideoModal — Full-screen live streaming avatar
 * Token fetched from /api/heygen-token (server-side proxy).
 * AI chat routed through /api/olivia-chat (no client-side API keys).
 * HeyGen SDK pinned to specific version.
 */

import { useState, useEffect, useRef } from 'react';
import { OliviaAvatar } from './OliviaAvatar';
import { C, buildOliviaPrompt, type DiscoverySection, type OliviaContext } from './discoveryData';
import { sendOliviaMessage } from '../../lib/oliviaApi';

// Pinned HeyGen SDK version — do not use @latest in production
const HEYGEN_SDK_URL = 'https://esm.sh/@heygen/streaming-avatar@2.0.5';

interface HeyGenVideoModalProps {
  open: boolean;
  onClose: () => void;
  section: DiscoverySection | undefined;
  currentAnswer: string;
  sessionId?: string;
}

export function HeyGenVideoModal({ open, onClose, section, currentAnswer, sessionId }: HeyGenVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (open) initHeyGen();
    return () => { if (!open) destroyHeyGen(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const initHeyGen = async () => {
    setStatus('connecting');
    setErrorMsg('');
    try {
      // 1. Fetch token from server-side proxy
      const tokenRes = await fetch('/api/heygen-token');
      if (!tokenRes.ok) throw new Error(`Token endpoint returned HTTP ${tokenRes.status}. Verify your HEYGEN_API_KEY env var.`);
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.token;
      if (!accessToken) throw new Error('Token endpoint did not return a token.');

      // 2. Load pinned HeyGen SDK
      const { default: StreamingAvatar, AvatarQuality, TaskType, StreamingEvents } = await import(
        /* @vite-ignore */ HEYGEN_SDK_URL
      );

      // 3. Init avatar
      const avatar = new StreamingAvatar({ token: accessToken });
      avatarRef.current = avatar;

      // 4. Wire video stream
      avatar.on(StreamingEvents.STREAM_READY, (e: any) => {
        if (videoRef.current) {
          videoRef.current.srcObject = e.detail;
          videoRef.current.play().catch(() => {});
        }
        setStatus('connected');
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => setStatus('idle'));

      // 5. Start session — avatar/voice IDs come from env or defaults
      await avatar.createStartAvatar({
        avatarName: import.meta.env.VITE_HEYGEN_AVATAR_ID || 'default',
        quality: AvatarQuality.High,
        voice: { voiceId: import.meta.env.VITE_HEYGEN_VOICE_ID || 'default' },
      });

      // 6. Contextual greeting
      const greeting = `Hello! I'm Olivia, your CLUES\u2122 relocation advisor. I see we're on "${section?.title}". ${section?.prompt ? 'The question is: ' + section.prompt + ' \u2014 ' : ''}How can I help you think through this?`;
      setIsSpeaking(true);
      await avatar.speak({ text: greeting, taskType: TaskType.REPEAT });
      setIsSpeaking(false);
    } catch (err) {
      console.error('HeyGen init error:', err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect. Please try again.');
    }
  };

  const destroyHeyGen = async () => {
    try {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
        avatarRef.current = null;
      }
    } catch { /* ignore */ }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
    setUserInput('');
    setIsSpeaking(false);
    setIsListening(false);
  };

  const handleClose = () => {
    destroyHeyGen();
    onClose();
  };

  const sendToOlivia = async (text: string) => {
    if (!text.trim() || !avatarRef.current || status !== 'connected' || !section) return;
    setIsSpeaking(true);
    try {
      const { TaskType } = await import(/* @vite-ignore */ HEYGEN_SDK_URL);
      const system = buildOliviaPrompt(section.title, section.cat, section.prompt, currentAnswer, (section as { oliviaContext?: OliviaContext }).oliviaContext);

      const reply = await sendOliviaMessage({
        messages: [{ role: 'user', content: text }],
        system,
        sessionId,
      });

      await avatarRef.current.speak({ text: reply, taskType: TaskType.REPEAT });
    } catch (err) {
      console.error('Speak error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input requires Chrome or Edge.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setUserInput(t);
      setTimeout(() => sendToOlivia(t), 300);
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  if (!open) return null;

  return (
    <div
      role="dialog" aria-label="Video Conversation with Olivia" aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: 'rgba(5,8,16,0.92)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'discovery-overlayIn 0.3s ease',
      }}
    >
      <div style={{
        width: 'clamp(320px,92vw,860px)', maxHeight: '92vh',
        background: 'var(--bg-primary)',
        border: '1px solid rgba(196,168,122,0.15)', borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        display: 'flex', flexDirection: 'column',
        animation: 'discovery-modalSlideUp 0.38s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(180deg,rgba(196,168,122,0.04) 0%,transparent 100%)',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: status === 'connected' ? '#4ade80' : status === 'connecting' ? '#C4A87A' : '#6b7280',
            boxShadow: status === 'connected' ? '0 0 8px #4ade8088' : status === 'connecting' ? '0 0 8px #C4A87A88' : 'none',
            animation: status === 'connecting' ? 'discovery-micGlow 1s ease-in-out infinite' : 'none',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant',serif", fontSize: 18, fontWeight: 300, color: C.textPrimary, letterSpacing: '0.04em' }}>
              Video Conversation with Olivia
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>
              {status === 'connecting' ? 'Connecting\u2026' : status === 'connected' ? 'Live \u00B7 CLUES\u2122 Advisor' : status === 'error' ? 'Connection failed' : 'Ready'}
            </div>
          </div>
          <button
            onClick={handleClose} className="discovery-btn"
            style={{
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontFamily: "'Outfit',sans-serif", fontSize: 12, color: '#f87171',
              letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>&#x23F9;</span> End Call
          </button>
        </div>

        {/* Video area */}
        <div style={{
          position: 'relative', flex: 1, minHeight: 360,
          background: '#050810',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <video
            ref={videoRef} autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'connected' ? 'block' : 'none' }}
          />

          {status === 'connecting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid rgba(196,168,122,0.2)', animation: 'discovery-oliviaRingOut 1.6s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid rgba(196,168,122,0.35)', animation: 'discovery-oliviaRingOut 1.6s ease-in-out 0.4s infinite' }} />
                <OliviaAvatar isSpeaking={false} size={88} />
              </div>
              <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 17, color: C.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
                Starting video session&hellip;<br />
                <span style={{ fontSize: 14, color: C.textMuted }}>Connecting to Olivia</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#C4A87A',
                    animation: `discovery-dotsBounceLazy 1.1s ease-in-out ${i * 0.22}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, maxWidth: 420, textAlign: 'center' }}>
              <div style={{ fontSize: 36, color: '#f87171' }}>&#x26A0;</div>
              <div style={{ fontFamily: "'Cormorant',serif", fontSize: 20, color: C.textPrimary }}>Connection Failed</div>
              <div style={{
                fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.7,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10, padding: '12px 16px',
              }}>{errorMsg}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted, lineHeight: 1.7 }}>
                Ensure <code style={{ color: '#C4A87A', background: 'rgba(196,168,122,0.1)', padding: '1px 6px', borderRadius: 4 }}>HEYGEN_API_KEY</code> is set in your Vercel environment variables.
              </div>
              <button
                onClick={initHeyGen} className="discovery-btn"
                style={{
                  padding: '10px 24px',
                  background: 'rgba(196,168,122,0.1)', border: '1px solid rgba(196,168,122,0.25)',
                  borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#C4A87A',
                }}
              >Try Again</button>
            </div>
          )}

          {status === 'connected' && isSpeaking && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 3, alignItems: 'flex-end',
              padding: '8px 16px', background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)', borderRadius: 20,
              border: '1px solid rgba(196,168,122,0.2)',
            }}>
              {[3, 5, 7, 5, 4, 6, 3, 5, 4].map((h, i) => (
                <div key={i} style={{
                  width: 3, height: h, background: '#C4A87A', borderRadius: 2,
                  animation: `discovery-soundBar 0.45s ease-in-out ${i * 0.07}s infinite alternate`,
                }} />
              ))}
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.1em', marginLeft: 8 }}>OLIVIA SPEAKING</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        {status === 'connected' && (
          <div style={{ padding: '14px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button
              onClick={toggleVoice}
              aria-label={isListening ? 'Stop voice' : 'Speak'}
              className="discovery-btn"
              style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: isListening ? 'rgba(196,168,122,0.2)' : 'rgba(255,255,255,0.05)',
                border: isListening ? '1px solid rgba(196,168,122,0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: isListening ? '#C4A87A' : C.textMuted,
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isListening ? 'discovery-micGlow 1.2s ease-in-out infinite' : 'none',
              }}
            >&#x1F3A4;</button>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToOlivia(userInput); setUserInput(''); } }}
              placeholder="Type or speak to Olivia... (Enter to send)"
              rows={2}
              className="discovery-textarea"
              style={{ flex: 1, minHeight: 'auto', padding: '10px 14px' }}
            />
            <button
              onClick={() => { sendToOlivia(userInput); setUserInput(''); }}
              disabled={!userInput.trim() || isSpeaking}
              className="discovery-btn"
              aria-label="Send"
              style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: userInput.trim() ? 'rgba(196,168,122,0.15)' : 'rgba(255,255,255,0.03)',
                border: userInput.trim() ? '1px solid rgba(196,168,122,0.35)' : '1px solid rgba(255,255,255,0.07)',
                color: userInput.trim() ? '#C4A87A' : C.textMuted,
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >&rarr;</button>
          </div>
        )}
      </div>
    </div>
  );
}
