import React, { useEffect, useState } from 'react';
import { ChevronLeft, Compass, ShieldCheck, MapPin, Truck, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface EditorialHeroProps {
  onExploreCatalog: () => void;
  onStartStory: () => void;
  featuredProduct?: Product;
  onOpenProductModal?: (product: Product) => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onExploreCatalog,
  onStartStory,
  featuredProduct,
  onOpenProductModal
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener('change', handleMotionChange);

    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mq.removeEventListener('change', handleMotionChange);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Parallax calculations (bounded to prevent runaway values)
  const heroProgress = Math.min(Math.max(scrollY / 700, 0), 1);
  const imageScale = prefersReducedMotion ? 1 : 1 + heroProgress * 0.08;
  const imageTranslateY = prefersReducedMotion ? 0 : heroProgress * 45;
  const textTranslateY = prefersReducedMotion ? 0 : heroProgress * -30;
  const textOpacity = prefersReducedMotion ? 1 : Math.max(1 - heroProgress * 1.2, 0);

  return (
    <section
      id="hero-entrance"
      className="relative w-full min-h-[90vh] lg:min-h-[94vh] bg-[#1E1E1E] text-white overflow-hidden flex flex-col justify-between"
      aria-label="المدخل المعماري الرئيسي لدار أثاث الثقة"
    >
      {/* =========================================================================
          BACKGROUND / DOMINANT ASYMMETRIC PHOTOGRAPHY LAYER
          ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Dominant Architectural Image (Asymmetric Placement) */}
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `scale(${imageScale}) translateY(${imageTranslateY}px)`,
            transition: prefersReducedMotion ? 'none' : 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1800&auto=format&fit=crop&q=85"
            alt="صالة معمارية فاخرة بأثاث الثقة"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center sm:object-right opacity-38 sm:opacity-45"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Sophisticated Architectural Gradient Scrim for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] via-[#1E1E1E]/80 to-[#1E1E1E]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1E1E] via-[#1E1E1E]/85 to-transparent sm:w-3/4" />
        
        {/* Fine Architectural Grid Lines (Restrained Elegance) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* =========================================================================
          MAIN FOREGROUND CONTENT LAYER (EDITORIAL OVERLAP)
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 lg:pt-28 flex-1 flex flex-col justify-center">
        <div
          className="max-w-3xl space-y-7 will-change-transform"
          style={{
            transform: `translateY(${textTranslateY}px)`,
            opacity: textOpacity,
            transition: prefersReducedMotion ? 'none' : 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Brand Identity Accent Tag */}
          <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs text-xs font-semibold text-neutral-200">
            <span className="w-2 h-2 rounded-full bg-[#FF551A] shadow-[0_0_8px_#FF551A]" aria-hidden="true" />
            <span>دار أثاث الثقة · فخامة الأثاث المعماري الراقي</span>
          </div>

          {/* Large Controlled Arabic Editorial Headline */}
          <div className="space-y-3">
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              أثاثٌ يُصاغ بهدوء المعمار..{' '}
              <span className="relative inline-block text-white">
                ويستقر في بيتك لأجيال
                <span
                  className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-[#FF551A] rounded-full -z-10 opacity-90"
                  aria-hidden="true"
                />
              </span>
            </h1>
          </div>

          {/* Restrained Editorial Description */}
          <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
            نبتكر في «أثاث الثقة» مساحات معيشية تحتفي بروح المكان. ننتقي أخشاب الزان والبلوط المصمتة المجففة، وأقمشة البوكليه والكتان الفاخرة لتمنحك راحة متفردة تدوم طويلاً.
          </p>

          {/* Actions: Clear CTA for Immediate Shopping + Story Exploration */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreCatalog}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>تصفح الكتالوج المباشر</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onStartStory}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-all border border-white/20 backdrop-blur-md cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
            >
              <Compass className="w-4 h-4 text-[#FF551A]" />
              <span>جولة في العوالم الداخلية</span>
            </button>
          </div>
        </div>

        {/* Live Featured Piece Pill (Connecting authentic product photo with hero) */}
        {featuredProduct && (
          <aside
            aria-label="قطعة مميزة من المجموعة"
            onClick={() => onOpenProductModal && onOpenProductModal(featuredProduct)}
            className="mt-10 sm:mt-12 self-start lg:self-end flex items-center gap-3.5 p-2.5 sm:p-3 pr-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs transition-all cursor-pointer group shadow-xl max-w-sm"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/20">
              <img
                src={featuredProduct.coverImageUrl || featuredProduct.images[0]?.url}
                alt={featuredProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#FF551A] tracking-wider uppercase block">
                قطعة مميزة من المعرض
              </span>
              <h4 className="text-white font-bold truncate group-hover:text-[#FF551A] transition-colors text-xs">
                {featuredProduct.name}
              </h4>
            </div>
            <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-[#FF551A] text-white transition-colors shrink-0">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          EDITORIAL BASELINE BAR (TRUST STANDARDS & SEAMLESS SCROLL TRIGGER)
          ========================================================================= */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/30 backdrop-blur-md mt-10 py-5 text-xs text-neutral-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-neutral-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF551A] shrink-0" />
              <span>هياكل من خشب الزان والبلوط المصمت المجفف حرارياً</span>
            </div>
            <span aria-hidden="true" className="text-neutral-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#FF551A] shrink-0" />
              <span>خدمة توصيل مع التركيب الاحترافي لكافة الولايات</span>
            </div>
            <span aria-hidden="true" className="text-neutral-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF551A] shrink-0" />
              <span>معاينة واقعية في فروعنا الثلاثة المعتمدة</span>
            </div>
          </div>

          <button
            onClick={onStartStory}
            className="self-end md:self-auto inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer group"
          >
            <span>انتقل إلى القصة السينمائية</span>
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#FF551A] group-hover:text-white transition-colors">
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
