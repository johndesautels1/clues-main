/**
 * CLUES Main Dashboard
 * Layout: Hero Heading → Globe → Paragraphical → Main Module → 20 Module Grid
 * Reads/writes from UserContext (centralized state with Supabase auto-save).
 */

import { useState } from 'react';
import { HeroHeading } from './HeroHeading';
import { GlobeExplorer } from './GlobeExplorer';
import { ParagraphicalButton } from './ParagraphicalButton';
import { MainModuleExpander } from './MainModuleExpander';
import { ModuleGrid } from './ModuleGrid';
import { Header } from '../Shared/Header';
import { OliviaBubble } from '../Shared/OliviaBubble';
import { EmiliaBubble } from '../Shared/EmiliaBubble';
import { useUser } from '../../context/UserContext';
import { MODULES } from '../../data/modules';
import type { ModuleStatus } from '../../types';
import type { SubSection } from '../../types';
import './Dashboard.css';

export type { SubSection };
export type SubSectionStatus = Record<SubSection, ModuleStatus>;

export function Dashboard() {
  const { session, dispatch, isLoading } = useUser();

  const { globe, paragraphical, mainModule } = session;

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

  // Sub-section click
  const handleSubSectionClick = (section: SubSection) => {
    if (mainModule.subSectionStatus[section] === 'locked') return;
    if (mainModule.subSectionStatus[section] === 'not_started') {
      dispatch({ type: 'SET_SUBSECTION_STATUS', payload: { section, status: 'in_progress' } });
    }
  };

  // Main module overall status
  const getMainModuleStatus = (): ModuleStatus => {
    const statuses = Object.values(mainModule.subSectionStatus);
    if (statuses.every(s => s === 'completed')) return 'completed';
    if (statuses.some(s => s === 'in_progress')) return 'in_progress';
    return 'not_started';
  };

  const [mainModuleExpanded, setMainModuleExpanded] = useState(false);

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
          className="dashboard__section dashboard__section--hero"
          style={{ animationDelay: '250ms' }}
        >
          <ParagraphicalButton
            status={paragraphical.status}
            onClick={handleParagraphicalClick}
          />
        </section>

        {/* Main Module Expander */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '350ms' }}
        >
          <MainModuleExpander
            status={getMainModuleStatus()}
            expanded={mainModuleExpanded}
            onToggle={() => setMainModuleExpanded(!mainModuleExpanded)}
            subSectionStatus={mainModule.subSectionStatus}
            onSubSectionClick={handleSubSectionClick}
          />
        </section>

        {/* 20 Module Grid */}
        <section
          className="dashboard__section"
          style={{ animationDelay: '450ms' }}
        >
          <h2 className="dashboard__section-title">Exploration Modules</h2>
          <p className="dashboard__section-subtitle">
            Complete modules to progressively narrow your ideal destinations
          </p>
          <ModuleGrid modules={MODULES} />
        </section>
      </main>

      {/* Floating Chat Bubbles */}
      <OliviaBubble />
      <EmiliaBubble />
    </div>
  );
}
