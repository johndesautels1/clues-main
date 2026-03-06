/**
 * PrivacyPolicyModal — Full privacy policy adapted for CLUES Intelligence main app.
 * Adapted from LifeScore Comparison Reports privacy policy.
 */

import { useEffect, useRef } from 'react';
import './PrivacyPolicyModal.css';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
      aria-label="Privacy Policy"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Privacy Policy</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close privacy policy"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <p className="privacy-modal__effective">Effective Date: January 23, 2026</p>

          <section className="privacy-modal__section">
            <h3>1. Introduction</h3>
            <p>
              Clues Intelligence LTD (&ldquo;CLUES,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our CLUES Intelligence platform, including the Paragraphical Discovery Questionnaire, AI-powered relocation reports, Clues Intelligence evaluations, SMART city assessments, and all related services.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>2. Information We Collect</h3>

            <h4>Account Information</h4>
            <p>Email address, name, and password (hashed) for account creation and authentication.</p>

            <h4>Discovery &amp; Relocation Data</h4>
            <p>Your Paragraphical responses (30 paragraphs), globe region selections, saved reports, module completions, metric extractions, and location preferences to provide the service.</p>

            <h4>AI Conversations</h4>
            <p>Your conversations with Olivia AI relocation advisor and Emilia AI assistant to provide personalized guidance and recommendations.</p>

            <h4>Automatically Collected</h4>
            <p>Usage data, device information, and cookies for service improvement and security.</p>
          </section>

          <section className="privacy-modal__section">
            <h3>3. How We Use Your Information</h3>
            <ul>
              <li>Provide and improve the Service</li>
              <li>Process payments via Stripe</li>
              <li>Send service communications</li>
              <li>Generate AI-powered relocation intelligence reports</li>
              <li>Extract metrics and produce SMART city assessments</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>4. AI Processing</h3>
            <p>
              We use multiple AI providers (OpenAI, Anthropic, Google, xAI, Perplexity) to evaluate relocation recommendations, extract metrics from your Paragraphical responses, and generate personalized reports. AI conversations may be used by providers to improve their models. We recommend not sharing sensitive personal information in AI conversations.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>5. Data Sharing</h3>
            <p>
              We do not sell your personal data. We share data with service providers (Supabase, Vercel, Stripe, AI providers) only as necessary to provide the Service.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>6. Your Rights</h3>

            <h4>UK/EU Residents (GDPR)</h4>
            <p>Access, rectification, erasure, portability, restriction, and objection rights.</p>

            <h4>California Residents (CCPA/CPRA)</h4>
            <ul>
              <li>Right to Know what personal information we collect and how it&rsquo;s used</li>
              <li>Right to Delete your personal information</li>
              <li>Right to Correct inaccurate personal information</li>
              <li>Right to Opt-Out of the sale or sharing of personal information</li>
              <li>Right to Non-Discrimination for exercising your rights</li>
            </ul>
            <p>
              We do not sell your personal information. To opt out of sharing, click &ldquo;Do Not Sell or Share My Personal Information&rdquo; in the site footer.
            </p>
            <p>
              Exercise other rights via Account Settings or email <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>.
            </p>

            <h4>Virginia, Colorado, Connecticut &amp; Utah Residents</h4>
            <p>
              You have similar rights under your state&rsquo;s privacy law, including the right to access, correct, delete, and opt out of the sale of your personal data and targeted advertising. See our US State Privacy Rights page for full details, or contact <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>7. Data Retention</h3>
            <p>
              Account data is retained until deletion + 30 days. Financial records are kept 7 years for legal compliance. Server logs are retained 90 days.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>8. Security</h3>
            <p>
              We implement encryption in transit (TLS/HTTPS), encryption at rest, access controls, and regular security assessments.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>9. Contact</h3>
            <p>
              Email: <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>
            </p>
            <p>
              Supervisory Authority: UK Information Commissioner&rsquo;s Office (<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="privacy-modal__link">ico.org.uk</a>)
            </p>
          </section>

          <p className="privacy-modal__version">Document Version 1.0</p>
        </div>
      </div>
    </div>
  );
}
