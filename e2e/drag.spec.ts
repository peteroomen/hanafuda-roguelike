import { expect, type Page, test } from '@playwright/test';
import { hook, setSettings } from './autoplay';

async function centre(page: Page, id: number): Promise<{ x: number; y: number }> {
  const box = await page.getByTestId(`card-${id}`).boundingBox();
  if (!box) throw new Error(`card ${id} is not on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Wait until we can play a card, answering any "which match?" choice along the way. */
async function waitForMyTurn(page: Page) {
  await expect
    .poll(async () => {
      const h = await hook(page);
      const hand = h?.run.fight?.hand;
      if (!h?.canAct || !hand || hand.active !== 0) return false;
      const option = hand.pending?.options[0];
      if ((hand.phase === 'flipChoice' || hand.phase === 'playChoice') && option !== undefined) {
        const card = page.getByTestId(`card-${option}`);
        await card.dispatchEvent('pointerdown', { pointerId: 1 });
        await card.dispatchEvent('pointerup', { pointerId: 1 });
        return false;
      }
      return hand.phase === 'play';
    })
    .toBe(true);
}

test('drag a hand card onto its match, then drag one to the field', async ({ page }, info) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'fast', guide: false, sfx: 0, music: 0 });
  await page.reload();
  await page.getByTestId('btn-new').click();
  await page.getByTestId('btn-begin-year').click();
  await page.getByTestId('btn-begin').click();

  // Play up to a few turns by dragging, until we've done both kinds of drop.
  let matched = false;
  let laid = false;
  for (let turn = 0; turn < 8 && !(matched && laid); turn++) {
    await waitForMyTurn(page);
    const run = (await hook(page))?.run;
    const hand = run?.fight?.hand;
    if (!hand) throw new Error('no hand');
    const month = (id: number) => Math.floor(id / 4);
    const withMatch = hand.hands[0].find((c) => hand.field.some((f) => month(f) === month(c)));
    const without = hand.hands[0].find((c) => !hand.field.some((f) => month(f) === month(c)));
    const card = !matched && withMatch !== undefined ? withMatch : (without ?? withMatch);
    if (card === undefined) break;
    const target = hand.field.find((f) => month(f) === month(card));
    const from = await centre(page, card);
    // With no match, drop it in the middle of the field.
    const fieldBox = await page.locator('.table-mat').boundingBox();
    if (!fieldBox) throw new Error('no field');
    const to =
      target !== undefined
        ? await centre(page, target)
        : { x: fieldBox.x + fieldBox.width / 2, y: fieldBox.y + fieldBox.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 5 });
    await page.mouse.move(to.x, to.y, { steps: 5 });
    if (turn === 0) await page.screenshot({ path: info.outputPath('mid-drag.png') });
    await page.mouse.up();
    await expect
      .poll(async () => (await hook(page))?.run.fight?.hand.hands[0].includes(card))
      .toBe(false);
    if (target !== undefined) matched = true;
    else laid = true;
    await page.waitForTimeout(400);
    await page.screenshot({ path: info.outputPath(`after-${turn}.png`) });
  }
  expect(matched).toBe(true);
});

test('a short drag that goes nowhere springs back', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'fast', guide: false, sfx: 0, music: 0 });
  await page.reload();
  await page.getByTestId('btn-new').click();
  await page.getByTestId('btn-begin-year').click();
  await page.getByTestId('btn-begin').click();
  await waitForMyTurn(page);
  const card = (await hook(page))?.run.fight?.hand.hands[0][0] as number;
  const from = await centre(page, card);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // Up and to the side, but stay below the field.
  await page.mouse.move(from.x + 30, from.y - 20, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect((await hook(page))?.run.fight?.hand.hands[0]).toContain(card);
});
