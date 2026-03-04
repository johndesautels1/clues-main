/**
 * Dashboard Header
 * Brand logo + navigation shell + auth state + admin cost tracking toggle
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showCosts, setShowCosts] = useState(false);
  const isAdmin = isAdminMode();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

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

            {/* Auth state */}
            {isAuthenticated ? (
              <div className="header__auth">
                <span className="header__user-email" title={user?.email}>
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  className="header__nav-btn header__nav-btn--signout"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="header__nav-btn header__nav-btn--signin"
                onClick={() => navigate('/login')}
                type="button"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <CostTrackingModal isOpen={showCosts} onClose={() => setShowCosts(false)} />
    </>
  );
}
