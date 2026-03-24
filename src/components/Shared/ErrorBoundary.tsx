/**
 * ErrorBoundary — Catches render errors and shows a recovery UI
 * instead of unmounting the entire React tree (which exposes the raw body background).
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CLUES] Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: 'var(--text-secondary, #9ca3af)',
          fontFamily: 'var(--font-sans, sans-serif)',
          padding: '32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary, #f9fafb)' }}>
            Something went wrong
          </p>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--clues-sapphire, #2563eb)',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
