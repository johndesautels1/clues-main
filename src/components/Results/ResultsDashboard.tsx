/**
 * ResultsDashboard — Main results page orchestrator.
 *
 * Conv 17-18: Results Page Assembly.
 * Wires WinnerHero, CityComparisonGrid, CategoryBreakdown,
 * EvidencePanel, TownNeighborhoodDrilldown, and existing
 * ThinkingDetailsPanel + SideBySideMetricView + ReactiveJustification.
 *
 * Data flow: reads SmartScoreOutput from UserContext (session.evaluation)
 * and renders the full results experience.
 *
 * WCAG 2.1 AA: Section landmarks, heading hierarchy, focus management.
 */

import { useState } from 'react';
import type { SmartScoreOutput, CitySmartScore } from '../../types/smartScore';
import type { ThinkingStep, ParagraphEntry, LocationMetrics } from '../../types';
import { WinnerHero } from './WinnerHero';
import { CityComparisonGrid } from './CityComparisonGrid';
import { CategoryBreakdown } from './CategoryBreakdown';
import { EvidencePanel } from './EvidencePanel';
import { TownNeighborhoodDrilldown } from './TownNeighborhoodDrilldown';
import { ThinkingDetailsPanel } from './ThinkingDetailsPanel';
import { SideBySideMetricView } from './SideBySideMetricView';
import { ParagraphHighlightPanel } from './ReactiveJustification';
import { Header } from '../Shared/Header';
import { Footer } from '../Shared/Footer';
import './Results.css';

interface ResultsDashboardProps {
  /** SmartScoreOutput from the Smart Score engine */
  smartScores: SmartScoreOutput;
  /** Gemini thinking details for transparency panel */
  thinkingDetails?: ThinkingStep[];
  /** Thinking metadata for the details panel */
  thinkingMetadata?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    durationMs: number;
    metricsExtracted?: number;
  };
  /** User's paragraphs for reactive justification */
  paragraphs?: ParagraphEntry[];
  /** Gemini-recommended city/town/neighborhood LocationMetrics for SideBySideMetricView */
  recommendedCity?: LocationMetrics | null;
  recommendedTown?: LocationMetrics | null;
  recommendedNeighborhood?: LocationMetrics | null;
}

export function ResultsDashboard({
  smartScores,
  thinkingDetails,
  thinkingMetadata,
  paragraphs,
  recommendedCity,
  recommendedTown,
  recommendedNeighborhood,
}: ResultsDashboardProps) {
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);

  const { cityScores, winner } = smartScores;

  // Separate cities, towns, neighborhoods
  const cities = cityScores.filter(c => c.location_type === 'city');
  const towns = cityScores.filter(c => c.location_type === 'town');
  const neighborhoods = cityScores.filter(c => c.location_type === 'neighborhood');

  const winningCityName = winner.winner.location;

  return (
    <>
      <Header />
      <main className="results-page" aria-label="Evaluation Results">

        {/* 1. Winner Hero */}
        <WinnerHero winner={winner} />

        {/* 2. City Comparison Grid */}
        {cities.length > 0 && (
          <>
            <SectionDivider text="City Comparison" />
            <CityComparisonGrid cities={cities} />
          </>
        )}

        {/* 3. Category Breakdown */}
        <SectionDivider text="Category Breakdown" />
        <CategoryBreakdown
          cities={cities.length > 0 ? cities : [winner.winner]}
          initialExpanded={winner.winnerAdvantageCategories.slice(0, 2)}
        />

        {/* 4. Evidence Panel */}
        <SectionDivider text="Evidence &amp; Sources" />
        <EvidencePanel cities={cityScores} />

        {/* 5. Towns & Neighborhoods */}
        {(towns.length > 0 || neighborhoods.length > 0) && (
          <>
            <SectionDivider text="Towns &amp; Neighborhoods" />
            <TownNeighborhoodDrilldown
              towns={towns}
              neighborhoods={neighborhoods}
              winningCity={winningCityName}
            />
          </>
        )}

        {/* 6. AI Reasoning Transparency */}
        {thinkingDetails && thinkingDetails.length > 0 && (
          <>
            <SectionDivider text="AI Reasoning" />
            <ThinkingDetailsPanel
              thinkingDetails={thinkingDetails}
              metadata={thinkingMetadata}
            />
          </>
        )}

        {/* 7. Side-by-Side Metric View (existing component) */}
        {(recommendedCity || recommendedTown || recommendedNeighborhood) && (
          <>
            <SectionDivider text="Metric Comparison" />
            <SideBySideMetricView
              city={recommendedCity ?? null}
              town={recommendedTown ?? null}
              neighborhood={recommendedNeighborhood ?? null}
              onParagraphClick={(id) => setHighlightedParagraph(id)}
            />
          </>
        )}

      </main>
      <Footer />

      {/* Paragraph highlight panel (slides in from right) */}
      {paragraphs && paragraphs.length > 0 && (
        <ParagraphHighlightPanel
          paragraphs={paragraphs}
          highlightedParagraph={highlightedParagraph}
          onClose={() => setHighlightedParagraph(null)}
        />
      )}
    </>
  );
}

/** Section divider between major results blocks */
function SectionDivider({ text }: { text: string }) {
  return (
    <div className="results-divider" role="separator">
      <div className="results-divider__line" />
      <span className="results-divider__text">{text}</span>
      <div className="results-divider__line" />
    </div>
  );
}
