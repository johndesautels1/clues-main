/**
 * CookiePolicyModal — Cookie Policy for CLUES Intelligence.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef } from 'react';
import './PrivacyPolicyModal.css';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CookiePolicyModal({ isOpen, onClose }: CookiePolicyModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="privacy-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Cookie Policy"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Cookie Policy</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close cookie policy"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <p className="privacy-modal__effective">Effective Date: January 23, 2026</p>

          <section className="privacy-modal__section">
            <h3>1. What Are Cookies?</h3>
            <p>
              Cookies are small text files stored on your device when you visit websites. They help remember preferences, understand usage, and improve your experience.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>2. Cookies We Use</h3>

            <h4>Essential Cookies (Always Active)</h4>
            <table className="privacy-modal__table">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>sb-*-auth-token</code></td>
                  <td>User authentication</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td><code>__vercel_live_token</code></td>
                  <td>Deployment verification</td>
                  <td>Session</td>
                </tr>
              </tbody>
            </table>

            <h4>Functional Cookies</h4>
            <table className="privacy-modal__table">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>theme</code></td>
                  <td>Light/dark mode preference</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td><code>cookieConsent</code></td>
                  <td>Remember cookie choices</td>
                  <td>1 year</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="privacy-modal__section">
            <h3>3. Third-Party Cookies</h3>
            <p>
              Some features may set cookies from Supabase (authentication), Vercel (hosting), and Stripe (payments). We do not control third-party cookies.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>4. Managing Cookies</h3>
            <p>
              Use the &ldquo;Cookie Settings&rdquo; link in the footer to change preferences. You can also control cookies through your browser settings.
            </p>
            <p>
              <strong>Note:</strong> Blocking essential cookies may prevent the Service from working correctly.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>5. Local Storage</h3>
            <p>
              We use browser local storage for saved comparisons, recent cities, and UI preferences. This data stays on your device.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>6. Contact</h3>
            <p>
              Email: <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>
            </p>
          </section>

          <p className="privacy-modal__version">Document Version 1.0</p>
        </div>
      </div>
    </div>
  );
}
