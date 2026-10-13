import React from 'react';
import { Product } from '../types';
import { ChevronLeft, MapPin, Eye } from 'lucide-react';

interface EditorialHeroProps {
  onExploreCatalog: () => void;
  onExploreBranches: () => void;
  featuredProduct?: Product;
  onOpenProductModal?: (product: Product) => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onExploreCatalog,
  onExploreBranches,
  featuredProduct,
  onOpenProductModal,
}) => {
  // Use authentic hero imagery: high-definition, warm natural interior showcasing real craftsmanship
  const heroImage =
    featuredProduct?.coverImageUrl ||
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=85';

  return (
    <section className="relative overflow-hidden bg-[#FBFBFB] border-b border-neutral-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Text Content Column */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 z-10">
            
            {/* Subtle Brand Identity Tag */}
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
              <span>أثاث الثقة · فخامة الأثاث المعاصر في الجزائر</span>
            </div>

            {/* Concise, Powerful Arabic Headline */}
            <div className="space-y-3">
              <h1
                className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-[#1E1E1E] tracking-tight leading-[1.18]"
                style={{ textWrap: 'balance' }}
              >
                فخامة الأثاث العصري..{' '}
                <span className="text-[#FF551A]">بجودة تدوم لأجيال</span>
              </h1>
            </div>

            {/* Very Short & Focused Paragraph */}
            <p className="text-neutral-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
              دار متخصصة في تصميم وتوريد أرقى الصالونات، غرف الطعام، والمساحات المكتبية. نعتمد أخشاب الزان والبلوط الطبيعية وأفخر الأقمشة لتجربة راحة استثنائية.
            </p>

            {/* Two Clear Primary & Secondary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
              >
                <span>تصفح الأثاث</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreBranches}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#1E1E1E] hover:bg-neutral-800 text-white text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
              >
                <MapPin className="w-4 h-4 text-[#FF551A]" />
                <span>اكتشف فروعنا</span>
              </button>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="pt-4 border-t border-neutral-200/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-500 font-medium">
              <span>خشب طبيعي مصمت</span>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <span>توصيل لكافة الولايات</span>
              <span aria-hidden="true" className="text-neutral-300">·</span>
              <span>معاينة حقيقية في 3 فروع</span>
            </div>

          </div>

          {/* High-Quality Visual Showcase Column */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xl group aspect-[4/3] sm:aspect-[16/11]">
              <img
                src={heroImage}
                alt="أثاث صالون عصري فاخر من تشكيلة أثاث الثقة"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                loading="eager"
                fetchPriority="high"
              />

              {/* Minimalist Floating Accent Tag for Authentic Piece */}
              {featuredProduct && (
                <div
                  onClick={() => onOpenProductModal && onOpenProductModal(featuredProduct)}
                  className="absolute bottom-4 right-4 left-4 sm:left-auto bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-neutral-200 shadow-lg flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-[#FF551A] transition-all"
                  title="عرض تفاصيل هذه القطعة"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#FF551A] block">
                      قطعة مميزة من المعرض
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1E1E1E] truncate">
                      {featuredProduct.name}
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 group-hover:bg-[#FF551A] group-hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
