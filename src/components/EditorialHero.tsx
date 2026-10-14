import React, { useState, useEffect, useRef } from 'react';
import { Product, StoreSettings } from '../types';
import { ChevronLeft, MapPin, Eye, ArrowDown } from 'lucide-react';

interface EditorialHeroProps {
  onExploreCatalog: () => void;
  onExploreBranches: () => void;
  onScrollToCategories?: () => void;
  featuredProduct?: Product;
  onOpenProductModal?: (product: Product) => void;
  settings?: StoreSettings | null;
}

const HERO_SUB_PHRASES = [
  'تفاصيل تصنع الفرق',
  'مساحات تعكس ذوقك',
  'راحة تبدأ من اختيارك',
  'جمال يسكن تفاصيل بيتك',
];

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onExploreCatalog,
  onExploreBranches,
  onScrollToCategories,
  featuredProduct,
  onOpenProductModal,
  settings,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Scroll listener for subtle hero image parallax
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY < 1200) {
            setScrollY(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Subtle parallax offset bounded tightly so image remains crisp and centered in its frame
  const parallaxOffset = prefersReducedMotion ? 0 : Math.min(scrollY * 0.12, 38);

  // Typewriter state for the complementary secondary line
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Pause typing animation when Hero section is scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Main typewriter loop for the secondary subline
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhraseIndex(0);
      setCharIndex(HERO_SUB_PHRASES[0].length);
      setIsDeleting(false);
      return;
    }

    if (!isVisible) return;

    const currentPhrase = HERO_SUB_PHRASES[phraseIndex];
    const currentChars = Array.from(currentPhrase);

    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (charIndex < currentChars.length) {
        // Natural, rhythmic typing pace (80ms per character)
        timer = setTimeout(() => {
          setCharIndex((prev) => prev + 1);
        }, 80);
      } else {
        // Full phrase written: comfortable pause for visitor to read calmly (2500ms)
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
      }
    } else {
      if (charIndex > 0) {
        // Swift, smooth backspacing (45ms per character)
        timer = setTimeout(() => {
          setCharIndex((prev) => prev - 1);
        }, 45);
      } else {
        // Fully erased: brief pause before next phrase begins (400ms)
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % HERO_SUB_PHRASES.length);
        }, 400);
      }
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex, isVisible, prefersReducedMotion]);

  const phrasesList =
    settings?.heroTypewriterPhrases && settings.heroTypewriterPhrases.length > 0
      ? settings.heroTypewriterPhrases
      : HERO_SUB_PHRASES;

  const safePhraseIndex = phraseIndex % phrasesList.length;
  const activePhrase = phrasesList[safePhraseIndex] || phrasesList[0];
  const displayText = prefersReducedMotion
    ? phrasesList[0]
    : Array.from(activePhrase).slice(0, charIndex).join('');

  // Independent Hero Image configured via Store Settings, with high-definition fallback
  const heroImage =
    settings?.heroImageUrl ||
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=85';

  const badgeText = settings?.heroBadgeText || 'أثاث الثقة · فخامة الأثاث المعاصر في الجزائر';
  const titlePrefix = settings?.heroTitlePrefix || 'فخامة الأثاث العصري..';
  const titleHighlight = settings?.heroTitleHighlight || 'تدوم لأجيال';
  const descriptionText =
    settings?.heroDescription ||
    'دار متخصصة في تصميم وتوريد أرقى الصالونات، غرف الطعام، والمساحات المكتبية. نعتمد أخشاب الزان والبلوط الطبيعية وأفخر الأقمشة لتجربة راحة استثنائية.';
  const ctaPrimaryText = settings?.heroCtaPrimaryText || 'تصفح الأثاث';
  const ctaSecondaryText = settings?.heroCtaSecondaryText || 'اكتشف فروعنا';

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#FBFBFB] border-b border-neutral-200/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Text Content Column */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 z-10">
            
            {/* 1. Subtle Brand Identity Tag */}
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
              <span>{badgeText}</span>
            </div>

            {/* 2. Fixed Prominent H1 Title with Brand Orange Accent on Highlight Text */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-[#1E1E1E] tracking-tight leading-[1.22]">
              <span>{titlePrefix}</span>{' '}
              <span className="inline sm:block text-[#1E1E1E] mt-1 sm:mt-1.5">
                بجودة <span className="text-[#FF551A]">{titleHighlight}</span>
              </span>
            </h1>

            {/* 3. Independent Animated Typewriter Secondary Line (Zero Layout Shift) */}
            <div className="min-h-[1.75rem] sm:min-h-[2.25rem] flex items-center">
              <div className="grid grid-cols-1 grid-rows-1 items-center text-base sm:text-lg md:text-xl font-semibold text-neutral-800">
                {/* Invisible anchor locked to the longest phrase for zero layout shift */}
                <span
                  className="invisible select-none pointer-events-none opacity-0 col-start-1 row-start-1"
                  aria-hidden="true"
                >
                  {phrasesList.reduce((a, b) => (a.length > b.length ? a : b), phrasesList[0])}
                </span>

                {/* Animated typing phrase with delicate orange cursor */}
                <span
                  className="col-start-1 row-start-1 inline-flex items-center gap-1.5 sm:gap-2 text-[#1E1E1E]"
                  dir="rtl"
                  aria-live="polite"
                  aria-label={`شعار متحرك: ${activePhrase}`}
                >
                  <span className="text-[#1E1E1E] font-bold">
                    {displayText}
                  </span>
                  {!prefersReducedMotion && (
                    <span
                      className="inline-block w-[2.5px] sm:w-[3px] h-[1.1em] bg-[#FF551A] rounded-full animate-typewriter-cursor select-none pointer-events-none align-middle shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </div>
            </div>

            {/* 4. Smooth Arrow Button to Categories with Calm Pulse Effect */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (onScrollToCategories) {
                    onScrollToCategories();
                  } else {
                    const catEl = document.getElementById('categories');
                    if (catEl) {
                      catEl.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="group inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full bg-white text-neutral-800 hover:text-[#FF551A] border border-neutral-200/90 hover:border-[#FF551A]/40 shadow-xs hover:shadow-md transition-all duration-300 text-xs sm:text-sm font-bold cursor-pointer relative"
                aria-label="الانتقال التلقائي إلى قسم تصنيفات الأثاث"
              >
                {/* Calm Pulse Ring Indicator */}
                <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                  <span className="animate-calm-pulse absolute inline-flex h-full w-full rounded-full bg-[#FF551A]" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF551A]" />
                </span>
                <span>استكشف تصنيفات الأثاث</span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-100 group-hover:bg-[#FF551A] text-neutral-600 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:translate-y-0.5 shrink-0">
                  <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-gentle-arrow" />
                </span>
              </button>
            </div>

            {/* Very Short & Focused Paragraph */}
            <p className="text-neutral-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
              {descriptionText}
            </p>

            {/* Two Clear Primary & Secondary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
              >
                <span>{ctaPrimaryText}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreBranches}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#1E1E1E] hover:bg-neutral-800 text-white text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
              >
                <MapPin className="w-4 h-4 text-[#FF551A]" />
                <span>{ctaSecondaryText}</span>
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

          {/* High-Quality Visual Showcase Column with Hero Parallax */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xl group aspect-[4/3] sm:aspect-[16/11]">
              <img
                src={heroImage}
                alt="أثاث صالون عصري فاخر من تشكيلة أثاث الثقة"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                style={{
                  transform: prefersReducedMotion
                    ? undefined
                    : `translate3d(0, ${parallaxOffset}px, 0) scale(1.06)`,
                  willChange: 'transform',
                }}
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
