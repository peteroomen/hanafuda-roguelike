import { expect, type Page, test } from '@playwright/test';
import { hook, playYear, setSettings } from './autoplay';

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

test('a whole year played through the UI by the smart bot', async ({ page }, info) => {
  const errors = watchErrors(page);
  await freshStart(page, { speed: 'instant', guide: true, trainingWheels: true, sfx: 0, music: 0 });
  await page.getByTestId('btn-new').click();
  await page.getByTestId('btn-begin-year').click();
  let shots = 0;
  const final = await playYear(page, {
    bot: { kind: 'smart', archetype: 'auto' },
    seed: 7,
    onMonth: async (run) => {
      await page.waitForTimeout(80);
      await page.screenshot({
        path: info.outputPath(`month-${String(run.month).padStart(2, '0')}.png`),
      });
    },
    onStep: async (run, action) => {
      if (run.phase === 'shop' && action.type === 'leaveShop' && shots++ < 12) {
        // The shop was visible just before leaving it.
      }
    },
  });
  await page.screenshot({ path: info.outputPath('end.png') });
  expect(['victory', 'defeat']).toContain(final.phase);
  await expect(page.getByTestId(final.phase === 'victory' ? 'victory' : 'defeat')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the guided first months at normal speed', async ({ page }, info) => {
  const errors = watchErrors(page);
  await freshStart(page, { speed: 'fast', guide: true, trainingWheels: true, sfx: 0, music: 0 });
  await page.getByTestId('btn-new').click();
  await expect(page.getByTestId('toggle-guided')).toBeChecked();
  await page.getByTestId('btn-begin-year').click();
  await expect(page.getByTestId('intro')).toBeVisible();
  await page.screenshot({ path: info.outputPath('01-intro.png') });
  let n = 0;
  const final = await playYear(page, {
    bot: { kind: 'smart', archetype: 'auto' },
    seed: 3,
    maxActions: 400,
    onStep: async (run, action) => {
      n += 1;
      if (
        n <= 3 ||
        action.type === 'leaveShop' ||
        (action.type === 'hand' && action.action.type === 'koikoi')
      ) {
        await page.screenshot({ path: info.outputPath(`step-${String(n).padStart(3, '0')}.png`) });
      }
      if (run.month > 3) throw new Error('done');
    },
  }).catch(async (e: Error) => {
    if (e.message !== 'done' && !e.message.includes('action budget')) throw e;
    return (await hook(page))?.run ?? null;
  });
  expect(final).not.toBeNull();
  expect(errors).toEqual([]);
});
