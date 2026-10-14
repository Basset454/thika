/**
 * Image Optimization Utilities for Thika Furniture E-commerce
 *
 * Provides dynamic URL parameter transformation for CDN-backed images (e.g., Unsplash, Vercel Blob),
 * adaptive responsive srcset generation, and format optimization (WebP/AVIF).
 */

export interface OptimizeImageOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  fit?: 'crop' | 'max' | 'scale' | 'clip';
}

/**
 * Transforms raw image URLs into bandwidth-optimized, sized WebP URLs.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: OptimizeImageOptions = {}
): string {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80&fm=webp';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80&fm=webp';
  }

  // Handle Unsplash images with exact CDN optimizations
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      const width = options.width || 800;
      const quality = options.quality || 80;
      const fit = options.fit || 'crop';
      const format = options.format || 'webp';

      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('fit', fit);
      if (format === 'auto') {
        urlObj.searchParams.set('auto', 'format');
      } else {
        urlObj.searchParams.set('fm', format);
      }

      return urlObj.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Generates responsive srcset attribute string for adaptive image resolution loading
 */
export function generateSrcSet(
  url: string | undefined | null,
  widths: number[] = [320, 640, 960, 1200],
  quality: number = 80
): string | undefined {
  if (!url || !url.includes('images.unsplash.com')) {
    return undefined;
  }

  try {
    const srcsetEntries = widths.map((w) => {
      const optUrl = getOptimizedImageUrl(url, { width: w, quality, format: 'webp' });
      return `${optUrl} ${w}w`;
    });
    return srcsetEntries.join(', ');
  } catch {
    return undefined;
  }
}

/**
 * Standard sizes attribute for card grids
 */
export const CARD_GRID_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
export const PRODUCT_GRID_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
export const HERO_IMAGE_SIZES = '(max-width: 1024px) 100vw, 50vw';
export const THUMBNAIL_IMAGE_SIZES = '120px';
