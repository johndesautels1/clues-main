/**
 * Emilia Chat Bubble - Bottom Left
 * Backend knowledge base / help & docs
 * Clicking opens a help panel with categories.
 * Admin users see "Cost Tracking" in the System category.
 */

import { useState } from 'react';
import { CostTrackingModal } from './CostTrackingModal';
import './ChatBubble.css';
import './EmiliaPanel.css';

function isAdminMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'true') return true;
  try {
    return localStorage.getItem('clues_admin') === 'true';
  } catch {
    return false;
  }
}

interface HelpCategory {
  icon: string;
  label: string;
  description: string;
  action?: () => void;
  adminOnly?: boolean;
}

export function EmiliaBubble() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const isAdmin = isAdminMode();

  const categories: HelpCategory[] = [
    {
      icon: '\u{1F30D}',
      label: 'Getting Started',
      description: 'How CLUES works and what to expect',
    },
    {
      icon: '\u{270D}\uFE0F',
      label: 'Paragraphical',
      description: 'Tips for writing your 27 paragraphs',
    },
    {
      icon: '\u{1F4CB}',
      label: 'Main Module',
      description: 'Demographics, DNWs, Must-Haves, General Questions',
    },
    {
      icon: '\u{1F4CA}',
      label: 'Reports & Results',
      description: 'Understanding your confidence score and recommendations',
    },
    {
      icon: '\u{1F4B0}',
      label: 'Cost Tracking',
      description: 'View API costs, provider breakdown, and profitability',
      action: () => {
        setPanelOpen(false);
        setShowCosts(true);
      },
      adminOnly: true,
    },
    {
      icon: '\u2699\uFE0F',
      label: 'System Status',
      description: 'Pipeline health, LLM availability, database sync',
      adminOnly: true,
    },
  ];

  const visibleCategories = categories.filter(c => !c.adminOnly || isAdmin);

  return (
    <>
      <button
        className="chat-bubble chat-bubble--emilia"
        aria-label="Chat with Emilia for help and documentation"
        title="Help & Docs"
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <div className="chat-bubble__icon">{panelOpen ? '\u2715' : '\u{1F4AC}'}</div>
        <div className="chat-bubble__pulse" />
      </button>

      {panelOpen && (
        <div className="emilia-panel glass-heavy" role="dialog" aria-label="Help categories">
          <h3 className="emilia-panel__title">Ask Emilia</h3>
          <p className="emilia-panel__subtitle">What can I help you with?</p>
          <div className="emilia-panel__categories">
            {visibleCategories.map(cat => (
              <button
                key={cat.label}
                className="emilia-panel__category"
                onClick={cat.action}
              >
                <span className="emilia-panel__category-icon">{cat.icon}</span>
                <div>
                  <span className="emilia-panel__category-label">{cat.label}</span>
                  <span className="emilia-panel__category-desc">{cat.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <CostTrackingModal isOpen={showCosts} onClose={() => setShowCosts(false)} />
    </>
  );
}
