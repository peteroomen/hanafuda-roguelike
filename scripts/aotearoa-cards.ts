/**
 * Converts the Aotearoa deck's SVG sources (art-source/cards/aotearoa, 1024×1536) into the
 * game's card faces: public/cards/aotearoa/{0..47}.webp at 320×525, the same shape as the
 * traditional faces.
 *
 * The sources are 2:3 and the game's cards are narrower, so each face is scaled to the card's
 * height, cropped evenly at the sides inside the printed border, and the dark border is drawn
 * again around the edge. Nothing is squashed.
 *
 *   pnpm tsx scripts/aotearoa-cards.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

/** Source file for each card, in land order: month by month, specials first, then the chaff. */
export const AOTEAROA_FILES = [
  '01-jan-kotuku',
  '01-jan-pohutukawa-ribbon',
  '01-jan-cliff',
  '01-jan-crimson-fall',
  '02-feb-korimako',
  '02-feb-manuka-ribbon',
  '02-feb-manuka-blossom',
  '02-feb-manuka-ridge',
  '03-mar-moon',
  '03-mar-kuaka',
  '03-mar-toetoe-clump',
  '03-mar-toetoe-hill',
  '04-apr-kete',
  '04-apr-karaka-ribbon',
  '04-apr-karaka-berries',
  '04-apr-karaka-shore',
  '05-may-ruru',
  '05-may-kahikatea-ribbon',
  '05-may-kahikatea-fruit',
  '05-may-swamp',
  '06-jun-matariki',
  '06-jun-puriri-berries',
  '06-jun-puriri-fallen',
  '06-jun-puriri-mist',
  '07-jul-kea',
  '07-jul-beech-ribbon',
  '07-jul-beech-tiers',
  '07-jul-snow-peak',
  '08-aug-ua',
  '08-aug-piwakawaka',
  '08-aug-kotukutuku-ribbon',
  '08-aug-storm',
  '09-sep-kowhai-bloom',
  '09-sep-kowhai-ribbon',
  '09-sep-kowhai-bare',
  '09-sep-kowhai-spray',
  '10-oct-kiwi',
  '10-oct-mamaku-ribbon',
  '10-oct-mamaku-crown',
  '10-oct-mamaku-fronds',
  '11-nov-weta',
  '11-nov-tikouka-ribbon',
  '11-nov-tikouka-flower',
  '11-nov-tikouka-trees',
  '12-dec-tui',
  '12-dec-harakeke-ribbon',
  '12-dec-korari',
  '12-dec-seed-pods',
] as const;

const SRC = resolve('art-source/cards/aotearoa');
const OUT = resolve('public/cards/aotearoa');
const W = 320;
const H = 525;
/** The printed border in the source, and the one drawn back on (px at output size). */
const SRC_BORDER = 14;
const BORDER = 5;
const RADIUS = 9;
const INK = '#1c1411';
const QUALITY = 0.9;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage();
  for (const [i, name] of AOTEAROA_FILES.entries()) {
    const svg = readFileSync(resolve(SRC, `${name}.svg`), 'utf8');
    const dataUrl = await page.evaluate(
      async ({ svg, W, H, SRC_BORDER, BORDER, RADIUS, INK, QUALITY }) => {
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const x = c.getContext('2d') as CanvasRenderingContext2D;
        x.fillStyle = INK;
        x.fillRect(0, 0, W, H);
        // The art inside the source's own border, scaled to fill the inner card by height.
        const sw = img.naturalWidth || 1024;
        const sh = img.naturalHeight || 1536;
        const innerW = W - 2 * BORDER;
        const innerH = H - 2 * BORDER;
        const artH = sh - 2 * SRC_BORDER;
        const scale = Math.max(innerH / artH, innerW / (sw - 2 * SRC_BORDER));
        const cropW = innerW / scale;
        const cropH = innerH / scale;
        x.save();
        x.beginPath();
        x.roundRect(BORDER, BORDER, innerW, innerH, RADIUS);
        x.clip();
        x.drawImage(
          img,
          (sw - cropW) / 2,
          (sh - cropH) / 2,
          cropW,
          cropH,
          BORDER,
          BORDER,
          innerW,
          innerH,
        );
        x.restore();
        return c.toDataURL('image/webp', QUALITY);
      },
      { svg, W, H, SRC_BORDER, BORDER, RADIUS, INK, QUALITY },
    );
    writeFileSync(resolve(OUT, `${i}.webp`), Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'));
  }
  await browser.close();
  console.log(`Wrote ${AOTEAROA_FILES.length} faces to ${OUT}`);
}

void main();
