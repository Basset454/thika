import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    price: 480,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f1-1',
        url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_oak_chair.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'img-f1-2',
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_chair_detail.jpg',
        isCover: false,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-f2',
    name: 'Minimalist Walnut Dining Table',
    description: 'Six-seater contemporary dining table crafted from sustainable American walnut with matte protective finish. Elegant bevelled edges and solid joinery.',
    price: 920,
    category: 'Dining Room',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f2-1',
        url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
        name: 'walnut_dining_table.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-f3',
    name: 'Bouclé Cloud Modular Sofa',
    description: 'Deep-seat modular 3-piece sectional sofa covered in ivory bouclé fabric. High-density foam core with feather blend topper for ultimate comfort.',
    price: 1650,
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f3-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
        name: 'boucle_sofa.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'prod-f4',
    name: 'Architect Ergonomic Desk',
    description: 'Sleek workspace desk made of solid ash wood with integrated wire management channel, subtle brass accents, and dual soft-close drawers.',
    price: 680,
    category: 'Office',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f4-1',
        url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
        name: 'architect_desk.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const FURNITURE_CATEGORIES = [
  'All',
  'Living Room',
  'Dining Room',
  'Bedroom',
  'Office',
  'Lighting',
];

export interface CategoryMeta {
  id: string;
  nameAr: string;
  nameEn: string;
  keywords: string[];
}

export const ARABIC_CATEGORIES: CategoryMeta[] = [
  { id: 'All', nameAr: 'جميع القطع', nameEn: 'All', keywords: ['all', 'الكل', 'جميع'] },
  { id: 'Living Room', nameAr: 'صالونات وغرف معيشة', nameEn: 'Living Room', keywords: ['living room', 'معيشة', 'صالون', 'أريكة', 'كنبة'] },
  { id: 'Dining Room', nameAr: 'غرف طعام وطاولات', nameEn: 'Dining Room', keywords: ['dining room', 'طعام', 'طاولة', 'سفرة'] },
  { id: 'Bedroom', nameAr: 'غرف نوم وأسرّة', nameEn: 'Bedroom', keywords: ['bedroom', 'نوم', 'سرير', 'خزانة'] },
  { id: 'Office', nameAr: 'مكاتب ومساحات عمل', nameEn: 'Office', keywords: ['office', 'مكتب', 'عمل'] },
  { id: 'Lighting', nameAr: 'إضاءة وديكور راقٍ', nameEn: 'Lighting', keywords: ['lighting', 'إضاءة', 'ديكور', 'مصباح'] },
];

export interface StoreBranch {
  id: string;
  name: string;
  title: string;
  description: string;
  originalUrl: string;
  latitude: number;
  longitude: number;
  directionsUrl: string;
}

export const STORE_BRANCHES: StoreBranch[] = [
  {
    id: 'branch-1',
    name: 'أثاث الثقة 1',
    title: 'المعرض الرئيسي - صالونات وغرف معيشة',
    description: 'تشكيلة متكاملة من الصالونات العصرية والأرائك الوثيرة المصنوعة من أفخر أنواع الأقمشة والأخشاب الطبيعية.',
    originalUrl: 'https://maps.app.goo.gl/UJL7ua8ufzMAz9Vd8',
    latitude: 36.8206112,
    longitude: 5.7504023,
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=36.8206112%2C5.7504023',
  },
  {
    id: 'branch-2',
    name: 'أثاث الثقة 2',
    title: 'معرض غرف النوم والسفرة',
    description: 'تصاميم هندسية مدروسة لغرف النوم الملكية وأطقم السفرة الراقية التي تضفي لمسة من الدفء والجمال.',
    originalUrl: 'https://maps.app.goo.gl/ZAL7azBzT2Nyf1Lf6',
    latitude: 36.8110757,
    longitude: 5.7516371,
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=36.8110757%2C5.7516371',
  },
  {
    id: 'branch-3',
    name: 'أثاث الثقة 3',
    title: 'معرض المساحات المكتبية والديكور',
    description: 'أثاث مكتبي مريح يجمع بين العملية والفخامة، مع عناصر إضاءة وإكسسوارات منزلية متميزة.',
    originalUrl: 'https://maps.app.goo.gl/S3qqXns7hFqoXWN16',
    latitude: 36.8141843,
    longitude: 5.740565,
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=36.8141843%2C5.740565',
  },
];

export function formatDZD(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return 'السعر عند الاستفسار';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' د.ج';
}

