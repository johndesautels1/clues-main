/**
 * CLUES Intelligence — City Recommendation Orchestrator
 *
 * When a user skips the Paragraphical, Gemini never runs, so there are
 * no recommended_cities. This orchestrator fires ALL 5 LLMs in parallel
 * to recommend cities based on the user's questionnaire signals + globe region.
 *
 * Each LLM uses its web search capabilities to find real cities that match
 * the user's profile. Consensus is built from all 5 recommendations.
 *
 * This is NOT a lightweight Gemini-only call. This is the full 5-LLM
 * recommendation engine — the core tenet of CLUES.
 */

import type { CityCandidate, EvaluatorModel } from '../types/evaluation';
import type { ProfileSignal } from './answerAggregator';
import type { CompletionTier } from '../types';
import { getTierConfig } from './tierEngine';

// ─── Types ──────────────────────────────────────────────────────

export interface CityRecommendationRequest {
  sessionId: string;
  signals: ProfileSignal[];
  globeRegion: string;
  tier: CompletionTier;
  dnwSummary: string[];     // Human-readable dealbreaker summaries
  mhSummary: string[];      // Human-readable must-have summaries
  demographicSummary: Record<string, string | number | boolean>;
}

export interface LLMCityRecommendation {
  location: string;
  country: string;
  reasoning: string;
  confidence: number;       // 0-1
  strengths: string[];
  concerns: string[];
}

export interface LLMRecommendationResponse {
  recommended_cities: LLMCityRecommendation[];
  recommended_towns: LLMCityRecommendation[];
  reasoning_summary: string;
}

export interface RecommenderResult {
  model: EvaluatorModel;
  response: LLMRecommendationResponse | null;
  error: string | null;
  durationMs: number;
}

export interface CityRecommendationResult {
  /** Consensus cities — recommended by 2+ LLMs */
  cities: CityCandidate[];
  /** All individual LLM recommendations for transparency */
  individualResults: RecommenderResult[];
  /** How many LLMs succeeded */
  successCount: number;
  /** Cities with how many LLMs recommended them */
  cityVotes: { city: CityCandidate; votes: number; reasons: string[] }[];
  totalDurationMs: number;
}

// ─── LLM Endpoint Map ───────────────────────────────────────────

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const vercelUrl = import.meta.env.VITE_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'http://localhost:3000';
}

const RECOMMEND_ENDPOINTS: Record<EvaluatorModel, string> = {
  'claude-sonnet-4-6': '/api/recommend-sonnet',
  'gpt-5.4': '/api/recommend-gpt54',
  'gemini-3.1-pro-preview': '/api/recommend-gemini',
  'grok-4-1-fast-reasoning': '/api/recommend-grok',
  'sonar-reasoning-pro-high': '/api/recommend-perplexity',
};

// Available recommender models (used dynamically by orchestration config)
export const ALL_RECOMMENDERS: EvaluatorModel[] = [
  'claude-sonnet-4-6',
  'gpt-5.4',
  'gemini-3.1-pro-preview',
  'grok-4-1-fast-reasoning',
  'sonar-reasoning-pro-high',
];

/** Timeout for city recommendation calls (120s — Gemini thinking_level:high needs headroom) */
const RECOMMEND_TIMEOUT_MS = 120_000;

/** Minimum LLMs needed for a usable recommendation set */
const MIN_USABLE_RECOMMENDERS = 2;

// ─── Main Orchestrator ──────────────────────────────────────────

/**
 * Fire all available LLMs (based on tier) to recommend cities.
 *
 * Globe region + questionnaire signals → 5 LLMs each recommend 5-10 cities.
 * Consensus: cities recommended by 2+ LLMs become CityCandidate[].
 */
export async function recommendCities(
  request: CityRecommendationRequest
): Promise<CityRecommendationResult> {
  const startTime = Date.now();

  // Use tier config to determine which LLMs fire
  const tierConfig = getTierConfig(request.tier);
  const modelsToUse = tierConfig.llmModels.filter(
    (m): m is EvaluatorModel => m in RECOMMEND_ENDPOINTS
  );

  // Fire all LLMs in parallel
  const results = await Promise.all(
    modelsToUse.map(model => recommendWithModel(model, request))
  );

  const successResults = results.filter(r => r.response !== null);
  const successCount = successResults.length;

  // Build consensus — count votes per city
  const cityVoteMap = new Map<string, { city: CityCandidate; votes: number; reasons: string[] }>();

  for (const result of successResults) {
    if (!result.response) continue;

    for (const rec of result.response.recommended_cities) {
      const key = normalizeCityKey(rec.location, rec.country);
      const existing = cityVoteMap.get(key);

      if (existing) {
        existing.votes++;
        existing.reasons.push(`${result.model}: ${rec.reasoning}`);
      } else {
        cityVoteMap.set(key, {
          city: {
            location: rec.location,
            country: rec.country,
            location_type: 'city',
          },
          votes: 1,
          reasons: [`${result.model}: ${rec.reasoning}`],
        });
      }
    }

    // Towns get added as well
    for (const rec of result.response.recommended_towns) {
      const key = normalizeCityKey(rec.location, rec.country);
      const existing = cityVoteMap.get(key);

      if (existing) {
        existing.votes++;
        existing.reasons.push(`${result.model}: ${rec.reasoning}`);
      } else {
        cityVoteMap.set(key, {
          city: {
            location: rec.location,
            country: rec.country,
            location_type: 'town',
          },
          votes: 1,
          reasons: [`${result.model}: ${rec.reasoning}`],
        });
      }
    }
  }

  // Sort by votes descending, then take top candidates
  const cityVotes = [...cityVoteMap.values()].sort((a, b) => b.votes - a.votes);

  // Consensus threshold: recommended by at least 2 LLMs (or 1 if only 1-2 LLMs fired)
  const minVotes = successCount <= 2 ? 1 : MIN_USABLE_RECOMMENDERS;
  const consensusCities = cityVotes
    .filter(cv => cv.votes >= minVotes)
    .slice(0, 15) // Cap at 15 candidate cities
    .map(cv => cv.city);

  // If consensus produced nothing (edge case), take top 5 by any vote
  const cities = consensusCities.length > 0
    ? consensusCities
    : cityVotes.slice(0, 5).map(cv => cv.city);

  return {
    cities,
    individualResults: results,
    successCount,
    cityVotes,
    totalDurationMs: Date.now() - startTime,
  };
}

// ─── Single LLM Recommendation ─────────────────────────────────

async function recommendWithModel(
  model: EvaluatorModel,
  request: CityRecommendationRequest
): Promise<RecommenderResult> {
  const startTime = Date.now();
  const endpoint = `${getBaseUrl()}${RECOMMEND_ENDPOINTS[model]}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RECOMMEND_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${model} returned ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Validate response structure before using
    const recommendations = data.recommendations;
    const validatedResponse: LLMRecommendationResponse = {
      recommended_cities: Array.isArray(recommendations?.recommended_cities) ? recommendations.recommended_cities : [],
      recommended_towns: Array.isArray(recommendations?.recommended_towns) ? recommendations.recommended_towns : [],
      reasoning_summary: recommendations?.reasoning_summary ?? '',
    };

    return {
      model,
      response: validatedResponse,
      error: null,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CityRecommender] ${model} failed:`, message);

    return {
      model,
      response: null,
      error: message,
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────

/** Normalize city name for dedup across LLMs (case-insensitive, trimmed) */
function normalizeCityKey(location: string, country: string): string {
  return `${location.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

/**
 * Build human-readable signal summaries for the LLM prompt.
 * Groups signals by module and summarizes key preferences.
 */
export function buildSignalSummary(signals: ProfileSignal[]): {
  dnwSummary: string[];
  mhSummary: string[];
  demographicSummary: Record<string, string | number | boolean>;
  preferenceSummary: string[];
} {
  const dnwSummary: string[] = [];
  const mhSummary: string[] = [];
  const demographicSummary: Record<string, string | number | boolean> = {};
  const preferenceSummary: string[] = [];

  for (const signal of signals) {
    switch (signal.source) {
      case 'dnw':
        if (signal.value >= 0.6) { // Severity 3+
          dnwSummary.push(`${signal.key}: severity ${signal.rawValue}/5`);
        }
        break;
      case 'mh':
        if (signal.value >= 0.6) { // Importance 3+
          mhSummary.push(`${signal.key}: importance ${signal.rawValue}/5`);
        }
        break;
      case 'demographics':
        if (signal.key !== 'demo_baseline') {
          demographicSummary[signal.key.replace('demo_', '')] = signal.rawValue;
        }
        break;
      default:
        if (signal.value >= 0.6 || signal.value <= 0.3) {
          preferenceSummary.push(
            `${signal.moduleId}/${signal.key}: ${signal.rawValue} (strength: ${(signal.value * 100).toFixed(0)}%)`
          );
        }
        break;
    }
  }

  return { dnwSummary, mhSummary, demographicSummary, preferenceSummary };
}
