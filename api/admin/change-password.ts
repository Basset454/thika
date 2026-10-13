import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { checkAdminAuth, setCustomAdminPassword, verifyAdminPassword } from './auth-utils.js';

export default async function changePasswordHandler(req: any, res: any) {
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
    const payload = { success: false, error: 'Method not allowed. Use POST.' };
    if (typeof res?.status === 'function') return res.status(405).json(payload);
    return new Response(JSON.stringify(payload), { status: 405 });
  }

  // Verify that caller is either authenticated or provides current password
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
  }

  const { currentPassword, newPassword } = body || {};
  const isTokenAuthenticated = checkAdminAuth(req);
  const isCurrentPasswordValid = currentPassword && verifyAdminPassword(currentPassword);

  if (!isTokenAuthenticated && !isCurrentPasswordValid) {
    const payload = { success: false, error: 'غير مصرح: يجب تسجيل الدخول أو إدخال كلمة المرور الحالية أولاً.' };
    if (typeof res?.status === 'function') return res.status(401).json(payload);
    return new Response(JSON.stringify(payload), { status: 401 });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    const payload = { success: false, error: 'كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل.' };
    if (typeof res?.status === 'function') return res.status(400).json(payload);
    return new Response(JSON.stringify(payload), { status: 400 });
  }

  const success = setCustomAdminPassword(newPassword.trim());
  if (!success) {
    const payload = { success: false, error: 'فشل حفظ كلمة المرور الجديدة على الخادم.' };
    if (typeof res?.status === 'function') return res.status(500).json(payload);
    return new Response(JSON.stringify(payload), { status: 500 });
  }

  const payload = {
    success: true,
    message: 'تم تحديث كلمة مرور الإدارة بنجاح.',
  };
  if (typeof res?.status === 'function') return res.status(200).json(payload);
  return new Response(JSON.stringify(payload), { status: 200 });
}
