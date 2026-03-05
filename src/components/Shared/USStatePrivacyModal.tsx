/**
 * USStatePrivacyModal — US State Privacy Rights for CLUES Intelligence.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef } from 'react';
import './PrivacyPolicyModal.css';

interface USStatePrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function USStatePrivacyModal({ isOpen, onClose }: USStatePrivacyModalProps) {
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

  const rightsTable = (rows: [string, string][]) => (
    <table className="privacy-modal__table">
      <thead>
        <tr>
          <th>Right</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([right, desc]) => (
          <tr key={right}>
            <td><strong>{right}</strong></td>
            <td>{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div
      ref={overlayRef}
      className="privacy-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="US State Privacy Rights"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">US State Privacy Rights</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close US state privacy rights"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <p className="privacy-modal__effective">Effective Date: February 28, 2026</p>

          <section className="privacy-modal__section">
            <h3>Your Privacy Rights by State</h3>
            <p>
              In addition to our general Privacy Policy and California-specific rights (CCPA/CPRA), residents of the following US states have specific privacy rights under their state laws. Clues Intelligence LTD honors all applicable state privacy rights.
            </p>
            <p>
              We do not sell your personal data. We do not use your data for targeted advertising or profiling in furtherance of decisions that produce legal or similarly significant effects.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Virginia (VCDPA)</h3>
            <p>The Virginia Consumer Data Protection Act provides Virginia residents with the following rights:</p>
            {rightsTable([
              ['Access', 'Confirm whether we process your data and obtain a copy'],
              ['Correct', 'Correct inaccuracies in your personal data'],
              ['Delete', 'Request deletion of your personal data'],
              ['Data Portability', 'Obtain your data in a portable, readily usable format'],
              ['Opt Out', 'Opt out of targeted advertising, sale of data, or profiling'],
              ['Non-Discrimination', 'We will not discriminate against you for exercising rights'],
            ])}
            <p>
              <strong>Appeal:</strong> You may appeal any decision by emailing <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a> with subject line &ldquo;VCDPA Appeal.&rdquo; We will respond within 60 days.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Colorado (CPA)</h3>
            <p>The Colorado Privacy Act provides Colorado residents with the following rights:</p>
            {rightsTable([
              ['Access', 'Confirm whether we process your data and obtain a copy'],
              ['Correct', 'Correct inaccuracies in your personal data'],
              ['Delete', 'Request deletion of your personal data'],
              ['Data Portability', 'Obtain your data in a portable, readily usable format'],
              ['Opt Out', 'Opt out of targeted advertising, sale of data, or profiling'],
            ])}
            <p>
              <strong>Universal Opt-Out:</strong> We honor universal opt-out mechanisms (e.g., Global Privacy Control signals) as required by Colorado law.
            </p>
            <p>
              <strong>Appeal:</strong> You may appeal any decision by emailing <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a> with subject line &ldquo;CPA Appeal.&rdquo; If unsatisfied, contact the Colorado Attorney General.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Connecticut (CTDPA)</h3>
            <p>The Connecticut Data Privacy Act provides Connecticut residents with the following rights:</p>
            {rightsTable([
              ['Access', 'Confirm whether we process your data and obtain a copy'],
              ['Correct', 'Correct inaccuracies in your personal data'],
              ['Delete', 'Request deletion of your personal data'],
              ['Data Portability', 'Obtain your data in a portable, readily usable format'],
              ['Opt Out', 'Opt out of targeted advertising, sale of data, or profiling'],
            ])}
            <p>
              <strong>Appeal:</strong> You may appeal any decision by emailing <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a> with subject line &ldquo;CTDPA Appeal.&rdquo; We will respond within 60 days. If unsatisfied, contact the Connecticut Attorney General.
            </p>
          </section>

          <section className="privacy-modal__section">
            <h3>Utah (UCPA)</h3>
            <p>The Utah Consumer Privacy Act provides Utah residents with the following rights:</p>
            {rightsTable([
              ['Access', 'Confirm whether we process your data and obtain a copy'],
              ['Delete', 'Request deletion of data you provided to us'],
              ['Data Portability', 'Obtain your data in a portable, readily usable format'],
              ['Opt Out', 'Opt out of targeted advertising or sale of personal data'],
            ])}
          </section>

          <section className="privacy-modal__section">
            <h3>How to Exercise Your Rights</h3>
            <ul>
              <li><strong>Access / Download:</strong> Account Settings &gt; Download My Data</li>
              <li><strong>Correct:</strong> Account Settings &gt; Edit Profile</li>
              <li><strong>Delete:</strong> Account Settings &gt; Delete Account</li>
              <li><strong>Opt Out:</strong> Click &ldquo;Do Not Sell or Share My Personal Information&rdquo; in the site footer</li>
              <li><strong>Email:</strong> <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a></li>
            </ul>
            <p>We respond to all verified requests within 45 days.</p>
          </section>

          <section className="privacy-modal__section">
            <h3>Other States</h3>
            <p>
              Residents of other US states with applicable privacy laws have similar rights as described above. Contact <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a> to exercise your rights. We will process your request in accordance with the applicable law in your state of residence.
            </p>
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
