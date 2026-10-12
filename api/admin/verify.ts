import { checkAdminAuth } from './auth-utils';

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', req?.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const isValid = checkAdminAuth(req);

  if (isValid) {
    const validPayload = { valid: true };
    if (typeof res?.status === 'function') return res.status(200).json(validPayload);
    return new Response(JSON.stringify(validPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const invalidPayload = { valid: false, error: 'Unauthorized' };
  if (typeof res?.status === 'function') return res.status(401).json(invalidPayload);
  return new Response(JSON.stringify(invalidPayload), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

