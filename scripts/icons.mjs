import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'assets', 'icon.png');
const OUT = path.join(ROOT, 'public', 'icons');
const BG = '#05070A';

await fs.mkdir(OUT, { recursive: true });

const icon = sharp(SRC).resize(1024, 1024, { fit: 'cover' });

await icon.clone().resize(192, 192).png().toFile(path.join(OUT, 'icon-192.png'));
await icon.clone().resize(512, 512).png().toFile(path.join(OUT, 'icon-512.png'));
await icon.clone().resize(1024, 1024).png().toFile(path.join(OUT, 'icon-1024.png'));
await icon.clone().resize(256, 256).png().toFile(path.join(OUT, 'logo-256.png'));
await icon.clone().resize(32, 32).png().toFile(path.join(OUT, 'favicon-32.png'));
await icon.clone().resize(16, 16).png().toFile(path.join(OUT, 'favicon-16.png'));

// Apple touch icon: opaque background, no transparency.
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: await icon.clone().resize(150, 150).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(path.join(OUT, 'apple-touch-icon.png'));

// Maskable icon: artwork inside the 80% safe zone.
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: await icon.clone().resize(400, 400).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(path.join(OUT, 'maskable-512.png'));

// Social share image.
const ogSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="18%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#0B2A33"/>
      <stop offset="55%" stop-color="#071018"/>
      <stop offset="100%" stop-color="#05070A"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1080" cy="90" r="220" fill="#00F0FF" opacity="0.08"/>
  <circle cx="120" cy="620" r="260" fill="#FFD700" opacity="0.05"/>
  <text x="330" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="74" font-weight="700" fill="#FFFFFF">Adventist Tamil Tool</text>
  <text x="332" y="355" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#00F0FF">Songs · Home · Books</text>
  <text x="332" y="410" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#8E94A3">Tamil Christian songs, Sabbath School &amp; EGW books — offline</text>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .composite([
    { input: await icon.clone().resize(210, 210).png().toBuffer(), left: 70, top: 210 },
  ])
  .png()
  .toFile(path.join(OUT, 'og-image.png'));

console.log('[icons] generated PWA + social icons');
