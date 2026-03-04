/**
 * Emilia Chat Bubble - Bottom Left
 * Backend knowledge base - icon only, no avatar
 * Placeholder for now, full implementation later
 */

import './ChatBubble.css';

export function EmiliaBubble() {
  return (
    <button
      className="chat-bubble chat-bubble--emilia"
      aria-label="Chat with Emilia for help and documentation"
      title="Help & Docs"
    >
      <div className="chat-bubble__icon">{'\u{1F4AC}'}</div>
      <div className="chat-bubble__pulse" />
    </button>
  );
}
