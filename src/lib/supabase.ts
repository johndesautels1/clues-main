/**
 * Supabase Client
 * Single instance, imported wherever DB access is needed.
 * Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * Always creates a valid SupabaseClient. When env vars aren't set,
 * uses a placeholder URL so createClient() doesn't crash.
 * Calls will fail gracefully at the network level instead of at import time.
 */

import { createClient } from '@supabase/supabase-js';

// Placeholder URL that satisfies createClient validation but won't connect.
// All requests will simply fail at the network layer and get caught by try/catch.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PLACEHOLDER_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;

const isConfigured = supabaseUrl !== PLACEHOLDER_URL;

if (!isConfigured) {
  console.warn(
    '[CLUES] Supabase env vars not set. Running in local-only mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Whether Supabase is actually configured with real credentials */
export const isSupabaseConfigured = isConfigured;
