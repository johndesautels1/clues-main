/**
 * Module Button
 * Individual module card with illumination states:
 * - not_started: Gray, muted
 * - in_progress: Pulsing sapphire glow
 * - completed: Green glow + checkmark + score meter
 * - recommended: Gold border + star badge
 * - locked: Grayed out + lock icon
 */

import type { ModuleDefinition } from '../../data/modules';
import './ModuleButton.css';

interface Props {
  module: ModuleDefinition;
}

export function ModuleButton({ module }: Props) {
  const statusClass = `module-btn--${module.status.replace('_', '-')}`;
  const isInteractive = module.status !== 'locked';

  const handleClick = () => {
    if (!isInteractive) return;
    if (module.url) {
      window.open(module.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      className={`module-btn glass ${statusClass}`}
      onClick={handleClick}
      disabled={!isInteractive}
      aria-label={`${module.name} - ${module.status.replace('_', ' ')}`}
    >
      {/* Status indicator dot */}
      <div className="module-btn__indicator" />

      {/* Icon */}
      <div className="module-btn__icon">{module.icon}</div>

      {/* Name */}
      <h3 className="module-btn__name">{module.shortName}</h3>

      {/* Score meter (only for completed) */}
      {module.status === 'completed' && module.score !== undefined && (
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
      {module.status === 'completed' && (
        <span className="module-btn__badge module-btn__badge--completed">{'\u2705'}</span>
      )}
      {module.status === 'recommended' && (
        <span className="module-btn__badge module-btn__badge--recommended">{'\u2B50'}</span>
      )}
      {module.status === 'locked' && (
        <span className="module-btn__badge module-btn__badge--locked">{'\u{1F512}'}</span>
      )}
    </button>
  );
}
