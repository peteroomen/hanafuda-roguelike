import { expect, test } from '@playwright/test';
import { hook, setSettings } from './autoplay';

/** Sound stops while the game is in a background tab, and comes back when you return. */
test('audio pauses in a background tab', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __ctx?: AudioContext; __hidden?: boolean };
    const Orig = window.AudioContext;
    window.AudioContext = class extends Orig {
      constructor(o?: AudioContextOptions) {
        super(o);
        w.__ctx = this;
      }
    } as typeof AudioContext;
    Object.defineProperty(document, 'hidden', { get: () => Boolean(w.__hidden) });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'fast', guide: false, sfx: 0.5, music: 0.5 });
  await page.reload();
  await page.getByTestId('btn-new').click();
  await page.getByTestId('btn-begin-year').click();
  await page.getByTestId('btn-begin').click();
  await expect.poll(async () => (await hook(page))?.canAct).toBe(true);
  const state = () =>
    page.evaluate(() => (window as unknown as { __ctx?: AudioContext }).__ctx?.state ?? 'none');
  const setHidden = (h: boolean) =>
    page.evaluate((v) => {
      (window as unknown as { __hidden?: boolean }).__hidden = v;
      document.dispatchEvent(new Event('visibilitychange'));
    }, h);
  await expect.poll(state).toBe('running');
  await setHidden(true);
  await expect.poll(state).toBe('suspended');
  await setHidden(false);
  await expect.poll(state).toBe('running');
});
