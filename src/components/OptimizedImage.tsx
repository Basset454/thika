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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  // Calculate optimized URL and responsive srcset
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (!src) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    const optOptions: OptimizeImageOptions = {
      width: targetWidth,
      quality,
      format: 'webp',
      fit: 'crop',
    };

    setCurrentSrc(getOptimizedImageUrl(src, optOptions));
  }, [src, targetWidth, quality, fallbackSrc]);

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
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${aspectRatio || ''} ${containerClassName}`}
    >
      {/* Skeleton Shimmer placeholder while image loads */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse pointer-events-none" />
      )}

      <img
        src={currentSrc}
        srcSet={computedSrcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        // @ts-expect-error fetchpriority attribute standard
        fetchpriority={fetchPriority}
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
