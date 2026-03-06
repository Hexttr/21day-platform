/**
 * Optimize preview images: resize, convert to WebP, update DB.
 * Run: npx tsx scripts/optimize-previews.ts
 */
import { readdir, readFile, unlink } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { config } from 'dotenv';
import { resolve } from 'path';
import { db } from '../src/db/index.js';
import { lessonContent, practicalMaterials } from '../src/db/schema.js';
import { eq, asc } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const PREVIEWS_DIR = join(__dirname, '..', 'uploads', 'previews');
const MAX_WIDTH = 800;
const WEBP_QUALITY = 82;

async function optimize() {
  const files = await readdir(PREVIEWS_DIR);
  const images = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  for (const file of images) {
    const inputPath = join(PREVIEWS_DIR, file);
    const base = file.replace(/\.(png|jpe?g)$/i, '');
    const outputPath = join(PREVIEWS_DIR, `${base}.webp`);

    try {
      const inputBuffer = await readFile(inputPath);
      const { width } = await sharp(inputBuffer).metadata();
      let pipeline = sharp(inputBuffer);

      if (width && width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
      }

      await pipeline
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputPath);

      await unlink(inputPath);
      console.log(`Optimized: ${file} -> ${base}.webp`);
    } catch (e) {
      console.error(`Failed ${file}:`, e);
    }
  }

  // Update lesson preview URLs from WebP files
  const webpFiles = (await readdir(PREVIEWS_DIR)).filter(f => f.endsWith('.webp'));
  const lessonPreviewsMap = new Map<number, string[]>();

  for (const file of webpFiles) {
    const m = file.match(/^lesson-?(\d+)-v(\d+)/);
    if (m) {
      const lessonId = parseInt(m[1], 10);
      const idx = parseInt(m[2], 10);
      const url = `/uploads/previews/${file}`;
      if (!lessonPreviewsMap.has(lessonId)) lessonPreviewsMap.set(lessonId, []);
      const arr = lessonPreviewsMap.get(lessonId)!;
      arr[idx] = url;
    }
  }

  for (const [lessonId, urls] of lessonPreviewsMap) {
    const sorted = urls.filter(Boolean);
    if (sorted.length === 0) continue;
    const [lc] = await db.select().from(lessonContent).where(eq(lessonContent.lessonId, lessonId));
    if (lc) {
      await db.update(lessonContent).set({ videoPreviewUrls: sorted }).where(eq(lessonContent.lessonId, lessonId));
      console.log(`Updated lesson ${lessonId} with ${sorted.length} preview URLs`);
    }
  }

  // Update practical materials preview URLs
  const materials = await db.select().from(practicalMaterials).orderBy(asc(practicalMaterials.sortOrder)).limit(3);
  const practicalPreviews = ['/uploads/previews/practical-1.webp', '/uploads/previews/practical-2.webp', '/uploads/previews/practical-3.webp'];
  for (let i = 0; i < materials.length && i < practicalPreviews.length; i++) {
    await db.update(practicalMaterials).set({ previewUrl: practicalPreviews[i] }).where(eq(practicalMaterials.id, materials[i].id));
  }
  console.log(`Updated ${materials.length} practical material preview URLs`);

  console.log('Done.');
}

optimize()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
