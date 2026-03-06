/**
 * API Client
 * All calls to Vercel serverless functions go through here.
 * Handles retries, error formatting, and response typing.
 */

import type { ParagraphEntry, GeminiExtraction } from '../types';

// ─── Paragraphical Extraction ───────────────────────────────────
interface ParagraphicalResponse {
  extraction: GeminiExtraction;
  thinking_details: string[];
  metadata: {
    model: string;
    thinkingLevel: string;
    searchGrounded: boolean;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    durationMs: number;
    paragraphsProcessed: number;
    metricsExtracted: number;
    locationMetricsCount: number;
    countriesRecommended: number;
    citiesRecommended: number;
    thinkingSteps: number;
    timestamp: string;
  };
}

interface ParagraphicalError {
  error: string;
  detail?: string;
  durationMs?: number;
}

export async function extractParagraphical(params: {
  paragraphs: ParagraphEntry[];
  globeRegion: string;
  sessionId: string;
}): Promise<ParagraphicalResponse> {
  const response = await fetch('/api/paragraphical', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paragraphs: params.paragraphs.map(p => ({
        id: p.id,
        heading: p.heading,
        content: p.content,
      })),
      globeRegion: params.globeRegion,
      sessionId: params.sessionId,
      metadata: {
        timestamp: new Date().toISOString(),
        appVersion: '0.1.0',
      },
    }),
  });

  if (!response.ok) {
    const err: ParagraphicalError = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }));
    throw new Error(err.detail ?? err.error);
  }

  return response.json();
}
