/**
 * Shared utilities for all 5 LLM evaluation endpoints.
 *
 * Extracted to eliminate ~180 lines of duplication per endpoint.
 * Contains: trackCost, buildEvaluationPrompt, CORS handler,
 * response validation, input validation, and <think> stripping.
 */

import type {
  EvaluationMetric,
  CityCandidate,
  TavilyResult,
  LLMEvaluationResponse,
  EvaluateRequest,
} from '../../src/types/evaluation';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Re-export types for endpoints ──────────────────────────────
export type { EvaluationMetric, CityCandidate, TavilyResult, LLMEvaluationResponse, EvaluateRequest };

// ─── CORS Handler ───────────────────────────────────────────────

/** Handle CORS preflight. Returns true if request was handled (OPTIONS). */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ─── Input Validation ───────────────────────────────────────────

/** Validate the standard EvaluateRequest body. Returns error message or null. */
export function validateEvaluateRequest(body: unknown): string | null {
  const b = body as Partial<EvaluateRequest>;
  if (!b.sessionId || typeof b.sessionId !== 'string') return 'Missing or invalid sessionId';
  if (!b.category || typeof b.category !== 'string') return 'Missing or invalid category';
  if (!b.metrics || !Array.isArray(b.metrics) || b.metrics.length === 0) return 'Missing or empty metrics array';
  if (!b.cities || !Array.isArray(b.cities) || b.cities.length === 0) return 'Missing or empty cities array';
  if (b.metrics.length > 100) return 'Too many metrics (max 100)';
  if (b.cities.length > 25) return 'Too many cities (max 25)';
  return null;
}

// ─── Cost Tracking ──────────────────────────────────────────────

export async function trackCost(entry: {
  sessionId: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
}): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/cost_tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        session_id: entry.sessionId,
        model: entry.model,
        endpoint: entry.endpoint,
        input_tokens: entry.inputTokens,
        output_tokens: entry.outputTokens,
        cost_usd: entry.costUsd,
        duration_ms: entry.durationMs,
      }),
    });
  } catch (err) {
    console.warn('[CostTracking] Failed to log cost:', err);
  }
}

// ─── Build Evaluation Prompt ────────────────────────────────────

export interface EvaluatorIdentity {
  number: number;       // 1-5
  model: string;        // e.g. "Claude Sonnet 4.6"
  strengths: string[];  // bullet points
  /** Per-evaluator Rule 3 — unique instruction leveraging this model's specialty */
  rule3: string;
  /** Per-evaluator Rule 4 variation (default: "Flag ANY data inconsistency between Tavily research and your knowledge.") */
  rule4?: string;
  /** Override the IMPORTANT paragraph (e.g., Perplexity uses native search + Tavily) */
  importantOverride?: string;
  /** Override "- source: Attribution to a specific data source" (e.g., Perplexity: "include URLs") */
  sourceInstruction?: string;
  /** Override "- reasoning: Your analytical reasoning chain" (e.g., Perplexity: "search-augmented") */
  reasoningInstruction?: string;
  /** Override JSON schema source example (e.g., Perplexity: "<data source with URL>") */
  sourceSchemaExample?: string;
}

/**
 * Build the standard evaluation prompt for any LLM evaluator.
 * Only the evaluator identity section differs between endpoints.
 */
export function buildEvaluationPrompt(
  identity: EvaluatorIdentity,
  category: string,
  metrics: EvaluationMetric[],
  cities: CityCandidate[],
  tavilyResearch: TavilyResult[]
): string {
  const metricsText = metrics
    .map(m => `${m.id}: ${m.description} [${m.data_type}]${m.threshold ? ` (threshold: ${m.threshold.operator} ${JSON.stringify(m.threshold.value)} ${m.threshold.unit})` : ''}`)
    .join('\n');

  const citiesText = cities
    .map(c => `- ${c.location}, ${c.country} (${c.location_type}${c.parent ? `, in ${c.parent}` : ''})`)
    .join('\n');

  const researchText = tavilyResearch
    .map(r => {
      // Guard: r.results may be undefined/null
      const sources = (r.results ?? [])
        .map(s => {
          // Word-boundary truncation instead of mid-word slice
          const content = s.content ?? '';
          let snippet = content;
          if (snippet.length > 300) {
            const lastSpace = snippet.lastIndexOf(' ', 300);
            snippet = snippet.slice(0, lastSpace > 200 ? lastSpace : 300) + '...';
          }
          return `  - [${s.title}](${s.url}): ${snippet}`;
        })
        .join('\n');
      return `${r.metric_id} (${r.query}):\n${sources}`;
    })
    .join('\n\n');

  const strengthsText = identity.strengths.map(s => `- ${s}`).join('\n');

  return `You are CLUES Intelligence's LLM Evaluator #${identity.number} (${identity.model}).

Your role: Score each city/location against each metric for the "${category}" category.

You are especially strong at:
${strengthsText}

${identity.importantOverride ?? 'IMPORTANT: You have Tavily research data below. Use it as your PRIMARY source. Cross-reference with your own knowledge. If you find contradictions, flag them in the "disagreements" array.'}

═══════════════════════════════════════════════════════════════
METRICS TO EVALUATE (${metrics.length} metrics):
═══════════════════════════════════════════════════════════════
${metricsText}

═══════════════════════════════════════════════════════════════
LOCATIONS TO SCORE:
═══════════════════════════════════════════════════════════════
${citiesText}

═══════════════════════════════════════════════════════════════
TAVILY RESEARCH DATA:
═══════════════════════════════════════════════════════════════
${researchText}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════

For each location, score EVERY metric:
- score: 0-100 (relative to other locations)
- confidence: 0.0-1.0 (how confident you are in this score)
- user_justification: Why this matters to the user (reference their paragraph)
- data_justification: Real-world data backing this score (cite 2026 data)
- source: ${identity.sourceInstruction ?? 'Attribution to a specific data source'}
- reasoning: ${identity.reasoningInstruction ?? 'Your analytical reasoning chain'}

Also provide:
- disagreements: Metrics where your analysis contradicts the Tavily research data
- reasoning_summary: Your overall assessment of this category across all locations

Return ONLY valid JSON matching this schema (no markdown fences):

{
  "category": "${category}",
  "evaluations": [
    {
      "location": "<city name>",
      "country": "<country>",
      "overall_score": <0-100>,
      "metric_scores": [
        {
          "metric_id": "<M1, M2, etc.>",
          "score": <0-100>,
          "confidence": <0.0-1.0>,
          "user_justification": "<why this matters to user>",
          "data_justification": "<real-world data>",
          "source": "${identity.sourceSchemaExample ?? '<data source>'}",
          "reasoning": "<your analytical reasoning>"
        }
      ]
    }
  ],
  "disagreements": ["<metric_id>: <what you found vs what Tavily said>"],
  "reasoning_summary": "<overall category assessment>"
}

Rules:
1. Score EVERY metric for EVERY location. No skipping.
2. Scores are RELATIVE — best location gets highest score, others scaled accordingly.
3. ${identity.rule3}
4. ${identity.rule4 ?? 'Flag ANY data inconsistency between Tavily research and your knowledge.'}
5. Confidence below 0.5 means you could not find reliable data — flag it.`;
}

// ─── Response Parsing & Validation ──────────────────────────────

/**
 * Strip <think> blocks from reasoning model output (Perplexity, Grok).
 * Must be called BEFORE JSON.parse.
 */
export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/**
 * Parse and validate LLM evaluation response.
 * - Strips markdown fences and <think> tags
 * - Validates evaluations array structure
 * - Clamps scores to 0-100 and confidence to 0-1
 */
export function parseEvaluationResponse(
  rawText: string,
  category: string,
  modelName: string
): LLMEvaluationResponse {
  // Step 1: Strip <think> tags (reasoning models)
  let text = stripThinkTags(rawText);

  // Step 2: Try to parse JSON
  let evaluation: LLMEvaluationResponse;
  try {
    evaluation = JSON.parse(text);
  } catch {
    // Fallback: strip markdown fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      evaluation = JSON.parse(cleaned);
    } catch (parseErr) {
      throw new Error(`Failed to parse ${modelName} JSON response: ${parseErr instanceof Error ? parseErr.message : 'Unknown parse error'}`);
    }
  }

  // Step 3: Validate and backfill required fields
  if (!evaluation.category) evaluation.category = category;
  if (!evaluation.disagreements) evaluation.disagreements = [];
  if (!evaluation.reasoning_summary) evaluation.reasoning_summary = '';

  // Step 4: Validate evaluations array structure
  if (!Array.isArray(evaluation.evaluations)) {
    console.warn(`[${modelName}] evaluations is not an array — defaulting to empty`);
    evaluation.evaluations = [];
  }

  // Step 5: Clamp scores and confidence to valid ranges
  for (const cityEval of evaluation.evaluations) {
    if (typeof cityEval.overall_score === 'number') {
      cityEval.overall_score = Math.max(0, Math.min(100, Math.round(cityEval.overall_score)));
    }
    if (Array.isArray(cityEval.metric_scores)) {
      for (const ms of cityEval.metric_scores) {
        if (typeof ms.score === 'number') {
          ms.score = Math.max(0, Math.min(100, Math.round(ms.score)));
        }
        if (typeof ms.confidence === 'number') {
          ms.confidence = Math.max(0, Math.min(1, ms.confidence));
        }
      }
    }
  }

  return evaluation;
}

// ─── Fetch with Timeout ─────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 120_000; // 120s per LLM API call (Vercel Pro maxDuration=300s)

/**
 * Fetch with AbortController timeout and retry on 429/5xx.
 * Returns the Response object on success.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) return response;

      const status = response.status;
      if ((status === 429 || status >= 500) && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`[fetchWithRetry] ${status} on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`API returned ${status}: ${errText}`);
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort && attempt < maxRetries) {
        console.warn(`[fetchWithRetry] Timeout on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Request exhausted all retries');
}
