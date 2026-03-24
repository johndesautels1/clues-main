/**
 * /api/health — Minimal diagnostic endpoint.
 * Zero imports, zero dependencies. If this fails with FUNCTION_INVOCATION_FAILED,
 * the problem is Vercel deployment config, not code.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    node: process.version,
    env_keys: Object.keys(process.env).filter(k =>
      k.includes('API_KEY') || k.includes('SUPABASE') || k.includes('TAVILY')
    ),
    timestamp: new Date().toISOString(),
  });
}
