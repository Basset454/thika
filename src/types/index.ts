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

