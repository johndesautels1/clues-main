/**
 * Dashboard Header
 * Brand logo + navigation shell
 */

import './Header.css';

export function Header() {
  return (
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
          <button className="header__nav-btn header__nav-btn--icon" aria-label="Settings">
            {'\u2699\uFE0F'}
          </button>
        </nav>
      </div>
    </header>
  );
}
