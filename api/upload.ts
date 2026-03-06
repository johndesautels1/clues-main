/**
 * /api/upload — File Upload for Gemini Ingestion
 *
 * Accepts file uploads (medical records P8, financial spreadsheets P11)
 * and stores them temporarily for Gemini 3.1 Pro Preview to ingest.
 * Gemini 3.1 Pro Preview supports up to 100MB file uploads.
 *
 * Files are uploaded to the Google Generative AI File API and a
 * temporary URI is returned for use in the paragraphical extraction call.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Maximum file size: 100MB (Gemini 3.1 Pro Preview limit)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed MIME types for Gemini ingestion
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',   // .xls
  'application/json',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const config = {
  api: {
    bodyParser: false, // We handle raw body for file uploads
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    // Read the raw body
    const chunks: Buffer[] = [];
    let totalSize = 0;

    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          reject(new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] ?? 'application/octet-stream';

    // Extract the actual content type from multipart or use direct
    const mimeType = contentType.split(';')[0].trim();

    // Validate file type
    if (!ALLOWED_TYPES.has(mimeType)) {
      res.status(400).json({
        error: 'Unsupported file type',
        detail: `Allowed types: ${Array.from(ALLOWED_TYPES).join(', ')}`,
      });
      return;
    }

    // Upload to Google Generative AI File API
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'X-Goog-Upload-Protocol': 'raw',
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Google File API error ${uploadResponse.status}: ${errText}`);
    }

    const uploadResult = await uploadResponse.json();
    const fileUri = uploadResult.file?.uri;

    if (!fileUri) {
      throw new Error('No file URI returned from Google File API');
    }

    res.status(200).json({
      fileUrl: fileUri,
      fileName: uploadResult.file?.name,
      mimeType: uploadResult.file?.mimeType,
      sizeBytes: buffer.length,
    });
  } catch (err) {
    console.error('[/api/upload] File upload failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'File upload failed', detail: message });
  }
}
