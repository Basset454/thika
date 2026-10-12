import React, { useState, useEffect } from 'react';
import { Save, ArrowRight, AlertCircle, Sparkles, Package, CheckCircle2 } from 'lucide-react';
import { Product, ProductImage } from '../types';
import { FURNITURE_CATEGORIES, ARABIC_CATEGORIES, formatDZD } from '../data/initialProducts';
import { AdminImageUploader } from './AdminImageUploader';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Living Room');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setPrice(initialProduct.price);
      setDescription(initialProduct.description || '');
      setCategory(initialProduct.category || 'Living Room');
      setImages(initialProduct.images || []);
      setIsPublished(initialProduct.isPublished !== false);
      setIsFeatured(Boolean(initialProduct.isFeatured));
    } else {
      setName('');
      setPrice('');
      setDescription('');
      setCategory('Living Room');
      setImages([]);
      setIsPublished(true);
      setIsFeatured(false);
    }
  }, [initialProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('يرجى كتابة اسم قطعة الأثاث.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setFormError('يرجى تحديد سعر صالح بالدينار الجزائري.');
      return;
    }
    if (images.length === 0) {
      setFormError('يرجى رفع صورة واحدة على الأقل للمنتج إلى Vercel Blob.');
      return;
    }

    // Ensure cover image is chosen
    const finalImages = [...images];
    if (!finalImages.some((img) => img.isCover)) {
      finalImages[0].isCover = true;
    }
    const coverObj = finalImages.find((img) => img.isCover) || finalImages[0];

    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSave({
        id: initialProduct?.id,
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
        category,
        images: finalImages,
        coverImageUrl: coverObj.url,
        isPublished,
        isFeatured,
      });
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ المنتج في قاعدة البيانات.');
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
            title="العودة لقائمة المنتجات"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">
              {initialProduct ? `تعديل قطعة الأثاث: ${initialProduct.name}` : 'إضافة قطعة أثاث جديدة'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              يتم حفظ بيانات المنتج وصوره مباشرة وبشكل دائم على Vercel Blob (test23-blob)
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
          <span className="font-medium">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
            اسم قطعة الأثاث *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أريكة زاوية بوكليه عاجية"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] text-[#1E1E1E]"
          />
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              السعر (بالدينار الجزائري د.ج) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 48000"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm font-bold text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#FF551A] tabular-nums"
            />
            {typeof price === 'number' && price > 0 && (
              <span className="text-[11px] text-neutral-500 mt-1 block">
                المعاينة: {formatDZD(price)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              التصنيف الأساسي *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white text-[#1E1E1E] cursor-pointer"
            >
              {ARABIC_CATEGORIES.filter((c) => c.id !== 'All').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameAr} ({cat.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description & Materials */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
            الوصف، الأبعاد، وخامات الصنع
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اذكر نوع الخشب (خشب زان، بلوط)، نوع القماش، الأبعاد (الطول x العرض x الارتفاع)، وتفاصيل الراحة..."
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] leading-relaxed text-[#1E1E1E]"
          />
        </div>

        {/* Real Vercel Blob Image Uploader */}
        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
          <AdminImageUploader
            images={images}
            onChange={setImages}
          />
        </div>

        {/* Toggles: Published & Featured */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-[#FF551A] rounded border-neutral-300 focus:ring-[#FF551A] cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-[#1E1E1E] block">نشر في المتجر العام</span>
              <span className="text-[11px] text-neutral-500 block">مرئي للزبائن في واجهة العرض العامة</span>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-[#FF551A] rounded border-neutral-300 focus:ring-[#FF551A] cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-[#1E1E1E] block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF551A]" />
                <span>تمييز القطعة (Featured)</span>
              </span>
              <span className="text-[11px] text-neutral-500 block">إبراز المنتج كقطعة فاخرة مميزة</span>
            </div>
          </label>
        </div>

        {/* Footer Submit */}
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
            <span>{isSubmitting ? 'جارٍ الحفظ في قاعدة البيانات...' : initialProduct ? 'تحديث بيانات القطعة' : 'حفظ ونشر القطعة'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
