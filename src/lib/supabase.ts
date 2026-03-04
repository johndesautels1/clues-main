/**
 * Supabase Client
 * Single instance, imported wherever DB access is needed.
 * Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * When env vars aren't set, exports null — all callers must check.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
  console.warn(
    '[CLUES] Supabase env vars not set. Running in local-only mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}
