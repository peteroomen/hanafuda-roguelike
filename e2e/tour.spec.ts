import { expect, test } from '@playwright/test';
import { playYear, setSettings } from './autoplay';

/**
 * A photo tour at normal animation speed: plays the first months through the UI
 * and photographs every overlay the first time it appears, for visual review.
 */
test('photo tour of every screen and overlay', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await setSettings(page, { speed: 'normal', guide: true, sfx: 0, music: 0 });
  await page.reload();
  await page.screenshot({ path: info.outputPath('00-title.png') });
  await page.getByTestId('btn-new').click();
  await page.getByTestId('toggle-guided').uncheck();
  await page.screenshot({ path: info.outputPath('00-setup.png') });
  await page.getByTestId('btn-begin-year').click();
  const seen = new Set<string>();
  const targets = [
    'intro',
    'guide',
    'decision',
    'score-seq',
    'strike-seq',
    'handover',
    'reward',
    'shop',
    'banner',
    'frog',
    'hint',
  ];
  let shot = 0;
  await playYear(page, {
    bot: {
      kind: 'smart',
      archetype: 'auto',
      decide: { minCards: 2, maxThreat: 0.8, enoughFraction: 1.2, hpRisk: 0.9, maxCalls: 2 },
    },
    seed: 11,
    hurry: false,
    untilMonth: 3,
    maxActions: 20000,
    onPoll: async () => {
      for (const t of targets) {
        if (seen.has(t)) continue;
        if (
          await page
            .getByTestId(t)
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          seen.add(t);
          await page.waitForTimeout(t === 'score-seq' ? 1200 : t === 'strike-seq' ? 900 : 250);
          await page.screenshot({
            path: info.outputPath(`${String(++shot).padStart(2, '0')}-${t}.png`),
          });
        }
      }
    },
  });
  console.log('photographed:', [...seen].join(', '));
  expect(seen.has('decision')).toBe(true);
  expect(seen.has('score-seq')).toBe(true);
  expect(seen.has('shop')).toBe(true);
  expect(errors).toEqual([]);
});
