/**
 * Renders the app icons (favicon, PWA icons, apple-touch-icon) from the crest.
 *   pnpm tsx --tsconfig tsconfig.sim.json scripts/make-icons.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

function crest(bg: boolean, pad = 0): string {
  let petals = '';
  for (let i = 0; i < 12; i++) {
    petals += `<ellipse cx="50" cy="${24 + pad * 0}" rx="8" ry="20" fill="#f19ab2" stroke="#1d1712" stroke-width="1.6" transform="rotate(${i * 30} 50 50)"/>`;
  }
  const s = 1 - pad;
  const inner = `<g transform="translate(${50 - 50 * s} ${50 - 50 * s}) scale(${s})">${petals}<circle cx="50" cy="50" r="12" fill="#f6d27a" stroke="#1d1712" stroke-width="2"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${
    bg
      ? '<rect width="100" height="100" rx="0" fill="#2a1216"/><circle cx="50" cy="50" r="46" fill="#3a1820"/>'
      : ''
  }${inner}</svg>`;
}

writeFileSync(resolve('public/favicon.svg'), crest(false));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage();
for (const [name, size, pad] of [
  ['icon-192.png', 192, 0.1],
  ['icon-512.png', 512, 0.1],
  ['icon-512-maskable.png', 512, 0.3],
  ['apple-touch-icon.png', 180, 0.12],
] as const) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${crest(true, pad).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: resolve('public', name), omitBackground: false });
  console.log('wrote', name);
}
await browser.close();
