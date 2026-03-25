/**
 * ResultsPage — Route-level wrapper that bridges UserContext to ResultsDashboard.
 *
 * Conv 17-18 + Session 16: Results Page Assembly + Pipeline Integration.
 *
 * Three states:
 *   1. No data → "Start Your Discovery" prompt
 *   2. Has data, no scores → "Run Evaluation" button + progress phases
 *   3. Has scores → Full ResultsDashboard
 *
 * WCAG 2.1 AA: All text ≥ 11px, contrast verified, focus management.
 */

import { useUser } from '../../context/UserContext';
import { useEvaluationPipeline } from '../../hooks/useEvaluationPipeline';
import { ResultsDashboard } from './ResultsDashboard';
import { PipelineCascadeProgress } from './PipelineCascadeProgress';
import { Header } from '../Shared/Header';
import { Footer } from '../Shared/Footer';
import './Results.css';

export function ResultsPage() {
  const { session, isLoading } = useUser();
  const pipeline = useEvaluationPipeline();

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

  // Check for SmartScoreOutput on the session (properly typed now)
  const smartScores = session.smartScoreOutput;

  // Check if user has enough data to run evaluation
  const hasParagraphical = !!session.paragraphical.extraction;
  const hasMainModule = !!(
    session.mainModule.demographics ||
    session.mainModule.dnw ||
    session.mainModule.mh ||
    session.mainModule.generalAnswers ||
    session.mainModule.tradeoffAnswers
  );
  const hasData = hasParagraphical || hasMainModule || session.completedModules.length > 0;

  // Pipeline is running — show progress
  if (pipeline.isRunning) {
    return (
      <>
        <Header />
        <main className="results-page" aria-label="Running Evaluation">
          <PipelineCascadeProgress progress={pipeline.progress} />
        </main>
        <Footer />
      </>
    );
  }

  // Pipeline error
  if (pipeline.hasError) {
    return (
      <>
        <Header />
        <main className="results-page" aria-label="Evaluation Error">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            maxWidth: 520,
            margin: '0 auto',
          }}>
            <span style={{ fontSize: '2.5rem', marginBottom: 16 }} aria-hidden="true">&#x26A0;</span>
            <h2 style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-2xl)',
              fontWeight: 300,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              Evaluation Failed
            </h2>
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 16,
            }}>
              {pipeline.progress.error}
            </p>
            <button
              onClick={pipeline.run}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--clues-sapphire, #2563eb)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Retry Evaluation
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // No results yet — show trigger or prompt
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
              {hasData ? '\u{1F680}' : '\u{1F50D}'}
            </span>
            <h1 style={{
              fontFamily: "'Cormorant', serif",
              fontSize: 'var(--text-3xl)',
              fontWeight: 300,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              {hasData ? 'Ready to Evaluate' : 'No Results Yet'}
            </h1>
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              {hasData
                ? 'Your profile data is ready. Run the full 5-LLM evaluation to discover your ideal cities.'
                : 'Complete the Paragraphical to tell us about your ideal life, then run the evaluation to see your personalized city recommendations.'}
            </p>

            {hasData ? (
              <button
                onClick={pipeline.run}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--clues-sapphire, #2563eb)',
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
              >
                Run Evaluation
              </button>
            ) : (
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
            )}

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

  // Has scores — render full dashboard
  const extraction = session.paragraphical?.extraction;
  const paragraphs = session.paragraphical?.paragraphs;

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
      judgeReport={session.judgeReport}
      judgeOrchestration={session.judgeOrchestration}
      sessionId={session.id}
      existingVideoUrl={session.cristianoVideoUrl}
      pipelineResult={pipeline.result}
      session={session}
    />
  );
}
