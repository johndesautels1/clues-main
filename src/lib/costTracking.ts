/**
 * Cost Tracking Service
 * Logs every LLM/API call cost to Supabase and provides aggregation.
 * Mirrors the LifeScore cost tracking pattern adapted for CLUES pipeline.
 *
 * Critical Rule #14: Every LLM call must track tokens and cost.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  CostProvider,
  CostEntry,
  CostSummary,
  ProviderCostSummary,
  SessionCostRow,
  CompletionTier,
} from '../types';

// ─── Provider Rate Table (USD per 1M tokens) ───────────────────
// Updated March 2026 — verify against provider pricing pages periodically
export const PROVIDER_RATES: Record<
  CostProvider,
  { input: number; output: number; label: string; icon: string }
> = {
  'claude-sonnet-4-5':   { input: 3.00,  output: 15.00,  label: 'Claude Sonnet 4.5',       icon: '\u{1F3B5}' },
  'gpt-4o':              { input: 2.50,  output: 10.00,  label: 'GPT-4o',                  icon: '\u{1F916}' },
  'gemini-3.1-pro-preview': { input: 1.25, output: 10.00, label: 'Gemini 3.1 Pro Preview',  icon: '\u{1F48E}' },
  'grok-4':              { input: 3.00,  output: 15.00,  label: 'Grok 4',                   icon: '\u{1F680}' },
  'perplexity-sonar':    { input: 1.00,  output: 1.00,   label: 'Perplexity Sonar',         icon: '\u{1F50D}' },
  'claude-opus-4-5':     { input: 15.00, output: 75.00,  label: 'Claude Opus 4.5 (Judge)',   icon: '\u{1F9E0}' },
  'tavily':              { input: 0,     output: 0,      label: 'Tavily (Research + Search)', icon: '\u{1F50E}' },
  'gamma':               { input: 0,     output: 0,      label: 'Gamma (Reports)',           icon: '\u{1F4CA}' },
  'olivia':              { input: 2.50,  output: 10.00,  label: 'Olivia (GPT-4o Chat)',      icon: '\u{1F4AC}' },
  'tts-elevenlabs':      { input: 0,     output: 0,      label: 'TTS (ElevenLabs)',          icon: '\u{1F50A}' },
  'tts-openai':          { input: 0,     output: 0,      label: 'TTS (OpenAI)',              icon: '\u{1F50A}' },
  'avatar-heygen':       { input: 0,     output: 0,      label: 'Avatar (HeyGen)',           icon: '\u{1F3A5}' },
  'avatar-d-id':         { input: 0,     output: 0,      label: 'Avatar (D-ID)',             icon: '\u{1F3A5}' },
  'avatar-simli':        { input: 0,     output: 0,      label: 'Avatar (Simli)',            icon: '\u{1F3A5}' },
  'avatar-replicate':    { input: 0,     output: 0,      label: 'Avatar (Replicate)',        icon: '\u{1F3A5}' },
  'kling-ai':            { input: 0,     output: 0,      label: 'Kling AI (Image Gen)',      icon: '\u{1F5BC}\uFE0F' },
};

// Grouped labels for the dashboard (aggregate sub-providers)
export const PROVIDER_GROUPS: { key: string; label: string; icon: string; providers: CostProvider[] }[] = [
  { key: 'tavily',     label: 'Tavily (Research + Search)',  icon: '\u{1F50E}', providers: ['tavily'] },
  { key: 'sonnet',     label: 'Claude Sonnet 4.5',          icon: '\u{1F3B5}', providers: ['claude-sonnet-4-5'] },
  { key: 'gpt4o',      label: 'GPT-4o',                     icon: '\u{1F916}', providers: ['gpt-4o'] },
  { key: 'gemini',     label: 'Gemini 3.1 Pro Preview',     icon: '\u{1F48E}', providers: ['gemini-3.1-pro-preview'] },
  { key: 'grok',       label: 'Grok 4',                     icon: '\u{1F680}', providers: ['grok-4'] },
  { key: 'perplexity', label: 'Perplexity Sonar',           icon: '\u{1F50D}', providers: ['perplexity-sonar'] },
  { key: 'opus',       label: 'Claude Opus 4.5 (Judge)',     icon: '\u{1F9E0}', providers: ['claude-opus-4-5'] },
  { key: 'gamma',      label: 'Gamma (Reports)',            icon: '\u{1F4CA}', providers: ['gamma'] },
  { key: 'olivia',     label: 'Olivia (Chat Assistant)',    icon: '\u{1F4AC}', providers: ['olivia'] },
  { key: 'tts',        label: 'TTS (ElevenLabs + OpenAI)', icon: '\u{1F50A}', providers: ['tts-elevenlabs', 'tts-openai'] },
  { key: 'avatar',     label: 'Avatar (HeyGen + D-ID + Simli + Replicate)', icon: '\u{1F3A5}', providers: ['avatar-heygen', 'avatar-d-id', 'avatar-simli', 'avatar-replicate'] },
  { key: 'kling',      label: 'Kling AI (Image Generation)', icon: '\u{1F5BC}\uFE0F', providers: ['kling-ai'] },
];

// ─── Calculate Cost from Tokens ────────────────────────────────
export function calculateCost(
  model: CostProvider,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PROVIDER_RATES[model];
  if (!rates) return 0;
  // rates are per 1M tokens
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

// ─── Log a Single API Call ─────────────────────────────────────
export async function logCost(entry: {
  session_id: string;
  model: CostProvider;
  endpoint: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd?: number;
  duration_ms?: number;
}): Promise<void> {
  const cost = entry.cost_usd ?? calculateCost(entry.model, entry.input_tokens, entry.output_tokens);

  // Always log to localStorage as fallback
  const localEntries = getLocalCostEntries();
  const localEntry: CostEntry = {
    id: crypto.randomUUID(),
    session_id: entry.session_id,
    model: entry.model,
    endpoint: entry.endpoint,
    input_tokens: entry.input_tokens,
    output_tokens: entry.output_tokens,
    cost_usd: cost,
    duration_ms: entry.duration_ms ?? null,
    created_at: new Date().toISOString(),
  };
  localEntries.push(localEntry);
  localStorage.setItem('clues_cost_entries', JSON.stringify(localEntries));

  // Also log to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('cost_tracking').insert({
        session_id: entry.session_id,
        model: entry.model,
        endpoint: entry.endpoint,
        input_tokens: entry.input_tokens,
        output_tokens: entry.output_tokens,
        cost_usd: cost,
        duration_ms: entry.duration_ms ?? null,
      });
    } catch (err) {
      console.warn('[CostTracking] Supabase insert failed, entry saved locally', err);
    }
  }
}

// ─── Local Storage Helpers ─────────────────────────────────────
function getLocalCostEntries(): CostEntry[] {
  try {
    const raw = localStorage.getItem('clues_cost_entries');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Fetch All Cost Entries ────────────────────────────────────
export async function fetchAllCosts(): Promise<CostEntry[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('cost_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as CostEntry[];
      }
    } catch (err) {
      console.warn('[CostTracking] Supabase fetch failed, using local', err);
    }
  }
  return getLocalCostEntries().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ─── Build Summary ─────────────────────────────────────────────
export function buildCostSummary(entries: CostEntry[]): CostSummary {
  const grand_total = entries.reduce((sum, e) => sum + e.cost_usd, 0);
  const sessionIds = new Set(entries.map(e => e.session_id));
  const total_sessions = sessionIds.size;
  const total_calls = entries.length;
  const avg_cost = total_sessions > 0 ? grand_total / total_sessions : 0;

  // By provider group
  const by_provider: ProviderCostSummary[] = PROVIDER_GROUPS.map(group => {
    const groupEntries = entries.filter(e => group.providers.includes(e.model));
    const total_cost = groupEntries.reduce((sum, e) => sum + e.cost_usd, 0);
    return {
      provider: group.providers[0],
      label: group.label,
      icon: group.icon,
      total_cost,
      percentage: grand_total > 0 ? (total_cost / grand_total) * 100 : 0,
      call_count: groupEntries.length,
    };
  });

  // By tier
  const by_tier: Record<CompletionTier, number> = {
    discovery: 0,
    exploratory: 0,
    filtered: 0,
    evaluated: 0,
    validated: 0,
    precision: 0,
  };
  for (const e of entries) {
    if (e.tier && by_tier[e.tier] !== undefined) {
      by_tier[e.tier] += e.cost_usd;
    }
  }

  return {
    grand_total,
    total_sessions,
    total_calls,
    avg_cost_per_session: avg_cost,
    by_provider,
    by_tier,
    profitability: {
      avg_cost_per_session: avg_cost,
      breakeven_20_margin: avg_cost * 1.2,
      suggested_50_margin: avg_cost * 1.5,
      suggested_100_margin: avg_cost * 2.0,
    },
  };
}

// ─── Build Session Rows (for the table) ────────────────────────
export function buildSessionRows(entries: CostEntry[]): SessionCostRow[] {
  const sessionMap = new Map<string, CostEntry[]>();
  for (const e of entries) {
    const existing = sessionMap.get(e.session_id) ?? [];
    existing.push(e);
    sessionMap.set(e.session_id, existing);
  }

  return Array.from(sessionMap.entries())
    .map(([session_id, sessionEntries]) => {
      const total_cost = sessionEntries.reduce((sum, e) => sum + e.cost_usd, 0);
      const tier = sessionEntries[0]?.tier ?? 'discovery';
      const created_at = sessionEntries
        .reduce((latest, e) => (e.created_at > latest ? e.created_at : latest), sessionEntries[0].created_at);
      const endpoints = [...new Set(sessionEntries.map(e => e.endpoint))];
      return {
        session_id,
        tier: tier as CompletionTier,
        total_cost,
        call_count: sessionEntries.length,
        created_at,
        description: endpoints.join(', '),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ─── Delete All Cost Data ──────────────────────────────────────
export async function deleteAllCosts(): Promise<void> {
  localStorage.removeItem('clues_cost_entries');
  if (isSupabaseConfigured) {
    await supabase.from('cost_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

// ─── Export as CSV ─────────────────────────────────────────────
export function exportCostsCSV(entries: CostEntry[]): string {
  const headers = ['ID', 'Session', 'Model', 'Endpoint', 'Input Tokens', 'Output Tokens', 'Cost USD', 'Duration (ms)', 'Created At'];
  const rows = entries.map(e => [
    e.id,
    e.session_id,
    e.model,
    e.endpoint,
    e.input_tokens,
    e.output_tokens,
    e.cost_usd.toFixed(6),
    e.duration_ms ?? '',
    e.created_at,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}
