/**
 * useSessionPersistence
 * Three-layer persistence for user sessions:
 *   1. Supabase (primary) — globe data denormalized for LLM token savings
 *   2. localStorage (fallback) — works offline / before Supabase is configured
 *   3. In-memory (always) — UserContext state
 *
 * On mount: tries Supabase first, falls back to localStorage.
 * On change: debounced save to both Supabase AND localStorage.
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserSession } from '../types';

const STORAGE_KEY = 'clues_session';
const SAVE_DEBOUNCE_MS = 1500;

// ─── localStorage helpers ────────────────────────────────────
function saveToLocalStorage(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage might be full or disabled — fail silently
  }
}

function loadFromLocalStorage(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

// ─── Supabase helpers ────────────────────────────────────────
async function saveToSupabase(session: UserSession): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const completedParagraphs = session.paragraphical.paragraphs
    .filter(p => p.content.trim().length > 0).length;

  try {
    const { error } = await supabase.from('sessions').upsert({
      id: session.id,

      // Denormalized globe data — queryable without parsing JSON
      // This is what saves massive LLM tokens: the evaluation pipeline
      // can filter to region-specific cities before sending to 5 LLMs
      globe_region: session.globe?.region ?? null,
      globe_lat: session.globe?.lat ?? null,
      globe_lng: session.globe?.lng ?? null,
      globe_zoom: session.globe?.zoomLevel ?? null,

      // Denormalized completion tracking
      tier: session.currentTier,
      confidence: session.confidence,
      paragraphs_completed: completedParagraphs,

      // Full session state as JSONB
      session_data: session,

      updated_at: session.updatedAt,
    });

    if (error) {
      console.error('[CLUES] Supabase save error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[CLUES] Supabase save failed:', err);
    return false;
  }
}

async function loadFromSupabase(sessionId: string): Promise<UserSession | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (error || !data?.session_data) return null;
    return data.session_data as UserSession;
  } catch {
    return null;
  }
}

// ─── The Hook ────────────────────────────────────────────────

interface UsePersistenceOptions {
  session: UserSession;
  onSessionLoaded: (session: UserSession) => void;
}

export function useSessionPersistence({ session, onSessionLoaded }: UsePersistenceOptions) {
  const hydrationStarted = useRef(false);
  const hydrationDone = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydrate on mount: Supabase → localStorage → fresh state ──
  useEffect(() => {
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;

    async function hydrate() {
      // Try localStorage first (fastest)
      const localSession = loadFromLocalStorage();
      const sessionId = localSession?.id;

      if (sessionId && isSupabaseConfigured) {
        // Try to load from Supabase (authoritative)
        const supabaseSession = await loadFromSupabase(sessionId);
        if (supabaseSession) {
          // Supabase is newer or same — use it
          const supabaseTime = new Date(supabaseSession.updatedAt).getTime();
          const localTime = localSession ? new Date(localSession.updatedAt).getTime() : 0;

          if (supabaseTime >= localTime) {
            onSessionLoaded(supabaseSession);
            console.log('[CLUES] Session restored from Supabase', {
              region: supabaseSession.globe?.region,
              tier: supabaseSession.currentTier,
            });
            return;
          }
        }
      }

      // Fall back to localStorage
      if (localSession) {
        onSessionLoaded(localSession);
        console.log('[CLUES] Session restored from localStorage', {
          region: localSession.globe?.region,
          tier: localSession.currentTier,
        });
      }

      // Mark hydration as complete — saves can now proceed
      hydrationDone.current = true;
    }

    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced save on every state change ──
  const save = useCallback((data: UserSession) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(data);
      saveToSupabase(data);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Trigger save whenever session changes — only after hydration is done
  useEffect(() => {
    if (!hydrationDone.current) return;
    save(session);
  }, [session, save]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);
}
