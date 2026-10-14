import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { getStoreSettings, updateStoreSettings, uploadImageFiles } from '../services/api';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Save, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ExternalLink,
  Eye,
  Sliders,
  Type
} from 'lucide-react';

interface AdminStorefrontSettingsProps {
  onSettingsUpdated?: (settings: StoreSettings) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminStorefrontSettings: React.FC<AdminStorefrontSettingsProps> = ({
  onSettingsUpdated,
  showToast,
}) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form Fields
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroBadgeText, setHeroBadgeText] = useState('');
  const [heroTitlePrefix, setHeroTitlePrefix] = useState('');
  const [heroTitleHighlight, setHeroTitleHighlight] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [typewriterPhrases, setTypewriterPhrases] = useState<string[]>([]);
  const [newPhraseInput, setNewPhraseInput] = useState('');
  const [heroCtaPrimaryText, setHeroCtaPrimaryText] = useState('');
  const [heroCtaPrimaryLink, setHeroCtaPrimaryLink] = useState('');
  const [heroCtaSecondaryText, setHeroCtaSecondaryText] = useState('');
  const [heroCtaSecondaryLink, setHeroCtaSecondaryLink] = useState('');

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getStoreSettings();
      setSettings(data);
      setHeroImageUrl(data.heroImageUrl || '');
      setHeroBadgeText(data.heroBadgeText || '');
      setHeroTitlePrefix(data.heroTitlePrefix || '');
      setHeroTitleHighlight(data.heroTitleHighlight || '');
      setHeroDescription(data.heroDescription || '');
      setTypewriterPhrases(data.heroTypewriterPhrases || []);
      setHeroCtaPrimaryText(data.heroCtaPrimaryText || '');
      setHeroCtaPrimaryLink(data.heroCtaPrimaryLink || '');
      setHeroCtaSecondaryText(data.heroCtaSecondaryText || '');
      setHeroCtaSecondaryLink(data.heroCtaSecondaryLink || '');
      if (onSettingsUpdated) {
        onSettingsUpdated(data);
      }
    } catch (err: any) {
      console.error('Failed to load store settings:', err);
      showToast(err.message || 'تعذر تحميل إعدادات واجهة المتجر.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً (الحد الأقصى 20 ميغابايت).', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedImages = await uploadImageFiles([file]);
      if (uploadedImages.length > 0 && uploadedImages[0].url) {
        setHeroImageUrl(uploadedImages[0].url);
        showToast('تم رفع صورة الواجهة بنجاح إلى التخزين الدائم.');
      }
    } catch (err: any) {
      console.error('Failed to upload hero image:', err);
      showToast(err.message || 'فشل رفع الصورة إلى الخادم.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddPhrase = () => {
    const clean = newPhraseInput.trim();
    if (!clean) return;
    if (typewriterPhrases.includes(clean)) {
      showToast('هذه العبارة مضافة بالفعل.');
      return;
    }
    setTypewriterPhrases([...typewriterPhrases, clean]);
    setNewPhraseInput('');
  };

  const handleRemovePhrase = (index: number) => {
    if (typewriterPhrases.length <= 1) {
      showToast('يجب الإبقاء على عبارة تسويقية واحدة على الأقل.', 'error');
      return;
    }
    setTypewriterPhrases(typewriterPhrases.filter((_, i) => i !== index));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        heroImageUrl: heroImageUrl.trim(),
        heroBadgeText: heroBadgeText.trim(),
        heroTitlePrefix: heroTitlePrefix.trim(),
        heroTitleHighlight: heroTitleHighlight.trim(),
        heroDescription: heroDescription.trim(),
        heroTypewriterPhrases: typewriterPhrases.filter(Boolean),
        heroCtaPrimaryText: heroCtaPrimaryText.trim(),
        heroCtaPrimaryLink: heroCtaPrimaryLink.trim(),
        heroCtaSecondaryText: heroCtaSecondaryText.trim(),
        heroCtaSecondaryLink: heroCtaSecondaryLink.trim(),
      };

      const updated = await updateStoreSettings(payload);
      setSettings(updated);
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      showToast('تم حفظ إعدادات الواجهة الرئيسية وتحديث المتجر بنجاح.');
    } catch (err: any) {
      console.error('Failed to update storefront settings:', err);
      showToast(err.message || 'فشل حفظ الإعدادات في قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToEditorialDefaults = () => {
    setHeroImageUrl('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=85');
    setHeroBadgeText('أثاث الثقة · فخامة الأثاث المعاصر في الجزائر');
    setHeroTitlePrefix('فخامة الأثاث العصري..');
    setHeroTitleHighlight('تدوم لأجيال');
    setHeroDescription('دار متخصصة في تصميم وتوريد أرقى الصالونات، غرف الطعام، والمساحات المكتبية. نعتمد أخشاب الزان والبلوط الطبيعية وأفخر الأقمشة لتجربة راحة استثنائية.');
    setTypewriterPhrases([
      'تفاصيل تصنع الفرق',
      'مساحات تعكس ذوقك',
      'راحة تبدأ من اختيارك',
      'جمال يسكن تفاصيل بيتك'
    ]);
    setHeroCtaPrimaryText('تصفح الأثاث');
    setHeroCtaPrimaryLink('#catalog');
    setHeroCtaSecondaryText('اكتشف فروعنا');
    setHeroCtaSecondaryLink('#branches');
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-neutral-200/90 shadow-xs text-center space-y-2">
        <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#FF551A]" />
        <p className="text-xs text-neutral-500 font-medium">جاري تحميل إعدادات واجهة المتجر من قاعدة البيانات...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
              تخصيص الواجهة الرئيسية (Hero)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">
            إعدادات الصورة والعناوين التسويقية
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            تحكّم بشكل مستقل في صورة الواجهة الرئيسية، العناوين الثابتة، الكلمة البارزة بالبرتقالي، وعبارات الكتابة المتحركة، مع حفظ دائم في قاعدة البيانات وتحديث فوري للمتصفحات.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToEditorialDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-bold transition-all cursor-pointer"
            title="استعادة النصوص والصورة التحريرية الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات في قاعدة البيانات'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left = Form, Right = Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Hero Image Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#1E1E1E] flex items-center gap-2 border-b border-neutral-100 pb-3">
              <ImageIcon className="w-4 h-4 text-[#FF551A]" />
              <span>صورة الواجهة الرئيسية المستقلة (Hero Cover)</span>
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700">
                رابط الصورة المباشر أو الرفع من جهازك
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
                
                <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5 text-[#FF551A]" />
                  <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                الصورة تُحفظ بشكل دائم ولا تتأثر بإضافة أو حذف منتجات المتجر. يُفضل استخدام صورة أفقية بدقة 1600×1000 أو أعلى.
              </p>
            </div>
          </div>

          {/* 2. Fixed Titles & Identity */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#1E1E1E] flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Type className="w-4 h-4 text-[#FF551A]" />
              <span>العنوان الرئيسي الثابت والنص التعريفي</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  العبارة التعريفية الصغيرة (Badge)
                </label>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={(e) => setHeroBadgeText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    بداية العنوان الثابت (H1)
                  </label>
                  <input
                    type="text"
                    value={heroTitlePrefix}
                    onChange={(e) => setHeroTitlePrefix(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    الكلمة البارزة بالبرتقالي (#FF551A)
                  </label>
                  <input
                    type="text"
                    value={heroTitleHighlight}
                    onChange={(e) => setHeroTitleHighlight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  الوصف التحريري للدار
                </label>
                <textarea
                  rows={3}
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Typewriter Secondary Line Phrases */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#1E1E1E] flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#FF551A]" />
              <span>عبارات سطر الكتابة والمحو المتحرك</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPhraseInput}
                  onChange={(e) => setNewPhraseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPhrase();
                    }
                  }}
                  placeholder="أدخل عبارة تسويقية جديدة واضغط إضافة..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
                <button
                  type="button"
                  onClick={handleAddPhrase}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {typewriterPhrases.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{phrase}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhrase(idx)}
                      className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                      title="حذف هذه العبارة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Action Buttons (CTA) */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#1E1E1E] flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Sliders className="w-4 h-4 text-[#FF551A]" />
              <span>أزرار الدعوة إلى الإجراء (CTA Buttons)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  نص الزر الأساسي
                </label>
                <input
                  type="text"
                  value={heroCtaPrimaryText}
                  onChange={(e) => setHeroCtaPrimaryText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
                <input
                  type="text"
                  value={heroCtaPrimaryLink}
                  onChange={(e) => setHeroCtaPrimaryLink(e.target.value)}
                  placeholder="مثال: #catalog"
                  className="w-full mt-2 px-4 py-2 rounded-xl border border-neutral-100 bg-neutral-50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  نص الزر الثانوي
                </label>
                <input
                  type="text"
                  value={heroCtaSecondaryText}
                  onChange={(e) => setHeroCtaSecondaryText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
                <input
                  type="text"
                  value={heroCtaSecondaryLink}
                  onChange={(e) => setHeroCtaSecondaryLink(e.target.value)}
                  placeholder="مثال: #branches"
                  className="w-full mt-2 px-4 py-2 rounded-xl border border-neutral-100 bg-neutral-50 text-xs font-mono"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-[#1E1E1E] text-white p-5 rounded-3xl shadow-xl space-y-4 border border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#FF551A]" />
                <span>معاينة حية لشكل الواجهة الرئيسية</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                تحديث فوري
              </span>
            </div>

            {/* Simulated Hero Card */}
            <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-[#282828] space-y-3">
              <div className="aspect-[16/10] w-full bg-neutral-900 relative overflow-hidden">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Hero Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                    لا توجد صورة
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 space-y-1">
                  <span className="text-[10px] text-[#FF551A] font-bold block">
                    {heroBadgeText}
                  </span>
                  <h4 className="text-base font-black text-white leading-tight">
                    {heroTitlePrefix} بجودة <span className="text-[#FF551A]">{heroTitleHighlight}</span>
                  </h4>
                  <div className="text-xs text-neutral-200 font-semibold flex items-center gap-1 pt-0.5">
                    <span>{typewriterPhrases[0] || 'تفاصيل تصنع الفرق'}</span>
                    <span className="w-1.5 h-3 bg-[#FF551A] inline-block animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="p-3 text-[11px] text-neutral-400 leading-relaxed border-t border-neutral-700/60">
                {heroDescription}
              </div>

              <div className="p-3 pt-0 flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-[#FF551A] text-white text-[10px] font-bold">
                  {heroCtaPrimaryText || 'تصفح الأثاث'}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-neutral-700 text-white text-[10px] font-bold">
                  {heroCtaSecondaryText || 'اكتشف فروعنا'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'تطبيق التعديلات وحفظها'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </form>
  );
};
