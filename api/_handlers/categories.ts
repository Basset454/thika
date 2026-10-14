import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from './admin/_auth-utils.js';
import {
  isNeonConfigured,
  getAllCategoriesFromDb,
  createCategoryInDb,
  updateCategoryInDb,
  deleteCategoryFromDb,
  countProductsInCategoryInDb,
  getAllProductsFromDb,
  INITIAL_CATEGORIES,
  CategoryRecord,
} from '../_db.js';

function loadLocalDiskCategories(): CategoryRecord[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'categories.json'),
      path.resolve(process.cwd(), '..', 'data', 'categories.json'),
      path.resolve('/var/task', 'data', 'categories.json'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_CATEGORIES;
}

function saveLocalDiskCategories(categories: CategoryRecord[]) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function countLocalProductsInCategory(categoryId: string): number {
  try {
    const pPath = path.resolve(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(pPath)) {
      const prods = JSON.parse(fs.readFileSync(pPath, 'utf8'));
      if (Array.isArray(prods)) {
        return prods.filter((p: any) => p.category === categoryId).length;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    // GET /api/categories
    // -------------------------------------------------------------
    if (method === 'GET') {
      const wantsAll = getQueryParam('all') === 'true' || getQueryParam('admin') === 'true';
      const isAdmin = wantsAll ? checkAdminAuth(req) : false;
      const includeHidden = wantsAll && isAdmin;

      if (isNeonConfigured()) {
        try {
          const categories = await getAllCategoriesFromDb(includeHidden);
          saveLocalDiskCategories(categories);
          const payload = { categories, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(200).json(payload);
          return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (err: any) {
          console.warn('Neon categories fetch failed, falling back to disk:', err?.message || err);
        }
      }

      const disk = loadLocalDiskCategories();
      const filtered = includeHidden ? disk : disk.filter((c) => !c.isHidden);
      const withCounts = filtered.map((c) => ({
        ...c,
        productCount: countLocalProductsInCategory(c.id),
      }));

      const payload = { categories: withCounts, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // All mutations require admin authentication
    if (!checkAdminAuth(req)) {
      const unauth = { error: 'غير مصرّح: يلزم تسجيل دخول المسؤول لتعديل التصنيفات.' };
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
    // POST /api/categories (Create)
    // -------------------------------------------------------------
    if (method === 'POST') {
      const nameAr = (body?.nameAr || body?.name || '').trim();
      if (!nameAr) {
        const err = { error: 'يرجى إدخال اسم التصنيف باللغة العربية.' };
        if (typeof res?.status === 'function') return res.status(400).json(err);
        return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const id = (body?.id || nameAr.replace(/\s+/g, '-').toLowerCase() || `cat-${Date.now()}`).trim();
      const nameEn = (body?.nameEn || id).trim();
      const order = typeof body?.order === 'number' ? body.order : 99;
      const isHidden = Boolean(body?.isHidden);
      const description = (body?.description || '').trim();
      const imageUrl = body?.imageUrl !== undefined ? (String(body.imageUrl).trim() || undefined) : undefined;

      const newCategory: CategoryRecord = {
        id,
        nameAr,
        nameEn,
        order,
        isHidden,
        description: description || undefined,
        imageUrl,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isNeonConfigured()) {
        try {
          const created = await createCategoryInDb(newCategory);
          const current = loadLocalDiskCategories();
          saveLocalDiskCategories([...current.filter((c) => c.id !== id), created]);
          const ok = { success: true, category: created, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(201).json(ok);
          return new Response(JSON.stringify(ok), { status: 201, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Neon category create failed:', dbErr);
        }
      }

      const current = loadLocalDiskCategories();
      const updated = [...current.filter((c) => c.id !== id), newCategory];
      saveLocalDiskCategories(updated);
      const ok = { success: true, category: newCategory, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(201).json(ok);
      return new Response(JSON.stringify(ok), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // PUT /api/categories (Update / Reorder)
    // -------------------------------------------------------------
    if (method === 'PUT') {
      const id = getQueryParam('id') || body?.id;
      if (!id) {
        const err = { error: 'معرف التصنيف مطلوب للتعديل.' };
        if (typeof res?.status === 'function') return res.status(400).json(err);
        return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const updates: Partial<CategoryRecord> = {};
      if (body?.nameAr !== undefined) updates.nameAr = String(body.nameAr).trim();
      if (body?.nameEn !== undefined) updates.nameEn = String(body.nameEn).trim();
      if (body?.order !== undefined) updates.order = Number(body.order);
      if (body?.isHidden !== undefined) updates.isHidden = Boolean(body.isHidden);
      if (body?.description !== undefined) updates.description = String(body.description).trim();
      if (body?.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl).trim() || undefined;

      if (isNeonConfigured()) {
        try {
          const updated = await updateCategoryInDb(id, updates);
          if (updated) {
            const disk = loadLocalDiskCategories();
            saveLocalDiskCategories(disk.map((c) => (c.id === id ? { ...c, ...updated } : c)));
            const ok = { success: true, category: updated, source: 'neon_postgresql' };
            if (typeof res?.status === 'function') return res.status(200).json(ok);
            return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        } catch (dbErr: any) {
          console.error('Neon category update failed:', dbErr);
        }
      }

      const disk = loadLocalDiskCategories();
      let found = false;
      const updatedList = disk.map((c) => {
        if (c.id === id) {
          found = true;
          return { ...c, ...updates, updatedAt: new Date().toISOString() };
        }
        return c;
      });

      if (!found) {
        const notFound = { error: 'التصنيف المطلوب غير موجود.' };
        if (typeof res?.status === 'function') return res.status(404).json(notFound);
        return new Response(JSON.stringify(notFound), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      saveLocalDiskCategories(updatedList);
      const category = updatedList.find((c) => c.id === id);
      const ok = { success: true, category, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(ok);
      return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // DELETE /api/categories (Check Relations First! Prevent Orphans)
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const id = getQueryParam('id') || body?.id;
      if (!id) {
        const err = { error: 'معرف التصنيف مطلوب للحذف.' };
        if (typeof res?.status === 'function') return res.status(400).json(err);
        return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // 1. Strict Relation Check: Count products using this category in Neon and local disk
      let linkedCount = 0;
      if (isNeonConfigured()) {
        try {
          linkedCount = await countProductsInCategoryInDb(id);
        } catch {
          linkedCount = countLocalProductsInCategory(id);
        }
      } else {
        linkedCount = countLocalProductsInCategory(id);
      }

      if (linkedCount > 0) {
        const conflictErr = {
          error: `لا يمكن حذف هذا التصنيف لوجود ${linkedCount} قطعة أثاث مرتبطة به. يرجى نقل المنتجات أو تغيير تصنيفها أولاً لمنع وجود منتجات يتيمة.`,
          linkedProductsCount: linkedCount,
        };
        if (typeof res?.status === 'function') return res.status(400).json(conflictErr);
        return new Response(JSON.stringify(conflictErr), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Safe to delete: 0 linked products
      if (isNeonConfigured()) {
        try {
          await deleteCategoryFromDb(id);
          const disk = loadLocalDiskCategories();
          saveLocalDiskCategories(disk.filter((c) => c.id !== id));
          const ok = { success: true, message: 'تم حذف التصنيف بنجاح.', id };
          if (typeof res?.status === 'function') return res.status(200).json(ok);
          return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Neon category delete failed:', dbErr);
        }
      }

      const disk = loadLocalDiskCategories();
      saveLocalDiskCategories(disk.filter((c) => c.id !== id));
      const ok = { success: true, message: 'تم حذف التصنيف بنجاح.', id };
      if (typeof res?.status === 'function') return res.status(200).json(ok);
      return new Response(JSON.stringify(ok), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const unsupp = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsupp);
    return new Response(JSON.stringify(unsupp), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Categories API error:', error);
    const err = { error: error?.message || 'حدث خطأ في معالجة التصنيفات.' };
    if (typeof res?.status === 'function') return res.status(500).json(err);
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
