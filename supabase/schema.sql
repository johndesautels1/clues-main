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

create trigger sessions_updated_at
  before update on public.sessions
  for each row
  execute function public.update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────
-- Enable RLS from day one (Critical Rule #7 from LifeScore bugs)
-- For now, allow all operations since we don't have auth yet.
-- When auth is added, these policies will be replaced with:
--   auth.uid() = sessions.user_id
-- ============================================================

alter table public.sessions enable row level security;

-- Temporary open policy (replace with auth-based policy later)
create policy "Allow all access (pre-auth)"
  on public.sessions
  for all
  using (true)
  with check (true);

-- ─── Cost Tracking (for LLM calls) ─────────────────────────
-- Every LLM call must track tokens and cost (Critical Rule #14)
-- ============================================================

create table if not exists public.cost_tracking (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.sessions(id) on delete cascade,
  model         text not null,         -- "claude-sonnet-4-5", "gpt-4o", etc.
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

create policy "Allow all access (pre-auth)"
  on public.cost_tracking
  for all
  using (true)
  with check (true);
