/**
 * MiniModuleFlow — Renders any of the 23 mini module questionnaires.
 * Each module: 100 questions, 10 sections × 10 questions.
 * One-question-at-a-time card flow, reusing QuestionRenderer for all input types.
 *
 * Features:
 * - Section tab bar (10 sections)
 * - Question card with fade transitions
 * - Progress bar + save status indicator
 * - Question navigator sidebar
 * - Save/resume via localStorage + Supabase
 * - Review screen at completion
 * - Keyboard navigation (arrow keys)
 * - WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionRenderer } from './QuestionRenderer';
import { useModuleState } from '../../hooks/useModuleState';
import { MODULES_MAP } from '../../data/modules';
import type { QuestionModule } from '../../data/questions/types';
import './MiniModuleFlow.css';

interface MiniModuleFlowProps {
  moduleData: QuestionModule;
}

type Phase = 'active' | 'complete';

export function MiniModuleFlow({ moduleData }: MiniModuleFlowProps) {
  const navigate = useNavigate();
  const moduleDef = MODULES_MAP[moduleData.moduleId];
  const accent = getModuleAccent(moduleData.moduleId);

  const {
    nav,
    saveStatus,
    currentSection,
    currentQuestion,
    progress,
    isFirstQuestion,
    isLastQuestion,
    isAllComplete,
    getAnswer,
    setAnswer,
    goNext,
    goPrev,
    goToSection,
    goToQuestion,
    answers,
  } = useModuleState(moduleData);

  const [phase, setPhase] = useState<Phase>(isAllComplete ? 'complete' : 'active');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showNav, setShowNav] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Phase transition when all questions answered
  useEffect(() => {
    if (isAllComplete && phase === 'active') {
      setPhase('complete');
    }
  }, [isAllComplete, phase]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== 'active') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        setShowNav(n => !n);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      if (isAllComplete) setPhase('complete');
      return;
    }
    setDirection('forward');
    goNext();
  }, [isLastQuestion, isAllComplete, goNext]);

  const handlePrev = useCallback(() => {
    setDirection('backward');
    goPrev();
  }, [goPrev]);

  const handleSectionClick = useCallback((idx: number) => {
    setDirection(idx > nav.sectionIndex ? 'forward' : 'backward');
    goToSection(idx);
  }, [nav.sectionIndex, goToSection]);

  const handleNavQuestion = useCallback((sIdx: number, qIdx: number) => {
    setDirection(
      sIdx > nav.sectionIndex || (sIdx === nav.sectionIndex && qIdx > nav.questionIndex)
        ? 'forward' : 'backward'
    );
    goToQuestion(sIdx, qIdx);
    setShowNav(false);
  }, [nav, goToQuestion]);

  const handleAnswer = useCallback((value: string | number | boolean | string[]) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.number, value);
    }
  }, [currentQuestion, setAnswer]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleReviewEdit = useCallback((sIdx: number, qIdx: number) => {
    setPhase('active');
    goToQuestion(sIdx, qIdx);
  }, [goToQuestion]);

  // Global question number (1-based across all sections)
  const globalIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < nav.sectionIndex; i++) {
      count += moduleData.sections[i].questions.length;
    }
    return count + nav.questionIndex + 1;
  }, [nav, moduleData.sections]);

  // ─── Active Phase ─────────────────────────────────────────────

  if (phase === 'active') {
    return (
      <div className="mmf-universe">
        {/* Top bar */}
        <header className="mmf-topbar">
          <button
            className="mmf-topbar__back"
            onClick={handleBackToDashboard}
            aria-label="Back to dashboard"
          >
            <span aria-hidden="true">&larr;</span> Dashboard
          </button>

          <div className="mmf-topbar__title">
            <span className="mmf-topbar__icon">{moduleDef?.icon}</span>
            <span className="mmf-topbar__name">{moduleData.moduleName}</span>
          </div>

          <div className="mmf-topbar__status">
            {saveStatus === 'saving' && <span className="mmf-save mmf-save--saving">Saving...</span>}
            {saveStatus === 'saved' && <span className="mmf-save mmf-save--saved">Saved</span>}

            <button
              className="mmf-topbar__nav-toggle"
              onClick={() => setShowNav(!showNav)}
              aria-label="Toggle question navigator"
              aria-expanded={showNav}
            >
              {showNav ? '\u2715' : '\u2630'}
            </button>
          </div>
        </header>

        {/* Progress bar */}
        <div className="mmf-progress" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin={0} aria-valuemax={100}>
          <div className="mmf-progress__fill" style={{ width: `${progress.percentage}%`, backgroundColor: accent }} />
          <span className="mmf-progress__label">
            {progress.answeredCount} / {progress.totalQuestions} ({progress.percentage}%)
          </span>
        </div>

        {/* Section tabs */}
        <nav className="mmf-sections" aria-label="Question sections">
          {moduleData.sections.map((sec, idx) => {
            const sp = progress.sectionProgress[idx];
            const isActive = idx === nav.sectionIndex;
            const isDone = sp && sp.answered === sp.total;
            return (
              <button
                key={idx}
                className={`mmf-sections__tab${isActive ? ' mmf-sections__tab--active' : ''}${isDone ? ' mmf-sections__tab--done' : ''}`}
                onClick={() => handleSectionClick(idx)}
                aria-current={isActive ? 'step' : undefined}
                title={sec.title}
              >
                <span className="mmf-sections__num">{idx + 1}</span>
                {isDone && <span className="mmf-sections__check" aria-label="Complete">&#10003;</span>}
              </button>
            );
          })}
        </nav>

        {/* Section title */}
        <div className="mmf-section-title">
          <h2>{currentSection.title}</h2>
          <span className="mmf-section-title__range">
            Q{globalIndex} of {progress.totalQuestions}
          </span>
        </div>

        {/* Question card */}
        <div className="mmf-card-area">
          <div
            ref={cardRef}
            className={`mmf-card mmf-card--${direction}`}
            key={`${nav.sectionIndex}-${nav.questionIndex}`}
          >
            <div className="mmf-card__number">
              Question {currentQuestion?.number}
            </div>
            <p className="mmf-card__text">
              {currentQuestion ? cleanQuestionText(currentQuestion.question) : ''}
            </p>

            {currentQuestion && (
              <div className="mmf-card__input">
                <QuestionRenderer
                  question={currentQuestion}
                  value={getAnswer(currentQuestion.number)}
                  onChange={handleAnswer}
                  accent={accent}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <nav className="mmf-nav">
          <button
            className="mmf-nav__btn mmf-nav__btn--prev"
            onClick={handlePrev}
            disabled={isFirstQuestion}
            aria-label="Previous question"
          >
            &larr; Previous
          </button>

          <div className="mmf-nav__dots">
            {currentSection.questions.map((q, i) => (
              <button
                key={q.number}
                className={`mmf-nav__dot${i === nav.questionIndex ? ' mmf-nav__dot--active' : ''}${getAnswer(q.number) !== undefined ? ' mmf-nav__dot--answered' : ''}`}
                onClick={() => handleNavQuestion(nav.sectionIndex, i)}
                aria-label={`Question ${q.number}${getAnswer(q.number) !== undefined ? ' (answered)' : ''}`}
              />
            ))}
          </div>

          <button
            className="mmf-nav__btn mmf-nav__btn--next"
            onClick={handleNext}
            disabled={isLastQuestion && isAllComplete}
            aria-label={isLastQuestion ? 'Review answers' : 'Next question'}
          >
            {isLastQuestion ? 'Review' : 'Next'} &rarr;
          </button>
        </nav>

        {/* Question navigator sidebar */}
        {showNav && (
          <aside className="mmf-qnav" aria-label="Question navigator">
            <div className="mmf-qnav__header">
              <h3>Questions</h3>
              <button onClick={() => setShowNav(false)} aria-label="Close navigator">&times;</button>
            </div>
            <div className="mmf-qnav__sections">
              {moduleData.sections.map((sec, sIdx) => (
                <div key={sIdx} className="mmf-qnav__section">
                  <h4 className="mmf-qnav__section-title">{sec.title}</h4>
                  <div className="mmf-qnav__grid">
                    {sec.questions.map((q, qIdx) => {
                      const answered = getAnswer(q.number) !== undefined;
                      const isCurrent = sIdx === nav.sectionIndex && qIdx === nav.questionIndex;
                      return (
                        <button
                          key={q.number}
                          className={`mmf-qnav__item${isCurrent ? ' mmf-qnav__item--current' : ''}${answered ? ' mmf-qnav__item--answered' : ''}`}
                          onClick={() => handleNavQuestion(sIdx, qIdx)}
                          aria-label={`Question ${q.number}${answered ? ' (answered)' : ''}`}
                        >
                          {q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    );
  }

  // ─── Complete Phase (Review) ──────────────────────────────────

  return (
    <div className="mmf-universe">
      <header className="mmf-topbar">
        <button className="mmf-topbar__back" onClick={handleBackToDashboard} aria-label="Back to dashboard">
          <span aria-hidden="true">&larr;</span> Dashboard
        </button>
        <div className="mmf-topbar__title">
          <span className="mmf-topbar__icon">{moduleDef?.icon}</span>
          <span className="mmf-topbar__name">{moduleData.moduleName} — Complete</span>
        </div>
        <div className="mmf-topbar__status">
          <span className="mmf-save mmf-save--saved">All saved</span>
        </div>
      </header>

      <div className="mmf-review">
        <div className="mmf-review__header">
          <h2>Review Your Answers</h2>
          <p className="mmf-review__subtitle">
            {progress.answeredCount} of {progress.totalQuestions} questions answered
          </p>
        </div>

        {moduleData.sections.map((sec, sIdx) => (
          <div key={sIdx} className="mmf-review__section">
            <h3 className="mmf-review__section-title">
              {sec.title}
              {sec.questionRange && <span className="mmf-review__range"> ({sec.questionRange})</span>}
            </h3>
            <table className="mmf-review__table">
              <thead>
                <tr>
                  <th className="mmf-review__th">#</th>
                  <th className="mmf-review__th">Question</th>
                  <th className="mmf-review__th">Answer</th>
                  <th className="mmf-review__th">Edit</th>
                </tr>
              </thead>
              <tbody>
                {sec.questions.map((q, qIdx) => {
                  const ans = getAnswer(q.number);
                  return (
                    <tr key={q.number} className="mmf-review__row">
                      <td className="mmf-review__td mmf-review__td--num">{q.number}</td>
                      <td className="mmf-review__td mmf-review__td--q">
                        {cleanQuestionText(q.question).slice(0, 80)}
                        {q.question.length > 80 ? '...' : ''}
                      </td>
                      <td className="mmf-review__td mmf-review__td--ans">
                        {formatAnswer(ans)}
                      </td>
                      <td className="mmf-review__td mmf-review__td--edit">
                        <button
                          className="mmf-review__edit-btn"
                          onClick={() => handleReviewEdit(sIdx, qIdx)}
                          aria-label={`Edit question ${q.number}`}
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
        ))}

        <div className="mmf-review__actions">
          <button className="mmf-review__btn mmf-review__btn--dashboard" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

/** Remove inline options parenthetical from question text */
function cleanQuestionText(text: string): string {
  return text.replace(/\s*\(Select (?:one|all that apply):.*?\)\s*/gi, ' ').trim();
}

/** Format answer for review table display */
function formatAnswer(value: string | number | boolean | string[] | undefined): string {
  if (value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return String(value);
  return String(value);
}

/** Get accent color for a module based on its tier */
function getModuleAccent(moduleId: string): string {
  const tierColors: Record<string, string> = {
    // Tier 1: Survival — Red
    safety_security: '#ef4444',
    health_wellness: '#ef4444',
    climate_weather: '#ef4444',
    // Tier 2: Foundation — Blue
    legal_immigration: '#3b82f6',
    financial_banking: '#3b82f6',
    housing_property: '#3b82f6',
    professional_career: '#3b82f6',
    // Tier 3: Infrastructure — Cyan
    technology_connectivity: '#06b6d4',
    transportation_mobility: '#06b6d4',
    education_learning: '#06b6d4',
    social_values_governance: '#06b6d4',
    // Tier 4: Lifestyle — Amber
    food_dining: '#f59e0b',
    shopping_services: '#f59e0b',
    outdoor_recreation: '#f59e0b',
    entertainment_nightlife: '#f59e0b',
    // Tier 5: Connection — Green
    family_children: '#22c55e',
    neighborhood_urban_design: '#22c55e',
    environment_community_appearance: '#22c55e',
    // Tier 6: Identity — Purple
    religion_spirituality: '#a855f7',
    sexual_beliefs_practices_laws: '#a855f7',
    arts_culture: '#a855f7',
    cultural_heritage_traditions: '#a855f7',
    pets_animals: '#a855f7',
  };
  return tierColors[moduleId] || '#60a5fa';
}
