/**
 * Site Footer
 * Matches freestanding modular apps footer layout:
 * 3-column: Company Info | Contact & Services | Proprietary Technology
 * + copyright bar + legal links + trademark line
 * Privacy link opens PrivacyPolicyModal.
 */

import { useState } from 'react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';
import { CookiePolicyModal } from './CookiePolicyModal';
import { RefundPolicyModal } from './RefundPolicyModal';
import './Footer.css';

const LEGAL_LINKS = [
  'Privacy',
  'Terms',
  'Cookies',
  'Acceptable Use',
  'Refunds',
  'Do Not Sell or Share My Personal Information',
  'US State Privacy Rights',
  'Cookie Settings',
];

export function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showRefunds, setShowRefunds] = useState(false);

  const handleLegalClick = (link: string) => {
    if (link === 'Privacy') setShowPrivacy(true);
    if (link === 'Terms') setShowTerms(true);
    if (link === 'Cookies') setShowCookies(true);
    if (link === 'Refunds') setShowRefunds(true);
  };

  return (
    <>
      <footer className="footer" role="contentinfo">
        <div className="footer__inner container">
          {/* Column 1: Company Information */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Company Information</h3>
            <p className="footer__company-name">Clues Intelligence LTD</p>
            <p className="footer__tagline">AI-Powered Global Relocation Intelligence</p>
            <p className="footer__detail">Founded by John E. Desautels II</p>
            <p className="footer__detail">35+ Years Real Estate Experience</p>
          </div>

          {/* Column 2: Contact & Services */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Contact &amp; Services</h3>
            <ul className="footer__contact-list">
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u{1F4DE}'}</span>
                <a href="tel:+17274523506" className="footer__link">(727) 452-3506</a>
              </li>
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u2709\uFE0F'}</span>
                <a href="mailto:cluesnomads@gmail.com" className="footer__link">cluesnomads@gmail.com</a>
              </li>
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u2709\uFE0F'}</span>
                <a href="mailto:brokerpinellas@gmail.com" className="footer__link">brokerpinellas@gmail.com</a>
              </li>
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u{1F310}'}</span>
                <a href="https://cluesnomad.com" target="_blank" rel="noopener noreferrer" className="footer__link">cluesnomad.com</a>
              </li>
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u{1F4FA}'}</span>
                <span className="footer__text">YouTube: @modernlodgesf</span>
              </li>
              <li>
                <span className="footer__contact-icon" aria-hidden="true">{'\u{1F4F1}'}</span>
                <span className="footer__text">Facebook</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Proprietary Technology */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Proprietary Technology</h3>
            <div className="footer__tech-list">
              <div className="footer__tech-item">
                <span className="footer__tech-name">CLUES</span>
                <span className="footer__tech-desc">Comprehensive Location Utility &amp; Evaluation System</span>
              </div>
              <div className="footer__tech-item">
                <span className="footer__tech-name">SMART</span>
                <span className="footer__tech-desc">Strategic Market Assessment &amp; Rating Technology</span>
              </div>
              <div className="footer__tech-item">
                <span className="footer__tech-name">Clues Intelligence</span>
                <span className="footer__tech-desc">AI-Powered Global Relocation Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="footer__copyright-bar">
          <div className="footer__copyright-inner container">
            <p className="footer__copyright">
              &copy; 2026 Clues Intelligence LTD. All rights reserved.
            </p>

            {/* Legal links */}
            <nav className="footer__legal" aria-label="Legal links">
              {LEGAL_LINKS.map((link, i) => (
                <span key={link}>
                  <button
                    type="button"
                    className="footer__legal-link"
                    onClick={() => handleLegalClick(link)}
                  >
                    {link}
                  </button>
                  {i < LEGAL_LINKS.length - 1 && (
                    <span className="footer__legal-sep" aria-hidden="true">|</span>
                  )}
                </span>
              ))}
            </nav>

            <p className="footer__trademark">
              CLUES, SMART, and Clues Intelligence are trademarks of Clues Intelligence LTD
            </p>
            <p className="footer__sub-tagline">
              AI-Powered Global Relocation Intelligence Platform
            </p>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <CookiePolicyModal isOpen={showCookies} onClose={() => setShowCookies(false)} />
      <RefundPolicyModal isOpen={showRefunds} onClose={() => setShowRefunds(false)} />
    </>
  );
}
