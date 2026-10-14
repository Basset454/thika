export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'living-room': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80&fm=webp',
  'living room': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80&fm=webp',
  'dining-room': 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80&fm=webp',
  'dining room': 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80&fm=webp',
  'bedroom': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80&fm=webp',
  'office': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80&fm=webp',
  'lighting': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80&fm=webp',
  'kids': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop&q=80&fm=webp',
  'tables': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80&fm=webp',
  'default': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80&fm=webp',
};

/**
 * Resolves default image URL based on category ID, name, or keywords
 */
export function getDefaultCategoryImage(categoryIdOrName?: string): string {
  if (!categoryIdOrName) return CATEGORY_DEFAULT_IMAGES['default'];
  const normalized = categoryIdOrName.trim().toLowerCase();

  if (CATEGORY_DEFAULT_IMAGES[normalized]) {
    return CATEGORY_DEFAULT_IMAGES[normalized];
  }

  if (normalized.includes('معيشة') || normalized.includes('صالون') || normalized.includes('أرائك') || normalized.includes('living')) {
    return CATEGORY_DEFAULT_IMAGES['living-room'];
  }
  if (normalized.includes('طعام') || normalized.includes('سفرة') || normalized.includes('dining')) {
    return CATEGORY_DEFAULT_IMAGES['dining-room'];
  }
  if (normalized.includes('نوم') || normalized.includes('سرير') || normalized.includes('bed')) {
    return CATEGORY_DEFAULT_IMAGES['bedroom'];
  }
  if (normalized.includes('مكتب') || normalized.includes('عمل') || normalized.includes('office')) {
    return CATEGORY_DEFAULT_IMAGES['office'];
  }
  if (normalized.includes('إضاءة') || normalized.includes('ديكور') || normalized.includes('light')) {
    return CATEGORY_DEFAULT_IMAGES['lighting'];
  }
  if (normalized.includes('طفل') || normalized.includes('أطفال') || normalized.includes('kids')) {
    return CATEGORY_DEFAULT_IMAGES['kids'];
  }
  if (normalized.includes('طاولة') || normalized.includes('طاولات') || normalized.includes('table')) {
    return CATEGORY_DEFAULT_IMAGES['tables'];
  }

  return CATEGORY_DEFAULT_IMAGES['default'];
}

/**
 * Returns effective image URL for a category:
 * 1. Custom custom image URL if set
 * 2. Default professional image based on category name/ID
 */
export function getEffectiveCategoryImage(category?: { id?: string; nameAr?: string; nameEn?: string; imageUrl?: string }): string {
  if (category?.imageUrl && category.imageUrl.trim().length > 0) {
    return category.imageUrl.trim();
  }
  return getDefaultCategoryImage(category?.id || category?.nameEn || category?.nameAr);
}
