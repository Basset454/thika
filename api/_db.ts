import { neon } from '@neondatabase/serverless';
import { Product, ProductImage } from './products.js';

/**
 * Resolves the active Neon PostgreSQL connection URL.
 * Automatically checks DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL,
 * POSTGRES_URL_NON_POOLING, NEON_DATABASE_URL,
 * and recovers any Postgres connection string mistakenly placed in BLOB_READ_WRITE_TOKEN.
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
      // Migrate to DATABASE_URL and clear from BLOB_READ_WRITE_TOKEN
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

  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: String(row.description || ''),
    price: Number(row.price) || 0,
    category: String(row.category || 'Living Room'),
    coverImageUrl: String(row.cover_image_url || (images[0]?.url ?? '')),
    images,
    isPublished: row.is_published ?? true,
    isFeatured: row.is_featured ?? false,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

let isInitialized = false;

/**
 * Ensures the products table exists in Neon PostgreSQL, seeding initial catalog if empty.
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
        is_published BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    if (initialProducts && initialProducts.length > 0) {
      const countResult = await sql`SELECT COUNT(*)::int as total FROM products;`;
      const count = countResult[0]?.total || 0;
      if (count === 0) {
        console.log(`Seeding ${initialProducts.length} initial products into Neon PostgreSQL...`);
        for (const p of initialProducts) {
          await sql`
            INSERT INTO products (
              id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
            ) VALUES (
              ${p.id},
              ${p.name},
              ${p.description},
              ${p.price},
              ${p.category},
              ${p.coverImageUrl || ''},
              ${JSON.stringify(p.images || [])}::jsonb,
              ${p.isPublished !== false},
              ${Boolean(p.isFeatured)},
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
 * Fetches all products from Neon PostgreSQL with auto-table-creation resilience.
 */
export async function getAllProductsFromDb(initialFallbackProducts?: Product[]): Promise<Product[]> {
  if (!isInitialized && initialFallbackProducts) {
    await ensureProductsTable(initialFallbackProducts);
  }
  const sql = getNeonSql();
  try {
    const rows = await sql`
      SELECT id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
      FROM products
      ORDER BY created_at DESC;
    `;
    return rows.map(rowToProduct);
  } catch (err: any) {
    if (String(err?.message || err).includes('does not exist') && initialFallbackProducts) {
      await ensureProductsTable(initialFallbackProducts);
      const rows = await sql`
        SELECT id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
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
    SELECT id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
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
        id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
      ) VALUES (
        ${id},
        ${productData.name},
        ${productData.description || ''},
        ${productData.price || 0},
        ${productData.category || 'Living Room'},
        ${coverImageUrl},
        ${JSON.stringify(productData.images || [])}::jsonb,
        ${productData.isPublished !== false},
        ${Boolean(productData.isFeatured)},
        ${now},
        ${now}
      )
      RETURNING id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at;
    `;
    return rowToProduct(rows[0]);
  } catch (err: any) {
    if (String(err?.message || err).includes('does not exist')) {
      await ensureProductsTable();
      const rows = await sql`
        INSERT INTO products (
          id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
        ) VALUES (
          ${id},
          ${productData.name},
          ${productData.description || ''},
          ${productData.price || 0},
          ${productData.category || 'Living Room'},
          ${coverImageUrl},
          ${JSON.stringify(productData.images || [])}::jsonb,
          ${productData.isPublished !== false},
          ${Boolean(productData.isFeatured)},
          ${now},
          ${now}
        )
        RETURNING id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at;
      `;
      return rowToProduct(rows[0]);
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
  const isPublished = updates.isPublished !== undefined ? updates.isPublished : existing.isPublished;
  const isFeatured = updates.isFeatured !== undefined ? updates.isFeatured : existing.isFeatured;
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
      is_published = ${isPublished},
      is_featured = ${isFeatured},
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at;
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
        id, name, description, price, category, cover_image_url, images, is_published, is_featured, created_at, updated_at
      ) VALUES (
        ${p.id},
        ${p.name},
        ${p.description},
        ${p.price},
        ${p.category},
        ${p.coverImageUrl || ''},
        ${JSON.stringify(p.images || [])}::jsonb,
        ${p.isPublished !== false},
        ${Boolean(p.isFeatured)},
        ${p.createdAt || new Date().toISOString()},
        ${p.updatedAt || new Date().toISOString()}
      );
    `;
  }
  return getAllProductsFromDb(initialProducts);
}

/**
 * Checks the status and health of the Neon database connection.
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
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL DEFAULT 'Living Room',
        cover_image_url TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_published BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    const result = await sql`SELECT COUNT(*)::int as total FROM products;`;
    const count = result[0]?.total || 0;
    return {
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      count,
      message: `Connected successfully to Neon database (${count} products).`,
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'Neon (PostgreSQL)',
      count: 0,
      message: 'Connection to Neon database failed.',
      error: err?.message || String(err),
    };
  }
}
