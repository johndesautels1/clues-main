/**
 * OliviaPanel — Chat sidebar
 * Routes all AI calls through /api/olivia-chat (server-side proxy).
 * Fixes stale closure issues with useRef for messages.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { OliviaAvatar } from './OliviaAvatar';
import { C, buildOliviaPrompt, type DiscoverySection } from './discoveryData';
import { sendOliviaMessage } from '../../lib/oliviaApi';

interface OliviaPanelProps {
  open: boolean;
  onClose: () => void;
  section: DiscoverySection;
  currentAnswer: string;
  accent: string;
  sessionId?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function OliviaPanel({ open, onClose, section, currentAnswer, accent, sessionId }: OliviaPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [oliviaSpeaking, setOliviaSpeaking] = useState(false);
  const [oliviaListening, setOliviaListening] = useState(false);
  const [lastSectionId, setLastSectionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const oliviaRecRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Use ref to avoid stale closure in sendMessage
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.91;
    u.pitch = 1.08;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes('Samantha') || v.name.includes('Karen') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    );
    if (preferred) u.voice = preferred;
    setOliviaSpeaking(true);
    u.onend = () => setOliviaSpeaking(false);
    u.onerror = () => setOliviaSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const sendMessage = useCallback(
    async (userText: string | null, isGreeting = false) => {
      const userMsg = userText?.trim();
      const currentMessages = messagesRef.current;
      const historyWithNew: ChatMessage[] = isGreeting ? [] : [...currentMessages, { role: 'user' as const, content: userMsg! }];

      if (!isGreeting && userMsg) {
        setMessages(historyWithNew);
      }

      setLoading(true);
      try {
        const system = buildOliviaPrompt(section.title, section.cat, section.prompt, currentAnswer);
        const apiMessages = isGreeting
          ? [{ role: 'user' as const, content: `Greet me warmly as Olivia and invite me to talk about: "${section.title}". 2-3 sentences.` }]
          : historyWithNew.map((m) => ({ role: m.role, content: m.content }));

        const reply = await sendOliviaMessage({
          messages: apiMessages,
          system,
          sessionId,
        });

        setMessages((prev) =>
          isGreeting ? [{ role: 'assistant', content: reply }] : [...prev, { role: 'assistant', content: reply }]
        );
        speakText(reply);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: "I'm having a connectivity moment. Please try again." }]);
      } finally {
        setLoading(false);
      }
    },
    [section, currentAnswer, speakText, sessionId]
  );

  // Greet on section change
  useEffect(() => {
    if (open && section?.id !== lastSectionId) {
      setLastSectionId(section?.id ?? null);
      setMessages([]);
      const timer = setTimeout(() => sendMessage(null, true), 350);
      return () => clearTimeout(timer);
    }
  }, [open, section?.id, lastSectionId, sendMessage]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const toggleOliviaVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input requires Chrome or Edge.'); return; }
    if (oliviaListening) { oliviaRecRef.current?.stop(); setOliviaListening(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + t : t));
    };
    r.onend = () => setOliviaListening(false);
    r.onerror = () => setOliviaListening(false);
    oliviaRecRef.current = r;
    r.start();
    setOliviaListening(true);
  };

  if (!open) return null;

  return (
    <div
      role="complementary"
      aria-label="Chat with Olivia"
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
        background: 'rgba(10,14,26,0.98)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        borderLeft: '1px solid rgba(196,168,122,0.12)',
        zIndex: 499, display: 'flex', flexDirection: 'column',
        animation: 'discovery-slideInRight 0.38s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(180deg,rgba(196,168,122,0.04) 0%,transparent 100%)',
      }}>
        <OliviaAvatar isSpeaking={oliviaSpeaking} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant',serif", fontSize: 20, fontWeight: 400, color: C.textPrimary, letterSpacing: '0.05em' }}>Olivia</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
            {oliviaSpeaking ? '\u25CF Speaking...' : oliviaListening ? '\u25CF Listening...' : 'CLUES\u2122 Advisor'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {oliviaSpeaking && (
            <button
              onClick={() => { window.speechSynthesis?.cancel(); setOliviaSpeaking(false); }}
              className="discovery-btn"
              aria-label="Stop speaking"
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: C.textMuted, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >&#x23F9;</button>
          )}
          <button
            onClick={onClose} aria-label="Close chat" className="discovery-btn"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: C.textMuted, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >&times;</button>
        </div>
      </div>

      {/* Section context */}
      <div style={{
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: `linear-gradient(135deg,${accent}08 0%,transparent 100%)`,
      }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 3 }}>
          Now discussing
        </div>
        <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 15, color: C.textSecondary }}>
          {section.icon} {section.title}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, opacity: 0.5, paddingTop: 40 }}>
            <div style={{ fontSize: 28, color: '#C4A87A' }}>{'\u25C6'}</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 1.6, maxWidth: 240 }}>
              Connecting with Olivia&hellip;
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, paddingLeft: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden' }}>
                  <OliviaAvatar isSpeaking={false} size={18} />
                </div>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Olivia</span>
              </div>
            )}
            <div
              style={{
                maxWidth: '90%', padding: '11px 15px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg,rgba(196,168,122,0.14) 0%,rgba(196,168,122,0.08) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: m.role === 'user' ? '1px solid rgba(196,168,122,0.22)' : '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'Crimson Pro',Georgia,serif", fontSize: 15, lineHeight: 1.7,
                color: m.role === 'user' ? C.textPrimary : '#C5C0B8',
              }}
            >
              {m.content}
            </div>
            {m.role === 'assistant' && (
              <button
                onClick={() => speakText(m.content)}
                className="discovery-btn"
                style={{
                  marginTop: 4, marginLeft: 4, background: 'none', border: 'none',
                  color: C.textMuted, fontSize: 11, padding: '2px 6px',
                  fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 12 }}>&#x1F50A;</span> replay
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 4 }}>
            <div style={{
              display: 'flex', gap: 5, padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '4px 18px 18px 18px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#C4A87A',
                  animation: `discovery-dotsBounceLazy 1.1s ease-in-out ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 14px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={toggleOliviaVoice}
            aria-label={oliviaListening ? 'Stop' : 'Speak'}
            className="discovery-btn"
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: oliviaListening ? 'rgba(196,168,122,0.18)' : 'rgba(255,255,255,0.04)',
              border: oliviaListening ? '1px solid rgba(196,168,122,0.45)' : '1px solid rgba(255,255,255,0.09)',
              color: oliviaListening ? '#C4A87A' : C.textMuted,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: oliviaListening ? 'discovery-micGlow 1.2s ease-in-out infinite' : 'none',
            }}
          >&#x1F3A4;</button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask Olivia anything..."
            rows={2}
            className="discovery-textarea"
            style={{ flex: 1, minHeight: 'auto', padding: '10px 14px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="discovery-btn"
            aria-label="Send message"
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: input.trim() ? 'rgba(196,168,122,0.15)' : 'rgba(255,255,255,0.03)',
              border: input.trim() ? '1px solid rgba(196,168,122,0.35)' : '1px solid rgba(255,255,255,0.07)',
              color: input.trim() ? '#C4A87A' : C.textMuted,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >&rarr;</button>
        </div>
        <div style={{
          marginTop: 7, fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted,
          textAlign: 'center', letterSpacing: '0.07em',
        }}>
          Enter to send &middot; Shift+Enter for new line &middot; &#x1F3A4; for voice
        </div>
      </div>
    </div>
  );
}
