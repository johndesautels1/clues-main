-- ============================================================
-- CLUES Intelligence — Supabase Schema (Comprehensive)
-- Run this in Supabase SQL Editor to create all required tables.
--
-- Tables (20):
--   1.  sessions              — Session anchor + denormalized columns
--   2.  cost_tracking         — Per-LLM-call cost logging
--   3.  user_profiles         — Extended user data beyond auth
--   4.  paragraphs            — Individual paragraph entries (1-30 per session)
--   5.  gemini_extractions    — Extraction metadata from Gemini reasoning engine
--   6.  gemini_metrics        — Individual metrics (100-250 per extraction)
--   7.  questionnaire_answers — Normalized answer rows for ALL question types
--   8.  module_progress       — Per-module status tracking (main + 23 mini)
--   9.  location_recommendations — Gemini-recommended locations with scores
--  10.  evaluations           — Evaluation run metadata
--  11.  llm_evaluations       — Per-LLM evaluation outputs
--  12.  evaluation_metrics    — Per-metric per-LLM scores with sources
--  13.  judge_reports         — Opus judge verdicts
--  14.  judge_overrides       — Individual metric overrides by Opus
--  15.  tavily_cache          — Cached web search results (30-min TTL)
--  16.  reports               — Generated report metadata (Gamma, PDF, video)
--  17.  subscriptions         — Stripe subscription tracking
--  18.  question_performance  — Question effectiveness analytics
--  19.  paragraph_summaries   — Gemini's per-paragraph analysis
--  20.  thinking_steps        — Gemini reasoning chain transparency
--
-- Design Principles:
--   - Normalized for queryability and analytics
--   - sessions.session_data JSONB kept for backward compat + fast full-session restore
--   - Denormalized columns on sessions for LLM token savings
--   - RLS on every table
--   - Cascading deletes from sessions
--   - Indexes on all foreign keys + common query patterns
-- ============================================================


-- ─── Helper: updated_at trigger function ──────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ═══════════════════════════════════════════════════════════════
-- 1. SESSIONS — Session anchor + denormalized columns
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),

  -- Auth link
  user_id       uuid references auth.users(id) on delete set null,
  email         text,

  -- Globe selection (denormalized for LLM token savings)
  globe_region  text,
  globe_lat     double precision,
  globe_lng     double precision,
  globe_zoom    smallint,

  -- Completion tracking (denormalized for dashboards)
  tier          text not null default 'discovery',
  confidence    smallint not null default 0,
  paragraphs_completed smallint not null default 0,

  -- Currency from Gemini extraction (denormalized for analytics)
  detected_currency text,

  -- Full session state as JSONB (backward compat + fast restore)
  session_data  jsonb not null default '{}',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on public.sessions (user_id);
create index if not exists idx_sessions_globe_region on public.sessions (globe_region);
create index if not exists idx_sessions_tier on public.sessions (tier);

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.update_updated_at();

-- RLS
alter table public.sessions enable row level security;

drop policy if exists "Allow all access (pre-auth)" on public.sessions;
drop policy if exists "Users can manage own sessions" on public.sessions;
drop policy if exists "Anon users can manage anonymous sessions" on public.sessions;

create policy "Users can manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

create policy "Anon users can manage anonymous sessions"
  on public.sessions for all to anon
  using (user_id is null)
  with check (user_id is null);


-- ═══════════════════════════════════════════════════════════════
-- 2. COST TRACKING — Per-LLM-call cost logging
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cost_tracking (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.sessions(id) on delete cascade,
  model         text not null,
  endpoint      text not null,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);

create index if not exists idx_cost_session on public.cost_tracking (session_id);
create index if not exists idx_cost_model on public.cost_tracking (model);

alter table public.cost_tracking enable row level security;

drop policy if exists "Allow all access (pre-auth)" on public.cost_tracking;
drop policy if exists "Users can read own costs" on public.cost_tracking;

create policy "Users can read own costs"
  on public.cost_tracking for select
  using (session_id in (select id from public.sessions where user_id = auth.uid()));


-- ═══════════════════════════════════════════════════════════════
-- 3. USER PROFILES — Extended user data beyond Supabase auth
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text,
  avatar_url    text,
  provider      text default 'email',     -- email, google, github, anonymous
  preferred_currency text,                 -- ISO 4217
  preferred_language text default 'en',
  timezone      text,
  onboarding_completed boolean default false,
  total_sessions integer default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at();

alter table public.user_profiles enable row level security;

create policy "Users can manage own profile"
  on public.user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ═══════════════════════════════════════════════════════════════
-- 4. PARAGRAPHS — Individual paragraph entries (1-30 per session)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.paragraphs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  paragraph_number smallint not null,      -- 1-30
  heading       text not null,             -- "Who You Are", "Your Ideal Climate", etc.
  content       text not null default '',
  word_count    integer generated always as (
    array_length(regexp_split_to_array(trim(content), '\s+'), 1)
  ) stored,
  phase         smallint,                  -- 1-6 (which phase this paragraph belongs to)
  updated_at    timestamptz not null default now(),

  constraint uq_session_paragraph unique (session_id, paragraph_number),
  constraint ck_paragraph_number check (paragraph_number between 1 and 30)
);

create index if not exists idx_paragraphs_session on public.paragraphs (session_id);

drop trigger if exists paragraphs_updated_at on public.paragraphs;
create trigger paragraphs_updated_at
  before update on public.paragraphs
  for each row execute function public.update_updated_at();

alter table public.paragraphs enable row level security;

create policy "Users can manage own paragraphs"
  on public.paragraphs for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 5. GEMINI EXTRACTIONS — Extraction metadata from Gemini
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.gemini_extractions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,

  -- Profile extracted by Gemini
  personality_profile text,
  detected_currency text,
  budget_min    numeric(12,2),
  budget_max    numeric(12,2),
  budget_currency text,

  -- Demographic signals
  age           integer,
  gender        text,
  household_size integer,
  has_children  boolean,
  has_pets      boolean,
  employment_type text,
  income_bracket text,

  -- Counts
  metric_count  integer default 0,         -- number of metrics extracted
  country_count integer default 0,         -- recommended countries
  city_count    integer default 0,
  town_count    integer default 0,
  neighborhood_count integer default 0,

  -- Signals for downstream modules
  dnw_signals   jsonb default '[]',        -- string[]
  mh_signals    jsonb default '[]',        -- string[]
  tradeoff_signals jsonb default '[]',     -- string[]

  -- Module relevance scores
  module_relevance jsonb default '{}',     -- Record<string, number>
  globe_region_preference text,

  -- Status
  status        text default 'pending',    -- pending, processing, completed, failed
  error_message text,
  processing_time_ms integer,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint uq_extraction_session unique (session_id)
);

create index if not exists idx_extractions_session on public.gemini_extractions (session_id);

drop trigger if exists extractions_updated_at on public.gemini_extractions;
create trigger extractions_updated_at
  before update on public.gemini_extractions
  for each row execute function public.update_updated_at();

alter table public.gemini_extractions enable row level security;

create policy "Users can manage own extractions"
  on public.gemini_extractions for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 6. GEMINI METRICS — Individual metrics (100-250 per extraction)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.gemini_metrics (
  id            uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.gemini_extractions(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  metric_id     text not null,             -- "M1", "M2", etc.
  field_id      text not null,             -- "climate_01_humidity"
  description   text not null,
  category      text not null,             -- one of 23 categories
  source_paragraph smallint,               -- which paragraph (1-30) triggered this
  score         smallint,                  -- 0-100
  data_type     text,                      -- numeric, boolean, ranking, index

  user_justification text,
  data_justification text,
  source        text,                      -- "Tavily: Portugal Interior Ministry Report 2026"
  research_query text,

  -- Threshold (for evaluation)
  threshold_operator text,                 -- gt, lt, eq, gte, lte, between
  threshold_value numeric(12,4),
  threshold_value_high numeric(12,4),      -- for "between" operator
  threshold_unit text,

  created_at    timestamptz not null default now()
);

create index if not exists idx_metrics_extraction on public.gemini_metrics (extraction_id);
create index if not exists idx_metrics_session on public.gemini_metrics (session_id);
create index if not exists idx_metrics_category on public.gemini_metrics (category);
create index if not exists idx_metrics_field_id on public.gemini_metrics (field_id);

alter table public.gemini_metrics enable row level security;

create policy "Users can manage own metrics"
  on public.gemini_metrics for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 7. QUESTIONNAIRE ANSWERS — Normalized answers for ALL sections
-- ═══════════════════════════════════════════════════════════════
-- One row per answer. Enables:
--   - Question performance analytics
--   - Answer distribution analysis
--   - Skip rate tracking
--   - Cross-session question effectiveness
--   - Per-question response time tracking

create table if not exists public.questionnaire_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,

  -- Question identity
  section       text not null,             -- demographics, dnw, mh, tradeoffs, general
  question_number integer not null,        -- question number within section
  question_key  text not null,             -- q1, q35, tq1, gq1 (namespaced key)
  question_text text,                      -- the actual question text (for analytics snapshots)

  -- Answer value (polymorphic — one of these is populated)
  answer_text   text,                      -- for text, single-select, open-text
  answer_number numeric(12,4),             -- for Likert (1-5), slider (0-100), range
  answer_boolean boolean,                  -- for Yes/No
  answer_array  jsonb,                     -- for multi-select, ranking (string[])

  -- Typed severity/importance for DNW/MH sections
  severity      smallint,                  -- 1-5 for DNW (Dealbreaker scale)
  importance    smallint,                  -- 1-5 for MH (Likert-Importance scale)

  -- Response metadata
  response_type text,                      -- Likert-Agreement, Dealbreaker, Single-select, etc.
  response_time_ms integer,                -- how long user spent on this question
  was_skipped   boolean default false,     -- skipped by logic jump
  was_prefilled boolean default false,     -- pre-filled by adaptive engine
  skip_reason   text,                      -- which logic jump caused the skip

  answered_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint uq_session_question unique (session_id, question_key)
);

create index if not exists idx_answers_session on public.questionnaire_answers (session_id);
create index if not exists idx_answers_section on public.questionnaire_answers (section);
create index if not exists idx_answers_question_key on public.questionnaire_answers (question_key);
create index if not exists idx_answers_answered_at on public.questionnaire_answers (answered_at);

drop trigger if exists answers_updated_at on public.questionnaire_answers;
create trigger answers_updated_at
  before update on public.questionnaire_answers
  for each row execute function public.update_updated_at();

alter table public.questionnaire_answers enable row level security;

create policy "Users can manage own answers"
  on public.questionnaire_answers for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 8. MODULE PROGRESS — Per-module status tracking
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.module_progress (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,

  module_id     text not null,             -- demographics, dnw, mh, tradeoffs, general,
                                           -- safety_security, health_wellness, climate_weather, etc.
  module_type   text not null,             -- 'main' or 'mini'
  status        text not null default 'locked',  -- locked, not_started, in_progress, completed, recommended
  questions_total integer not null default 0,
  questions_answered integer not null default 0,
  questions_skipped integer not null default 0,

  -- Relevance score from Gemini (for mini modules)
  relevance_score numeric(5,2),            -- 0-100, how relevant this module is to user

  started_at    timestamptz,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),

  constraint uq_session_module unique (session_id, module_id)
);

create index if not exists idx_module_progress_session on public.module_progress (session_id);
create index if not exists idx_module_progress_module on public.module_progress (module_id);

drop trigger if exists module_progress_updated_at on public.module_progress;
create trigger module_progress_updated_at
  before update on public.module_progress
  for each row execute function public.update_updated_at();

alter table public.module_progress enable row level security;

create policy "Users can manage own module progress"
  on public.module_progress for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 9. LOCATION RECOMMENDATIONS — Gemini-recommended locations
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.location_recommendations (
  id            uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.gemini_extractions(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  location_type text not null,             -- country, city, town, neighborhood
  location_name text not null,
  country       text not null,
  iso_code      text,                      -- ISO 3166-1 alpha-2
  parent_location text,                    -- parent city (for towns) or parent town (for neighborhoods)

  overall_score smallint,                  -- 0-100
  reasoning     text,
  local_currency text,                     -- for countries

  -- Metrics for this location stored as JSONB array
  -- (individual metric scores are in gemini_metrics; this is the location-level rollup)
  metrics_snapshot jsonb default '[]',

  rank          smallint,                  -- 1, 2, 3 within its type
  created_at    timestamptz not null default now()
);

create index if not exists idx_locations_extraction on public.location_recommendations (extraction_id);
create index if not exists idx_locations_session on public.location_recommendations (session_id);
create index if not exists idx_locations_type on public.location_recommendations (location_type);

alter table public.location_recommendations enable row level security;

create policy "Users can manage own location recs"
  on public.location_recommendations for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 10. EVALUATIONS — Evaluation run metadata
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.evaluations (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,

  tier          text not null,             -- which CompletionTier triggered this evaluation
  confidence    smallint not null,         -- 0-100
  status        text not null default 'pending',  -- pending, running, completed, failed, partial
  version       integer not null default 1,       -- re-evaluation increments version

  -- Results summary
  winning_country text,
  winning_city  text,
  winning_town  text,
  winning_neighborhood text,

  -- Pipeline tracking
  llms_requested text[] default '{}',      -- which LLMs were fired
  llms_completed text[] default '{}',      -- which returned successfully
  judge_completed boolean default false,
  categories_evaluated integer default 0,
  categories_total integer default 23,

  -- Performance
  total_duration_ms integer,
  total_cost_usd numeric(10,6),

  -- Next steps for user
  next_steps    jsonb default '[]',        -- {action, confidenceGain}[]
  data_completeness jsonb default '{}',    -- Record<string, boolean>

  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_evaluations_session on public.evaluations (session_id);
create index if not exists idx_evaluations_status on public.evaluations (status);

drop trigger if exists evaluations_updated_at on public.evaluations;
create trigger evaluations_updated_at
  before update on public.evaluations
  for each row execute function public.update_updated_at();

alter table public.evaluations enable row level security;

create policy "Users can manage own evaluations"
  on public.evaluations for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 11. LLM EVALUATIONS — Per-LLM evaluation outputs
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.llm_evaluations (
  id            uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  llm_model     text not null,             -- claude-sonnet-4-6, gpt-4o, gpt-5.4, gemini-3.1-pro-preview, grok-4-1-fast-reasoning, sonar-reasoning-pro-high, gpt-realtime-1.5
  category      text not null,             -- one of 23 categories
  status        text not null default 'pending',  -- pending, running, completed, failed, timeout

  -- Raw output
  raw_response  jsonb,                     -- full LLM response for audit
  metrics_count integer default 0,

  -- Performance
  input_tokens  integer,
  output_tokens integer,
  cost_usd      numeric(10,6),
  duration_ms   integer,
  retries       smallint default 0,

  created_at    timestamptz not null default now()
);

create index if not exists idx_llm_evals_evaluation on public.llm_evaluations (evaluation_id);
create index if not exists idx_llm_evals_session on public.llm_evaluations (session_id);
create index if not exists idx_llm_evals_model on public.llm_evaluations (llm_model);
create index if not exists idx_llm_evals_category on public.llm_evaluations (category);

alter table public.llm_evaluations enable row level security;

create policy "Users can read own llm evaluations"
  on public.llm_evaluations for select
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 12. EVALUATION METRICS — Per-metric per-LLM scores with sources
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.evaluation_metrics (
  id            uuid primary key default gen_random_uuid(),
  llm_evaluation_id uuid not null references public.llm_evaluations(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,

  metric_id     text not null,             -- "M1", "M2" — links to gemini_metrics
  field_id      text not null,             -- "climate_01_humidity"
  location      text not null,             -- city/town/neighborhood being scored
  country       text not null,

  score         smallint not null,         -- 0-100
  justification text,
  source_url    text,                      -- direct link to backing data
  source_title  text,
  source_date   date,                      -- recency of the cited source
  data_value    text,                      -- the actual data point ("62%", "4.2/5", "$1,200")
  data_unit     text,                      -- "%", "USD", "index"

  created_at    timestamptz not null default now()
);

create index if not exists idx_eval_metrics_llm_eval on public.evaluation_metrics (llm_evaluation_id);
create index if not exists idx_eval_metrics_evaluation on public.evaluation_metrics (evaluation_id);
create index if not exists idx_eval_metrics_field_id on public.evaluation_metrics (field_id);
create index if not exists idx_eval_metrics_location on public.evaluation_metrics (location);

alter table public.evaluation_metrics enable row level security;

create policy "Users can read own eval metrics"
  on public.evaluation_metrics for select
  using (evaluation_id in (select id from public.evaluations where session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null)));


-- ═══════════════════════════════════════════════════════════════
-- 13. JUDGE REPORTS — Opus judge verdicts
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.judge_reports (
  id            uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  -- Verdict
  verdict_summary text,                    -- Cristiano's overall verdict narrative
  verdict_confidence smallint,             -- 0-100

  -- Location verdicts
  country_verdicts jsonb default '[]',     -- [{name, score, reasoning, rank}]
  city_verdicts jsonb default '[]',
  town_verdicts jsonb default '[]',
  neighborhood_verdicts jsonb default '[]',

  -- Stats
  metrics_reviewed integer default 0,
  overrides_count integer default 0,
  high_disagreement_count integer default 0,  -- metrics with σ > 15
  categories_reviewed integer default 0,

  -- Performance
  input_tokens  integer,
  output_tokens integer,
  cost_usd      numeric(10,6),
  duration_ms   integer,

  -- Full reasoning
  reasoning_chain jsonb default '[]',      -- ThinkingStep[]

  created_at    timestamptz not null default now()
);

create index if not exists idx_judge_reports_evaluation on public.judge_reports (evaluation_id);
create index if not exists idx_judge_reports_session on public.judge_reports (session_id);

alter table public.judge_reports enable row level security;

create policy "Users can read own judge reports"
  on public.judge_reports for select
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 14. JUDGE OVERRIDES — Individual metric overrides by Opus
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.judge_overrides (
  id            uuid primary key default gen_random_uuid(),
  judge_report_id uuid not null references public.judge_reports(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,

  metric_id     text not null,
  field_id      text not null,
  location      text not null,

  -- What the LLMs said
  llm_mean      numeric(6,2),
  llm_median    numeric(6,2),
  llm_mode      numeric(6,2),
  llm_stddev    numeric(6,2),
  llm_scores    jsonb not null,            -- {model: score} for all 5 LLMs

  -- What Opus decided
  judge_score   smallint not null,         -- 0-100
  override_reason text not null,           -- why Opus overrode the consensus
  override_type text,                      -- recency, reliability, outlier_valid, trend, error_correction

  -- Which LLMs were weighted up/down
  weighted_up   text[],                    -- model names
  weighted_down text[],
  discarded     text[],                    -- model names discarded entirely

  created_at    timestamptz not null default now()
);

create index if not exists idx_overrides_report on public.judge_overrides (judge_report_id);
create index if not exists idx_overrides_evaluation on public.judge_overrides (evaluation_id);
create index if not exists idx_overrides_metric on public.judge_overrides (metric_id);

alter table public.judge_overrides enable row level security;

create policy "Users can read own overrides"
  on public.judge_overrides for select
  using (evaluation_id in (select id from public.evaluations where session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null)));


-- ═══════════════════════════════════════════════════════════════
-- 15. TAVILY CACHE — Cached web search results (TTL-based)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.tavily_cache (
  id            uuid primary key default gen_random_uuid(),
  query_hash    text not null unique,      -- SHA-256 of the search query
  query_text    text not null,             -- original search query
  response      jsonb not null,            -- full Tavily response
  result_count  integer default 0,
  source_urls   text[] default '{}',       -- extracted URLs for quick lookup
  expires_at    timestamptz not null,      -- 30-min TTL from creation
  created_at    timestamptz not null default now()
);

create index if not exists idx_tavily_cache_hash on public.tavily_cache (query_hash);
create index if not exists idx_tavily_cache_expires on public.tavily_cache (expires_at);

-- No RLS needed — Tavily cache is shared across sessions (same queries = same results)
-- Written by service_role key only


-- ═══════════════════════════════════════════════════════════════
-- 16. REPORTS — Generated report metadata
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  evaluation_id uuid references public.evaluations(id) on delete cascade,

  report_type   text not null,             -- results_data, llm_analysis, gamma
  version       integer not null default 1,
  status        text not null default 'pending',  -- pending, generating, completed, failed

  -- URLs
  gamma_url     text,                      -- Gamma report URL
  pdf_url       text,                      -- PDF download URL (Supabase Storage)
  video_url     text,                      -- Cristiano HeyGen video URL

  -- Metadata
  page_count    integer,
  generation_time_ms integer,
  cost_usd      numeric(10,6),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_reports_session on public.reports (session_id);
create index if not exists idx_reports_evaluation on public.reports (evaluation_id);

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.update_updated_at();

alter table public.reports enable row level security;

create policy "Users can manage own reports"
  on public.reports for all
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null))
  with check (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 17. SUBSCRIPTIONS — Stripe subscription tracking
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,

  tier          text not null default 'discovery',  -- discovery, navigator, sovereign
  status        text not null default 'inactive',   -- active, inactive, past_due, canceled, trialing
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at     timestamptz,

  -- Usage tracking
  reports_generated integer default 0,
  reports_limit integer default 1,         -- per billing period
  evaluations_used integer default 0,
  evaluations_limit integer default 1,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions (user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions (stripe_customer_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Writes handled by Stripe webhook via service_role


-- ═══════════════════════════════════════════════════════════════
-- 18. QUESTION PERFORMANCE — Question effectiveness analytics
-- ═══════════════════════════════════════════════════════════════
-- Aggregated stats per question, updated periodically.
-- Powers the admin Question Library dashboard for add/remove/tune decisions.

create table if not exists public.question_performance (
  id            uuid primary key default gen_random_uuid(),
  question_key  text not null unique,      -- q1, q35, tq1, gq1
  section       text not null,             -- demographics, dnw, mh, tradeoffs, general
  question_number integer not null,
  question_text text,

  -- Response stats
  total_responses integer default 0,
  total_skips   integer default 0,
  skip_rate     numeric(5,4) default 0,    -- 0.0000 - 1.0000
  avg_response_time_ms integer,

  -- Answer distribution (for Likert/Dealbreaker questions)
  distribution  jsonb default '{}',        -- {1: 45, 2: 120, 3: 230, 4: 89, 5: 16}

  -- Information gain metrics
  -- How much this question contributes to overall evaluation accuracy
  information_gain numeric(8,6) default 0,
  correlation_with_completion numeric(5,4) default 0,  -- does answering this Q correlate with completing the session?
  abandonment_rate numeric(5,4) default 0,             -- % of users who abandon AT this question

  -- Admin flags
  is_active     boolean default true,      -- admin can deactivate
  admin_notes   text,
  last_reviewed_at timestamptz,
  last_reviewed_by text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_qperf_section on public.question_performance (section);
create index if not exists idx_qperf_skip_rate on public.question_performance (skip_rate desc);
create index if not exists idx_qperf_info_gain on public.question_performance (information_gain desc);

drop trigger if exists qperf_updated_at on public.question_performance;
create trigger qperf_updated_at
  before update on public.question_performance
  for each row execute function public.update_updated_at();

-- No RLS — admin-only table, accessed via service_role


-- ═══════════════════════════════════════════════════════════════
-- 19. PARAGRAPH SUMMARIES — Gemini's per-paragraph analysis
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.paragraph_summaries (
  id            uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.gemini_extractions(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  paragraph_number smallint not null,      -- 1-30
  key_themes    text[] default '{}',
  extracted_preferences text[] default '{}',
  metrics_derived text[] default '{}',     -- ["M1", "M2", "M5"]

  created_at    timestamptz not null default now()
);

create index if not exists idx_para_summaries_extraction on public.paragraph_summaries (extraction_id);
create index if not exists idx_para_summaries_session on public.paragraph_summaries (session_id);

alter table public.paragraph_summaries enable row level security;

create policy "Users can read own paragraph summaries"
  on public.paragraph_summaries for select
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- 20. THINKING STEPS — Gemini reasoning chain transparency
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.thinking_steps (
  id            uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.gemini_extractions(id) on delete cascade,
  session_id    uuid not null references public.sessions(id) on delete cascade,

  step_number   smallint not null,
  thought       text not null,
  conclusion    text,

  created_at    timestamptz not null default now()
);

create index if not exists idx_thinking_extraction on public.thinking_steps (extraction_id);

alter table public.thinking_steps enable row level security;

create policy "Users can read own thinking steps"
  on public.thinking_steps for select
  using (session_id in (select id from public.sessions where user_id = auth.uid() or user_id is null));


-- ═══════════════════════════════════════════════════════════════
-- CLEANUP: Remove expired Tavily cache (run periodically)
-- ═══════════════════════════════════════════════════════════════

-- You can schedule this as a Supabase cron job or pg_cron:
-- SELECT cron.schedule('cleanup-tavily-cache', '*/30 * * * *',
--   $$DELETE FROM public.tavily_cache WHERE expires_at < now()$$
-- );


-- ═══════════════════════════════════════════════════════════════
-- VIEWS: Useful aggregations
-- ═══════════════════════════════════════════════════════════════

-- Session completion overview (for admin dashboard)
create or replace view public.session_overview as
select
  s.id as session_id,
  s.user_id,
  s.email,
  s.tier,
  s.confidence,
  s.globe_region,
  s.paragraphs_completed,
  s.detected_currency,
  (select count(*) from public.questionnaire_answers qa where qa.session_id = s.id) as total_answers,
  (select count(*) from public.questionnaire_answers qa where qa.session_id = s.id and qa.was_skipped = true) as skipped_answers,
  (select count(*) from public.module_progress mp where mp.session_id = s.id and mp.status = 'completed') as modules_completed,
  (select count(*) from public.evaluations e where e.session_id = s.id and e.status = 'completed') as evaluations_completed,
  (select sum(ct.cost_usd) from public.cost_tracking ct where ct.session_id = s.id) as total_cost,
  s.created_at,
  s.updated_at
from public.sessions s;

-- Question effectiveness leaderboard (for admin)
create or replace view public.question_effectiveness as
select
  qp.question_key,
  qp.section,
  qp.question_number,
  qp.question_text,
  qp.total_responses,
  qp.skip_rate,
  qp.avg_response_time_ms,
  qp.information_gain,
  qp.abandonment_rate,
  qp.correlation_with_completion,
  qp.is_active,
  case
    when qp.skip_rate > 0.5 then 'high_skip'
    when qp.abandonment_rate > 0.1 then 'high_abandon'
    when qp.information_gain < 0.01 then 'low_value'
    else 'healthy'
  end as health_status
from public.question_performance qp
order by qp.information_gain desc;


-- ═══════════════════════════════════════════════════════════════
-- SAFE RE-RUN: Add missing columns if tables were partially created
-- Run this section if you get "column does not exist" errors
-- after a partial initial run of this schema.
-- ═══════════════════════════════════════════════════════════════

-- Reports: evaluation_id may be missing from partial run
alter table if exists public.reports
  add column if not exists evaluation_id uuid references public.evaluations(id) on delete cascade;

-- LLM evaluations: ensure all columns exist
alter table if exists public.llm_evaluations
  add column if not exists evaluation_id uuid references public.evaluations(id) on delete cascade;
alter table if exists public.llm_evaluations
  add column if not exists session_id uuid references public.sessions(id) on delete cascade;

-- Evaluation metrics: ensure FK columns exist
alter table if exists public.evaluation_metrics
  add column if not exists evaluation_id uuid references public.evaluations(id) on delete cascade;
alter table if exists public.evaluation_metrics
  add column if not exists llm_evaluation_id uuid references public.llm_evaluations(id) on delete cascade;

-- Judge overrides: ensure FK columns exist
alter table if exists public.judge_overrides
  add column if not exists evaluation_id uuid references public.evaluations(id) on delete cascade;
alter table if exists public.judge_overrides
  add column if not exists judge_report_id uuid references public.judge_reports(id) on delete cascade;

-- Judge reports: ensure FK columns exist
alter table if exists public.judge_reports
  add column if not exists evaluation_id uuid references public.evaluations(id) on delete cascade;
alter table if exists public.judge_reports
  add column if not exists session_id uuid references public.sessions(id) on delete cascade;

-- Gemini extractions: ensure unique constraint
alter table if exists public.gemini_extractions
  drop constraint if exists uq_extraction_session;
alter table if exists public.gemini_extractions
  add constraint uq_extraction_session unique (session_id);

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION HELPER: If upgrading from the 2-table schema
-- ═══════════════════════════════════════════════════════════════
-- The sessions table and cost_tracking table remain unchanged.
-- All new tables are additive — no existing data is affected.
-- The session_data JSONB column is kept for backward compatibility
-- and fast full-session restore. Over time, reads should migrate
-- to the normalized tables for better query performance.
--
-- To migrate existing session_data into normalized tables, run:
--
--   INSERT INTO public.paragraphs (session_id, paragraph_number, heading, content)
--   SELECT
--     s.id,
--     (p->>'id')::smallint,
--     p->>'heading',
--     p->>'content'
--   FROM public.sessions s,
--     jsonb_array_elements(s.session_data->'paragraphical'->'paragraphs') p
--   WHERE s.session_data->'paragraphical'->'paragraphs' IS NOT NULL
--   ON CONFLICT (session_id, paragraph_number) DO UPDATE
--     SET content = EXCLUDED.content, heading = EXCLUDED.heading;
--
-- ============================================================
