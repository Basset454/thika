import React, { useState, useEffect } from 'react';
import { TrustStandardsSection, TrustStandardItem, TrustStandardPoint, Product } from '../types';
import { getTrustStandards, updateTrustStandards, uploadImageFiles } from '../services/api';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Link2,
  X,
  Sliders,
  Type,
  Maximize2
} from 'lucide-react';

interface AdminTrustStandardsManagerProps {
  products: Product[];
  onStandardsUpdated?: (standards: TrustStandardsSection) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminTrustStandardsManager: React.FC<AdminTrustStandardsManagerProps> = ({
  products,
  onStandardsUpdated,
  showToast,
}) => {
  const [standards, setStandards] = useState<TrustStandardsSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Section Header States
  const [enabled, setEnabled] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');

  // Items State
  const [items, setItems] = useState<TrustStandardItem[]>([]);

  // Item Modal (Add / Edit)
  const [editingItem, setEditingItem] = useState<TrustStandardItem | null>(null);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemSubtitle, setItemSubtitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemQuote, setItemQuote] = useState('');
  const [itemOrder, setItemOrder] = useState<number>(1);
  const [itemIsHidden, setItemIsHidden] = useState(false);
  const [itemPoints, setItemPoints] = useState<TrustStandardPoint[]>([]);
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [itemModalError, setItemModalError] = useState<string | null>(null);

  // New Point Inputs inside Item Modal
  const [newPointTitle, setNewPointTitle] = useState('');
  const [newPointDesc, setNewPointDesc] = useState('');
  const [newPointBadge, setNewPointBadge] = useState('');

  // Load from database
  const loadStandards = async () => {
    setIsLoading(true);
    try {
      const data = await getTrustStandards(true);
      setStandards(data);
      setEnabled(data.enabled !== false);
      setBadgeText(data.badgeText || '');
      setSectionTitle(data.title || '');
      setSectionDescription(data.description || '');
      setItems(data.items || []);
      if (onStandardsUpdated) {
        onStandardsUpdated(data);
      }
    } catch (err: any) {
      console.error('Failed to load trust standards:', err);
      showToast(err.message || 'تعذر جلب معايير الثقة من الخادم.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStandards();
  }, []);

  // Open Add Item Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemSubtitle('');
    setItemDescription('');
    setItemImage('');
    setItemQuote('');
    setItemOrder(items.length + 1);
    setItemIsHidden(false);
    setItemPoints([]);
    setAppliesToAll(true);
    setSelectedProductIds([]);
    setItemModalError(null);
    setIsCreatingNewItem(true);
  };

  // Open Edit Item Modal
  const handleOpenEdit = (item: TrustStandardItem) => {
    setIsCreatingNewItem(false);
    setEditingItem(item);
    setItemTitle(item.title);
    setItemSubtitle(item.subtitle || '');
    setItemDescription(item.description);
    setItemImage(item.image || '');
    setItemQuote(item.quote || '');
    setItemOrder(item.order || 1);
    setItemIsHidden(Boolean(item.isHidden));
    setItemPoints(item.points ? [...item.points] : []);
    const hasLinked = item.linkedProductIds && item.linkedProductIds.length > 0;
    setAppliesToAll(!hasLinked);
    setSelectedProductIds(item.linkedProductIds || []);
    setItemModalError(null);
  };

  const handleCloseItemModal = () => {
    setIsCreatingNewItem(false);
    setEditingItem(null);
    setItemModalError(null);
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const uploaded = await uploadImageFiles([file]);
      if (uploaded.length > 0 && uploaded[0].url) {
        setItemImage(uploaded[0].url);
        showToast('تم رفع صورة المعيار بنجاح إلى مستودع المتجر.');
      }
    } catch (err: any) {
      console.error('Failed to upload standard image:', err);
      showToast(err.message || 'فشل رفع الصورة.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Add Point to current Item
  const handleAddPoint = () => {
    const cleanTitle = newPointTitle.trim();
    if (!cleanTitle) {
      setItemModalError('يرجى كتابة عنوان للنقطة التوضيحية أولاً.');
      return;
    }
    const newPt: TrustStandardPoint = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      description: newPointDesc.trim() || undefined,
      badge: newPointBadge.trim() || undefined,
    };
    setItemPoints([...itemPoints, newPt]);
    setNewPointTitle('');
    setNewPointDesc('');
    setNewPointBadge('');
    setItemModalError(null);
  };

  const handleRemovePoint = (index: number) => {
    setItemPoints(itemPoints.filter((_, i) => i !== index));
  };

  // Save Item to local list
  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = itemTitle.trim();
    const cleanDesc = itemDescription.trim();

    if (!cleanTitle) {
      setItemModalError('يرجى إدخال عنوان المعيار أو الخامة.');
      return;
    }
    if (!cleanDesc) {
      setItemModalError('يرجى إدخال وصف المعيار أو الخامة.');
      return;
    }

    const payloadItem: TrustStandardItem = {
      id: editingItem ? editingItem.id : `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: cleanTitle,
      subtitle: itemSubtitle.trim() || undefined,
      description: cleanDesc,
      image: itemImage.trim() || undefined,
      quote: itemQuote.trim() || undefined,
      points: itemPoints.length > 0 ? itemPoints : undefined,
      linkedProductIds: appliesToAll ? [] : selectedProductIds,
      order: Number(itemOrder) || 1,
      isHidden: itemIsHidden,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isCreatingNewItem) {
      setItems([...items, payloadItem]);
      showToast(`تمت إضافة "${cleanTitle}" إلى قائمة المعايير.`);
    } else {
      setItems(items.map((it) => (it.id === payloadItem.id ? payloadItem : it)));
      showToast(`تم تحديث بيانات "${cleanTitle}".`);
    }

    handleCloseItemModal();
  };

  // Reorder items
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const current = newItems[index];
    const target = newItems[targetIndex];

    const currentOrder = current.order || index + 1;
    const targetOrder = target.order || targetIndex + 1;

    current.order = targetOrder;
    target.order = currentOrder;

    newItems[index] = target;
    newItems[targetIndex] = current;

    setItems(newItems);
  };

  // Toggle Hide/Show item
  const handleToggleHide = (itemId: string) => {
    setItems(
      items.map((it) => {
        if (it.id === itemId) {
          const nextHidden = !it.isHidden;
          showToast(nextHidden ? `تم إخفاء "${it.title}".` : `تم إظهار "${it.title}".`);
          return { ...it, isHidden: nextHidden };
        }
        return it;
      })
    );
  };

  // Delete item
  const handleDeleteItem = (itemId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف عنصر "${title}" نهائياً؟`)) {
      return;
    }
    setItems(items.filter((it) => it.id !== itemId));
    showToast(`تم حذف "${title}". اضغط حفظ التعديلات لاعتماد التغييرات في قاعدة البيانات.`);
  };

  // Save entire section to database
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const payload: TrustStandardsSection = {
        enabled,
        badgeText: badgeText.trim() || 'معايير الثقة · الجودة والحرفية',
        title: sectionTitle.trim() || 'معايير الجودة والخامات في أثاث الثقة',
        description: sectionDescription.trim() || undefined,
        items: items.map((it, idx) => ({ ...it, order: idx + 1 })),
        updatedAt: new Date().toISOString(),
      };

      const updated = await updateTrustStandards(payload);
      setStandards(updated);
      setItems(updated.items || []);
      if (onStandardsUpdated) {
        onStandardsUpdated(updated);
      }
      showToast('تم حفظ ونشر قسم معايير الثقة والخامات بنجاح لجميع الزوار.');
    } catch (err: any) {
      console.error('Failed to save trust standards:', err);
      showToast(err.message || 'فشل حفظ التعديلات في قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-xs text-center space-y-2">
        <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#FF551A]" />
        <p className="text-xs text-neutral-500 font-medium">جاري تحميل معايير الثقة والخامات من قاعدة البيانات...</p>
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner & Control Actions */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF551A]" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF551A]">
              إدارة المحتوى المعماري
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">
            قسم معايير الثقة والخامات
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            يمكنك تخصيص عنوان ووصف القسم، وإضافة عناصر خامات متعددة أو حذفها، وتحديد النقاط الفنية وربط كل معيار بقطع أثاث محددة، مع حفظ دائم في قاعدة بيانات المتجر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-all cursor-pointer"
            title="معاينة شكل القسم كما يظهر للزوار قبل النشر"
          >
            <Eye className="w-4 h-4 text-[#FF551A]" />
            <span>معاينة حية</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF551A]" />
            <span>إضافة عنصر خامة / معيار</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}</span>
          </button>
        </div>
      </div>

      {/* Section Global Settings (Title, Badge, Description, Enable Switch) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF551A]" />
            <span>إعدادات رأس القسم والظهور العام</span>
          </h3>

          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#FF551A] focus:ring-[#FF551A]"
            />
            <span className="text-xs font-bold text-neutral-800">
              {enabled ? 'القسم مفعل وظاهر للزوار' : 'القسم معطل ومخفي بالكامل'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              الشارة العلوية (Badge)
            </label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="مثال: معايير الثقة · الحرفية والتفاصيل"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              عنوان القسم الرئيسي (H2) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="مثال: معايير الجودة والخامات في أثاث الثقة"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            الوصف التمهيدي للقسم
          </label>
          <textarea
            rows={2}
            value={sectionDescription}
            onChange={(e) => setSectionDescription(e.target.value)}
            placeholder="نلتزم باختيار خامات متينة وعناية دقيقة بكل تفصيلة في التصنيع والتنجيد..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] resize-none"
          />
        </div>
      </div>

      {/* Items List Table / Cards */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E1E1E]">
              عناصر الخامات والمعايير المعتمدة ({items.length})
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              يمكنك إضافة أي عدد من العناصر، ترتيبها، وتحديد ما إذا كان المعيار ينطبق على كل المنتجات أو قطع محددة
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF551A]" />
            <span>إضافة عنصر</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-600">لا توجد عناصر مضافة بعد.</p>
            <p className="text-xs text-neutral-400">
              أضف أول معيار أو خامة لعرضها في قسم معايير الثقة بالموقع العام.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-xs font-bold text-[#FF551A] hover:underline pt-2 block mx-auto"
            >
              + إضافة أول معيار الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#F8F8F7] text-neutral-600 text-xs uppercase border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-bold w-16">الترتيب</th>
                  <th className="py-3 px-6 font-bold">الصورة</th>
                  <th className="py-3 px-6 font-bold">عنوان المعيار / الخامة</th>
                  <th className="py-3 px-6 font-bold">نطاق التطبيق</th>
                  <th className="py-3 px-6 font-bold">النقاط التوضيحية</th>
                  <th className="py-3 px-6 font-bold">حالة الظهور</th>
                  <th className="py-3 px-6 font-bold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedItems.map((item, index) => {
                  const linkedCount = item.linkedProductIds?.length || 0;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        item.isHidden ? 'bg-neutral-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* Order */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1">
                          <span className="w-6 text-center font-bold text-neutral-500 text-xs tabular-nums">
                            {index + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 text-neutral-400 hover:text-[#1E1E1E] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(index, 'down')}
                              disabled={index === items.length - 1}
                              className="p-0.5 text-neutral-400 hover:text-[#1E1E1E] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-6">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                              بدون صورة
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-sm text-[#1E1E1E] flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.subtitle && (
                            <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 line-clamp-1 max-w-sm mt-0.5">
                          {item.description}
                        </p>
                      </td>

                      {/* Scope: All products vs Specific */}
                      <td className="py-3.5 px-6">
                        {linkedCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ينطبق على جميع المنتجات</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold">
                            <Link2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>مخصص لـ {linkedCount} قطع محددة</span>
                          </span>
                        )}
                      </td>

                      {/* Points Count */}
                      <td className="py-3.5 px-6 text-xs text-neutral-600 tabular-nums">
                        {item.points && item.points.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold">
                            {item.points.length} نقاط فنية
                          </span>
                        ) : (
                          <span className="text-neutral-400">بدون نقاط</span>
                        )}
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3.5 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleHide(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !item.isHidden
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                          }`}
                          title="انقر لإظهار أو إخفاء العنصر"
                        >
                          {!item.isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>معروض</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-neutral-500 hover:text-[#1E1E1E] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل هذا المعيار"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف هذا المعيار"
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

      {/* Save Reminder Footer */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>تذكير: بعد تعديل أو إضافة العناصر، لا تنسَ الضغط على زر «حفظ ونشر التعديلات» لتثبيتها في قاعدة البيانات.</span>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveAll}
          className="px-4 py-1.5 rounded-lg bg-[#FF551A] hover:bg-[#e04812] text-white font-bold cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات الآن'}
        </button>
      </div>

      {/* =========================================================================
          ITEM ADD / EDIT MODAL
          ========================================================================= */}
      {(isCreatingNewItem || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-[#1E1E1E] text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF551A]" />
                <span>{isCreatingNewItem ? 'إضافة معيار / خامة جديدة' : `تعديل: ${itemTitle || 'عنصر المعايير'}`}</span>
              </h3>
              <button
                type="button"
                onClick={handleCloseItemModal}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {itemModalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{itemModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItemModal} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    عنوان المعيار أو الخامة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="مثال: الهيكل والنجارة المتقنة"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    التصنيف الفرعي أو المجال (اختياري)
                  </label>
                  <input
                    type="text"
                    value={itemSubtitle}
                    onChange={(e) => setItemSubtitle(e.target.value)}
                    placeholder="مثال: صلابة الهيكل واستقرار القطعة"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  الوصف الرئيسي <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="اكتب هنا الوصف الحقيقي المعتمد لدى ورشتكم وخاماتكم الفعلية..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] resize-none"
                />
              </div>

              {/* Image Input (Upload file or URL) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  صورة المعيار التوضيحية (اختيارية)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={itemImage}
                    onChange={(e) => setItemImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#FF551A]" />
                    <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صورة من جهازك'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {itemImage && (
                  <div className="w-24 h-16 rounded-xl overflow-hidden border border-neutral-200 mt-2 relative">
                    <img src={itemImage} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setItemImage('')}
                      className="absolute top-1 left-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Quote / Phrase */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  عبارة أو اقتباس حرفي ملهم (اختياري - لن تظهر إذا تركت فارغة)
                </label>
                <input
                  type="text"
                  value={itemQuote}
                  onChange={(e) => setItemQuote(e.target.value)}
                  placeholder="«نعتني بأدق تفاصيل التجميع لتمنحك القطعة متانة تدوم لسنوات»"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              {/* Scope & Linked Products (Requirement 5) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-[#FF551A]" />
                    <span>نطاق تطبيق هذه الخامة / المعيار</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={appliesToAll}
                        onChange={() => {
                          setAppliesToAll(true);
                          setSelectedProductIds([]);
                        }}
                        className="text-[#FF551A] focus:ring-[#FF551A]"
                      />
                      <span>ينطبق على جميع المنتجات</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={!appliesToAll}
                        onChange={() => setAppliesToAll(false)}
                        className="text-[#FF551A] focus:ring-[#FF551A]"
                      />
                      <span>قطع أثاث محددة فقط</span>
                    </label>
                  </div>
                </div>

                {!appliesToAll && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200">
                    <p className="text-[11px] text-neutral-500">
                      حدد قطع الأثاث التي تنطبق عليها هذه الخامة تحديداً لعدم تعميمها على باقي المنتجات:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-neutral-200">
                      {products.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded-lg cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds([...selectedProductIds, p.id]);
                                } else {
                                  setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-[#FF551A] focus:ring-[#FF551A]"
                            />
                            <span className="font-semibold text-neutral-800">{p.name}</span>
                            <span className="text-[10px] text-neutral-400">({p.category})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Points / Highlights (Requirement 3) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FF551A]" />
                    <span>نقاط توضيحية اختيارية ({itemPoints.length})</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    لن تظهر أي نقطة فارغة في الموقع العام
                  </span>
                </div>

                {/* Existing Points list */}
                {itemPoints.length > 0 && (
                  <div className="space-y-2">
                    {itemPoints.map((pt, pIdx) => (
                      <div
                        key={pt.id || pIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1E1E1E]">{pt.title}</span>
                            {pt.badge && (
                              <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                                {pt.badge}
                              </span>
                            )}
                          </div>
                          {pt.description && (
                            <p className="text-[11px] text-neutral-500">{pt.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePoint(pIdx)}
                          className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new point inputs */}
                <div className="p-3 bg-white rounded-xl border border-neutral-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newPointTitle}
                      onChange={(e) => setNewPointTitle(e.target.value)}
                      placeholder="عنوان النقطة الفنية (مثال: وصلات معمارية)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF551A]"
                    />
                    <input
                      type="text"
                      value={newPointBadge}
                      onChange={(e) => setNewPointBadge(e.target.value)}
                      placeholder="شارة أو ميزة اختيارية (مثال: ثبات عالي)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF551A]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPointDesc}
                      onChange={(e) => setNewPointDesc(e.target.value)}
                      placeholder="تفاصيل النقطة الفنية الصادقة..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF551A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPoint}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      + إضافة النقطة
                    </button>
                  </div>
                </div>
              </div>

              {/* Order & Hidden options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    ترتيب العرض
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={itemOrder}
                    onChange={(e) => setItemOrder(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={itemIsHidden}
                      onChange={(e) => setItemIsHidden(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF551A] focus:ring-[#FF551A]"
                    />
                    <span className="text-xs font-bold text-neutral-700">إخفاء هذا العنصر</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {editingItem ? 'تحديث العنصر في القائمة' : 'إضافة العنصر للقائمة'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          LIVE PREVIEW MODAL BEFORE PUBLISHING (Requirement 6)
          ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#FBFBFB] rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#FF551A]" />
                <h3 className="font-bold text-[#1E1E1E] text-lg">
                  معاينة قبل النشر: قسم معايير الثقة والخامات
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  شكل العرض الحقيقي للزوار
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer font-bold text-xs"
              >
                إغلاق المعاينة
              </button>
            </div>

            {!enabled ? (
              <div className="p-8 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
                <EyeOff className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                <p className="font-bold text-sm text-neutral-700">هذا القسم معطل حالياً</p>
                <p className="text-xs text-neutral-400 mt-1">لن يظهر للزوار في الموقع العام حتى تقوم بتفعيله.</p>
              </div>
            ) : sortedItems.filter((i) => !i.isHidden).length === 0 ? (
              <div className="p-8 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
                <p className="font-bold text-sm text-neutral-700">لا توجد عناصر ظاهرة حالياً</p>
                <p className="text-xs text-neutral-400 mt-1">يرجى إضافة عناصر أو إلغاء إخفائها لتظهر للزوار.</p>
              </div>
            ) : (
              <div className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-xs">
                
                {/* Header */}
                <div className="space-y-3 border-b border-neutral-100 pb-6">
                  {badgeText && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-[#FF551A]">
                      <span className="w-2 h-2 rounded-full bg-[#FF551A]" />
                      <span>{badgeText}</span>
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1E1E1E] leading-tight">
                    {sectionTitle}
                  </h2>
                  {sectionDescription && (
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-3xl">
                      {sectionDescription}
                    </p>
                  )}
                </div>

                {/* Grid of preview items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedItems
                    .filter((it) => !it.isHidden)
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-neutral-50 rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between"
                      >
                        {item.image && (
                          <div className="aspect-[16/10] w-full bg-neutral-200 overflow-hidden relative">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                            <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded-md font-bold">
                              0{idx + 1}
                            </span>
                          </div>
                        )}

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            {item.subtitle && (
                              <span className="text-[10px] font-bold text-[#FF551A] tracking-wider uppercase block">
                                {item.subtitle}
                              </span>
                            )}
                            <h4 className="text-base font-bold text-[#1E1E1E]">
                              {item.title}
                            </h4>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Points */}
                          {item.points && item.points.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                              {item.points.map((pt, pIdx) => (
                                <div key={pIdx} className="text-[11px] text-neutral-700 space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF551A] shrink-0" />
                                    <span>{pt.title}</span>
                                    {pt.badge && (
                                      <span className="text-[9px] bg-white border border-neutral-200 px-1.5 py-0.2 rounded text-neutral-600 mr-auto">
                                        {pt.badge}
                                      </span>
                                    )}
                                  </div>
                                  {pt.description && (
                                    <p className="text-neutral-500 pr-5">{pt.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Scope pill */}
                          <div className="pt-2 text-[10px] text-neutral-500">
                            {item.linkedProductIds && item.linkedProductIds.length > 0 ? (
                              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                <span>خاص بـ {item.linkedProductIds.length} قطع مختارة</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ينطبق على جميع المنتجات</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                العودة للتعديل
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  await handleSaveAll();
                  setIsPreviewOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#FF551A] hover:bg-[#e04812] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'اعتماد وحفظ ونشر الآن'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
