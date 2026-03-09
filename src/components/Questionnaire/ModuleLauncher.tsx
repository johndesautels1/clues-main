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
import { C } from './questionnaireData';
import './Questionnaire.css';

export function ModuleLauncher() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const moduleData = useMemo(() => {
    if (!moduleId) return null;
    return getModuleById(moduleId) ?? null;
  }, [moduleId]);

  // Invalid module ID — show error with back link (uses established mq-* design)
  if (!moduleId || !moduleData || !MODULES_MAP[moduleId]) {
    return (
      <div className="mq-universe" role="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
          <div style={{ fontSize: 38, marginBottom: 16, color: C.textMuted }}>{'\u26A0'}</div>
          <h2 style={{ fontFamily: "'Cormorant',serif", fontSize: 'clamp(24px,3vw,30px)', fontWeight: 300, color: C.textPrimary, margin: '0 0 12px' }}>
            Module Not Found
          </h2>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 15, color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
            The module <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: 14 }}>{moduleId || '(none)'}</code> does not exist.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg,rgba(96,165,250,0.14) 0%,rgba(96,165,250,0.06) 100%)',
              border: '1px solid rgba(96,165,250,0.28)', borderRadius: 14,
              padding: '12px 28px', fontFamily: "'Outfit',sans-serif", fontSize: 14,
              color: '#60a5fa', cursor: 'pointer', minHeight: 44,
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <MiniModuleFlow moduleData={moduleData} />;
}
