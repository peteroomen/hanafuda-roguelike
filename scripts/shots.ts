/**
 * Ad-hoc screenshots of the running dev server for visual review.
 *   pnpm tsx --tsconfig tsconfig.sim.json scripts/shots.ts [w] [h]
 */
import { chromium } from '@playwright/test';

const w = Number(process.argv[2] ?? 390);
const h = Number(process.argv[3] ?? 844);
const out = 'test-results/shots';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
});
const errors: string[] = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto('http://localhost:5199/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/01-title-${w}x${h}.png` });
await page.getByTestId('btn-new').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/02-setup-${w}x${h}.png` });
await page.getByTestId('btn-begin-year').click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/03-intro-${w}x${h}.png` });
await page.getByTestId('btn-begin').click();
await page.waitForTimeout(2600);
await page.screenshot({ path: `${out}/04-table-${w}x${h}.png` });
console.log(errors.join('\n') || 'no console errors');
await browser.close();
