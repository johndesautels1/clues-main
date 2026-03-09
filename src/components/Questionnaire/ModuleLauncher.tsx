/**
 * ModuleLauncher — Route wrapper that resolves moduleId from URL params
 * and loads the appropriate question data file for MiniModuleFlow.
 *
 * Route: /module/:moduleId
 * Renders: MiniModuleFlow with the resolved QuestionModule data
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { MiniModuleFlow } from './MiniModuleFlow';
import { getModuleById } from '../../data/questions';
import { MODULES_MAP } from '../../data/modules';

export function ModuleLauncher() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const moduleData = useMemo(() => {
    if (!moduleId) return null;
    return getModuleById(moduleId) ?? null;
  }, [moduleId]);

  // Invalid module ID — show error with back link
  if (!moduleId || !moduleData || !MODULES_MAP[moduleId]) {
    return (
      <div className="mmf-universe">
        <div className="mmf-error">
          <h2>Module Not Found</h2>
          <p>
            The module <code>{moduleId || '(none)'}</code> does not exist.
          </p>
          <button
            className="mmf-error__btn"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <MiniModuleFlow moduleData={moduleData} />;
}
