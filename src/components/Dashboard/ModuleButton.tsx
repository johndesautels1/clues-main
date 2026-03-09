/**
 * Module Button
 * Individual module card with illumination states:
 * - not_started: Gray, muted
 * - in_progress: Pulsing sapphire glow
 * - completed: Green glow + checkmark + score meter
 * - recommended: Gold border + star badge
 * - locked: Grayed out + lock icon
 *
 * Clicking navigates to /module/:moduleId (internal mini module flow).
 */

import { useNavigate } from 'react-router-dom';
import type { ModuleDefinition } from '../../data/modules';
import './ModuleButton.css';

interface Props {
  module: ModuleDefinition;
}

export function ModuleButton({ module }: Props) {
  const navigate = useNavigate();
  const status = module.status ?? 'not_started';
  const statusClass = `module-btn--${status.replace('_', '-')}`;
  const isInteractive = status !== 'locked';

  const handleClick = () => {
    if (!isInteractive) return;
    navigate(`/module/${module.id}`);
  };

  return (
    <button
      className={`module-btn glass ${statusClass}`}
      onClick={handleClick}
      disabled={!isInteractive}
      aria-label={`${module.name} - ${status.replace('_', ' ')}`}
    >
      {/* Status indicator dot */}
      <div className="module-btn__indicator" />

      {/* Icon */}
      <div className="module-btn__icon">{module.icon}</div>

      {/* Full module name */}
      <h3 className="module-btn__name">{module.name}</h3>

      {/* Score meter (only for completed) */}
      {status === 'completed' && module.score !== undefined && (
        <div className="module-btn__meter">
          <div
            className="module-btn__meter-fill"
            style={{ width: `${module.score}%` }}
          />
        </div>
      )}

      {/* Question count */}
      <span className="module-btn__questions">
        {module.questionCount} Q
      </span>

      {/* Status badges */}
      {status === 'completed' && (
        <span className="module-btn__badge module-btn__badge--completed">{'\u2705'}</span>
      )}
      {status === 'recommended' && (
        <span className="module-btn__badge module-btn__badge--recommended">{'\u2B50'}</span>
      )}
      {status === 'locked' && (
        <span className="module-btn__badge module-btn__badge--locked">{'\u{1F512}'}</span>
      )}
    </button>
  );
}
