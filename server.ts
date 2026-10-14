import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import productsHandler from './api/products';
import uploadHandler from './api/upload';
import blobUploadHandler from './api/blob-upload';
import deleteImageHandler from './api/delete-image';
import blobStatusHandler from './api/blob/status.js';
import loginHandler from './api/admin/login';
import verifyHandler from './api/admin/verify';
import logoutHandler from './api/admin/logout';
import dbStatusHandler from './api/db-status.js';
import changePasswordHandler from './api/admin/change-password.js';
import categoriesHandler from './api/categories';
import settingsHandler from './api/settings';
import trustStandardsHandler from './api/trust-standards';

dotenv.config();

// Neutralize any Postgres connection strings mistakenly set in BLOB_READ_WRITE_TOKEN
if (
  process.env.BLOB_READ_WRITE_TOKEN &&
  (process.env.BLOB_READ_WRITE_TOKEN.startsWith('postgres://') ||
    process.env.BLOB_READ_WRITE_TOKEN.startsWith('postgresql://') ||
    !process.env.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_'))
) {
  delete process.env.BLOB_READ_WRITE_TOKEN;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const hostArgIndex = args.indexOf('--host');

const PORT = Number(
  (portArgIndex !== -1 && args[portArgIndex + 1]) ||
  process.env.PORT ||
  3000
);
const HOST = (hostArgIndex !== -1 && args[hostArgIndex + 1]) || process.env.HOST || '0.0.0.0';

// Enable JSON parser for normal routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// -------------------------------------------------------------
// 1. API: Admin Authentication (Protected, Fail-Closed, No Hardcoded Secrets)
// -------------------------------------------------------------
app.all('/api/admin/login', (req: Request, res: Response) => {
  return loginHandler(req, res);
});

app.all('/api/admin/verify', (req: Request, res: Response) => {
  return verifyHandler(req, res);
});

app.all('/api/admin/logout', (req: Request, res: Response) => {
  return logoutHandler(req, res);
});

app.all('/api/admin/change-password', (req: Request, res: Response) => {
  return changePasswordHandler(req, res);
});

app.all('/api/db-status', (req: Request, res: Response) => {
  return dbStatusHandler(req, res);
});

// -------------------------------------------------------------
// 2. API: Vercel Blob Status
// -------------------------------------------------------------
app.all(['/api/blob/status', '/api/blob-status'], (req: Request, res: Response) => {
  return blobStatusHandler(req, res);
});

// -------------------------------------------------------------
// 3. API: Products APIs (Authoritative: Vercel Blob _database/products.json)
// -------------------------------------------------------------
app.all(['/api/products', '/api/products/reset'], (req: Request, res: Response) => {
  return productsHandler(req, res);
});
app.all('/api/products/:id', (req: Request, res: Response) => {
  if (req.params.id !== 'reset') req.query.id = req.params.id;
  return productsHandler(req, res);
});

// -------------------------------------------------------------
// 3b. API: Categories & Storefront Settings
// -------------------------------------------------------------
app.all('/api/categories', (req: Request, res: Response) => {
  return categoriesHandler(req, res);
});
app.all('/api/categories/:id', (req: Request, res: Response) => {
  req.query.id = req.params.id;
  return categoriesHandler(req, res);
});

app.all('/api/settings', (req: Request, res: Response) => {
  return settingsHandler(req, res);
});

app.all('/api/trust-standards', (req: Request, res: Response) => {
  return trustStandardsHandler(req, res);
});

// -------------------------------------------------------------
// 4. API: Upload Media (Images & Videos) to Vercel Blob (NO FAKE / LOCAL FALLBACK)
// -------------------------------------------------------------
const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

app.all('/api/upload', uploadMulter.any(), (req: Request, res: Response) => {
  return uploadHandler(req, res);
});

app.all('/api/blob-upload', (req: Request, res: Response) => {
  return blobUploadHandler(req, res);
});

app.all('/api/delete-image', (req: Request, res: Response) => {
  return deleteImageHandler(req, res);
});

// -------------------------------------------------------------
// Vite Server Integration (SPA dev & prod)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Trust Furniture server running at http://${HOST}:${PORT}`);
  });
}

startServer();
