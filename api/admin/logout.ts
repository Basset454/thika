export default async function handler(req: any, res: any) {
  const isProduction = process.env.NODE_ENV === 'production';
  const clearCookieHeader = `trust_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`;

  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', req?.headers?.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Set-Cookie', clearCookieHeader);
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const payload = { success: true, message: 'Logged out successfully' };
  if (typeof res?.status === 'function') return res.status(200).json(payload);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookieHeader,
    },
  });
}
