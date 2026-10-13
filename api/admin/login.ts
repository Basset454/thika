import { isAuthConfigured, verifyAdminPassword, createSessionToken } from './auth-utils.js';

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', req?.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    const errPayload = { error: 'Method not allowed. Use POST.' };
    if (typeof res?.status === 'function') return res.status(405).json(errPayload);
    return new Response(JSON.stringify(errPayload), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fail closed if admin secret is not configured
  if (!isAuthConfigured()) {
    const unconfiguredPayload = {
      success: false,
      error: 'Authentication is not configured on the server. Please set ADMIN_PASSWORD in environment variables.',
    };
    if (typeof res?.status === 'function') return res.status(503).json(unconfiguredPayload);
    return new Response(JSON.stringify(unconfiguredPayload), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
  } else if (!body && typeof req.json === 'function') {
    try {
      body = await req.json();
    } catch {
      // ignore
    }
  }

  const password = body?.password;
  if (!password || typeof password !== 'string') {
    const missingPayload = { success: false, error: 'Password is required' };
    if (typeof res?.status === 'function') return res.status(400).json(missingPayload);
    return new Response(JSON.stringify(missingPayload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (verifyAdminPassword(password)) {
    const token = createSessionToken();
    if (!token) {
      const errPayload = { success: false, error: 'Failed to create session token' };
      if (typeof res?.status === 'function') return res.status(500).json(errPayload);
      return new Response(JSON.stringify(errPayload), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieHeader = `trust_admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${isProduction ? '; Secure' : ''}`;

    if (res?.setHeader) {
      res.setHeader('Set-Cookie', cookieHeader);
    }

    const successPayload = {
      success: true,
      token,
      message: 'Authenticated successfully',
    };

    if (typeof res?.status === 'function') return res.status(200).json(successPayload);
    return new Response(JSON.stringify(successPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
      },
    });
  }

  const invalidPayload = {
    success: false,
    error: 'Invalid admin credentials',
  };

  if (typeof res?.status === 'function') return res.status(401).json(invalidPayload);
  return new Response(JSON.stringify(invalidPayload), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

