import productsHandler from './_handlers/products.js';
import uploadHandler from './_handlers/upload.js';
import blobUploadHandler from './_handlers/blob-upload.js';
import deleteImageHandler from './_handlers/delete-image.js';
import blobStatusHandler from './_handlers/blob/status.js';
import loginHandler from './_handlers/admin/login.js';
import verifyHandler from './_handlers/admin/verify.js';
import logoutHandler from './_handlers/admin/logout.js';
import dbStatusHandler from './_handlers/db-status.js';
import changePasswordHandler from './_handlers/admin/change-password.js';
import categoriesHandler from './_handlers/categories.js';
import settingsHandler from './_handlers/settings.js';
import trustStandardsHandler from './_handlers/trust-standards.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseJsonBodyIfNeeded(req: any) {
  if (req.body !== undefined && req.body !== null) return;
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
  const contentType = (req.headers && (req.headers['content-type'] || req.headers['Content-Type'])) || '';
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString('utf-8');
      if (data) {
        req.body = JSON.parse(data);
      }
    } catch {
      // ignore JSON parse error
    }
  }
}

export default async function handler(req: any, res: any) {
  let rawUrl = req.url || '';
  let pathname = '';
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    pathname = parsed.pathname;
  } catch {
    pathname = rawUrl.split('?')[0];
  }

  // Handle rewrite query: ?path=...
  if (req.query?.path) {
    const qPath = String(req.query.path);
    pathname = qPath.startsWith('/') ? `/api${qPath}` : `/api/${qPath}`;
  }

  // Ensure pathname starts with /api
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  }

  // Strip trailing slashes
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Parse JSON body if needed for non-multipart requests
  const contentType = (req.headers && (req.headers['content-type'] || req.headers['Content-Type'])) || '';
  const isMultipart = contentType.includes('multipart/form-data');
  if (!isMultipart) {
    await parseJsonBodyIfNeeded(req);
  }

  // Route matching
  if (pathname === '/api/admin/login') {
    return loginHandler(req, res);
  }
  if (pathname === '/api/admin/verify') {
    return verifyHandler(req, res);
  }
  if (pathname === '/api/admin/logout') {
    return logoutHandler(req, res);
  }
  if (pathname === '/api/admin/change-password') {
    return changePasswordHandler(req, res);
  }
  if (pathname === '/api/db-status') {
    return dbStatusHandler(req, res);
  }
  if (pathname === '/api/blob/status' || pathname === '/api/blob-status') {
    return blobStatusHandler(req, res);
  }
  if (pathname === '/api/settings') {
    return settingsHandler(req, res);
  }
  if (pathname === '/api/trust-standards') {
    return trustStandardsHandler(req, res);
  }
  if (pathname === '/api/upload') {
    return uploadHandler(req, res);
  }
  if (pathname === '/api/blob-upload') {
    return blobUploadHandler(req, res);
  }
  if (pathname === '/api/delete-image') {
    return deleteImageHandler(req, res);
  }

  // Products routes: /api/products, /api/products/reset, /api/products/:id
  if (pathname === '/api/products' || pathname.startsWith('/api/products/')) {
    const parts = pathname.split('/').filter(Boolean); // ['api', 'products', '123']
    if (parts.length >= 3) {
      const subId = parts[2];
      req.query = req.query || {};
      if (subId === 'reset') {
        req.query.action = 'reset';
      } else {
        req.query.id = subId;
      }
    }
    return productsHandler(req, res);
  }

  // Categories routes: /api/categories, /api/categories/:id
  if (pathname === '/api/categories' || pathname.startsWith('/api/categories/')) {
    const parts = pathname.split('/').filter(Boolean); // ['api', 'categories', '123']
    if (parts.length >= 3) {
      const subId = parts[2];
      req.query = req.query || {};
      req.query.id = subId;
    }
    return categoriesHandler(req, res);
  }

  // 404 fallback
  const notFound = { error: 'API Endpoint Not Found', path: pathname };
  if (typeof res?.status === 'function') {
    return res.status(404).json(notFound);
  }
  return new Response(JSON.stringify(notFound), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
