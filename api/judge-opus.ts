/**
 * /api/judge-opus — Claude Opus 4.6 (Cristiano Judge)
 *
 * Reviews high-disagreement metrics (σ > 15) from the 5-LLM evaluation.
 * Opus is the JUDGE — no web search by design.
 * He reviews evidence from the 5 evaluating LLMs and renders verdicts.
 *
 * What Opus CAN do:
 *   - Upscore/downscore any metric's consensus score
 *   - Update legal vs enforcement scores (dual scoring)
 *   - Provide judge explanation per metric
 *   - Weigh which LLM to trust more for specific metrics
 *
 * What Opus CANNOT do:
 *   - Override confidence level (must match actual StdDev)
 *   - Override the computed winner (anti-hallucination safeguard force-corrects)
 *
 * Max 30 metrics per prompt to fit within token budget.
 *
 * Pricing (per 1M tokens):
 *   - Input:  $15.00
 *   - Output: $75.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  JudgeMetric,
  JudgeCategorySummary,
  JudgeReport,
  JudgeOpusRequest,
  MetricOverride,
} from '../src/types/judge';
// EvaluatorModel used for VALID_MODELS set below
import type { EvaluatorModel } from '../src/types/evaluation';
import { handleCors, stripThinkTags } from './_shared/evaluation-utils';

// ─── Cost tracking helper (server-side, writes to Supabase directly) ──
async function trackCost(entry: {
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

// ─── Opus Token Rates (per 1M tokens) ────────────────────────
const OPUS_INPUT_RATE = 15.00;
const OPUS_OUTPUT_RATE = 75.00;

function calculateOpusCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * OPUS_INPUT_RATE + outputTokens * OPUS_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Build user priorities section for judge prompt ──────────
function buildUserPrioritiesSection(
  dealbreakers?: Array<{ value: string; severity: number }>,
  requirements?: Array<{ value: string; importance: number }>
): string {
  if ((!dealbreakers || dealbreakers.length === 0) && (!requirements || requirements.length === 0)) {
    return '';
  }

  const severityLabel = (s: number) => s === 5 ? 'ABSOLUTE' : s === 4 ? 'STRONG' : 'MODERATE';
  const importanceLabel = (i: number) => i === 5 ? 'ESSENTIAL' : i === 4 ? 'VERY IMPORTANT' : 'IMPORTANT';

  let section = `
═══════════════════════════════════════════════════════════════
USER PRIORITIES (unique to this person — weight these in your analysis)
═══════════════════════════════════════════════════════════════
`;

  if (dealbreakers && dealbreakers.length > 0) {
    section += `\nDEALBREAKERS (things this user will NOT accept):\n`;
    for (const d of dealbreakers) {
      section += `  [${severityLabel(d.severity)}] ${d.value}\n`;
    }
  }

  if (requirements && requirements.length > 0) {
    section += `\nREQUIREMENTS (things this user MUST have):\n`;
    for (const r of requirements) {
      section += `  [${importanceLabel(r.importance)}] ${r.value}\n`;
    }
  }

  section += `
INSTRUCTION: When a disputed metric relates to one of these priorities,
give it extra scrutiny. If a dealbreaker metric scores below 40 for a
location, flag it in your categoryAnalysis. If a requirement metric
scores below 50, note the gap. These priorities are unique to this user
and should influence which categories you analyze most deeply.
`;

  return section;
}

// ─── Build the judge prompt ──────────────────────────────────
function buildJudgePrompt(
  metrics: JudgeMetric[],
  categoryResults: JudgeCategorySummary[],
  userContext: {
    globeRegion?: string;
    paragraphCount: number;
    completedModules: string[];
    tier: string;
    dealbreakers?: Array<{ value: string; severity: number }>;
    requirements?: Array<{ value: string; importance: number }>;
  }
): string {
  // Format metrics evidence
  const metricsEvidence = metrics.map(m => {
    const locationDetails = m.locations.map(loc => {
      const scores = loc.llmScores
        .map(s => `    ${s.model}: score=${s.score}, confidence=${s.confidence}\n      Justification: ${s.data_justification}\n      Source: ${s.source}\n      Reasoning: ${s.reasoning}`)
        .join('\n');
      return `  ${loc.location}, ${loc.country} (consensus mean=${loc.consensusMean}, median=${loc.consensusMedian}):\n${scores}`;
    }).join('\n');

    return `${m.metric_id}: ${m.description} [${m.category}] (σ=${m.stdDev.toFixed(1)}, ${m.contributingModels.length} LLMs)\n${locationDetails}`;
  }).join('\n\n');

  // Format category summaries
  const categorySummaries = categoryResults.map(c => {
    const scores = c.locationScores
      .map(s => `${s.location}: ${s.avgScore.toFixed(1)}`)
      .join(', ');
    return `${c.categoryName} (${c.metricCount} metrics, ${c.highDisagreementCount} disputed): ${scores}`;
  }).join('\n');

  return `You are Cristiano — CLUES Intelligence's Supreme Judge (Claude Opus 4.6).

You are reviewing ${metrics.length} metrics flagged for your review. Metrics are flagged when: (1) the 5 evaluating LLMs diverged significantly (σ > 15), OR (2) the metric is critical to this specific user (marked DEALBREAKER or REQUIREMENT). Your role is to render final verdicts.

You are the most powerful reasoning model available. You do NOT have web search — by design. Like a courtroom judge, you don't investigate. You review what the "attorneys" (the 5 LLMs) brought and render judgment.

═══════════════════════════════════════════════════════════════
USER CONTEXT
═══════════════════════════════════════════════════════════════
Globe Region: ${userContext.globeRegion ?? 'Not specified'}
Paragraphs Written: ${userContext.paragraphCount}/30
Completed Modules: ${userContext.completedModules.length}/23
Evaluation Tier: ${userContext.tier}
${buildUserPrioritiesSection(userContext.dealbreakers, userContext.requirements)}
═══════════════════════════════════════════════════════════════
CATEGORY SUMMARIES
═══════════════════════════════════════════════════════════════
${categorySummaries}

═══════════════════════════════════════════════════════════════
FLAGGED METRICS (${metrics.length} metrics — high disagreement OR user-critical)
═══════════════════════════════════════════════════════════════
For each metric below, you see every LLM's score, justification, source, and reasoning.
Your job: determine the CORRECT score based on the evidence presented.
Metrics marked DEALBREAKER or REQUIREMENT are critical to this user — give them extra weight.

${metricsEvidence}

═══════════════════════════════════════════════════════════════
YOUR VERDICT
═══════════════════════════════════════════════════════════════

For each disputed metric, you must:
1. Analyze which LLM(s) provided the strongest evidence
2. Identify which sources are most credible (prefer .gov, .edu, .org over blogs)
3. Check for recently passed laws or emerging trends that some LLMs caught
4. Render a final score (you may upscore or downscore)
5. Explain your reasoning

You MAY also provide:
- legal_score and enforcement_score if the metric has a legal vs lived-reality split
- trusted_model: which LLM you found most reliable for this specific metric

For the executive summary:
- Analyze ALL categories (not just disputed ones)
- Recommend the best location based on the MATH
- Provide key factors and future outlook

Return ONLY valid JSON matching this schema (no markdown fences):

{
  "summaryOfFindings": {
    "locationScores": [
      { "location": "<name>", "country": "<country>", "score": <0-100>, "trend": "improving|stable|declining" }
    ],
    "overallConfidence": "high|medium|low",
    "metricsReviewed": ${metrics.length},
    "metricsOverridden": <count of metrics you changed>
  },
  "categoryAnalysis": [
    {
      "categoryId": "<id>",
      "categoryName": "<name>",
      "locationAnalyses": [
        { "location": "<name>", "analysis": "<2-3 sentences>" }
      ],
      "trendNotes": "<emerging trends>"
    }
  ],
  "executiveSummary": {
    "recommendation": "<best location name or 'tie'>",
    "rationale": "<2-3 paragraphs>",
    "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>", "<factor 5>"],
    "futureOutlook": "<1-2 paragraph forecast>"
  },
  "metricOverrides": [
    {
      "metric_id": "<M1, M2, etc.>",
      "category": "<category>",
      "location": "<location>",
      "originalScore": <consensus score>,
      "judgeScore": <your adjusted score>,
      "judgeExplanation": "<your reasoning>",
      "trustedModel": "<which LLM was most reliable>",
      "legalScore": <optional>,
      "enforcementScore": <optional>
    }
  ],
  "confirmedMetrics": ["<metric_ids where you agree with consensus>"]
}

Rules:
1. You CANNOT override confidence levels — those are computed from StdDev.
2. Your recommendation MUST match the highest-scoring location. If you say "Lisbon" but Valencia has a higher score, the system will force-correct to Valencia.
3. Be specific — reference actual data points from the LLMs' evidence.
4. If an LLM cited a .gov or .edu source, weigh it more heavily.
5. If you detect a recently passed law that changes the landscape, note it in trendNotes.`;
}

// ─── Main Handler ──────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const body = req.body as JudgeOpusRequest;

  if (!body.sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }
  if (!body.metrics || !Array.isArray(body.metrics) || body.metrics.length === 0) {
    res.status(400).json({ error: 'Missing or empty metrics array' });
    return;
  }
  if (body.metrics.length > 30) {
    res.status(400).json({ error: `Too many metrics (${body.metrics.length}). Max 30 per judge call.` });
    return;
  }

  const startTime = Date.now();

  try {
    // ─── Anthropic Messages API (Opus) ───────────────────────
    const prompt = buildJudgePrompt(
      body.metrics,
      body.categoryResults || [],
      body.userContext || { paragraphCount: 0, completedModules: [], tier: 'discovery' }
    );

    // 120-second timeout to prevent hung requests from blocking the pipeline
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let anthropicResponse: Response;
    try {
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2024-10-22',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 32768,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: 'You are Cristiano, the CLUES Intelligence Supreme Judge. You render precise, evidence-based verdicts. Return only valid JSON. No markdown fences.',
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API returned ${anthropicResponse.status}: ${errText}`);
    }

    const anthropicResult = await anthropicResponse.json();
    const durationMs = Date.now() - startTime;

    // ─── Check for truncation ────────────────────────────────
    if (anthropicResult.stop_reason === 'max_tokens') {
      console.warn('[/api/judge-opus] Response truncated (hit max_tokens). May produce invalid JSON.');
    }

    // ─── Parse response ──────────────────────────────────────
    const contentBlocks = Array.isArray(anthropicResult.content) ? anthropicResult.content : [];
    const textBlock = contentBlocks.find((b: { type: string }) => b.type === 'text');
    const rawText = textBlock?.text ?? '';

    // Strip <think> tags (defensive — Opus may emit them in some configurations)
    const cleanedText = stripThinkTags(rawText);

    let judgeResponse: Omit<JudgeReport, 'reportId' | 'judgedAt'>;
    try {
      judgeResponse = JSON.parse(cleanedText);
    } catch {
      try {
        const cleaned = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        judgeResponse = JSON.parse(cleaned);
      } catch (retryErr) {
        throw new Error(
          `Failed to parse Opus judge JSON after cleanup: ${retryErr instanceof Error ? retryErr.message : 'Unknown parse error'}. Raw text starts with: ${rawText.slice(0, 200)}`
        );
      }
    }

    // ─── Assemble full report ────────────────────────────────
    const report: JudgeReport = {
      reportId: `CLUES-JDG-${new Date().toISOString().slice(0, 10)}-${body.sessionId.slice(0, 8)}-${Date.now()}`,
      summaryOfFindings: judgeResponse.summaryOfFindings ?? {
        locationScores: [],
        overallConfidence: 'low',
        metricsReviewed: body.metrics.length,
        metricsOverridden: 0,
      },
      categoryAnalysis: judgeResponse.categoryAnalysis ?? [],
      executiveSummary: judgeResponse.executiveSummary ?? {
        recommendation: '',
        rationale: '',
        keyFactors: [],
        futureOutlook: '',
      },
      metricOverrides: judgeResponse.metricOverrides ?? [],
      confirmedMetrics: judgeResponse.confirmedMetrics ?? [],
      judgedAt: new Date().toISOString(),
    };

    // ─── Validate trustedModel against EvaluatorModel union ──
    // MAINTENANCE: This array must match the EvaluatorModel union in
    // src/types/evaluation.ts exactly. The `satisfies` clause below
    // provides a compile-time check — if a model is listed here that
    // is NOT in EvaluatorModel, TypeScript will error. However, if a
    // new model is ADDED to EvaluatorModel, you must add it here too.
    const VALID_MODELS_LIST = [
      'claude-sonnet-4-6', 'gpt-5.4', 'gemini-3.1-pro-preview',
      'grok-4-1-fast-reasoning', 'sonar-reasoning-pro-high',
    ] as const satisfies readonly EvaluatorModel[];
    const VALID_MODELS: Set<string> = new Set(VALID_MODELS_LIST);
    for (const override of report.metricOverrides) {
      if (override.trustedModel && !VALID_MODELS.has(override.trustedModel as EvaluatorModel)) {
        // Opus returned a non-standard model name — clear it rather than propagate bad data
        delete (override as MetricOverride).trustedModel;
      }
    }

    // ─── Token usage ─────────────────────────────────────────
    const usage = anthropicResult.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const costUsd = calculateOpusCost(inputTokens, outputTokens);

    // Track cost (fire-and-forget — trackCost handles its own errors with console.warn)
    void trackCost({
      sessionId: body.sessionId,
      model: 'claude-opus-4-6',
      endpoint: '/api/judge-opus',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    });

    // ─── Return report + metadata ────────────────────────────
    res.status(200).json({
      report,
      metadata: {
        model: 'claude-opus-4-6',
        metricsReviewed: body.metrics.length,
        metricsOverridden: report.metricOverrides.length,
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/judge-opus] Opus 4.6 judge failed:', message);
    res.status(500).json({
      error: 'Opus judge failed',
      durationMs,
    });
  }
}
