/**
 * Card enhancements, bought at the shrine in the shop and applied to a card in the
 * run deck. The deck is shared with the spirit, so an enhanced card is also a
 * card worth fighting over: scoring bonuses only ever help you, but rule effects
 * (Inked matching, Torn counting) help whoever holds the card.
 */
import type { EnhancementId } from '@/engine/types';
import type { LandText } from './lands';

export interface EnhancementDef {
  readonly id: EnhancementId;
  readonly name: string;
  readonly kanji: string;
  readonly text: LandText;
  readonly price: number;
  readonly rarity: 'common' | 'uncommon' | 'rare';
  readonly chips?: number;
  readonly mult?: number;
  readonly xmult?: number;
  readonly retrigger?: number;
  readonly mon?: number;
}

export const ENHANCEMENTS: readonly EnhancementDef[] = [
  {
    id: 'gilded',
    name: 'Gilded',
    kanji: '金',
    text: '+20 Chips when it scores.',
    price: 4,
    rarity: 'common',
    chips: 20,
  },
  {
    id: 'blessed',
    name: 'Blessed',
    kanji: '祝',
    text: '+4 Mult when it scores.',
    price: 4,
    rarity: 'common',
    mult: 4,
  },
  {
    id: 'lacquered',
    name: 'Lacquered',
    kanji: '漆',
    text: 'Scores twice.',
    price: 5,
    rarity: 'uncommon',
    retrigger: 1,
  },
  {
    id: 'inked',
    name: 'Inked',
    kanji: '墨',
    text: "Also matches the next month's cards.",
    price: 5,
    rarity: 'uncommon',
  },
  {
    id: 'torn',
    name: 'Torn',
    kanji: '破',
    text: (t) =>
      `Counts double toward ${t.y.tane}, ${t.y.tan} and ${t.y.kasu}. Crumbles after it scores for you.`,
    price: 3,
    rarity: 'common',
  },
  {
    id: 'lucky',
    name: 'Lucky',
    kanji: '福',
    text: 'Earn 3 mon whenever you capture it.',
    price: 4,
    rarity: 'common',
    mon: 3,
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    kanji: '月',
    text: '×1.5 Mult when it scores.',
    price: 7,
    rarity: 'rare',
    xmult: 1.5,
  },
];

const BY_ID = new Map<EnhancementId, EnhancementDef>(ENHANCEMENTS.map((d) => [d.id, d]));

export function enhancementDef(id: EnhancementId): EnhancementDef {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown enhancement ${id}`);
  return d;
}
