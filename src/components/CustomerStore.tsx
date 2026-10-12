import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../types';
import { ARABIC_CATEGORIES, STORE_BRANCHES, formatDZD } from '../data/initialProducts';
import { BranchLocationsSection } from './BranchLocationsSection';
import { EditorialHero } from './EditorialHero';
import { CinematicStoryStage } from './CinematicStoryStage';
import {
  Eye,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowLeft,
  Compass,
  Check,
  Armchair
} from 'lucide-react';

interface CustomerStoreProps {
  products: Product[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const CustomerStore: React.FC<CustomerStoreProps> = ({
  products,
  selectedCategory: externalCategory,
  onCategoryChange,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('All');
  const selectedCategory = externalCategory !== undefined ? externalCategory : internalCategory;

  const handleCategorySelect = (cat: string) => {
    if (onCategoryChange) {
      onCategoryChange(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'newest'>('default');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Active Story Chapter Tracker
  const [activeChapter, setActiveChapter] = useState<'entrance' | 'story' | 'office' | 'catalog' | 'branches' | 'craft'>('entrance');

  // Filter only published products for public storefront
  const publishedProducts = useMemo(() => {
    return products.filter((p) => p.isPublished !== false);
  }, [products]);

  // Featured Room Products from real data
  const livingProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('living') || c.includes('معيشة') || c.includes('صالون');
    });
  }, [publishedProducts]);

  const diningProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('dining') || c.includes('طعام') || c.includes('سفرة');
    });
  }, [publishedProducts]);

  const officeProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      const c = (p.category || '').toLowerCase();
      return c.includes('office') || c.includes('مكتب') || c.includes('عمل');
    });
  }, [publishedProducts]);

  // Filter and sort products for catalogue
  const filteredProducts = useMemo(() => {
    let result = [...publishedProducts];

    // Category filter
    if (selectedCategory !== 'All') {
      const catMeta = ARABIC_CATEGORIES.find((c) => c.id === selectedCategory);
      result = result.filter((p) => {
        if (!p.category) return false;
        if (p.category.toLowerCase() === selectedCategory.toLowerCase()) return true;
        if (catMeta) {
          const catLower = p.category.toLowerCase();
          return (
            catMeta.keywords.some((kw) => catLower.includes(kw.toLowerCase())) ||
            p.category.includes(catMeta.nameAr) ||
            p.category.includes(catMeta.nameEn)
          );
        }
        return false;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [publishedProducts, selectedCategory, searchQuery, sortBy]);

  // Track chapters using IntersectionObserver
  useEffect(() => {
    const chapters = [
      { id: 'hero-entrance', name: 'entrance' },
      { id: 'cinematic-story', name: 'story' },
      { id: 'world-office', name: 'office' },
      { id: 'collection', name: 'catalog' },
      { id: 'branches', name: 'branches' },
      { id: 'story', name: 'craft' },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const found = chapters.find((c) => c.id === entry.target.id);
            if (found) {
              setActiveChapter(found.name as any);
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const openProductModal = (product: Product) => {
    setActiveProduct(product);
    setActiveImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    setActiveProduct(null);
    document.body.style.overflow = 'unset';
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProduct) return;
      if (e.key === 'Escape') {
        closeProductModal();
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeProduct.images.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev < activeProduct.images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProduct]);

  const resetFilters = () => {
    handleCategorySelect('All');
    setSearchQuery('');
    setSortBy('default');
  };

  const jumpToWorld = (catName: string, anchorId: string) => {
    handleCategorySelect(catName);
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAnchor = (anchorId: string) => {
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryArabicName = (catName: string) => {
    const found = ARABIC_CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === catName.toLowerCase() ||
        c.nameEn.toLowerCase() === catName.toLowerCase() ||
        c.nameAr === catName
    );
    return found ? found.nameAr : catName;
  };

  return (
    <div className="space-y-0 pb-24">
      
      {/* =========================================================================
          CHAPTER NAVIGATION DOCK (Non-intrusive Ambient Orientation)
          ========================================================================= */}
      <aside
        aria-label="مؤشر فصول الجولة المعمارية"
        className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 bg-white/85 backdrop-blur-md p-2 rounded-2xl border border-neutral-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-xs transition-opacity duration-300"
      >
        <button
          onClick={() => scrollToAnchor('hero-entrance')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'entrance'
              ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال للمدخل المعماري"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">01 · المدخل</span>
        </button>

        <button
          onClick={() => scrollToAnchor('cinematic-story')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'story'
              ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال إلى الجولة السينمائية المتقاطعة"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">02 · الجولة السينمائية</span>
        </button>

        <button
          onClick={() => scrollToAnchor('world-office')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'office'
              ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال إلى مساحات العمل والمكاتب"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">03 · المكاتب</span>
        </button>

        <button
          onClick={() => scrollToAnchor('collection')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'catalog'
              ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال للكتالوج الكامل"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">04 · الكتالوج</span>
        </button>

        <button
          onClick={() => scrollToAnchor('branches')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'branches'
              ? 'bg-[#FF551A] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال إلى فروع ومعارض أثاث الثقة"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">05 · الفروع</span>
        </button>

        <button
          onClick={() => scrollToAnchor('story')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeChapter === 'craft'
              ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
          }`}
          title="الانتقال إلى فلسفة الخامات والحرفة"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="text-[11px]">06 · الحرفية</span>
        </button>
      </aside>

      {/* =========================================================================
          CHAPTER A: THE FULL-BLEED EDITORIAL HERO (المدخل المعماري)
          ========================================================================= */}
      <EditorialHero
        onExploreCatalog={() => scrollToAnchor('collection')}
        onStartStory={() => scrollToAnchor('cinematic-story')}
        featuredProduct={livingProducts[0] || publishedProducts[0]}
        onOpenProductModal={openProductModal}
      />

      {/* =========================================================================
          CHAPTER B: SIGNATURE CINEMATIC SCROLL SEQUENCE (LIVING & DINING OVERLAP)
          Sticky visual stage with native scroll progress & physical image boundaries
          ========================================================================= */}
      <CinematicStoryStage
        products={publishedProducts}
        onSelectCategory={(cat) => jumpToWorld(cat, 'collection')}
        onOpenProductModal={openProductModal}
        onNavigateToCatalog={() => scrollToAnchor('collection')}
      />

      {/* =========================================================================
          CONTAINED CORE: CATALOGUE, WORKSPACES, BRANCHES & PHILOSOPHY
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pt-16">

      {/* WORLD 3: ARCHITECTURAL WORKSPACE (عالم المساحات المكتبية) */}
      <section
        id="world-office"
        className="relative rounded-3xl overflow-hidden bg-[#1E1E1E] text-white p-8 sm:p-12 lg:p-16 border border-neutral-800 shadow-xl scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Visual Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-neutral-700/80 shadow-2xl bg-neutral-900 group">
              <img
                src={
                  officeProducts[0]?.coverImageUrl ||
                  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200&auto=format&fit=crop&q=80'
                }
                alt="مكتب معماري فاخر من خشب الدردار"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                loading="lazy"
              />
              <div className="absolute bottom-4 right-4 bg-[#1E1E1E]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-700 text-xs">
                <span className="text-[#FF551A] font-bold block text-[11px]">تنظيم هندسي متكامل</span>
                <span className="text-white font-medium">قنوات تمديد خفية ولمسات نحاسية أنيقة</span>
              </div>
            </div>

            {/* Live Office Highlights from Real Collection */}
            {officeProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {officeProducts.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openProductModal(item)}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="w-16 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700/60">
                      <img
                        src={item.coverImageUrl || item.images[0]?.url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#FF551A] transition-colors truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-bold text-neutral-300 tabular-nums block mt-1">
                        {formatDZD(item.price)}
                      </span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editorial Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A] block">
                03 · مساحات العمل والمكاتب
              </span>
              <h2
                className="text-2xl sm:text-4xl font-bold text-white leading-snug"
                style={{ textWrap: 'balance' }}
              >
                بيئة عمل ملهمة بخطوط هندسية متوازنة
              </h2>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed font-normal">
              لأن الإنتاجية تنبع من هدوء المكان، ابتكرنا مكاتب عملية من خشب الدردار المصمت مزودة بقنوات خفية لتنظيم الأسلاك وأدراج سلسة الإغلاق تمنح مساحة عملك ترتيباً معمارياً راقياً.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => jumpToWorld('Office', 'collection')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>استكشف أثاث المكاتب في الكتالوج</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          CHAPTER C & D: THE COMPLETE STORE CATALOGUE (الكتالوج الكامل المتكامل)
          ========================================================================= */}
      <section id="collection" className="space-y-8 scroll-mt-24 pt-4">
        
        {/* Section Header & Search Controls */}
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-neutral-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
                  كتالوج أثاث الثقة
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1E1E]">
                المعروضات وقطع الأثاث
              </h2>
            </div>

            {/* Search Bar & Sorter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو الخامة..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF551A] focus:border-transparent transition-all text-[#1E1E1E] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500 shrink-0 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-white text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF551A] focus:border-transparent transition-all cursor-pointer shadow-2xs"
                  aria-label="ترتيب المنتجات"
                >
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="newest">الأحدث إضافةً</option>
                  <option value="price-asc">السعر: من الأقل للأعلى</option>
                  <option value="price-desc">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Category Tabs (Segmented Buttons) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ARABIC_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#1E1E1E] text-white shadow-xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
                  }`}
                >
                  {cat.nameAr}
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicators & Count */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span>عرض <strong className="font-bold text-[#1E1E1E] tabular-nums">{filteredProducts.length}</strong> من أصل <strong className="font-bold text-[#1E1E1E] tabular-nums">{publishedProducts.length}</strong> قطعة أثاث</span>
              {(selectedCategory !== 'All' || searchQuery.trim() !== '') && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-[#FF551A] hover:underline font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إلغاء التصفية</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            PRODUCT CARDS GRID (ENHANCED MARGINS, RATIOS, SHADOWS & LUXURY TOUCHES)
            ========================================================================= */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const coverImage = product.images.find((img) => img.isCover) || product.images[0];
              const secondaryImage = product.images.length > 1 ? product.images.find((img) => !img.isCover) || product.images[1] : null;
              const categoryAr = getCategoryArabicName(product.category);

              return (
                <article
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="group cursor-pointer bg-white rounded-2xl border border-neutral-200/80 overflow-hidden luxury-card-shadow luxury-card-shadow-hover flex flex-col justify-between"
                >
                  {/* Image Container with Consistent 4:3 Aspect Ratio and Linen Surface */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F5F2] border-b border-neutral-100">
                    {/* Primary Image */}
                    <img
                      src={coverImage?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />

                    {/* Secondary Image Reveal on Hover (Desktop Luxury Interaction) */}
                    {secondaryImage && (
                      <img
                        src={secondaryImage.url}
                        alt={`${product.name} - زاوية إضافية`}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] scale-100 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}

                    {/* Frosted Glass Category Tag on Top-Right */}
                    <span className="absolute top-3.5 right-3.5 bg-white/92 backdrop-blur-md text-[#1E1E1E] text-[11px] font-bold px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 tracking-tight z-10">
                      {categoryAr}
                    </span>

                    {/* Image Counter Badge on Bottom-Right */}
                    {product.images.length > 1 && (
                      <span className="absolute bottom-3.5 right-3.5 bg-[#1E1E1E]/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm z-10">
                        <Layers className="w-3.5 h-3.5 text-neutral-300" />
                        <span className="tabular-nums">{product.images.length} صور</span>
                      </span>
                    )}

                    {/* Quick Preview Hover Overlay */}
                    <div className="absolute inset-0 bg-[#1E1E1E]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                      <span className="bg-white/95 backdrop-blur-md text-[#1E1E1E] text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 border border-neutral-200/50">
                        <Eye className="w-4 h-4 text-[#FF551A]" />
                        <span>معاينة التفاصيل</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content & Information with Harmonious Margins & Padding */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E1E1E] group-hover:text-[#FF551A] transition-colors line-clamp-1 leading-snug">
                        {product.name}
                      </h3>

                      <p className="text-xs sm:text-[13px] text-neutral-500 line-clamp-2 mt-2 leading-relaxed min-h-[2.5rem]">
                        {product.description || 'قطعة أثاث عصرية مصنوعة بعناية فائقة وتصميم متناسق يلائم أرقى الديكورات.'}
                      </p>
                    </div>

                    {/* Price and Details Action Footer */}
                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-medium text-neutral-400 block">السعر المقدر</span>
                        <span className="text-lg sm:text-xl font-bold text-[#1E1E1E] tabular-nums tracking-tight">
                          {formatDZD(product.price)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100/80 group-hover:bg-[#FF551A] text-neutral-700 group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs">
                        <span>التفاصيل</span>
                        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-[#1E1E1E]">لم نجد أي قطعة أثاث تطابق بحثك</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                جرب تغيير كلمات البحث أو اختيار تصنيف آخر من القائمة أعلاه لمعاينة بقية القطع المتوفرة.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E1E1E] text-white text-xs font-bold hover:bg-[#FF551A] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة عرض جميع القطع</span>
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          CHAPTER E: THREE VERIFIED SHOWROOM BRANCHES & MAP EXPERIENCE
          ========================================================================= */}
      <BranchLocationsSection className="pt-4" />

      {/* =========================================================================
          CHAPTER F: MATERIALS & CRAFTSMANSHIP STORY (فلسفة الجودة والحرفة)
          ========================================================================= */}
      <section id="story" className="bg-white rounded-3xl border border-neutral-200/90 p-8 sm:p-12 space-y-6 luxury-card-shadow scroll-mt-24">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
              فلسفة الحرفية
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
            خامات طبيعية وصناعة تتقن أدق التفاصيل
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            في «أثاث الثقة»، نؤمن بأن الأثاث ليس مجرد قطع وظيفية بل هو روح المكان. نحرص على اختيار أخشاب الزان والبلوط المجففة حرارياً، ونستخدم أقمشة مقاومة للبقع والبهتان مع حشوات إسفنجية عالية الكثافة تمنحك الراحة المطلقة وتدوم سنوات طويلة دون هبوط.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-neutral-100 text-xs">
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#1E1E1E] text-sm">أخشاب مصمتة فاخرة</h4>
            <p className="text-neutral-500 leading-relaxed">
              هياكل داخلية وخارجية من خشب البلوط والزان المجفف لضمان المتانة ومقاومة الرطوبة والتمدد.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#1E1E1E] text-sm">أنسجة مختارة بعناية</h4>
            <p className="text-neutral-500 leading-relaxed">
              أقمشة بوكليه ومخمل وكتان معالجة ضد امتصاص السوائل وسهلة التنظيف والعناية اليومية.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#1E1E1E] text-sm">خدمة ما بعد البيع</h4>
            <p className="text-neutral-500 leading-relaxed">
              فريق دعم فني متكامل للمتابعة والتركيب مع ضمان على جودة الهيكل والتماسك الخشبي.
            </p>
          </div>
        </div>
      </section>

      {/* End Contained Core Section */}
      </div>

      {/* =========================================================================
          PRODUCT DETAILS MODAL (RESPONSIVE GALLERY & SPECS)
          ========================================================================= */}
      {activeProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeProduct.name}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto"
          onClick={closeProductModal}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeProductModal}
              className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Image Gallery Column */}
              <div className="p-6 bg-neutral-50 border-b md:border-b-0 md:border-l border-neutral-200 flex flex-col justify-between">
                <div>
                  {/* Primary Large Image */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F6F5F2] border border-neutral-200/90 shadow-xs">
                    <img
                      src={activeProduct.images[activeImageIndex]?.url || activeProduct.images[0]?.url}
                      alt={activeProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-300"
                    />

                    {/* Arrow Navigation inside image */}
                    {activeProduct.images.length > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev < activeProduct.images.length - 1 ? prev + 1 : 0));
                          }}
                          className="pointer-events-auto p-1.5 rounded-full bg-white/80 hover:bg-white text-neutral-800 shadow-md transition-colors cursor-pointer"
                          aria-label="الصورة السابقة"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeProduct.images.length - 1));
                          }}
                          className="pointer-events-auto p-1.5 rounded-full bg-white/80 hover:bg-white text-neutral-800 shadow-md transition-colors cursor-pointer"
                          aria-label="الصورة التالية"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {activeProduct.images.length > 1 && (
                    <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
                      {activeProduct.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? 'border-[#FF551A] ring-2 ring-[#FF551A]/20 scale-102'
                              : 'border-neutral-200 hover:border-neutral-300 opacity-70 hover:opacity-100'
                          }`}
                          aria-label={`عرض الصورة ${idx + 1}`}
                        >
                          <img
                            src={img.url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Storage & Delivery Highlights */}
                <div className="mt-6 pt-5 border-t border-neutral-200 text-xs text-neutral-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FF551A] shrink-0" />
                    <span>توصيل مع التركيب المحترف متوفر لجميع الولايات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF551A] shrink-0" />
                    <span>ضمان الجودة والمتانة على الهيكل والأسفنج</span>
                  </div>
                </div>
              </div>

              {/* Product Specifications Column */}
              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 block mb-1">
                    {getCategoryArabicName(activeProduct.category)}
                  </span>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
                    {activeProduct.name}
                  </h2>

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-400 block">السعر المقدر</span>
                    <div className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] tabular-nums">
                      {formatDZD(activeProduct.price)}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      الوصف والمواصفات
                    </h4>
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                      {activeProduct.description || 'قطعة أثاث عصرية مختارة من أرقى تشكيلات أثاث الثقة.'}
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1E1E1E]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF551A]" />
                      <span>المعاينة في المعارض:</span>
                    </div>
                    <p className="text-neutral-500 text-[11px] leading-relaxed">
                      القطعة معروضة أو متاحة للطلب عبر فروع أثاث الثقة (أثاث الثقة 1، 2، 3).
                    </p>
                  </div>
                </div>

                {/* Inquiry & Contact Actions */}
                <div className="space-y-3 pt-4 border-t border-neutral-200">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `السلام عليكم، أود الاستفسار عن توفر قطعة الأثاث: ${activeProduct.name} (السعر: ${formatDZD(activeProduct.price)}) المعروضة في متجر أثاث الثقة.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FF551A] hover:bg-[#E04814] text-white font-bold text-sm rounded-xl transition-colors shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>طلب استفسار عبر واتساب</span>
                  </a>

                  <button
                    onClick={closeProductModal}
                    className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    إغلاق المعاينة والعودة للكتالوج
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
