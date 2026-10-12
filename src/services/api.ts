import { Product, ProductImage, BlobStatus } from '../types';
import { upload } from '@vercel/blob/client';

let inMemoryAdminToken: string | null = null;
const ADMIN_BLOB_TOKEN_KEY = 'trust_admin_blob_token';

export function getAdminToken(): string | null {
  return inMemoryAdminToken;
}

export function setAdminToken(token: string | null): void {
  inMemoryAdminToken = token;
}

export async function adminLogin(password: string): Promise<string> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'فشلت عملية تسجيل الدخول. يرجى التحقق من كلمة المرور.');
  }

  inMemoryAdminToken = data.token || null;
  return data.token;
}

export async function adminLogout(): Promise<void> {
  inMemoryAdminToken = null;
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}

export async function checkAdminStatus(): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (inMemoryAdminToken) {
      headers['Authorization'] = `Bearer ${inMemoryAdminToken}`;
    }
    const res = await fetch('/api/admin/verify', {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.valid);
    }
  } catch {
    // ignore
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  return Boolean(inMemoryAdminToken);
}

export function getCustomBlobToken(): string {
  const val = localStorage.getItem(ADMIN_BLOB_TOKEN_KEY) || '';
  const trimmed = val.trim();
  // Clear any invalid postgres connection strings mistakenly stored in localStorage
  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://') || (!trimmed.startsWith('vercel_blob_rw_') && trimmed.length > 0)) {
    localStorage.removeItem(ADMIN_BLOB_TOKEN_KEY);
    return '';
  }
  return trimmed;
}

export function setCustomBlobToken(token: string): void {
  const trimmed = (token || '').trim();
  if (trimmed && trimmed.startsWith('vercel_blob_rw_')) {
    localStorage.setItem(ADMIN_BLOB_TOKEN_KEY, trimmed);
  } else {
    localStorage.removeItem(ADMIN_BLOB_TOKEN_KEY);
  }
}

// -------------------------------------------------------------
// Real Server Database APIs (Persistent in Vercel Blob _database/products.json)
// -------------------------------------------------------------
export async function getProducts(forAdmin = false): Promise<Product[]> {
  const sessionToken = getAdminToken();
  const url = forAdmin ? '/api/products?admin=true' : '/api/products';
  
  const headers: Record<string, string> = {};
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to fetch products from server (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.products) ? data.products : [];
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const sessionToken = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch('/api/products', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to create product on server (${res.status})`);
  }

  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const sessionToken = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify({ id, ...updates }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to update product on server (${res.status})`);
  }

  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const sessionToken = getAdminToken();
  const headers: Record<string, string> = {};
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to delete product on server (${res.status})`);
  }

  return true;
}

export async function resetProductsToInitial(): Promise<Product[]> {
  const sessionToken = getAdminToken();
  const headers: Record<string, string> = {};
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch('/api/products/reset', {
    method: 'POST',
    credentials: 'include',
    headers,
  });
  if (res.ok) {
    const data = await res.json();
    return data.products || [];
  }
  return [];
}

// -------------------------------------------------------------
// Real Vercel Blob Image Upload (NO FAKE BASE64 FALLBACK)
// -------------------------------------------------------------
export async function uploadImageFiles(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ProductImage[]> {
  const customToken = getCustomBlobToken();
  const uploadedResults: ProductImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(Math.round(((i + 0.1) / files.length) * 100));

    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `products/${Date.now()}-${cleanFilename}`;

    let uploadedBlob: { url: string; pathname?: string; size?: number } | null = null;
    let lastError: Error | null = null;

    // 1. Try official client upload flow (@vercel/blob/client)
    try {
      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        clientPayload: JSON.stringify({ token: customToken || undefined }),
        onUploadProgress: ({ percentage }) => {
          onProgress?.(Math.round(((i + percentage / 100) / files.length) * 100));
        },
      });

      uploadedBlob = {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
      };
    } catch (clientErr: any) {
      console.warn('Official @vercel/blob/client direct upload error, attempting server upload:', clientErr);
      lastError = clientErr;
    }

    // 2. If client-side token flow was not available, call server upload endpoint (/api/upload)
    if (!uploadedBlob) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('images', file);

        const headers: Record<string, string> = {};
        if (customToken) {
          headers['x-blob-token'] = customToken;
        }
        if (inMemoryAdminToken) {
          headers['Authorization'] = `Bearer ${inMemoryAdminToken}`;
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          headers,
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error ||
            `Server upload failed with status ${res.status}. ${lastError?.message || ''}`
          );
        }

        const data = await res.json();
        if (data.url) {
          uploadedBlob = {
            url: data.url,
            pathname: data.pathname,
            size: data.size || file.size,
          };
        } else if (Array.isArray(data.files) && data.files.length > 0) {
          uploadedBlob = {
            url: data.files[0].url,
            pathname: data.files[0].pathname,
            size: data.files[0].size || file.size,
          };
        } else {
          throw new Error('Upload completed on server but no Blob URL was returned.');
        }
      } catch (serverErr: any) {
        // STRICT REQUIREMENT: DO NOT FALL BACK TO LOCAL STORAGE OR FAKE BASE64!
        console.error('All Vercel Blob upload methods failed:', serverErr);
        throw new Error(
          serverErr.message ||
          'Failed to upload image to Vercel Blob store (test23-blob). Please verify that test23-blob is connected.'
        );
      }
    }

    if (uploadedBlob) {
      uploadedResults.push({
        id: `img-${Date.now()}-${i}`,
        url: uploadedBlob.url,
        pathname: uploadedBlob.pathname,
        name: file.name,
        size: uploadedBlob.size || file.size,
        isCover: i === 0,
        uploadedAt: new Date().toISOString(),
      });
    }
  }

  onProgress?.(100);
  return uploadedResults;
}

export async function deleteImageFile(url: string): Promise<boolean> {
  const token = getCustomBlobToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['x-blob-token'] = token;
  }
  if (inMemoryAdminToken) {
    headers['Authorization'] = `Bearer ${inMemoryAdminToken}`;
  }

  const res = await fetch('/api/delete-image', {
    method: 'DELETE',
    credentials: 'include',
    headers,
    body: JSON.stringify({ url }),
  });

  return res.ok;
}

export async function getBlobStatus(): Promise<BlobStatus> {
  const customToken = getCustomBlobToken();
  try {
    const headers: Record<string, string> = {};
    if (customToken) {
      headers['x-blob-token'] = customToken;
    }
    const res = await fetch('/api/blob/status', { headers });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Could not check blob status:', err);
  }

  return {
    connected: Boolean(customToken),
    tokenConfigured: Boolean(customToken),
    storeName: 'test23-blob',
    maskedToken: customToken ? `${customToken.substring(0, 8)}...` : undefined,
    message: customToken
      ? 'Using custom token for Vercel Blob store test23-blob.'
      : 'Checking Vercel Blob store test23-blob connection...',
  };
}
