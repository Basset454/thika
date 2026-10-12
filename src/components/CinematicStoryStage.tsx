import React, { useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import { formatDZD } from '../data/initialProducts';
import { ChevronLeft, ArrowDown, Sparkles, Layers, Eye } from 'lucide-react';

interface CinematicStoryStageProps {
  products: Product[];
  onSelectCategory: (category: string) => void;
  onOpenProductModal: (product: Product) => void;
  onNavigateToCatalog: () => void;
}

export const CinematicStoryStage: React.FC<CinematicStoryStageProps> = ({
  products,
  onSelectCategory,
  onOpenProductModal,
  onNavigateToCatalog,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Identify authentic products for each scene from store database
  const livingProduct = products.find(
    (p) =>
      p.category?.toLowerCase().includes('living') ||
      p.name.toLowerCase().includes('sofa') ||
      p.name.toLowerCase().includes('chair')
  ) || products[0];

  const diningProduct = products.find(
    (p) =>
      p.category?.toLowerCase().includes('dining') ||
      p.name.toLowerCase().includes('table') ||
      p.name.toLowerCase().includes('dining')
  ) || products[1] || products[0];

  // Authentic interior images linked to the store
  const scene1Image =
    livingProduct?.coverImageUrl ||
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80';

  const scene2Image =
    diningProduct?.coverImageUrl ||
    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1600&auto=format&fit=crop&q=80';

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mqMotion.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mqMotion.addEventListener('change', handleMotionChange);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    let rafId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;

      rafId = requestAnimationFrame(() => {
        const rect = containerRef.current!.getBoundingClientRect();
        const stageHeight = rect.height;
        const windowHeight = window.innerHeight;

        // Progress calculates how far the user has scrolled through the tall container
        // 0 = top of stage hits top of viewport
        // 1 = bottom of stage hits bottom of viewport
        const totalScrollableDistance = stageHeight - windowHeight;
        if (totalScrollableDistance <= 0) return;

        const currentOffset = -rect.top;
        const rawProgress = currentOffset / totalScrollableDistance;
        const clamped = Math.min(Math.max(rawProgress, 0), 1);
        setScrollProgress(clamped);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mqMotion.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Compute Spatial Choreography Variables
  // p: 0.0 -> 1.0
  const p = scrollProgress;

  // Scene 1 transformations: dominant at start, scales down and translates right during overlap
  // Scale: 1.0 down to 0.88 as p moves 0.15 -> 0.60
  const scene1Scale = prefersReducedMotion
    ? 1
    : p < 0.15
    ? 1
    : p > 0.65
    ? 0.86
    : 1 - ((p - 0.15) / 0.5) * 0.14;

  const scene1TranslateX = prefersReducedMotion
    ? 0
    : p < 0.2
    ? 0
    : p > 0.7
    ? 8
    : ((p - 0.2) / 0.5) * 8; // Moves 0% to +8% (towards right in RTL)

  const scene1Opacity = prefersReducedMotion
    ? 1
    : p < 0.55
    ? 1
    : Math.max(1 - ((p - 0.55) / 0.35) * 0.6, 0.4);

  // Scene 2 transformations: advances from left (RTL opposite side) physically overlapping Scene 1!
  // Entry starts at p = 0.25, fully advances by p = 0.75
  // translateX: -105% (offscreen left) down to 0% (settled center/dominant)
  const scene2TranslateX = prefersReducedMotion
    ? 0
    : p < 0.22
    ? -102
    : p > 0.72
    ? 0
    : -102 + ((p - 0.22) / 0.5) * 102;

  const scene2Scale = prefersReducedMotion
    ? 1
    : p < 0.22
    ? 0.92
    : p > 0.75
    ? 1
    : 0.92 + ((p - 0.22) / 0.53) * 0.08;

  const scene2Opacity = prefersReducedMotion
    ? 1
    : p < 0.2
    ? 0
    : p < 0.3
    ? ((p - 0.2) / 0.1)
    : 1;

  // Typography transitions
  // Title 1 is active 0 -> 0.40, Title 2 takes over 0.45 -> 1.0
  const activeChapter = p < 0.45 ? 1 : 2;

  return (
    <div
      ref={containerRef}
      id="cinematic-story"
      className="relative w-full bg-[#181818] text-white"
      style={{
        // 250vh provides smooth, unhurried, natural scrolling on desktop; 190vh on mobile
        height: prefersReducedMotion ? 'auto' : isMobile ? '190vh' : '260vh',
      }}
      aria-label="الجولة السينمائية التفاعلية بين عوالم أثاث الثقة"
    >
      {/* =========================================================================
          STICKY VIEWPORT STAGE (FIXED VISUAL CANVAS WHILE USER SCROLLS NATIVELY)
          ========================================================================= */}
      <div
        className={`${
          prefersReducedMotion ? 'relative py-16' : 'sticky top-0 h-screen'
        } w-full overflow-hidden flex flex-col justify-between`}
      >
        {/* Subtle Ambient Vignette & Textures */}
        <div className="absolute inset-0 z-0 bg-radial from-transparent via-[#181818]/70 to-[#181818] pointer-events-none" />

        {/* Top Floating Editorial HUD / Chapter Indicator */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
              <Layers className="w-4 h-4 text-[#FF551A]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-neutral-400 block tracking-wider uppercase">
                جولة معمارية متصلة
              </span>
              <span className="text-white font-bold text-xs sm:text-sm">
                {activeChapter === 1 ? '01 · عالم الصالونات والمعيشة' : '02 · عالم غرف الطعام والموائد'}
              </span>
            </div>
          </div>

          {/* Chapter Progression Bar */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                activeChapter === 1 ? 'bg-[#FF551A]' : 'bg-white/30'
              }`}
            />
            <span className="text-[11px] font-mono text-neutral-300 tabular-nums">
              {Math.round(p * 100)}%
            </span>
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                activeChapter === 2 ? 'bg-[#FF551A]' : 'bg-white/30'
              }`}
            />
          </div>
        </div>

        {/* =========================================================================
            THE CORE SPATIAL OVERLAPPING STAGE (SCENE 1 & SCENE 2 VISUAL LAYERS)
            ========================================================================= */}
        <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center my-auto min-h-[420px] sm:min-h-[500px]">
          <div className="relative w-full h-[62vh] sm:h-[68vh] max-h-[720px] rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl">
            
            {/* -------------------------------------------------------------
                LAYER 1: SCENE 1 (LIVING SANCTUARY)
                Dominant at start -> scales down, moves right, stays visible during overlap
                ------------------------------------------------------------- */}
            <div
              className="absolute inset-0 w-full h-full will-change-transform transition-all duration-75 origin-right"
              style={{
                transform: `translateX(${scene1TranslateX}%) scale(${scene1Scale})`,
                opacity: scene1Opacity,
                zIndex: 10,
              }}
            >
              <img
                src={scene1Image}
                alt="صالون معيشة معاصر فاخر بأقمشة بوكليه"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

              {/* Scene 1 Editorial Overlay Content */}
              <div
                className={`absolute bottom-6 sm:bottom-12 right-6 sm:right-12 max-w-xl space-y-4 transition-all duration-300 ${
                  activeChapter === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E]/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#FF551A]">
                  <span>01 · السكينة والرحابة</span>
                </div>

                <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                  صالونات تنبض بالدفء وتدعوك للسكينة
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg hidden sm:block">
                  أرائك بوكليه عاجية مصممة بعمق مدروس وأخشاب البلوط، لتمنحك تجربة جلوس وثيرة تدوم لسنوات طويلة دون هبوط.
                </p>

                {/* Real Live Product Tag for Scene 1 */}
                {livingProduct && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onOpenProductModal(livingProduct)}
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/25 transition-all cursor-pointer shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FF551A]" />
                      <span>معاينة القطعة: {livingProduct.name}</span>
                      <span className="font-mono text-neutral-200">({formatDZD(livingProduct.price)})</span>
                    </button>

                    <button
                      onClick={() => onSelectCategory('Living Room')}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-semibold transition-colors cursor-pointer"
                    >
                      <span>تصفية الصالونات بالكتالوج</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* -------------------------------------------------------------
                LAYER 2: SCENE 2 (DINING ARCHITECTURE) - THE PHYSICAL OVERLAP
                Advances from left with deep shadow, border & overlapping boundary!
                ------------------------------------------------------------- */}
            <div
              className="absolute inset-y-0 left-0 w-full sm:w-[85%] lg:w-[75%] h-full will-change-transform transition-all duration-75 origin-left"
              style={{
                transform: `translateX(${scene2TranslateX}%) scale(${scene2Scale})`,
                opacity: scene2Opacity,
                zIndex: 20,
              }}
            >
              {/* Overlapping container with architectural border & deep elevation */}
              <div className="relative w-full h-full overflow-hidden rounded-r-3xl border-r-2 border-y-2 border-white/20 shadow-[-25px_0_60px_rgba(0,0,0,0.8)] bg-neutral-900">
                <img
                  src={scene2Image}
                  alt="غرفة طعام خشبية فاخرة من خشب الجوز الأمريكي"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

                {/* Scene 2 Editorial Overlay Content */}
                <div
                  className={`absolute bottom-6 sm:bottom-12 right-6 sm:right-12 left-6 max-w-xl space-y-4 transition-all duration-300 ${
                    activeChapter === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
                  }`}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E]/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#FF551A]">
                    <span>02 · دفء الخشب والاجتماع</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                    طاولات مستدامة تجمع العائلة بدفء الخشب الطبيعي
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg hidden sm:block">
                    طاولات طعام من خشب الجوز الأمريكي الصلب بحواف مشطوفة وتشطيب غير لامع يقاوم الخدوش والبقع مع استخدام يومي مريح.
                  </p>

                  {/* Real Live Product Tag for Scene 2 */}
                  {diningProduct && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => onOpenProductModal(diningProduct)}
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة القطعة: {diningProduct.name}</span>
                        <span className="font-mono text-orange-100">({formatDZD(diningProduct.price)})</span>
                      </button>

                      <button
                        onClick={() => onSelectCategory('Dining Room')}
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white font-semibold transition-colors cursor-pointer"
                      >
                        <span>تصفية غرف الطعام بالكتالوج</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Overlap Badge (Visible at intermediate scroll positions 0.35 -> 0.65) */}
            {p >= 0.30 && p <= 0.70 && !prefersReducedMotion && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-bold text-neutral-200 shadow-xl pointer-events-none animate-in fade-in duration-200">
                <Sparkles className="w-3.5 h-3.5 text-[#FF551A]" />
                <span>تناغم التصاميم · مشهد مزدوج متقاطع</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stage Transition Bar (Connecting Naturally to Catalogue) */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-400 border-t border-white/10 pt-4">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-neutral-400">
              {p < 0.8
                ? 'استمر بالتمرير لاكتشاف التداخل المعماري والانتقال إلى الكتالوج'
                : 'أنت الآن على وشك دخول الكتالوج الحي الكامل لمنتجات أثاث الثقة'}
            </span>
          </div>

          <button
            onClick={onNavigateToCatalog}
            className="self-end sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-[#FF551A] hover:text-white text-neutral-200 font-bold transition-all cursor-pointer"
          >
            <span>الانتقال فوراً للكتالوج الكامل</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
