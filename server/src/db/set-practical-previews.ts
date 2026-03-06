/**
 * One-time script: set generated preview images for first 3 practical materials.
 * Run: npx tsx src/db/set-practical-previews.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

import { db } from './index.js';
import { practicalMaterials } from './schema.js';
import { asc, eq } from 'drizzle-orm';

const PREVIEW_URLS = [
  '/uploads/previews/practical-1.webp',
  '/uploads/previews/practical-2.webp',
  '/uploads/previews/practical-3.webp',
];

async function main() {
  const rows = await db
    .select()
    .from(practicalMaterials)
    .orderBy(asc(practicalMaterials.sortOrder))
    .limit(3);
  for (let i = 0; i < rows.length && i < PREVIEW_URLS.length; i++) {
    await db
      .update(practicalMaterials)
      .set({ previewUrl: PREVIEW_URLS[i] })
      .where(eq(practicalMaterials.id, rows[i].id));
  }
  console.log(`Updated ${Math.min(rows.length, PREVIEW_URLS.length)} practical materials with preview images.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
