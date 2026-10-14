import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { adminLogin } from '../services/api';
import { LogoMark } from './LogoMark';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة مرور الإدارة.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calls server-side authentication endpoint (/api/admin/login)
      await adminLogin(password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة أو غير مهيأة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-xl p-8 sm:p-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-neutral-900/5 p-2 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-neutral-200/60">
            <LogoMark className="w-full h-full" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#1E1E1E]">
              بوابة إدارة أثاث الثقة
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              منطقة محمية لإدارة كتالوج المنتجات ورفع الصور إلى Vercel Blob
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
              كلمة مرور المشرف *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="أدخل كلمة المرور السرية..."
                className="w-full pr-4 pl-11 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF551A] focus:border-transparent text-[#1E1E1E]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1E1E1E] hover:bg-[#FF551A] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>تسجيل الدخول إلى لوحة التحكم</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>جلسة مشفرة ومحمية</span>
          </span>
          <a
            href="/"
            className="text-neutral-500 hover:text-[#FF551A] transition-colors"
          >
            العودة للمتجر
          </a>
        </div>

      </div>
    </div>
  );
};
