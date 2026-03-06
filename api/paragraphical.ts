/**
 * /api/paragraphical — Gemini 3.1 Pro Preview Reasoning Engine
 *
 * Receives the user's 24 paragraphs + globe region + optional file uploads.
 * Sends to Gemini 3.1 Pro Preview with:
 *   - thinking_level: "high" (deep multi-step reasoning)
 *   - include_thinking_details: true (returns internal reasoning chain)
 *   - tools: [{ google_search: {} }] (native 2026 search grounding)
 *
 * Returns:
 *   - 100-250 numbered metrics derived from paragraphs
 *   - Per-metric justifications (user_justification + data_justification + source)
 *   - Location recommendations (countries, cities, towns, neighborhoods)
 *   - Thinking details array for transparency UI
 *
 * Gemini 3.1 Pro Preview is the reasoning engine — it extracts, recommends,
 * AND scores at Discovery tier. Opus/Cristiano always judges afterward.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types (duplicated here because Vercel functions can't import from src/) ──

interface ParagraphInput {
  id: number;
  heading: string;
  content: string;
}

interface ParagraphicalRequest {
  paragraphs: ParagraphInput[];
  globeRegion: string;
  sessionId: string;
  fileUrls?: string[];  // URLs to uploaded files (medical records, spreadsheets)
  metadata?: {
    timestamp: string;
    appVersion: string;
  };
}

interface GeminiMetricObject {
  id: string;                      // "M1", "M2", etc.
  fieldId: string;                 // Machine-readable field ID
  description: string;             // "Average winter temperature 20-25C"
  category: string;                // "climate", "safety", "financial"...
  source_paragraph: number;        // Which paragraph (1-24)
  score: number;                   // 0-100
  user_justification: string;      // Why this matters to the user (traced to paragraph)
  data_justification: string;      // Real-world data backing the score
  source: string;                  // Data source attribution
  data_type: 'numeric' | 'boolean' | 'ranking' | 'index';
  research_query: string;          // What Tavily should search
  threshold?: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | [number, number];
    unit: string;
  };
}

interface LocationMetrics {
  location: string;
  country: string;
  location_type: 'city' | 'town' | 'neighborhood';
  parent?: string;
  overall_score: number;
  metrics: GeminiMetricObject[];
}

interface ThinkingStep {
  step: number;
  thought: string;
  conclusion?: string;
}

interface GeminiExtractionV2 {
  // Profile
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

  // Currency
  detected_currency: string;
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };

  // Metrics (THE KEY OUTPUT)
  metrics: GeminiMetricObject[];   // Minimum 100, up to 250

  // Location Recommendations with per-location metrics
  recommended_countries: {
    name: string;
    iso_code: string;
    reasoning: string;
    local_currency: string;
  }[];
  recommended_cities: LocationMetrics[];
  recommended_towns: LocationMetrics[];
  recommended_neighborhoods: LocationMetrics[];

  // Paragraph Summaries
  paragraph_summaries: {
    id: number;
    key_themes: string[];
    extracted_preferences: string[];
    metrics_derived: string[];     // ["M1", "M2", "M5"]
  }[];

  // Signals for Downstream
  dnw_signals: string[];
  mh_signals: string[];

  // Thinking Details (reasoning chain transparency)
  thinking_details?: ThinkingStep[];
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
    .map(p => `[P${p.id}: ${p.heading}]\n${p.content}`)
    .join('\n\n---\n\n');

  return `You are CLUES Intelligence's deep reasoning engine powered by Gemini 3.1 Pro Preview.

Your job is to perform UNPRECEDENTED DEPTH analysis of a user's 24 biographical paragraphs and:
1. EXTRACT 100-250 numbered, researchable metrics from their narrative
2. RECOMMEND the best country (up to 3), top 3 cities, top 3 towns, top 3 neighborhoods
3. SCORE every recommendation against every metric with justifications
4. PROVIDE source citations for every data point

Use your native Google Search grounding to verify real-world data for every metric. Do NOT guess — search for current 2026 data.

The user selected globe region: "${globeRegion}"

Here are their 24 paragraphs:

${paragraphText}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS — READ CAREFULLY
═══════════════════════════════════════════════════════════════

STEP 1: METRIC EXTRACTION
Convert every measurable, researchable preference into a discrete metric.
- Minimum 100 metrics, maximum 250
- Each metric must be:
  - Numbered (M1, M2, M3...)
  - Categorized (one of: climate, safety, healthcare, housing, transportation, legal, financial, lifescore, business, technology, education, family, dating, pets, food, sports, outdoor, arts, entertainment, spiritual)
  - Sourced to a specific paragraph (P1-P24)
  - Researchable (you can find real data for it)
  - Scorable (numeric, boolean, ranking, or index)

Example conversions:
  P3: "I hate humidity and want warm winters around 20-25C"
  --> M1: Average annual humidity below 60% [climate] [P3]
  --> M2: Average winter temperature 20-25C [climate] [P3]

  P11: "I need at least 100mbps for my remote work"
  --> M28: Average broadband speed above 100 Mbps [technology] [P11]

STEP 2: LOCATION RECOMMENDATIONS
Using Google Search grounding, identify:
- Top 1-3 countries that best match the metrics
- Top 3 cities in the winning country
- Top 3 towns in the winning city
- Top 3 neighborhoods in the winning town

IMPORTANT: Go beyond popular/obvious cities. Use your ARC-AGI-2 reasoning to discover EMERGING neighborhoods and towns that match unusual combinations of requirements. If the user has unique needs (e.g., "needs a town where pet capybaras are legal"), reason through that specifically.

STEP 3: SCORING WITH JUSTIFICATIONS
For each recommended location, score it against EVERY extracted metric. Each metric score MUST include:
- score (0-100, relative to other recommended locations)
- user_justification: "Matches P[N]: [specific quote or paraphrase from their paragraph]"
- data_justification: "[Real-world data point with year]"
- source: "[Source name]: [Specific report/dataset]"

STEP 4: CURRENCY HANDLING
Detect the user's home currency from their paragraph text. If they mention euros, use EUR. If dollars, detect USD/AUD/CAD from context. Never default to USD-only.

═══════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

{
  "demographic_signals": {
    "age": <number or null>,
    "gender": <string or null>,
    "household_size": <number or null>,
    "has_children": <boolean or null>,
    "has_pets": <boolean or null>,
    "employment_type": <string or null>,
    "income_bracket": <string or null>
  },
  "personality_profile": "<2-3 sentence behavioral/lifestyle summary>",
  "detected_currency": "<ISO currency code detected from paragraphs>",
  "budget_range": {
    "min": <number>,
    "max": <number>,
    "currency": "<user's home currency>"
  },
  "metrics": [
    {
      "id": "M1",
      "fieldId": "<machine_readable_id like climate_01_humidity>",
      "description": "<human readable metric description>",
      "category": "<one of the 20 categories>",
      "source_paragraph": <1-24>,
      "score": <0-100>,
      "user_justification": "Matches P[N]: <specific reference to user's paragraph>",
      "data_justification": "<real-world data backing this score>",
      "source": "<data source attribution>",
      "data_type": "<numeric|boolean|ranking|index>",
      "research_query": "<what Tavily should search for this metric>",
      "threshold": {
        "operator": "<gt|lt|eq|gte|lte|between>",
        "value": <number or [min, max]>,
        "unit": "<unit of measurement>"
      }
    }
  ],
  "recommended_countries": [
    {
      "name": "<country name>",
      "iso_code": "<ISO 3166-1 alpha-2>",
      "reasoning": "<why this country matches>",
      "local_currency": "<ISO currency code>"
    }
  ],
  "recommended_cities": [
    {
      "location": "<city name>",
      "country": "<country>",
      "location_type": "city",
      "overall_score": <0-100>,
      "metrics": [<same metric objects as above, scored for THIS city>]
    }
  ],
  "recommended_towns": [
    {
      "location": "<town name>",
      "country": "<country>",
      "location_type": "town",
      "parent": "<parent city>",
      "overall_score": <0-100>,
      "metrics": [<metric objects scored for THIS town>]
    }
  ],
  "recommended_neighborhoods": [
    {
      "location": "<neighborhood name>",
      "country": "<country>",
      "location_type": "neighborhood",
      "parent": "<parent town>",
      "overall_score": <0-100>,
      "metrics": [<metric objects scored for THIS neighborhood>]
    }
  ],
  "paragraph_summaries": [
    {
      "id": <1-24>,
      "key_themes": ["<theme1>", "<theme2>"],
      "extracted_preferences": ["<preference1>"],
      "metrics_derived": ["M1", "M2"]
    }
  ],
  "dnw_signals": ["<things user wants to avoid>"],
  "mh_signals": ["<things user needs/wants>"]
}

Rules:
1. MINIMUM 100 metrics. If paragraphs are sparse, extrapolate reasonable metrics from what IS stated.
2. Every metric score must have user_justification referencing a specific paragraph.
3. Every metric score must have data_justification with real 2026 data.
4. Cities are scored RELATIVE to each other, not in isolation.
5. Go beyond obvious cities — use deep reasoning to find emerging/hidden-gem locations.
6. Detect currency from context. If "euros" mentioned, currency is "EUR". If ambiguous, ask.
7. Only include paragraph_summaries for paragraphs with content.
8. Score each location's metrics independently — a metric may score 92 in City A but 45 in City B.`;
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
    // ─── Gemini 3.1 Pro Preview with Thinking + Search ──────────
    // Using the REST API directly for access to thinking_level and tools
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;

    const prompt = buildExtractionPrompt(filledParagraphs, body.globeRegion);

    // Build the request body with Gemini 3.1 Pro Preview parameters
    const geminiRequestBody = {
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 65536,  // Large output for 100+ metrics
        responseMimeType: 'application/json',
        thinking_level: 'high',             // Deep multi-step reasoning
        include_thinking_details: true,     // Return internal reasoning chain
      },
      tools: [{
        google_search: {},                  // Native 2026 search grounding
      }],
    };

    // If file URLs were provided (medical records, financial spreadsheets),
    // add them as file parts for Gemini's 100MB upload capability
    if (body.fileUrls && body.fileUrls.length > 0) {
      const fileParts = body.fileUrls.map(url => ({
        file_data: { file_uri: url },
      }));
      geminiRequestBody.contents[0].parts.push(...fileParts as any);
    }

    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      throw new Error(`Gemini API error ${geminiResponse.status}: ${errBody}`);
    }

    const geminiResult = await geminiResponse.json();
    const durationMs = Date.now() - startTime;

    // ─── Parse response ──────────────────────────────────────────
    const candidate = geminiResult.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates in Gemini response');
    }

    // Extract thinking details (reasoning chain) if available
    let thinkingDetails: ThinkingStep[] = [];
    if (candidate.thinking_details) {
      thinkingDetails = candidate.thinking_details;
    } else if (candidate.content?.parts) {
      // Some versions put thinking in separate parts
      const thinkingParts = candidate.content.parts.filter(
        (p: any) => p.thought || p.thinking
      );
      thinkingDetails = thinkingParts.map((p: any, i: number) => ({
        step: i + 1,
        thought: p.thought || p.thinking || p.text || '',
        conclusion: p.conclusion,
      }));
    }

    // Extract the main JSON output
    const textParts = candidate.content?.parts?.filter((p: any) => p.text);
    const rawText = textParts?.map((p: any) => p.text).join('') ?? '';

    let extraction: GeminiExtractionV2;
    try {
      extraction = JSON.parse(rawText);
    } catch {
      // Strip markdown fences if present
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extraction = JSON.parse(cleaned);
    }

    // Attach thinking details to extraction
    extraction.thinking_details = thinkingDetails;

    // ─── Validate required fields (defensive) ────────────────────
    if (!extraction.demographic_signals) extraction.demographic_signals = {};
    if (!extraction.metrics) extraction.metrics = [];
    if (!extraction.recommended_countries) extraction.recommended_countries = [];
    if (!extraction.recommended_cities) extraction.recommended_cities = [];
    if (!extraction.recommended_towns) extraction.recommended_towns = [];
    if (!extraction.recommended_neighborhoods) extraction.recommended_neighborhoods = [];
    if (!extraction.dnw_signals) extraction.dnw_signals = [];
    if (!extraction.mh_signals) extraction.mh_signals = [];
    if (!extraction.budget_range) extraction.budget_range = { min: 0, max: 0, currency: 'USD' };
    if (!extraction.detected_currency) extraction.detected_currency = extraction.budget_range.currency || 'USD';
    if (!extraction.personality_profile) extraction.personality_profile = '';
    if (!extraction.paragraph_summaries) extraction.paragraph_summaries = [];

    // ─── Token usage ─────────────────────────────────────────────
    const usage = geminiResult.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    const thinkingTokens = usage?.thinkingTokenCount ?? 0;
    const costUsd = calculateGeminiCost(inputTokens, outputTokens + thinkingTokens);

    // Track cost (non-blocking)
    trackCost({
      sessionId: body.sessionId,
      model: 'gemini-3.1-pro-preview',
      endpoint: '/api/paragraphical',
      inputTokens,
      outputTokens: outputTokens + thinkingTokens,
      costUsd,
      durationMs,
    }).catch(() => {});

    // ─── Return extraction + metadata ────────────────────────────
    res.status(200).json({
      extraction,
      metadata: {
        model: 'gemini-3.1-pro-preview',
        inputTokens,
        outputTokens,
        thinkingTokens,
        costUsd: Number(costUsd.toFixed(6)),
        durationMs,
        paragraphsProcessed: filledParagraphs.length,
        metricsExtracted: extraction.metrics.length,
        locationsRecommended: {
          countries: extraction.recommended_countries.length,
          cities: extraction.recommended_cities.length,
          towns: extraction.recommended_towns.length,
          neighborhoods: extraction.recommended_neighborhoods.length,
        },
        hasThinkingDetails: thinkingDetails.length > 0,
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
