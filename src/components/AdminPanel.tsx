import React, { useState, useMemo } from 'react';
import { 
  PackagePlus, 
  LogOut, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
  LayoutDashboard,
  Boxes,
  Eye,
  Store,
  ChevronLeft,
  Database,
  Server,
  KeyRound
} from 'lucide-react';
import { Product, BlobStatus, DatabaseStatus } from '../types';
import { AdminProductForm } from './AdminProductForm';
import { getCustomBlobToken, setCustomBlobToken, changeAdminPassword } from '../services/api';
import { formatDZD, ARABIC_CATEGORIES } from '../data/initialProducts';

interface AdminPanelProps {
  products: Product[];
  currentAdminSubpath: string; // e.g. '/admin/products', '/admin/products/new', '/admin/products/:id/edit'
  navigateAdmin: (path: string) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onResetProducts: () => Promise<void>;
  onLogout: () => void;
  blobStatus: BlobStatus | null;
  onRefreshBlobStatus: () => Promise<void>;
  dbStatus?: DatabaseStatus | null;
  onRefreshDbStatus?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  currentAdminSubpath,
  navigateAdmin,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetProducts,
  onLogout,
  blobStatus,
  onRefreshBlobStatus,
  dbStatus,
  onRefreshDbStatus,
}) => {
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(getCustomBlobToken());
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Change Admin Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Search & Filter in Admin Products List
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Determine current view
  const isNewView = currentAdminSubpath === '/admin/products/new';
  const isEditView = currentAdminSubpath.includes('/edit');
  const editingId = isEditView ? currentAdminSubpath.split('/')[3] : null;
  const productToEdit = editingId ? products.find((p) => p.id === editingId) || null : null;

  // Real data calculations (honest metrics)
  const totalCount = products.length;
  const publishedCount = useMemo(() => products.filter((p) => p.isPublished !== false).length, [products]);
  const featuredCount = useMemo(() => products.filter((p) => p.isFeatured).length, [products]);
  const missingImagesCount = useMemo(() => products.filter((p) => !p.images || p.images.length === 0).length, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchFilter.trim() === '' ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.description.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCat =
        categoryFilter === 'All' ||
        p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [products, searchFilter, categoryFilter]);

  const handleTogglePublish = async (product: Product) => {
    await onUpdateProduct(product.id, { isPublished: !product.isPublished });
  };

  const handleToggleFeatured = async (product: Product) => {
    await onUpdateProduct(product.id, { isFeatured: !product.isFeatured });
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      setTokenError(
        'تنبيه: قمت بإدخال رابط قاعدة بيانات PostgreSQL. مفاتيح Vercel Blob يجب أن تبدأ بـ "vercel_blob_rw_".'
      );
      return;
    }
    if (trimmed.length > 0 && !trimmed.startsWith('vercel_blob_rw_')) {
      setTokenError('صيغة غير صالحة: مفاتيح Vercel Blob تبدأ بـ "vercel_blob_rw_".');
      return;
    }
    setTokenError(null);
    setCustomBlobToken(trimmed);
    await onRefreshBlobStatus();
    setIsTokenSettingsOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPwd = newPasswordInput.trim();
    if (!cleanPwd || cleanPwd.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordStatusMsg(null);
    try {
      await changeAdminPassword(cleanPwd);
      setPasswordStatusMsg({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح! احفظ كلمتك الجديدة بأمان.' });
      setNewPasswordInput('');
    } catch (err: any) {
      setPasswordStatusMsg({ type: 'error', text: err.message || 'فشل تحديث كلمة المرور.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-150">
      
      {/* =========================================================================
          ADMIN HEADER & TOP NAVIGATION
          ========================================================================= */}
      <header className="bg-[#1E1E1E] text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 border border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-400">
                لوحة تحكم المشرف
              </span>
              <span className="text-neutral-600">·</span>
              <span className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border ${
                dbStatus?.connected
                  ? 'text-cyan-300 bg-cyan-950/70 border-cyan-800'
                  : dbStatus?.isConfigured
                  ? 'text-amber-300 bg-amber-950/70 border-amber-800'
                  : 'text-neutral-300 bg-neutral-900 border-neutral-700'
              }`}>
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>{dbStatus?.connected ? 'Neon PostgreSQL (متصل)' : 'قاعدة بيانات Neon'}</span>
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>صور Vercel Blob</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              إدارة متجر أثاث الثقة
            </h1>
            <p className="text-xs text-neutral-400">
              قاعدة بيانات Neon وتخزين الصور الدائم عبر Vercel Blob
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              title="معاينة المتجر في نافذة جديدة"
            >
              <Store className="w-4 h-4 text-[#FF551A]" />
              <span>عرض المتجر</span>
            </a>

            <button
              onClick={() => setIsTokenSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              title="إعدادات قاعدة بيانات Neon وVercel Blob"
            >
              <Server className="w-4 h-4 text-cyan-400" />
              <span>حالة السحابة وقاعدة البيانات</span>
            </button>

            <button
              onClick={() => {
                setPasswordStatusMsg(null);
                setNewPasswordInput('');
                setIsPasswordModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              title="تغيير كلمة مرور الإدارة"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>تغيير كلمة المرور</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-red-950/80 hover:text-red-400 text-neutral-300 transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigateAdmin('/admin/products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isNewView && !isEditView
                ? 'bg-white text-[#1E1E1E] shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>قائمة المنتجات ({totalCount})</span>
          </button>

          <button
            onClick={() => navigateAdmin('/admin/products/new')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isNewView
                ? 'bg-[#FF551A] text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>إضافة قطعة جديدة</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          HONEST METRICS DASHBOARD (Real Data Only!)
          ========================================================================= */}
      {!isNewView && !isEditView && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">إجمالي المنتجات</span>
            <span className="text-2xl font-bold text-[#1E1E1E] tabular-nums block">
              {totalCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">مسجلة في قاعدة البيانات</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">القطع المنشورة</span>
            <span className="text-2xl font-bold text-emerald-700 tabular-nums block">
              {publishedCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">معروضة للزبائن بالمتجر</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">القطع المميزة</span>
            <span className="text-2xl font-bold text-[#FF551A] tabular-nums block">
              {featuredCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">محددة كقطع مميزة</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">تخزين الصور Vercel Blob</span>
            <span className="text-sm font-bold text-[#1E1E1E] flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>test23-blob نشط</span>
            </span>
            <span className="text-[11px] text-neutral-400 block">
              {missingImagesCount === 0 ? 'جميع المنتجات لديها صور' : `${missingImagesCount} منتجات بدون صور`}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: ADD PRODUCT FORM (/admin/products/new)
          ========================================================================= */}
      {isNewView && (
        <AdminProductForm
          initialProduct={null}
          onSave={async (data) => {
            await onAddProduct(data);
            navigateAdmin('/admin/products');
          }}
          onCancel={() => navigateAdmin('/admin/products')}
        />
      )}

      {/* =========================================================================
          VIEW 2: EDIT PRODUCT FORM (/admin/products/:id/edit)
          ========================================================================= */}
      {isEditView && (
        <AdminProductForm
          initialProduct={productToEdit}
          onSave={async (data) => {
            if (editingId) {
              await onUpdateProduct(editingId, data);
            }
            navigateAdmin('/admin/products');
          }}
          onCancel={() => navigateAdmin('/admin/products')}
        />
      )}

      {/* =========================================================================
          VIEW 3: PRODUCTS LIST & CATALOG TABLE (/admin/products)
          ========================================================================= */}
      {!isNewView && !isEditView && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden space-y-4">
          
          {/* Table Header & Search Controls */}
          <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E1E1E]">
                قائمة المنتجات ({filteredProducts.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                يمكنك تعديل الأسعار، نشر/إلغاء نشر القطع، أو تحديث الصور من هنا
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="بحث في المنتجات..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white cursor-pointer"
              >
                <option value="All">جميع التصنيفات</option>
                {ARABIC_CATEGORIES.filter((c) => c.id !== 'All').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>

              {/* Add Product Button */}
              <button
                onClick={() => navigateAdmin('/admin/products/new')}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF551A] hover:bg-[#E04814] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>إضافة منتج</span>
              </button>
            </div>
          </div>

          {/* Table Contents */}
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-6">الصورة</th>
                    <th className="py-3.5 px-6">اسم القطعة</th>
                    <th className="py-3.5 px-6">التصنيف</th>
                    <th className="py-3.5 px-6">السعر المقدر</th>
                    <th className="py-3.5 px-6">حالة النشر</th>
                    <th className="py-3.5 px-6">مميز</th>
                    <th className="py-3.5 px-6 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((prod) => {
                    const coverImg = prod.images.find((i) => i.isCover) || prod.images[0];
                    return (
                      <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                        
                        {/* Image Thumbnail */}
                        <td className="py-3 px-6">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 relative">
                            {coverImg?.url ? (
                              <img
                                src={coverImg.url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                                لا توجد
                              </div>
                            )}
                            {prod.images.length > 1 && (
                              <span className="absolute bottom-0.5 left-0.5 bg-[#1E1E1E]/80 text-white text-[9px] px-1 rounded tabular-nums">
                                +{prod.images.length - 1}
                              </span>
                            )}
                            {prod.videos && prod.videos.length > 0 && (
                              <span
                                className="absolute top-0.5 right-0.5 bg-[#FF551A] text-white text-[8px] font-bold px-1 rounded flex items-center gap-0.5 shadow-2xs"
                                title={`${prod.videos.length} فيديو مسجل`}
                              >
                                ▶ {prod.videos.length}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Name & Description */}
                        <td className="py-3 px-6 font-medium text-[#1E1E1E]">
                          <span className="block font-bold text-sm text-[#1E1E1E]">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">
                            {prod.description || 'لا يوجد وصف.'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-6 text-neutral-600 text-xs">
                          {prod.category}
                        </td>

                        {/* Price in DZD */}
                        <td className="py-3 px-6 font-bold text-[#1E1E1E] tabular-nums">
                          {formatDZD(prod.price)}
                        </td>

                        {/* Published Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              prod.isPublished !== false
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                            }`}
                            title="انقر لتغيير حالة النشر في المتجر"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.isPublished !== false ? 'bg-emerald-600' : 'bg-neutral-400'}`} />
                            <span>{prod.isPublished !== false ? 'معروض' : 'مسودة'}</span>
                          </button>
                        </td>

                        {/* Featured Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleToggleFeatured(prod)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              prod.isFeatured
                                ? 'text-[#FF551A] bg-orange-50'
                                : 'text-neutral-300 hover:text-neutral-500'
                            }`}
                            title="تحديد كمنتج مميز"
                          >
                            <Sparkles className="w-4 h-4 fill-current" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-6 text-left">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigateAdmin(`/admin/products/${prod.id}/edit`)}
                              className="p-2 text-neutral-500 hover:text-[#1E1E1E] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="تعديل تفاصيل المنتج والصور"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف القطعة "${prod.name}" نهائياً من قاعدة البيانات؟`)) {
                                  onDeleteProduct(prod.id);
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف المنتج"
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
          ) : (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <p className="text-sm font-semibold">لا توجد منتجات تطابق شروط البحث الحالية.</p>
              <button
                onClick={() => {
                  setSearchFilter('');
                  setCategoryFilter('All');
                }}
                className="text-xs text-[#FF551A] hover:underline font-bold"
              >
                مسح التصفية
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          NEON DATABASE & VERCEL BLOB SETTINGS MODAL
          ========================================================================= */}
      {isTokenSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-[#1E1E1E] text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-600" />
                <span>حالة السحابة وقاعدة بيانات أثاث الثقة</span>
              </h3>
              <button
                onClick={() => setIsTokenSettingsOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* Neon Database Status Card */}
            <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-700" />
                  <span>قاعدة بيانات نيون (Neon PostgreSQL)</span>
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  dbStatus?.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {dbStatus?.connected ? 'متصل بنجاح' : 'تخزين احتياطي'}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {dbStatus?.message || 'تُستخدم قاعدة بيانات Neon لتخزين المنتجات والتفاصيل والأسعار بشكل دائم وسريع.'}
              </p>
              {dbStatus?.maskedUrl && (
                <div className="text-[11px] font-mono text-neutral-500 bg-white/80 p-2 rounded-lg border border-cyan-100">
                  {dbStatus.maskedUrl}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-cyan-100">
                <span>المزود: {dbStatus?.provider || 'Neon Serverless PostgreSQL'}</span>
                <span>المنتجات المسجلة: {dbStatus?.count ?? products.length}</span>
              </div>
            </div>

            {/* Vercel Blob Storage Section */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>تخزين صور الأثاث (Vercel Blob)</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {blobStatus?.storeName || 'test23-blob'}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                يتم رفع صور معارض وكتالوج الأثاث مباشرة إلى Vercel Blob لتوفير استضافة فائقة السرعة وجودة كاملة عبر شبكة CDN العالمية.
              </p>

              <form onSubmit={handleSaveToken} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1.5">
                    مفتاح BLOB_READ_WRITE_TOKEN (اختياري للتجاوز اليدوي)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      if (tokenError) setTokenError(null);
                    }}
                    placeholder="vercel_blob_rw_xxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                  {tokenError && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                      <span>{tokenError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (onRefreshDbStatus) await onRefreshDbStatus();
                      await onRefreshBlobStatus();
                    }}
                    className="text-xs font-semibold text-neutral-500 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تحديث الحالة</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTokenInput('');
                        setCustomBlobToken('');
                        onRefreshBlobStatus();
                        setIsTokenSettingsOpen(false);
                      }}
                      className="px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      مسح المخصص
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#FF551A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      حفظ وتطبيق
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHANGE ADMIN PASSWORD MODAL
          ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-6 bg-[#1E1E1E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">تغيير كلمة مرور الإدارة</h3>
                  <p className="text-xs text-neutral-400">تحديث كلمة المرور المستخدمة لتسجيل دخول المشرف</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
                    passwordStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {passwordStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{passwordStatusMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1.5">
                  كلمة المرور الجديدة *
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    if (passwordStatusMsg) setPasswordStatusMsg(null);
                  }}
                  placeholder="أدخل كلمة مرور قوية (6 أحرف على الأقل)..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF551A] text-neutral-900"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  سيتم تطبيق كلمة المرور الجديدة فوراً وحفظها في إعدادات النظام.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 bg-[#1E1E1E] hover:bg-[#FF551A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
