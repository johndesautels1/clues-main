/**
 * /api/paragraphical — Gemini Extraction Endpoint
 *
 * Receives the user's 27 paragraphs + globe region.
 * Sends to Gemini 3.1 Pro for structured narrative extraction.
 * Returns GeminiExtraction that feeds into the evaluation pipeline.
 *
 * This is Gemini's ONLY role: extract structured data from narrative.
 * It does NOT score cities or make final recommendations.
 *
 * Critical Rule #1: Gemini is an EXTRACTOR, not an evaluator.
 * Critical Rule #14: Every LLM call must track tokens and cost.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  metadata?: {
    timestamp: string;
    appVersion: string;
  };
}

interface GeminiExtraction {
  demographic_signals: {
    age?: number;
    gender?: string;
    household_size?: number;
    has_children?: boolean;
    has_pets?: boolean;
    employment_type?: string;
    income_bracket?: string;
  };
  dnw_signals: string[];
  mh_signals: string[];
  module_relevance: Record<string, number>;
  budget_range: {
    min: number;
    max: number;
    currency: string;
  };
  globe_region_preference: string;
  personality_profile: string;
  paragraph_summaries: {
    id: number;
    key_themes: string[];
    extracted_preferences: string[];
  }[];
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

// ─── The Extraction Prompt ──────────────────────────────────────────────
function buildExtractionPrompt(
  paragraphs: ParagraphInput[],
  globeRegion: string
): string {
  const paragraphText = paragraphs
    .filter(p => p.content.trim().length > 0)
    .map(p => `[P${p.id}: ${p.heading}]\n${p.content}`)
    .join('\n\n---\n\n');

  return `You are CLUES Intelligence's narrative extraction engine. Your ONLY job is to read a user's biographical paragraphs and extract structured data. You do NOT score cities, rank locations, or make recommendations. You extract signals.

The user selected globe region: "${globeRegion}"

Here are their paragraphs:

${paragraphText}

Extract the following structured data as JSON. Be thorough but only extract what the user actually stated or strongly implied. Do not hallucinate or infer beyond what's written.

Return ONLY valid JSON matching this exact schema (no markdown fences, no explanation):

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
  "dnw_signals": [<strings: things the user clearly dislikes, fears, or wants to avoid>],
  "mh_signals": [<strings: things the user clearly needs, wants, or prioritizes>],
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
    "dating": <0.0-1.0>,
    "pets": <0.0-1.0>,
    "food": <0.0-1.0>,
    "sports": <0.0-1.0>,
    "outdoor": <0.0-1.0>,
    "arts": <0.0-1.0>,
    "entertainment": <0.0-1.0>,
    "spiritual": <0.0-1.0>
  },
  "budget_range": {
    "min": <number: monthly budget minimum in USD, or 0 if not stated>,
    "max": <number: monthly budget maximum in USD, or 0 if not stated>,
    "currency": "USD"
  },
  "globe_region_preference": "<string: the user's stated or implied geographic preference>",
  "personality_profile": "<string: 2-3 sentence behavioral/lifestyle summary of this person>",
  "paragraph_summaries": [
    {
      "id": <paragraph number 1-27>,
      "key_themes": [<2-4 key themes extracted>],
      "extracted_preferences": [<specific preferences or requirements stated>]
    }
  ]
}

Rules:
1. Only include paragraph_summaries for paragraphs that have content (skip empty ones).
2. For module_relevance, score 0.0 if the user didn't mention anything related, up to 1.0 if it was a major theme.
3. dnw_signals should be phrased as negatives: "hates humidity", "avoids political instability", "can't handle extreme cold".
4. mh_signals should be phrased as positives: "needs fast internet", "wants walkable city", "requires English-speaking".
5. Do not score, rank, or recommend any cities or countries. That is not your job.
6. If the user didn't mention a demographic field, use null — do not guess.`;
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
        maxOutputTokens: 4096,
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
    if (!extraction.dnw_signals) extraction.dnw_signals = [];
    if (!extraction.mh_signals) extraction.mh_signals = [];
    if (!extraction.module_relevance) extraction.module_relevance = {};
    if (!extraction.budget_range) extraction.budget_range = { min: 0, max: 0, currency: 'USD' };
    if (!extraction.globe_region_preference) extraction.globe_region_preference = body.globeRegion;
    if (!extraction.personality_profile) extraction.personality_profile = '';
    if (!extraction.paragraph_summaries) extraction.paragraph_summaries = [];

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
