/**
 * CLUES Main Dashboard
 * Layout: Hero Heading → Globe → Paragraphical → Main Module → 20 Module Grid
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
import { MODULES } from '../../data/modules';
import type { ModuleStatus } from '../../data/modules';
import './Dashboard.css';

export type SubSection = 'demographics' | 'dnw' | 'mh' | 'general';
export type SubSectionStatus = Record<SubSection, ModuleStatus>;

export function Dashboard() {
  const [paragraphicalStatus, setParagraphicalStatus] = useState<ModuleStatus>('not_started');
  const [mainModuleExpanded, setMainModuleExpanded] = useState(false);
  const [globeRegion, setGlobeRegion] = useState<string | null>(null);
  const [subSectionStatus, setSubSectionStatus] = useState<SubSectionStatus>({
    demographics: 'not_started',
    dnw: 'locked',
    mh: 'locked',
    general: 'locked',
  });

  // Globe region selected
  const handleRegionSelected = (region: string) => {
    setGlobeRegion(region);
  };

  // Simulate clicking paragraphical
  const handleParagraphicalClick = () => {
    if (paragraphicalStatus === 'not_started') {
      setParagraphicalStatus('in_progress');
    }
  };

  // Simulate sub-section click
  const handleSubSectionClick = (section: SubSection) => {
    if (subSectionStatus[section] === 'locked') return;
    setSubSectionStatus(prev => ({
      ...prev,
      [section]: prev[section] === 'not_started' ? 'in_progress' : prev[section],
    }));
  };

  // Get main module overall status
  const getMainModuleStatus = (): ModuleStatus => {
    const statuses = Object.values(subSectionStatus);
    if (statuses.every(s => s === 'completed')) return 'completed';
    if (statuses.some(s => s === 'in_progress')) return 'in_progress';
    return 'not_started';
  };

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
            hasZoomed={!!globeRegion}
          />
        </section>

        {/* Post-zoom prompt text */}
        {globeRegion && (
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
            status={paragraphicalStatus}
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
            subSectionStatus={subSectionStatus}
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
