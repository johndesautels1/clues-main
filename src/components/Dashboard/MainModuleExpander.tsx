/**
 * Main Module Expander
 * Collapsible panel with 4 sub-section cards in a 2x2 grid:
 * Demographics, Do Not Wants, Must Haves, General Questions
 */

import type { ModuleStatus } from '../../data/modules';
import type { SubSection, SubSectionStatus } from './Dashboard';
import { StatusBadge } from './StatusBadge';
import './MainModuleExpander.css';

interface Props {
  status: ModuleStatus;
  expanded: boolean;
  onToggle: () => void;
  subSectionStatus: SubSectionStatus;
  onSubSectionClick: (section: SubSection) => void;
}

const SUB_SECTIONS: Array<{
  id: SubSection;
  title: string;
  shortTitle: string;
  description: string;
  questionCount: number;
  icon: string;
}> = [
  {
    id: 'demographics',
    title: 'Demographics',
    shortTitle: 'Demographics',
    description: 'Personal identity, household, employment, and health profile',
    questionCount: 34,
    icon: '\u{1F464}',
  },
  {
    id: 'dnw',
    title: 'Do Not Wants',
    shortTitle: 'DNWs',
    description: 'Deal breakers that eliminate cities from consideration',
    questionCount: 33,
    icon: '\u{1F6AB}',
  },
  {
    id: 'mh',
    title: 'Must Haves',
    shortTitle: 'Must Haves',
    description: 'Essential features that boost city scores',
    questionCount: 33,
    icon: '\u{2B50}',
  },
  {
    id: 'general',
    title: 'General Questions',
    shortTitle: 'General',
    description: '200 questions across 20 lifestyle dimensions',
    questionCount: 200,
    icon: '\u{1F4CB}',
  },
];

export function MainModuleExpander({
  status,
  expanded,
  onToggle,
  subSectionStatus,
  onSubSectionClick,
}: Props) {
  const statusClass = `main-module--${status.replace('_', '-')}`;
  const completedCount = Object.values(subSectionStatus).filter(s => s === 'completed').length;
  const totalSections = 4;

  return (
    <div className={`main-module glass ${statusClass}`}>
      {/* Header (always visible) */}
      <button
        className="main-module__header"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="main-module-content"
      >
        <div className="main-module__header-left">
          <span className="main-module__icon">{'\u{1F3AF}'}</span>
          <div>
            <h2 className="main-module__title">Main Module</h2>
            <p className="main-module__meta">
              {completedCount}/{totalSections} sections complete &middot; 300 total questions
            </p>
          </div>
        </div>

        <div className="main-module__header-right">
          <StatusBadge status={status} />
          <span className={`main-module__chevron ${expanded ? 'main-module__chevron--open' : ''}`}>
            {'\u25BE'}
          </span>
        </div>
      </button>

      {/* Expandable Content */}
      <div
        id="main-module-content"
        className={`main-module__content ${expanded ? 'main-module__content--open' : ''}`}
        role="region"
        aria-label="Main Module sub-sections"
      >
        <div className="main-module__grid">
          {SUB_SECTIONS.map((section) => {
            const sectionStatus = subSectionStatus[section.id];
            const isLocked = sectionStatus === 'locked';
            const sectionClass = `sub-section--${sectionStatus.replace('_', '-')}`;

            return (
              <button
                key={section.id}
                className={`sub-section glass ${sectionClass}`}
                onClick={() => onSubSectionClick(section.id)}
                disabled={isLocked}
                aria-label={`${section.title} - ${sectionStatus}`}
              >
                <div className="sub-section__header">
                  <span className="sub-section__icon">{section.icon}</span>
                  <StatusBadge status={sectionStatus} size="sm" />
                </div>
                <h3 className="sub-section__title">{section.shortTitle}</h3>
                <p className="sub-section__description">{section.description}</p>
                <div className="sub-section__footer">
                  <span className="sub-section__count">{section.questionCount} questions</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
