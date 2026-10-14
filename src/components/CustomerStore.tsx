import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, StoreSettings, TrustStandardsSection } from '../types';
import { ARABIC_CATEGORIES, formatDZD, getProductPricing } from '../data/initialProducts';
import { EditorialHero } from './EditorialHero';
import { ProductCard } from './ProductCard';
import { BranchLocationsSection } from './BranchLocationsSection';
import { ArchitecturalMaterialsSection } from './ArchitecturalMaterialsSection';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  Eye,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageCircle,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  CheckCircle2,
  Armchair,
  Flame,
  Award,
  Play,
  Film
} from 'lucide-react';

interface CustomerStoreProps {
  products: Product[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  settings?: StoreSettings | null;
  categories?: Category[];
  trustStandards?: TrustStandardsSection | null;
}

export const CustomerStore: React.FC<CustomerStoreProps> = ({
  products,
  selectedCategory: externalCategory,
  onCategoryChange,
  settings,
  categories: dynamicCategories,
  trustStandards,
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

  // Filter only published products for public storefront (exclude archived products)
  const publishedProducts = useMemo(() => {
    return products.filter((p) => p.isPublished !== false && !p.isArchived);
  }, [products]);

  // Featured Products (3 to 4 curated pieces)
  const featuredProducts = useMemo(() => {
    const explicitlyFeatured = publishedProducts.filter((p) => p.isFeatured);
    if (explicitlyFeatured.length >= 3) {
      return explicitlyFeatured.slice(0, 4);
    }
    // Fallback to top published items if fewer than 3 items marked as featured
    return publishedProducts.slice(0, 4);
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

  const openProductModal = (product: Product) => {
    setActiveProduct(product);
    setActiveImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    setActiveProduct(null);
    document.body.style.overflow = 'unset';
  };

  // Build unified media items (images + videos) for the product gallery
  const activeMediaList = useMemo(() => {
    if (!activeProduct) return [];
    const list: Array<{
      type: 'image' | 'video';
      id: string;
      url: string;
      name?: string;
      poster?: string;
    }> = [];

    (activeProduct.images || []).forEach((img, i) => {
      list.push({
        type: 'image',
        id: img.id || `img-${i}`,
        url: img.url,
        name: img.name,
      });
    });

    (activeProduct.videos || []).forEach((vid, v) => {
      list.push({
        type: 'video',
        id: vid.id || `vid-${v}`,
        url: vid.url,
        name: vid.name,
        poster: activeProduct.coverImageUrl || activeProduct.images?.[0]?.url,
      });
    });

    return list;
  }, [activeProduct]);

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProduct) return;
      const count = activeMediaList.length || 1;
      if (e.key === 'Escape') {
        closeProductModal();
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProduct, activeMediaList]);

  const resetFilters = () => {
    handleCategorySelect('All');
    setSearchQuery('');
    setSortBy('default');
  };

  const scrollToAnchor = (anchorId: string) => {
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectCategoryAndScroll = (category: string) => {
    handleCategorySelect(category);
    scrollToAnchor('catalog');
  };

  const getCategoryArabicName = (catName: string) => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      const match = dynamicCategories.find(
        (c) =>
          c.id.toLowerCase() === catName.toLowerCase() ||
          c.nameEn.toLowerCase() === catName.toLowerCase() ||
          c.nameAr === catName
      );
      if (match) return match.nameAr;
    }
    const found = ARABIC_CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === catName.toLowerCase() ||
        c.nameEn.toLowerCase() === catName.toLowerCase() ||
        c.nameAr === catName
    );
    return found ? found.nameAr : catName;
  };

  // Visual Category definitions with authentic imagery (Dynamic from Neon DB categories)
  const visualCategories = useMemo(() => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      const visible = dynamicCategories
        .filter((c) => !c.isHidden)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (visible.length > 0) {
        return visible.map((cat) => {
          const matchingProduct = publishedProducts.find(
            (p) =>
              (p.category && p.category.toLowerCase() === cat.id.toLowerCase()) ||
              p.category === cat.nameAr ||
              (cat.nameEn && p.category.toLowerCase() === cat.nameEn.toLowerCase())
          );
          return {
            id: cat.id,
            nameAr: cat.nameAr,
            subtitle: cat.description || `تشكيلة ${cat.nameAr} الحصرية والمصنوعة بعناية`,
            image:
              matchingProduct?.coverImageUrl ||
              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80',
          };
        });
      }
    }

    return [
      {
        id: 'Living Room',
        nameAr: 'الصالونات والمعيشة',
        subtitle: 'أطقم صالونات وأرائك وثير بتنجيد فاخر',
        image:
          publishedProducts.find((p) => (p.category || '').toLowerCase().includes('living'))?.coverImageUrl ||
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80',
      },
      {
        id: 'Dining Room',
        nameAr: 'غرف الطعام والطاولات',
        subtitle: 'طاولات خشب زان وبلوط صلب مع كراسي مكسوة',
        image:
          publishedProducts.find((p) => (p.category || '').toLowerCase().includes('dining'))?.coverImageUrl ||
          'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=900&auto=format&fit=crop&q=80',
      },
      {
        id: 'Bedroom',
        nameAr: 'غرف النوم والأسرّة',
        subtitle: 'أسرّة منجدة وخزائن مدمجة بلمسات هادئة',
        image:
          publishedProducts.find((p) => (p.category || '').toLowerCase().includes('bed'))?.coverImageUrl ||
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80',
      },
      {
        id: 'Office',
        nameAr: 'المكاتب والديكور',
        subtitle: 'مساحات عمل مريحة وإكسسوارات ديكور راقية',
        image:
          publishedProducts.find((p) => (p.category || '').toLowerCase().includes('office'))?.coverImageUrl ||
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900&auto=format&fit=crop&q=80',
      },
    ];
  }, [dynamicCategories, publishedProducts]);

  const catalogCategoryTabs = useMemo(() => {
    if (dynamicCategories && dynamicCategories.length > 0) {
      const visible = dynamicCategories
        .filter((c) => !c.isHidden)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      return [
        { id: 'All', nameAr: 'الكل' },
        ...visible.map((c) => ({ id: c.id, nameAr: c.nameAr })),
      ];
    }
    return ARABIC_CATEGORIES.map((c) => ({ id: c.id, nameAr: c.nameAr }));
  }, [dynamicCategories]);

  const storeContainerRef = useScrollReveal([filteredProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div ref={storeContainerRef} className="space-y-0 pb-20">
      
      {/* =========================================================================
          أ) الواجهة الرئيسية (HERO SECTION)
          ========================================================================= */}
      <EditorialHero
        onExploreCatalog={() => scrollToAnchor('catalog')}
        onExploreBranches={() => scrollToAnchor('branches')}
        onScrollToCategories={() => scrollToAnchor('categories')}
        featuredProduct={featuredProducts[0]}
        onOpenProductModal={openProductModal}
        settings={settings}
      />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pt-16 sm:pt-20">
        
        {/* =========================================================================
            ب) تصنيفات بصرية واضحة (VISUAL CATEGORIES)
            ========================================================================= */}
        <section id="categories" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-5 reveal-fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
                  تشكيلات أثاث الثقة
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
                تصنيفات الأثاث حسب المساحة
              </h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToAnchor('catalog')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#FF551A] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>مشاهدة الكتالوج كاملاً</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visualCategories.map((cat, index) => (
              <div
                key={cat.id}
                onClick={() => selectCategoryAndScroll(cat.id)}
                className="group cursor-pointer bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between reveal-card"
                style={{ transitionDelay: `${index * 85}ms` }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 reveal-image-curtain">
                  <img
                    src={cat.image}
                    alt={cat.nameAr}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-[#1E1E1E] group-hover:text-[#FF551A] transition-colors">
                      {cat.nameAr}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-700 group-hover:text-[#FF551A]">
                    <span>تصفح القطع</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            ج) مجموعة محدودة من المنتجات المميزة (FEATURED COLLECTION)
            ========================================================================= */}
        {featuredProducts.length > 0 && (
          <section id="featured" className="space-y-8 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-5 reveal-fade-up">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
                    مختارات مميزة
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
                  قطع أثاث حصرية ومختارة
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md">
                نماذج مميزة تجمع بين التصميم الهندسي الدقيق والخامات الخشبية الطبيعية المعالجة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={openProductModal}
                  categoryArabicName={getCategoryArabicName(product.category)}
                  delayMs={index * 85}
                  featuredVariant={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            د) الكتالوج الكامل (FULL CATALOG)
            ========================================================================= */}
        <section id="catalog" className="space-y-8 scroll-mt-24 pt-4">
          
          {/* Header & Filter Bar */}
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-neutral-200 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
                    كتالوج أثاث الثقة
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
                  جميع معروضات وقطع الأثاث
                </h2>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    id="catalog-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، الخامة، أو النوع..."
                    className="w-full pr-10 pl-8 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF551A] focus:border-transparent transition-all text-[#1E1E1E]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
                      title="مسح البحث"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sorter */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-neutral-500 shrink-0 hidden sm:block" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-white text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF551A] focus:border-transparent transition-all cursor-pointer"
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

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {catalogCategoryTabs.map((cat) => {
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

            {/* Catalog Counter & Reset */}
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
              <div className="flex items-center gap-2">
                <span>عرض {filteredProducts.length} من أصل {publishedProducts.length} قطعة أثاث</span>
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

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={openProductModal}
                  categoryArabicName={getCategoryArabicName(product.category)}
                  delayMs={(index % 6) * 75}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-[#1E1E1E]">لم نجد أي قطعة أثاث تطابق بحثك</p>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  يمكنكم تجربة كلمات بحث أخرى أو اختيار تصنيف من الأعلى لمعاينة القطع المتاحة.
                </p>
              </div>
              <button
                type="button"
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
            هـ) فروع أثاث الثقة الثلاثة (THREE BRANCHES & MAP)
            ========================================================================= */}
        <div className="reveal-fade-up">
          <BranchLocationsSection />
        </div>

        {/* =========================================================================
            و) قصة الخامات المعمارية والضمان الأكيد (ARCHITECTURAL MATERIALS STORY)
            ========================================================================= */}
        <div className="reveal-fade-up">
          <ArchitecturalMaterialsSection
            standards={trustStandards}
            products={products}
            onOpenProductModal={openProductModal}
          />
        </div>

      </div>

      {/* =========================================================================
          PRODUCT DETAILS MODAL (RESPONSIVE GALLERY & INQUIRY)
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
              
              {/* Media Gallery Column (Images & Video Player) */}
              <div className="p-6 bg-neutral-50 border-b md:border-b-0 md:border-l border-neutral-200 flex flex-col justify-between">
                <div>
                  {/* Primary Media Stage */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/90 shadow-xs flex items-center justify-center">
                    {(() => {
                      const currentMedia = activeMediaList[activeImageIndex] || activeMediaList[0];
                      if (!currentMedia) {
                        return (
                          <img
                            src={activeProduct.coverImageUrl}
                            alt={activeProduct.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        );
                      }

                      if (currentMedia.type === 'video') {
                        return (
                          <div className="w-full h-full relative flex items-center justify-center bg-black">
                            <video
                              key={currentMedia.url}
                              src={currentMedia.url}
                              poster={currentMedia.poster}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-3 right-3 bg-[#FF551A] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md pointer-events-none">
                              <Play className="w-3 h-3 fill-white" />
                              <span>فيديو استعراض القطعة</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <img
                          src={currentMedia.url}
                          alt={activeProduct.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-all duration-300"
                        />
                      );
                    })()}

                    {/* Arrow Navigation inside media */}
                    {activeMediaList.length > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev < activeMediaList.length - 1 ? prev + 1 : 0));
                          }}
                          className="pointer-events-auto p-1.5 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md transition-colors cursor-pointer"
                          aria-label="السابق"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeMediaList.length - 1));
                          }}
                          className="pointer-events-auto p-1.5 rounded-full bg-white/85 hover:bg-white text-neutral-800 shadow-md transition-colors cursor-pointer"
                          aria-label="التالي"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row (Images and Videos) */}
                  {activeMediaList.length > 1 && (
                    <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
                      {activeMediaList.map((item, idx) => (
                        <button
                          key={item.id || idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? 'border-[#FF551A] ring-2 ring-[#FF551A]/20 scale-102'
                              : 'border-neutral-200 hover:border-neutral-300 opacity-70 hover:opacity-100'
                          }`}
                          aria-label={item.type === 'video' ? `عرض الفيديو ${idx + 1}` : `عرض الصورة ${idx + 1}`}
                        >
                          {item.type === 'video' ? (
                            <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-white relative">
                              {item.poster && (
                                <img
                                  src={item.poster}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover opacity-50"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="w-6 h-6 rounded-full bg-[#FF551A] text-white flex items-center justify-center shadow-xs">
                                  <Play className="w-3 h-3 fill-white" />
                                </div>
                              </div>
                              <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-white uppercase tracking-tighter">
                                فيديو
                              </span>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guarantees Note */}
                <div className="mt-6 pt-5 border-t border-neutral-200 text-xs text-neutral-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FF551A] shrink-0" />
                    <span>توصيل مع التركيب متوفر لجميع الولايات</span>
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

                  {(() => {
                    const activePricing = getProductPricing(activeProduct);
                    if (!activePricing.hasPrice) {
                      return (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          <span className="text-xs text-neutral-400 block font-medium">السعر</span>
                          <div className="text-2xl sm:text-3xl font-bold text-neutral-800">
                            السعر عند الطلب
                          </div>
                        </div>
                      );
                    }
                    if (activePricing.isDiscounted) {
                      return (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-neutral-400 font-medium">السعر بعد التخفيض</span>
                            <span className="bg-[#FF551A] text-white text-xs font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                              {activePricing.discountBadge}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <div className="text-2xl sm:text-3xl font-bold text-[#FF551A] tabular-nums">
                              {activePricing.priceFormatted}
                            </div>
                            <div className="text-base text-neutral-400 line-through tabular-nums">
                              {activePricing.originalPriceFormatted}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <span className="text-xs text-neutral-400 block font-medium">السعر الرسمي</span>
                        <div className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] tabular-nums">
                          {activePricing.priceFormatted}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dimensions, Materials & Availability Details */}
                  {(activeProduct.dimensions || activeProduct.materials || activeProduct.availability) && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      {activeProduct.dimensions && (
                        <div>
                          <span className="text-neutral-400 block text-[10px]">المقاسات والأبعاد</span>
                          <strong className="text-neutral-800 font-bold">{activeProduct.dimensions}</strong>
                        </div>
                      )}
                      {activeProduct.materials && (
                        <div>
                          <span className="text-neutral-400 block text-[10px]">الخامات والمواد</span>
                          <strong className="text-neutral-800 font-bold">{activeProduct.materials}</strong>
                        </div>
                      )}
                      {activeProduct.availability && (
                        <div className="sm:col-span-2">
                          <span className="text-neutral-400 block text-[10px]">حالة التوفر في المعرض</span>
                          <strong className="text-[#FF551A] font-bold">
                            {activeProduct.availability === 'out_of_stock'
                              ? 'غير متوفر حالياً'
                              : activeProduct.availability === 'pre_order'
                              ? 'متاح للطلب المسبق (الحجز قبل التوريد)'
                              : activeProduct.availability === 'made_to_order'
                              ? 'تصنيع وتفصيل حسب رغبة الزبون'
                              : 'متوفر وجاهز للتسليم الفوري'}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Linked Trust Standards & Materials for this specific product */}
                  {(() => {
                    const specificStandards = (trustStandards?.items || []).filter(
                      (it) => !it.isHidden && it.linkedProductIds && it.linkedProductIds.includes(activeProduct.id)
                    );
                    if (specificStandards.length === 0) return null;
                    return (
                      <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#1E1E1E]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#FF551A]" />
                          <span>خامات ومعايير خاصة بهذه القطعة:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {specificStandards.map((std) => (
                            <span
                              key={std.id}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-neutral-200 px-2 py-0.5 rounded text-neutral-800"
                            >
                              <span>{std.title}</span>
                              {std.subtitle && <span className="text-neutral-400">({std.subtitle})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Inquiry & Contact Actions */}
                <div className="space-y-3 pt-4 border-t border-neutral-200">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `السلام عليكم، أود الاستفسار عن توفر قطعة الأثاث: ${activeProduct.name} (${
                        getProductPricing(activeProduct).hasPrice
                          ? `السعر: ${getProductPricing(activeProduct).priceFormatted}`
                          : 'السعر عند الطلب'
                      }) المعروضة في متجر أثاث الثقة.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FF551A] hover:bg-[#E04814] text-white font-bold text-sm rounded-xl transition-colors shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>طلب استفسار عبر واتساب</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      closeProductModal();
                      scrollToAnchor('branches');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-[#1E1E1E] font-bold text-xs rounded-xl transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#FF551A]" />
                    <span>معرفة موقع المعرض للمعاينة</span>
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
