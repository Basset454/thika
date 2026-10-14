import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Tag,
  Calendar,
  Layers,
  Ruler,
  Palette,
  CheckCircle2,
  Archive,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';
import { Product, ProductImage, ProductVideo, Category } from '../types';
import { ARABIC_CATEGORIES, formatDZD } from '../data/initialProducts';
import { AdminImageUploader } from './AdminImageUploader';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  categories?: Category[];
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  categories,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Living Room');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Pricing & Discount States
  const [showPrice, setShowPrice] = useState(true);
  const [price, setPrice] = useState<number | ''>('');
  const [discountActive, setDiscountActive] = useState(false);
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [discountStartDate, setDiscountStartDate] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');

  // Architectural Details
  const [dimensions, setDimensions] = useState('');
  const [materials, setMaterials] = useState('');
  const [availability, setAvailability] = useState<'in_stock' | 'pre_order' | 'made_to_order' | 'out_of_stock'>('in_stock');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available categories list
  const categoryOptions = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.filter((c) => !c.isHidden || (initialProduct && initialProduct.category === c.id));
    }
    return ARABIC_CATEGORIES.filter((c) => c.id !== 'All').map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      order: 0,
      isHidden: false,
    }));
  }, [categories, initialProduct]);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setDescription(initialProduct.description || '');
      setCategory(initialProduct.category || categoryOptions[0]?.id || 'Living Room');
      setImages(initialProduct.images || []);
      setVideos(initialProduct.videos || []);
      setIsPublished(initialProduct.isPublished !== false);
      setIsFeatured(Boolean(initialProduct.isFeatured));
      setIsArchived(Boolean(initialProduct.isArchived));

      // Pricing
      setShowPrice(initialProduct.showPrice !== false);
      setPrice(initialProduct.price || '');
      setDiscountActive(Boolean(initialProduct.discountActive));
      setDiscountPrice(initialProduct.discountPrice !== undefined ? initialProduct.discountPrice : '');
      setDiscountPercent(initialProduct.discountPercent !== undefined ? initialProduct.discountPercent : '');
      setDiscountStartDate(initialProduct.discountStartDate ? initialProduct.discountStartDate.split('T')[0] : '');
      setDiscountEndDate(initialProduct.discountEndDate ? initialProduct.discountEndDate.split('T')[0] : '');

      // Specs
      setDimensions(initialProduct.dimensions || '');
      setMaterials(initialProduct.materials || '');
      setAvailability(initialProduct.availability || 'in_stock');
    } else {
      setName('');
      setDescription('');
      setCategory(categoryOptions[0]?.id || 'Living Room');
      setImages([]);
      setVideos([]);
      setIsPublished(true);
      setIsFeatured(false);
      setIsArchived(false);

      setShowPrice(true);
      setPrice('');
      setDiscountActive(false);
      setDiscountPrice('');
      setDiscountPercent('');
      setDiscountStartDate('');
      setDiscountEndDate('');

      setDimensions('');
      setMaterials('');
      setAvailability('in_stock');
    }
  }, [initialProduct, categoryOptions]);

  // Handle Price Change with automatic discount sync
  const handleOriginalPriceChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setPrice(num);
    if (typeof num === 'number' && num > 0 && discountActive) {
      if (typeof discountPercent === 'number' && discountPercent > 0) {
        setDiscountPrice(Math.round(num * (1 - discountPercent / 100)));
      } else if (typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < num) {
        setDiscountPercent(Math.round(((num - discountPrice) / num) * 100));
      }
    }
  };

  // Sync Discount Price -> Discount Percent
  const handleDiscountPriceChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setDiscountPrice(num);
    if (typeof num === 'number' && num > 0 && typeof price === 'number' && price > 0) {
      if (num < price) {
        const percent = Math.round(((price - num) / price) * 100);
        setDiscountPercent(percent);
      }
    }
  };

  // Sync Discount Percent -> Discount Price
  const handleDiscountPercentChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setDiscountPercent(num);
    if (typeof num === 'number' && num > 0 && typeof price === 'number' && price > 0) {
      if (num > 0 && num < 100) {
        const discounted = Math.round(price * (1 - num / 100));
        setDiscountPrice(discounted);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('يرجى كتابة اسم قطعة الأثاث.');
      return;
    }

    if (showPrice) {
      if (price === '' || Number(price) <= 0) {
        setFormError('يرجى إدخال السعر بالدينار الجزائري، أو إلغاء تفعيل "عرض السعر" لاختيار "السعر عند الطلب".');
        return;
      }
    }

    if (discountActive) {
      if (!showPrice) {
        setFormError('لا يمكن تفعيل التخفيض عندما يكون السعر معطلاً (السعر عند الطلب).');
        return;
      }
      if (discountPrice === '' || Number(discountPrice) <= 0) {
        setFormError('يرجى إدخال سعر التخفيض أو نسبة الخصم المئوية.');
        return;
      }
      if (typeof price === 'number' && Number(discountPrice) >= price) {
        setFormError('سعر التخفيض يجب أن يكون أقل من السعر الأصلي لقطعة الأثاث.');
        return;
      }
      if (discountStartDate && discountEndDate) {
        if (new Date(discountStartDate).getTime() > new Date(discountEndDate).getTime()) {
          setFormError('تاريخ بداية التخفيض يجب أن يكون قبل تاريخ انتهائه.');
          return;
        }
      }
    }

    if (images.length === 0) {
      setFormError('يرجى رفع صورة واحدة على الأقل لقطعة الأثاث.');
      return;
    }

    // Ensure cover image is chosen
    const finalImages = [...images];
    if (!finalImages.some((img) => img.isCover)) {
      finalImages[0].isCover = true;
    }
    const coverObj = finalImages.find((img) => img.isCover) || finalImages[0];

    setIsSubmitting(true);

    try {
      await onSave({
        id: initialProduct?.id,
        name: name.trim(),
        price: showPrice && typeof price === 'number' ? price : 0,
        description: description.trim(),
        category,
        images: finalImages,
        videos,
        coverImageUrl: coverObj.url,
        isPublished: isArchived ? false : isPublished,
        isFeatured: isArchived ? false : isFeatured,
        showPrice,
        discountActive: showPrice ? discountActive : false,
        discountPrice: showPrice && discountActive && typeof discountPrice === 'number' ? discountPrice : undefined,
        discountPercent: showPrice && discountActive && typeof discountPercent === 'number' ? discountPercent : undefined,
        discountStartDate: showPrice && discountActive && discountStartDate ? new Date(discountStartDate).toISOString() : undefined,
        discountEndDate: showPrice && discountActive && discountEndDate ? new Date(discountEndDate).toISOString() : undefined,
        dimensions: dimensions.trim() || undefined,
        materials: materials.trim() || undefined,
        availability,
        isArchived,
      });
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ قطعة الأثاث. يرجى المحاولة مجددًا.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8 animate-in fade-in duration-150">
      
      {/* Form Header */}
      <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-neutral-500 hover:text-[#1E1E1E] rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            title="العودة لإدارة المنتجات"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">
              {initialProduct ? `تعديل قطعة الأثاث: ${initialProduct.name}` : 'إضافة قطعة أثاث جديدة'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              إدارة كافة تفاصيل القطعة، الوسائط، الأسعار والعروض الترويجية، ومواصفات الخامات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
        >
          إلغاء التعديل
        </button>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#FF551A]" />
            <span>البيانات الأساسية والتصنيف</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                اسم قطعة الأثاث *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صالون زاوية رويال بقماش بوكليه إيطالي"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] text-[#1E1E1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                التصنيف *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white text-[#1E1E1E] cursor-pointer"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr} ({cat.nameEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">
              الوصف العام للقطعة
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف تفصيلي للتصميم والراحة، مناسب لعرض القطعة للزبائن..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] leading-relaxed text-[#1E1E1E]"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Discounts (Requirement 2) */}
        <div className="space-y-4 bg-neutral-50/70 p-5 sm:p-6 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#FF551A]" />
              <span>الأسعار والتخفيضات الترويجية</span>
            </h2>

            {/* Toggle Show Price */}
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => {
                  setShowPrice(e.target.checked);
                  if (!e.target.checked) setDiscountActive(false);
                }}
                className="w-4 h-4 text-[#FF551A] rounded focus:ring-[#FF551A] cursor-pointer"
              />
              <span className="text-neutral-800">
                {showPrice ? 'عرض السعر في المتجر' : 'السعر عند الطلب'}
              </span>
            </label>
          </div>

          {!showPrice ? (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">تم تفعيل خيار «السعر عند الطلب»</p>
                <p className="text-amber-800 text-[11px]">
                  لن يتم عرض أي رقم أو سعر افتراضي أو صفر للزبائن. ستظهر بطاقة المنتج بعبارة «السعر عند الطلب» مع زر اتصال واستفسار فوري عبر واتساب.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  السعر الأساسي (بالدينار الجزائري د.ج) *
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={price}
                    onChange={(e) => handleOriginalPriceChange(e.target.value)}
                    placeholder="مثال: 45000"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm font-bold text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#FF551A] tabular-nums"
                  />
                  <span className="absolute left-3 top-3 text-xs font-bold text-neutral-400">
                    د.ج
                  </span>
                </div>
                {typeof price === 'number' && price > 0 && (
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    المعاينة: {formatDZD(price)}
                  </span>
                )}
              </div>

              {/* Discount Box */}
              <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discountActive}
                    onChange={(e) => setDiscountActive(e.target.checked)}
                    className="w-4 h-4 text-[#FF551A] rounded focus:ring-[#FF551A] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      تفعيل تخفيض خاص / خصم ترويجي
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      إبراز نسبة الخصم والسعر المخفض وشطب السعر الأصلي للزبائن
                    </span>
                  </div>
                </label>

                {discountActive && (
                  <div className="pt-3 border-t border-neutral-100 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                          السعر بعد التخفيض (د.ج) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={typeof price === 'number' && price > 0 ? price - 1 : undefined}
                          value={discountPrice}
                          onChange={(e) => handleDiscountPriceChange(e.target.value)}
                          placeholder="مثال: 38000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-[#FF551A] focus:outline-none focus:ring-2 focus:ring-[#FF551A] tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                          نسبة الخصم المئوية (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={discountPercent}
                            onChange={(e) => handleDiscountPercentChange(e.target.value)}
                            placeholder="مثال: 15"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#FF551A] tabular-nums"
                          />
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Optional Discount Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>تاريخ بدء التخفيض (اختياري)</span>
                        </label>
                        <input
                          type="date"
                          value={discountStartDate}
                          onChange={(e) => setDiscountStartDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                        />
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          لن يظهر التخفيض قبل هذا التاريخ
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>تاريخ انتهاء التخفيض (اختياري)</span>
                        </label>
                        <input
                          type="date"
                          value={discountEndDate}
                          onChange={(e) => setDiscountEndDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                        />
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          يعود السعر تلقائيًا للأصلي بعد انتهاء الموعد
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Architectural Specifications & Availability */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#FF551A]" />
            <span>المواصفات الفنية، المقاسات، وحالة التوفر</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-neutral-400" />
                <span>المقاسات والأبعاد</span>
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="مثال: 240 × 100 × 85 سم"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] text-[#1E1E1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-neutral-400" />
                <span>الخامات ونوع الخشب</span>
              </label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="مثال: خشب زان مصمت، قماش بوكليه، إسفنج D35"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] text-[#1E1E1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                حالة التوفر في المعرض
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white text-[#1E1E1E] cursor-pointer"
              >
                <option value="in_stock">متوفر وجاهز للتسليم الفوري</option>
                <option value="pre_order">متاح للطلب المسبق (الحجز قبل التوريد)</option>
                <option value="made_to_order">تصنيع وتفصيل حسب رغبة الزبون</option>
                <option value="out_of_stock">غير متوفر حاليًا بالمعرض</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Media Uploader (Images & Video) */}
        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
          <AdminImageUploader
            images={images}
            videos={videos}
            onChange={setImages}
            onImagesChange={setImages}
            onVideosChange={setVideos}
          />
        </div>

        {/* Section 5: Visibility, Featured & Archiving */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              disabled={isArchived}
              checked={isPublished && !isArchived}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-[#FF551A] rounded border-neutral-300 focus:ring-[#FF551A] cursor-pointer disabled:opacity-50"
            />
            <div>
              <span className="text-xs font-bold text-[#1E1E1E] block">نشر في المتجر العام</span>
              <span className="text-[11px] text-neutral-500 block">مرئي للزبائن في واجهة العرض العامة</span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              disabled={isArchived}
              checked={isFeatured && !isArchived}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-[#FF551A] rounded border-neutral-300 focus:ring-[#FF551A] cursor-pointer disabled:opacity-50"
            />
            <div>
              <span className="text-xs font-bold text-[#1E1E1E] block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF551A]" />
                <span>تمييز القطعة (Featured)</span>
              </span>
              <span className="text-[11px] text-neutral-500 block">إبراز المنتج ضمن التشكيلة الحصرية</span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => {
                setIsArchived(e.target.checked);
                if (e.target.checked) {
                  setIsPublished(false);
                  setIsFeatured(false);
                }
              }}
              className="w-4 h-4 text-amber-600 rounded border-neutral-300 focus:ring-amber-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-[#1E1E1E] block flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-600" />
                <span>أرشفة القطعة</span>
              </span>
              <span className="text-[11px] text-neutral-500 block">إخفاء القطعة مع الاحتفاظ ببياناتها في الأرشيف</span>
            </div>
          </label>
        </div>

        {/* Footer Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-[#1E1E1E] rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF551A] hover:bg-[#E04814] text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'جارٍ حفظ البيانات...' : initialProduct ? 'تحديث بيانات القطعة' : 'حفظ ونشر القطعة'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
