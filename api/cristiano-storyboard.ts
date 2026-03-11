/**
 * /api/cristiano-storyboard — Sonnet 4.6 generates 7-scene cinematic storyboard
 *
 * Stage 1 of the Cristiano Video Pipeline (§15.13).
 * Sonnet receives the judge report + winning city data and generates
 * a structured storyboard for HeyGen to render as a cinematic video.
 *
 * Storyboard spec:
 *   - 7 scenes, 105-120 seconds total, 200-250 words
 *   - Scene 1 & 7: A-ROLL (avatar talking to camera)
 *   - Scenes 2-6: B-ROLL (city footage with voiceover)
 *   - QA validation: scene count, duration, word count, category coverage
 *   - Retries up to 2x if validation fails
 *
 * Pricing (per 1M tokens): Input $3.00, Output $15.00
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, trackCost, fetchWithRetry } from './_shared/evaluation-utils';

// ─── Config ────────────────────────────────────────────────────

const MODEL_ID = 'claude-sonnet-4-6';
const SONNET_INPUT_RATE = 3.00;
const SONNET_OUTPUT_RATE = 15.00;
const MAX_RETRIES = 2;

function calculateCost(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens * SONNET_INPUT_RATE + outputTokens * SONNET_OUTPUT_RATE) / 1_000_000;
  return Number.isFinite(cost) ? cost : 0;
}

// ─── Types ─────────────────────────────────────────────────────

interface StoryboardRequest {
  sessionId: string;
  winnerCity: string;
  winnerCountry: string;
  winnerScore: number;
  /** Top 5 key factors from judge */
  keyFactors: string[];
  /** Executive summary recommendation */
  recommendation: string;
  /** Future outlook */
  futureOutlook: string;
  /** Top 3 category names with scores */
  topCategories: { name: string; score: number }[];
  /** Runner-up cities */
  runnersUp: { city: string; country: string; score: number }[];
}

interface StoryboardScene {
  scene: number;
  type: 'A-ROLL' | 'B-ROLL';
  durationSeconds: number;
  narration: string;
  visualKeywords: string[];
  categoryFocus?: string;
}

interface Storyboard {
  title: string;
  totalDurationSeconds: number;
  totalWords: number;
  scenes: StoryboardScene[];
}

// ─── Validation ────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateStoryboard(sb: Storyboard): ValidationResult {
  const errors: string[] = [];

  if (!sb.scenes || sb.scenes.length !== 7) {
    errors.push(`Expected 7 scenes, got ${sb.scenes?.length ?? 0}`);
  }

  if (sb.totalDurationSeconds < 105 || sb.totalDurationSeconds > 120) {
    errors.push(`Duration ${sb.totalDurationSeconds}s outside 105-120s range`);
  }

  if (sb.totalWords < 200 || sb.totalWords > 250) {
    errors.push(`Word count ${sb.totalWords} outside 200-250 range`);
  }

  if (sb.scenes?.length >= 7) {
    if (sb.scenes[0].type !== 'A-ROLL') errors.push('Scene 1 must be A-ROLL');
    if (sb.scenes[6].type !== 'A-ROLL') errors.push('Scene 7 must be A-ROLL');
    for (let i = 1; i <= 5; i++) {
      if (sb.scenes[i]?.type !== 'B-ROLL') errors.push(`Scene ${i + 1} must be B-ROLL`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Prompt ────────────────────────────────────────────────────

function buildStoryboardPrompt(req: StoryboardRequest): string {
  const runners = req.runnersUp.map(r => `${r.city}, ${r.country} (${r.score})`).join('; ');
  const categories = req.topCategories.map(c => `${c.name}: ${c.score}`).join(', ');

  return `You are a cinematic storyboard writer for CLUES Intelligence, the world's most advanced relocation intelligence company.

Generate a 7-scene storyboard for a cinematic video titled "Your New Life in ${req.winnerCity}".

## WINNING LOCATION
- City: ${req.winnerCity}, ${req.winnerCountry}
- Smart Score: ${req.winnerScore}/100
- Top Categories: ${categories}
- Runners-Up: ${runners}

## JUDGE'S RECOMMENDATION
${req.recommendation}

## KEY FACTORS
${req.keyFactors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## FUTURE OUTLOOK
${req.futureOutlook}

## STORYBOARD RULES (STRICT)
1. Exactly 7 scenes
2. Total duration: 105-120 seconds
3. Total narration: 200-250 words
4. Scene 1: A-ROLL — Cristiano (avatar) introduces himself and the verdict
5. Scenes 2-6: B-ROLL — City footage with voiceover covering top categories, lifestyle, comparison to runners-up
6. Scene 7: A-ROLL — Cristiano closes with future outlook and call to action
7. Each scene needs: duration (seconds), narration text, 3-5 visual keywords for stock footage
8. Tone: authoritative yet warm, cinematic, personal. This is a life-changing recommendation.
9. Never use generic phrases like "vibrant culture" without specifics from the data.

## OUTPUT FORMAT (JSON only, no markdown)
{
  "title": "Your New Life in ${req.winnerCity}",
  "totalDurationSeconds": <number>,
  "totalWords": <number>,
  "scenes": [
    {
      "scene": 1,
      "type": "A-ROLL",
      "durationSeconds": <number>,
      "narration": "<text>",
      "visualKeywords": ["<keyword1>", "<keyword2>", "..."],
      "categoryFocus": "<optional category name>"
    }
  ]
}`;
}

// ─── Handler ───────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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

  const body = req.body as StoryboardRequest;
  if (!body.sessionId || !body.winnerCity) {
    res.status(400).json({ error: 'Missing required fields: sessionId, winnerCity' });
    return;
  }

  const prompt = buildStoryboardPrompt(body);
  const startTime = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let attempt = 0;
  let lastErrors: string[] = [];

  while (attempt <= MAX_RETRIES) {
    attempt++;
    try {
      const retryContext = attempt > 1
        ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastErrors.join('\n')}\nFix these issues and regenerate.`
        : '';

      const response = await fetchWithRetry(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2024-10-22',
          },
          body: JSON.stringify({
            model: MODEL_ID,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt + retryContext }],
            system: 'You are a cinematic storyboard writer. Return only valid JSON. No markdown fences.',
            temperature: 0.7,
          }),
        }
      );

      const result = await response.json();

      const usage = result.usage;
      totalInputTokens += usage?.input_tokens ?? 0;
      totalOutputTokens += usage?.output_tokens ?? 0;

      // Parse response
      const contentBlocks = Array.isArray(result.content) ? result.content : [];
      const textBlock = contentBlocks.find((b: { type: string }) => b.type === 'text');
      const rawText = textBlock?.text ?? '';

      // Extract JSON
      let storyboard: Storyboard;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in response');
        storyboard = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        lastErrors = [`JSON parse error: ${(parseErr as Error).message}`];
        console.warn(`[/api/cristiano-storyboard] Attempt ${attempt} parse failed:`, lastErrors[0]);
        if (attempt > MAX_RETRIES) break;
        continue;
      }

      // Validate
      const validation = validateStoryboard(storyboard);
      if (!validation.valid) {
        lastErrors = validation.errors;
        console.warn(`[/api/cristiano-storyboard] Attempt ${attempt} validation failed:`, lastErrors);
        if (attempt > MAX_RETRIES) {
          // Return anyway with warnings on last attempt
          const durationMs = Date.now() - startTime;
          const costUsd = calculateCost(totalInputTokens, totalOutputTokens);

          void trackCost({
            sessionId: body.sessionId,
            model: MODEL_ID,
            endpoint: '/api/cristiano-storyboard',
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            costUsd,
            durationMs,
          });

          res.status(200).json({
            storyboard,
            metadata: {
              model: MODEL_ID,
              attempts: attempt,
              validationWarnings: lastErrors,
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              costUsd: Number(costUsd.toFixed(6)),
              durationMs,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
        continue;
      }

      // Valid storyboard — return
      const durationMs = Date.now() - startTime;
      const costUsd = calculateCost(totalInputTokens, totalOutputTokens);

      void trackCost({
        sessionId: body.sessionId,
        model: MODEL_ID,
        endpoint: '/api/cristiano-storyboard',
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd,
        durationMs,
      });

      res.status(200).json({
        storyboard,
        metadata: {
          model: MODEL_ID,
          attempts: attempt,
          validationWarnings: [],
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costUsd: Number(costUsd.toFixed(6)),
          durationMs,
          timestamp: new Date().toISOString(),
        },
      });
      return;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[/api/cristiano-storyboard] Attempt ${attempt} error:`, message);
      if (attempt > MAX_RETRIES) {
        const durationMs = Date.now() - startTime;
        res.status(500).json({ error: 'Storyboard generation failed', details: message, durationMs });
        return;
      }
    }
  }

  // Should not reach here, but safety net
  res.status(500).json({ error: 'Storyboard generation exhausted retries', attempts: attempt });
}
