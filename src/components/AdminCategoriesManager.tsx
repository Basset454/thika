import React, { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { getCategories, createCategory, updateCategory, deleteCategory, uploadImageFiles } from '../services/api';
import { getEffectiveCategoryImage, getDefaultCategoryImage } from '../utils/categoryDefaults';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  CheckCircle2, 
  Boxes,
  X,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Sparkles
} from 'lucide-react';

interface AdminCategoriesManagerProps {
  products: Product[];
  onCategoriesUpdated?: (categories: Category[]) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminCategoriesManager: React.FC<AdminCategoriesManagerProps> = ({
  products,
  onCategoriesUpdated,
  showToast,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsHidden, setFormIsHidden] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories from real database
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories(true);
      setCategories(data);
      if (onCategoriesUpdated) {
        onCategoriesUpdated(data);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      showToast(err.message || 'تعذر جلب التصنيفات من الخادم.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Compute live product count for each category
  const getCategoryProductCount = (category: Category): number => {
    return products.filter((p) => {
      if (!p.category) return false;
      return (
        p.category.toLowerCase() === category.id.toLowerCase() ||
        p.category === category.nameAr ||
        (category.nameEn && p.category.toLowerCase() === category.nameEn.toLowerCase())
      );
    }).length;
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescription('');
    setFormOrder(categories.length + 1);
    setFormIsHidden(false);
    setFormImageUrl('');
    setImageUploadError(null);
    setFormError(null);
    setIsCreatingNew(true);
  };

  const handleOpenEdit = (category: Category) => {
    setIsCreatingNew(false);
    setEditingCategory(category);
    setFormNameAr(category.nameAr);
    setFormNameEn(category.nameEn || category.id);
    setFormDescription(category.description || '');
    setFormOrder(category.order || 1);
    setFormIsHidden(Boolean(category.isHidden));
    setFormImageUrl(category.imageUrl || '');
    setImageUploadError(null);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsCreatingNew(false);
    setEditingCategory(null);
    setFormError(null);
    setImageUploadError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setImageUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const uploaded = await uploadImageFiles([file]);
      if (uploaded && uploaded.length > 0 && uploaded[0].url) {
        setFormImageUrl(uploaded[0].url);
        showToast('تم رفع الصورة المخصصة بنجاح إلى تخزين العقد.');
      } else {
        throw new Error('لم يتم استلام رابط الصورة المرفوعة.');
      }
    } catch (err: any) {
      console.error('Category image upload error:', err);
      setImageUploadError(err.message || 'حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingImage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRestoreDefaultImage = () => {
    setFormImageUrl('');
    setImageUploadError(null);
    showToast('تمت استعادة الصورة الافتراضية الاحترافية للتصنيف.');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAr = formNameAr.trim();
    if (!cleanAr) {
      setFormError('يرجى إدخال اسم التصنيف باللغة العربية.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isCreatingNew) {
        const id = (formNameEn.trim() || cleanAr.replace(/\s+/g, '-')).toLowerCase();
        await createCategory({
          id,
          nameAr: cleanAr,
          nameEn: formNameEn.trim() || cleanAr,
          order: Number(formOrder) || 99,
          isHidden: formIsHidden,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || undefined,
        });
        showToast(`تم إنشاء تصنيف "${cleanAr}" بنجاح في قاعدة البيانات.`);
      } else if (editingCategory) {
        await updateCategory(editingCategory.id, {
          nameAr: cleanAr,
          nameEn: formNameEn.trim() || editingCategory.nameEn,
          order: Number(formOrder) || editingCategory.order,
          isHidden: formIsHidden,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || undefined,
        });
        showToast(`تم تحديث تصنيف "${cleanAr}" بنجاح.`);
      }

      handleCloseModal();
      await loadCategories();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ التصنيف.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHide = async (category: Category) => {
    try {
      const nextHidden = !category.isHidden;
      await updateCategory(category.id, { isHidden: nextHidden });
      showToast(nextHidden ? `تم إخفاء تصنيف "${category.nameAr}" من المتجر.` : `تم إظهار تصنيف "${category.nameAr}" في المتجر.`);
      await loadCategories();
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث حالة الظهور.', 'error');
    }
  };

  const handleMoveOrder = async (category: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex((c) => c.id === category.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetCategory = sorted[targetIndex];
    const currentOrder = category.order || 1;
    const targetOrder = targetCategory.order || 2;

    try {
      await Promise.all([
        updateCategory(category.id, { order: targetOrder }),
        updateCategory(targetCategory.id, { order: currentOrder }),
      ]);
      await loadCategories();
    } catch (err: any) {
      showToast(err.message || 'فشل تغيير الترتيب.', 'error');
    }
  };

  const handleDelete = async (category: Category) => {
    const count = getCategoryProductCount(category);
    if (count > 0) {
      alert(
        `تنبيه أمان البيانات:\nلا يمكن حذف تصنيف "${category.nameAr}" لوجود ${count} قطعة أثاث مرتبطة به في المتجر.\n\nيرجى تعديل المنتجات ونقلها إلى تصنيف آخر أولاً لمنع وجود بيانات يتيمة.`
      );
      return;
    }

    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف تصنيف "${category.nameAr}" نهائياً من قاعدة البيانات؟`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      showToast(`تم حذف تصنيف "${category.nameAr}" بنجاح.`);
      await loadCategories();
    } catch (err: any) {
      showToast(err.message || 'تعذر حذف التصنيف.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
              إدارة الهيكل والتصنيفات
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">
            تصنيفات معروضات الأثاث
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            يمكنك تخصيص صور التصنيفات، تعديل أسمائها وترتيب ظهورها، أو إخفائها مؤقتاً. عند تشغيل المتجر تظهر صور احترافية افتراضياً، ويمكنك رفع صورك الخاصة وتخصيصها في أي وقت.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تصنيف جديد</span>
        </button>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#FF551A]" />
            <p className="text-xs font-medium">جاري تحميل التصنيفات من قاعدة البيانات...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold">لا توجد تصنيفات مسجلة حالياً.</p>
            <button
              onClick={handleOpenCreate}
              className="text-xs text-[#FF551A] font-bold hover:underline"
            >
              اضغط هنا لإنشاء أول تصنيف
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#F8F8F7] text-neutral-600 text-xs uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-6 font-bold w-16">الترتيب</th>
                  <th className="py-3.5 px-6 font-bold w-20">الصورة</th>
                  <th className="py-3.5 px-6 font-bold">اسم التصنيف (بالعربية)</th>
                  <th className="py-3.5 px-6 font-bold">مصدر الصورة</th>
                  <th className="py-3.5 px-6 font-bold">قطع الأثاث</th>
                  <th className="py-3.5 px-6 font-bold">الحالة بالمتجر</th>
                  <th className="py-3.5 px-6 font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[...categories]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((cat, index) => {
                    const count = getCategoryProductCount(cat);
                    const effectiveImg = getEffectiveCategoryImage(cat);
                    const hasCustomImg = Boolean(cat.imageUrl && cat.imageUrl.trim().length > 0);

                    return (
                      <tr key={cat.id} className="hover:bg-neutral-50/70 transition-colors">
                        
                        {/* Order & Reordering buttons */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1">
                            <span className="w-6 text-center font-bold text-neutral-500 text-xs tabular-nums">
                              {cat.order ?? index + 1}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMoveOrder(cat, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-neutral-400 hover:text-[#1E1E1E] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(cat, 'down')}
                                disabled={index === categories.length - 1}
                                className="p-0.5 text-neutral-400 hover:text-[#1E1E1E] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Thumbnail Image */}
                        <td className="py-3.5 px-6">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                            <img
                              src={effectiveImg}
                              alt={cat.nameAr}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getDefaultCategoryImage(cat.id);
                              }}
                            />
                          </div>
                        </td>

                        {/* Arabic Name */}
                        <td className="py-3.5 px-6 font-bold text-[#1E1E1E]">
                          <div className="flex items-center gap-2">
                            <span>{cat.nameAr}</span>
                            <span className="text-[10px] font-mono text-neutral-400">({cat.nameEn || cat.id})</span>
                          </div>
                          {cat.description && (
                            <span className="block text-[11px] font-normal text-neutral-500 line-clamp-1 mt-0.5">
                              {cat.description}
                            </span>
                          )}
                        </td>

                        {/* Image Source Badge */}
                        <td className="py-3.5 px-6">
                          {hasCustomImg ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>صورة مخصصة</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                              <span>افتراضية احترافية</span>
                            </span>
                          )}
                        </td>

                        {/* Linked Products Count */}
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                              count > 0
                                ? 'bg-neutral-100 text-[#1E1E1E]'
                                : 'bg-neutral-50 text-neutral-400'
                            }`}
                          >
                            <Boxes className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{count} قطع</span>
                          </span>
                        </td>

                        {/* Hidden / Visible toggle */}
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => handleToggleHide(cat)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              !cat.isHidden
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                            }`}
                            title="انقر لإظهار أو إخفاء التصنيف في واجهة الزبائن"
                          >
                            {!cat.isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>معروض بالمتجر</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                                <span>مخفي</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-6 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-2 text-neutral-500 hover:text-[#1E1E1E] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="تعديل التصنيف وصورته"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                count > 0
                                  ? 'text-neutral-300 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                              title={
                                count > 0
                                  ? `لا يمكن حذف هذا التصنيف (يحتوي على ${count} قطع)`
                                  : 'حذف التصنيف نهائياً'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {(isCreatingNew || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-[#1E1E1E] text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#FF551A]" />
                <span>{isCreatingNew ? 'إضافة تصنيف أثاث جديد' : `تعديل تصنيف: ${editingCategory?.nameAr}`}</span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-start gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Category Image Section */}
              <div className="p-4 bg-[#F8F8F7] rounded-2xl border border-neutral-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#FF551A]" />
                    <span>صورة التصنيف المعروضة</span>
                  </label>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    formImageUrl
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {formImageUrl ? 'صورة مخصصة' : 'صورة افتراضية جاهزة'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image preview box */}
                  <div className="relative w-28 h-24 rounded-2xl overflow-hidden border border-neutral-300 shadow-xs shrink-0 bg-neutral-200">
                    <img
                      src={formImageUrl || getDefaultCategoryImage(formNameEn || formNameAr || editingCategory?.id)}
                      alt="معاينة صورة التصنيف"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getDefaultCategoryImage(formNameEn || formNameAr);
                      }}
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload and restore actions */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold cursor-pointer transition-all shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{formImageUrl ? 'تغيير الصورة' : 'رفع صورة مخصصة'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                        />
                      </label>

                      {formImageUrl ? (
                        <button
                          type="button"
                          onClick={handleRestoreDefaultImage}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-bold cursor-pointer transition-all"
                          title="حذف الصورة المخصصة والعودة إلى الصورة الافتراضية"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>استعادة الصورة الافتراضية</span>
                        </button>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {formImageUrl
                        ? 'تم رفع صورة مخصصة لهذا التصنيف. يمكنك استبدالها بصورة جديدة أو العودة للصورة الافتراضية في أي وقت.'
                        : 'يستخدم المتجر صورة أثاث عالية الجودة مناسبة لنوع التصنيف. يمكنك تخصيص الصورة برفع صورة من جهازك.'}
                    </p>

                    {imageUploadError && (
                      <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{imageUploadError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  اسم التصنيف بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="مثال: غرف نوم وأسرّة فاخرة"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  الاسم بالإنجليزية أو المعرّف (ID)
                </label>
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="مثال: Bedroom"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  وصف مختصر للتصنيف
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="أسرّة ملكية، طاولات سرير جانبية، وخزائن ملابس راقية..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    ترتيب الظهور
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={formIsHidden}
                      onChange={(e) => setFormIsHidden(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF551A] focus:ring-[#FF551A]"
                    />
                    <span className="text-xs font-bold text-neutral-700">إخفاء التصنيف</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التصنيف'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
