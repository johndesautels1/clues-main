/**
 * API Client
 * All calls to Vercel serverless functions go through here.
 * Handles retries, error formatting, and response typing.
 *
 * Updated for Gemini 3.1 Pro Preview:
 * - Response includes metrics array, location recommendations, thinking details
 * - Supports file uploads (medical records, financial spreadsheets) via fileUrls
 */

import type { ParagraphEntry, GeminiExtraction } from '../types';

// ─── Paragraphical Extraction ───────────────────────────────────
export interface ParagraphicalResponse {
  extraction: GeminiExtraction;
  metadata: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    costUsd: number;
    durationMs: number;
    paragraphsProcessed: number;
    metricsExtracted?: number;
    locationsRecommended?: {
      countries: number;
      cities: number;
      towns: number;
      neighborhoods: number;
    };
    hasThinkingDetails?: boolean;
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
  fileUrls?: string[];
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
      fileUrls: params.fileUrls,
      metadata: {
        timestamp: new Date().toISOString(),
        appVersion: '0.2.0',
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

// ─── File Upload for Gemini Ingestion ───────────────────────────
// Uploads large files (medical records P5, financial spreadsheets P8)
// to temporary storage and returns URLs for Gemini to ingest.
// Gemini 3.1 Pro Preview supports up to 100MB file uploads.
export async function uploadFileForGemini(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.fileUrl;
}
