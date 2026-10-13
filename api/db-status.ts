import { checkNeonHealth, isNeonConfigured, getDatabaseUrl } from './_db.js';

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req?.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  try {
    const health = await checkNeonHealth();
    const rawUrl = getDatabaseUrl();
    let maskedUrl = '';
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        maskedUrl = `${parsed.protocol}//${parsed.username}:••••@${parsed.host}${parsed.pathname}`;
      } catch {
        maskedUrl = 'postgres://••••:••••@neon.tech/...';
      }
    }

    const payload = {
      isConfigured: isNeonConfigured(),
      connected: health.connected,
      provider: health.provider,
      count: health.count,
      message: health.message,
      maskedUrl: maskedUrl || undefined,
      error: health.error,
    };

    if (typeof res?.status === 'function') return res.status(200).json(payload);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const errPayload = {
      isConfigured: isNeonConfigured(),
      connected: false,
      provider: 'Neon (PostgreSQL)',
      count: 0,
      message: 'Failed to query Neon database health',
      error: error?.message || String(error),
    };
    if (typeof res?.status === 'function') return res.status(500).json(errPayload);
    return new Response(JSON.stringify(errPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
