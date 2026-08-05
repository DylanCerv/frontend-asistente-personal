/**
 * Regenerates launcher / adaptive / splash icons from assets/images/kivo-logo.svg
 * Usage: node scripts/render-app-icon.js
 * Requires: sharp (npm i -D sharp)
 */
const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Missing sharp. Run: npm i -D sharp');
    process.exit(1);
  }

  const OUT = path.join(__dirname, '..', 'assets', 'images');
  const logoInner = fs
    .readFileSync(path.join(OUT, 'kivo-logo.svg'), 'utf8')
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');

  function build({ size, pad, bg, mono = false }) {
    const inset = Math.round(size * pad);
    const box = size - inset * 2;
    const body = mono
      ? logoInner.replace(/#6864EC/g, '#FFFFFF').replace(/#5C57CE/g, '#FFFFFF')
      : logoInner;
    const bgRect = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <svg x="${inset}" y="${inset}" width="${box}" height="${box}" viewBox="40 60 360 380" preserveAspectRatio="xMidYMid meet">
    ${body}
  </svg>
</svg>`;
  }

  async function write(file, svg, size) {
    await sharp(Buffer.from(svg), { density: 96 }).resize(size, size).png().toFile(path.join(OUT, file));
    console.log('wrote', file);
  }

  await write('icon.png', build({ size: 1024, pad: 0.14, bg: '#050505' }), 1024);
  await write('android-icon-foreground.png', build({ size: 1024, pad: 0.22, bg: null }), 1024);
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: '#050505' },
  })
    .png()
    .toFile(path.join(OUT, 'android-icon-background.png'));
  console.log('wrote android-icon-background.png');
  await write(
    'android-icon-monochrome.png',
    build({ size: 1024, pad: 0.22, bg: null, mono: true }),
    1024,
  );
  await write('favicon.png', build({ size: 48, pad: 0.1, bg: '#050505' }), 48);
  await write('splash-icon.png', build({ size: 512, pad: 0.08, bg: null }), 512);
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
