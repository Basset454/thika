import React, { useState, useRef } from 'react';
import { Upload, X, Star, AlertCircle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { ProductImage } from '../types';
import { uploadImageFiles, deleteImageFile } from '../services/api';

interface AdminImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export const AdminImageUploader: React.FC<AdminImageUploaderProps> = ({
  images,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    const validFiles = filesArray.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setUploadError('يرجى اختيار ملفات صور صالحة (JPG، PNG، WEBP، GIF، AVIF).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Calls real binary Vercel Blob upload (NO FAKE / BASE64 FALLBACK)
      const uploaded = await uploadImageFiles(validFiles, (progress) => {
        setUploadProgress(progress);
      });

      if (uploaded && uploaded.length > 0) {
        const hasExistingCover = images.some((img) => img.isCover);
        const processedNew = uploaded.map((img, index) => ({
          ...img,
          isCover: !hasExistingCover && index === 0,
        }));

        onChange([...images, ...processedNew]);
        setLastUploadedUrl(uploaded[0].url);
      }
    } catch (err: any) {
      console.error('Vercel Blob upload failure:', err);
      setUploadError(
        err.message ||
          'فشل رفع الصورة إلى Vercel Blob (test23-blob). يرجى التأكد من صلاحية مفاتيح التخزين.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetCover = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    onChange(updated);
  };

  const handleRemoveImage = async (id: string, url: string) => {
    if (url.includes('blob.vercel-storage.com')) {
      deleteImageFile(url).catch((err) => console.warn('Blob del warn:', err));
    }

    const remaining = images.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
      remaining[0].isCover = true;
    }
    onChange(remaining);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
          صور القطعة ({images.length})
        </label>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
          Vercel Blob (test23-blob)
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#FF551A] bg-orange-50/60 scale-[1.01]'
            : 'border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50/80 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#FF551A]" />
            ) : (
              <Upload className="w-6 h-6 text-neutral-600" />
            )}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
              {isUploading ? 'جارٍ رفع الصور إلى Vercel Blob...' : 'انقر لاختيار الصور أو اسحبها وأفلتها هنا مباشرة'}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              يتم حفظ الملفات الأصلية كصور حقيقية دائمة على شبكة Vercel Blob (بدون تخزين مؤقت أو Base64)
            </p>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-[11px] text-neutral-600 font-semibold mb-1">
              <span>جارٍ التدفق السحابي...</span>
              <span className="tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#FF551A] h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Notice */}
      {lastUploadedUrl && !uploadError && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تم رفع الصورة بنجاح إلى Vercel Blob:</span>
          </div>
          <div className="font-mono text-[11px] text-emerald-900 break-all bg-emerald-100/60 p-2 rounded-lg border border-emerald-200/80">
            {lastUploadedUrl}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>تنبيه خطأ في رفع الصورة:</span>
          </div>
          <p className="text-red-800 leading-relaxed font-mono text-[11px] bg-red-100/60 p-2 rounded-lg">
            {uploadError}
          </p>
        </div>
      )}

      {/* Thumbnails Grid & Cover Selection */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative rounded-2xl overflow-hidden border-2 bg-neutral-100 transition-all ${
                img.isCover
                  ? 'border-[#FF551A] ring-2 ring-[#FF551A]/20'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div className="aspect-square relative overflow-hidden bg-neutral-50">
                <img
                  src={img.url}
                  alt={img.name || `صورة ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {img.isCover && (
                  <div className="absolute top-2 right-2 bg-[#FF551A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-white" />
                    <span>الغلاف</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 bg-[#1E1E1E]/80 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  {img.url.includes('blob.vercel-storage.com') ? 'Vercel Blob' : 'رابط خارجي'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2.5 bg-white flex items-center justify-between text-xs border-t border-neutral-100">
                {!img.isCover ? (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img.id)}
                    className="text-[11px] font-semibold text-neutral-600 hover:text-[#FF551A] flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3 h-3" />
                    <span>تعيين كغلاف</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-[#FF551A]">الصورة الرئيسية</span>
                )}

                <div className="flex items-center gap-1">
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="فتح رابط الصورة الكامل"
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id, img.url)}
                    title="حذف الصورة"
                    className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
