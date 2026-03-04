/**
 * Status Badge
 * Reusable badge showing module/section status
 */

import type { ModuleStatus } from '../../data/modules';
import './StatusBadge.css';

interface Props {
  status: ModuleStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ModuleStatus, { label: string; icon: string }> = {
  locked: { label: 'Locked', icon: '\u{1F512}' },
  not_started: { label: 'Not Started', icon: '' },
  in_progress: { label: 'In Progress', icon: '' },
  completed: { label: 'Complete', icon: '\u2705' },
  recommended: { label: 'Recommended', icon: '\u2B50' },
};

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status];
  const className = `status-badge status-badge--${status.replace('_', '-')} status-badge--${size}`;

  return (
    <span className={className} aria-label={config.label}>
      {config.icon && <span className="status-badge__icon">{config.icon}</span>}
      {size === 'md' && <span className="status-badge__label">{config.label}</span>}
    </span>
  );
}
