/**
 * Renders contact sheets of the generated art to PNG for visual review.
 *
 *   pnpm tsx --tsconfig tsconfig.sim.json scripts/art-sheet.ts [cards|spirits|all] [--scale 1.5]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { landCards } from '@/content/cards';
import { cardBackSvg, cardFaceSvg } from '@/ui/art/cards';
import { SPIRITS } from '@/content/spirits';
import { rainManSvg, spiritSvg } from '@/ui/art/spirits';

const which = process.argv[2] ?? 'cards';
const out = resolve('test-results/art');
mkdirSync(out, { recursive: true });

const dataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

async function shoot(name: string, html: string, width: number) {
  const file = resolve(out, `${name}.html`);
  writeFileSync(file, html);
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(`file://${file}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(out, `${name}.png`), fullPage: true });
  await browser.close();
  console.log(`wrote ${resolve(out, `${name}.png`)}`);
}

const style = `body{margin:0;padding:16px;background:#2a2320;font-family:sans-serif;color:#eee}
.grid{display:grid;gap:10px}
.cell{display:flex;flex-direction:column;align-items:center;font-size:11px;gap:4px}
img{display:block;filter:drop-shadow(0 3px 2px rgba(0,0,0,.5))}`;

if (which === 'cards' || which === 'all') {
  const w = Number(process.argv[process.argv.indexOf('--w') + 1] || 120) || 120;
  const cells = landCards('nippon')
    .map(
      (c) =>
        `<div class="cell"><img width="${w}" src="${dataUri(cardFaceSvg(c.id))}"/><span>${c.month} ${c.name}</span></div>`,
    )
    .join('');
  const back = `<div class="cell"><img width="${w}" src="${dataUri(cardBackSvg())}"/><span>back</span></div>`;
  await shoot(
    'cards',
    `<!doctype html><style>${style}.grid{grid-template-columns:repeat(8,${w}px)}</style><div class="grid">${cells}${back}</div>`,
    8 * (w + 10) + 40,
  );
}

if (which === 'spirits' || which === 'all') {
  const w = 150;
  const cells = SPIRITS.map(
    (s) =>
      `<div class="cell"><img width="${w}" src="${dataUri(spiritSvg(s.id, s.season, s.boss))}"/><span>${s.name}</span></div>`,
  ).join('');
  const guide = `<div class="cell"><img width="${w}" src="${dataUri(rainManSvg())}"/><span>Rain Man (guide)</span></div>`;
  await shoot(
    'spirits',
    `<!doctype html><style>${style}.grid{grid-template-columns:repeat(6,${w}px)}</style><div class="grid">${cells}${guide}</div>`,
    6 * (w + 10) + 40,
  );
}
