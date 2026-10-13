import React, { useState, useEffect } from 'react';
import { Armchair, Menu, X, Search, MapPin, ChevronDown } from 'lucide-react';

interface CustomerNavbarProps {
  onCategorySelect?: (cat: string) => void;
  onSearchFocus?: () => void;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  onCategorySelect,
  onSearchFocus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (anchorId: string, category?: string) => {
    setMobileMenuOpen(false);
    if (category && onCategorySelect) {
      onCategorySelect(category);
    }
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchClick = () => {
    setMobileMenuOpen(false);
    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => searchInput.focus(), 300);
    } else {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (onSearchFocus) onSearchFocus();
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs py-2'
          : 'bg-[#FBFBFB] border-b border-neutral-200/50 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-18">
          
          {/* Logo & Brand Identity */}
          <a
            href="/"
            className="flex items-center gap-3 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A] rounded-xl"
            aria-label="أثاث الثقة - الصفحة الرئيسية"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1E1E1E] text-white flex items-center justify-center shadow-sm group-hover:bg-[#FF551A] transition-colors duration-200">
              <Armchair className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1E1E1E] leading-tight group-hover:text-[#FF551A] transition-colors">
                أثاث الثقة
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                TRUST FURNITURE
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-neutral-700"
            aria-label="القائمة الرئيسية"
          >
            <button
              type="button"
              onClick={() => handleNavClick('categories')}
              className="hover:text-[#FF551A] transition-colors py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF551A] rounded"
            >
              تشكيلة الأثاث
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('featured')}
              className="hover:text-[#FF551A] transition-colors py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF551A] rounded"
            >
              القطع المميزة
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('catalog', 'All')}
              className="hover:text-[#FF551A] transition-colors py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF551A] rounded"
            >
              الكتالوج
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('branches')}
              className="hover:text-[#FF551A] transition-colors py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF551A] rounded"
            >
              فروعنا
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('guarantees')}
              className="hover:text-[#FF551A] transition-colors py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF551A] rounded"
            >
              الخامات والضمان
            </button>
          </nav>

          {/* Action Tools: Search & Catalog Access */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-neutral-600 hover:text-[#1E1E1E] hover:bg-neutral-100 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-transparent hover:border-neutral-200"
              title="البحث في الكتالوج"
              aria-label="البحث في الكتالوج"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-600" />
              <span className="hidden lg:inline text-neutral-500">بحث سريع</span>
            </button>

            {/* Catalog Button */}
            <button
              type="button"
              onClick={() => handleNavClick('catalog', 'All')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
            >
              <span>تصفح الكتالوج</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-5 pt-4 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-neutral-800">
            <button
              type="button"
              onClick={() => handleNavClick('categories')}
              className="text-right py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between"
            >
              <span>تشكيلة الأثاث والتصنيفات</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 rotate-270" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('featured')}
              className="text-right py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between"
            >
              <span>القطع المميزة</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 rotate-270" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('catalog', 'All')}
              className="text-right py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between"
            >
              <span>الكتالوج الكامل</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 rotate-270" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('branches')}
              className="text-right py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between"
            >
              <span>فروعنا ومعارضنا الثلاثة</span>
              <MapPin className="w-4 h-4 text-[#FF551A]" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('guarantees')}
              className="text-right py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between"
            >
              <span>الخامات والضمان</span>
              <ChevronDown className="w-4 h-4 text-neutral-400 rotate-270" />
            </button>
          </nav>

          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleSearchClick}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-50 transition-colors"
            >
              <Search className="w-4 h-4 text-neutral-500" />
              <span>بحث في كتالوج المنتجات</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('branches')}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#1E1E1E] text-white text-xs font-bold hover:bg-[#FF551A] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#FF551A]" />
              <span>زيارة معارضنا في الجزائر</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
