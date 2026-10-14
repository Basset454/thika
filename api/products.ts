import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from './admin/_auth-utils.js';
import { 
  isNeonConfigured, 
  getAllProductsFromDb, 
  getProductByIdFromDb, 
  createProductInDb, 
  updateProductInDb, 
  deleteProductFromDb, 
  resetProductsInDb,
  initDatabase 
} from './_db.js';

export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover: boolean;
  name?: string;
  size?: number;
  uploadedAt: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  pathname?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: ProductImage[];
  videos?: ProductVideo[];
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
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    price: 480,
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
    description: 'Six-seater contemporary dining table crafted from sustainable American walnut with matte protective finish. Elegant bevelled edges and solid joinery.',
    price: 920,
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
    description: 'Deep-seat modular lounge sofa covered in tactile cream bouclé fabric. High-resilience core with down-blend top cushioning for cloud-like comfort.',
    price: 1650,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f3-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
        name: 'cloud_boucle_sofa.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prod-f4',
    name: 'Architect Ergonomic Desk',
    description: 'Sleek workspace desk made of solid ash wood with integrated wire management channel, subtle brass accents, and dual soft-close drawers.',
    price: 680,
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
        uploadedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  }
];

function loadLocalDiskProducts(): Product[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'products.json'),
      path.resolve(process.cwd(), '..', 'data', 'products.json'),
      path.resolve('/var/task', 'data', 'products.json'),
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
  } catch (err) {
    console.warn('Could not read products from local disk:', err);
  }
  return INITIAL_PRODUCTS;
}

function saveLocalDiskProducts(products: Product[]) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf8');
  } catch {
    // ignore in serverless read-only contexts
  }
}

export function normalizeProduct(raw: any): Product {
  const images: ProductImage[] = Array.isArray(raw?.images)
    ? raw.images.map((img: any, idx: number) => ({
        id: String(img?.id || `img-${Date.now()}-${idx}`),
        url: String(img?.url || ''),
        pathname: img?.pathname ? String(img.pathname) : undefined,
        isCover: Boolean(img?.isCover),
        name: img?.name ? String(img.name) : undefined,
        size: typeof img?.size === 'number' ? img.size : undefined,
        uploadedAt: String(img?.uploadedAt || new Date().toISOString()),
      }))
    : [];

  const videos: ProductVideo[] = Array.isArray(raw?.videos)
    ? raw.videos.map((vid: any, idx: number) => ({
        id: String(vid?.id || `vid-${Date.now()}-${idx}`),
        url: String(vid?.url || ''),
        pathname: vid?.pathname ? String(vid.pathname) : undefined,
        name: vid?.name ? String(vid.name) : undefined,
        size: typeof vid?.size === 'number' ? vid.size : undefined,
        mimeType: vid?.mimeType ? String(vid.mimeType) : undefined,
        uploadedAt: String(vid?.uploadedAt || new Date().toISOString()),
      }))
    : [];

  const coverImageUrl =
    raw?.coverImageUrl ||
    images.find((img) => img.isCover)?.url ||
    images[0]?.url ||
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80';

  return {
    id: String(raw?.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    name: String(raw?.name || 'Untitled Furniture Item'),
    price: Number(raw?.price) || 0,
    description: String(raw?.description || ''),
    category: String(raw?.category || 'Living Room'),
    images,
    videos,
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-blob-token, x-admin-token');
  }

  const method = (req?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  // Safe query extraction
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
    // GET /api/products
    // -------------------------------------------------------------
    if (method === 'GET') {
      const productId = getQueryParam('id');
      const wantsAll =
        getQueryParam('all') === 'true' ||
        getQueryParam('admin') === 'true';
      const isAdmin = wantsAll ? checkAdminAuth(req) : false;
      const includeUnpublished = wantsAll && isAdmin;

      // 1. Primary Source: Neon PostgreSQL
      if (isNeonConfigured()) {
        try {
          if (productId) {
            const product = await getProductByIdFromDb(productId);
            if (!product) {
              const notFound = { error: 'Product not found' };
              if (typeof res?.status === 'function') return res.status(404).json(notFound);
              return new Response(JSON.stringify(notFound), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            const payload = { product, source: 'neon_postgresql' };
            if (typeof res?.status === 'function') return res.status(200).json(payload);
            return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          const dbProducts = await getAllProductsFromDb(INITIAL_PRODUCTS);
          const filtered = includeUnpublished
            ? dbProducts
            : dbProducts.filter((p) => p.isPublished !== false);
          const payload = { products: filtered, source: 'neon_postgresql' };
          if (typeof res?.status === 'function') return res.status(200).json(payload);
          return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.warn('Neon database query failed, attempting fallback:', dbErr?.message || dbErr);
        }
      }

      // 2. Fallback to local storage if Neon unavailable
      const local = loadLocalDiskProducts();
      const filtered = includeUnpublished
        ? local
        : local.filter((p) => p.isPublished !== false);
      const payload = { products: filtered, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(payload);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

    // -------------------------------------------------------------
    // POST /api/products (Create OR Reset)
    // -------------------------------------------------------------
    if (method === 'POST') {
      const isResetAction = 
        body?.action === 'reset' || 
        getQueryParam('action') === 'reset' || 
        rawUrl.endsWith('/reset') || 
        rawUrl.includes('/products/reset');

      if (isResetAction) {
        if (isNeonConfigured()) {
          try {
            const resetList = await resetProductsInDb(INITIAL_PRODUCTS);
            saveLocalDiskProducts(resetList);
            const okPayload = {
              success: true,
              products: resetList,
              source: 'neon_postgresql',
              message: 'Database reset to initial furniture catalog in Neon PostgreSQL.',
            };
            if (typeof res?.status === 'function') return res.status(200).json(okPayload);
            return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } catch (err: any) {
            console.error('Failed to reset products in Neon:', err);
          }
        }
        saveLocalDiskProducts(INITIAL_PRODUCTS);
        const okPayload = { success: true, products: INITIAL_PRODUCTS, source: 'local_disk' };
        if (typeof res?.status === 'function') return res.status(200).json(okPayload);
        return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (!body || !body.name) {
        const errPayload = { error: 'Product name is required' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const productToInsert = normalizeProduct(body);

      // Primary: Save in Neon PostgreSQL
      if (isNeonConfigured()) {
        try {
          const created = await createProductInDb(productToInsert);
          // Mirror to disk cache
          try {
            const current = loadLocalDiskProducts();
            saveLocalDiskProducts([created, ...current]);
          } catch {
            // ignore
          }
          const okPayload = {
            success: true,
            product: created,
            source: 'neon_postgresql',
          };
          if (typeof res?.status === 'function') return res.status(201).json(okPayload);
          return new Response(JSON.stringify(okPayload), { status: 201, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Failed to insert product into Neon PostgreSQL:', dbErr);
          const errPayload = { error: `Failed to insert product into Neon: ${dbErr?.message || dbErr}` };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Fallback: Local disk
      const current = loadLocalDiskProducts();
      const updatedList = [productToInsert, ...current];
      saveLocalDiskProducts(updatedList);
      const okPayload = { success: true, product: productToInsert, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(201).json(okPayload);
      return new Response(JSON.stringify(okPayload), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // PUT /api/products
    // -------------------------------------------------------------
    if (method === 'PUT') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for update' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Primary: Update in Neon PostgreSQL
      if (isNeonConfigured()) {
        try {
          const updated = await updateProductInDb(productId, body);
          if (!updated) {
            const notFound = { error: 'Product not found in Neon database' };
            if (typeof res?.status === 'function') return res.status(404).json(notFound);
            return new Response(JSON.stringify(notFound), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }
          const okPayload = {
            success: true,
            product: updated,
            source: 'neon_postgresql',
          };
          if (typeof res?.status === 'function') return res.status(200).json(okPayload);
          return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Failed to update product in Neon PostgreSQL:', dbErr);
          const errPayload = { error: `Failed to update product in Neon: ${dbErr?.message || dbErr}` };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Fallback: Local disk
      const current = loadLocalDiskProducts();
      let updatedProduct: Product | null = null;
      const updatedList = current.map((p) => {
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
      saveLocalDiskProducts(updatedList);
      const okPayload = { success: true, product: updatedProduct, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(okPayload);
      return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // DELETE /api/products
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for deletion' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Primary: Delete in Neon PostgreSQL
      if (isNeonConfigured()) {
        try {
          await deleteProductFromDb(productId);
          const okPayload = {
            success: true,
            message: 'Product deleted successfully from Neon database',
            id: productId,
            source: 'neon_postgresql',
          };
          if (typeof res?.status === 'function') return res.status(200).json(okPayload);
          return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (dbErr: any) {
          console.error('Failed to delete product in Neon PostgreSQL:', dbErr);
          const errPayload = { error: `Failed to delete product in Neon: ${dbErr?.message || dbErr}` };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Fallback: Local disk
      const current = loadLocalDiskProducts();
      const updatedList = current.filter((p) => p.id !== productId);
      saveLocalDiskProducts(updatedList);
      const okPayload = {
        success: true,
        message: 'Product deleted successfully',
        id: productId,
        source: 'local_disk',
      };
      if (typeof res?.status === 'function') return res.status(200).json(okPayload);
      return new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const unsuppPayload = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsuppPayload);
    return new Response(JSON.stringify(unsuppPayload), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Products API unhandled error:', error?.message || error);
    const fallbackProducts = loadLocalDiskProducts();
    const fallbackPayload = {
      products: fallbackProducts,
      source: 'fallback_store',
      error: error?.message || String(error),
    };
    if (typeof res?.status === 'function') return res.status(200).json(fallbackPayload);
    return new Response(JSON.stringify(fallbackPayload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
