/**
 * /api/health — Minimal diagnostic endpoint.
 * Zero imports, zero dependencies. If this fails with FUNCTION_INVOCATION_FAILED,
 * the problem is Vercel deployment config, not code.
 */
export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    node: process.version,
    env_keys: Object.keys(process.env).filter(k =>
      k.includes('API_KEY') || k.includes('SUPABASE') || k.includes('TAVILY')
    ),
    timestamp: new Date().toISOString(),
  });
}
