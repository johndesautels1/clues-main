/**
 * CLUES Main - Core type definitions
 * All shared types for the evaluation pipeline, user data, and UI state.
 * Single source of truth — import from here.
 */

// ─── Module Status ───────────────────────────────────────────────
export type ModuleStatus = 'locked' | 'not_started' | 'in_progress' | 'completed' | 'recommended';

// ─── Progressive Confidence Tiers ────────────────────────────────
export type CompletionTier =
  | 'discovery'      // Paragraphical only (~35%)
  | 'exploratory'    // + Demographics (~45%)
  | 'filtered'       // + DNWs (~60%)
  | 'evaluated'      // + MHs (~75%)
  | 'validated'      // + General Questions (~90%)
  | 'precision';     // + Mini Modules (90-100%)

// ─── Globe / Region ──────────────────────────────────────────────
export interface GlobeSelection {
  region: string;          // "Southern Europe / Mediterranean"
  lat: number;
  lng: number;
  zoomLevel: number;       // 1=region, 2=country, 3=city
}

// ─── Paragraphical ───────────────────────────────────────────────
export interface ParagraphEntry {
  id: number;              // 1-24
  heading: string;         // "Who You Are"
  content: string;         // User's free-form text
  updatedAt?: string;      // ISO timestamp
}

export interface ParagraphicalInput {
  paragraphs: ParagraphEntry[];
  globeRegion: string;
  metadata: {
    timestamp: string;
    appVersion: string;
  };
}

// ─── Gemini Extraction ───────────────────────────────────────────
export interface GeminiExtraction {
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

// ─── Questionnaire Sub-Sections ──────────────────────────────────
export type SubSection = 'demographics' | 'dnw' | 'mh' | 'general';
export type SubSectionStatus = Record<SubSection, ModuleStatus>;

export interface DemographicAnswers {
  [questionId: string]: string | number | boolean;
}

export interface DNWAnswer {
  questionId: string;
  value: string;
  severity: 1 | 2 | 3 | 4 | 5;  // Mild → Absolute Dealbreaker
}

export interface MHAnswer {
  questionId: string;
  value: string;
  importance: 1 | 2 | 3 | 4 | 5; // Nice to Have → Essential
}

export type DNWAnswers = DNWAnswer[];
export type MHAnswers = MHAnswer[];
export type GeneralAnswers = Record<string, string | number>;

// ─── Evaluation Context (fed to LLMs) ───────────────────────────
export interface EvaluationContext {
  tier: CompletionTier;
  confidence: number;              // 0-100
  paragraphical?: GeminiExtraction;
  demographics?: DemographicAnswers;
  dnw?: DNWAnswers;
  mh?: MHAnswers;
  generalQuestions?: GeneralAnswers;
  completedModules?: string[];
  globeRegion?: string;
}

// ─── Evaluation Results ──────────────────────────────────────────
export interface LocationRecommendation {
  name: string;
  country: string;
  score: number;           // 0-100
  confidence: number;      // 0-100
  highlights: string[];
  warnings: string[];
  paragraphLinks: number[]; // Which paragraphs support this
}

export type CountryRecommendation = LocationRecommendation;
export type CityRecommendation = LocationRecommendation & { metro?: string };
export type TownRecommendation = LocationRecommendation & { parentCity: string };
export type NeighborhoodRecommendation = LocationRecommendation & { parentTown: string };

export interface EvaluationResult {
  tier: CompletionTier;
  confidence: number;
  countries: CountryRecommendation[];
  cities: CityRecommendation[];
  towns: TownRecommendation[];
  neighborhoods: NeighborhoodRecommendation[];
  nextSteps: { action: string; confidenceGain: number }[];
  llmsUsed: string[];
  judgeUsed: boolean;
  dataCompleteness: Record<string, boolean>;
}

// ─── Cost Tracking ──────────────────────────────────────────
export type CostProvider =
  | 'claude-sonnet-4-5'
  | 'gpt-4o'
  | 'gemini-3.1-pro'
  | 'grok-4'
  | 'perplexity-sonar'
  | 'claude-opus-4-5'
  | 'tavily'
  | 'gamma'
  | 'olivia'
  | 'tts-elevenlabs'
  | 'tts-openai'
  | 'avatar-heygen'
  | 'avatar-d-id'
  | 'avatar-simli'
  | 'avatar-replicate'
  | 'kling-ai';

export interface CostEntry {
  id: string;
  session_id: string;
  model: CostProvider;
  endpoint: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  duration_ms: number | null;
  created_at: string;
  tier?: CompletionTier;
}

export interface ProviderCostSummary {
  provider: CostProvider;
  label: string;
  icon: string;
  total_cost: number;
  percentage: number;
  call_count: number;
}

export interface CostSummary {
  grand_total: number;
  total_sessions: number;
  total_calls: number;
  avg_cost_per_session: number;
  by_provider: ProviderCostSummary[];
  by_tier: Record<CompletionTier, number>;
  profitability: {
    avg_cost_per_session: number;
    breakeven_20_margin: number;
    suggested_50_margin: number;
    suggested_100_margin: number;
  };
}

export interface SessionCostRow {
  session_id: string;
  tier: CompletionTier;
  total_cost: number;
  call_count: number;
  created_at: string;
  description: string;
}

// ─── Auth ────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;           // Supabase auth.users UUID
  email: string;
  displayName?: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'github' | 'anonymous';
  createdAt: string;
}

// ─── User Session State ──────────────────────────────────────────
export interface UserSession {
  id: string;
  userId?: string;       // Supabase auth.users UUID — links session to account
  email?: string;
  globe: GlobeSelection | null;
  paragraphical: {
    status: ModuleStatus;
    paragraphs: ParagraphEntry[];
    extraction?: GeminiExtraction;
  };
  mainModule: {
    subSectionStatus: SubSectionStatus;
    demographics?: DemographicAnswers;
    dnw?: DNWAnswers;
    mh?: MHAnswers;
    generalAnswers?: GeneralAnswers;
  };
  completedModules: string[];
  currentTier: CompletionTier;
  confidence: number;
  evaluation?: EvaluationResult;
  createdAt: string;
  updatedAt: string;
}
