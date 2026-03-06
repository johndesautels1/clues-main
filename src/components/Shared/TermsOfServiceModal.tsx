/**
 * TermsOfServiceModal — Terms of Service for CLUES Intelligence.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef } from 'react';
import './PrivacyPolicyModal.css';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
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
      aria-label="Terms of Service"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Terms of Service</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close terms of service"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <p className="privacy-modal__effective">Effective Date: January 23, 2026</p>

          <section className="privacy-modal__section">
            <h3>1. Agreement to Terms</h3>
            <p>
              By using CLUES Comparison Reports services (&ldquo;Service&rdquo;), including Clues Intelligence, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>2. Description of Service</h3>
            <p>
              CLUES Comparison Reports uses AI to compare cities across various metrics. Features include city comparisons, AI-powered analysis, visual report generation, and the Olivia AI assistant.
            </p>
            <p>
              <strong>Important:</strong> Reports are informational only. They do not constitute legal, financial, immigration, or professional advice. Always consult qualified professionals for important decisions.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>3. User Accounts</h3>
            <ul>
              <li>You must be at least 16 years old</li>
              <li>Provide accurate information</li>
              <li>Maintain password security</li>
              <li>Accept responsibility for account activity</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>4. Acceptable Use</h3>
            <p>You may: Use reports for personal/business decisions, share with colleagues, quote with attribution.</p>
            <p>You may NOT: Resell reports, scrape data, reverse-engineer AI systems, use for illegal purposes.</p>
          </section>

          <section className="privacy-modal__section">
            <h3>5. Intellectual Property</h3>
            <p>
              Clues owns the software, algorithms, and methodology. You own your generated reports and notes. You grant us license to store and improve the Service with anonymized data.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>6. AI Content Disclaimer</h3>
            <p>
              Reports are generated using AI which may produce inaccurate, incomplete, or outdated information. Results should be independently verified for important decisions.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>7. Limitation of Liability</h3>
            <p>
              The Service is provided &ldquo;AS IS.&rdquo; We are not liable for indirect, incidental, or consequential damages. Total liability is limited to amounts paid in the 12 months before the claim or &pound;100, whichever is greater.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>8. Governing Law</h3>
            <p>
              These Terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, except EU consumers may bring claims in their country of residence.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>9. Changes</h3>
            <p>
              We may modify these Terms at any time. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>10. Contact</h3>
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
