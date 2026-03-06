/**
 * RefundPolicyModal — Refund Policy for CLUES Intelligence.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef } from 'react';
import './PrivacyPolicyModal.css';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefundPolicyModal({ isOpen, onClose }: RefundPolicyModalProps) {
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
      aria-label="Refund Policy"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Refund Policy</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close refund policy"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          <section className="privacy-modal__section">
            <h3>1. Subscription Refunds</h3>

            <h4>Monthly Subscriptions</h4>
            <ul>
              <li>Cancel anytime &mdash; no refund for current month</li>
              <li>Access continues until period ends</li>
              <li>Billing errors are fully refunded</li>
            </ul>

            <h4>Annual Subscriptions</h4>
            <ul>
              <li>Cancel within 14 days &mdash; full refund (minus reports generated)</li>
              <li>Cancel after 14 days &mdash; no refund, access continues</li>
              <li>Billing errors are fully refunded</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>2. Report Purchase Refunds</h3>
            <p>
              No refunds after report generation. Once generated, AI processing costs are incurred and the report is immediately available.
            </p>

            <h4>Exceptions</h4>
            <ul>
              <li>Failed generation due to our error &mdash; automatic credit or refund</li>
              <li>Significant errors &mdash; contact support within 7 days</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>3. How to Request a Refund</h3>
            <p>
              <strong>Self-Service:</strong> Account Settings &rarr; Billing &rarr; Request Refund
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>
            </p>

            <h4>Processing Time</h4>
            <table className="privacy-modal__table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Response</th>
                  <th>Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Self-service</td>
                  <td>Immediate</td>
                  <td>5&ndash;10 business days</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>2 business days</td>
                  <td>5&ndash;10 business days</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="privacy-modal__section">
            <h3>4. Non-Refundable Items</h3>
            <ul>
              <li>Reports already generated</li>
              <li>Subscriptions cancelled after refund window</li>
              <li>Accounts terminated for policy violations</li>
              <li>Promotional or discounted purchases</li>
            </ul>
          </section>

          <section className="privacy-modal__section">
            <h3>5. Contact</h3>
            <p>
              Email: <a href="mailto:cluesnomads@gmail.com" className="privacy-modal__link">cluesnomads@gmail.com</a>
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
