/**
 * CLUES Main Module Questionnaire — One-Question-At-A-Time Flow
 *
 * 5 sections: Demographics → Do Not Wants → Must Haves → Trade-offs → General
 * ~200 questions from the question library, with logic jumps (skip irrelevant Qs).
 *
 * Pattern follows DiscoveryFlow:
 *  - Phase-based UI: welcome → active → complete
 *  - Direction-aware fade transitions
 *  - Olivia integration (chat, voice, video)
 *  - Auto-save: localStorage (immediate) + UserContext (debounced)
 *  - WCAG 2.1 AA compliant throughout
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { useQuestionnaireState } from '../../hooks/useQuestionnaireState';
import { QUESTIONNAIRE_SECTIONS, getCleanQuestion, getSkippedQuestions, C } from './questionnaireData';
import { QuestionRenderer } from './QuestionRenderer';
import { ParticleField } from '../Discovery/ParticleField';
import { OliviaChoiceModal } from '../Discovery/OliviaChoiceModal';
import { OliviaPanel } from '../Discovery/OliviaPanel';
import { HeyGenVideoModal } from '../Discovery/HeyGenVideoModal';
import { OliviaAvatar } from '../Discovery/OliviaAvatar';
import type { OliviaContext } from '../Discovery/discoveryData';
import './Questionnaire.css';

export function MainQuestionnaire() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useUser();

  // ─── Phase State ───────────────────────────────────────────────
  const [phase, setPhase] = useState<'welcome' | 'active' | 'complete'>('welcome');
  const [contentVisible, setContentVisible] = useState(true);
  const [direction, setDirection] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  // ─── Olivia State ──────────────────────────────────────────────
  const [oliviaChoiceOpen, setOliviaChoiceOpen] = useState(false);
  const [oliviaChatOpen, setOliviaChatOpen] = useState(false);
  const [oliviaVideoOpen, setOliviaVideoOpen] = useState(false);

  // ─── Question Navigator State ────────────────────────────────
  const [questionNavOpen, setQuestionNavOpen] = useState(false);

  // ─── Questionnaire State (answers, nav, persistence) ──────────
  const qs = useQuestionnaireState();

  // Jump to section from URL query param (e.g. /questionnaire?section=dnw)
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      const sectionIndex = QUESTIONNAIRE_SECTIONS.findIndex(s => s.id === sectionParam);
      if (sectionIndex >= 0) {
        qs.goToSection(sectionIndex);
        setPhase('active');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-detect returning user
  useEffect(() => {
    if (qs.progress.answeredCount > 0 && phase === 'welcome') {
      setPhase('active');
      setTimeout(() => {
        toast.success(
          `Welcome back! ${qs.progress.answeredCount}/${qs.progress.totalVisible} questions answered. Pick up where you left off.`,
          { duration: 4000 }
        );
      }, 600);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Navigation with Transitions ──────────────────────────────
  const navigateQuestion = useCallback(
    (goFn: () => boolean, dir: number) => {
      if (transitioning) return;
      setDirection(dir);
      setContentVisible(false);
      setTransitioning(true);
      setTimeout(() => {
        const moved = goFn();
        if (!moved && dir > 0) {
          // Reached end
          setPhase('complete');
        }
        setTimeout(() => {
          setContentVisible(true);
          setTransitioning(false);
        }, 80);
      }, 300);
    },
    [transitioning]
  );

  const handleNext = useCallback(() => navigateQuestion(qs.goNext, 1), [navigateQuestion, qs.goNext]);
  const handlePrev = useCallback(() => navigateQuestion(qs.goPrev, -1), [navigateQuestion, qs.goPrev]);

  const handleSectionClick = useCallback(
    (sectionIndex: number) => {
      if (transitioning) return;
      setContentVisible(false);
      setTransitioning(true);
      setDirection(sectionIndex > qs.nav.sectionIndex ? 1 : -1);
      setTimeout(() => {
        qs.goToSection(sectionIndex);
        setTimeout(() => {
          setContentVisible(true);
          setTransitioning(false);
        }, 80);
      }, 300);
    },
    [transitioning, qs]
  );

  // ─── Keyboard Navigation ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (phase !== 'active') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); handlePrev(); }
      if (e.key === 'Escape') {
        setOliviaChoiceOpen(false);
        setOliviaChatOpen(false);
        setOliviaVideoOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleNext, handlePrev]);

  // ─── Save & Exit ───────────────────────────────────────────────
  const handleSaveExit = useCallback(() => {
    toast.success(
      `Progress saved! ${qs.progress.answeredCount}/${qs.progress.totalVisible} questions complete. You can return anytime.`,
      { duration: 3500 }
    );
    setTimeout(() => navigate('/'), 800);
  }, [qs.progress, navigate]);

  // ─── Build Olivia section context (for chat prompts) ──────────
  const oliviaContext: OliviaContext = useMemo(() => {
    const qNum = qs.nav.questionIndex + 1;
    const qTotal = qs.visibleQuestions.length;
    const relevantAnswers: Record<string, string> = {};

    // Extract key demographic answers for context
    const demoKeys: [string, string][] = [
      ['q1', 'Country of residence'], ['q4', 'Age range'], ['q5', 'Relationship status'],
      ['q8', 'Has children'], ['q16', 'Employment status'], ['q20', 'Household income'],
      ['q30', 'Has pets'],
    ];
    for (const [key, label] of demoKeys) {
      const val = qs.answers[key];
      if (val !== undefined) {
        relevantAnswers[label] = Array.isArray(val) ? val.join(', ') : String(val);
      }
    }

    const skippedCount = qs.skippedQuestions.size;
    let skippedInfo: string | undefined;
    if (skippedCount > 0) {
      const parts: string[] = [];
      if (qs.answers['q8'] === false || qs.answers['q8'] === 'false') parts.push('no children (child questions skipped)');
      if (qs.answers['q5'] === 'single') parts.push('single (partner questions skipped)');
      if (qs.answers['q30'] === false || qs.answers['q30'] === 'false') parts.push('no pets (pet questions skipped)');
      if (qs.answers['q27'] === false || qs.answers['q27'] === 'false') parts.push('no chronic conditions (medical detail skipped)');
      skippedInfo = `${skippedCount} questions auto-skipped: ${parts.join('; ')}`;
    }

    return {
      positionLabel: `Question ${qNum} of ${qTotal} in ${qs.currentSection.title}`,
      progressLabel: `${qs.progress.answeredCount} of ${qs.progress.totalVisible} total questions answered (${qs.progress.percentage}%)`,
      relevantAnswers: Object.keys(relevantAnswers).length > 0 ? relevantAnswers : undefined,
      skippedInfo,
    };
  }, [qs.nav.questionIndex, qs.visibleQuestions.length, qs.currentSection.title, qs.progress, qs.answers, qs.skippedQuestions.size]);

  const oliviaSection = {
    id: qs.nav.sectionIndex,
    title: qs.currentSection.title,
    cat: qs.currentSection.title,
    prompt: qs.currentQuestion.question,
    accent: qs.currentSection.accent,
    icon: qs.currentSection.icon,
    hint: '',
    oliviaContext,
  };

  const currentAnswer = String(qs.getAnswer(qs.currentQuestion.number) || '');
  const accent = qs.currentSection.accent;

  // ═══════════════════════════════════════════════════════════════
  // WELCOME PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'welcome') {
    return (
      <div className="mq-universe" role="main">
        <ParticleField accent="#C4A87A" />
        <div className="mq-grain" aria-hidden="true" />
        <div className="mq-orb" aria-hidden="true" style={{ width: 500, height: 500, top: '-10%', left: '-6%', background: 'radial-gradient(circle,#60a5fa0d 0%,transparent 70%)' }} />
        <div className="mq-orb" aria-hidden="true" style={{ width: 400, height: 400, bottom: '-6%', right: '-4%', background: 'radial-gradient(circle,#ef444408 0%,transparent 70%)', animationDelay: '4s' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px', zIndex: 10, position: 'relative' }}>
          <div className="mq-welcome-card" style={{ animation: 'mq-float 0s' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(36px,5vw,50px)', fontWeight: 300, color: C.textPrimary, letterSpacing: '0.18em' }}>CLUES</span>
              <span style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(20px,3vw,28px)', color: '#C4A87A', verticalAlign: 'super', marginLeft: 2 }}>&trade;</span>
            </div>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 36 }}>
              Main Module Questionnaire
            </p>
            <h1 style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 300, color: C.textPrimary, margin: '0 0 18px', lineHeight: 1.35 }}>
              Let&rsquo;s Build Your Profile
            </h1>
            <p style={{ fontFamily: "'Crimson Pro',Georgia,serif", fontSize: 'clamp(15px,1.8vw,17px)', color: C.textSecondary, lineHeight: 1.8, margin: '0 auto 12px', maxWidth: 500 }}>
              Five focused sections will capture your demographics, deal-breakers, must-haves, trade-off priorities, and lifestyle preferences. Olivia is here to guide you.
            </p>
            <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 'clamp(14px,1.5vw,15px)', color: C.textMuted, lineHeight: 1.7, margin: '0 auto 30px', maxWidth: 460 }}>
              Answer at your own pace &mdash; your progress is saved automatically.
            </p>

            {/* Section previews */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,28px)', marginBottom: 36, flexWrap: 'wrap' }}>
              {QUESTIONNAIRE_SECTIONS.map(s => (
                <div key={s.id} style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: s.accent, fontWeight: 600, letterSpacing: '0.04em' }}>
                    {s.questions.length}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                    {s.title.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
              {[
                { icon: '\u{1F916}', label: 'Smart Skipping' },
                { icon: '\u{1F4AC}', label: 'Ask Olivia' },
                { icon: '\u{1F4BE}', label: 'Auto-Save' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', background: 'rgba(196,168,122,0.06)',
                  border: '1px solid rgba(196,168,122,0.16)', borderRadius: 20,
                  fontFamily: "'Outfit',sans-serif", fontSize: 11, color: '#C4A87A', letterSpacing: '0.06em',
                }}>
                  <span style={{ fontSize: 12 }}>{f.icon}</span>{f.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => { setPhase('active'); setContentVisible(true); }}
              style={{
                background: 'linear-gradient(135deg,rgba(96,165,250,0.14) 0%,rgba(96,165,250,0.06) 100%)',
                border: '1px solid rgba(96,165,250,0.28)', borderRadius: 14,
                padding: '15px 38px', fontFamily: "'Outfit',sans-serif", fontSize: 14,
                fontWeight: 400, color: '#60a5fa', display: 'inline-flex', alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <span style={{ letterSpacing: '0.1em' }}>Begin Questionnaire</span>
              <span aria-hidden="true" style={{ marginLeft: 14, opacity: 0.6, fontSize: 14 }}>&rarr;</span>
            </button>

            <p style={{ marginTop: 32, fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted }}>
              Clues Intelligence LTD
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPLETE PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'complete') {
    // Build answer key helper for review table
    const getReviewKey = (sectionId: string, qNum: number) => {
      if (sectionId === 'tradeoffs') return `tq${qNum}`;
      if (sectionId === 'general') return `gq${qNum}`;
      return `q${qNum}`;
    };

    const formatAnswer = (val: string | number | boolean | string[] | undefined): string => {
      if (val === undefined) return '\u2014';
      if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '\u2014';
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (val === 'true') return 'Yes';
      if (val === 'false') return 'No';
      return String(val);
    };

    const handleEditQuestion = (sectionIndex: number, questionIndex: number) => {
      qs.goToQuestion(sectionIndex, questionIndex);
      setPhase('active');
      setContentVisible(true);
    };

    const skipped = getSkippedQuestions(qs.answers);

    return (
      <div className="mq-universe" role="main">
        <ParticleField accent="#22c55e" />
        <div className="mq-grain" aria-hidden="true" />

        <div style={{ minHeight: '100vh', padding: '40px 20px', zIndex: 10, position: 'relative' }}>
          <div className="mq-review-container">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 38, marginBottom: 16, color: '#22c55e' }}>{'\u2726'}</div>
              <h1 style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(26px,3.5vw,34px)', fontWeight: 300, color: C.textPrimary, margin: '0 0 12px' }}>
                Review Your Answers
              </h1>
              <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 16, color: C.textSecondary, lineHeight: 1.7, margin: '0 auto 8px', maxWidth: 500 }}>
                You answered <strong style={{ color: '#22c55e' }}>{qs.progress.answeredCount}</strong> of {qs.progress.totalVisible} questions.
                Click any answer to edit it.
              </p>
              <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
                Changing an answer may show or hide follow-up questions automatically.
              </p>
            </div>

            {/* Section-by-section review tables */}
            {QUESTIONNAIRE_SECTIONS.map((section, si) => {
              const visible = section.questions.filter(q => !skipped.has(q.number));
              const sp = qs.progress.sectionProgress[si];
              if (visible.length === 0) return null;

              return (
                <div key={section.id} className="mq-review-section">
                  <div className="mq-review-section-header" style={{ borderLeftColor: section.accent }}>
                    <span style={{ fontSize: 18 }}>{section.icon}</span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, letterSpacing: '0.03em' }}>
                      {section.title}
                    </span>
                    <span style={{
                      fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
                      color: sp.answered === sp.total ? '#22c55e' : section.accent,
                      marginLeft: 'auto',
                    }}>
                      {sp.answered}/{sp.total}
                    </span>
                  </div>

                  <table className="mq-review-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Question</th>
                        <th style={{ width: '35%' }}>Your Answer</th>
                        <th style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((q, qi) => {
                        const key = getReviewKey(section.id, q.number);
                        const rawVal = qs.answers[key];
                        const display = formatAnswer(rawVal);
                        const hasAnswer = rawVal !== undefined;

                        return (
                          <tr key={q.number} className={hasAnswer ? '' : 'unanswered'}>
                            <td className="mq-review-num" style={{ color: section.accent }}>{qi + 1}</td>
                            <td className="mq-review-question">{getCleanQuestion(q.question)}</td>
                            <td className="mq-review-answer" style={{ color: hasAnswer ? C.textPrimary : C.textMuted }}>
                              {display}
                            </td>
                            <td>
                              <button
                                className="mq-review-edit-btn"
                                onClick={() => handleEditQuestion(si, qi)}
                                aria-label={`Edit question ${qi + 1}`}
                                style={{ color: section.accent }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 32, marginBottom: 40 }}>
              <button
                onClick={() => { setPhase('active'); setContentVisible(true); }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2937',
                  borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: 13,
                  color: C.textSecondary, cursor: 'pointer',
                }}
              >
                Back to Questionnaire
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg,rgba(34,197,94,0.15) 0%,rgba(34,197,94,0.07) 100%)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12,
                  fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 500,
                  color: '#22c55e', cursor: 'pointer', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Submit &amp; Continue to Dashboard <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE PHASE — One-Question-At-A-Time
  // ═══════════════════════════════════════════════════════════════
  const qNumInSection = qs.nav.questionIndex + 1;
  const qTotalInSection = qs.visibleQuestions.length;
  const cleanQuestion = getCleanQuestion(qs.currentQuestion.question);

  return (
    <div className="mq-universe" role="main">
      <ParticleField accent={accent} />
      <div className="mq-grain" aria-hidden="true" />
      <div className="mq-orb" aria-hidden="true" style={{ width: 450, height: 450, top: '-6%', left: '-6%', background: `radial-gradient(circle,${accent}09 0%,transparent 65%)` }} />
      <div className="mq-orb" aria-hidden="true" style={{
        width: 350, height: 350, bottom: '4%',
        right: oliviaChatOpen ? '420px' : '0',
        background: `radial-gradient(circle,${accent}07 0%,transparent 65%)`,
        animationDelay: '5s', transition: 'all 1s ease',
      }} />

      {/* ─── TOP BAR ─── */}
      <header className="mq-topbar">
        <div className="mq-topbar-left">
          <button onClick={handleSaveExit} className="mq-icon-btn" aria-label="Save and exit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L8 4M8 4L12 8M8 4V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(270 8 8)"/></svg>
          </button>
        </div>

        <div className="mq-topbar-right">
          {/* Save status */}
          <span className="mq-save-status" aria-live="polite" style={{
            color: qs.saveStatus === 'saving' ? '#f59e0b' : qs.saveStatus === 'saved' ? '#22c55e' : 'transparent',
          }}>
            {qs.saveStatus === 'saving' && <>{'\u25CF'} Saving&hellip;</>}
            {qs.saveStatus === 'saved' && <>{'\u2713'} Saved</>}
          </span>

          {/* Olivia button */}
          <button
            onClick={() => setOliviaChoiceOpen(true)}
            className="mq-olivia-btn"
            aria-label="Connect with Olivia"
            style={{
              boxShadow: (oliviaChatOpen || oliviaVideoOpen) ? '0 0 0 2px rgba(196,168,122,0.2)' : 'none',
            }}
          >
            <OliviaAvatar isSpeaking={false} size={20} />
            <span>Ask Olivia</span>
            {(oliviaChatOpen || oliviaVideoOpen) && <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u25CF'}</span>}
          </button>

          {/* Progress ring */}
          <div className="mq-progress-ring">
            <svg width="28" height="28" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="14" cy="14" r="11" fill="none" stroke="#1f2937" strokeWidth="2.5" />
              <circle cx="14" cy="14" r="11" fill="none" stroke={accent} strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 11} strokeDashoffset={2 * Math.PI * 11 * (1 - qs.progress.percentage / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1), stroke 0.5s ease' }}
              />
            </svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: C.textSecondary }}>
              <span style={{ color: accent, fontWeight: 500 }}>{qs.progress.percentage}</span>%
            </span>
          </div>

          {/* Close */}
          <button
            onClick={() => navigate('/')} className="mq-icon-btn" aria-label="Close"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 18 }}
          >&times;</button>
        </div>
      </header>

      {/* ─── SECTION TABS ─── */}
      <div className="mq-section-tabs" role="tablist" aria-label="Questionnaire sections">
        {QUESTIONNAIRE_SECTIONS.map((s, i) => {
          const sp = qs.progress.sectionProgress[i];
          const pct = sp.total > 0 ? Math.round((sp.answered / sp.total) * 100) : 0;
          const isActive = i === qs.nav.sectionIndex;
          const isComplete = sp.answered === sp.total && sp.total > 0;
          const tabClass = `mq-section-tab${isActive ? ' active' : ''}${isComplete ? ' completed' : ''}`;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`${s.title}: ${sp.answered} of ${sp.total} answered${isComplete ? ' (complete)' : ''}`}
              className={tabClass}
              style={{ '--tab-accent': s.accent } as React.CSSProperties}
              onClick={() => handleSectionClick(i)}
            >
              <span className="mq-tab-icon">{isComplete ? '\u2713' : s.icon}</span>
              <span className="mq-tab-label">{s.title}</span>
              <div className="mq-tab-progress">
                <div className="mq-tab-progress-fill" style={{ width: `${pct}%`, background: isComplete ? '#22c55e' : s.accent }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── PROGRESS BAR ─── */}
      <div role="progressbar" aria-valuenow={qs.progress.answeredCount} aria-valuemin={0} aria-valuemax={qs.progress.totalVisible}
        aria-label={`${qs.progress.answeredCount} of ${qs.progress.totalVisible} questions answered`}
        style={{ position: 'fixed', top: 96, left: 0, right: 0, zIndex: 98, height: 2, background: 'rgba(255,255,255,0.04)' }}
      >
        <div style={{
          height: '100%', borderRadius: '0 1px 1px 0',
          background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
          width: `${qs.progress.percentage}%`,
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: `0 0 6px ${accent}33`,
        }} />
      </div>

      {/* ─── OLIVIA INTEGRATION ─── */}
      <OliviaChoiceModal
        visible={oliviaChoiceOpen}
        onClose={() => setOliviaChoiceOpen(false)}
        onSelectChat={() => { setOliviaChoiceOpen(false); setOliviaChatOpen(true); }}
        onSelectVideo={() => { setOliviaChoiceOpen(false); setOliviaVideoOpen(true); }}
        section={oliviaSection}
      />
      <HeyGenVideoModal open={oliviaVideoOpen} onClose={() => setOliviaVideoOpen(false)} section={oliviaSection} currentAnswer={currentAnswer} sessionId={session.id} />
      <OliviaPanel open={oliviaChatOpen} onClose={() => setOliviaChatOpen(false)} section={oliviaSection} currentAnswer={currentAnswer} accent={accent} sessionId={session.id} />

      {/* ─── QUESTION NAVIGATOR (left sidebar) ─── */}
      <button
        className="mq-qnav-toggle"
        onClick={() => setQuestionNavOpen(!questionNavOpen)}
        aria-label={questionNavOpen ? 'Close question navigator' : 'Open question navigator'}
        aria-expanded={questionNavOpen}
      >
        {questionNavOpen ? '\u25C0' : '\u2630'}
      </button>
      <nav className={`mq-question-nav${questionNavOpen ? ' open' : ''}`} aria-label="Question navigator">
        <div className="mq-qnav-header">
          <span className="mq-qnav-title">Questions</span>
          <button className="mq-qnav-close" onClick={() => setQuestionNavOpen(false)} aria-label="Close navigator">&times;</button>
        </div>
        {qs.visibleQuestions.map((q, idx) => {
          const isActive = idx === qs.nav.questionIndex;
          const hasAnswer = qs.getAnswer(q.number) !== undefined;
          const shortText = getCleanQuestion(q.question).slice(0, 60) + (q.question.length > 60 ? '...' : '');
          return (
            <button
              key={q.number}
              className={`mq-qnav-item${isActive ? ' active' : ''}${hasAnswer ? ' answered' : ''}`}
              onClick={() => { qs.goToQuestion(qs.nav.sectionIndex, idx); setQuestionNavOpen(false); }}
            >
              <span className="mq-qnav-num">Q{idx + 1}</span>
              <span className="mq-qnav-text">{shortText}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <div className={`mq-content${questionNavOpen ? ' nav-open' : ''}`} style={{ paddingRight: oliviaChatOpen ? 'clamp(420px,36vw,460px)' : 'clamp(20px,5vw,68px)' }}>
        <div className={`mq-card-wrapper${contentVisible ? '' : ' hidden'}`} style={{
          transform: contentVisible ? 'translateY(0)' : `translateY(${direction > 0 ? '20px' : '-20px'})`,
        }}>
          {/* Section label */}
          <div className="mq-section-label" style={{ color: accent }}>
            <span>{qs.currentSection.icon}</span>
            <span>{qs.currentSection.title}</span>
          </div>
          <p className="mq-q-counter">
            Question {qNumInSection} of {qTotalInSection}
            {qs.skippedQuestions.size > 0 && (
              <span style={{ color: C.textMuted }}> &middot; {qs.skippedQuestions.size} skipped by smart logic</span>
            )}
          </p>

          {/* Question Card */}
          <div className="mq-card" style={{ '--card-accent': accent } as React.CSSProperties}>
            <h2 className="mq-q-text">{cleanQuestion}</h2>

            <div className="mq-q-divider" style={{ background: accent }} />

            {/* Response Type Badge */}
            <div style={{ marginBottom: 20 }}>
              <span style={{
                fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.05em', padding: '3px 10px', borderRadius: 20,
                background: `${accent}15`, color: accent, border: `1px solid ${accent}33`,
              }}>
                {qs.currentQuestion.type}
              </span>
            </div>

            {/* The actual input control */}
            <QuestionRenderer
              question={qs.currentQuestion}
              value={qs.getAnswer(qs.currentQuestion.number)}
              onChange={(val) => qs.setAnswer(qs.currentQuestion.number, val)}
              accent={accent}
            />
          </div>

          {/* Navigation */}
          <nav className="mq-nav" aria-label="Question navigation">
            <button
              onClick={handlePrev}
              disabled={qs.isFirstQuestion}
              className="mq-nav-btn"
              aria-label="Previous question"
            >
              <span>&larr;</span> Previous
            </button>

            <div className="mq-nav-dots" aria-hidden="true">
              {qs.visibleQuestions.slice(
                Math.max(0, qs.nav.questionIndex - 8),
                Math.min(qs.visibleQuestions.length, qs.nav.questionIndex + 9)
              ).map((q, i) => {
                const actualIdx = Math.max(0, qs.nav.questionIndex - 8) + i;
                const isActive = actualIdx === qs.nav.questionIndex;
                const hasAnswer = qs.getAnswer(q.number) !== undefined;
                return (
                  <button
                    key={q.number}
                    tabIndex={-1}
                    onClick={() => qs.goToQuestion(qs.nav.sectionIndex, actualIdx)}
                    className={`mq-nav-dot${isActive ? ' active' : ''}`}
                    style={{
                      background: isActive ? accent : hasAnswer ? `${accent}88` : C.divider,
                      boxShadow: isActive ? `0 0 6px ${accent}44` : 'none',
                    }}
                  />
                );
              })}
            </div>

            {!qs.isLastQuestion ? (
              <button onClick={handleNext} className="mq-nav-btn" aria-label="Next question">
                Next <span>&rarr;</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="mq-nav-btn accent"
                aria-label="Complete questionnaire"
              >
                Complete <span>{'\u2726'}</span>
              </button>
            )}
          </nav>

          <p className="mq-key-hint">
            Use &larr; &rarr; arrow keys to navigate between questions
          </p>
        </div>
      </div>
    </div>
  );
}
