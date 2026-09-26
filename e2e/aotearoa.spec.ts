import { expect, type Page, test } from '@playwright/test';
import { playYear, setSettings } from './autoplay';

const KANA_OR_KANJI = /[぀-ヿ㐀-鿿]/;

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function freshStart(page: Page, settings: Record<string, unknown>) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, settings);
  await page.reload();
  await expect(page.getByTestId('title')).toBeVisible();
}

/** Every card face on the table comes from the land's own deck. */
async function faceSources(page: Page): Promise<string[]> {
  return page
    .locator('.card .face')
    .evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''));
}

test('a year in Aotearoa: its cards, Te Reo names and the kiwi', async ({ page }, info) => {
  const errors = watchErrors(page);
  await freshStart(page, { speed: 'fast', guide: false, trainingWheels: 'full', sfx: 0, music: 0 });
  await page.getByTestId('btn-new').click();
  await page.getByTestId('land-aotearoa').click();
  await expect(page.getByTestId('land-aotearoa')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('deck-pine')).toContainText('Pōhutukawa Deck');
  await page.screenshot({ path: info.outputPath('01-setup.png') });
  await page.getByTestId('toggle-guided').uncheck();
  await page.getByTestId('btn-begin-year').click();

  // The intro names the month in Te Reo, shows the kiwi and a summer sky.
  const intro = page.getByTestId('intro');
  await expect(intro).toBeVisible();
  await expect(intro).toContainText('Pōhutukawa · Kohitātea');
  await expect(intro.locator('.intro-month .kiwi')).toBeVisible();
  await expect(intro.locator('.intro-season')).toHaveText('summer');
  await page.screenshot({ path: info.outputPath('02-intro.png') });
  await page.getByTestId('btn-begin').click();

  await expect(page.locator('.card .face').first()).toBeAttached();
  const faces = await faceSources(page);
  expect(faces.length).toBeGreaterThan(0);
  for (const src of faces) expect(src).toContain('/cards/aotearoa/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: info.outputPath('03-table.png') });

  // The yaku book: Te Reo names, kiwi seals, no kanji.
  await page.getByRole('button', { name: 'Yaku book' }).first().click();
  const book = page.locator('.yaku-list');
  await expect(book).toContainText('Te Pō');
  await expect(book).toContainText('Mārama e Rima');
  expect(KANA_OR_KANJI.test(await book.innerText())).toBe(false);
  await page.screenshot({ path: info.outputPath('04-yaku-book.png') });

  // Play the rest at instant speed. Reloading also checks that an Aotearoa save resumes as one.
  await setSettings(page, { speed: 'instant' });
  await page.reload();
  await page.getByTestId('btn-continue').click();
  expect(
    await faceSources(page).then((f) => f.every((src) => src.includes('/cards/aotearoa/'))),
  ).toBe(true);
  const final = await playYear(page, {
    bot: { kind: 'smart', archetype: 'auto' },
    seed: 11,
    onMonth: async (run) => {
      expect(run.land).toBe('aotearoa');
      await page.waitForTimeout(80);
      await page.screenshot({
        path: info.outputPath(`month-${String(run.month).padStart(2, '0')}.png`),
      });
    },
  });
  await page.screenshot({ path: info.outputPath('end.png') });
  expect(['victory', 'defeat']).toContain(final.phase);
  expect(errors).toEqual([]);
});
