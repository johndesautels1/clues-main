/**
 * Auth Context
 * Wraps Supabase Auth and provides:
 *   - user state (logged in / anonymous)
 *   - login / signup / logout actions
 *   - auth loading state
 *   - auto-link session to user on login
 *
 * Pattern cloned from LifeScore's auth flow:
 *   - Email + password (primary)
 *   - Google OAuth (secondary)
 *   - Anonymous fallback (no login required to start)
 *
 * Sits OUTSIDE UserProvider in the component tree so auth
 * is available before session hydration begins.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AuthUser } from '../types';

// ─── Context Shape ──────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithGitHub: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Map Supabase user to our AuthUser ──────────────────────────
function mapSupabaseUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
}): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  const provider = (supabaseUser.app_metadata?.provider as string) ?? 'email';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: (meta.display_name as string) ?? (meta.full_name as string) ?? (meta.name as string) ?? undefined,
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? undefined,
    provider: provider === 'google' ? 'google' : provider === 'github' ? 'github' : 'email',
    createdAt: supabaseUser.created_at ?? new Date().toISOString(),
  };
}

// ─── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate: check current session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign Up ──
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { error: error.message };
    return {};
  }, []);

  // ── Sign In ──
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return {};
  }, []);

  // ── Google OAuth ──
  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) return { error: error.message };
    return {};
  }, []);

  // ── GitHub OAuth ──
  const signInWithGitHub = useCallback(async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) return { error: error.message };
    return {};
  }, []);

  // ── Sign Out ──
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ── Password Reset ──
  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) return { error: error.message };
    return {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
