/**
 * /api/paragraphical — Gemini Extraction + Recommendation Endpoint
 *
 * Receives the user's 27 paragraphs + globe region.
 * Sends to Gemini 3.1 Pro for:
 *   1. Narrative-to-metric conversion (100-250 numbered metrics)
 *   2. Location recommendations (countries, cities, towns, neighborhoods)
 *   3. Structured signal extraction (demographics, DNW, MH, trade-offs)
 *
 * This is Gemini's Call 1 in the multi-call pipeline described in
 * PARAGRAPHICAL_ARCHITECTURE.md Section 5. Gemini extracts AND recommends
 * at Discovery tier. Opus/Cristiano always judges Gemini's output afterward.
 *
 * 27-paragraph pipeline:
 *   P1-P2:   Your Profile (demographics, income, timeline)
 *   P3:      Dealbreakers (hard elimination walls)
 *   P4:      Must Haves (non-negotiable requirements)
 *   P5:      Trade-offs (priority weighting signals)
 *   P6-P25:  Module Deep Dives (1:1 with 20 modules, Human Existence Flow)
 *   P26-P27: Your Vision (dream day + wildcard)
 *
 * Critical Rule: Every LLM call must track tokens and cost.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Types (duplicated here because Vercel functions can't import from src/) ──
interface ParagraphInput {
  id: number;
  heading: string;
  content: string;
  moduleId?: string;
}

interface ParagraphicalRequest {
  paragraphs: ParagraphInput[];
  globeRegion: string;
  sessionId: string;
  metadata?: {
    timestamp: string;
    appVersion: string;
  };
}

interface GeminiExtraction {
  // ─── Profile ───
  demographic_signals: {
    age?: number;
    gender?: string;
    household_size?: number;
    has_children?: boolean;
    has_pets?: boolean;
    employment_type?: string;
    income_bracket?: string;
  };
  personality_profile: string;

  // ─── Currency ───
  detected_currency: string;
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };

  // ─── Metrics (THE KEY OUTPUT) ───
  metrics: {
    id: string;
    description: string;
    category: string;
    source_paragraph: number;
    data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
    research_query: string;
    threshold?: {
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
      value: number | [number, number];
      unit: string;
    };
  }[];

  // ─── Location Recommendations ───
  recommended_countries: {
    name: string;
    iso_code: string;
    reasoning: string;
    local_currency: string;
  }[];

  recommended_cities: {
    name: string;
    country: string;
    reasoning: string;
  }[];

  recommended_towns: {
    name: string;
    parent_city: string;
    reasoning: string;
  }[];

  recommended_neighborhoods: {
    name: string;
    parent_town: string;
    reasoning: string;
  }[];

  // ─── Paragraph Summaries ───
  paragraph_summaries: {
    id: number;
    key_themes: string[];
    extracted_preferences: string[];
    metrics_derived: string[];
  }[];

  // ─── Signals for Downstream ───
  dnw_signals: string[];
  mh_signals: string[];
  tradeoff_signals: string[];
  module_relevance: Record<string, number>;
  globe_region_preference: string;
}

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

// ─── The Extraction + Recommendation Prompt ──────────────────────────
function buildExtractionPrompt(
  paragraphs: ParagraphInput[],
  globeRegion: string
): string {
  const paragraphText = paragraphs
    .filter(p => p.content.trim().length > 0)
    .map(p => {
      const moduleTag = p.moduleId ? ` [Module: ${p.moduleId}]` : '';
      return `[P${p.id}: ${p.heading}${moduleTag}]\n${p.content}`;
    })
    .join('\n\n---\n\n');

  return `You are CLUES Intelligence's Paragraphical engine. You have TWO jobs:

1. EXTRACT: Convert the user's narrative paragraphs into numbered, researchable metrics (minimum 100, up to 250).
2. RECOMMEND: Based on the extracted metrics and the user's globe region preference, recommend the best country (up to 3), top 3 cities in the winning country, top 3 towns in the winning city, and top 3 neighborhoods in the winning town.

The user selected globe region: "${globeRegion}"
This is a starting preference, not a hard constraint. If their dealbreakers eliminate all cities in this region, expand the search.

The 27 paragraphs follow this pipeline:
- P1-P2: User profile (demographics, income, currency, timeline)
- P3: Dealbreakers — HARD WALLS that eliminate cities (severity-5 = instant elimination)
- P4: Must Haves — non-negotiable requirements cities MUST meet
- P5: Trade-offs — priority weighting when cities score differently on different metrics
- P6-P25: Module Deep Dives — one per category in Human Existence Flow order (each has a moduleId)
- P26-P27: Vision — dream day narrative + wildcard catch-all

Here are their paragraphs:

${paragraphText}

CRITICAL RULES:
1. DETECT the user's currency from context (mentions of euros, pounds, dollars, baht, etc.). NEVER default to USD. If ambiguous, note it.
2. Every metric must be numbered (M1, M2, M3...), categorized (one of the 20 Human Existence Flow categories), and sourced to a paragraph (P1-P27).
3. P3 dealbreakers produce ELIMINATION metrics — prefix with "ELIMINATE IF" for severity-5 hard walls.
4. P4 must-haves produce REQUIREMENT metrics — prefix with "REQUIRE" for non-negotiables.
5. P5 trade-offs produce WEIGHTING SIGNALS (not scored metrics) — prefix with "WEIGHT:".
6. Each metric must include a research_query field — what Tavily should search to find real data.
7. Recommend locations based on the TOTALITY of metrics, not just one category.
8. Cities must be scored RELATIVE to each other, not in isolation.
9. Minimum 100 metrics even from sparse paragraphs. Extrapolate reasonable baseline metrics from context.
10. Only include paragraph_summaries for paragraphs that have content.

Return ONLY valid JSON matching this schema (no markdown fences, no explanation):

{
  "demographic_signals": {
    "age": <number or null>,
    "gender": <string or null>,
    "household_size": <number or null>,
    "has_children": <boolean or null>,
    "has_pets": <boolean or null>,
    "employment_type": <string or null: "remote", "local", "hybrid", "retired", "student", "entrepreneur", "unemployed">,
    "income_bracket": <string or null: "under_30k", "30k_60k", "60k_100k", "100k_200k", "over_200k">
  },
  "personality_profile": "<2-3 sentence behavioral/lifestyle summary>",
  "detected_currency": "<3-letter ISO code detected from user's text, e.g. EUR, GBP, USD, THB>",
  "budget_range": {
    "min": <monthly budget minimum in DETECTED currency>,
    "max": <monthly budget maximum in DETECTED currency>,
    "currency": "<same ISO code as detected_currency>"
  },
  "metrics": [
    {
      "id": "M1",
      "description": "<specific, measurable metric>",
      "category": "<one of: climate, safety, healthcare, housing, legal, financial, lifescore, business, technology, transportation, education, family, dating_social, food, sports, outdoor, arts, entertainment, spiritual, pets>",
      "source_paragraph": <1-27>,
      "data_type": "<numeric|boolean|ranking|index>",
      "research_query": "<what Tavily should search to find real data for this metric>",
      "threshold": {
        "operator": "<gt|lt|eq|gte|lte|between>",
        "value": <number or [min, max] for between>,
        "unit": "<celsius|percent|usd|eur|index|per_100k|mbps|minutes|km|sqm|boolean>"
      }
    }
  ],
  "recommended_countries": [
    {
      "name": "<country name>",
      "iso_code": "<2-letter ISO>",
      "reasoning": "<2-3 sentences why this country matches>",
      "local_currency": "<3-letter ISO>"
    }
  ],
  "recommended_cities": [
    {
      "name": "<city name>",
      "country": "<country name>",
      "reasoning": "<2-3 sentences>"
    }
  ],
  "recommended_towns": [
    {
      "name": "<town/district name>",
      "parent_city": "<city name>",
      "reasoning": "<1-2 sentences>"
    }
  ],
  "recommended_neighborhoods": [
    {
      "name": "<neighborhood name>",
      "parent_town": "<town name>",
      "reasoning": "<1-2 sentences>"
    }
  ],
  "paragraph_summaries": [
    {
      "id": <paragraph number 1-27>,
      "key_themes": [<2-4 key themes>],
      "extracted_preferences": [<specific preferences stated>],
      "metrics_derived": ["M1", "M3", "M7"]
    }
  ],
  "dnw_signals": [<strings from P3: things that ELIMINATE cities, phrased as negatives>],
  "mh_signals": [<strings from P4: things that are REQUIRED, phrased as positives>],
  "tradeoff_signals": [<strings from P5: priority trade-offs, e.g. "safety > cost of living">],
  "module_relevance": {
    "climate": <0.0-1.0>,
    "safety": <0.0-1.0>,
    "healthcare": <0.0-1.0>,
    "housing": <0.0-1.0>,
    "legal": <0.0-1.0>,
    "financial": <0.0-1.0>,
    "lifescore": <0.0-1.0>,
    "business": <0.0-1.0>,
    "technology": <0.0-1.0>,
    "transportation": <0.0-1.0>,
    "education": <0.0-1.0>,
    "family": <0.0-1.0>,
    "dating_social": <0.0-1.0>,
    "food": <0.0-1.0>,
    "sports": <0.0-1.0>,
    "outdoor": <0.0-1.0>,
    "arts": <0.0-1.0>,
    "entertainment": <0.0-1.0>,
    "spiritual": <0.0-1.0>,
    "pets": <0.0-1.0>
  },
  "globe_region_preference": "<user's geographic preference from globe + paragraphs>"
}`;
}

// ─── Gemini Token Rates (per 1M tokens) ─────────────────────────────
const GEMINI_INPUT_RATE = 1.25;
const GEMINI_OUTPUT_RATE = 10.00;

function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * GEMINI_INPUT_RATE + outputTokens * GEMINI_OUTPUT_RATE) / 1_000_000;
}

// ─── Main Handler ───────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  // Parse request
  const body = req.body as ParagraphicalRequest;

  if (!body.paragraphs || !Array.isArray(body.paragraphs)) {
    res.status(400).json({ error: 'Missing paragraphs array' });
    return;
  }

  if (!body.globeRegion) {
    res.status(400).json({ error: 'Missing globeRegion' });
    return;
  }

  if (!body.sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }

  // Filter to paragraphs with actual content
  const filledParagraphs = body.paragraphs.filter(p => p.content && p.content.trim().length > 0);

  if (filledParagraphs.length === 0) {
    res.status(400).json({ error: 'No paragraphs with content provided' });
    return;
  }

  const startTime = Date.now();

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-pro',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    });

    // Build the prompt
    const prompt = buildExtractionPrompt(filledParagraphs, body.globeRegion);

    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const durationMs = Date.now() - startTime;

    // Parse the JSON response
    let extraction: GeminiExtraction;
    try {
      extraction = JSON.parse(text);
    } catch {
      // If Gemini wrapped in markdown fences, strip them
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extraction = JSON.parse(cleaned);
    }

    // Validate required fields exist (defensive — don't crash on partial extraction)
    if (!extraction.demographic_signals) extraction.demographic_signals = {};
    if (!extraction.personality_profile) extraction.personality_profile = '';
    if (!extraction.detected_currency) extraction.detected_currency = 'USD';
    if (!extraction.budget_range) extraction.budget_range = { min: 0, max: 0, currency: extraction.detected_currency };
    if (!extraction.metrics) extraction.metrics = [];
    if (!extraction.recommended_countries) extraction.recommended_countries = [];
    if (!extraction.recommended_cities) extraction.recommended_cities = [];
    if (!extraction.recommended_towns) extraction.recommended_towns = [];
    if (!extraction.recommended_neighborhoods) extraction.recommended_neighborhoods = [];
    if (!extraction.paragraph_summaries) extraction.paragraph_summaries = [];
    if (!extraction.dnw_signals) extraction.dnw_signals = [];
    if (!extraction.mh_signals) extraction.mh_signals = [];
    if (!extraction.tradeoff_signals) extraction.tradeoff_signals = [];
    if (!extraction.module_relevance) extraction.module_relevance = {};
    if (!extraction.globe_region_preference) extraction.globe_region_preference = body.globeRegion;

    // Get token usage from response metadata
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    const costUsd = calculateGeminiCost(inputTokens, outputTokens);

    // Track cost (non-blocking — don't fail the request if cost tracking fails)
    trackCost({
      sessionId: body.sessionId,
      model: 'gemini-3.1-pro',
      endpoint: '/api/paragraphical',
      inputTokens,
      outputTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    // Return extraction + metadata
    res.status(200).json({
      extraction,
      metadata: {
        model: 'gemini-3.1-pro',
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        paragraphsProcessed: filledParagraphs.length,
        metricsExtracted: extraction.metrics.length,
        countriesRecommended: extraction.recommended_countries.length,
        citiesRecommended: extraction.recommended_cities.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('[/api/paragraphical] Gemini extraction failed:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      error: 'Gemini extraction failed',
      detail: message,
      durationMs,
    });
  }
}
