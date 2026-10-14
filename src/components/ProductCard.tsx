import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { getProductPricing } from '../data/initialProducts';
import { ChevronLeft, Eye, Play, Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
  categoryArabicName: string;
  delayMs?: number;
  featuredVariant?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenModal,
  categoryArabicName,
  delayMs = 0,
  featuredVariant = false,
}) => {
  // Find cover image index as the stable default
  const defaultIndex = useMemo(() => {
    if (!product.images || product.images.length === 0) return 0;
    const coverIdx = product.images.findIndex((img) => img.isCover);
    return coverIdx >= 0 ? coverIdx : 0;
  }, [product.images]);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(defaultIndex);
  const [hoverPreviewIndex, setHoverPreviewIndex] = useState<number | null>(null);

  const imagesList = product.images || [];
  const activeIndex = hoverPreviewIndex !== null ? hoverPreviewIndex : selectedPhotoIndex;
  const currentImage = imagesList[activeIndex] || imagesList[0];

  const pricing = useMemo(() => getProductPricing(product), [product]);

  return (
    <article
      onClick={() => onOpenModal(product)}
      className="group cursor-pointer bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between reveal-card select-none"
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {/* Product Image Area with Stable Display & Thumbnail Selectors */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F5F2] border-b border-neutral-100">
        <img
          src={currentImage?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
          loading="lazy"
        />

        {/* Quiet Category Tag */}
        <span className="absolute top-3 right-3 bg-white/92 backdrop-blur-xs text-[#1E1E1E] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-neutral-200/70 shadow-2xs z-10 pointer-events-none">
          {categoryArabicName}
        </span>

        {/* Discount Badge if Active */}
        {pricing.isDiscounted && pricing.discountBadge && (
          <span className="absolute top-3 left-3 bg-[#FF551A] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm z-10 pointer-events-none flex items-center gap-1">
            <span>{pricing.discountBadge}</span>
          </span>
        )}

        {/* Video Badge */}
        {product.videos && product.videos.length > 0 && (
          <span className="absolute bottom-3 left-3 bg-[#1E1E1E]/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs border border-white/10 z-10 pointer-events-none">
            <Play className="w-2.5 h-2.5 fill-[#FF551A] text-[#FF551A]" />
            <span>فيديو</span>
          </span>
        )}

        {/* Multi-Photo Explicit Selector (Thumbnails / Dots) - Fixes erratic auto-switching */}
        {imagesList.length > 1 && (
          <div
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-[#1E1E1E]/80 backdrop-blur-xs px-2 py-1 rounded-full border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <Layers className="w-3 h-3 text-neutral-300 ml-0.5" />
            <div className="flex items-center gap-1">
              {imagesList.map((img, idx) => {
                const isSelected = activeIndex === idx;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoIndex(idx);
                      setHoverPreviewIndex(null);
                    }}
                    onMouseEnter={() => setHoverPreviewIndex(idx)}
                    onMouseLeave={() => setHoverPreviewIndex(null)}
                    className={`transition-all duration-200 rounded-full cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'w-4 h-2 bg-[#FF551A]'
                        : 'w-2 h-2 bg-white/60 hover:bg-white'
                    }`}
                    title={`عرض صورة ${idx + 1}`}
                    aria-label={`عرض الصورة رقم ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Subtle Hover Action Overlay */}
        <div className="absolute inset-0 bg-[#1E1E1E]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-[#1E1E1E] text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#FF551A]" />
            <span>معاينة التفاصيل</span>
          </span>
        </div>
      </div>

      {/* Card Content with Stable Dimensions & Clear Commercial Details */}
      <div className={`p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4`}>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-[#1E1E1E] group-hover:text-[#FF551A] transition-colors truncate">
              {product.name}
            </h3>

            {/* Availability indicator */}
            {product.availability === 'out_of_stock' && (
              <span className="shrink-0 text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                غير متوفر
              </span>
            )}
            {product.availability === 'made_to_order' && (
              <span className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                حسب الطلب
              </span>
            )}
            {product.availability === 'pre_order' && (
              <span className="shrink-0 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                طلب مسبق
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed min-h-[2rem]">
            {product.description || 'قطعة أثاث عصرية مصنوعة بعناية فائقة وتصميم متناسق يلائم أرقى الديكورات.'}
          </p>

          {/* Micro Specs (Dimensions & Materials) */}
          {(product.dimensions || product.materials) && (
            <div className="mt-2.5 pt-2 border-t border-neutral-100/80 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
              {product.dimensions && (
                <span className="truncate">المقاس: <strong className="font-semibold text-neutral-700">{product.dimensions}</strong></span>
              )}
              {product.materials && (
                <span className="truncate">الخامة: <strong className="font-semibold text-neutral-700">{product.materials}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Price & Action Section (Strictly respects "Price on Request" without fake 0) */}
        <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            {!pricing.hasPrice ? (
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">السعر</span>
                <span className="text-sm sm:text-base font-bold text-neutral-800">
                  السعر عند الطلب
                </span>
              </div>
            ) : pricing.isDiscounted ? (
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">السعر بعد التخفيض</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-bold text-[#FF551A] tabular-nums">
                    {pricing.priceFormatted}
                  </span>
                  <span className="text-xs text-neutral-400 line-through tabular-nums">
                    {pricing.originalPriceFormatted}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-neutral-400 block font-medium">السعر الرسمي</span>
                <span className="text-base sm:text-lg font-bold text-[#1E1E1E] tabular-nums">
                  {pricing.priceFormatted}
                </span>
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 group-hover:bg-[#FF551A] text-neutral-700 group-hover:text-white text-xs font-bold transition-colors shrink-0">
            <span>التفاصيل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
