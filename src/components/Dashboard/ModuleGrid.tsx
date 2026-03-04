/**
 * Module Grid
 * 5-column responsive grid of 20 module buttons with staggered animations
 */

import type { ModuleDefinition } from '../../data/modules';
import { ModuleButton } from './ModuleButton';
import './ModuleGrid.css';

interface Props {
  modules: ModuleDefinition[];
}

export function ModuleGrid({ modules }: Props) {
  return (
    <div className="module-grid" role="list" aria-label="Exploration modules">
      {modules.map((module, index) => (
        <div
          key={module.id}
          className="module-grid__item"
          style={{ animationDelay: `${500 + index * 50}ms` }}
          role="listitem"
        >
          <ModuleButton module={module} />
        </div>
      ))}
    </div>
  );
}
