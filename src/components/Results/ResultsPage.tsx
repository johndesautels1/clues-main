/**
 * ResultsPage — Route-level wrapper that bridges UserContext to ResultsDashboard.
 *
 * Conv 17-18: Results Page Assembly.
 * Reads evaluation data from the user session and passes it to
 * ResultsDashboard. Shows a loading/empty state when no evaluation
 * data is available yet.
 *
 * The SmartScoreOutput is expected to be stored on the session once
 * the Smart Score Engine runs. Until then, this page shows a
 * "no results yet" state directing users back to the Paragraphical.
 */

import { useUser } from '../../context/UserContext';
import { ResultsDashboard } from './ResultsDashboard';
import { Header } from '../Shared/Header';
import { Footer } from '../Shared/Footer';
import type { SmartScoreOutput } from '../../types/smartScore';
import './Results.css';

export function ResultsPage() {
  const { session, isLoading } = useUser();

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="results-page" aria-label="Loading Results">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTopColor: 'var(--clues-sapphire, #2563eb)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              marginTop: 16,
            }}>
              Loading your results...
            </p>
          </div>
        </main>
        <Footer />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  // Check for SmartScoreOutput in session
  // The Smart Score Engine stores its output on the session when complete.
  // We cast the evaluation to access smartScoreOutput if present.
  const sessionAny = session as unknown as Record<string, unknown>;
  const smartScores = sessionAny.smartScoreOutput as SmartScoreOutput | undefined;

  // No results yet
  if (!smartScores) {
    return (
      <>
        <Header />
        <main className="results-page" aria-label="No Results Yet">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            maxWidth: 480,
            margin: '0 auto',
          }}>
            <span style={{ fontSize: '3rem', marginBottom: 16 }} aria-hidden="true">
              &#x1F50D;
            </span>
            <h1 style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-3xl)',
              fontWeight: 300,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              No Results Yet
            </h1>
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              Complete the Paragraphical to tell us about your ideal life, then
              run the evaluation to see your personalized city recommendations.
            </p>
            <a
              href="/paragraphical"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--clues-sapphire, #2563eb)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background var(--transition-fast)',
              }}
            >
              Start Your Discovery
            </a>

            {/* Show completion status */}
            {session.currentTier && (
              <div style={{
                marginTop: 24,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
              }}>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Current Tier</div>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)',
                  textTransform: 'capitalize',
                }}>
                  {session.currentTier} — {session.confidence}% confidence
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Extract supplementary data from session
  const extraction = session.paragraphical?.extraction;
  const paragraphs = session.paragraphical?.paragraphs;

  // Extract judge report if available
  const judgeReport = (sessionAny.judgeReport as import('../../types/judge').JudgeReport) ?? undefined;
  const judgeOrchestration = (sessionAny.judgeOrchestration as import('../../types/judge').JudgeOrchestrationResult) ?? undefined;
  const existingVideoUrl = (sessionAny.cristianoVideoUrl as string) ?? undefined;

  return (
    <ResultsDashboard
      smartScores={smartScores}
      thinkingDetails={extraction?.thinking_details}
      thinkingMetadata={extraction ? {
        model: 'Gemini 3.1 Pro Preview',
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        metricsExtracted: extraction.metrics?.length,
      } : undefined}
      paragraphs={paragraphs}
      recommendedCity={extraction?.recommended_cities?.[0] ?? null}
      recommendedTown={extraction?.recommended_towns?.[0] ?? null}
      recommendedNeighborhood={extraction?.recommended_neighborhoods?.[0] ?? null}
      judgeReport={judgeReport}
      judgeOrchestration={judgeOrchestration}
      sessionId={session.id}
      existingVideoUrl={existingVideoUrl}
    />
  );
}
