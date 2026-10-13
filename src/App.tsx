import React, { useState, useEffect } from 'react';
import { Product, BlobStatus, DatabaseStatus } from './types';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getBlobStatus, 
  getDatabaseStatus,
  resetProductsToInitial,
  checkAdminStatus,
  adminLogout
} from './services/api';
import { CustomerNavbar } from './components/CustomerNavbar';
import { CustomerStore } from './components/CustomerStore';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { CheckCircle2, AlertCircle, Armchair, MapPin, PhoneCall, ShieldCheck, Truck, Lock } from 'lucide-react';
import { STORE_BRANCHES } from './data/initialProducts';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [adminSubpath, setAdminSubpath] = useState('/admin/products');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [storeCategory, setStoreCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [blobStatus, setBlobStatus] = useState<BlobStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Synchronize route from browser location
  const syncRoute = async () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    const isAdmin = path.startsWith('/admin') || hash.startsWith('#admin');
    setIsAdminRoute(isAdmin);

    if (isAdmin) {
      let sub = path.startsWith('/admin') ? path : hash.replace('#', '/');
      if (sub === '/admin' || sub === '/admin/') {
        sub = '/admin/products';
      }
      setAdminSubpath(sub);

      // Verify server session
      setCheckingAuth(true);
      const isAuthValid = await checkAdminStatus();
      setIsAuthenticated(isAuthValid);
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const navigateAdmin = (path: string) => {
    window.history.pushState({}, '', path);
    setAdminSubpath(path);
    setIsAdminRoute(true);
    syncRoute();
  };

  // Fetch products from server database
  const refreshProducts = async (forAdmin?: boolean) => {
    try {
      const data = await getProducts(forAdmin ?? isAdminRoute);
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products from server database:', err);
      showToast(err.message || 'تعذر تحميل المنتجات من الخادم', 'error');
    }
  };

  const refreshBlobStatus = async () => {
    try {
      const status = await getBlobStatus();
      setBlobStatus(status);
    } catch (e) {
      console.warn('Could not refresh blob status:', e);
    }
  };

  const refreshDbStatus = async () => {
    try {
      const status = await getDatabaseStatus();
      setDbStatus(status);
    } catch (e) {
      console.warn('Could not refresh db status:', e);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([refreshProducts(isAdminRoute), refreshBlobStatus(), refreshDbStatus()]);
      setLoading(false);
    }
    init();
  }, [isAdminRoute]);

  // Admin Actions
  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await createProduct(newProduct);
    setProducts((prev) => [created, ...prev]);
    showToast(`تمت إضافة القطعة "${created.name}" وحفظها في قاعدة البيانات.`);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('تم تحديث بيانات القطعة بنجاح.');
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('تم حذف القطعة من قاعدة البيانات.', 'success');
  };

  const handleResetProducts = async () => {
    if (window.confirm('هل تريد استعادة التشكيلة الافتراضية؟')) {
      const resetList = await resetProductsToInitial();
      setProducts(resetList);
      showToast('تمت استعادة كتالوج الأثاث الافتراضي.');
    }
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#1E1E1E] antialiased flex flex-col justify-between selection:bg-[#FF551A] selection:text-white">
      
      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-red-950 text-red-100 border-red-800'
                : 'bg-[#1E1E1E] text-white border-neutral-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#FF551A] shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <div className="flex-1">
        {isAdminRoute ? (
          // ==================== INDEPENDENT ADMIN PORTAL (/admin) ====================
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!isAuthenticated ? (
              <AdminLogin
                onLoginSuccess={() => {
                  setIsAuthenticated(true);
                  refreshProducts(true);
                  navigateAdmin('/admin/products');
                }}
              />
            ) : (
              <AdminPanel
                products={products}
                currentAdminSubpath={adminSubpath}
                navigateAdmin={navigateAdmin}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetProducts={handleResetProducts}
                onLogout={handleAdminLogout}
                blobStatus={blobStatus}
                onRefreshBlobStatus={refreshBlobStatus}
                dbStatus={dbStatus}
                onRefreshDbStatus={refreshDbStatus}
              />
            )}
          </div>
        ) : (
          // ==================== CUSTOMER STOREFRONT (/) ====================
          // STRICT RULE: No admin link/button anywhere in customer UI
          <>
            <CustomerNavbar onCategorySelect={setStoreCategory} />
            <main className="w-full">
              {loading ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8 animate-pulse">
                  <div className="h-64 sm:h-80 bg-neutral-200/70 rounded-3xl w-full" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
                        <div className="aspect-4/3 bg-neutral-200/70 rounded-xl" />
                        <div className="h-4 bg-neutral-200/70 rounded-md w-3/4" />
                        <div className="h-3 bg-neutral-200/50 rounded-md w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <CustomerStore
                  products={products}
                  selectedCategory={storeCategory}
                  onCategoryChange={setStoreCategory}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Customer Footer (NO ADMIN LINK ANYWHERE) */}
      {!isAdminRoute && (
        <footer className="bg-[#1E1E1E] text-white border-t border-neutral-800 py-16 mt-20 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Brand Col */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF551A] text-white flex items-center justify-center font-bold">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xl font-bold tracking-tight text-white block">
                      أثاث الثقة
                    </span>
                    <span className="text-[10px] text-neutral-400 block tracking-wider uppercase">
                      TRUST FURNITURE STUDIO
                    </span>
                  </div>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed max-w-md pt-1">
                  دار متخصصة في تصميم وتوريد الأثاث المنزلي والمكتبي الراقي، مصممة لإضفاء طابع الفخامة المعاصرة والراحة الدائمة على منازلكم.
                </p>
              </div>

              {/* Showroom Branches */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  معارضنا في الجزائر
                </span>
                <ul className="space-y-2 text-neutral-400 text-xs">
                  {STORE_BRANCHES.map((b) => (
                    <li key={b.id} className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#FF551A] shrink-0 mt-0.5" />
                      <div>
                        <a
                          href={b.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#FF551A] font-bold block transition-colors"
                          title={`عرض موقع ${b.name} في خرائط Google`}
                        >
                          {b.name}
                        </a>
                        <span className="text-[11px] text-neutral-400">{b.title}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Navigation Links */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  روابط سريعة
                </span>
                <ul className="space-y-2 text-neutral-400 text-xs font-medium">
                  <li>
                    <a href="#categories" className="hover:text-[#FF551A] transition-colors block">
                      تشكيلة الأثاث والتصنيفات
                    </a>
                  </li>
                  <li>
                    <a href="#featured" className="hover:text-[#FF551A] transition-colors block">
                      القطع المميزة والمختارة
                    </a>
                  </li>
                  <li>
                    <a href="#catalog" className="hover:text-[#FF551A] transition-colors block">
                      الكتالوج الكامل المتكامل
                    </a>
                  </li>
                  <li>
                    <a href="#branches" className="hover:text-[#FF551A] transition-colors block">
                      معارضنا في الجزائر
                    </a>
                  </li>
                  <li>
                    <a href="#guarantees" className="hover:text-[#FF551A] transition-colors block">
                      الخامات والضمانات
                    </a>
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
              <p>
                © {new Date().getFullYear()} أثاث الثقة (Trust Furniture). جميع الحقوق محفوظة.
              </p>
              <div className="flex items-center gap-4 text-neutral-400">
                <span>صالونات</span>
                <span>·</span>
                <span>غرف طعام</span>
                <span>·</span>
                <span>غرف نوم</span>
                <span>·</span>
                <span>مكاتب</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => navigateAdmin('/admin/products')}
                  className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-[#FF551A] transition-colors cursor-pointer font-medium"
                  title="الدخول إلى لوحة تحكم المشرف (/admin)"
                >
                  <Lock className="w-3 h-3 text-[#FF551A]" />
                  <span>لوحة الإدارة</span>
                </button>
              </div>
            </div>

          </div>
        </footer>
      )}

    </div>
  );
}
