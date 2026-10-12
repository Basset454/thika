import React, { useState } from 'react';
import { Armchair, Menu, X, MapPin } from 'lucide-react';

interface CustomerNavbarProps {
  onCategorySelect?: (cat: string) => void;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({ onCategorySelect }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (cat?: string, anchorId?: string) => {
    setMobileMenuOpen(false);
    if (cat && onCategorySelect) {
      onCategorySelect(cat);
    }
    if (anchorId) {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-xs py-0'
          : 'bg-white/90 backdrop-blur-xs border-b border-neutral-100 py-1'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark (Single Text / Identity Element) */}
          <a
            href="/"
            className="flex items-center gap-3.5 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A] rounded-xl"
            aria-label="أثاث الثقة - الصفحة الرئيسية"
          >
            <div className="w-11 h-11 rounded-xl bg-[#1E1E1E] text-white flex items-center justify-center shadow-sm group-hover:bg-[#FF551A] transition-colors duration-200">
              <Armchair className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1E1E1E] block leading-tight">
                أثاث الثقة
              </span>
              <span className="text-[11px] font-medium text-neutral-400 block tracking-wider uppercase">
                TRUST FURNITURE STUDIO
              </span>
            </div>
          </a>

          {/* Zone 2: 4–5 Concise Single-Line Text Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600"
            aria-label="القائمة الرئيسية"
          >
            <button
              onClick={() => handleNavClick('All', 'collection')}
              className="hover:text-[#FF551A] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent hover:border-[#FF551A] cursor-pointer"
            >
              تشكيلة الأثاث
            </button>
            <button
              onClick={() => handleNavClick('Living Room', 'world-living')}
              className="hover:text-[#FF551A] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent hover:border-[#FF551A] cursor-pointer"
            >
              الصالونات والمعيشة
            </button>
            <button
              onClick={() => handleNavClick('Dining Room', 'world-dining')}
              className="hover:text-[#FF551A] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent hover:border-[#FF551A] cursor-pointer"
            >
              غرف الطعام
            </button>
            <a
              href="#branches"
              className="hover:text-[#FF551A] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent hover:border-[#FF551A]"
            >
              فروعنا الثلاثة
            </a>
            <a
              href="#story"
              className="hover:text-[#FF551A] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent hover:border-[#FF551A]"
            >
              جودة الخامات
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action & Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#branches"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF551A]" />
              <span>زيارة المعارض</span>
            </a>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF551A]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleNavClick('All', 'collection')}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              تشكيلة الأثاث الكاملة
            </button>
            <button
              onClick={() => handleNavClick('Living Room', 'collection')}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              صالونات وغرف معيشة
            </button>
            <button
              onClick={() => handleNavClick('Dining Room', 'collection')}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              غرف طعام وطاولات
            </button>
            <button
              onClick={() => handleNavClick('Bedroom', 'collection')}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              غرف نوم وأسرّة
            </button>
            <button
              onClick={() => handleNavClick('Office', 'collection')}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              مكاتب ومساحات عمل
            </button>
            <a
              href="#branches"
              onClick={() => setMobileMenuOpen(false)}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              فروعنا الثلاثة
            </a>
            <a
              href="#story"
              onClick={() => setMobileMenuOpen(false)}
              className="text-right py-2.5 px-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              جودة الخامات والصناعة
            </a>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <a
              href="#branches"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1E1E1E] text-white text-xs font-bold hover:bg-[#FF551A] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#FF551A]" />
              <span>زيارة فروعنا ومعارضنا</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
