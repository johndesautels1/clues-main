/**
 * Paragraphical Flow
 * 30-paragraph structured essay input following the CLUES decision pipeline.
 * Stepped interface: one paragraph at a time with sidebar progress.
 * Auto-saves each paragraph to UserContext (→ Supabase).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { PARAGRAPH_DEFS, PARAGRAPH_SECTIONS, PARAGRAPH_COUNT } from '../../data/paragraphs';
import { extractParagraphical } from '../../lib/api';
import { recalculateTier } from '../../lib/tierEngine';
import { Header } from '../Shared/Header';
import { OliviaBubble } from '../Shared/OliviaBubble';
import { useOliviaTutor } from '../../hooks/useOliviaTutor';
import { getTargetsForParagraph } from '../../data/paragraphTargets';
import './ParagraphicalFlow.css';

/** Writing quality bar — 5-color band from 0-100% */
function QualityBar({ paragraphId, text, coveredTargets }: { paragraphId: number; text: string; coveredTargets: string[] }) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const targets = getTargetsForParagraph(paragraphId);
  const totalTargets = targets?.coverageTargets.length ?? 1;
  const coveredCount = coveredTargets.length;

  // Quality score: 60% from target coverage, 40% from word count (up to 150 words)
  const coverageScore = totalTargets > 0 ? (coveredCount / totalTargets) : 0;
  const wordScore = Math.min(wordCount / 150, 1);
  const quality = Math.round((coverageScore * 0.6 + wordScore * 0.4) * 100);

  // 5-color band: red < 20, orange < 40, yellow < 60, blue < 80, green >= 80
  let colorClass = 'quality--red';
  let label = 'Needs detail';
  if (quality >= 80) { colorClass = 'quality--green'; label = 'Excellent'; }
  else if (quality >= 60) { colorClass = 'quality--blue'; label = 'Good'; }
  else if (quality >= 40) { colorClass = 'quality--yellow'; label = 'Average'; }
  else if (quality >= 20) { colorClass = 'quality--orange'; label = 'Below average'; }

  return (
    <div className="para-flow__status-bar">
      <div className="para-flow__quality">
        <div className="para-flow__quality-track">
          <div
            className={`para-flow__quality-fill ${colorClass}`}
            style={{ width: `${quality}%` }}
            role="progressbar"
            aria-valuenow={quality}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Writing quality: ${quality}% — ${label}`}
          />
          {/* 5-color band markers */}
          <span className="para-flow__quality-marker" style={{ left: '20%' }} aria-hidden="true" />
          <span className="para-flow__quality-marker" style={{ left: '40%' }} aria-hidden="true" />
          <span className="para-flow__quality-marker" style={{ left: '60%' }} aria-hidden="true" />
          <span className="para-flow__quality-marker" style={{ left: '80%' }} aria-hidden="true" />
        </div>
        <span className={`para-flow__quality-label ${colorClass}`}>{label}</span>
      </div>
      <div className="para-flow__word-count">{wordCount} words</div>
    </div>
  );
}

export function ParagraphicalFlow() {
  const navigate = useNavigate();
  const { session, dispatch } = useUser();
  const [activeId, setActiveId] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get saved content for a paragraph
  const getSavedContent = useCallback((id: number): string => {
    return session.paragraphical.paragraphs.find(p => p.id === id)?.content ?? '';
  }, [session.paragraphical.paragraphs]);

  const [draft, setDraft] = useState(() => getSavedContent(1));

  // Olivia Tutor — real-time keyword detection for coverage guidance
  const tutor = useOliviaTutor(activeId, draft);

  // Focus textarea on paragraph change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 200)}px`;
    }
  }, [draft]);

  const activeDef = PARAGRAPH_DEFS.find(p => p.id === activeId)!;
  const completedCount = session.paragraphical.paragraphs.filter(p => p.content.trim().length > 0).length;
  const progress = Math.round((completedCount / PARAGRAPH_COUNT) * 100);

  // Save current paragraph
  const saveCurrent = useCallback(() => {
    if (!draft.trim()) return;
    dispatch({
      type: 'UPDATE_PARAGRAPH',
      payload: {
        id: activeId,
        heading: activeDef.heading,
        content: draft.trim(),
        updatedAt: new Date().toISOString(),
      },
    });
  }, [activeId, activeDef.heading, draft, dispatch]);

  // Navigate to a paragraph
  const goTo = useCallback((id: number) => {
    saveCurrent();
    setActiveId(id);
    setDraft(getSavedContent(id));
  }, [saveCurrent, getSavedContent]);

  // Next paragraph
  const handleNext = useCallback(() => {
    saveCurrent();
    if (activeId < PARAGRAPH_COUNT) {
      const nextId = activeId + 1;
      setActiveId(nextId);
      setDraft(getSavedContent(nextId));
    }
  }, [activeId, saveCurrent, getSavedContent]);

  // Previous paragraph
  const handlePrev = useCallback(() => {
    saveCurrent();
    if (activeId > 1) {
      const prevId = activeId - 1;
      setActiveId(prevId);
      setDraft(getSavedContent(prevId));
    }
  }, [activeId, saveCurrent, getSavedContent]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit all paragraphs → call Gemini extraction → update tier
  const handleSubmit = useCallback(async () => {
    saveCurrent();

    // Mark as completed immediately (optimistic)
    dispatch({ type: 'SET_PARAGRAPHICAL_STATUS', payload: 'completed' });

    // Build the paragraphs array from current state + unsaved draft
    const allParagraphs = [...session.paragraphical.paragraphs];
    if (draft.trim()) {
      const idx = allParagraphs.findIndex(p => p.id === activeId);
      const entry = {
        id: activeId,
        heading: activeDef.heading,
        content: draft.trim(),
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        allParagraphs[idx] = entry;
      } else {
        allParagraphs.push(entry);
      }
    }

    const filledParagraphs = allParagraphs.filter(p => p.content.trim().length > 0);

    if (filledParagraphs.length === 0) {
      toast.error('Please write at least one paragraph before submitting.');
      dispatch({ type: 'SET_PARAGRAPHICAL_STATUS', payload: 'in_progress' });
      return;
    }

    const globeRegion = session.globe?.region ?? 'Global';

    // Call Gemini extraction
    setIsSubmitting(true);
    try {
      const result = await extractParagraphical({
        paragraphs: filledParagraphs,
        globeRegion,
        sessionId: session.id,
      });

      // Store extraction in context
      dispatch({ type: 'SET_EXTRACTION', payload: result.extraction });

      // Recalculate tier now that we have paragraphical data
      const updatedSession = {
        ...session,
        paragraphical: {
          ...session.paragraphical,
          status: 'completed' as const,
          extraction: result.extraction,
        },
      };
      const { tier, confidence } = recalculateTier(updatedSession);
      dispatch({ type: 'SET_TIER', payload: { tier, confidence } });

      toast.success(
        `Paragraphical complete! ${filledParagraphs.length} paragraphs analyzed. ` +
        `Confidence: ${confidence}%`
      );
      navigate('/');
    } catch (err) {
      // Extraction failed — still mark paragraphs as completed (data is saved)
      // but don't set extraction. User can retry from dashboard.
      const message = err instanceof Error ? err.message : 'Extraction failed';
      console.error('[Paragraphical] Gemini extraction failed:', message);
      toast.error(`Paragraphs saved, but AI analysis failed: ${message}. You can retry from the dashboard.`);
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  }, [saveCurrent, dispatch, session, draft, activeId, activeDef.heading, navigate]);

  // Back to dashboard
  const handleBack = useCallback(() => {
    saveCurrent();
    navigate('/');
  }, [saveCurrent, navigate]);

  // Check if a paragraph has content
  const hasContent = (id: number) => {
    if (id === activeId) return draft.trim().length > 0;
    return getSavedContent(id).trim().length > 0;
  };

  return (
    <div className="para-flow">
      <Header />

      <div className="para-flow__layout container">
        {/* Sidebar — section/paragraph navigation */}
        <aside className="para-flow__sidebar">
          <button className="para-flow__back-btn" onClick={handleBack} type="button">
            ← Back to Dashboard
          </button>

          <div className="para-flow__progress">
            <div className="para-flow__progress-bar">
              <div
                className="para-flow__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="para-flow__progress-label">
              {completedCount}/{PARAGRAPH_COUNT} paragraphs
            </span>
          </div>

          <nav className="para-flow__nav">
            {PARAGRAPH_SECTIONS.map(section => (
              <div key={section.name} className="para-flow__section">
                <h3 className="para-flow__section-title">{section.name}</h3>
                <ul className="para-flow__section-list">
                  {section.ids.map(id => {
                    const def = PARAGRAPH_DEFS.find(p => p.id === id)!;
                    const isActive = id === activeId;
                    const done = hasContent(id);
                    return (
                      <li key={id}>
                        <button
                          className={`para-flow__nav-item ${isActive ? 'para-flow__nav-item--active' : ''} ${done ? 'para-flow__nav-item--done' : ''}`}
                          onClick={() => goTo(id)}
                          type="button"
                        >
                          <span className="para-flow__nav-dot" />
                          <span className="para-flow__nav-label">
                            P{id}: {def.heading}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main writing area */}
        <main className="para-flow__main">
          <div className="para-flow__header">
            <span className="para-flow__counter">
              Paragraph {activeId} of {PARAGRAPH_COUNT}
            </span>
            <span className="para-flow__section-badge">{activeDef.section}</span>
          </div>

          <h2 className="para-flow__heading">{activeDef.heading}</h2>
          <p className="para-flow__prompt">{activeDef.prompt}</p>

          <textarea
            ref={textareaRef}
            className="para-flow__textarea glass"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={activeDef.placeholder}
            rows={8}
            aria-label={`Paragraph ${activeId}: ${activeDef.heading}`}
          />

          {/* Status bar: quality progress + word count — below the text screen */}
          <QualityBar paragraphId={activeId} text={draft} coveredTargets={tutor.coveredTargets} />

          <div className="para-flow__actions">
            <button
              className="para-flow__btn para-flow__btn--secondary"
              onClick={handlePrev}
              disabled={activeId === 1}
              type="button"
            >
              ← Previous
            </button>

            {activeId < PARAGRAPH_COUNT ? (
              <button
                className="para-flow__btn para-flow__btn--primary"
                onClick={handleNext}
                type="button"
              >
                Next →
              </button>
            ) : (
              <button
                className="para-flow__btn para-flow__btn--submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Analyzing with AI...' : 'Submit Paragraphical'}
              </button>
            )}
          </div>

          {/* Globe region reminder */}
          {session.globe && (
            <div className="para-flow__globe-reminder">
              📍 Dream region: <strong>{session.globe.region}</strong>
            </div>
          )}
        </main>
      </div>

      {/* Olivia Tutor bubble — shows interjections during writing */}
      <OliviaBubble
        interjection={tutor.interjection}
        pendingCount={tutor.pendingCount}
        onDismiss={tutor.dismiss}
        onDismissAll={tutor.dismissAll}
      />
    </div>
  );
}
