/**
 * Olivia Tutor — Layer 3: Gemini 3.1 Pro Preview Escalation
 *
 * When the keyword detection engine (Layer 2) isn't confident enough,
 * this service fires a Gemini 3.1 Pro Preview API call to analyze
 * the paragraph text for coverage gaps.
 *
 * Model: Gemini 3.1 Pro Preview (see LLM Model Registry in README.md)
 *
 * NOT wired into the hook yet — this is a ready-to-go service for when
 * keyword detection proves insufficient. Wire it by calling
 * analyzeWithFlash() from useOliviaTutor when keyword confidence is low.
 */

import type { CoverageTarget } from '../data/paragraphTargets';

export interface FlashAnalysisResult {
  covered: string[];
  missing: string[];
  most_important_missing: string | null;
  interjection: string | null;
  confidence: number;
}

const FLASH_SYSTEM_PROMPT = `You are Olivia, an AI writing tutor for the CLUES Intelligence relocation platform.
You are analyzing a user's paragraph to detect which coverage targets they have addressed and which are missing.

INTERJECTION RULES:
- Reference something they ACTUALLY WROTE positively first
- Then ask about ONE missing target (the most important one)
- Phrase as a question or casual thought, never a command
- Maximum 2 sentences
- Be warm, knowledgeable, and brief
- Explain WHY this data point matters for finding their best city
- Never say "you forgot" or "you should" — say "have you thought about" or "quick thought"

RESPOND IN JSON ONLY (no markdown, no code fences):
{
  "covered": ["target_id_1", "target_id_2"],
  "missing": ["target_id_3", "target_id_4"],
  "most_important_missing": "target_id_3",
  "interjection": "string or null if nothing missing",
  "confidence": 0.0-1.0
}

Only return an interjection if confidence > 0.7 that the target is genuinely
missing (not just phrased differently than expected).`;

function buildUserPrompt(
  paragraphId: number,
  heading: string,
  targets: CoverageTarget[],
  userText: string,
): string {
  const targetList = targets
    .map(t => `- ${t.id}: ${t.label}`)
    .join('\n');

  return `Paragraph ${paragraphId}: "${heading}"

Coverage targets to check:
${targetList}

User wrote:
"${userText}"`;
}

/**
 * Analyze paragraph text using Gemini 3.1 Pro Preview.
 * Call this when keyword detection confidence is low.
 *
 * Requires GEMINI_API_KEY in environment (Vercel env or .env.local).
 * In production, this should go through a Vercel API route to keep the key server-side.
 */
export async function analyzeWithFlash(
  paragraphId: number,
  heading: string,
  targets: CoverageTarget[],
  userText: string,
): Promise<FlashAnalysisResult> {
  // TODO: In production, call /api/olivia-tutor instead of direct API call
  // This stub shows the exact payload shape for when we build the API route
  const payload = {
    system: FLASH_SYSTEM_PROMPT,
    user: buildUserPrompt(paragraphId, heading, targets, userText),
    model: 'gemini-3.1-pro-preview',
    temperature: 0.3,
    maxTokens: 300,
  };

  // For now, log the payload shape and return a no-op result
  // This gets replaced with an actual API call when Layer 3 is activated
  console.debug('[OliviaTutor] Flash analysis payload ready (not fired — Layer 3 not active):', {
    paragraphId,
    heading,
    targetCount: targets.length,
    wordCount: userText.trim().split(/\s+/).length,
    model: payload.model,
  });

  return {
    covered: [],
    missing: targets.map(t => t.id),
    most_important_missing: null,
    interjection: null,
    confidence: 0,
  };
}
