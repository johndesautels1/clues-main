/**
 * ResultsDashboard — Main results page orchestrator.
 *
 * Conv 17-20: Results Page Assembly + Cristiano Judge UI + Video.
 * Wires all Results + Judge + Video components into a unified flow.
 *
 * Data flow: reads SmartScoreOutput from UserContext (session.evaluation)
 * and renders the full results experience.
 *
 * WCAG 2.1 AA: Section landmarks, heading hierarchy, focus management.
 */

import { useState } from 'react';
import type { SmartScoreOutput } from '../../types/smartScore';
import type { ThinkingStep, ParagraphEntry, LocationMetrics, GeminiExtraction, CompletionTier, UserSession } from '../../types';
import type { JudgeReport, JudgeOrchestrationResult } from '../../types/judge';
import type { OrchestrationResult } from '../../types/evaluation';
import type { CoverageState } from '../../lib/coverageTracker';
import type { PipelineResult } from '../../lib/evaluationPipeline';
import { WinnerHero } from './WinnerHero';
import { CityComparisonGrid } from './CityComparisonGrid';
import { CategoryBreakdown } from './CategoryBreakdown';
import { EvidencePanel } from './EvidencePanel';
import { TownNeighborhoodDrilldown } from './TownNeighborhoodDrilldown';
import { JudgeVerdict } from './JudgeVerdict';
import { CourtOrder } from './CourtOrder';
import { SimliQuickVerdict } from './SimliQuickVerdict';
import { CristianoVideoPlayer } from './CristianoVideoPlayer';
import { ThinkingDetailsPanel } from './ThinkingDetailsPanel';
import { SideBySideMetricView } from './SideBySideMetricView';
import { ParagraphHighlightPanel } from './ReactiveJustification';
import { ReportDownload } from './ReportDownload';
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
  /** Opus Judge report */
  judgeReport?: JudgeReport;
  /** Full judge orchestration result (for safeguard info) */
  judgeOrchestration?: JudgeOrchestrationResult;
  /** Session ID for video pipeline */
  sessionId?: string;
  /** Pre-rendered video URL (if available) */
  existingVideoUrl?: string;
  /** Gemini extraction (for report assembly) */
  geminiExtraction?: GeminiExtraction | null;
  /** Orchestration result (for report assembly) */
  orchestration?: OrchestrationResult | null;
  /** Coverage state (for MOE in report) */
  coverage?: CoverageState | null;
  /** Current completion tier */
  tier?: CompletionTier;
  /** Pipeline result for report generation */
  pipelineResult?: PipelineResult | null;
  /** User session for report generation */
  session?: UserSession;
}

export function ResultsDashboard({
  smartScores,
  thinkingDetails,
  thinkingMetadata,
  paragraphs,
  recommendedCity,
  recommendedTown,
  recommendedNeighborhood,
  judgeReport,
  judgeOrchestration,
  sessionId,
  existingVideoUrl,
  pipelineResult,
  session,
}: ResultsDashboardProps) {
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);

  const { cityScores, winner } = smartScores ?? { cityScores: [], winner: null };

  // Guard: if no scores available, show fallback
  if (!winner || cityScores.length === 0) {
    return (
      <>
        <Header />
        <main className="results-page" aria-label="Evaluation Results">
          <section className="no-results-message" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>Evaluation Incomplete</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              No usable evaluation data was returned. This usually means the evaluation
              services are temporarily unavailable. Please try again.
            </p>
          </section>
        </main>
      </>
    );
  }

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

        {/* 5. Cristiano's Judicial Verdict */}
        {judgeReport && (
          <>
            <SectionDivider text="Cristiano&apos;s Verdict" />

            {/* Quick Verdict — Simli real-time narration */}
            <SimliQuickVerdict report={judgeReport} />

            {/* Full Judicial Briefing */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <JudgeVerdict report={judgeReport} orchestration={judgeOrchestration} />
            </div>

            {/* Per-category Court Orders */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <CourtOrder report={judgeReport} />
            </div>
          </>
        )}

        {/* 6. Cinematic Video — "Your New Life in [City]" */}
        {judgeReport && sessionId && (
          <>
            <SectionDivider text="Cinematic Verdict" />
            <CristianoVideoPlayer
              report={judgeReport}
              winnerCity={winner.winner}
              sessionId={sessionId}
              existingVideoUrl={existingVideoUrl}
            />
          </>
        )}

        {/* 7. Towns & Neighborhoods */}
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

        {/* 8. Report Generation — Evidence Room + Gamma */}
        {session && (
          <>
            <SectionDivider text="Report Generation" />
            <ReportDownload
              pipelineResult={pipelineResult ?? null}
              session={session}
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
