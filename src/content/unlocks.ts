/**
 * Unlock conditions for decks and charms, and which charms start locked. Conditions are checked
 * against the player's profile (lifetime stats), never the run, so they're data here and the
 * checking lives with the profile (src/ui/state/meta.ts).
 */
import type { LandText } from './lands';
import type { OmamoriId } from './omamori';
import type { SpiritId } from './spirits';
import type { YakuFamily, YakuId } from './yaku';

export type UnlockCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'reachMonth'; readonly month: number }
  | { readonly kind: 'defeatBoss' }
  | { readonly kind: 'scoreFamily'; readonly family: YakuFamily }
  | { readonly kind: 'koikoiInHand'; readonly calls: number }
  | { readonly kind: 'winRun' }
  /** Deal this much damage in a single stop. */
  | { readonly kind: 'stopDamage'; readonly damage: number }
  /** Score this yaku this many times, over all years. */
  | { readonly kind: 'scoreYaku'; readonly id: YakuId; readonly times: number }
  /** Call koi-koi this many times, over all years. */
  | { readonly kind: 'koikoiTotal'; readonly calls: number }
  /** Calm (defeat) this spirit. */
  | { readonly kind: 'calmSpirit'; readonly id: SpiritId }
  /** Calm this many different spirits. */
  | { readonly kind: 'spiritsCalmed'; readonly count: number };

export interface CharmUnlock {
  readonly unlock: UnlockCondition;
  readonly unlockText: LandText;
}

/**
 * Charms that start locked: the strongest and the rarest, flashiest ones. Locked charms never
 * appear in the shop until their condition is met. (Audit: docs/work/2026-09-25-decks-and-unlocks.md.)
 */
export const CHARM_UNLOCKS: Partial<Record<OmamoriId, CharmUnlock>> = {
  leafPile: {
    unlock: { kind: 'scoreYaku', id: 'kasu', times: 10 },
    unlockText: (t) => `Score ${t.y.kasu} 10 times.`,
  },
  bonsai: { unlock: { kind: 'reachMonth', month: 6 }, unlockText: 'Reach June.' },
  almanac: {
    unlock: { kind: 'scoreYaku', id: 'tsukifuda', times: 1 },
    unlockText: (t) => `Score ${t.y.tsukifuda}.`,
  },
  phoenixPlume: {
    unlock: { kind: 'scoreYaku', id: 'sanko', times: 3 },
    unlockText: (t) => `Score ${t.y.sanko} 3 times.`,
  },
  koiPond: {
    unlock: { kind: 'koikoiTotal', calls: 25 },
    unlockText: 'Call koi-koi 25 times, over all your years.',
  },
  yataMirror: { unlock: { kind: 'calmSpirit', id: 'tengu' }, unlockText: 'Calm the Tengu.' },
  daruma: {
    unlock: { kind: 'spiritsCalmed', count: 10 },
    unlockText: 'Calm 10 different spirits.',
  },
};

/** Every charm that starts locked. */
export const LOCKED_AT_START: readonly OmamoriId[] = Object.keys(CHARM_UNLOCKS) as OmamoriId[];
