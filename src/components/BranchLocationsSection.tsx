import React, { useState } from 'react';
import { STORE_BRANCHES, StoreBranch } from '../data/initialProducts';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  CheckCircle2,
  RefreshCw,
  Building2
} from 'lucide-react';

interface BranchLocationsSectionProps {
  className?: string;
}

export const BranchLocationsSection: React.FC<BranchLocationsSectionProps> = ({ className = '' }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(STORE_BRANCHES[0].id);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<boolean>(false);

  const activeBranch: StoreBranch =
    STORE_BRANCHES.find((b) => b.id === selectedBranchId) || STORE_BRANCHES[0];

  const handleSelectBranch = (branchId: string) => {
    if (branchId !== selectedBranchId) {
      setSelectedBranchId(branchId);
      setMapLoaded(false);
      setMapError(false);
    }
  };

  // Check if optional client Google Maps API key is configured
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

  // Embed URL: If API key is present, use Embed API; otherwise use standard Google Maps embed URL
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${activeBranch.latitude},${activeBranch.longitude}`
    : `https://maps.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}&hl=ar&z=16&output=embed`;

  return (
    <section id="branches" className={`space-y-8 scroll-mt-24 ${className}`} aria-labelledby="branches-heading">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-bold text-[#1E1E1E]">
          <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
          <span>المعارض الميدانية الرسمية</span>
        </div>
        <h2 id="branches-heading" className="text-2xl sm:text-4xl font-bold text-[#1E1E1E] tracking-tight">
          زوروا فروع أثاث الثقة
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl mx-auto">
          يسرنا استقبالكم في معارضنا المعتمدة لمعاينة أرقى قطع الأثاث وخامات الأخشاب والأقمشة على أرض الواقع وتجربة الراحة مباشرة.
        </p>
      </div>

      {/* Interactive Branch Switcher (Desktop & Mobile Segmented Tabs) */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200/80">
        {STORE_BRANCHES.map((branch) => {
          const isSelected = branch.id === selectedBranchId;
          return (
            <button
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[#1E1E1E] text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
              aria-pressed={isSelected}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF551A]' : 'text-neutral-400'}`} />
              <span>{branch.name}</span>
            </button>
          );
        })}
      </div>

      {/* Single Interactive Embedded Map */}
      <div className="relative rounded-3xl overflow-hidden bg-[#F6F5F2] border border-neutral-200/90 luxury-card-shadow">
        {/* Top Map Context Bar */}
        <div className="p-4 sm:px-6 bg-white border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] text-white flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#FF551A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1E1E1E] text-sm">{activeBranch.name}</span>
                <span className="text-[11px] font-medium text-neutral-400">· {activeBranch.title}</span>
              </div>
              <span className="text-neutral-500 text-[11px] font-mono tracking-tight tabular-nums block sm:inline">
                {activeBranch.latitude}, {activeBranch.longitude}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={activeBranch.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1E1E] text-xs font-bold transition-colors"
              title="فتح الموقع في خرائط Google"
            >
              <span>عرض في خرائط Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>

            <a
              href={activeBranch.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF551A] hover:bg-[#E04814] text-white text-xs font-bold transition-colors shadow-2xs"
              title="احصل على مسار الاتجاهات نحو هذا الفرع"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>احصل على الاتجاهات</span>
            </a>
          </div>
        </div>

        {/* Map Viewport Area */}
        <div className="relative w-full h-[360px] sm:h-[440px] bg-neutral-200">
          {/* Map Loading State */}
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F6F5F2] text-neutral-500 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#FF551A]" />
              <span className="text-xs font-semibold">جارٍ تحميل الخريطة التفاعلية...</span>
            </div>
          )}

          {/* Map Error / Fallback State */}
          {mapError ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-6 text-center space-y-3">
              <MapPin className="w-10 h-10 text-neutral-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1E1E1E]">تعذر تحميل المعاينة المباشرة للخريطة</h4>
                <p className="text-xs text-neutral-500 max-w-md">
                  يمكنكم فتح الموقع مباشرة في تطبيق خرائط Google أو الحصول على خط السير بنقرة واحدة.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <a
                  href={activeBranch.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1E1E1E] text-white text-xs font-bold hover:bg-[#FF551A] transition-colors"
                >
                  فتح في خرائط Google
                </a>
                <button
                  onClick={() => {
                    setMapError(false);
                    setMapLoaded(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold hover:bg-neutral-50"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          ) : (
            <iframe
              key={activeBranch.id}
              src={embedUrl}
              title={`خريطة موقع ${activeBranch.name}`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
              onError={() => setMapError(true)}
            />
          )}
        </div>
      </div>

      {/* Three Distinct, Well-Designed Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STORE_BRANCHES.map((branch, index) => {
          const isSelected = branch.id === selectedBranchId;
          return (
            <article
              key={branch.id}
              className={`bg-white rounded-2xl border p-6 space-y-5 transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#FF551A] ring-2 ring-[#FF551A]/20 luxury-card-shadow'
                  : 'border-neutral-200/90 luxury-card-shadow hover:border-neutral-300'
              }`}
            >
              <div className="space-y-4">
                {/* Header: Index Badge + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-[#FF551A] text-white shadow-xs' : 'bg-[#1E1E1E] text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E1E1E] leading-snug">
                        {branch.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#FF551A] block">
                        {branch.title}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF551A] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>معروض</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {branch.description}
                </p>
              </div>

              {/* Actions Baseline */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                {/* Focus in embedded map button if not already selected */}
                {!isSelected && (
                  <button
                    type="button"
                    onClick={() => handleSelectBranch(branch.id)}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[#1E1E1E] text-xs font-bold transition-colors border border-neutral-200/80 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#FF551A]" />
                    <span>تحديد الفرع على الخريطة</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* Action 1: عرض الموقع (Exact Canonical Owner URL) */}
                  <a
                    href={branch.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1E1E] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-center"
                    title={`عرض موقع ${branch.name} على خرائط Google`}
                  >
                    <span>عرض الموقع</span>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                  </a>

                  {/* Action 2: احصل على الاتجاهات (Standard Directions URL with exact coordinates) */}
                  <a
                    href={branch.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-center shadow-2xs"
                    title={`احصل على الاتجاهات نحو ${branch.name}`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>احصل على الاتجاهات</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
