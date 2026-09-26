import { expect, test } from '@playwright/test';

/**
 * The record book: every Collection tab opens, locked charms show their conditions, and a
 * veteran's save unlocks what it already earned the first time the game loads.
 */
test('collection tabs, locked charms and deck records', async ({ page }, info) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('btn-collection').click();
  for (const tab of ['yaku', 'cards', 'charms', 'spirits', 'decks', 'records', 'rules']) {
    await page.getByTestId(`tab-${tab}`).click();
    await expect(page.getByTestId('collection')).toBeVisible();
    if (tab === 'charms' || tab === 'decks' || tab === 'records')
      await page.screenshot({ path: `test-results/collection-${tab}-${info.project.name}.png` });
  }
  await page.getByTestId('tab-charms').click();
  await expect(page.getByTestId('charm-locked')).toHaveCount(7);
  await expect(page.getByText('Score Kasu 10 times.')).toBeVisible();
  await page.getByTestId('tab-decks').click();
  await expect(page.getByTestId('deck-record-firework')).toContainText('Deal 1,000 damage');

  // A veteran's older save: stats that meet three conditions, a deck record, no unlock list.
  await page.evaluate(() => {
    const raw = localStorage.getItem('tp.profile.v1');
    const p = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    delete p.unlockedCharms;
    localStorage.setItem(
      'tp.profile.v1',
      JSON.stringify({
        ...p,
        bestMonth: 8,
        runsStarted: 3,
        runsWon: 1,
        biggestHit: 1500,
        biggestHitDeck: 'pine',
        yakuScored: { kasu: 14, tsukifuda: 2 },
        unlockedDecks: ['pine', 'plum', 'firework'],
        deckRecords: { pine: { runs: 3, wins: 1, bestOmen: 0 } },
      }),
    );
  });
  await page.reload();
  await page.getByTestId('btn-collection').click();
  await page.getByTestId('tab-charms').click();
  await expect(page.getByTestId('charm-locked')).toHaveCount(4);
  await page.getByTestId('tab-decks').click();
  await expect(page.getByTestId('deck-record-pine')).toContainText('3 years played · 1 completed');
  await expect(page.getByTestId('deck-record-pine').getByLabel(/Clear Sky/)).toBeVisible();
  await page.screenshot({ path: `test-results/collection-decks-veteran-${info.project.name}.png` });
  await page.getByTestId('tab-records').click();
  await expect(page.getByText('Most scored:')).toContainText('Kasu');
  await page.screenshot({
    path: `test-results/collection-records-veteran-${info.project.name}.png`,
  });
});
