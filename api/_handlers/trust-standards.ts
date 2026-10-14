import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from './admin/_auth-utils.js';
import {
  isNeonConfigured,
  getTrustStandardsFromDb,
  updateTrustStandardsInDb,
  DEFAULT_TRUST_STANDARDS,
  TrustStandardsRecord,
} from '../_db.js';

function loadLocalDiskTrustStandards(): TrustStandardsRecord {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'trust-standards.json'),
      path.resolve(process.cwd(), '..', 'data', 'trust-standards.json'),
      path.resolve('/var/task', 'data', 'trust-standards.json'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_TRUST_STANDARDS, ...parsed };
        }
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_TRUST_STANDARDS;
}

function saveLocalDiskTrustStandards(standards: TrustStandardsRecord) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'trust-standards.json'), JSON.stringify(standards, null, 2), 'utf8');
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

  let urlParams: URLSearchParams | null = null;
  const rawUrl = req?.url || '';
  try {
    const parsedUrl = new URL(rawUrl, `http://${req?.headers?.host || 'localhost'}`);
    urlParams = parsedUrl.searchParams;
  } catch {
    // ignore
  }

  const getQueryParam = (name: string): string | undefined => {
    if (req?.query && req.query[name] !== undefined) {
      return String(req.query[name]);
    }
    if (urlParams) {
      const val = urlParams.get(name);
      if (val !== null) return val;
    }
    return undefined;
  };

  try {
    // -------------------------------------------------------------
    // GET /api/trust-standards (Public + Admin mode)
    // -------------------------------------------------------------
    if (method === 'GET') {
      const wantsAdmin = getQueryParam('admin') === 'true' || getQueryParam('all') === 'true';
      const isAdmin = wantsAdmin ? checkAdminAuth(req) : false;

      let standards: TrustStandardsRecord = DEFAULT_TRUST_STANDARDS;

      if (isNeonConfigured()) {
        try {
          standards = await getTrustStandardsFromDb();
          saveLocalDiskTrustStandards(standards);
        } catch (err: any) {
          console.warn('Neon trust standards fetch failed, falling back to disk:', err?.message || err);
          standards = loadLocalDiskTrustStandards();
        }
      } else {
        standards = loadLocalDiskTrustStandards();
      }

      // If requested by a visitor (not authenticated admin), filter hidden items
      if (!isAdmin) {
        if (!standards.enabled) {
          const disabledPayload = {
            standards: {
              ...standards,
              enabled: false,
              items: [],
            },
            source: isNeonConfigured() ? 'neon_postgresql' : 'local_disk',
          };
          if (typeof res?.status === 'function') return res.status(200).json(disabledPayload);
          return new Response(JSON.stringify(disabledPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const visibleItems = (standards.items || [])
          .filter((item) => !item.isHidden)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        standards = {
          ...standards,
          items: visibleItems,
        };
      }

      const payload = { standards, source: isNeonConfigured() ? 'neon_postgresql' : 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // Strict Authorization: Mutations require Admin Authentication
    // -------------------------------------------------------------
    if (!checkAdminAuth(req)) {
      const unauth = { error: 'غير مصرّح: يلزم تسجيل دخول المسؤول لإدارة معايير الثقة والخامات.' };
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
    // PUT / POST /api/trust-standards (Update Entire Section)
    // -------------------------------------------------------------
    if (method === 'PUT' || method === 'POST') {
      if (!body || typeof body !== 'object') {
        const badReq = { error: 'بيانات غير صالحة لمعايير الثقة.' };
        if (typeof res?.status === 'function') return res.status(400).json(badReq);
        return new Response(JSON.stringify(badReq), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const cleanItems = Array.isArray(body.items)
        ? body.items.map((it: any, idx: number) => ({
            id: String(it.id || `std-${Date.now()}-${idx}`),
            title: String(it.title || '').trim(),
            subtitle: it.subtitle ? String(it.subtitle).trim() : undefined,
            description: String(it.description || '').trim(),
            image: it.image ? String(it.image).trim() : undefined,
            quote: it.quote ? String(it.quote).trim() : undefined,
            points: Array.isArray(it.points)
              ? it.points
                  .filter((p: any) => p && String(p.title || '').trim())
                  .map((p: any, pIdx: number) => ({
                    id: String(p.id || `pt-${idx}-${pIdx}`),
                    title: String(p.title || '').trim(),
                    description: p.description ? String(p.description).trim() : undefined,
                    badge: p.badge ? String(p.badge).trim() : undefined,
                  }))
              : [],
            linkedProductIds: Array.isArray(it.linkedProductIds)
              ? it.linkedProductIds.map((pid: any) => String(pid).trim()).filter(Boolean)
              : [],
            order: typeof it.order === 'number' ? it.order : idx + 1,
            isHidden: Boolean(it.isHidden),
            createdAt: it.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        : [];

      const payloadToSave: TrustStandardsRecord = {
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
        badgeText: body.badgeText ? String(body.badgeText).trim() : 'معايير الثقة · الجودة والحرفية',
        title: body.title ? String(body.title).trim() : 'معايير الجودة والخامات في أثاث الثقة',
        description: body.description ? String(body.description).trim() : undefined,
        items: cleanItems,
        updatedAt: new Date().toISOString(),
      };

      if (isNeonConfigured()) {
        try {
          const updated = await updateTrustStandardsInDb(payloadToSave);
          saveLocalDiskTrustStandards(updated);
          const ok = { success: true, standards: updated, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(200).json(ok);
          return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Neon trust standards update failed:', dbErr);
        }
      }

      saveLocalDiskTrustStandards(payloadToSave);
      const ok = { success: true, standards: payloadToSave, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(ok);
      return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const unsupp = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsupp);
    return new Response(JSON.stringify(unsupp), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Trust standards API error:', error);
    const err = { error: error?.message || 'حدث خطأ في معالجة معايير الثقة.' };
    if (typeof res?.status === 'function') return res.status(500).json(err);
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
