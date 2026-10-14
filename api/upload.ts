import { put } from '@vercel/blob';
import busboy from 'busboy';
import { checkAdminAuth } from './admin/_auth-utils.js';

// Disable default Vercel bodyParser so raw stream can be parsed without truncation or corruption
export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeBlobToken(rawToken?: string): string | undefined {
  if (!rawToken || typeof rawToken !== 'string') return undefined;
  const trimmed = rawToken.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
    return undefined;
  }
  if (!trimmed.startsWith('vercel_blob_rw_')) {
    return undefined;
  }
  return trimmed;
}

function neutralizeInvalidBlobEnv() {
  const envToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (
    envToken &&
    (envToken.startsWith('postgres://') ||
      envToken.startsWith('postgresql://') ||
      !envToken.startsWith('vercel_blob_rw_'))
  ) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  }
}

neutralizeInvalidBlobEnv();

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-m4v',
  'video/x-matroska',
];

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function validateFileTypeAndSize(mimetype: string, size: number): { valid: boolean; error?: string; isVideo?: boolean } {
  const isImg = ALLOWED_IMAGE_TYPES.includes(mimetype) || mimetype.startsWith('image/');
  const isVid = ALLOWED_VIDEO_TYPES.includes(mimetype) || mimetype.startsWith('video/');

  if (!isImg && !isVid) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم (${mimetype}). الأنواع المدعومة: صور (JPG, PNG, WEBP, GIF, AVIF) أو فيديو (MP4, WEBM, MOV, OGG).`,
    };
  }

  if (isImg && size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `حجم الصورة يتجاوز الحد الأقصى المسموح به (20 ميجابايت). حجم الملف الحالي: ${(size / (1024 * 1024)).toFixed(1)} ميجابايت.`,
    };
  }

  if (isVid && size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `حجم الفيديو يتجاوز الحد الأقصى المسموح به (100 ميجابايت). حجم الملف الحالي: ${(size / (1024 * 1024)).toFixed(1)} ميجابايت.`,
    };
  }

  return { valid: true, isVideo: isVid };
}

function parseNodeMultipart(req: any): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = 'application/octet-stream';
    let fileFound = false;

    bb.on('file', (_name: string, fileStream: any, info: any) => {
      fileFound = true;
      filename = info.filename || `upload-${Date.now()}`;
      mimetype = info.mimeType || 'application/octet-stream';
      const chunks: Buffer[] = [];

      fileStream.on('data', (data: Buffer) => chunks.push(data));
      fileStream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', () => {
      if (fileFound && fileBuffer) {
        resolve({ buffer: fileBuffer, filename, mimetype });
      } else {
        reject(new Error('لم يتم العثور على أي ملف صالح للرفع.'));
      }
    });

    bb.on('error', (err: any) => reject(err));
    req.pipe(bb);
  });
}

function readNodeStream(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err: any) => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  neutralizeInvalidBlobEnv();

  // CORS headers
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-blob-token, x-admin-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    const errPayload = { error: 'Method not allowed. Use POST.' };
    if (typeof res?.status === 'function') return res.status(405).json(errPayload);
    return new Response(JSON.stringify(errPayload), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  // Enforce server-side admin authentication for media upload
  if (!checkAdminAuth(req)) {
    const authErr = { error: 'Unauthorized: Admin authentication required for media uploads.' };
    if (typeof res?.status === 'function') return res.status(401).json(authErr);
    return new Response(JSON.stringify(authErr), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const explicitToken = (req.headers?.['x-blob-token'] as string) || req?.headers?.get?.('x-blob-token') || process.env.BLOB_READ_WRITE_TOKEN;
  const token = sanitizeBlobToken(explicitToken);

  // Handle Web Standard Request (Edge or Next/Vercel standard formData)
  if (typeof req?.formData === 'function') {
    try {
      const form = await req.formData();
      const possibleFile = form.get('file') || form.get('image') || form.get('images') || form.get('video') || form.get('videos');
      if (!(possibleFile instanceof File)) {
        return new Response(JSON.stringify({ error: 'No valid file received from form' }), { status: 400 });
      }

      const fileType = possibleFile.type || 'application/octet-stream';
      const validation = validateFileTypeAndSize(fileType, possibleFile.size);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
      }

      const cleanFilename = possibleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const prefix = validation.isVideo ? 'videos' : 'products';
      const pathname = `${prefix}/${Date.now()}-${cleanFilename}`;

      const putOptions = {
        access: 'public' as const,
        contentType: fileType,
        ...(token ? { token } : {}),
      };

      const blob = await put(pathname, possibleFile, putOptions);

      return new Response(
        JSON.stringify({
          success: true,
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: possibleFile.size,
          mediaType: validation.isVideo ? 'video' : 'image',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Upload failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle Node.js runtime (req: IncomingMessage, res: ServerResponse)
  try {
    const rawContentType = (req.headers?.['content-type'] as string) || '';
    let fileBuffer: Buffer;
    let filename: string;
    let contentType: string;

    if (rawContentType.includes('multipart/form-data')) {
      const parsed = await parseNodeMultipart(req);
      fileBuffer = parsed.buffer;
      filename = parsed.filename;
      contentType = parsed.mimetype;
    } else {
      const rawFilename = (req.query?.filename as string) || `furniture-${Date.now()}`;
      filename = rawFilename;
      contentType = rawContentType || 'application/octet-stream';
      fileBuffer = await readNodeStream(req);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'الملف المرفوع فارغ أو مفقود.' });
    }

    // Auto-detect mimetype if generic octet-stream based on file extension
    if (contentType === 'application/octet-stream') {
      const lower = filename.toLowerCase();
      if (lower.endsWith('.mp4')) contentType = 'video/mp4';
      else if (lower.endsWith('.webm')) contentType = 'video/webm';
      else if (lower.endsWith('.mov')) contentType = 'video/quicktime';
      else if (lower.endsWith('.ogg')) contentType = 'video/ogg';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (lower.endsWith('.png')) contentType = 'image/png';
      else if (lower.endsWith('.webp')) contentType = 'image/webp';
      else if (lower.endsWith('.avif')) contentType = 'image/avif';
      else if (lower.endsWith('.gif')) contentType = 'image/gif';
    }

    const validation = validateFileTypeAndSize(contentType, fileBuffer.length);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = validation.isVideo ? 'videos' : 'products';
    const pathname = `${prefix}/${Date.now()}-${cleanFilename}`;

    const putOptions = {
      access: 'public' as const,
      contentType,
      ...(token ? { token } : {}),
    };

    const blob = await put(pathname, fileBuffer, putOptions);

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: fileBuffer.length,
      mediaType: validation.isVideo ? 'video' : 'image',
    });
  } catch (error: any) {
    console.error('Vercel Blob upload failed:', error);
    return res.status(500).json({
      error: `فشل الرفع إلى Vercel Blob: ${error.message || 'خطأ غير معروف'}.`,
      details: error.toString(),
    });
  }
}
