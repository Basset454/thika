import { neon } from '@neondatabase/serverless';
import { Product, ProductImage, ProductVideo } from './_handlers/products.js';

export interface CategoryRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  order: number;
  isHidden: boolean;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettingsRecord {
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

export const INITIAL_CATEGORIES: CategoryRecord[] = [
  { id: 'Living Room', nameAr: 'صالونات وغرف معيشة', nameEn: 'Living Room', order: 1, isHidden: false, description: 'أرائك عصرية، صالونات زاوية فاخرة، وأطقم جلوس مريحة.', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=85' },
  { id: 'Dining Room', nameAr: 'غرف طعام وطاولات', nameEn: 'Dining Room', order: 2, isHidden: false, description: 'طاولات خشب طبيعي مصمت وكراسي سفرة متناسقة وأنيقة.', imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1200&auto=format&fit=crop&q=85' },
  { id: 'Bedroom', nameAr: 'غرف نوم وأسرّة', nameEn: 'Bedroom', order: 3, isHidden: false, description: 'أسرّة ملكية، طاولات سرير جانبية، وخزائن ملابس راقية.', imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=85' },
  { id: 'Office', nameAr: 'مكاتب ومساحات عمل', nameEn: 'Office', order: 4, isHidden: false, description: 'مكاتب خشبية مريحة وخزائن ملفات هندسية متطورة.', imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200&auto=format&fit=crop&q=85' },
  { id: 'Lighting', nameAr: 'إضاءة وديكور راقٍ', nameEn: 'Lighting', order: 5, isHidden: false, description: 'عناصر إضاءة وديكورات مكملة للأثاث.', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&auto=format&fit=crop&q=85' },
];

export const DEFAULT_STORE_SETTINGS: StoreSettingsRecord = {
  heroImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=85',
  heroBadgeText: 'أثاث الثقة · فخامة الأثاث المعاصر في الجزائر',
  heroTitlePrefix: 'فخامة الأثاث العصري..',
  heroTitleHighlight: 'تدوم لأجيال',
  heroDescription: 'دار متخصصة في تصميم وتوريد أرقى الصالونات، غرف الطعام، والمساحات المكتبية. نعتمد أخشاب الزان والبلوط الطبيعية وأفخر الأقمشة لتجربة راحة استثنائية.',
  heroTypewriterPhrases: [
    'تفاصيل تصنع الفرق',
    'مساحات تعكس ذوقك',
    'راحة تبدأ من اختيارك',
    'جمال يسكن تفاصيل بيتك',
  ],
  heroCtaPrimaryText: 'تصفح الأثاث',
  heroCtaPrimaryLink: '#catalog',
  heroCtaSecondaryText: 'اكتشف فروعنا',
  heroCtaSecondaryLink: '#branches',
};

/**
 * Resolves the active Neon PostgreSQL connection URL.
 */
export function getDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      const trimmed = candidate.trim().replace(/^['"]|['"]$/g, '');
      if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
        return trimmed;
      }
    }
  }

  // Auto-recover if mistakenly placed in BLOB_READ_WRITE_TOKEN
  const blobCandidate = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobCandidate && typeof blobCandidate === 'string') {
    const trimmed = blobCandidate.trim().replace(/^['"]|['"]$/g, '');
    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      process.env.DATABASE_URL = trimmed;
      delete process.env.BLOB_READ_WRITE_TOKEN;
      console.log('Successfully recovered PostgreSQL connection URL from BLOB_READ_WRITE_TOKEN into DATABASE_URL');
      return trimmed;
    }
  }

  return undefined;
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

/**
 * Returns a Neon SQL execution tagged template function.
 */
export function getNeonSql() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('Neon database is not configured: DATABASE_URL is missing or invalid.');
  }
  return neon(dbUrl);
}

/**
 * Maps a database row from the products table to the application Product interface.
 */
export function rowToProduct(row: any): Product {
  let images: ProductImage[] = [];
  if (Array.isArray(row.images)) {
    images = row.images;
  } else if (typeof row.images === 'string') {
    try {
      images = JSON.parse(row.images);
    } catch {
      images = [];
    }
  }

  let videos: ProductVideo[] = [];
  if (Array.isArray(row.videos)) {
    videos = row.videos;
  } else if (typeof row.videos === 'string') {
    try {
      videos = JSON.parse(row.videos);
    } catch {
      videos = [];
    }
  }

  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: String(row.description || ''),
    price: Number(row.price) || 0,
    category: String(row.category || 'Living Room'),
    coverImageUrl: String(row.cover_image_url || (images[0]?.url ?? '')),
    images,
    videos,
    isPublished: row.is_published ?? true,
    isFeatured: row.is_featured ?? false,
    showPrice: row.show_price !== undefined ? Boolean(row.show_price) : true,
    discountActive: Boolean(row.discount_active),
    discountPrice: row.discount_price !== null && row.discount_price !== undefined ? Number(row.discount_price) : undefined,
    discountPercent: row.discount_percent !== null && row.discount_percent !== undefined ? Number(row.discount_percent) : undefined,
    discountStartDate: row.discount_start_date ? new Date(row.discount_start_date).toISOString() : undefined,
    discountEndDate: row.discount_end_date ? new Date(row.discount_end_date).toISOString() : undefined,
    dimensions: row.dimensions || undefined,
    materials: row.materials || undefined,
    availability: (row.availability as any) || 'in_stock',
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

let isInitialized = false;

/**
 * Ensures the products table and all non-destructive schema columns exist in Neon PostgreSQL.
 */
export async function ensureProductsTable(initialProducts?: Product[]): Promise<boolean> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return false;

  try {
    const sql = neon(dbUrl);
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL DEFAULT 'Living Room',
        cover_image_url TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        videos JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_published BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Non-destructive additions of all new columns
    const alterQueries = [
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS show_price BOOLEAN DEFAULT true;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(12, 2);`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2);`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMPTZ;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMPTZ;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT;`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'in_stock';`,
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;`,
    ];

    for (const q of alterQueries) {
      try {
        await q;
      } catch {
        // ignore if exists
      }
    }

    if (initialProducts && initialProducts.length > 0) {
      const countResult = await sql`SELECT COUNT(*)::int as total FROM products;`;
      const count = countResult[0]?.total || 0;
      if (count === 0) {
        console.log(`Seeding ${initialProducts.length} initial products into Neon PostgreSQL...`);
        for (const p of initialProducts) {
          await sql`
            INSERT INTO products (
              id, name, description, price, category, cover_image_url, images, videos,
              is_published, is_featured, show_price, discount_active, discount_price, discount_percent,
              dimensions, materials, availability, is_archived, created_at, updated_at
            ) VALUES (
              ${p.id},
              ${p.name},
              ${p.description},
              ${p.price},
              ${p.category},
              ${p.coverImageUrl || ''},
              ${JSON.stringify(p.images || [])}::jsonb,
              ${JSON.stringify(p.videos || [])}::jsonb,
              ${p.isPublished !== false},
              ${Boolean(p.isFeatured)},
              ${p.showPrice !== false},
              ${Boolean(p.discountActive)},
              ${p.discountPrice ?? null},
              ${p.discountPercent ?? null},
              ${p.dimensions || null},
              ${p.materials || null},
              ${p.availability || 'in_stock'},
              ${Boolean(p.isArchived)},
              ${p.createdAt || new Date().toISOString()},
              ${p.updatedAt || new Date().toISOString()}
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
        console.log('Initial products successfully seeded into Neon database.');
      }
    }

    isInitialized = true;
    return true;
  } catch (err: any) {
    console.error('Failed to ensure products table in Neon PostgreSQL:', err?.message || err);
    return false;
  }
}

/**
 * Initializes the Neon PostgreSQL database: creates table if missing and seeds initial items if empty.
 */
export async function initDatabase(initialProducts: Product[]): Promise<boolean> {
  return ensureProductsTable(initialProducts);
}

/**
 * Fetches all products from Neon PostgreSQL.
 */
export async function getAllProductsFromDb(initialFallbackProducts?: Product[]): Promise<Product[]> {
  if (!isInitialized && initialFallbackProducts) {
    await ensureProductsTable(initialFallbackProducts);
  }
  const sql = getNeonSql();
  try {
    const rows = await sql`
      SELECT *
      FROM products
      ORDER BY created_at DESC;
    `;
    return rows.map(rowToProduct);
  } catch (err: any) {
    if (String(err?.message || err).includes('does not exist') && initialFallbackProducts) {
      await ensureProductsTable(initialFallbackProducts);
      const rows = await sql`
        SELECT *
        FROM products
        ORDER BY created_at DESC;
      `;
      return rows.map(rowToProduct);
    }
    throw err;
  }
}

/**
 * Fetches a single product by ID.
 */
export async function getProductByIdFromDb(id: string): Promise<Product | null> {
  const sql = getNeonSql();
  const rows = await sql`
    SELECT *
    FROM products
    WHERE id = ${id}
    LIMIT 1;
  `;
  if (rows.length === 0) return null;
  return rowToProduct(rows[0]);
}

/**
 * Creates a new product in Neon PostgreSQL.
 */
export async function createProductInDb(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const sql = getNeonSql();
  const id = (productData as any).id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const coverImageUrl = productData.coverImageUrl || productData.images?.[0]?.url || '';

  try {
    const rows = await sql`
      INSERT INTO products (
        id, name, description, price, category, cover_image_url, images, videos,
        is_published, is_featured, show_price, discount_active, discount_price, discount_percent,
        discount_start_date, discount_end_date, dimensions, materials, availability, is_archived,
        created_at, updated_at
      ) VALUES (
        ${id},
        ${productData.name},
        ${productData.description || ''},
        ${productData.price || 0},
        ${productData.category || 'Living Room'},
        ${coverImageUrl},
        ${JSON.stringify(productData.images || [])}::jsonb,
        ${JSON.stringify(productData.videos || [])}::jsonb,
        ${productData.isPublished !== false},
        ${Boolean(productData.isFeatured)},
        ${productData.showPrice !== false},
        ${Boolean(productData.discountActive)},
        ${productData.discountPrice ?? null},
        ${productData.discountPercent ?? null},
        ${productData.discountStartDate ? new Date(productData.discountStartDate) : null},
        ${productData.discountEndDate ? new Date(productData.discountEndDate) : null},
        ${productData.dimensions || null},
        ${productData.materials || null},
        ${productData.availability || 'in_stock'},
        ${Boolean(productData.isArchived)},
        ${now},
        ${now}
      )
      RETURNING *;
    `;
    return rowToProduct(rows[0]);
  } catch (err: any) {
    if (String(err?.message || err).includes('does not exist')) {
      await ensureProductsTable();
      return createProductInDb(productData);
    }
    throw err;
  }
}

/**
 * Updates an existing product in Neon PostgreSQL.
 */
export async function updateProductInDb(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const sql = getNeonSql();
  const existing = await getProductByIdFromDb(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name : existing.name;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const price = updates.price !== undefined ? updates.price : existing.price;
  const category = updates.category !== undefined ? updates.category : existing.category;
  const coverImageUrl = updates.coverImageUrl !== undefined ? updates.coverImageUrl : existing.coverImageUrl;
  const images = updates.images !== undefined ? updates.images : existing.images;
  const videos = updates.videos !== undefined ? updates.videos : (existing.videos || []);
  const isPublished = updates.isPublished !== undefined ? updates.isPublished : existing.isPublished;
  const isFeatured = updates.isFeatured !== undefined ? updates.isFeatured : existing.isFeatured;

  const showPrice = updates.showPrice !== undefined ? updates.showPrice : (existing.showPrice ?? true);
  const discountActive = updates.discountActive !== undefined ? updates.discountActive : Boolean(existing.discountActive);
  const discountPrice = updates.discountPrice !== undefined ? updates.discountPrice : (existing.discountPrice ?? null);
  const discountPercent = updates.discountPercent !== undefined ? updates.discountPercent : (existing.discountPercent ?? null);
  const discountStartDate = updates.discountStartDate !== undefined
    ? (updates.discountStartDate ? new Date(updates.discountStartDate) : null)
    : (existing.discountStartDate ? new Date(existing.discountStartDate) : null);
  const discountEndDate = updates.discountEndDate !== undefined
    ? (updates.discountEndDate ? new Date(updates.discountEndDate) : null)
    : (existing.discountEndDate ? new Date(existing.discountEndDate) : null);
  const dimensions = updates.dimensions !== undefined ? updates.dimensions : (existing.dimensions ?? null);
  const materials = updates.materials !== undefined ? updates.materials : (existing.materials ?? null);
  const availability = updates.availability !== undefined ? updates.availability : (existing.availability || 'in_stock');
  const isArchived = updates.isArchived !== undefined ? updates.isArchived : Boolean(existing.isArchived);

  const now = new Date().toISOString();

  const rows = await sql`
    UPDATE products
    SET 
      name = ${name},
      description = ${description},
      price = ${price},
      category = ${category},
      cover_image_url = ${coverImageUrl},
      images = ${JSON.stringify(images)}::jsonb,
      videos = ${JSON.stringify(videos)}::jsonb,
      is_published = ${isPublished},
      is_featured = ${isFeatured},
      show_price = ${showPrice},
      discount_active = ${discountActive},
      discount_price = ${discountPrice},
      discount_percent = ${discountPercent},
      discount_start_date = ${discountStartDate},
      discount_end_date = ${discountEndDate},
      dimensions = ${dimensions},
      materials = ${materials},
      availability = ${availability},
      is_archived = ${isArchived},
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING *;
  `;

  if (rows.length === 0) return null;
  return rowToProduct(rows[0]);
}

/**
 * Deletes a product from Neon PostgreSQL.
 */
export async function deleteProductFromDb(id: string): Promise<boolean> {
  const sql = getNeonSql();
  await sql`DELETE FROM products WHERE id = ${id};`;
  return true;
}

/**
 * Resets the products table with the default catalog.
 */
export async function resetProductsInDb(initialProducts: Product[]): Promise<Product[]> {
  const sql = getNeonSql();
  await ensureProductsTable();
  await sql`TRUNCATE TABLE products;`;
  for (const p of initialProducts) {
    await sql`
      INSERT INTO products (
        id, name, description, price, category, cover_image_url, images, videos,
        is_published, is_featured, show_price, discount_active, discount_price, discount_percent,
        dimensions, materials, availability, is_archived, created_at, updated_at
      ) VALUES (
        ${p.id},
        ${p.name},
        ${p.description},
        ${p.price},
        ${p.category},
        ${p.coverImageUrl || ''},
        ${JSON.stringify(p.images || [])}::jsonb,
        ${JSON.stringify(p.videos || [])}::jsonb,
        ${p.isPublished !== false},
        ${Boolean(p.isFeatured)},
        ${p.showPrice !== false},
        ${Boolean(p.discountActive)},
        ${p.discountPrice ?? null},
        ${p.discountPercent ?? null},
        ${p.dimensions || null},
        ${p.materials || null},
        ${p.availability || 'in_stock'},
        ${Boolean(p.isArchived)},
        ${p.createdAt || new Date().toISOString()},
        ${p.updatedAt || new Date().toISOString()}
      );
    `;
  }
  return getAllProductsFromDb(initialProducts);
}

// ----------------------------------------------------------------------
// CATEGORIES PERSISTENCE
// ----------------------------------------------------------------------

export async function ensureCategoriesTable(): Promise<boolean> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return false;

  try {
    const sql = neon(dbUrl);
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Ensure image_url column exists if table was created previously
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;`;

    const countRes = await sql`SELECT COUNT(*)::int as total FROM categories;`;
    if ((countRes[0]?.total || 0) === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await sql`
          INSERT INTO categories (id, name_ar, name_en, display_order, is_hidden, description, image_url)
          VALUES (${cat.id}, ${cat.nameAr}, ${cat.nameEn}, ${cat.order}, ${cat.isHidden}, ${cat.description || ''}, ${cat.imageUrl || null})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
    return true;
  } catch (err: any) {
    console.warn('ensureCategoriesTable error:', err?.message || err);
    return false;
  }
}

export async function getAllCategoriesFromDb(includeHidden = false): Promise<CategoryRecord[]> {
  await ensureCategoriesTable();
  const sql = getNeonSql();

  const query = includeHidden
    ? sql`
        SELECT c.*, COALESCE(p.p_count, 0)::int as product_count
        FROM categories c
        LEFT JOIN (
          SELECT category, COUNT(*)::int as p_count FROM products GROUP BY category
        ) p ON c.id = p.category
        ORDER BY c.display_order ASC, c.created_at ASC;
      `
    : sql`
        SELECT c.*, COALESCE(p.p_count, 0)::int as product_count
        FROM categories c
        LEFT JOIN (
          SELECT category, COUNT(*)::int as p_count FROM products GROUP BY category
        ) p ON c.id = p.category
        WHERE c.is_hidden IS NOT TRUE
        ORDER BY c.display_order ASC, c.created_at ASC;
      `;

  const rows = await query;
  return rows.map((r: any) => ({
    id: String(r.id),
    nameAr: String(r.name_ar),
    nameEn: String(r.name_en),
    order: Number(r.display_order) || 0,
    isHidden: Boolean(r.is_hidden),
    description: r.description || undefined,
    imageUrl: r.image_url || undefined,
    productCount: Number(r.product_count) || 0,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  }));
}

export async function countProductsInCategoryInDb(categoryId: string): Promise<number> {
  const sql = getNeonSql();
  const res = await sql`
    SELECT COUNT(*)::int as total
    FROM products
    WHERE category = ${categoryId};
  `;
  return res[0]?.total || 0;
}

export async function createCategoryInDb(cat: CategoryRecord): Promise<CategoryRecord> {
  await ensureCategoriesTable();
  const sql = getNeonSql();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO categories (id, name_ar, name_en, display_order, is_hidden, description, image_url, created_at, updated_at)
    VALUES (${cat.id}, ${cat.nameAr}, ${cat.nameEn}, ${cat.order || 0}, ${Boolean(cat.isHidden)}, ${cat.description || ''}, ${cat.imageUrl || null}, ${now}, ${now})
    ON CONFLICT (id) DO UPDATE SET
      name_ar = EXCLUDED.name_ar,
      name_en = EXCLUDED.name_en,
      display_order = EXCLUDED.display_order,
      is_hidden = EXCLUDED.is_hidden,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      updated_at = NOW();
  `;
  return { ...cat, updatedAt: now };
}

export async function updateCategoryInDb(id: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
  await ensureCategoriesTable();
  const sql = getNeonSql();
  const existing = await sql`SELECT * FROM categories WHERE id = ${id} LIMIT 1;`;
  if (existing.length === 0) return null;

  const current = existing[0];
  const nameAr = updates.nameAr !== undefined ? updates.nameAr : current.name_ar;
  const nameEn = updates.nameEn !== undefined ? updates.nameEn : current.name_en;
  const order = updates.order !== undefined ? updates.order : current.display_order;
  const isHidden = updates.isHidden !== undefined ? updates.isHidden : current.is_hidden;
  const description = updates.description !== undefined ? updates.description : current.description;
  const imageUrl = updates.imageUrl !== undefined ? (updates.imageUrl || null) : current.image_url;
  const now = new Date().toISOString();

  await sql`
    UPDATE categories
    SET name_ar = ${nameAr}, name_en = ${nameEn}, display_order = ${order}, is_hidden = ${isHidden}, description = ${description}, image_url = ${imageUrl}, updated_at = ${now}
    WHERE id = ${id};
  `;

  return {
    id,
    nameAr,
    nameEn,
    order,
    isHidden,
    description,
    imageUrl: imageUrl || undefined,
    updatedAt: now,
  };
}

export async function deleteCategoryFromDb(id: string): Promise<boolean> {
  const sql = getNeonSql();
  await sql`DELETE FROM categories WHERE id = ${id};`;
  return true;
}

// ----------------------------------------------------------------------
// STORE SETTINGS PERSISTENCE (Header Image, Titles, CTA)
// ----------------------------------------------------------------------

export async function ensureSettingsTable(): Promise<boolean> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return false;

  try {
    const sql = neon(dbUrl);
    await sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        id VARCHAR(50) PRIMARY KEY,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const countRes = await sql`SELECT COUNT(*)::int as total FROM store_settings WHERE id = 'main';`;
    if ((countRes[0]?.total || 0) === 0) {
      await sql`
        INSERT INTO store_settings (id, settings, updated_at)
        VALUES ('main', ${JSON.stringify(DEFAULT_STORE_SETTINGS)}::jsonb, NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    return true;
  } catch (err: any) {
    console.warn('ensureSettingsTable error:', err?.message || err);
    return false;
  }
}

export async function getStoreSettingsFromDb(): Promise<StoreSettingsRecord> {
  await ensureSettingsTable();
  const sql = getNeonSql();
  try {
    const rows = await sql`SELECT settings, updated_at FROM store_settings WHERE id = 'main' LIMIT 1;`;
    if (rows.length > 0 && rows[0].settings) {
      const raw = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
      return {
        ...DEFAULT_STORE_SETTINGS,
        ...raw,
        updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.warn('getStoreSettingsFromDb error:', err);
  }
  return DEFAULT_STORE_SETTINGS;
}

export async function updateStoreSettingsInDb(updates: Partial<StoreSettingsRecord>): Promise<StoreSettingsRecord> {
  await ensureSettingsTable();
  const sql = getNeonSql();
  const current = await getStoreSettingsFromDb();
  const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };

  await sql`
    INSERT INTO store_settings (id, settings, updated_at)
    VALUES ('main', ${JSON.stringify(merged)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET
      settings = EXCLUDED.settings,
      updated_at = NOW();
  `;

  return merged;
}

// ----------------------------------------------------------------------
// TRUST STANDARDS & MATERIALS SECTION PERSISTENCE
// ----------------------------------------------------------------------

export interface TrustStandardPointRecord {
  id: string;
  title: string;
  description?: string;
  badge?: string;
}

export interface TrustStandardItemRecord {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  quote?: string;
  points?: TrustStandardPointRecord[];
  linkedProductIds?: string[];
  order: number;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrustStandardsRecord {
  enabled: boolean;
  badgeText?: string;
  title: string;
  description?: string;
  items: TrustStandardItemRecord[];
  updatedAt?: string;
}

export const DEFAULT_TRUST_STANDARDS: TrustStandardsRecord = {
  enabled: true,
  badgeText: 'معايير الثقة · الجودة والحرفية',
  title: 'معايير الجودة والخامات في أثاث الثقة',
  description: 'نلتزم باختيار خامات متينة وعناية دقيقة بكل تفصيلة في التصنيع والتنجيد لتقديم أثاث راقٍ يلائم ذوقكم ويدوم في منازلكم.',
  items: [
    {
      id: 'craftsmanship',
      title: 'الهيكل والنجارة المتقنة',
      subtitle: 'صلابة الهيكل واستقرار القطعة',
      description: 'عناية فائقة بتماسك الهياكل وجودة الوصلات المعمارية لضمان ثبات القطعة وتحملها للاستخدام اليومي المستمر.',
      image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1200&auto=format&fit=crop&q=80',
      points: [
        {
          id: 'p1',
          title: 'هيكل صلب ومتوازن',
          description: 'تصميم يوزع الأحمال بالتساوي ويوفر ثباتاً فائقاً لكافة قطع الأثاث.',
          badge: 'ثبات هيكلي',
        },
        {
          id: 'p2',
          title: 'تشطيب ناعم ودقيق',
          description: 'معالجة سطحية متأنية تبرز جمال ملمس الخامات الطبيعية.',
          badge: 'عناية بالتشطيب',
        },
      ],
      order: 1,
      isHidden: false,
    },
    {
      id: 'comfort-fabrics',
      title: 'أقمشة التنجيد والراحة اليومية',
      subtitle: 'اختيار الأنسجة وحشوات الجلوس',
      description: 'انتقاء أقمشة متناسقة الألوان ومريحة للملمس مع حشوات إسفنجية متوازنة تمنحك استرخاءً دائماً دون هبوط.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
      points: [
        {
          id: 'p3',
          title: 'أنسجة مختارة بعناية',
          description: 'خامات ملائمة لأجواء المعيشة وسهلة العناية اليومية.',
          badge: 'ملمس مريح',
        },
        {
          id: 'p4',
          title: 'حشوات جلوس مريحة',
          description: 'توزيع مدروس لمرونة الجلسة يوفر دعماً صحياً للظهر والقامة.',
          badge: 'دعم وراحة',
        },
      ],
      order: 2,
      isHidden: false,
    },
    {
      id: 'service-delivery',
      title: 'المعاينة والخدمة المباشرة',
      subtitle: 'زيارة المعارض وتوصيل آمن',
      description: 'نرحب بكم لمعاينة الأثاث ولمس الخامات بأنفسكم في معارضنا، مع توفير خدمات شحن وتوصيل لكافة الولايات.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
      points: [
        {
          id: 'p5',
          title: 'معاينة واقعية بالمعارض',
          description: 'استكشف التشكيلة واختبر الراحة شخصياً في صالات عرضنا بالجزائر والبليدة وسطيف.',
          badge: 'معارض مفتوحة',
        },
        {
          id: 'p6',
          title: 'توصيل منظم',
          description: 'تغليف آمن وتسليم موثوق لكل ولايات الوطن.',
          badge: 'توصيل شامل',
        },
      ],
      order: 3,
      isHidden: false,
    },
  ],
};

export async function getTrustStandardsFromDb(): Promise<TrustStandardsRecord> {
  await ensureSettingsTable();
  const sql = getNeonSql();
  try {
    const rows = await sql`SELECT settings, updated_at FROM store_settings WHERE id = 'trust_standards' LIMIT 1;`;
    if (rows.length > 0 && rows[0].settings) {
      const raw = typeof rows[0].settings === 'string' ? JSON.parse(rows[0].settings) : rows[0].settings;
      return {
        ...DEFAULT_TRUST_STANDARDS,
        ...raw,
        updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.warn('getTrustStandardsFromDb error:', err);
  }
  return DEFAULT_TRUST_STANDARDS;
}

export async function updateTrustStandardsInDb(standards: TrustStandardsRecord): Promise<TrustStandardsRecord> {
  await ensureSettingsTable();
  const sql = getNeonSql();
  const now = new Date().toISOString();
  const payload = { ...standards, updatedAt: now };

  await sql`
    INSERT INTO store_settings (id, settings, updated_at)
    VALUES ('trust_standards', ${JSON.stringify(payload)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET
      settings = EXCLUDED.settings,
      updated_at = NOW();
  `;

  return payload;
}

/**
 * Checks the status and health of the database connection.
 */
export async function checkNeonHealth(): Promise<{
  connected: boolean;
  provider: string;
  count: number;
  message: string;
  error?: string;
}> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return {
      connected: false,
      provider: 'Neon (PostgreSQL)',
      count: 0,
      message: 'DATABASE_URL is not configured. Falling back to local storage.',
    };
  }

  try {
    const sql = neon(dbUrl);
    await ensureProductsTable();
    const result = await sql`SELECT COUNT(*)::int as total FROM products;`;
    const count = result[0]?.total || 0;
    return {
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      count,
      message: `قاعدة بيانات المتجر متصلة بنجاح (${count} منتج).`,
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'Neon (PostgreSQL)',
      count: 0,
      message: 'الاتصال بقاعدة البيانات غير متاح.',
      error: err?.message || String(err),
    };
  }
}
