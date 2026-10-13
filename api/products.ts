import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';
import { checkAdminAuth } from './admin/auth-utils.js';
import {
  isNeonConfigured,
  initDatabase,
  getAllProductsFromDb,
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  resetProductsInDb,
} from './db.js';

export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover: boolean;
  name?: string;
  size?: number;
  uploadedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: ProductImage[];
  coverImageUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    description: 'كرسي مريح مصنوع يدوياً من خشب البلوط الطبيعي ومكسو بكتان فاخر عالي الجودة. يتميز بمسند ظهر منحني مريح وأرجل خشبية كلاسيكية متينة.',
    price: 48000,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f1-1',
        url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_oak_chair.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'img-f1-2',
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_chair_detail.jpg',
        isCover: false,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-f2',
    name: 'Minimalist Walnut Dining Table',
    description: 'طاولة طعام معاصرة لستة أشخاص مصنوعة من خشب الجوز الأمريكي المستدام مع طبقة حماية غير لامعة وزوايا مشطوفة بعناية.',
    price: 92000,
    category: 'Dining Room',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f2-1',
        url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
        name: 'walnut_dining_table.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-f3',
    name: 'Bouclé Cloud Modular Sofa',
    description: 'كنبة عصرية عميقة مؤلفة من 3 قطع معيارية من قماش البوكليه العاجي الفاخر. حشوة مريحة من الإسفنج عالي الكثافة وطبقة ريش لراحة مطلقة.',
    price: 165000,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f3-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
        name: 'boucle_sofa.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'prod-f4',
    name: 'Architect Ergonomic Desk',
    description: 'مكتب عمل عصري مصنع من خشب الدردار الصلب مع قناة مدمجة لتنظيم الأسلاك، ولمسات نحاسية خفيفة، ودرجين بنظام إغلاق هادئ.',
    price: 68000,
    category: 'Office',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f4-1',
        url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
        name: 'architect_desk.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const BLOB_DATABASE_PATH = '_database/products.json';

// In-memory cache for ultra-fast response
let memoryProductsCache: Product[] | null = null;
let lastBlobFetchTime = 0;
const CACHE_TTL_MS = 10000;

let dbInitialized = false;

async function ensureDbReady() {
  if (dbInitialized || !isNeonConfigured()) return;
  try {
    const ok = await initDatabase(INITIAL_PRODUCTS);
    if (ok) dbInitialized = true;
  } catch (err: any) {
    console.warn('Neon database auto-init check:', err?.message || err);
  }
}

/**
 * Returns only genuine Vercel Blob tokens starting with 'vercel_blob_rw_'.
 */
export function getValidBlobToken(explicitToken?: string): string | undefined {
  const tokenCandidate = explicitToken || process.env.BLOB_READ_WRITE_TOKEN;
  if (!tokenCandidate || typeof tokenCandidate !== 'string') return undefined;

  const trimmed = tokenCandidate.trim().replace(/^['"]|['"]$/g, '');

  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = trimmed;
    }
    if (process.env.BLOB_READ_WRITE_TOKEN === tokenCandidate) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
    return undefined;
  }

  if (!trimmed.startsWith('vercel_blob_rw_')) {
    return undefined;
  }

  return trimmed;
}

function loadLocalDiskProducts(): Product[] {
  try {
    if (fs.existsSync(LOCAL_PRODUCTS_FILE)) {
      const data = fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_PRODUCTS;
}

function saveLocalDiskProducts(products: Product[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Loads products from Neon PostgreSQL first, or falls back to Vercel Blob / local disk.
 */
async function loadProducts(token?: string): Promise<{ products: Product[]; source: string }> {
  // 1. Neon Database (Authoritative Database)
  if (isNeonConfigured()) {
    try {
      await ensureDbReady();
      const dbProducts = await getAllProductsFromDb();
      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        memoryProductsCache = dbProducts;
        lastBlobFetchTime = Date.now();
        saveLocalDiskProducts(dbProducts);
        return { products: dbProducts, source: 'neon_postgres' };
      }
    } catch (err: any) {
      console.warn('Failed to query Neon database, falling back to cached/blob storage:', err?.message || err);
    }
  }

  // 2. In-memory cache
  const now = Date.now();
  if (memoryProductsCache && now - lastBlobFetchTime < CACHE_TTL_MS) {
    return { products: memoryProductsCache, source: 'cache' };
  }

  // 3. Fallback: Vercel Blob store
  try {
    const listOptions: Record<string, any> = {
      prefix: BLOB_DATABASE_PATH,
      limit: 10,
    };
    if (token) listOptions.token = token;

    const listResult = await list(listOptions);
    const dbBlob = listResult.blobs.find((b) => b.pathname === BLOB_DATABASE_PATH);

    if (dbBlob && dbBlob.url) {
      const res = await fetch(`${dbBlob.url}?t=${now}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryProductsCache = data;
          lastBlobFetchTime = now;
          saveLocalDiskProducts(data);
          return { products: data, source: 'vercel_blob' };
        }
      }
    }
  } catch (err: any) {
    console.warn('Could not read from Vercel Blob store:', err?.message || err);
  }

  // 4. Fall back to local disk
  const local = loadLocalDiskProducts();
  memoryProductsCache = local;
  lastBlobFetchTime = now;

  return { products: local, source: 'local_disk' };
}

/**
 * Saves products to Vercel Blob backup and local disk.
 */
async function saveProductsBackup(
  products: Product[],
  token?: string
): Promise<{ success: boolean; url?: string; source: string }> {
  memoryProductsCache = products;
  lastBlobFetchTime = Date.now();
  saveLocalDiskProducts(products);

  try {
    const putOptions = {
      access: 'public' as const,
      addRandomSuffix: false,
      contentType: 'application/json',
      ...(token ? { token } : {}),
    };

    const blob = await put(BLOB_DATABASE_PATH, JSON.stringify(products, null, 2), putOptions);
    return { success: true, url: blob.url, source: 'vercel_blob' };
  } catch {
    return { success: true, source: 'local_store' };
  }
}

function normalizeProduct(raw: any): Product {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const coverObj = images.find((i: any) => i.isCover) || images[0];
  const coverImageUrl = raw?.coverImageUrl || coverObj?.url || '';

  return {
    id: raw?.id || `prod-f${Date.now()}`,
    name: String(raw?.name || '').trim(),
    price: Number(raw?.price) || 0,
    description: String(raw?.description || '').trim(),
    category: String(raw?.category || 'Living Room').trim(),
    images,
    coverImageUrl,
    isPublished: raw?.isPublished !== undefined ? Boolean(raw.isPublished) : true,
    isFeatured: Boolean(raw?.isFeatured),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req: any, res: any) {
  // CORS headers
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-blob-token');
  }

  const method = (req?.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  // Safe query extraction
  let urlParams: URLSearchParams | null = null;
  let pathname = '';
  try {
    const rawUrl = req?.url || '';
    const parsedUrl = new URL(rawUrl, `http://${req?.headers?.host || 'localhost'}`);
    urlParams = parsedUrl.searchParams;
    pathname = parsedUrl.pathname;
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

  const explicitToken = req?.headers?.['x-blob-token'] || req?.headers?.get?.('x-blob-token');
  const token = getValidBlobToken(explicitToken);

  try {
    // -------------------------------------------------------------
    // GET /api/products
    // -------------------------------------------------------------
    if (method === 'GET') {
      const wantsAll =
        getQueryParam('all') === 'true' ||
        getQueryParam('admin') === 'true';

      const isAdmin = wantsAll ? checkAdminAuth(req) : false;
      const includeUnpublished = wantsAll && isAdmin;

      const { products, source } = await loadProducts(token);
      const filtered = includeUnpublished
        ? products
        : products.filter((p) => p.isPublished !== false);

      const payload = { products: filtered, source };
      if (typeof res?.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Require admin authentication for all mutations (POST, PUT, DELETE)
    if (!checkAdminAuth(req)) {
      const unauthorizedPayload = {
        error: 'Unauthorized: Admin authentication required for product mutations.',
      };
      if (typeof res?.status === 'function') return res.status(401).json(unauthorizedPayload);
      return new Response(JSON.stringify(unauthorizedPayload), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse body for mutations
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

    // Check if this is a reset request: POST /api/products/reset or ?action=reset
    const isReset = pathname.endsWith('/reset') || getQueryParam('action') === 'reset' || body?.action === 'reset';
    if (method === 'POST' && isReset) {
      let resetList: Product[] = [];
      let source = 'local';
      if (isNeonConfigured()) {
        try {
          await ensureDbReady();
          resetList = await resetProductsInDb(INITIAL_PRODUCTS);
          source = 'neon_postgres';
        } catch (err: any) {
          console.warn('Neon reset error, resetting local:', err?.message || err);
          resetList = INITIAL_PRODUCTS;
        }
      } else {
        resetList = INITIAL_PRODUCTS;
      }

      await saveProductsBackup(resetList, token);
      const okPayload = {
        success: true,
        message: 'Products catalog reset successfully',
        products: resetList,
        source,
      };

      if (typeof res?.status === 'function') return res.status(200).json(okPayload);
      return new Response(JSON.stringify(okPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------------------------------------------------------------
    // POST /api/products (Create)
    // -------------------------------------------------------------
    if (method === 'POST') {
      if (!body || !body.name) {
        const errPayload = { error: 'Product name is required' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let insertedProduct: Product;
      let source = 'local_store';

      if (isNeonConfigured()) {
        try {
          await ensureDbReady();
          insertedProduct = await createProductInDb({
            name: body.name,
            description: body.description || '',
            price: Number(body.price) || 0,
            category: body.category || 'Living Room',
            coverImageUrl: body.coverImageUrl || body.images?.[0]?.url || '',
            images: body.images || [],
            isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
            isFeatured: Boolean(body.isFeatured),
          });
          source = 'neon_postgres';
          // Mirror in memory & backup
          const current = memoryProductsCache || [];
          memoryProductsCache = [insertedProduct, ...current];
          saveProductsBackup(memoryProductsCache, token).catch(() => {});
        } catch (err: any) {
          console.warn('Neon insertion error, falling back to local/blob store:', err?.message || err);
          insertedProduct = normalizeProduct(body);
          const { products } = await loadProducts(token);
          const updatedList = [insertedProduct, ...products];
          const saveResult = await saveProductsBackup(updatedList, token);
          source = saveResult.source;
        }
      } else {
        insertedProduct = normalizeProduct(body);
        const { products } = await loadProducts(token);
        const updatedList = [insertedProduct, ...products];
        const saveResult = await saveProductsBackup(updatedList, token);
        source = saveResult.source;
      }

      const okPayload = {
        success: true,
        product: insertedProduct,
        source,
      };

      if (typeof res?.status === 'function') return res.status(201).json(okPayload);
      return new Response(JSON.stringify(okPayload), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------------------------------------------------------------
    // PUT /api/products (Update)
    // -------------------------------------------------------------
    if (method === 'PUT') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for update' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let updatedProduct: Product | null = null;
      let source = 'local_store';

      if (isNeonConfigured()) {
        try {
          await ensureDbReady();
          updatedProduct = await updateProductInDb(productId, body);
          source = 'neon_postgres';
          if (updatedProduct) {
            const current = memoryProductsCache || [];
            memoryProductsCache = current.map((p) => (p.id === productId ? updatedProduct! : p));
            saveProductsBackup(memoryProductsCache, token).catch(() => {});
          }
        } catch (err: any) {
          console.warn('Neon update error, falling back to local/blob store:', err?.message || err);
        }
      }

      if (!updatedProduct) {
        const { products } = await loadProducts(token);
        const updatedList = products.map((p) => {
          if (p.id === productId) {
            updatedProduct = normalizeProduct({ ...p, ...body, id: productId });
            return updatedProduct;
          }
          return p;
        });

        if (!updatedProduct) {
          updatedProduct = normalizeProduct({ ...body, id: productId });
          updatedList.unshift(updatedProduct);
        }

        const saveResult = await saveProductsBackup(updatedList, token);
        source = saveResult.source;
      }

      const okPayload = {
        success: true,
        product: updatedProduct,
        source,
      };

      if (typeof res?.status === 'function') return res.status(200).json(okPayload);
      return new Response(JSON.stringify(okPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------------------------------------------------------------
    // DELETE /api/products
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for deletion' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let source = 'local_store';
      if (isNeonConfigured()) {
        try {
          await ensureDbReady();
          await deleteProductFromDb(productId);
          source = 'neon_postgres';
          const current = memoryProductsCache || [];
          memoryProductsCache = current.filter((p) => p.id !== productId);
          saveProductsBackup(memoryProductsCache, token).catch(() => {});
        } catch (err: any) {
          console.warn('Neon delete error, falling back to local/blob store:', err?.message || err);
        }
      }

      const { products } = await loadProducts(token);
      const updatedList = products.filter((p) => p.id !== productId);
      const saveResult = await saveProductsBackup(updatedList, token);
      if (source !== 'neon_postgres') source = saveResult.source;

      const okPayload = {
        success: true,
        message: 'Product deleted successfully',
        id: productId,
        source,
      };

      if (typeof res?.status === 'function') return res.status(200).json(okPayload);
      return new Response(JSON.stringify(okPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const unsuppPayload = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsuppPayload);
    return new Response(JSON.stringify(unsuppPayload), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Products API error:', error?.message || error);
    const fallbackProducts = loadLocalDiskProducts();
    const fallbackPayload = {
      products: fallbackProducts,
      source: 'fallback_store',
      notice: 'Served from resilient storage.',
    };
    if (typeof res?.status === 'function') return res.status(200).json(fallbackPayload);
    return new Response(JSON.stringify(fallbackPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
