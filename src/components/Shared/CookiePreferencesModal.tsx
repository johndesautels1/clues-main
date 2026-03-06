/**
 * CookiePreferencesModal — Cookie Settings / Preferences for CLUES Intelligence.
 * Lets users toggle cookie categories and persists choices to localStorage.
 * Reuses privacy-modal CSS classes for consistent styling.
 */

import { useEffect, useRef, useState } from 'react';
import './PrivacyPolicyModal.css';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookiePrefs {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'clues_cookie_prefs';

function loadPrefs(): CookiePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { functional: true, analytics: false, marketing: false };
}

function savePrefs(prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function CookiePreferencesModal({ isOpen, onClose }: CookiePreferencesModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState<CookiePrefs>(loadPrefs);

  useEffect(() => {
    if (!isOpen) return;
    setPrefs(loadPrefs());
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

  const handleSave = () => {
    savePrefs(prefs);
    onClose();
  };

  const handleRejectAll = () => {
    const rejected: CookiePrefs = { functional: false, analytics: false, marketing: false };
    savePrefs(rejected);
    setPrefs(rejected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="privacy-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Cookie Preferences"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="privacy-modal__container cookie-prefs__container">
        {/* Header */}
        <div className="privacy-modal__header">
          <h2 className="privacy-modal__title">Cookie Preferences</h2>
          <button
            className="privacy-modal__close"
            onClick={onClose}
            aria-label="Close cookie preferences"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="privacy-modal__body">
          {/* Essential — always on */}
          <div className="cookie-prefs__row">
            <div className="cookie-prefs__info">
              <h3 className="cookie-prefs__category">Essential Cookies</h3>
              <p className="cookie-prefs__desc">
                Required for authentication and core functionality. Cannot be disabled.
              </p>
            </div>
            <span className="cookie-prefs__always-on">Always On</span>
          </div>

          {/* Functional */}
          <div className="cookie-prefs__row">
            <div className="cookie-prefs__info">
              <h3 className="cookie-prefs__category">Functional Cookies</h3>
              <p className="cookie-prefs__desc">
                Remember your preferences like theme and language settings.
              </p>
            </div>
            <label className="cookie-prefs__toggle" aria-label="Toggle functional cookies">
              <input
                type="checkbox"
                checked={prefs.functional}
                onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
              />
              <span className="cookie-prefs__slider" />
            </label>
          </div>

          {/* Analytics */}
          <div className="cookie-prefs__row">
            <div className="cookie-prefs__info">
              <h3 className="cookie-prefs__category">Analytics Cookies</h3>
              <p className="cookie-prefs__desc">
                Help us understand how you use the service to improve it.
              </p>
            </div>
            <label className="cookie-prefs__toggle" aria-label="Toggle analytics cookies">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
              />
              <span className="cookie-prefs__slider" />
            </label>
          </div>

          {/* Marketing */}
          <div className="cookie-prefs__row">
            <div className="cookie-prefs__info">
              <h3 className="cookie-prefs__category">Marketing Cookies</h3>
              <p className="cookie-prefs__desc">
                Used for targeted advertising. We currently do not use these.
              </p>
            </div>
            <label className="cookie-prefs__toggle" aria-label="Toggle marketing cookies">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
              />
              <span className="cookie-prefs__slider" />
            </label>
          </div>

          {/* Action buttons */}
          <div className="cookie-prefs__actions">
            <button
              type="button"
              className="cookie-prefs__btn cookie-prefs__btn--reject"
              onClick={handleRejectAll}
            >
              Reject All
            </button>
            <button
              type="button"
              className="cookie-prefs__btn cookie-prefs__btn--save"
              onClick={handleSave}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
