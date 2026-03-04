/**
 * Login / Sign-Up Page
 * Glassmorphic auth form matching the CLUES design system.
 * Supports: Email+Password, Google OAuth, anonymous continue.
 *
 * Pattern: cloned from LifeScore's auth card with CLUES branding.
 * WCAG 2.1 AA: all text ≥ 4.5:1 contrast, inputs ≥ 3:1, focus rings.
 */

import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

type AuthMode = 'login' | 'signup' | 'forgot';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, resetPassword, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isValid = mode === 'forgot'
    ? email.trim().length > 0
    : email.trim().length > 0 && password.length >= 6;

  // ── Form Submit ──
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          toast.error(error);
        } else {
          toast.success('Password reset email sent. Check your inbox.');
          setMode('login');
        }
        return;
      }

      if (mode === 'signup') {
        const { error } = await signUp(email.trim(), password, displayName.trim() || undefined);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Account created! Check your email to confirm.');
          setMode('login');
        }
        return;
      }

      // Login
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, email, password, displayName, isValid, isSubmitting, signIn, signUp, resetPassword, navigate]);

  // ── Google OAuth ──
  const handleGoogle = useCallback(async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
  }, [signInWithGoogle]);

  // ── Skip (anonymous) ──
  const handleSkip = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-page__loading">
          <div className="login-page__spinner" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Background orbs — same as dashboard body::before */}
      <div className="login-page__bg" aria-hidden="true" />

      <main className="login-page__card glass-heavy">
        {/* Logo */}
        <div className="login-page__brand">
          <span className="login-page__logo-icon">{'\u{1F30D}'}</span>
          <h1 className="login-page__title">CLUES Intelligence</h1>
          <p className="login-page__tagline">Find Your Place in the World</p>
        </div>

        {/* Mode title */}
        <h2 className="login-page__mode-title">
          {mode === 'login' && 'Welcome Back'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>

        {/* Form */}
        <form className="login-page__form" onSubmit={handleSubmit} noValidate>
          {/* Display name (signup only) */}
          {mode === 'signup' && (
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="auth-name">
                Display Name
              </label>
              <input
                id="auth-name"
                className="login-page__input glass"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How should we address you?"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="login-page__field">
            <label className="login-page__label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              className="login-page__input glass"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password (not for forgot mode) */}
          {mode !== 'forgot' && (
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="auth-password">
                Password
              </label>
              <div className="login-page__password-wrap">
                <input
                  id="auth-password"
                  className="login-page__input glass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="login-page__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '\u{1F441}' : '\u{1F441}\u200D\u{1F5E8}'}
                </button>
              </div>
              {mode === 'login' && (
                <button
                  type="button"
                  className="login-page__forgot-link"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="login-page__submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <span className="login-page__submit-loading">Processing...</span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="login-page__divider">
              <span>or</span>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="login-page__oauth-btn"
              onClick={handleGoogle}
            >
              <svg className="login-page__google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {/* Mode switch */}
        <div className="login-page__switch">
          {mode === 'login' && (
            <p>
              Don&apos;t have an account?{' '}
              <button type="button" className="login-page__switch-btn" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button type="button" className="login-page__switch-btn" onClick={() => setMode('login')}>
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              Remembered it?{' '}
              <button type="button" className="login-page__switch-btn" onClick={() => setMode('login')}>
                Back to sign in
              </button>
            </p>
          )}
        </div>

        {/* Anonymous skip */}
        <button
          type="button"
          className="login-page__skip"
          onClick={handleSkip}
        >
          Continue without an account
        </button>
      </main>
    </div>
  );
}
