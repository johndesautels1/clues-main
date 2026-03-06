/**
 * Paragraphical Button
 * Hero-level CTA that triggers the biographical essay flow.
 * Large, centered, gradient blue/orange with glassmorphic treatment.
 */

import { useNavigate } from 'react-router-dom';
import type { ModuleStatus } from '../../data/modules';
import './ParagraphicalButton.css';

interface Props {
  status: ModuleStatus;
  onClick: () => void;
}

export function ParagraphicalButton({ status, onClick }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
    if (status !== 'locked') {
      navigate('/paragraphical');
    }
  };
  const statusClass = `paragraphical--${status.replace('_', '-')}`;

  return (
    <button
      className={`paragraphical glass-heavy ${statusClass}`}
      onClick={handleClick}
      aria-label="Start your biographical essay - Tell us your story"
    >
      {/* Background gradient overlay */}
      <div className="paragraphical__gradient" />

      {/* Content */}
      <div className="paragraphical__content">
        <div className="paragraphical__icon">
          {status === 'completed' ? '\u2705' : '\u270D\uFE0F'}
        </div>
        <h2 className="paragraphical__title">The Paragraphical</h2>
        <p className="paragraphical__subtitle">
          {status === 'not_started' && 'Tell us your story in 30 paragraphs'}
          {status === 'in_progress' && 'Continue writing your story...'}
          {status === 'completed' && 'Your biographical essay is complete'}
          {status === 'locked' && 'Complete prerequisites first'}
        </p>

        {/* Status indicator */}
        <div className="paragraphical__status">
          {status === 'not_started' && (
            <span className="paragraphical__cta">Begin Your Journey</span>
          )}
          {status === 'in_progress' && (
            <span className="paragraphical__cta paragraphical__cta--active">
              Continue Writing
            </span>
          )}
          {status === 'completed' && (
            <div className="paragraphical__meter">
              <div className="paragraphical__meter-fill" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      </div>

      {/* Completion badge */}
      {status === 'completed' && (
        <div className="paragraphical__badge">Complete</div>
      )}
    </button>
  );
}
