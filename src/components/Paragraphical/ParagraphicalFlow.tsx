/**
 * Paragraphical Flow
 * 24-paragraph biographical essay input.
 * Stepped interface: one paragraph at a time with sidebar progress.
 * Auto-saves each paragraph to UserContext (→ Supabase).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { PARAGRAPH_DEFS, PARAGRAPH_SECTIONS } from '../../data/paragraphs';
import { extractParagraphical } from '../../lib/api';
import { recalculateTier } from '../../lib/tierEngine';
import { Header } from '../Shared/Header';
import { OliviaBubble } from '../Shared/OliviaBubble';
import { useOliviaTutor } from '../../hooks/useOliviaTutor';
import './ParagraphicalFlow.css';

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
  const progress = Math.round((completedCount / 24) * 100);

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
    if (activeId < 24) {
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
              {completedCount}/24 paragraphs
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
              Paragraph {activeId} of 24
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

          <div className="para-flow__word-count">
            {draft.trim().split(/\s+/).filter(Boolean).length} words
          </div>

          <div className="para-flow__actions">
            <button
              className="para-flow__btn para-flow__btn--secondary"
              onClick={handlePrev}
              disabled={activeId === 1}
              type="button"
            >
              ← Previous
            </button>

            {activeId < 24 ? (
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
