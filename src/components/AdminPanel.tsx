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
  KeyRound,
  Archive,
  ArchiveRestore,
  Tag,
  Sliders,
  DollarSign,
  Percent,
  ShieldCheck
} from 'lucide-react';
import { Product, BlobStatus, DatabaseStatus, Category, StoreSettings, TrustStandardsSection } from '../types';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminStorefrontSettings } from './AdminStorefrontSettings';
import { AdminTrustStandardsManager } from './AdminTrustStandardsManager';
import { getCustomBlobToken, setCustomBlobToken, changeAdminPassword } from '../services/api';
import { formatDZD, ARABIC_CATEGORIES, getProductPricing } from '../data/initialProducts';

interface AdminPanelProps {
  products: Product[];
  categories?: Category[];
  settings?: StoreSettings | null;
  trustStandards?: TrustStandardsSection | null;
  currentAdminSubpath: string; // e.g. '/admin/products', '/admin/categories', '/admin/storefront', '/admin/trust-standards', '/admin/products/new', '/admin/products/:id/edit'
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
  onCategoriesUpdated?: (categories: Category[]) => void;
  onSettingsUpdated?: (settings: StoreSettings) => void;
  onTrustStandardsUpdated?: (standards: TrustStandardsSection) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories = [],
  settings = null,
  trustStandards = null,
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
  onCategoriesUpdated,
  onSettingsUpdated,
  onTrustStandardsUpdated,
  showToast,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived' | 'discounted'>('all');

  // Determine current view
  const isCategoriesView = currentAdminSubpath === '/admin/categories';
  const isStorefrontView = currentAdminSubpath === '/admin/storefront';
  const isTrustStandardsView = currentAdminSubpath === '/admin/trust-standards';
  const isNewView = currentAdminSubpath === '/admin/products/new';
  const isEditView = currentAdminSubpath.includes('/edit');
  const editingId = isEditView ? currentAdminSubpath.split('/')[3] : null;
  const productToEdit = editingId ? products.find((p) => p.id === editingId) || null : null;

  // Real data calculations
  const totalCount = products.length;
  const activeProducts = useMemo(() => products.filter((p) => !p.isArchived), [products]);
  const publishedCount = useMemo(() => activeProducts.filter((p) => p.isPublished !== false).length, [activeProducts]);
  const archivedCount = useMemo(() => products.filter((p) => p.isArchived).length, [products]);
  const featuredCount = useMemo(() => activeProducts.filter((p) => p.isFeatured).length, [activeProducts]);
  const discountedCount = useMemo(() => activeProducts.filter((p) => p.discountActive).length, [activeProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchFilter.trim() === '' ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.materials && p.materials.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchesCat =
        categoryFilter === 'All' ||
        p.category === categoryFilter ||
        (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'published') {
        matchesStatus = p.isPublished !== false && !p.isArchived;
      } else if (statusFilter === 'draft') {
        matchesStatus = p.isPublished === false && !p.isArchived;
      } else if (statusFilter === 'archived') {
        matchesStatus = Boolean(p.isArchived);
      } else if (statusFilter === 'discounted') {
        matchesStatus = Boolean(p.discountActive) && !p.isArchived;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchFilter, categoryFilter, statusFilter]);

  const handleTogglePublish = async (product: Product) => {
    const nextState = !product.isPublished;
    await onUpdateProduct(product.id, { isPublished: nextState });
    showToast(nextState ? `تم نشر القطعة "${product.name}" في المتجر.` : `تم تحويل القطعة "${product.name}" إلى مسودة.`);
  };

  const handleToggleFeatured = async (product: Product) => {
    const nextState = !product.isFeatured;
    await onUpdateProduct(product.id, { isFeatured: nextState });
    showToast(nextState ? `تمت إضافة "${product.name}" إلى التشكيلة المميزة.` : `تمت إزالة "${product.name}" من التشكيلة المميزة.`);
  };

  const handleToggleArchive = async (product: Product) => {
    const nextState = !product.isArchived;
    await onUpdateProduct(product.id, { isArchived: nextState });
    showToast(nextState ? `تمت أرشفة "${product.name}" وإخفاؤها من المتجر.` : `تمت استعادة "${product.name}" من الأرشيف بنجاح.`);
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
                لوحة تحكم المتجر
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
                <span>{dbStatus?.connected ? 'قاعدة بيانات Neon (متصل)' : 'قاعدة بيانات Neon'}</span>
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>تخزين الصور Vercel Blob</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              إدارة متجر أثاث الثقة
            </h1>
            <p className="text-xs text-neutral-400">
              تحكم متكامل في المنتجات، التصنيفات، الأسعار والتخفيضات، وصورة الواجهة الرئيسية
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
          
          {/* Tab 1: Products */}
          <button
            onClick={() => navigateAdmin('/admin/products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isNewView && !isEditView && !isCategoriesView && !isStorefrontView
                ? 'bg-white text-[#1E1E1E] shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>قائمة المنتجات ({totalCount})</span>
          </button>

          {/* Tab 2: Categories */}
          <button
            onClick={() => navigateAdmin('/admin/categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCategoriesView
                ? 'bg-[#FF551A] text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>التصنيفات ({categories.length || 5})</span>
          </button>

          {/* Tab 3: Storefront / Hero */}
          <button
            onClick={() => navigateAdmin('/admin/storefront')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isStorefrontView
                ? 'bg-[#FF551A] text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>واجهة المتجر والهيدر</span>
          </button>

          {/* Tab 4: Trust Standards & Materials */}
          <button
            onClick={() => navigateAdmin('/admin/trust-standards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTrustStandardsView
                ? 'bg-[#FF551A] text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>معايير الثقة والخامات</span>
          </button>

          {/* Tab 5: Add Product */}
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
      {!isNewView && !isEditView && !isCategoriesView && !isStorefrontView && !isTrustStandardsView && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">إجمالي المنتجات</span>
            <span className="text-2xl font-bold text-[#1E1E1E] tabular-nums block">
              {totalCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">{archivedCount > 0 ? `${archivedCount} قطعة بالأرشيف` : 'جميع القطع نشطة'}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">القطع المعروضة</span>
            <span className="text-2xl font-bold text-emerald-700 tabular-nums block">
              {publishedCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">ظاهرة للزبائن في المتجر</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">تخفيضات نشطة</span>
            <span className="text-2xl font-bold text-[#FF551A] tabular-nums block">
              {discountedCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">قطع عليها خصم فعّال</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-1">
            <span className="text-xs text-neutral-500 font-semibold block">القطع المميزة</span>
            <span className="text-2xl font-bold text-[#1E1E1E] tabular-nums block">
              {featuredCount}
            </span>
            <span className="text-[11px] text-neutral-400 block">في الواجهة الرئيسية</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: ADD PRODUCT FORM (/admin/products/new)
          ========================================================================= */}
      {isNewView && (
        <AdminProductForm
          initialProduct={null}
          categories={categories}
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
          categories={categories}
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
          VIEW 3: CATEGORIES MANAGER (/admin/categories)
          ========================================================================= */}
      {isCategoriesView && (
        <AdminCategoriesManager
          products={products}
          onCategoriesUpdated={onCategoriesUpdated}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
          VIEW 4: STOREFRONT & HERO SETTINGS (/admin/storefront)
          ========================================================================= */}
      {isStorefrontView && (
        <AdminStorefrontSettings
          onSettingsUpdated={onSettingsUpdated}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
          VIEW 5: TRUST STANDARDS & MATERIALS MANAGER (/admin/trust-standards)
          ========================================================================= */}
      {isTrustStandardsView && (
        <AdminTrustStandardsManager
          products={products}
          onStandardsUpdated={onTrustStandardsUpdated}
          showToast={showToast}
        />
      )}

      {/* =========================================================================
          VIEW 6: PRODUCTS LIST & CATALOG TABLE (/admin/products)
          ========================================================================= */}
      {!isNewView && !isEditView && !isCategoriesView && !isStorefrontView && !isTrustStandardsView && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden space-y-4">
          
          {/* Table Header & Search Controls */}
          <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E1E1E]">
                قائمة المنتجات ({filteredProducts.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                يمكنك تعديل الأسعار، نشر/أرشفة القطع، أو تحديث الصور ومقاطع الفيديو
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
                  placeholder="بحث بالاسم أو الخامة..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="published">القطع المعروضة</option>
                <option value="draft">المسودات</option>
                <option value="discounted">عليها تخفيض</option>
                <option value="archived">المؤرشفة</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF551A] bg-white cursor-pointer"
              >
                <option value="All">جميع التصنيفات</option>
                {categories.length > 0
                  ? categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAr}
                      </option>
                    ))
                  : ARABIC_CATEGORIES.filter((c) => c.id !== 'All').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAr}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#F8F8F7] text-neutral-600 text-xs uppercase border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-6 font-bold">الوسائط</th>
                    <th className="py-3 px-6 font-bold">اسم القطعة والمواصفات</th>
                    <th className="py-3 px-6 font-bold">التصنيف</th>
                    <th className="py-3 px-6 font-bold">السعر والتخفيض</th>
                    <th className="py-3 px-6 font-bold">حالة النشر</th>
                    <th className="py-3 px-6 font-bold">الأرشيف</th>
                    <th className="py-3 px-6 font-bold">مميز</th>
                    <th className="py-3 px-6 font-bold text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((prod) => {
                    const coverImg = prod.images.find((i) => i.isCover) || prod.images[0];
                    const pricing = getProductPricing(prod);

                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-neutral-50/70 transition-colors ${
                          prod.isArchived ? 'bg-neutral-50/80 opacity-75' : ''
                        }`}
                      >
                        
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

                        {/* Name, Dimensions, Materials */}
                        <td className="py-3 px-6 font-medium text-[#1E1E1E]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[#1E1E1E]">
                              {prod.name}
                            </span>
                            {prod.isArchived && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                                في الأرشيف
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            {prod.dimensions && <span>المقاس: {prod.dimensions}</span>}
                            {prod.dimensions && prod.materials && <span>·</span>}
                            {prod.materials && <span>الخامة: {prod.materials}</span>}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-6 text-neutral-600 text-xs">
                          {prod.category}
                        </td>

                        {/* Price with Discounts or "Price on Request" */}
                        <td className="py-3 px-6 tabular-nums">
                          {!pricing.hasPrice ? (
                            <span className="inline-block text-xs font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
                              السعر عند الطلب
                            </span>
                          ) : pricing.isDiscounted ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-[#FF551A]">
                                  {pricing.priceFormatted}
                                </span>
                                {pricing.discountBadge && (
                                  <span className="text-[10px] font-extrabold bg-[#FF551A]/10 text-[#FF551A] px-1.5 py-0.5 rounded">
                                    {pricing.discountBadge}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 line-through">
                                {pricing.originalPriceFormatted}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-sm text-[#1E1E1E]">
                              {pricing.priceFormatted}
                            </span>
                          )}
                        </td>

                        {/* Published Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            disabled={prod.isArchived}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              prod.isPublished !== false && !prod.isArchived
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                            }`}
                            title="انقر لتغيير حالة النشر في المتجر"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.isPublished !== false && !prod.isArchived ? 'bg-emerald-600' : 'bg-neutral-400'}`} />
                            <span>{prod.isPublished !== false && !prod.isArchived ? 'معروض' : 'مسودة'}</span>
                          </button>
                        </td>

                        {/* Archive Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleToggleArchive(prod)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              prod.isArchived
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                            }`}
                            title={prod.isArchived ? 'استعادة القطعة من الأرشيف' : 'أرشفة القطعة وإخفاؤها من المتجر'}
                          >
                            {prod.isArchived ? (
                              <>
                                <ArchiveRestore className="w-3.5 h-3.5" />
                                <span>استعادة</span>
                              </>
                            ) : (
                              <>
                                <Archive className="w-3.5 h-3.5" />
                                <span>أرشفة</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Featured Toggle */}
                        <td className="py-3 px-6">
                          <button
                            onClick={() => handleToggleFeatured(prod)}
                            disabled={prod.isArchived}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              prod.isFeatured && !prod.isArchived
                                ? 'text-[#FF551A] bg-orange-50'
                                : 'text-neutral-300 hover:text-neutral-500'
                            }`}
                            title="تحديد كمنتج مميز بالواجهة"
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
                              title="تعديل تفاصيل المنتج والصور والأسعار"
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
                              title="حذف المنتج نهائياً"
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
                  setStatusFilter('all');
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
                  <span>تخزين صور وفيديوهات الأثاث (Vercel Blob)</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {blobStatus?.storeName || 'test23-blob'}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                يتم رفع صور معارض وكتالوج الأثاث ومقاطع الفيديو مباشرة إلى Vercel Blob لتوفير استضافة فائقة السرعة وجودة كاملة عبر شبكة CDN العالمية.
              </p>

              <form onSubmit={handleSaveToken} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    رمز الوصول السحابي المخصص (BLOB_READ_WRITE_TOKEN)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="vercel_blob_rw_..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                  />
                  {tokenError && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{tokenError}</p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTokenInput('');
                      setCustomBlobToken('');
                      onRefreshBlobStatus();
                    }}
                    className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 font-semibold cursor-pointer"
                  >
                    استعادة الرمز الافتراضي
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    حفظ واختبار الرمز
                  </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-[#1E1E1E] text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>تغيير كلمة مرور المشرف</span>
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              كلمة المرور الجديدة تُحفظ مشفّرة (Salted Hash) على الخادم لحماية لوحة إدارة أثاث الثقة.
            </p>

            {passwordStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  passwordStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {passwordStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{passwordStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  كلمة المرور الجديدة (6 أحرف كحد أدنى)
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#FF551A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
