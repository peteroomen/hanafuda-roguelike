/**
 * Seasonal decks (run-start variants) and omens (difficulty levels).
 */
import type { CardTag } from './cards';
import { byLand, cap, type LandText } from './lands';
import type { OfudaId } from './ofuda';
import type { OmamoriId } from './omamori';
import type { EnhancementId } from '@/engine/types';

export type DeckId =
  'pine' | 'plum' | 'moon' | 'willow' | 'maple' | 'paulownia' | 'gambler' | 'firework';

export type { UnlockCondition } from './unlocks';
import type { UnlockCondition } from './unlocks';

export interface DeckDef {
  readonly id: DeckId;
  /** Named for a flower of the land, so a LandText. */
  readonly name: LandText;
  /** Decoration. Aotearoa shows a little kiwi instead. */
  readonly kanji: string;
  readonly text: LandText;
  readonly unlock: UnlockCondition;
  readonly unlockText: string;
  readonly start: {
    readonly omamori?: readonly OmamoriId[];
    readonly ofuda?: readonly OfudaId[];
    readonly mon?: number;
    readonly hpDelta?: number;
    readonly omamoriSlots?: number;
    readonly ofudaSlots?: number;
    /** Enhance the (unique) cards with these tags. */
    readonly enhance?: readonly { readonly tag: CardTag; readonly enhancement: EnhancementId }[];
    /** Random Poem levels granted at the start. */
    readonly poemLevels?: number;
  };
  readonly modifiers?: {
    readonly poemPrice?: number;
    readonly interestCap?: number;
    /** Overrides the koi-koi stake factor. */
    readonly stakeFactor?: number;
    /** Overrides the spirit's koi-koi punishment multiplier. */
    readonly punish?: number;
    /** Multiplies the Mult every yaku gives when it scores. */
    readonly yakuMult?: number;
    /** Multiplies every spirit's HP. */
    readonly spiritHp?: number;
    /** Mon off every talisman's price. */
    readonly ofudaDiscount?: number;
  };
  /** Accent hue for the deck's card back. */
  readonly hue: number;
}

export const DECKS: readonly DeckDef[] = [
  {
    id: 'pine',
    name: byLand({ nippon: 'Pine Deck', aotearoa: 'Pōhutukawa Deck' }),
    kanji: '松',
    text: byLand({
      nippon: 'The traditional deck. No tricks.',
      aotearoa: 'The plain deck. No tricks.',
    }),
    unlock: { kind: 'always' },
    unlockText: 'Always available.',
    start: {},
    hue: 0,
  },
  {
    id: 'plum',
    name: byLand({ nippon: 'Plum Deck', aotearoa: 'Mānuka Deck' }),
    kanji: '梅',
    text: 'Talismans cost 1 mon less. Start with Frog and Far Sight, and a third talisman slot.',
    unlock: { kind: 'reachMonth', month: 4 },
    unlockText: 'Reach April.',
    start: { ofuda: ['frog', 'peek'], ofudaSlots: 3 },
    modifiers: { ofudaDiscount: 1 },
    hue: 340,
  },
  {
    id: 'moon',
    name: 'Moon Deck',
    kanji: '月',
    text: (t) => `Start with Moon Viewer. ${cap(t.moon)} and ${t.curtain} are Gilded.`,
    unlock: { kind: 'scoreFamily', family: 'brights' },
    unlockText: 'Score a Bright yaku.',
    start: {
      omamori: ['moonViewer'],
      enhance: [
        { tag: 'moon', enhancement: 'gilded' },
        { tag: 'curtain', enhancement: 'gilded' },
      ],
    },
    hue: 45,
  },
  {
    id: 'willow',
    name: byLand({ nippon: 'Willow Deck', aotearoa: 'Tī Kōuka Deck' }),
    kanji: '柳',
    text: 'Start with Willow Wind and a sixth charm slot, but 10 less max HP.',
    unlock: { kind: 'defeatBoss' },
    unlockText: 'Defeat a boss.',
    start: { omamori: ['willowWind'], omamoriSlots: 6, hpDelta: -10 },
    hue: 110,
  },
  {
    id: 'maple',
    name: byLand({ nippon: 'Maple Deck', aotearoa: 'Mamaku Deck' }),
    kanji: '紅葉',
    text: 'Start with 10 extra mon. Interest can reach 8 mon.',
    unlock: { kind: 'reachMonth', month: 7 },
    unlockText: 'Reach July.',
    start: { mon: 10 },
    modifiers: { interestCap: 8 },
    hue: 15,
  },
  {
    id: 'gambler',
    name: "Gambler's Deck",
    kanji: '博',
    text: 'Koi-koi stakes grow ×3 per call, but a spirit that punishes you hits ×3.',
    unlock: { kind: 'koikoiInHand', calls: 3 },
    unlockText: 'Call koi-koi three times in one hand.',
    start: { omamori: ['carpStreamer'] },
    modifiers: { stakeFactor: 3, punish: 3 },
    hue: 0,
  },
  {
    id: 'paulownia',
    name: byLand({ nippon: 'Paulownia Deck', aotearoa: 'Harakeke Deck' }),
    kanji: '桐',
    text: 'Poems cost 2 mon. Start with three random Poem levels.',
    unlock: { kind: 'winRun' },
    unlockText: 'Complete a year.',
    start: { poemLevels: 3 },
    modifiers: { poemPrice: 2 },
    hue: 270,
  },
  {
    id: 'firework',
    name: 'Firework Deck',
    kanji: '花火',
    text: 'Every yaku gives ×2 Mult, but spirits have 50% more HP. Start with Carp Streamer.',
    unlock: { kind: 'stopDamage', damage: 1000 },
    unlockText: 'Deal 1,000 damage in one stop.',
    start: { omamori: ['carpStreamer'] },
    modifiers: { yakuMult: 2, spiritHp: 1.5 },
    hue: 20,
  },
];

export function deckDef(id: DeckId): DeckDef {
  const d = DECKS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown deck ${id}`);
  return d;
}

export interface OmenDef {
  readonly level: number;
  readonly name: string;
  readonly kanji: string;
  readonly text: string;
  readonly hpMult?: number;
  readonly ferocityMult?: number;
  readonly priceDelta?: number;
  readonly healMult?: number;
  readonly spiritLeads?: boolean;
  readonly startHpDelta?: number;
}

/** Difficulty levels. Each includes every level below it. */
export const OMENS: readonly OmenDef[] = [
  { level: 0, name: 'Clear Sky', kanji: '晴', text: 'The year as it is meant to be played.' },
  { level: 1, name: 'Clouds', kanji: '曇', text: 'Spirits have 20% more HP.', hpMult: 1.2 },
  { level: 2, name: 'Rain', kanji: '雨', text: 'Spirits hit 25% harder.', ferocityMult: 1.25 },
  {
    level: 3,
    name: 'Storm',
    kanji: '嵐',
    text: 'Everything in the shop costs 1 more, and healing is halved.',
    priceDelta: 1,
    healMult: 0.5,
  },
  { level: 4, name: 'Typhoon', kanji: '颱', text: 'Spirits lead every hand.', spiritLeads: true },
  {
    level: 5,
    name: 'Eclipse',
    kanji: '蝕',
    text: 'You start the year with 10 less HP.',
    startHpDelta: -10,
  },
];

export interface OmenEffects {
  hpMult: number;
  ferocityMult: number;
  priceDelta: number;
  healMult: number;
  spiritLeads: boolean;
  startHpDelta: number;
}

export function omenEffects(level: number): OmenEffects {
  const out: OmenEffects = {
    hpMult: 1,
    ferocityMult: 1,
    priceDelta: 0,
    healMult: 1,
    spiritLeads: false,
    startHpDelta: 0,
  };
  for (const o of OMENS) {
    if (o.level > level) break;
    if (o.hpMult) out.hpMult *= o.hpMult;
    if (o.ferocityMult) out.ferocityMult *= o.ferocityMult;
    if (o.priceDelta) out.priceDelta += o.priceDelta;
    if (o.healMult) out.healMult *= o.healMult;
    if (o.spiritLeads) out.spiritLeads = true;
    if (o.startHpDelta) out.startHpDelta += o.startHpDelta;
  }
  return out;
}
