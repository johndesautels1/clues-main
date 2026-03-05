/**
 * Olivia Chat Bubble - Bottom Right
 * Company concierge - avatar + expandable interjection popover.
 *
 * When the Olivia Tutor (useOliviaTutor) has a suggestion during the
 * Paragraphical flow, it appears as a popover above the bubble.
 * User can dismiss ("Got it") or the bubble shows a badge count.
 */

import { useState, useEffect } from 'react';
import type { OliviaInterjection } from '../../hooks/useOliviaTutor';
import './ChatBubble.css';

interface OliviaBubbleProps {
  /** Current interjection from the tutor hook (null = nothing to show) */
  interjection?: OliviaInterjection | null;
  /** Number of pending suggestions */
  pendingCount?: number;
  /** Called when user dismisses the interjection */
  onDismiss?: () => void;
  /** Called when user dismisses all suggestions for this paragraph */
  onDismissAll?: () => void;
}

export function OliviaBubble({
  interjection = null,
  pendingCount = 0,
  onDismiss,
  onDismissAll,
}: OliviaBubbleProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // When a new interjection arrives, show the popover with animation
  useEffect(() => {
    if (interjection) {
      setShowPopover(true);
      // Trigger entrance animation on next frame
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
      // Wait for exit animation before hiding
      const timer = setTimeout(() => setShowPopover(false), 300);
      return () => clearTimeout(timer);
    }
  }, [interjection]);

  const handleDismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  const handleDismissAll = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onDismissAll?.();
    }, 200);
  };

  const handleBubbleClick = () => {
    if (interjection && !showPopover) {
      setShowPopover(true);
      requestAnimationFrame(() => setAnimateIn(true));
    }
  };

  const hasInterjection = interjection !== null;

  return (
    <div className="olivia-container">
      {/* Interjection popover */}
      {showPopover && interjection && (
        <div
          className={`olivia-popover glass ${animateIn ? 'olivia-popover--visible' : ''}`}
          role="alert"
          aria-live="polite"
        >
          <div className="olivia-popover__header">
            <span className="olivia-popover__name">Olivia</span>
            <span className="olivia-popover__topic">{interjection.targetLabel}</span>
          </div>
          <p className="olivia-popover__message">{interjection.message}</p>
          <div className="olivia-popover__actions">
            <button
              className="olivia-popover__btn olivia-popover__btn--dismiss"
              onClick={handleDismiss}
              type="button"
            >
              Got it
            </button>
            {pendingCount > 1 && (
              <button
                className="olivia-popover__btn olivia-popover__btn--dismiss-all"
                onClick={handleDismissAll}
                type="button"
              >
                Dismiss all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bubble */}
      <button
        className={`chat-bubble chat-bubble--olivia ${hasInterjection ? 'chat-bubble--has-suggestion' : ''}`}
        aria-label={hasInterjection
          ? `Olivia has ${pendingCount} suggestion${pendingCount !== 1 ? 's' : ''}`
          : 'Chat with Olivia, your CLUES concierge'}
        title={hasInterjection ? 'Olivia has a suggestion' : 'Chat with Olivia'}
        onClick={handleBubbleClick}
        type="button"
      >
        <div className="chat-bubble__avatar">O</div>
        <div className="chat-bubble__pulse" />

        {/* Badge count */}
        {pendingCount > 0 && (
          <span className="olivia-badge" aria-hidden="true">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
