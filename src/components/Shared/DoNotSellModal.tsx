/**
 * DoNotSellModal — CCPA/CPRA "Do Not Sell or Share" page for CLUES Intelligence.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef, useState } from 'react';
import './PrivacyPolicyModal.css';

interface DoNotSellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DoNotSellModal({ isOpen, onClose }: DoNotSellModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('clues_do_not_sell');
    setOptedOut(stored === 'true');
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

  const handleOptOut = () => {
    localStorage.setItem('clues_do_not_sell', 'true');
    setOptedOut(true);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="privacy-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Do Not Sell or Share My Personal Information"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Do Not Sell or Share My Personal Information</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <p className="privacy-modal__effective">Effective Date: February 28, 2026</p>

          <section className="privacy-modal__section">
            <h3>Your Rights Under California Law</h3>
            <p>
              Under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), California residents have the right to opt out of the sale or sharing of their personal information.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Our Data Practices</h3>
            <p>
              Clues Intelligence LTD does not sell your personal information. We do not exchange your personal data for monetary or other valuable consideration.
            </p>
            <p>
              We may share limited data with service providers (such as AI providers, hosting, and payment processing) strictly to operate the Service. Under CCPA definitions, some of this sharing for cross-context behavioral advertising could be considered &ldquo;sharing&rdquo; even without a sale.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Categories of Personal Information</h3>
            <table className="privacy-modal__table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Collected</th>
                  <th>Sold</th>
                  <th>Shared</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Identifiers (name, email)</td>
                  <td>Yes</td>
                  <td>No</td>
                  <td>Service providers only</td>
                </tr>
                <tr>
                  <td>Internet activity (usage data)</td>
                  <td>Yes</td>
                  <td>No</td>
                  <td>Analytics (with consent)</td>
                </tr>
                <tr>
                  <td>Geolocation (city-level only)</td>
                  <td>No</td>
                  <td>No</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Professional information</td>
                  <td>No</td>
                  <td>No</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Sensitive personal information</td>
                  <td>No</td>
                  <td>No</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>AI conversation content</td>
                  <td>Yes</td>
                  <td>No</td>
                  <td>AI providers (for responses)</td>
                </tr>
                <tr>
                  <td>Payment information</td>
                  <td>Via Stripe</td>
                  <td>No</td>
                  <td>Stripe only</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="privacy-modal__section">
            <h3>Opt-Out of Sale and Sharing</h3>
            <p>
              Even though we do not currently sell your data, you may submit an opt-out request below. This ensures that if our practices ever change, your preference is already recorded and will be honored immediately.
            </p>
            {optedOut ? (
              <p style={{ color: 'var(--score-green)', fontWeight: 600 }}>
                You have opted out of the sale or sharing of your personal information.
              </p>
            ) : (
              <>
                <p>You have not opted out.</p>
                <p>Click below to opt out of the sale or sharing of your personal information.</p>
                <button
                  type="button"
                  className="privacy-modal__opt-out-btn"
                  onClick={handleOptOut}
                >
                  Do Not Sell or Share My Personal Information
                </button>
              </>
            )}
          </section>

          <section className="privacy-modal__section">
            <h3>Your Additional CCPA/CPRA Rights</h3>
            <ul>
              <li><strong>Right to Know:</strong> Request what personal information we collect, use, and disclose</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information (Account Settings)</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale or sharing of personal information (this page)</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> We do not collect sensitive personal information</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>How to Submit a Request</h3>
            <ul>
              <li><strong>Opt-Out:</strong> Use the button above or email <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a></li>
              <li><strong>Data Access/Deletion:</strong> Account Settings or email <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a></li>
              <li><strong>Authorized Agent:</strong> An authorized agent may submit a request on your behalf with written permission</li>
            </ul>
            <p>We will verify your identity before processing requests. We respond to all verified requests within 45 days.</p>
          </section>

          <section className="privacy-modal__section">
            <h3>Contact for Privacy Inquiries</h3>
            <p>
              Email: <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>
            </p>
            <p>
              Clues Intelligence LTD<br />
              167-169 Great Portland Street, 5th Floor<br />
              London W1W 5PF, United Kingdom
            </p>
          </section>

          <p className="privacy-modal__version">
            Document Version 1.0<br />
            Clues Intelligence LTD &bull; United Kingdom
          </p>
        </div>
      </div>
    </div>
  );
}
