/**
 * ProtectedRoute
 * Wraps routes that require authentication.
 *
 * Behavior:
 *   - If auth is loading: show a spinner
 *   - If not authenticated: redirect to /login
 *   - If authenticated: render the children
 *
 * Optional: set `allowAnonymous` to true to let unauthenticated users through
 * (e.g., the dashboard is accessible without login, but data won't persist
 * to their account until they sign in).
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If true, unauthenticated users can still view the page */
  allowAnonymous?: boolean;
}

export function ProtectedRoute({ children, allowAnonymous = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-page__loading">
          <div className="login-page__spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !allowAnonymous) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
