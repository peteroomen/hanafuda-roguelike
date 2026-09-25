import { expect, test } from '@playwright/test';
import { hook, setSettings } from './autoplay';

/**
 * The UI sounds (wood tock on buttons, paper rustle on sheets) actually reach the speakers at a
 * sensible level: an analyser on the output measures their peak.
 */
test('ui sounds make sound', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const w = window as unknown as { __peak: number; __an?: AnalyserNode };
    w.__peak = 0;
    const orig = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (this: AudioNode, dest: unknown, ...rest: unknown[]) {
      if (dest instanceof AudioDestinationNode && !w.__an) {
        const an = this.context.createAnalyser();
        an.fftSize = 2048;
        w.__an = an;
        (orig as (...a: unknown[]) => unknown).call(this, an);
        const buf = new Float32Array(an.fftSize);
        const poll = () => {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) w.__peak = Math.max(w.__peak, Math.abs(v));
          setTimeout(poll, 10);
        };
        poll();
      }
      return (orig as (...a: unknown[]) => AudioNode).call(this, dest, ...rest);
    } as typeof AudioNode.prototype.connect;
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'fast', guide: false, sfx: 0.8, music: 0 });
  await page.reload();
  const peakAfter = async (act: () => Promise<void>) => {
    await page.evaluate(() => ((window as unknown as { __peak: number }).__peak = 0));
    await act();
    await page.waitForTimeout(400);
    const p = await page.evaluate(() => (window as unknown as { __peak: number }).__peak);
    return p;
  };
  await page.getByTestId('btn-new').click(); // unlocks audio
  await page.getByTestId('toggle-guided').uncheck();
  await page.getByTestId('btn-begin-year').click();
  await page.getByTestId('btn-begin').click();
  await expect.poll(async () => (await hook(page))?.canAct, { timeout: 20000 }).toBe(true);
  const tock = await peakAfter(() => page.getByTestId('open-menu').click());
  const paper = await peakAfter(async () => {
    await page.mouse.click(5, 5);
    await page.waitForTimeout(300);
    await page.getByTestId('open-book').click();
  });
  const hand = (await hook(page))?.run.fight?.hand;
  const card = hand?.hands[0][0] as number;
  const slap = await peakAfter(async () => {
    const el = page.getByTestId(`card-${card}`);
    await el.dispatchEvent('pointerdown', { pointerId: 1 });
    await el.dispatchEvent('pointerup', { pointerId: 1 });
    await page.waitForTimeout(100);
    await el.dispatchEvent('pointerdown', { pointerId: 1 });
    await el.dispatchEvent('pointerup', { pointerId: 1 });
  });
  expect(slap).toBeGreaterThan(0.1);
  expect(tock).toBeGreaterThan(0.05);
  // A button is quieter than a card hitting the table.
  expect(tock).toBeLessThan(slap);
  expect(paper).toBeGreaterThan(0.05);
  expect(Math.max(tock, paper)).toBeLessThan(1);
  expect(errors).toEqual([]);
});
