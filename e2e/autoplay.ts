/**
 * Drives the real UI with the simulator's bot: the bot decides, and every
 * decision is carried out by tapping the same buttons and cards a player would.
 */
import type { Page } from '@playwright/test';
import type { RunAction, RunState } from '../src/engine/run';
import { type BotConfig, makeBot } from '../src/sim/bots';

export interface TpHook {
  readonly canAct: boolean;
  readonly busy: boolean;
  readonly intro: boolean;
  readonly scoring: boolean;
  readonly run: RunState;
}

export async function hook(page: Page): Promise<TpHook | null> {
  return page.evaluate(() => (window as unknown as { __tp?: TpHook }).__tp ?? null);
}

export async function setSettings(page: Page, settings: Record<string, unknown>): Promise<void> {
  await page.evaluate((s) => {
    const cur = JSON.parse(localStorage.getItem('tp.settings.v1') ?? '{}') as Record<
      string,
      unknown
    >;
    localStorage.setItem('tp.settings.v1', JSON.stringify({ ...cur, ...s }));
  }, settings);
}

const T = { timeout: 4000 };
const DEBUG = Boolean(process.env.TP_DEBUG);

async function tapCard(page: Page, id: number): Promise<void> {
  await page.locator(`[data-testid="card-${id}"]`).dispatchEvent('pointerdown', undefined, T);
}

async function tap(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).click(T);
}

async function dismissGuide(page: Page): Promise<boolean> {
  const g = page.getByTestId('guide');
  if (await g.isVisible().catch(() => false)) {
    // It may vanish on its own when the game moves on; that's fine.
    await g.click({ timeout: 800 }).catch(() => undefined);
    return true;
  }
  return false;
}

export interface PlayOptions {
  readonly bot: BotConfig;
  readonly seed: number;
  readonly maxActions?: number;
  /** Called after each performed action. */
  readonly onStep?: (run: RunState, action: RunAction, n: number) => Promise<void>;
  /** Called when a new month's table appears. */
  readonly onMonth?: (run: RunState) => Promise<void>;
  /** Called on every poll, e.g. to photograph overlays. */
  readonly onPoll?: () => Promise<void>;
  /** Tap through score sequences instead of watching them (default true). */
  readonly hurry?: boolean;
  /** Stop once this month is reached. */
  readonly untilMonth?: number;
}

/** Play until the year ends. Returns the final run state. */
export async function playYear(page: Page, opts: PlayOptions): Promise<RunState> {
  const bot = makeBot(opts.bot, opts.seed);
  const max = opts.maxActions ?? 4000;
  let lastMonth = 0;
  let stuck = 0;
  for (let n = 0; n < max; n++) {
    await opts.onPoll?.();
    await dismissGuide(page);
    if (
      await page
        .getByTestId('btn-begin')
        .isVisible()
        .catch(() => false)
    ) {
      await tap(page, 'btn-begin');
      continue;
    }
    const tp = await hook(page);
    if (!tp) {
      await page.waitForTimeout(50);
      continue;
    }
    const run = tp.run;
    if (run.phase === 'victory' || run.phase === 'defeat') return run;
    if (!tp.canAct || tp.intro) {
      if (tp.scoring)
        await page
          .locator('.seq-scrim')
          .click({ force: true })
          .catch(() => undefined);
      await page.waitForTimeout(30);
      continue;
    }
    if (run.phase === 'fight' && run.month !== lastMonth) {
      lastMonth = run.month;
      await opts.onMonth?.(run);
    }
    const action = bot.next(run);
    if (DEBUG)
      console.log(
        `#${n} m${run.month} ${run.phase}/${run.fight?.hand.phase ?? '-'}`,
        JSON.stringify(action),
      );
    let done: boolean;
    try {
      done = await perform(page, run, action);
    } catch (e) {
      stuck += 1;
      if (DEBUG) console.log('action failed', (e as Error).message.split('\n')[0]);
      await page.keyboard.press('Escape').catch(() => undefined);
      await page
        .locator('.sheet-scrim')
        .click({ position: { x: 5, y: 5 }, timeout: 500 })
        .catch(() => undefined);
      if (stuck > 20) throw new Error(`Stuck on ${JSON.stringify(action)}`, { cause: e });
      continue;
    }
    if (!done) {
      await page.waitForTimeout(40);
      continue;
    }
    await opts.onStep?.(run, action, n);
    // Let React commit and the director pick the action up.
    await page.waitForTimeout(20);
  }
  throw new Error('Year did not finish within the action budget');
}

async function perform(page: Page, run: RunState, a: RunAction): Promise<boolean> {
  switch (a.type) {
    case 'hand': {
      const h = a.action;
      switch (h.type) {
        case 'play':
          await tapCard(page, h.card);
          await page.waitForTimeout(25);
          await tapCard(page, h.card);
          return true;
        case 'choose':
          await tapCard(page, h.card);
          return true;
        case 'flip':
          return false;
        case 'keepFlip':
          await tap(page, 'btn-keep');
          return true;
        case 'redoFlip':
          await tap(page, 'btn-leap');
          return true;
        case 'stop':
          await tap(page, 'btn-stop');
          return true;
        case 'koikoi':
          await tap(page, 'btn-koikoi');
          return true;
      }
      return false;
    }
    case 'spirit':
      return false;
    case 'nextHand':
      await tap(page, 'btn-next-hand');
      return true;
    case 'collect':
      await tap(page, 'btn-collect');
      return true;
    case 'buy':
      await tap(page, `offer-${a.offer}`);
      await tap(page, 'btn-buy');
      return true;
    case 'sell':
      await tap(page, `shop-charm-${a.slot}`);
      await tap(page, 'btn-sell');
      return true;
    case 'enhance':
      await tap(page, 'btn-shrine');
      await tap(page, `shrine-card-${a.card}`);
      return true;
    case 'heal':
      await tap(page, 'btn-heal');
      return true;
    case 'reroll':
      await tap(page, 'btn-reroll');
      return true;
    case 'leaveShop':
      await tap(page, 'btn-leave-shop');
      return true;
    case 'ofuda': {
      await tap(page, `ofuda-${a.slot}`);
      await tap(page, 'btn-use-ofuda');
      const id = run.ofuda[a.slot];
      if (id === 'goldLeaf' && a.handCard !== undefined) await tapCard(page, a.handCard);
      if (id === 'swap' && a.handCard !== undefined && a.fieldCard !== undefined) {
        await tapCard(page, a.handCard);
        await page.waitForTimeout(20);
        await tapCard(page, a.fieldCard);
      }
      return true;
    }
    case 'discardOfuda':
    case 'moveOmamori':
      return false;
  }
}
