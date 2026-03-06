/**
 * One-time script: set generated preview images for lesson 1 videos.
 * Run: npx tsx src/db/set-lesson1-previews.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

import { db } from './index.js';
import { lessonContent } from './schema.js';
import { eq } from 'drizzle-orm';

const PREVIEW_URLS = [
  '/uploads/previews/lesson-1-v0-preview-1.png',
  '/uploads/previews/lesson-1-v1-preview-2.png',
  '/uploads/previews/lesson-1-v2-preview-3.png',
  '/uploads/previews/lesson-1-v3-preview-4.png',
  '/uploads/previews/lesson-1-v4-preview-5.png',
  '/uploads/previews/lesson-1-v5-preview-6.png',
];

async function main() {
  const [existing] = await db.select().from(lessonContent).where(eq(lessonContent.lessonId, 1));
  if (!existing) {
    console.log('Lesson 1 content not found. Run db:seed first.');
    process.exit(1);
  }
  await db
    .update(lessonContent)
    .set({ videoPreviewUrls: PREVIEW_URLS })
    .where(eq(lessonContent.lessonId, 1));
  console.log('Updated lesson 1 with 6 preview images.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
