-- ============================================================
-- CLUES Main Module — Supabase Schema
-- Run this in Supabase SQL Editor to create all required tables.
-- ============================================================

-- ─── User Sessions ──────────────────────────────────────────
-- Stores the full user session state as JSONB for flexibility,
-- PLUS denormalized columns for the globe selection so we can
-- query/filter by region without parsing JSON.
-- ============================================================

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),

  -- Auth link — ties session to a Supabase auth.users account
  -- Nullable: anonymous users don't have an account yet
  user_id       uuid references auth.users(id) on delete set null,
  email         text,

  -- Globe selection (denormalized for fast queries + LLM context reduction)
  globe_region  text,              -- "Southern Europe / Mediterranean"
  globe_lat     double precision,  -- 40.15
  globe_lng     double precision,  -- 15.32
  globe_zoom    smallint,          -- 1=region, 2=country, 3=city

  -- Completion tracking (denormalized for dashboards/analytics)
  tier          text not null default 'discovery',   -- CompletionTier
  confidence    smallint not null default 0,          -- 0-100
  paragraphs_completed smallint not null default 0,   -- 0-24

  -- Full session state (everything else lives here)
  session_data  jsonb not null default '{}',

  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index on user_id for "load my sessions" queries
create index if not exists idx_sessions_user_id on public.sessions (user_id);

-- Index on globe_region for LLM pre-filtering
create index if not exists idx_sessions_globe_region on public.sessions (globe_region);

-- Index on tier for analytics queries
create index if not exists idx_sessions_tier on public.sessions (tier);

-- Updated-at auto-trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at
  before update on public.sessions
  for each row
  execute function public.update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────
-- Users can only read/write their own sessions.
-- Anonymous sessions (user_id IS NULL) are accessible via the
-- session UUID in localStorage — no auth required.
-- ============================================================

alter table public.sessions enable row level security;

-- Drop old open policy if it exists (from pre-auth schema)
drop policy if exists "Allow all access (pre-auth)" on public.sessions;

-- Authenticated users: full access to their own sessions
create policy "Users can manage own sessions"
  on public.sessions
  for all
  using (
    auth.uid() = user_id
    or user_id is null  -- Anonymous sessions accessible to anyone with the UUID
  )
  with check (
    auth.uid() = user_id
    or user_id is null
  );

-- Anon role: can create and manage anonymous sessions (no user_id)
-- This allows the app to work before login
create policy "Anon users can manage anonymous sessions"
  on public.sessions
  for all
  to anon
  using (user_id is null)
  with check (user_id is null);

-- Service role bypasses RLS (for server-side API functions)
-- This is automatic in Supabase — service_role key skips RLS.

-- ─── Cost Tracking (for LLM calls) ─────────────────────────
-- Every LLM call must track tokens and cost (Critical Rule #14)
-- ============================================================

create table if not exists public.cost_tracking (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.sessions(id) on delete cascade,
  model         text not null,         -- "claude-sonnet-4-6", "gpt-4o", etc.
  endpoint      text not null,         -- "/api/evaluate", "/api/paragraphical"
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);

create index if not exists idx_cost_session on public.cost_tracking (session_id);
create index if not exists idx_cost_model on public.cost_tracking (model);

alter table public.cost_tracking enable row level security;

-- Drop old open policy if it exists
drop policy if exists "Allow all access (pre-auth)" on public.cost_tracking;

-- Cost tracking is written by server-side functions (service_role key).
-- Authenticated users can read their own session costs.
create policy "Users can read own costs"
  on public.cost_tracking
  for select
  using (
    session_id in (
      select id from public.sessions where user_id = auth.uid()
    )
  );

-- ─── Migration Helper ───────────────────────────────────────
-- If upgrading from pre-auth schema, run this to add columns:
--
--   ALTER TABLE public.sessions
--     ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
--     ADD COLUMN IF NOT EXISTS email text;
--   CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
-- ============================================================
