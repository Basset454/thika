import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  Award,
  Layers,
  Link2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { TrustStandardsSection, TrustStandardItem, Product } from '../types';

interface ArchitecturalMaterialsSectionProps {
  standards?: TrustStandardsSection | null;
  products?: Product[];
  onOpenProductModal?: (product: Product) => void;
}

export const ArchitecturalMaterialsSection: React.FC<ArchitecturalMaterialsSectionProps> = ({
  standards,
  products = [],
  onOpenProductModal,
}) => {
  // If explicitly disabled by merchant, hide section completely
  if (standards && standards.enabled === false) {
    return null;
  }

  const items = (standards?.items || []).filter((item) => !item.isHidden);

  // If no items are configured or enabled, hide gracefully
  if (items.length === 0) {
    return null;
  }

  const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
  const [activeItemId, setActiveItemId] = useState<string>(sortedItems[0]?.id || '');

  // Keep active item valid if list changes
  const activeItem: TrustStandardItem =
    sortedItems.find((it) => it.id === activeItemId) || sortedItems[0];
  const activeIndex = sortedItems.findIndex((it) => it.id === activeItem?.id);
  const formattedNumber = String((activeIndex >= 0 ? activeIndex : 0) + 1).padStart(2, '0');

  // Find linked products if specified for this material/standard
  const linkedProducts = React.useMemo(() => {
    if (!activeItem?.linkedProductIds || activeItem.linkedProductIds.length === 0) {
      return [];
    }
    return products.filter((p) => activeItem.linkedProductIds?.includes(p.id));
  }, [activeItem, products]);

  const badgeText = standards?.badgeText || 'معايير الثقة · الحرفية والخامات';
  const sectionTitle = standards?.title || 'معايير الجودة والخامات في أثاث الثقة';
  const sectionDesc = standards?.description;

  return (
    <section
      id="guarantees"
      className="scroll-mt-24 bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs"
      aria-labelledby="materials-heading"
    >
      {/* Top Header: Editorial Magazine Tag & Category Switcher */}
      <div className="p-6 sm:p-10 lg:p-12 border-b border-neutral-100 bg-neutral-50/50 reveal-fade-up">
        <div className="max-w-3xl space-y-3">
          {badgeText && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-bold text-[#FF551A] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
              <span>{badgeText}</span>
            </div>
          )}
          <h2
            id="materials-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1E1E] tracking-tight leading-tight"
          >
            {sectionTitle}
          </h2>
          {sectionDesc && (
            <p className="text-neutral-600 text-xs sm:text-sm lg:text-base leading-relaxed">
              {sectionDesc}
            </p>
          )}
        </div>

        {/* Dynamic Material Switcher Tabs (Supports any number of items) */}
        {sortedItems.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2 pt-2 border-t border-neutral-200/70 overflow-x-auto pb-1 scrollbar-none">
            {sortedItems.map((item, idx) => {
              const isActive = item.id === activeItem?.id;
              const numStr = String(idx + 1).padStart(2, '0');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItemId(item.id)}
                  className={`group px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1E1E1E] text-white shadow-md'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200/80'
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-[#FF551A] text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {numStr}
                  </span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Editorial Showcase Canvas */}
      <div className="p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Visual Showcase (Adaptive image with luxury editorial frame) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-lg group aspect-[4/3] sm:aspect-[16/11]">
              {activeItem?.image ? (
                <img
                  key={activeItem.id}
                  src={activeItem.image}
                  alt={activeItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104 reveal-image-curtain is-revealed"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
                  <ShieldCheck className="w-16 h-16 text-[#FF551A] mb-3 opacity-90" />
                  <span className="text-lg font-bold">{activeItem?.title}</span>
                  {activeItem?.subtitle && (
                    <span className="text-xs text-neutral-400 mt-1">{activeItem.subtitle}</span>
                  )}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

              {/* Number & Category Stamp */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-white flex items-center gap-2 text-xs font-mono">
                <span className="text-[#FF551A] font-bold">{formattedNumber}</span>
                {activeItem?.subtitle && (
                  <>
                    <span className="text-neutral-300">/</span>
                    <span className="text-[11px] font-sans font-medium text-neutral-200">
                      {activeItem.subtitle}
                    </span>
                  </>
                )}
              </div>

              {/* Quote Banner Over Image (Only rendered if quote is provided) */}
              {activeItem?.quote && (
                <div className="absolute bottom-4 right-4 left-4 sm:right-6 sm:left-6 text-white text-xs sm:text-sm font-medium leading-relaxed bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <p className="italic text-neutral-100 font-serif leading-relaxed">
                    {activeItem.quote}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications & Architectural Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              {activeItem?.subtitle && (
                <span className="text-xs font-mono font-bold text-[#FF551A] tracking-wider uppercase block">
                  {activeItem.subtitle}
                </span>
              )}
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] leading-snug">
                {activeItem?.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {activeItem?.description}
              </p>
            </div>

            {/* Dynamic Quality Points / Highlights (Only non-empty points) */}
            {activeItem?.points && activeItem.points.length > 0 && (
              <div className="space-y-3 pt-1">
                {activeItem.points.map((pt, i) => (
                  <div
                    key={pt.id || i}
                    className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-100/50 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FF551A] shrink-0" />
                        <h4 className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                          {pt.title}
                        </h4>
                      </div>
                      {pt.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 shrink-0">
                          {pt.badge}
                        </span>
                      )}
                    </div>
                    {pt.description && (
                      <p className="text-xs text-neutral-500 pr-6 leading-relaxed">
                        {pt.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Scope: Linked Products vs Storewide (Requirement 5) */}
            {linkedProducts.length > 0 ? (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                  <Link2 className="w-3.5 h-3.5 text-[#FF551A]" />
                  <span>ينطبق هذا المعيار خصيصاً على القطع التالية:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {linkedProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onOpenProductModal && onOpenProductModal(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#FF551A] hover:text-white text-[11px] font-semibold text-neutral-700 transition-colors cursor-pointer"
                      title={`معاينة تفاصيل ${p.name}`}
                    >
                      <span>{p.name}</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                <div className="flex items-center gap-2 font-bold text-[#1E1E1E]">
                  <Award className="w-4 h-4 text-[#FF551A]" />
                  <span>معتمد في تصاميم أثاث الثقة</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  TRUST STANDARDS
                </span>
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
};
