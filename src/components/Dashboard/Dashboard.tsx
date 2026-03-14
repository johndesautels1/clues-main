/**
 * CLUES Main Dashboard
 * Layout: Hero Heading → Globe → Paragraphical → Main Module → 23 Module Grid
 * Reads/writes from UserContext (centralized state with Supabase auto-save).
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroHeading } from './HeroHeading';
import { GlobeExplorer } from './GlobeExplorer';
import { ParagraphicalButton } from './ParagraphicalButton';
import { MainModuleExpander } from './MainModuleExpander';
import { ModuleGrid } from './ModuleGrid';
import { Header } from '../Shared/Header';
import { Footer } from '../Shared/Footer';
import { OliviaBubble } from '../Shared/OliviaBubble';
import { EmiliaBubble } from '../Shared/EmiliaBubble';
import { useUser } from '../../context/UserContext';
import { useRelevanceState } from '../../hooks/useRelevanceState';
import { CoverageMeter } from '../Questionnaire/CoverageMeter';
import { ReadinessIndicator } from './ReadinessIndicator';
import { JourneyGuide } from './JourneyGuide';
import { MODULES } from '../../data/modules';
import type { ModuleDefinition, ModuleStatus } from '../../data/modules';
import type { SubSection } from '../../types';
import { buildTestPersonaSession, injectTestModuleAnswers, clearTestModuleAnswers } from '../../data/testPersona';
import './Dashboard.css';

export type { SubSection };
export type SubSectionStatus = Record<SubSection, ModuleStatus>;

/**
 * Detect if a module has partial answers in localStorage (in_progress).
 */
function hasLocalStorageAnswers(moduleId: string): boolean {
  try {
    const stored = localStorage.getItem(`clues-module-${moduleId}`);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Object.keys(parsed).some(k => k.startsWith(`${moduleId}__`));
  } catch { return false; }
}

export function Dashboard() {
  const { session, dispatch, isLoading } = useUser();
  const navigate = useNavigate();
  const { isRecommended } = useRelevanceState();

  const { globe, paragraphical, mainModule, completedModules } = session;

  // M15 fix: Track localStorage changes so enrichedModules re-computes
  // when partial mini module answers are saved.
  const [lsRevision, setLsRevision] = useState(0);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key?.startsWith('clues-module-')) {
        setLsRevision(r => r + 1);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Enrich static MODULES with dynamic status from engines + session
  const enrichedModules = useMemo((): ModuleDefinition[] => {
    return MODULES.map(mod => {
      let status: ModuleStatus = 'not_started';

      if (completedModules.includes(mod.id)) {
        status = 'completed';
      } else if (hasLocalStorageAnswers(mod.id)) {
        status = 'in_progress';
      } else if (isRecommended(mod.id)) {
        status = 'recommended';
      }

      return { ...mod, status };
    });
  }, [completedModules, isRecommended, lsRevision]);

  // Globe region selected
  const handleRegionSelected = (region: string, lat: number, lng: number, zoomLevel: number) => {
    dispatch({ type: 'SET_GLOBE', payload: { region, lat, lng, zoomLevel } });
  };

  // Reset globe
  const handleGlobeReset = () => {
    dispatch({ type: 'CLEAR_GLOBE' });
  };

  // Paragraphical click
  const handleParagraphicalClick = () => {
    if (paragraphical.status === 'not_started') {
      dispatch({ type: 'SET_PARAGRAPHICAL_STATUS', payload: 'in_progress' });
    }
  };

  // Sub-section click → navigate to questionnaire at that section
  const handleSubSectionClick = (section: SubSection) => {
    if (mainModule.subSectionStatus[section] === 'locked') return;
    if (mainModule.subSectionStatus[section] === 'not_started') {
      dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section, status: 'in_progress' } });
    }
    navigate(`/questionnaire?section=${section}`);
  };

  // L12 fix: Memoize main module status computation
  const mainModuleStatus = useMemo((): ModuleStatus => {
    const statuses = Object.values(mainModule.subSectionStatus);
    if (statuses.every(s => s === 'completed')) return 'completed';
    if (statuses.some(s => s === 'in_progress')) return 'in_progress';
    return 'not_started';
  }, [mainModule.subSectionStatus]);

  const [mainModuleExpanded, setMainModuleExpanded] = useState(false);
  const [testPersonaInjected, setTestPersonaInjected] = useState(false);

  // Dev-only: Inject test persona with complete data
  const handleInjectTestPersona = () => {
    const testSession = buildTestPersonaSession();
    injectTestModuleAnswers();
    dispatch({ type: 'LOAD_SESSION', payload: testSession });
    setTestPersonaInjected(true);
    setLsRevision(r => r + 1); // trigger module grid refresh
  };

  // Dev-only: Clear test persona
  const handleClearTestPersona = () => {
    clearTestModuleAnswers();
    dispatch({ type: 'RESET' });
    setTestPersonaInjected(false);
    setLsRevision(r => r + 1);
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <Header />
        <main className="dashboard__content container" id="main-content">
          <div className="dashboard__loading">
            <div className="dashboard__loading-spinner" />
            <p>Restoring your session...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard__content container" id="main-content">
        {/* Hero Heading: "Stop Guessing - Start Living" */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '50ms' }}
        >
          <HeroHeading />
        </section>

        {/* Onboarding Journey Guide */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '100ms' }}
        >
          <JourneyGuide />
        </section>

        {/* Interactive 4D Globe */}
        <section
          className="dashboard__section dashboard__section--hero"
          style={{ animationDelay: '150ms' }}
        >
          <GlobeExplorer
            onRegionSelected={handleRegionSelected}
            onReset={handleGlobeReset}
            globeSelection={globe}
          />
        </section>

        {/* Post-zoom prompt text */}
        {globe && (
          <section
            className="dashboard__section"
            style={{ animationDelay: '0ms' }}
          >
            <p className="dashboard__zoom-prompt">
              Now click on the Paragraphical below and tell us about: <strong>You</strong>
            </p>
          </section>
        )}

        {/* Paragraphical Button */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '250ms' }}
        >
          <ParagraphicalButton
            status={paragraphical.status}
            onClick={handleParagraphicalClick}
          />
        </section>

        <div className="dashboard__divider" role="separator" />

        {/* Main Module Expander */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '350ms' }}
        >
          <MainModuleExpander
            status={mainModuleStatus}
            expanded={mainModuleExpanded}
            onToggle={() => setMainModuleExpanded(!mainModuleExpanded)}
            subSectionStatus={mainModule.subSectionStatus}
            onSubSectionClick={handleSubSectionClick}
          />
        </section>

        {/* Coverage Meter */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '400ms' }}
        >
          <CoverageMeter variant="full" />
        </section>

        {/* Readiness Indicator (overall report readiness) */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '450ms' }}
        >
          <ReadinessIndicator />
        </section>

        {/* Inject Test Persona — visible until production launch */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '500ms' }}
        >
          <div className="dashboard__test-persona">
            {!testPersonaInjected ? (
              <button
                className="dashboard__test-persona-btn"
                onClick={handleInjectTestPersona}
                type="button"
              >
                Inject Test Persona
              </button>
            ) : (
              <button
                className="dashboard__test-persona-btn dashboard__test-persona-btn--active"
                onClick={handleClearTestPersona}
                type="button"
              >
                Clear Test Persona
              </button>
            )}
            <span className="dashboard__test-persona-label">
              Loads Marcus &amp; Elena (30 paragraphs, all 200 main module Qs, all 23 modules x 100 Qs, Gemini extraction)
            </span>
          </div>
        </section>

        <div className="dashboard__divider" role="separator" />

        {/* 23 Module Grid */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '550ms' }}
        >
          <h2 className="dashboard__section-title">Exploration Modules</h2>
          <p className="dashboard__section-subtitle">
            Complete modules to progressively narrow your ideal destinations
          </p>
          <ModuleGrid modules={enrichedModules} />
        </section>
      </main>

      <Footer />

      {/* Floating Chat Bubbles */}
      <OliviaBubble />
      <EmiliaBubble />
    </div>
  );
}
