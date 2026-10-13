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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// -------------------------------------------------------------
// 2. API: Vercel Blob Status
// -------------------------------------------------------------
app.all(['/api/blob/status', '/api/blob-status'], (req: Request, res: Response) => {
  return blobStatusHandler(req, res);
});

// -------------------------------------------------------------
// 3. API: Products APIs (Authoritative: Vercel Blob _database/products.json)
// -------------------------------------------------------------
app.all('/api/products', (req: Request, res: Response) => {
  return productsHandler(req, res);
});
app.all('/api/products/:id', (req: Request, res: Response) => {
  req.query.id = req.params.id;
  return productsHandler(req, res);
});

// -------------------------------------------------------------
// 4. API: Upload Image to Vercel Blob (NO FAKE / LOCAL FALLBACK)
// -------------------------------------------------------------
const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
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
