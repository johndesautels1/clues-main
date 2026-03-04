/**
 * Olivia Chat Bubble - Bottom Right
 * Company concierge - avatar + expandable chat
 * Placeholder for now, full implementation later
 */

import './ChatBubble.css';

export function OliviaBubble() {
  return (
    <button
      className="chat-bubble chat-bubble--olivia"
      aria-label="Chat with Olivia, your CLUES concierge"
      title="Chat with Olivia"
    >
      <div className="chat-bubble__avatar">O</div>
      <div className="chat-bubble__pulse" />
    </button>
  );
}
