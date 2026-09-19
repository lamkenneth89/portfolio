/**
 * Builds the 1200×630 social share card: the Mt Fuji intro photo, the
 * portrait, and the name. Run by hand (`npm run og`) whenever the portrait,
 * photo or wording changes; the output is committed.
 *
 * It is deliberately not part of the CI build: text is rendered with fonts
 * from this machine, and a Linux runner would substitute different ones.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'source-images/images');
const OUT = path.join(ROOT, 'public/og/kenneth-lam.jpg');
const FONTS = 'C:/Windows/Fonts';

const W = 1200;
const H = 630;
const CREAM = '#fdfaf5';
const INK = '#3d3530';
const MUTED = '#65594f';
const ACCENT = '#1f6e57';

// Background: the wide Fuji shot, lens flare cropped, summit kept in frame.
const photo = sharp(path.join(SRC, 'P_20241122_124301.jpg'));
const { width: pw, height: ph } = await photo.metadata();
const background = await photo
  .extract({ left: 0, top: 0, width: pw, height: Math.round(ph * 0.93) })
  .resize(W, H, { fit: 'cover', position: 'bottom' })
  .toBuffer();

// Same veil as the site: cream where the text sits, thin over the photo.
const veil = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="v" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${CREAM}" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="${CREAM}" stop-opacity="0.88"/>
      <stop offset="0.72" stop-color="${CREAM}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${CREAM}" stop-opacity="0.08"/>
    </linearGradient>
    <radialGradient id="g" cx="0" cy="0" r="0.7">
      <stop offset="0" stop-color="#f4b680" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#f4b680" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#49bf9d"/>
</svg>`);

// Portrait in a teal-to-apricot ring, as on the site.
const D = 300;
const RING = 10;
const ringSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}">
  <defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#49bf9d"/><stop offset="1" stop-color="#f4b680"/>
  </linearGradient></defs>
  <circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="url(#r)"/>
  <circle cx="${D / 2}" cy="${D / 2}" r="${D / 2 - RING + 2}" fill="#ffffff"/>
</svg>`);
const inner = D - RING * 2 - 8;
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}"><circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2}"/></svg>`,
);
const face = await sharp(path.join(SRC, 'avatar.jpg'))
  .resize(inner, inner)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();
const portrait = await sharp(ringSvg)
  .composite([{ input: face, left: RING + 4, top: RING + 4 }])
  .png()
  .toBuffer();

const text = (markup, fontfile, width) =>
  sharp({ text: { text: markup, fontfile, width, rgba: true, dpi: 72 } })
    .png()
    .toBuffer();

const name = await text(
  `<span foreground="${INK}" font="Georgia 84">Kenneth Lam</span>`,
  `${FONTS}/georgia.ttf`,
  700,
);
const role = await text(
  `<span foreground="${ACCENT}" font="Segoe UI Semibold 34">Analytics · CRM · AI-assisted engineering</span>`,
  `${FONTS}/seguisb.ttf`,
  700,
);
const blurb = await text(
  `<span foreground="${MUTED}" font="Segoe UI 27">Case studies, live demos and the software I build\nwith AI — Hong Kong.</span>`,
  `${FONTS}/segoeui.ttf`,
  660,
);
const site = await text(
  `<span foreground="${MUTED}" font="Segoe UI Semibold 22">lamkenneth89.github.io/portfolio</span>`,
  `${FONTS}/seguisb.ttf`,
  600,
);

await mkdir(path.dirname(OUT), { recursive: true });
await sharp(background)
  .composite([
    { input: veil, left: 0, top: 0 },
    { input: portrait, left: W - D - 90, top: Math.round((H - D) / 2) - 5 },
    { input: name, left: 80, top: 150 },
    { input: role, left: 84, top: 262 },
    { input: blurb, left: 84, top: 330 },
    { input: site, left: 84, top: 520 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT);

console.log('[og] wrote', path.relative(ROOT, OUT));

// Home-screen / bookmark icon: the portrait on its own.
const TOUCH = path.join(ROOT, 'public/apple-touch-icon.png');
await sharp(path.join(SRC, 'avatar.jpg')).resize(180, 180).png().toFile(TOUCH);
console.log('[og] wrote', path.relative(ROOT, TOUCH));
