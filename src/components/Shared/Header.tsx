/**
 * Dashboard Header
 * Brand logo + navigation shell + admin cost tracking toggle
 */

import { useState } from 'react';
import { CostTrackingModal } from './CostTrackingModal';
import './Header.css';

/** Admin mode: check for ?admin=true in URL or env flag */
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

export function Header() {
  const [showCosts, setShowCosts] = useState(false);
  const isAdmin = isAdminMode();

  return (
    <>
      <header className="header glass">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <div className="header__inner container">
          <div className="header__brand">
            <span className="header__logo-icon">{'\u{1F30D}'}</span>
            <div>
              <h1 className="header__title">CLUES Intelligence</h1>
              <span className="header__tagline">Find Your Place in the World</span>
            </div>
          </div>

          <nav className="header__nav" aria-label="Main navigation">
            <button className="header__nav-btn header__nav-btn--active">Dashboard</button>
            <button className="header__nav-btn">Results</button>
            <button className="header__nav-btn">Reports</button>
            {isAdmin && (
              <button
                className="header__nav-btn header__nav-btn--icon"
                aria-label="Cost Tracking"
                title="Cost Tracking (Admin)"
                onClick={() => setShowCosts(true)}
              >
                {'\u{1F4B0}'}
              </button>
            )}
            <button className="header__nav-btn header__nav-btn--icon" aria-label="Settings">
              {'\u2699\uFE0F'}
            </button>
          </nav>
        </div>
      </header>

      <CostTrackingModal isOpen={showCosts} onClose={() => setShowCosts(false)} />
    </>
  );
}
