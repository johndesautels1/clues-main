/**
 * JourneyGuide — "Your Journey – Select to Begin" collapsible bar.
 *
 * A unified dash-card that shows the 4 journey steps in a dropdown.
 * Click the bar to expand/collapse. Steps illuminate by status:
 *   - completed = green
 *   - current = gold (in-progress)
 *   - upcoming = muted
 *
 * WCAG 2.1 AA: all text >= 11px, contrast verified, focus-visible outlines,
 * color is never the sole indicator (text labels on every state).
 */

import { useState, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import './DashboardCard.css';
import './JourneyGuide.css';

interface JourneyStep {
  number: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
}

export function JourneyGuide() {
  const { session } = useUser();
  const { globe, paragraphical, mainModule, completedModules } = session;
  const [expanded, setExpanded] = useState(false);

  // Determine journey progress
  const hasGlobe = !!globe;
  const paraComplete = paragraphical.status === 'completed';
  const paraStarted = paragraphical.status === 'in_progress';
  const mainComplete = Object.values(mainModule.subSectionStatus).every(s => s === 'completed');
  const mainStarted = Object.values(mainModule.subSectionStatus).some(s => s === 'in_progress' || s === 'completed');
  const modulesComplete = completedModules.length >= 10;
  const modulesStarted = completedModules.length > 0;

  // If user has completed all major milestones, hide the guide
  if (paraComplete && mainComplete && modulesComplete) return null;

  const steps: JourneyStep[] = [
    {
      number: 1,
      title: 'Choose Your Region',
      description: hasGlobe
        ? 'Region selected — ready for the next step.'
        : 'Spin the globe and zoom into the region of the world that calls to you.',
      status: hasGlobe ? 'completed' : 'current',
    },
    {
      number: 2,
      title: 'Tell Your Story',
      description: paraComplete
        ? 'Paragraphical complete — your story has been captured.'
        : paraStarted
          ? 'You\'re telling your story — keep going, each paragraph sharpens your results.'
          : 'Write 30 short paragraphs about your life, dreams, and dealbreakers.',
      status: paraComplete ? 'completed' : (hasGlobe && !paraComplete) ? 'current' : 'upcoming',
    },
    {
      number: 3,
      title: 'Answer Key Questions',
      description: mainComplete
        ? 'Main module complete — your priorities are locked in.'
        : mainStarted
          ? 'You\'re making progress — finish all 5 sections to unlock the full evaluation.'
          : 'Five focused sections: Demographics, Dealbreakers, Must-Haves, Trade-offs, Lifestyle.',
      status: mainComplete ? 'completed' : (paraComplete && !mainComplete) ? 'current' : 'upcoming',
    },
    {
      number: 4,
      title: 'Deep-Dive Modules',
      description: modulesComplete
        ? `${completedModules.length} modules complete — comprehensive coverage achieved.`
        : modulesStarted
          ? `${completedModules.length}/23 modules done — our AI recommends which to do next.`
          : 'Explore 23 specialized categories to build a complete profile.',
      status: modulesComplete ? 'completed' : (mainComplete && !modulesComplete) ? 'current' : 'upcoming',
    },
  ];

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const currentStep = steps.find(s => s.status === 'current');
  const allDone = completedCount === 4;
  const anyStarted = completedCount > 0 || steps.some(s => s.status === 'current');

  // Card illumination class
  const statusClass = allDone
    ? 'dash-card--completed'
    : anyStarted
      ? 'dash-card--in-progress'
      : 'dash-card--not-started';

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <div
      className={`dash-card journey-bar ${statusClass}`}
      role="navigation"
      aria-label="Your CLUES journey progress"
    >
      {/* Clickable bar header */}
      <button
        className="journey-bar__header"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls="journey-bar-content"
        type="button"
      >
        <div className="journey-bar__header-left">
          <span className="journey-bar__icon">🧭</span>
          <div>
            <h3 className="journey-bar__title">Your Journey</h3>
            <p className="journey-bar__meta">
              {currentStep
                ? `Step ${currentStep.number} of 4 — ${currentStep.title}`
                : `${completedCount}/4 steps complete`}
            </p>
          </div>
        </div>

        <div className="journey-bar__header-right">
          <span className="journey-bar__cta">Select to Begin</span>
          <span className={`journey-bar__chevron ${expanded ? 'journey-bar__chevron--open' : ''}`}>
            &#9662;
          </span>
        </div>
      </button>

      {/* Expandable dropdown with 4 steps */}
      <div
        id="journey-bar-content"
        className={`journey-bar__content ${expanded ? 'journey-bar__content--open' : ''}`}
        role="region"
        aria-label="Journey steps"
      >
        <div className="journey-bar__steps">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`journey-step journey-step--${step.status}`}
            >
              <div className="journey-step__indicator">
                {step.status === 'completed' ? (
                  <svg className="journey-step__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="journey-step__number">{step.number}</span>
                )}
              </div>

              <div className="journey-step__content">
                <h4 className="journey-step__title">{step.title}</h4>
                <p className="journey-step__description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
