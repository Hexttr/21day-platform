/**
 * Copy lesson preview images from assets to uploads/previews.
 * Source: ASSETS_DIR (default: ../../assets or Cursor assets).
 * Run: npx tsx scripts/copy-lesson-previews.ts
 */
import { readdir, copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEWS_DIR = join(__dirname, '..', 'uploads', 'previews');

// Cursor stores generated images here; fallback to project assets
const CURSOR_ASSETS = join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.cursor', 'projects', 'c-projects-21day-platform', 'assets'
);
const PROJECT_ASSETS = join(__dirname, '..', '..', 'assets');

async function main() {
  let assetsDir = PROJECT_ASSETS;
  try {
    const proj = await readdir(PROJECT_ASSETS);
    if (proj.some(f => f.startsWith('lesson') && f.endsWith('.png'))) {
      assetsDir = PROJECT_ASSETS;
    }
  } catch {
    // try Cursor path on Windows
    const cursorPath = process.platform === 'win32'
      ? join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-projects-21day-platform', 'assets')
      : CURSOR_ASSETS;
    try {
      await readdir(cursorPath);
      assetsDir = cursorPath;
    } catch {
      console.error('No assets folder found. Place lesson*.png in server/uploads/previews/ or project assets/');
      process.exit(1);
    }
  }

  await mkdir(PREVIEWS_DIR, { recursive: true });
  const files = await readdir(assetsDir);
  const lessonPngs = files.filter(f => /^lesson\d+-v\d+/.test(f) && f.endsWith('.png'));

  for (const file of lessonPngs) {
    const src = join(assetsDir, file);
    const dest = join(PREVIEWS_DIR, file);
    await copyFile(src, dest);
    console.log(`Copied: ${file}`);
  }
  console.log(`Done. Copied ${lessonPngs.length} files to ${PREVIEWS_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
