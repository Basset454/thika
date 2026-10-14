import React, { useState, useEffect } from 'react';
import {
  getOptimizedImageUrl,
  generateSrcSet,
  OptimizeImageOptions,
} from '../utils/imageOptimizer';

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'onLoad'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  targetWidth?: number;
  quality?: number;
  widthsForSrcSet?: number[];
  sizes?: string;
  aspectRatio?: string; // e.g. "aspect-[4/3]", "aspect-square"
  containerClassName?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  showSkeleton?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80&fm=webp',
  targetWidth,
  quality = 80,
  widthsForSrcSet,
  sizes,
  aspectRatio,
  containerClassName = '',
  className = '',
  loading = 'lazy',
  fetchPriority,
  showSkeleton = true,
  onError,
  onLoad,
  referrerPolicy = 'no-referrer',
  style,
  ...restProps
}) => {
  // Synchronously compute initial src to avoid initial empty string render
  const initialSrc = React.useMemo(() => {
    if (!src) return fallbackSrc;
    return getOptimizedImageUrl(src, {
      width: targetWidth,
      quality,
      format: 'webp',
      fit: 'crop',
    });
  }, [src, targetWidth, quality, fallbackSrc]);

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Sync state when props change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  // Check if image is already completed in browser cache on mount or src update
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const computedSrcSet = generateSrcSet(currentSrc, widthsForSrcSet, quality);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      if (onError) onError(e);
    } else {
      setIsLoaded(true);
    }
  };

  const effectiveSrc = currentSrc || fallbackSrc || undefined;

  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${aspectRatio || ''} ${containerClassName}`}
    >
      {/* Skeleton Shimmer placeholder while image loads */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse pointer-events-none" />
      )}

      <img
        ref={imgRef}
        src={effectiveSrc}
        srcSet={computedSrcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        referrerPolicy={referrerPolicy}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={style}
        {...restProps}
      />
    </div>
  );
};
