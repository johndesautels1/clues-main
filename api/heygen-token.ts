/**
 * /api/heygen-token — HeyGen Streaming Avatar Token Endpoint
 *
 * Fetches a session token from HeyGen's API so the frontend can
 * create a streaming avatar session without exposing the API key.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'HEYGEN_API_KEY not configured' });
    return;
  }

  try {
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HeyGen API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const token = data.data?.token || data.token;

    if (!token) {
      throw new Error('HeyGen did not return a token');
    }

    res.status(200).json({ token });
  } catch (err) {
    console.error('[/api/heygen-token] Failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to get HeyGen token', detail: message });
  }
}
