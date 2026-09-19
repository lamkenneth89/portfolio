/**
 * The original portfolio shipped its thumbnails as ~2600px JPEGs — 16 MB of
 * images for a page that never displays one wider than 700px. This generates
 * WebP derivatives at the two widths the layout actually uses.
 *
 * Originals live in source-images/ — deliberately outside public/, so the
 * multi-megabyte JPEGs are never copied into the deploy. Only the derivatives
 * under public/images/opt/ ship, and they are regenerated only when the source
 * is newer. Run via `npm run prebuild`.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIRS = ['source-images/images/thumbs', 'source-images/images/fulls'];
// The portrait sits at the images root next to a pile of unused originals,
// so it is listed explicitly rather than sweeping that folder.
const SOURCE_FILES = [
  ['source-images/images/avatar.jpg', 'root'],
  // The old site's sidebar backdrop (Mt Fuji), reused behind the profile card.
  // The bottom 8% holds a lens-flare dot that shows through on short cards.
  ['source-images/images/bg.jpg', 'root', { cropBottom: 0.08 }],
];
const OUT_ROOT = path.join(ROOT, 'public/images/opt');
export const WIDTHS = [800, 1600];

async function isStale(source, target) {
  if (!existsSync(target)) return true;
  const [s, t] = await Promise.all([stat(source), stat(target)]);
  return s.mtimeMs > t.mtimeMs;
}

let generated = 0;
let skipped = 0;

for (const dir of SOURCE_DIRS) {
  const absolute = path.join(ROOT, dir);
  if (!existsSync(absolute)) continue;

  const outDir = path.join(OUT_ROOT, path.basename(dir));
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(absolute)).filter((f) =>
    /\.(jpe?g|png)$/i.test(f),
  );

  for (const file of files) {
    const source = path.join(absolute, file);
    const base = file.replace(/\.[^.]+$/, '');

    for (const width of WIDTHS) {
      const target = path.join(outDir, `${base}-${width}.webp`);
      if (!(await isStale(source, target))) {
        skipped += 1;
        continue;
      }
      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(target);
      generated += 1;
    }
  }
}

for (const [relative, bucket, options = {}] of SOURCE_FILES) {
  const source = path.join(ROOT, relative);
  if (!existsSync(source)) continue;

  const outDir = path.join(OUT_ROOT, bucket);
  await mkdir(outDir, { recursive: true });
  const base = path.basename(relative).replace(/\.[^.]+$/, '');

  for (const width of WIDTHS) {
    const target = path.join(outDir, `${base}-${width}.webp`);
    if (!(await isStale(source, target))) {
      skipped += 1;
      continue;
    }
    let pipeline = sharp(source);
    if (options.cropBottom) {
      const { width: w, height: h } = await sharp(source).metadata();
      pipeline = pipeline.extract({
        left: 0,
        top: 0,
        width: w,
        height: Math.round(h * (1 - options.cropBottom)),
      });
    }
    await pipeline
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(target);
    generated += 1;
  }
}

console.log(
  `[images] ${generated} derivative(s) written, ${skipped} already current`,
);
