export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover: boolean;
  name?: string;
  size?: number;
  uploadedAt: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  pathname?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: ProductImage[];
  videos?: ProductVideo[];
  coverImageUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;

  // Pricing & Discount Options
  showPrice?: boolean; // When false, displays "السعر عند الطلب" (no fake zero/default price)
  discountActive?: boolean; // Independent toggle for promotions/discounts
  discountPrice?: number; // Discounted final price in DZD
  discountPercent?: number; // Discount percentage (e.g. 15%)
  discountStartDate?: string; // Optional start date for promotion (ISO string)
  discountEndDate?: string; // Optional end date for promotion (ISO string)

  // Architectural & Craftsmanship Details
  dimensions?: string; // Dimensions / المقاسات (e.g. 240 × 100 × 85 سم)
  materials?: string; // Materials / خامات الصنع (e.g. خشب زان روماني، قماش بوكليه، إسفنج عالي الكثافة)
  availability?: 'in_stock' | 'pre_order' | 'made_to_order' | 'out_of_stock'; // حالة التوفر في المعرض

  // Lifecycle
  isArchived?: boolean; // Archive / restore capability
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  order: number;
  isHidden: boolean;
  description?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  heroImageUrl: string;
  heroBadgeText?: string;
  heroTitlePrefix?: string;
  heroTitleHighlight?: string;
  heroDescription?: string;
  heroTypewriterPhrases?: string[];
  heroCtaPrimaryText?: string;
  heroCtaPrimaryLink?: string;
  heroCtaSecondaryText?: string;
  heroCtaSecondaryLink?: string;
  updatedAt?: string;
}

export interface BlobStatus {
  connected: boolean;
  tokenConfigured: boolean;
  maskedToken?: string;
  message: string;
  storeName?: string;
}

export interface DatabaseStatus {
  isConfigured: boolean;
  connected: boolean;
  provider: string;
  count: number;
  message: string;
  maskedUrl?: string;
  error?: string;
}

