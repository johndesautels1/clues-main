/**
 * CLUES Discovery Questionnaire — Main Orchestrator
 *
 * Integrates with UserContext for Supabase persistence.
 * localStorage fallback for anonymous/returning users.
 * Progress bar, auto-save indicator, save & exit, welcome-back toast.
 * All WCAG 2.1 AA fixes applied:
 *  - pageBg = #0a0e1a (matches globals.css --bg-primary)
 *  - All font sizes >= 11px
 *  - Disabled opacity >= 0.6 with grayscale
 *  - All interactive elements have focus-visible outlines
 *  - Placeholder text meets 4.5:1 contrast
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { extractParagraphical } from '../../lib/api';
import { recalculateTier } from '../../lib/tierEngine';
import { SECTIONS, CAT_COLORS, C, wordCount, DISCOVERY_STORAGE_KEY } from './discoveryData';
import { ParticleField } from './ParticleField';
import { Timeline } from './Timeline';
import { NavOverlay } from './NavOverlay';
import { OliviaChoiceModal } from './OliviaChoiceModal';
import { OliviaPanel } from './OliviaPanel';
import { HeyGenVideoModal } from './HeyGenVideoModal';
import { OliviaAvatar } from './OliviaAvatar';
import './Discovery.css';

export function DiscoveryFlow() {
  const navigate = useNavigate();
  const { session, dispatch } = useUser();

  // ─── State ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'welcome' | 'active' | 'complete'>('welcome');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [transitioning, setTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [showNav, setShowNav] = useState(false);
  // savedFlash removed — replaced by saveStatus indicator
  const [direction, setDirection] = useState(1);
  const [shareFlash, setShareFlash] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);
  const [oliviaChoiceOpen, setOliviaChoiceOpen] = useState(false);
  const [oliviaChatOpen, setOliviaChatOpen] = useState(false);
  const [oliviaVideoOpen, setOliviaVideoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const section = SECTIONS[current];
  const completed = Object.values(answers).filter((a) => a?.trim().length > 0).length;
  const currentAnswer = answers[section?.id] || '';
  const wc = wordCount(currentAnswer);
  const accent = section?.accent || C.focusDefault;

  // ─── Load from UserContext + localStorage on mount ──────────────
  useEffect(() => {
    const loaded: Record<number, string> = {};
    let hasData = false;

    // First: load from UserContext (Supabase-backed)
    if (session.paragraphical.paragraphs.length > 0) {
      session.paragraphical.paragraphs.forEach((p) => {
        if (p.content.trim()) {
          loaded[p.id] = p.content;
          hasData = true;
        }
      });
    }

    // Second: merge localStorage fallback (for anonymous)
    try {
      const stored = localStorage.getItem(DISCOVERY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<number, string>;
        Object.entries(parsed).forEach(([key, val]) => {
          const id = Number(key);
          if (val?.trim() && !loaded[id]) {
            loaded[id] = val;
            hasData = true;
          }
        });
      }
    } catch { /* ignore corrupt localStorage */ }

    if (hasData) {
      setAnswers(loaded);
      setPhase('active');
      // Welcome back toast
      const filledCount = Object.values(loaded).filter((v) => v?.trim()).length;
      setTimeout(() => {
        toast.success(`Welcome back! You have ${filledCount}/${SECTIONS.length} sections saved. Pick up where you left off.`, { duration: 4000 });
      }, 600);
    }
  }, []); // Run once on mount only

  // ─── Save to localStorage on every answer change ────────────────
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(answers));
    } catch { /* quota exceeded — non-fatal */ }
  }, [answers]);

  // ─── Sync to UserContext on answer change (debounced) ───────────
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      Object.entries(answers).forEach(([key, val]) => {
        const id = Number(key);
        const s = SECTIONS.find((x) => x.id === id);
        if (s && val.trim()) {
          dispatch({
            type: 'UPDATE_PARAGRAPH',
            payload: {
              id,
              heading: s.title,
              content: val.trim(),
              updatedAt: new Date().toISOString(),
            },
          });
        }
      });
      // Mark paragraphical as in_progress
      if (session.paragraphical.status === 'not_started') {
        dispatch({ type: 'SET_PARAGRAPHICAL_STATUS', payload: 'in_progress' });
      }
      setSaveStatus('saved');
      // Reset back to idle after 2s so the indicator fades
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, dispatch, session.paragraphical.status]);

  // ─── Navigation ─────────────────────────────────────────────────
  const navigateTo = useCallback(
    (idx: number, dir?: number) => {
      if (transitioning || idx === current) return;
      setDirection(dir ?? (idx > current ? 1 : -1));
      setContentVisible(false);
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(idx);
        setTimeout(() => {
          setContentVisible(true);
          setTransitioning(false);
        }, 80);
      }, 350);
    },
    [transitioning, current]
  );

  const goNext = useCallback(() => {
    if (current < SECTIONS.length - 1) {
      navigateTo(current + 1, 1);
    } else {
      setContentVisible(false);
      setTimeout(() => setPhase('complete'), 450);
    }
  }, [current, navigateTo]);

  const goPrev = useCallback(() => {
    if (current > 0) navigateTo(current - 1, -1);
  }, [current, navigateTo]);

  // ─── Keyboard navigation ──────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') {
        setOliviaChoiceOpen(false);
        setOliviaChatOpen(false);
        setOliviaVideoOpen(false);
        setShowNav(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev]);

  // ─── Auto-focus textarea ────────────────────────────────────────
  useEffect(() => {
    if (phase === 'active' && contentVisible) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 280);
      return () => clearTimeout(timer);
    }
  }, [current, contentVisible, phase]);

  // savedFlash effect removed — saveStatus handles auto-save feedback

  // ─── Stop voice on section change ──────────────────────────────
  useEffect(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    if (isSpeakingAnswer) { window.speechSynthesis?.cancel(); setIsSpeakingAnswer(false); }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Voice dictation ───────────────────────────────────────────
  const toggleDictation = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice dictation requires Chrome or Edge.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results)
        .slice(e.resultIndex)
        .map((res) => res[0].transcript)
        .join(' ');
      setAnswers((prev) => ({
        ...prev,
        [section.id]: (prev[section.id] || '') + (prev[section.id] ? ' ' : '') + t,
      }));
    };
    r.onend = () => setIsListening(false);
    r.onerror = (e: Event) => {
      if ((e as any).error !== 'aborted') console.warn((e as any).error);
      setIsListening(false);
    };
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  }, [isListening, section?.id]);

  // ─── TTS playback ──────────────────────────────────────────────
  const togglePlayAnswer = useCallback(() => {
    if (isSpeakingAnswer) { window.speechSynthesis?.cancel(); setIsSpeakingAnswer(false); return; }
    if (!currentAnswer.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentAnswer);
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    setIsSpeakingAnswer(true);
    u.onend = () => setIsSpeakingAnswer(false);
    u.onerror = () => setIsSpeakingAnswer(false);
    window.speechSynthesis.speak(u);
  }, [isSpeakingAnswer, currentAnswer]);

  // ─── Download ──────────────────────────────────────────────────
  const downloadAnswers = useCallback(
    (format: 'txt' | 'json' = 'txt') => {
      const ts = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      let content: string, filename: string, type: string;

      if (format === 'json') {
        const data = {
          system: 'CLUES\u2122 Discovery Questionnaire',
          company: 'Clues Intelligence LTD',
          completedDate: ts,
          sectionsCompleted: completed,
          totalSections: SECTIONS.length,
          answers: SECTIONS.reduce<Record<number, { title: string; category: string; response: string }>>((acc, s) => {
            acc[s.id] = { title: s.title, category: s.cat, response: answers[s.id] || '' };
            return acc;
          }, {}),
        };
        content = JSON.stringify(data, null, 2);
        filename = `CLUES-Discovery-${Date.now()}.json`;
        type = 'application/json';
      } else {
        const lines = [
          'CLUES\u2122 DISCOVERY QUESTIONNAIRE',
          'Clues Intelligence LTD',
          `Completed: ${ts} \u00B7 ${completed}/${SECTIONS.length} sections`,
          '\u2550'.repeat(60),
          '',
        ];
        let lastCat = '';
        SECTIONS.forEach((s) => {
          if (s.cat !== lastCat) {
            lines.push(`\n\u2500\u2500 ${s.cat.toUpperCase()} \u2500\u2500`);
            lastCat = s.cat;
          }
          lines.push(`\n${s.id}. ${s.title}`);
          lines.push(`Question: ${s.prompt}`);
          lines.push(`Response: ${answers[s.id] || '(not answered)'}`);
          if (answers[s.id]) lines.push(`Words: ${wordCount(answers[s.id])}`);
        });
        content = lines.join('\n');
        filename = `CLUES-Discovery-${Date.now()}.txt`;
        type = 'text/plain';
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [answers, completed]
  );

  // ─── Share ─────────────────────────────────────────────────────
  const shareAnswers = useCallback(async () => {
    const summary = SECTIONS.filter((s) => answers[s.id]?.trim())
      .map((s) => `${s.title}: ${answers[s.id]}`)
      .join('\n\n');
    const shareText = `My CLUES\u2122 Discovery Questionnaire\n${completed}/${SECTIONS.length} sections completed\n\n${summary}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'CLUES\u2122 Discovery', text: shareText }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFlash(true);
      setTimeout(() => setShareFlash(false), 2000);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  }, [answers, completed]);

  // ─── Submit (Gemini extraction) ────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    const filledParagraphs = SECTIONS.filter((s) => answers[s.id]?.trim()).map((s) => ({
      id: s.id,
      heading: s.title,
      content: answers[s.id].trim(),
      updatedAt: new Date().toISOString(),
    }));

    if (filledParagraphs.length === 0) {
      toast.error('Please write at least one section before submitting.');
      return;
    }

    const confirmed = window.confirm(
      `Submit ${filledParagraphs.length} of ${SECTIONS.length} sections for AI analysis?\n\n` +
      `${SECTIONS.length - filledParagraphs.length} sections are still empty. You can always come back and add more later.`
    );
    if (!confirmed) return;

    dispatch({ type: 'SET_PARAGRAPHICAL_STATUS', payload: 'completed' });
    setIsSubmitting(true);

    try {
      const globeRegion = session.globe?.region ?? 'Global';
      const result = await extractParagraphical({
        paragraphs: filledParagraphs,
        globeRegion,
        sessionId: session.id,
      });

      dispatch({ type: 'SET_EXTRACTION', payload: result.extraction });

      const updatedSession = {
        ...session,
        paragraphical: { ...session.paragraphical, status: 'completed' as const, extraction: result.extraction },
      };
      const { tier, confidence } = recalculateTier(updatedSession);
      dispatch({ type: 'SET_TIER', payload: { tier, confidence } });

      toast.success(
        `Discovery complete! ${filledParagraphs.length} sections analyzed. Confidence: ${confidence}%`
      );
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      console.error('[Discovery] Gemini extraction failed:', message);
      toast.error(`Sections saved, but AI analysis failed: ${message}. You can retry from the dashboard.`);
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, dispatch, session, navigate, isSubmitting]);

  // ═══════════════════════════════════════════════════════════════
  // WELCOME PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'welcome') {
    return (
      <div className="discovery-universe" role="main">
        <ParticleField accent="#C4A87A" />
        <div className="discovery-grain" aria-hidden="true" />
        <div className="discovery-orb" aria-hidden="true" style={{ width: 550, height: 550, top: '-12%', left: '-8%', background: 'radial-gradient(circle,#C4A87A10 0%,transparent 70%)' }} />
        <div className="discovery-orb" aria-hidden="true" style={{ width: 450, height: 450, bottom: '-8%', right: '-4%', background: 'radial-gradient(circle,#92ADB60D 0%,transparent 70%)', animationDelay: '4s' }} />
        <div className="discovery-fadeInUp discovery-glass" style={{ maxWidth: 720, textAlign: 'center', padding: 'clamp(40px,6vw,68px) clamp(28px,4vw,52px)', zIndex: 10, position: 'relative' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(38px,5vw,54px)', fontWeight: 300, color: C.textPrimary, letterSpacing: '0.18em' }}>CLUES</span>
            <span style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(22px,3vw,30px)', color: '#C4A87A', verticalAlign: 'super', marginLeft: 2 }}>&trade;</span>
          </div>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 40 }}>
            Comprehensive Location Utility &amp; Evaluation System
          </p>
          <h1 style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 300, color: C.textPrimary, margin: '0 0 20px', lineHeight: 1.35 }}>
            Your Journey Begins Here
          </h1>
          <p style={{ fontFamily: "'Crimson Pro',Georgia,serif", fontSize: 'clamp(16px,1.8vw,18px)', color: C.textSecondary, lineHeight: 1.8, margin: '0 auto 12px', maxWidth: 520 }}>
            Over 27 intimate conversations, you&rsquo;ll paint a complete portrait of who you are and the life you&rsquo;ve been dreaming about.
          </p>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 'clamp(14px,1.5vw,16px)', color: C.textMuted, lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 480 }}>
            There are no right or wrong answers &mdash; only your truth.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
            {[
              { icon: '\u{1F3A4}', label: 'Voice Dictation' },
              { icon: '\u{1F50A}', label: 'Audio Playback' },
              { icon: '\u{1F4AC}', label: 'Chat with Olivia' },
              { icon: '\u{1F3A5}', label: 'Video with Olivia' },
              { icon: '\u2B07', label: 'Download & Share' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', background: 'rgba(196,168,122,0.06)',
                border: '1px solid rgba(196,168,122,0.16)', borderRadius: 20,
                fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.08em',
              }}>
                <span style={{ fontSize: 12 }}>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px,4vw,44px)', marginBottom: 40 }}>
            {[{ n: '27', l: 'Sections' }, { n: '11', l: 'Categories' }, { n: '~30', l: 'Minutes' }].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant',serif", fontSize: 28, fontWeight: 300, color: '#C4A87A' }}>{s.n}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setPhase('active'); setContentVisible(true); }}
            className="discovery-btn"
            style={{
              background: 'linear-gradient(135deg,rgba(196,168,122,0.14) 0%,rgba(196,168,122,0.06) 100%)',
              border: '1px solid rgba(196,168,122,0.28)', borderRadius: 14,
              padding: '16px 40px', fontFamily: "'Outfit',sans-serif", fontSize: 14,
              fontWeight: 400, color: '#C4A87A', display: 'inline-flex', alignItems: 'center',
            }}
          >
            <span style={{ letterSpacing: '0.1em' }}>Begin Your Discovery</span>
            <span aria-hidden="true" style={{ marginLeft: 14, opacity: 0.6, fontSize: 14 }}>&rarr;</span>
          </button>
          <p style={{ marginTop: 36, fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>
            Clues Intelligence LTD
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPLETE PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'complete') {
    return (
      <div className="discovery-universe" role="main">
        <ParticleField accent="#C4A87A" />
        <div className="discovery-grain" aria-hidden="true" />
        <div className="discovery-fadeInUp discovery-glass" style={{ maxWidth: 620, textAlign: 'center', padding: 'clamp(48px,5vw,64px) clamp(32px,4vw,48px)', zIndex: 10, position: 'relative' }}>
          <div style={{ fontSize: 38, marginBottom: 24, color: '#C4A87A' }}>{'\u2726'}</div>
          <h1 style={{ fontFamily: "'Cormorant',serif", fontSize: 34, fontWeight: 300, color: C.textPrimary, margin: '0 0 16px' }}>Your Story Is Written</h1>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: C.textSecondary, lineHeight: 1.8, margin: '0 0 8px' }}>
            You completed <strong style={{ color: '#C4A87A' }}>{completed}</strong> of {SECTIONS.length} sections.
          </p>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 16, color: C.textMuted, lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 440 }}>
            Our AI analysts will craft your personalized relocation intelligence report &mdash; best country, top cities, finest neighborhoods, and your roadmap to your new life.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => downloadAnswers('txt')} className="discovery-btn" style={{ padding: '11px 22px', background: 'rgba(196,168,122,0.09)', border: '1px solid rgba(196,168,122,0.25)', borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#C4A87A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{'\u2B07'}</span> Download TXT
            </button>
            <button onClick={() => downloadAnswers('json')} className="discovery-btn" style={{ padding: '11px 22px', background: 'rgba(196,168,122,0.06)', border: '1px solid rgba(196,168,122,0.18)', borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#C4A87A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{'{ }'}</span> Download JSON
            </button>
            <button onClick={shareAnswers} className="discovery-btn" style={{ padding: '11px 22px', background: 'rgba(196,168,122,0.06)', border: '1px solid rgba(196,168,122,0.18)', borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#C4A87A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{'\u2398'}</span> Copy All
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="discovery-btn"
            style={{
              padding: '14px 36px', marginBottom: 24,
              background: 'linear-gradient(135deg,rgba(196,168,122,0.18) 0%,rgba(196,168,122,0.08) 100%)',
              border: '1px solid rgba(196,168,122,0.35)', borderRadius: 14,
              fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 500,
              color: '#C4A87A', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 10,
            }}
          >
            {isSubmitting ? 'Analyzing with AI...' : 'Submit for AI Analysis'}
            {!isSubmitting && <span aria-hidden="true">&rarr;</span>}
          </button>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textMuted }}>
            Clues Intelligence LTD
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE PHASE
  // ═══════════════════════════════════════════════════════════════
  const catColor = CAT_COLORS[section.cat];

  return (
    <div className="discovery-universe" role="main" style={{ transition: 'background 0.8s ease' }}>
      <ParticleField accent={accent} />
      <div className="discovery-grain" aria-hidden="true" />
      <div className="discovery-orb" aria-hidden="true" style={{ width: 480, height: 480, top: '-6%', left: '-6%', background: `radial-gradient(circle,${accent}09 0%,transparent 65%)` }} />
      <div className="discovery-orb" aria-hidden="true" style={{ width: 380, height: 380, bottom: '4%', right: oliviaChatOpen ? '420px' : '0', background: `radial-gradient(circle,${accent}07 0%,transparent 65%)`, animationDelay: '5s', transition: 'all 1s ease' }} />

      {/* Top bar */}
      <header className="discovery-topbar">
        <button
          onClick={() => setShowNav(true)} aria-label="Open navigation" className="discovery-btn"
          style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.divider}`,
            borderRadius: 10, width: 42, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary,
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <line x1="0" y1="1" x2="18" y2="1" stroke={C.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="7" x2="14" y2="7" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="13" x2="18" y2="13" stroke={C.textSecondary} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Auto-save indicator */}
          <span aria-live="polite" style={{
            fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.08em',
            color: saveStatus === 'saving' ? '#f59e0b' : saveStatus === 'saved' ? '#22c55e' : 'transparent',
            transition: 'color 0.35s ease', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {saveStatus === 'saving' && <>{'\u25CF'} Saving&hellip;</>}
            {saveStatus === 'saved' && <>{'\u2713'} Saved</>}
          </span>
          {/* Save & Continue Later */}
          <button
            onClick={() => {
              toast.success(`Progress saved! ${completed}/${SECTIONS.length} sections complete. You can return anytime to continue.`, { duration: 3500 });
              setTimeout(() => navigate('/'), 800);
            }}
            className="discovery-btn" aria-label="Save and continue later"
            style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.divider}`,
              borderRadius: 10, padding: '7px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textSecondary,
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ fontSize: 13 }}>{'\u{1F4BE}'}</span> Save &amp; Exit
          </button>
          <button onClick={() => downloadAnswers('txt')} aria-label="Download TXT" className="discovery-btn" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.divider}`, borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, fontSize: 14 }}>
            {'\u2B07'}
          </button>
          <button onClick={shareAnswers} title={shareFlash ? 'Copied!' : 'Copy'} className="discovery-btn" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${shareFlash ? accent + '55' : C.divider}`, borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: shareFlash ? accent : C.textSecondary, fontSize: 14 }}>
            {shareFlash ? '\u2713' : '\u2398'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.divider}`, borderRadius: 18, padding: '7px 16px 7px 10px' }}>
            <svg width="28" height="28" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="14" cy="14" r="11" fill="none" stroke={C.divider} strokeWidth="2.5" />
              <circle cx="14" cy="14" r="11" fill="none" stroke={accent} strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 11} strokeDashoffset={2 * Math.PI * 11 * (1 - completed / SECTIONS.length)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1), stroke 0.5s ease' }}
              />
            </svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: C.textSecondary }}>
              <span style={{ color: accent, fontWeight: 500 }}>{completed}</span>/{SECTIONS.length}
            </span>
          </div>
          {/* Close (X) button */}
          <button
            onClick={() => navigate('/')} className="discovery-btn" aria-label="Close and return to dashboard"
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, width: 42, height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171', fontSize: 18, fontWeight: 300,
            }}
          >&times;</button>
        </div>
      </header>

      {/* Progress bar */}
      <div role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={SECTIONS.length} aria-label={`${completed} of ${SECTIONS.length} sections completed`}
        style={{
          position: 'fixed', top: 58, left: 0, right: 0, zIndex: 99,
          height: 3, background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div style={{
          height: '100%', borderRadius: '0 2px 2px 0',
          background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
          width: `${(completed / SECTIONS.length) * 100}%`,
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: `0 0 8px ${accent}44`,
        }} />
      </div>

      <Timeline current={current} answers={answers} onNavigate={navigateTo} />
      <NavOverlay visible={showNav} onClose={() => setShowNav(false)} current={current} answers={answers} onNavigate={navigateTo} />
      <OliviaChoiceModal
        visible={oliviaChoiceOpen}
        onClose={() => setOliviaChoiceOpen(false)}
        onSelectChat={() => { setOliviaChoiceOpen(false); setOliviaChatOpen(true); }}
        onSelectVideo={() => { setOliviaChoiceOpen(false); setOliviaVideoOpen(true); }}
        section={section}
      />
      <HeyGenVideoModal open={oliviaVideoOpen} onClose={() => setOliviaVideoOpen(false)} section={section} currentAnswer={currentAnswer} sessionId={session.id} />
      <OliviaPanel open={oliviaChatOpen} onClose={() => setOliviaChatOpen(false)} section={section} currentAnswer={currentAnswer} accent={accent} sessionId={session.id} />

      {/* Main content area */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', width: '100%',
        padding: '80px 22px 36px',
        paddingRight: oliviaChatOpen ? 'clamp(420px,36vw,460px)' : 'clamp(20px,5vw,68px)',
        transition: 'padding-right 0.4s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : `translateY(${direction > 0 ? '20px' : '-20px'})`,
          transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
          maxWidth: 660, width: '100%',
        }}>
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <span aria-hidden="true" style={{ fontSize: 13, color: catColor }}>{section.icon}</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: catColor }}>{section.cat}</span>
          </div>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted, marginBottom: 18 }}>Section {section.id} of {SECTIONS.length}</p>

          {/* Card */}
          <div className="discovery-glass" style={{ padding: 'clamp(28px,4vw,44px) clamp(24px,3.5vw,40px)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{
              fontFamily: "'Cormorant',serif", fontSize: 'clamp(28px,3.8vw,40px)',
              fontWeight: 300, color: C.textPrimary, margin: 0, lineHeight: 1.25,
              opacity: contentVisible ? 1 : 0, transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s',
            }}>{section.title}</h2>

            <div aria-hidden="true" style={{
              width: 36, height: 2, borderRadius: 1, background: accent,
              margin: '14px 0 18px',
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left',
              transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1) 0.18s',
            }} />

            <p style={{
              fontFamily: "'Crimson Pro',Georgia,serif", fontSize: 'clamp(16px,1.6vw,18px)',
              color: C.textSecondary, lineHeight: 1.8, margin: '0 0 24px',
              opacity: contentVisible ? 1 : 0, transition: 'opacity 0.45s ease 0.12s',
            }}>{section.prompt}</p>

            <div aria-hidden="true" style={{ height: 1, background: C.divider, marginBottom: 22 }} />

            <div style={{ position: 'relative' }}>
              <label htmlFor={`section-${section.id}`} className="sr-only">Your response to: {section.title}</label>
              <textarea
                id={`section-${section.id}`}
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [section.id]: e.target.value }))}
                placeholder={section.hint}
                className="discovery-textarea"
                style={{
                  borderColor: isListening ? '#C4A87A' : currentAnswer ? accent : C.inputBorder,
                  boxShadow: isListening ? '0 0 0 2px rgba(196,168,122,0.2)' : 'none',
                }}
              />
              <div style={{ position: 'absolute', bottom: 14, right: 18 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: wc > 0 ? accent : C.textMuted }}>
                  {wc} {wc === 1 ? 'word' : 'words'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={toggleDictation} className="discovery-btn"
                aria-label={isListening ? 'Stop' : 'Dictate'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 15px',
                  background: isListening ? 'rgba(196,168,122,0.14)' : 'rgba(255,255,255,0.04)',
                  border: isListening ? '1px solid rgba(196,168,122,0.45)' : `1px solid ${C.divider}`,
                  borderRadius: 20, fontSize: 12, color: isListening ? '#C4A87A' : C.textMuted,
                  animation: isListening ? 'discovery-micGlow 1.3s ease-in-out infinite' : 'none',
                }}
              >
                <span>{'\u{1F3A4}'}</span><span>{isListening ? 'Recording\u2026' : 'Dictate'}</span>
              </button>
              <button
                onClick={togglePlayAnswer} disabled={!currentAnswer.trim()} className="discovery-btn"
                aria-label={isSpeakingAnswer ? 'Stop' : 'Play'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 15px',
                  background: isSpeakingAnswer ? 'rgba(196,168,122,0.1)' : 'rgba(255,255,255,0.04)',
                  border: isSpeakingAnswer ? '1px solid rgba(196,168,122,0.3)' : `1px solid ${C.divider}`,
                  borderRadius: 20, fontSize: 12,
                  color: isSpeakingAnswer ? '#C4A87A' : currentAnswer ? C.textMuted : C.textPlaceholder,
                }}
              >
                <span>{isSpeakingAnswer ? '\u23F9' : '\u{1F50A}'}</span>
                <span>{isSpeakingAnswer ? 'Stop' : 'Play'}</span>
              </button>
              <button
                onClick={() => setOliviaChoiceOpen(true)} className="discovery-btn"
                aria-label="Connect with Olivia"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg,rgba(196,168,122,0.15) 0%,rgba(196,168,122,0.07) 100%)',
                  border: '1px solid rgba(196,168,122,0.3)', borderRadius: 20,
                  fontSize: 12, letterSpacing: '0.07em', color: '#C4A87A',
                  boxShadow: (oliviaChatOpen || oliviaVideoOpen) ? '0 0 0 2px rgba(196,168,122,0.2)' : 'none',
                }}
              >
                <OliviaAvatar isSpeaking={false} size={20} />
                <span>Ask Olivia</span>
                {(oliviaChatOpen || oliviaVideoOpen) && <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u25CF'}</span>}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Section navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, gap: 14 }}>
            <button
              onClick={goPrev} disabled={current === 0} className="discovery-btn"
              aria-label="Previous"
              style={{
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.divider}`,
                borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 400,
                color: C.textSecondary, display: 'flex', alignItems: 'center',
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 8, fontSize: 13 }}>&larr;</span>Previous
            </button>

            <div aria-hidden="true" style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
              {SECTIONS.map((s, i) => {
                const isActive = i === current;
                const hasAns = (answers[s.id]?.trim().length ?? 0) > 0;
                const isBoundary = i > 0 && s.cat !== SECTIONS[i - 1].cat;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    {isBoundary && <div style={{ width: 3 }} />}
                    <button
                      tabIndex={-1}
                      onClick={() => navigateTo(i)}
                      className="discovery-btn"
                      style={{
                        width: isActive ? 16 : 6, height: 6, borderRadius: 3,
                        border: 'none', padding: 0,
                        background: isActive ? accent : hasAns ? s.accent : C.divider,
                        transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                        boxShadow: isActive ? `0 0 8px ${accent}44` : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {current < SECTIONS.length - 1 ? (
              <button
                onClick={goNext} className="discovery-btn" aria-label="Next"
                style={{
                  background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.divider}`,
                  borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 400,
                  color: C.textSecondary, display: 'flex', alignItems: 'center',
                  letterSpacing: '0.03em', whiteSpace: 'nowrap',
                }}
              >
                Next<span style={{ marginLeft: 8, fontSize: 13 }}>&rarr;</span>
              </button>
            ) : (
              <button
                onClick={goNext} className="discovery-btn" aria-label="Complete"
                style={{
                  background: 'rgba(196,168,122,0.06)', border: '1px solid #C4A87A55',
                  borderRadius: 11, padding: '11px 20px', fontSize: 13, fontWeight: 400,
                  color: '#C4A87A', display: 'flex', alignItems: 'center',
                  letterSpacing: '0.03em', whiteSpace: 'nowrap',
                }}
              >
                Complete<span style={{ marginLeft: 8, fontSize: 14 }}>{'\u2726'}</span>
              </button>
            )}
          </nav>
          <p aria-hidden="true" style={{ textAlign: 'center', marginTop: 18, fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted, letterSpacing: '0.06em' }}>
            Use &larr; &rarr; arrow keys to navigate between sections
          </p>
        </div>
      </div>
    </div>
  );
}
