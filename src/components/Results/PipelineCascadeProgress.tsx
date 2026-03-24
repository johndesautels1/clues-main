/**
 * PipelineCascadeProgress — Step-by-step evaluation progress visualization.
 *
 * Replaces the basic spinner in ResultsPage with a vertical timeline
 * showing all pipeline phases with status indicators.
 *
 * WCAG 2.1 AA: All text ≥ 11px, contrast verified, status conveyed
 * via icon + text (not color alone), focus-visible outlines.
 */

import { useState, useEffect } from 'react';
import type { PipelineProgress } from '../../hooks/useEvaluationPipeline';
import './PipelineCascadeProgress.css';

interface PipelineCascadeProgressProps {
  progress: PipelineProgress;
}

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  /** Which pipeline phase(s) activate this step */
  phases: string[];
  /** For evaluation waves, which wave number activates this step */
  waveNumber?: number;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'aggregate',
    label: 'Aggregating Profile',
    description: '7 data sources',
    phases: ['aggregating'],
  },
  {
    id: 'metrics',
    label: 'Building Evaluation Metrics',
    description: 'Category-specific metrics',
    phases: ['building_metrics'],
  },
  {
    id: 'research',
    label: 'Tavily Web Research',
    description: 'Sourcing real-world data',
    phases: ['researching'],
  },
  {
    id: 'cities',
    label: 'Recommending Cities',
    description: '5 LLMs in parallel',
    phases: ['recommending_cities'],
  },
  {
    id: 'wave1',
    label: 'Evaluation Wave 1',
    description: 'Categories 1-4',
    phases: ['evaluating'],
    waveNumber: 1,
  },
  {
    id: 'wave2',
    label: 'Evaluation Wave 2',
    description: 'Categories 5-8',
    phases: ['evaluating'],
    waveNumber: 2,
  },
  {
    id: 'wave3',
    label: 'Evaluation Wave 3',
    description: 'Categories 9-12',
    phases: ['evaluating'],
    waveNumber: 3,
  },
  {
    id: 'wave4',
    label: 'Evaluation Wave 4',
    description: 'Categories 13-16',
    phases: ['evaluating'],
    waveNumber: 4,
  },
  {
    id: 'wave5',
    label: 'Evaluation Wave 5',
    description: 'Categories 17-20',
    phases: ['evaluating'],
    waveNumber: 5,
  },
  {
    id: 'wave6',
    label: 'Evaluation Wave 6',
    description: 'Categories 21-23',
    phases: ['evaluating'],
    waveNumber: 6,
  },
  {
    id: 'judge',
    label: 'Opus Judge Review',
    description: 'Reviewing disputed metrics',
    phases: ['judging'],
  },
  {
    id: 'scoring',
    label: 'Computing Smart Scores',
    description: 'Normalizing and ranking',
    phases: ['scoring'],
  },
  {
    id: 'complete',
    label: 'Determining Winner',
    description: 'Final rankings',
    phases: ['complete'],
  },
];

type StepStatus = 'pending' | 'running' | 'complete';

function getStepStatus(
  step: PipelineStep,
  currentPhase: string,
  wavesCompleted: number,
): StepStatus {
  const phaseOrder = [
    'aggregating', 'building_metrics', 'researching',
    'recommending_cities', 'evaluating', 'judging',
    'scoring', 'complete',
  ];

  const currentIdx = phaseOrder.indexOf(currentPhase);

  // For wave steps, use wave count to determine status
  if (step.waveNumber !== undefined) {
    if (currentPhase !== 'evaluating') {
      // If we're past evaluating, all waves are complete
      if (currentIdx > phaseOrder.indexOf('evaluating')) return 'complete';
      // If we haven't reached evaluating yet, all waves are pending
      return 'pending';
    }
    // During evaluating phase, use wavesCompleted
    if (wavesCompleted >= step.waveNumber) return 'complete';
    if (wavesCompleted === step.waveNumber - 1) return 'running';
    return 'pending';
  }

  // For non-wave steps, compare phase order
  const stepPhase = step.phases[0];
  const stepIdx = phaseOrder.indexOf(stepPhase);

  if (stepIdx < currentIdx) return 'complete';
  if (stepIdx === currentIdx) return 'running';
  return 'pending';
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'complete') {
    return (
      <span className="pcp-icon pcp-icon--complete" aria-hidden="true">
        &#x2713;
      </span>
    );
  }
  if (status === 'running') {
    return <span className="pcp-icon pcp-icon--running" aria-hidden="true" />;
  }
  return <span className="pcp-icon pcp-icon--pending" aria-hidden="true" />;
}

export function PipelineCascadeProgress({ progress }: PipelineCascadeProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const completedSteps = PIPELINE_STEPS.filter(
    s => getStepStatus(s, progress.phase, progress.wavesCompleted) === 'complete'
  ).length;
  const totalSteps = PIPELINE_STEPS.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="pcp" role="region" aria-label="Evaluation Pipeline Progress">
      <div className="pcp-header">
        <h2 className="pcp-title">Evaluating Your Ideal Locations</h2>
        <p className="pcp-subtitle">{progress.phaseLabel}</p>
      </div>

      {/* Progress bar */}
      <div className="pcp-bar-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className="pcp-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="pcp-bar-label">
        {completedSteps} of {totalSteps} steps complete
        <span className="pcp-elapsed">{elapsedStr} elapsed</span>
      </div>

      {/* Step timeline */}
      <ol className="pcp-steps" aria-label="Pipeline steps">
        {PIPELINE_STEPS.map((step) => {
          const status = getStepStatus(step, progress.phase, progress.wavesCompleted);
          return (
            <li
              key={step.id}
              className={`pcp-step pcp-step--${status}`}
              aria-current={status === 'running' ? 'step' : undefined}
            >
              <StatusIcon status={status} />
              <div className="pcp-step-content">
                <span className="pcp-step-label">
                  {step.label}
                  <span className="pcp-step-status" aria-label={`Status: ${status}`}>
                    {status === 'complete' ? 'Done' : status === 'running' ? 'Running' : ''}
                  </span>
                </span>
                <span className="pcp-step-desc">{step.description}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Live stats sidebar */}
      <div className="pcp-stats" aria-label="Pipeline statistics">
        {progress.citiesFound > 0 && (
          <div className="pcp-stat">
            <span className="pcp-stat-value">{progress.citiesFound}</span>
            <span className="pcp-stat-label">Cities found</span>
          </div>
        )}
        {progress.wavesCompleted > 0 && (
          <div className="pcp-stat">
            <span className="pcp-stat-value">{progress.wavesCompleted}</span>
            <span className="pcp-stat-label">Waves done</span>
          </div>
        )}
        <div className="pcp-stat">
          <span className="pcp-stat-value">5</span>
          <span className="pcp-stat-label">LLMs active</span>
        </div>
      </div>
    </div>
  );
}
