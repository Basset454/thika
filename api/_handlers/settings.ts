import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from './admin/_auth-utils.js';
import {
  isNeonConfigured,
  getStoreSettingsFromDb,
  updateStoreSettingsInDb,
  DEFAULT_STORE_SETTINGS,
  StoreSettingsRecord,
} from '../_db.js';

function loadLocalDiskSettings(): StoreSettingsRecord {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'settings.json'),
      path.resolve(process.cwd(), '..', 'data', 'settings.json'),
      path.resolve('/var/task', 'data', 'settings.json'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_STORE_SETTINGS, ...parsed };
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_STORE_SETTINGS;
}

function saveLocalDiskSettings(settings: StoreSettingsRecord) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'settings.json'), JSON.stringify(settings, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  }

  const method = (req?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  try {
    // -------------------------------------------------------------
    // GET /api/settings (Public - for Header Image and Storefront)
    // -------------------------------------------------------------
    if (method === 'GET') {
      if (isNeonConfigured()) {
        try {
          const settings = await getStoreSettingsFromDb();
          saveLocalDiskSettings(settings);
          const payload = { settings, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(200).json(payload);
          return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (err: any) {
          console.warn('Neon settings fetch failed, falling back to disk:', err?.message || err);
        }
      }

      const settings = loadLocalDiskSettings();
      const payload = { settings, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Mutations require admin authentication
    if (!checkAdminAuth(req)) {
      const unauth = { error: 'غير مصرّح: يلزم تسجيل دخول المسؤول لتعديل إعدادات المتجر.' };
      if (typeof res?.status === 'function') return res.status(401).json(unauth);
      return new Response(JSON.stringify(unauth), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    let body = req?.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (!body && typeof req?.json === 'function') {
      try {
        body = await req.json();
      } catch {
        // ignore
      }
    }

    // -------------------------------------------------------------
    // PUT / POST /api/settings (Update Storefront Settings)
    // -------------------------------------------------------------
    if (method === 'PUT' || method === 'POST') {
      const updates: Partial<StoreSettingsRecord> = {};

      if (body?.heroImageUrl) updates.heroImageUrl = String(body.heroImageUrl).trim();
      if (body?.heroBadgeText !== undefined) updates.heroBadgeText = String(body.heroBadgeText).trim();
      if (body?.heroTitlePrefix !== undefined) updates.heroTitlePrefix = String(body.heroTitlePrefix).trim();
      if (body?.heroTitleHighlight !== undefined) updates.heroTitleHighlight = String(body.heroTitleHighlight).trim();
      if (body?.heroDescription !== undefined) updates.heroDescription = String(body.heroDescription).trim();
      if (Array.isArray(body?.heroTypewriterPhrases)) {
        updates.heroTypewriterPhrases = body.heroTypewriterPhrases.map((p: any) => String(p).trim()).filter(Boolean);
      }
      if (body?.heroCtaPrimaryText !== undefined) updates.heroCtaPrimaryText = String(body.heroCtaPrimaryText).trim();
      if (body?.heroCtaPrimaryLink !== undefined) updates.heroCtaPrimaryLink = String(body.heroCtaPrimaryLink).trim();
      if (body?.heroCtaSecondaryText !== undefined) updates.heroCtaSecondaryText = String(body.heroCtaSecondaryText).trim();
      if (body?.heroCtaSecondaryLink !== undefined) updates.heroCtaSecondaryLink = String(body.heroCtaSecondaryLink).trim();

      if (isNeonConfigured()) {
        try {
          const updated = await updateStoreSettingsInDb(updates);
          saveLocalDiskSettings(updated);
          const ok = { success: true, settings: updated, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(200).json(ok);
          return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Neon settings update failed:', dbErr);
        }
      }

      const current = loadLocalDiskSettings();
      const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
      saveLocalDiskSettings(merged);

      const ok = { success: true, settings: merged, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(ok);
      return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const unsupp = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsupp);
    return new Response(JSON.stringify(unsupp), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Settings API error:', error);
    const err = { error: error?.message || 'حدث خطأ في معالجة إعدادات المتجر.' };
    if (typeof res?.status === 'function') return res.status(500).json(err);
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
