/**
 * JourneyGuide — Contextual onboarding that walks users through CLUES step by step.
 *
 * Reads session state and shows the appropriate guidance for where the user is
 * in their journey. Disappears once the user has completed all major milestones.
 *
 * WCAG 2.1 AA: all text >= 11px, contrast verified, color never sole indicator.
 */

import { useUser } from '../../context/UserContext';
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
          : 'Write 30 short paragraphs about your life, dreams, and dealbreakers. Our AI extracts hundreds of data points from your words.',
      status: paraComplete ? 'completed' : (hasGlobe && !paraComplete) ? 'current' : 'upcoming',
    },
    {
      number: 3,
      title: 'Answer Key Questions',
      description: mainComplete
        ? 'Main module complete — your priorities are locked in.'
        : mainStarted
          ? 'You\'re making progress — finish all 5 sections to unlock the full evaluation.'
          : 'Five focused sections: Demographics, Dealbreakers, Must-Haves, Trade-offs, and Lifestyle. Smart skip logic means you won\'t answer what we already know.',
      status: mainComplete ? 'completed' : (paraComplete && !mainComplete) ? 'current' : 'upcoming',
    },
    {
      number: 4,
      title: 'Deep-Dive Modules',
      description: modulesComplete
        ? `${completedModules.length} modules complete — comprehensive coverage achieved.`
        : modulesStarted
          ? `${completedModules.length}/23 modules done — our AI recommends which to do next based on your data gaps.`
          : 'Explore 23 specialized categories. Our adaptive engine picks the most impactful questions first and skips what your earlier answers already covered.',
      status: modulesComplete ? 'completed' : (mainComplete && !modulesComplete) ? 'current' : 'upcoming',
    },
  ];

  // Find the current step for the heading
  const currentStep = steps.find(s => s.status === 'current');

  return (
    <div className="journey-guide glass" role="navigation" aria-label="Your CLUES journey progress">
      <div className="journey-guide__header">
        <h3 className="journey-guide__title">Your Journey</h3>
        {currentStep && (
          <span className="journey-guide__current">
            Step {currentStep.number} of {steps.length}
          </span>
        )}
      </div>

      <div className="journey-guide__steps">
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

      {/* Connector line behind the steps */}
      <div className="journey-guide__connector" aria-hidden="true" />
    </div>
  );
}
