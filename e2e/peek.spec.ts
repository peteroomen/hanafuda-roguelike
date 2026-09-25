import { expect, test } from '@playwright/test';
import { playYear, setSettings } from './autoplay';

/** Holding the stop/koi-koi panel's peek button slides it down to show your hand; letting go brings it back. */
test('peek at your hand from the stop/koi-koi panel', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'fast', guide: false, sfx: 0, music: 0 });
  await page.reload();
  await page.getByTestId('btn-new').click();
  await page.getByTestId('toggle-guided').uncheck();
  await page.getByTestId('btn-begin-year').click();
  let checked = false;
  await playYear(page, {
    bot: { kind: 'smart', archetype: 'auto' },
    seed: 11,
    maxActions: 6000,
    onPoll: async () => {
      const panel = page.getByTestId('decision');
      if (checked || !(await panel.isVisible().catch(() => false))) return;
      checked = true;
      await page.waitForTimeout(400);
      const before = (await panel.boundingBox())?.y ?? 0;
      const peek = await page.getByTestId('btn-peek').boundingBox();
      if (!peek) throw new Error('no peek button');
      await page.mouse.move(peek.x + peek.width / 2, peek.y + peek.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(400);
      const held = (await panel.boundingBox())?.y ?? 0;
      await page.mouse.up();
      await page.waitForTimeout(400);
      const after = (await panel.boundingBox())?.y ?? 0;
      expect(held).toBeGreaterThan(before + 60);
      expect(Math.abs(after - before)).toBeLessThan(2);
      throw new Error('done');
    },
  }).catch((e: Error) => {
    if (e.message !== 'done') throw e;
  });
  expect(checked).toBe(true);
});
