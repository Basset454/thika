import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Star,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Film,
  Video,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { ProductImage, ProductVideo } from '../types';
import { uploadImageFiles, uploadVideoFiles, deleteImageFile } from '../services/api';

interface AdminImageUploaderProps {
  images: ProductImage[];
  videos?: ProductVideo[];
  onChange?: (images: ProductImage[]) => void;
  onImagesChange?: (images: ProductImage[]) => void;
  onVideosChange?: (videos: ProductVideo[]) => void;
}

export const AdminImageUploader: React.FC<AdminImageUploaderProps> = ({
  images,
  videos = [],
  onChange,
  onImagesChange,
  onVideosChange,
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
  const [replacingVideoId, setReplacingVideoId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const replaceVideoInputRef = useRef<HTMLInputElement>(null);

  const updateImages = (newImages: ProductImage[]) => {
    if (onImagesChange) onImagesChange(newImages);
    if (onChange) onChange(newImages);
  };

  const updateVideos = (newVideos: ProductVideo[]) => {
    if (onVideosChange) onVideosChange(newVideos);
  };

  // -------------------------------------------------------------
  // Image Upload Handling
  // -------------------------------------------------------------
  const handleImageFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    // Validate mime types
    const validFiles = filesArray.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setUploadError('يرجى اختيار ملفات صور صالحة (JPG، PNG، WEBP، GIF، AVIF).');
      return;
    }

    // Validate size limit (max 20MB per image)
    const oversized = validFiles.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) {
      setUploadError(
        `حجم الصورة "${oversized.name}" يتجاوز الحد الأقصى المسموح به (20 ميجابايت).`
      );
      return;
    }

    setUploadError(null);
    setSuccessMessage(null);
    setIsUploadingImage(true);
    setImageProgress(10);

    try {
      const uploaded = await uploadImageFiles(validFiles, (progress) => {
        setImageProgress(progress);
      });

      if (uploaded && uploaded.length > 0) {
        const hasExistingCover = images.some((img) => img.isCover);
        const processedNew = uploaded.map((img, index) => ({
          ...img,
          isCover: !hasExistingCover && index === 0,
        }));

        const combined = [...images, ...processedNew];
        updateImages(combined);
        setSuccessMessage(`تم رفع ${uploaded.length} صورة بنجاح إلى Vercel Blob.`);
      }
    } catch (err: any) {
      console.error('Vercel Blob image upload failure:', err);
      setUploadError(err.message || 'فشل رفع الصور إلى Vercel Blob.');
    } finally {
      setIsUploadingImage(false);
      setImageProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // Video Upload Handling
  // -------------------------------------------------------------
  const handleVideoFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);

    // Validate video mime types
    const validFiles = filesArray.filter((file) => file.type.startsWith('video/'));
    if (validFiles.length === 0) {
      setUploadError('يرجى اختيار ملفات فيديو صالحة (MP4، WebM، MOV، OGG).');
      return;
    }

    // Validate size limit (max 100MB per video)
    const oversized = validFiles.find((f) => f.size > 100 * 1024 * 1024);
    if (oversized) {
      setUploadError(
        `حجم الفيديو "${oversized.name}" (${(oversized.size / (1024 * 1024)).toFixed(1)} ميجابايت) يتجاوز الحد الأقصى (100 ميجابايت).`
      );
      return;
    }

    setUploadError(null);
    setSuccessMessage(null);
    setIsUploadingVideo(true);
    setVideoProgress(10);

    try {
      const uploaded = await uploadVideoFiles(validFiles, (progress) => {
        setVideoProgress(progress);
      });

      if (uploaded && uploaded.length > 0) {
        const combined = [...videos, ...uploaded];
        updateVideos(combined);
        setSuccessMessage(`تم رفع ${uploaded.length} فيديو بنجاح إلى Vercel Blob.`);
      }
    } catch (err: any) {
      console.error('Vercel Blob video upload failure:', err);
      setUploadError(err.message || 'فشل رفع الفيديو إلى Vercel Blob.');
    } finally {
      setIsUploadingVideo(false);
      setVideoProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // Image Reordering
  // -------------------------------------------------------------
  const handleMoveImage = (index: number, direction: 'earlier' | 'later') => {
    const targetIndex = direction === 'earlier' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    updateImages(updated);
  };

  // -------------------------------------------------------------
  // Set Primary Cover Image
  // -------------------------------------------------------------
  const handleSetCover = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isCover: img.id === id,
    }));
    updateImages(updated);
  };

  // -------------------------------------------------------------
  // Delete Image / Video
  // -------------------------------------------------------------
  const handleRemoveImage = async (id: string, url: string) => {
    if (url.includes('blob.vercel-storage.com')) {
      deleteImageFile(url).catch((err) => console.warn('Blob del warn:', err));
    }

    const remaining = images.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
      remaining[0].isCover = true;
    }
    updateImages(remaining);
  };

  const handleRemoveVideo = async (id: string, url: string) => {
    if (url.includes('blob.vercel-storage.com')) {
      deleteImageFile(url).catch((err) => console.warn('Blob del warn:', err));
    }

    const remaining = videos.filter((vid) => vid.id !== id);
    updateVideos(remaining);
  };

  // -------------------------------------------------------------
  // Replace Image / Video In-Place
  // -------------------------------------------------------------
  const triggerReplaceImage = (id: string) => {
    setReplacingImageId(id);
    replaceImageInputRef.current?.click();
  };

  const handleExecuteReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار صورة صالحة لاستبدال الملف.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('حجم الصورة البديلة يتجاوز الحد الأقصى 20 ميجابايت.');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const oldImg = images.find((img) => img.id === replacingImageId);
      const [uploaded] = await uploadImageFiles([file]);
      if (uploaded) {
        // Delete old blob in background
        if (oldImg?.url && oldImg.url.includes('blob.vercel-storage.com')) {
          deleteImageFile(oldImg.url).catch(() => {});
        }

        const updated = images.map((img) =>
          img.id === replacingImageId
            ? { ...uploaded, id: img.id, isCover: img.isCover }
            : img
        );
        updateImages(updated);
        setSuccessMessage('تم استبدال الصورة بنجاح.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'فشل استبدال الصورة.');
    } finally {
      setIsUploadingImage(false);
      setReplacingImageId(null);
      if (replaceImageInputRef.current) replaceImageInputRef.current.value = '';
    }
  };

  const triggerReplaceVideo = (id: string) => {
    setReplacingVideoId(id);
    replaceVideoInputRef.current?.click();
  };

  const handleExecuteReplaceVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingVideoId) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('يرجى اختيار ملف فيديو صالح لاستبدال الفيديو.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('حجم الفيديو البديل يتجاوز الحد الأقصى 100 ميجابايت.');
      return;
    }

    setIsUploadingVideo(true);
    setUploadError(null);
    try {
      const oldVid = videos.find((v) => v.id === replacingVideoId);
      const [uploaded] = await uploadVideoFiles([file]);
      if (uploaded) {
        if (oldVid?.url && oldVid.url.includes('blob.vercel-storage.com')) {
          deleteImageFile(oldVid.url).catch(() => {});
        }

        const updated = videos.map((v) =>
          v.id === replacingVideoId ? { ...uploaded, id: v.id } : v
        );
        updateVideos(updated);
        setSuccessMessage('تم استبدال الفيديو بنجاح.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'فشل استبدال الفيديو.');
    } finally {
      setIsUploadingVideo(false);
      setReplacingVideoId(null);
      if (replaceVideoInputRef.current) replaceVideoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden inputs for replacements */}
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleExecuteReplaceImage}
      />
      <input
        ref={replaceVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/ogg"
        className="hidden"
        onChange={handleExecuteReplaceVideo}
      />

      {/* Top Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
        <div>
          <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2">
            <span>وسائط قطعة الأثاث</span>
            <span className="text-[11px] font-normal text-neutral-500">
              (صور وفيديوهات بدقة عالية)
            </span>
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            تُحفظ جميع الملفات بشكل دائم على شبكة Vercel Blob مع ربطها المباشر في قاعدة البيانات.
          </p>
        </div>

        {/* Media Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/70 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMediaTab('images')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMediaTab === 'images'
                ? 'bg-white text-[#1E1E1E] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#FF551A]" />
            <span>الصور ({images.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMediaTab('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMediaTab === 'videos'
                ? 'bg-white text-[#1E1E1E] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-[#FF551A]" />
            <span>الفيديو ({videos.length})</span>
            {videos.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#FF551A] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{uploadError}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: IMAGES MANAGEMENT
          ========================================================================= */}
      {activeMediaTab === 'images' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>الحد الأقصى لكل صورة: 20 ميجابايت (JPG, PNG, WEBP, AVIF)</span>
            <span className="font-semibold text-neutral-700">
              {images.length > 0 ? `${images.length} صورة مضافة` : 'لا توجد صور بعد'}
            </span>
          </div>

          {/* Drag & Drop Upload Zone for Images */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingImage(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingImage(false);
              if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
            }}
            onClick={() => imageInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDraggingImage
                ? 'border-[#FF551A] bg-orange-50/60 scale-[1.01]'
                : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/60'
            }`}
          >
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />

            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF551A]" />
                ) : (
                  <Upload className="w-6 h-6 text-neutral-600" />
                )}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                  {isUploadingImage
                    ? 'جارٍ رفع الصور إلى Vercel Blob...'
                    : 'انقر لاختيار صور متعددة أو اسحبها وأفلتها هنا'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  يمكنك رفع أكثر من صورة دفعة واحدة، وإعادة ترتيبها وتعيين صورة الغلاف بسهولة
                </p>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploadingImage && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex justify-between text-[11px] text-neutral-600 font-semibold mb-1">
                  <span>جارٍ الرفع المباشر...</span>
                  <span className="tabular-nums">{imageProgress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#FF551A] h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${imageProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Images Grid with Reorder, Cover, Replace & Delete */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`group relative rounded-2xl overflow-hidden border-2 bg-white transition-all shadow-xs ${
                    img.isCover
                      ? 'border-[#FF551A] ring-2 ring-[#FF551A]/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Sequence Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                    <span className="bg-[#1E1E1E]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      #{idx + 1}
                    </span>
                    {img.isCover && (
                      <span className="bg-[#FF551A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        <span>الغلاف الأساسي</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Image */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                    <img
                      src={img.url}
                      alt={img.name || `صورة ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Quick Reorder Overlay on Hover */}
                    <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 pointer-events-none">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'earlier')}
                          title="تحريك للأمام (تقديم)"
                          className="pointer-events-auto p-2 bg-white text-[#1E1E1E] rounded-xl hover:bg-[#FF551A] hover:text-white shadow-md transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'later')}
                          title="تحريك للخلف (تأخير)"
                          className="pointer-events-auto p-2 bg-white text-[#1E1E1E] rounded-xl hover:bg-[#FF551A] hover:text-white shadow-md transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="p-3 bg-neutral-50 border-t border-neutral-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      {/* Set Cover Toggle */}
                      {!img.isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="text-[11px] font-bold text-neutral-600 hover:text-[#FF551A] flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          <span>تعيين كغلاف</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-[#FF551A]">الصورة الرئيسية</span>
                      )}

                      {/* External view */}
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="فتح الصورة بحجمها الكامل"
                        className="p-1 text-neutral-400 hover:text-neutral-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Bottom Action Row: Reorder, Replace, Delete */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 text-[11px]">
                      {/* Move buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, 'earlier')}
                          title="تحريك لليمين (ترتيب أسبق)"
                          className="px-2 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          → أسبق
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => handleMoveImage(idx, 'later')}
                          title="تحريك لليسار (ترتيب تالي)"
                          className="px-2 py-0.5 rounded bg-neutral-200/70 hover:bg-neutral-300 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          تالي ←
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Replace Button */}
                        <button
                          type="button"
                          onClick={() => triggerReplaceImage(img.id)}
                          title="استبدال هذه الصورة بملف جديد"
                          className="p-1 text-neutral-500 hover:text-[#1E1E1E] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">استبدال</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id, img.url)}
                          title="حذف الصورة"
                          className="p-1 text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: VIDEO MANAGEMENT
          ========================================================================= */}
      {activeMediaTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>الحد الأقصى لكل فيديو: 100 ميجابايت (MP4, WebM, QuickTime MOV)</span>
            <span className="font-semibold text-neutral-700">
              {videos.length > 0 ? `${videos.length} فيديو مسجل` : 'لا يوجد فيديو بعد'}
            </span>
          </div>

          {/* Drag & Drop Upload Zone for Videos */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingVideo(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingVideo(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingVideo(false);
              if (e.dataTransfer.files) handleVideoFiles(e.dataTransfer.files);
            }}
            onClick={() => videoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDraggingVideo
                ? 'border-[#FF551A] bg-orange-50/60 scale-[1.01]'
                : 'border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50/60'
            }`}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg"
              className="hidden"
              onChange={(e) => handleVideoFiles(e.target.files)}
            />

            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                {isUploadingVideo ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF551A]" />
                ) : (
                  <Video className="w-6 h-6 text-[#FF551A]" />
                )}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                  {isUploadingVideo
                    ? 'جارٍ رفع الفيديو إلى Vercel Blob...'
                    : 'انقر لرفع فيديو للقطعة أو اسحبه وأفلته هنا'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  يمكنك رفع فيديو أو أكثر لإظهار تفاصيل الخامات والتشطيبات وحركة القطعة في المعرض
                </p>
              </div>
            </div>

            {/* Video Upload Progress */}
            {isUploadingVideo && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex justify-between text-[11px] text-neutral-600 font-semibold mb-1">
                  <span>جارٍ نقل الفيديو سحابياً...</span>
                  <span className="tabular-nums">{videoProgress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#FF551A] h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Videos Grid with Interactive Preview */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {videos.map((vid, idx) => (
                <div
                  key={vid.id || idx}
                  className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-xs space-y-3 p-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 text-xs">
                    <span className="font-bold text-[#1E1E1E] flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-[#FF551A]" />
                      <span>فيديو القطعة #{idx + 1}</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {vid.size ? `${(vid.size / (1024 * 1024)).toFixed(1)} MB` : 'Vercel Blob'}
                    </span>
                  </div>

                  {/* HTML5 Video Preview Player */}
                  <div className="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center">
                    <video
                      src={vid.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Video Actions: Replace, Delete, Link */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerReplaceVideo(vid.id)}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold flex items-center gap-1.5 cursor-pointer text-[11px]"
                      >
                        <RefreshCw className="w-3 h-3 text-neutral-500" />
                        <span>استبدال الفيديو</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(vid.id, vid.url)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold flex items-center gap-1.5 cursor-pointer text-[11px]"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>حذف الفيديو</span>
                      </button>
                    </div>

                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح رابط الفيديو في تبويب جديد"
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
