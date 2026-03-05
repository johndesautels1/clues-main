/**
 * Dashboard Header
 * Brand logo + toolbar navigation matching freestanding modular apps
 * + auth state + admin cost tracking toggle
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface ToolbarItem {
  id: string;
  label: string;
  icon: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: 'compare',       label: 'Compare',        icon: '\u{1F4CA}' },
  { id: 'results',       label: 'Results',         icon: '\u{1F4CB}' },
  { id: 'judges-report', label: 'Judges Report',   icon: '\u{1F4C8}' },
  { id: 'visuals',       label: 'Visuals',         icon: '\u{1F3A8}' },
  { id: 'ask-olivia',    label: 'Ask Olivia',      icon: '\u{1F399}' },
  { id: 'saved',         label: 'Saved',           icon: '\u{1F4BE}' },
  { id: 'about',         label: 'About',           icon: '\u{2139}\uFE0F' },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showCosts, setShowCosts] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');
  const isAdmin = isAdminMode();

  // Notification count — placeholder for saved items / pending reports
  const notificationCount = 21;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    // Future: navigate to sub-routes or open modals per tab
  };

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <>
      <header className="header glass">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <div className="header__inner container">
          {/* Brand */}
          <div className="header__brand" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}>
            <span className="header__logo-icon">{'\u{1F30D}'}</span>
            <div>
              <h1 className="header__title">CLUES Intelligence</h1>
              <span className="header__tagline">Find Your Place in the World</span>
            </div>
          </div>

          {/* Toolbar Navigation */}
          <nav className="header__toolbar" aria-label="Main navigation">
            {TOOLBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`header__toolbar-btn${activeTab === item.id ? ' header__toolbar-btn--active' : ''}`}
                onClick={() => handleTabClick(item.id)}
                type="button"
              >
                <span className="header__toolbar-icon" aria-hidden="true">{item.icon}</span>
                <span className="header__toolbar-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side: notification badge + admin + auth */}
          <div className="header__actions">
            {/* Notification badge */}
            {notificationCount > 0 && (
              <button
                className="header__badge-btn"
                aria-label={`${notificationCount} notifications`}
                title={`${notificationCount} items`}
                type="button"
              >
                <span className="header__badge-count">{notificationCount}</span>
              </button>
            )}

            {isAdmin && (
              <button
                className="header__action-btn"
                aria-label="Cost Tracking"
                title="Cost Tracking (Admin)"
                onClick={() => setShowCosts(true)}
                type="button"
              >
                {'\u{1F4B0}'}
              </button>
            )}

            <button className="header__action-btn" aria-label="Settings" type="button">
              {'\u2699\uFE0F'}
            </button>

            {/* Auth state */}
            {isAuthenticated ? (
              <div className="header__auth">
                <span className="header__user-email" title={user?.email}>
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <button
                  className="header__action-btn header__action-btn--signout"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="header__action-btn header__action-btn--signin"
                onClick={() => navigate('/login')}
                type="button"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <CostTrackingModal isOpen={showCosts} onClose={() => setShowCosts(false)} />
    </>
  );
}
