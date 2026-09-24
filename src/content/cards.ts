/**
 * The 48-card Hanafuda deck as data.
 *
 * Card ids are 0..47: (month - 1) * 4 + slot. Within a month the special cards come
 * first (Bright / Animal, then Ribbon), then the Chaff. The composition follows the
 * standard Koi-Koi deck: 5 Brights, 9 Animals, 10 Ribbons (3 red poetry, 3 blue,
 * 4 plain red) and 24 Chaff.
 */

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CardId = number;
export type CardType = 'bright' | 'animal' | 'ribbon' | 'chaff';

export type CardTag =
  | 'crane'
  | 'curtain'
  | 'moon'
  | 'rainMan'
  | 'phoenix'
  | 'warbler'
  | 'cuckoo'
  | 'bridge'
  | 'butterflies'
  | 'boar'
  | 'geese'
  | 'sakeCup'
  | 'deer'
  | 'swallow'
  | 'lightning'
  | 'redPoetry'
  | 'blueRibbon'
  | 'plainRed'
  | 'bird';

export interface CardDef {
  readonly id: CardId;
  readonly month: Month;
  readonly type: CardType;
  readonly tags: readonly CardTag[];
  /** Display name, e.g. "Crane and Sun" or "Pine". */
  readonly name: string;
  /** Which chaff of the month this is (1-based), for art variation. 0 for non-chaff. */
  readonly variant: number;
}

export interface MonthDef {
  readonly month: Month;
  readonly flower: string;
  readonly flowerJp: string;
  readonly kanji: string;
  readonly season: Season;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const MONTHS: readonly MonthDef[] = [
  { month: 1, flower: 'Pine', flowerJp: 'Matsu', kanji: '松', season: 'spring' },
  { month: 2, flower: 'Plum', flowerJp: 'Ume', kanji: '梅', season: 'spring' },
  { month: 3, flower: 'Cherry', flowerJp: 'Sakura', kanji: '桜', season: 'spring' },
  { month: 4, flower: 'Wisteria', flowerJp: 'Fuji', kanji: '藤', season: 'summer' },
  { month: 5, flower: 'Iris', flowerJp: 'Ayame', kanji: '菖', season: 'summer' },
  { month: 6, flower: 'Peony', flowerJp: 'Botan', kanji: '牡丹', season: 'summer' },
  { month: 7, flower: 'Bush Clover', flowerJp: 'Hagi', kanji: '萩', season: 'autumn' },
  { month: 8, flower: 'Susuki Grass', flowerJp: 'Susuki', kanji: '芒', season: 'autumn' },
  { month: 9, flower: 'Chrysanthemum', flowerJp: 'Kiku', kanji: '菊', season: 'autumn' },
  { month: 10, flower: 'Maple', flowerJp: 'Momiji', kanji: '紅葉', season: 'winter' },
  { month: 11, flower: 'Willow', flowerJp: 'Yanagi', kanji: '柳', season: 'winter' },
  { month: 12, flower: 'Paulownia', flowerJp: 'Kiri', kanji: '桐', season: 'winter' },
];

interface Spec {
  type: CardType;
  name?: string;
  tags?: CardTag[];
}

const chaff: Spec = { type: 'chaff' };
const redPoetry: Spec = { type: 'ribbon', name: 'Red Poetry Ribbon', tags: ['redPoetry'] };
const blue: Spec = { type: 'ribbon', name: 'Blue Ribbon', tags: ['blueRibbon'] };
const plainRed: Spec = { type: 'ribbon', name: 'Red Ribbon', tags: ['plainRed'] };

const LAYOUT: Record<Month, [Spec, Spec, Spec, Spec]> = {
  1: [{ type: 'bright', name: 'Crane and Sun', tags: ['crane', 'bird'] }, redPoetry, chaff, chaff],
  2: [{ type: 'animal', name: 'Bush Warbler', tags: ['warbler', 'bird'] }, redPoetry, chaff, chaff],
  3: [{ type: 'bright', name: 'Curtain', tags: ['curtain'] }, redPoetry, chaff, chaff],
  4: [{ type: 'animal', name: 'Cuckoo', tags: ['cuckoo', 'bird'] }, plainRed, chaff, chaff],
  5: [{ type: 'animal', name: 'Eight-Plank Bridge', tags: ['bridge'] }, plainRed, chaff, chaff],
  6: [{ type: 'animal', name: 'Butterflies', tags: ['butterflies'] }, blue, chaff, chaff],
  7: [{ type: 'animal', name: 'Boar', tags: ['boar'] }, plainRed, chaff, chaff],
  8: [
    { type: 'bright', name: 'Full Moon', tags: ['moon'] },
    { type: 'animal', name: 'Geese', tags: ['geese', 'bird'] },
    chaff,
    chaff,
  ],
  9: [{ type: 'animal', name: 'Sake Cup', tags: ['sakeCup'] }, blue, chaff, chaff],
  10: [{ type: 'animal', name: 'Deer', tags: ['deer'] }, blue, chaff, chaff],
  11: [
    { type: 'bright', name: 'Rain Man', tags: ['rainMan'] },
    { type: 'animal', name: 'Swallow', tags: ['swallow', 'bird'] },
    plainRed,
    { type: 'chaff', name: 'Lightning', tags: ['lightning'] },
  ],
  12: [{ type: 'bright', name: 'Phoenix', tags: ['phoenix', 'bird'] }, chaff, chaff, chaff],
};

function buildDeck(): CardDef[] {
  const out: CardDef[] = [];
  for (const m of MONTHS) {
    const specs = LAYOUT[m.month];
    let chaffVariant = 0;
    specs.forEach((spec, slot) => {
      const isPlainChaff = spec.type === 'chaff' && !spec.name;
      if (spec.type === 'chaff') chaffVariant += 1;
      out.push({
        id: (m.month - 1) * 4 + slot,
        month: m.month,
        type: spec.type,
        tags: spec.tags ?? [],
        name: isPlainChaff ? m.flower : (spec.name ?? m.flower),
        variant: spec.type === 'chaff' ? chaffVariant : 0,
      });
    });
  }
  return out;
}

export const CARDS: readonly CardDef[] = buildDeck();
export const ALL_CARD_IDS: readonly CardId[] = CARDS.map((c) => c.id);

export function card(id: CardId): CardDef {
  const c = CARDS[id];
  if (!c) throw new Error(`Unknown card id ${id}`);
  return c;
}

export function monthDef(month: Month): MonthDef {
  return MONTHS[month - 1] as MonthDef;
}

export function hasTag(id: CardId, tag: CardTag): boolean {
  return card(id).tags.includes(tag);
}

/** Find the single card carrying a unique tag (e.g. 'moon'). */
export function cardWithTag(tag: CardTag): CardId {
  const c = CARDS.find((d) => d.tags.includes(tag));
  if (!c) throw new Error(`No card with tag ${tag}`);
  return c.id;
}

export const TYPE_LABEL: Record<CardType, string> = {
  bright: 'Bright',
  animal: 'Animal',
  ribbon: 'Ribbon',
  chaff: 'Chaff',
};

export const TYPE_ORDER: Record<CardType, number> = { bright: 0, animal: 1, ribbon: 2, chaff: 3 };

/** Short debug key, e.g. "m08-bright". */
export function cardKey(id: CardId): string {
  const c = card(id);
  const m = String(c.month).padStart(2, '0');
  return c.type === 'chaff' ? `m${m}-chaff${c.variant}` : `m${m}-${c.type}`;
}

export function monthOf(id: CardId): Month {
  return card(id).month;
}

export function seasonOf(month: Month): Season {
  return monthDef(month).season;
}

export function nextMonth(month: Month): Month {
  return (month === 12 ? 1 : month + 1) as Month;
}
