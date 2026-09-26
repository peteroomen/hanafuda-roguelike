/**
 * The 48-card Hanafuda decks as data, one per land.
 *
 * Card ids are base + (month - 1) * 4 + slot, with base 0 for Nippon and 48 for Aotearoa. Within a month the special cards come
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

/**
 * A land is a whole card set: its own 48 cards, month flowers and names. The rules are the same
 * in every land. Nippon is the traditional deck; Aotearoa is redrawn with New Zealand plants and
 * birds, and some of its special cards sit in other months.
 */
export type Land = 'nippon' | 'aotearoa';
export const LANDS: readonly Land[] = ['nippon', 'aotearoa'];

export interface CardDef {
  readonly id: CardId;
  readonly land: Land;
  readonly month: Month;
  readonly type: CardType;
  /**
   * Role tags. They name the traditional card a card plays the part of (the Aotearoa kiwi carries
   * 'boar'), so yaku, charms and decks work the same in every land.
   */
  readonly tags: readonly CardTag[];
  /** Display name, e.g. "Crane and Sun" or "Pine". */
  readonly name: string;
  /** Which chaff of the month this is (1-based), for art variation. 0 for non-chaff. */
  readonly variant: number;
}

export interface MonthDef {
  readonly month: Month;
  readonly flower: string;
  /** The month's other name: the flower in Japanese (Matsu), or the month in Te Reo (Kohitātea). */
  readonly native: string;
  /** Kanji, as decoration. Empty in Aotearoa, which shows a little kiwi instead. */
  readonly kanji: string;
  /** For the sky and the music. The spirit schedule always follows the year's quarters. */
  readonly season: Season;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const NIPPON_MONTHS: readonly MonthDef[] = [
  { month: 1, flower: 'Pine', native: 'Matsu', kanji: '松', season: 'spring' },
  { month: 2, flower: 'Plum', native: 'Ume', kanji: '梅', season: 'spring' },
  { month: 3, flower: 'Cherry', native: 'Sakura', kanji: '桜', season: 'spring' },
  { month: 4, flower: 'Wisteria', native: 'Fuji', kanji: '藤', season: 'summer' },
  { month: 5, flower: 'Iris', native: 'Ayame', kanji: '菖', season: 'summer' },
  { month: 6, flower: 'Peony', native: 'Botan', kanji: '牡丹', season: 'summer' },
  { month: 7, flower: 'Bush Clover', native: 'Hagi', kanji: '萩', season: 'autumn' },
  { month: 8, flower: 'Susuki Grass', native: 'Susuki', kanji: '芒', season: 'autumn' },
  { month: 9, flower: 'Chrysanthemum', native: 'Kiku', kanji: '菊', season: 'autumn' },
  { month: 10, flower: 'Maple', native: 'Momiji', kanji: '紅葉', season: 'winter' },
  { month: 11, flower: 'Willow', native: 'Yanagi', kanji: '柳', season: 'winter' },
  { month: 12, flower: 'Paulownia', native: 'Kiri', kanji: '桐', season: 'winter' },
];

/** The NZ calendar: January is high summer. Month names are the standard modern Te Reo names. */
const AOTEAROA_MONTHS: readonly MonthDef[] = [
  { month: 1, flower: 'Pōhutukawa', native: 'Kohitātea', kanji: '', season: 'summer' },
  { month: 2, flower: 'Mānuka', native: 'Hui-tanguru', kanji: '', season: 'summer' },
  { month: 3, flower: 'Toetoe', native: 'Poutū-te-rangi', kanji: '', season: 'autumn' },
  { month: 4, flower: 'Karaka', native: 'Paenga-whāwhā', kanji: '', season: 'autumn' },
  { month: 5, flower: 'Kahikatea', native: 'Haratua', kanji: '', season: 'autumn' },
  { month: 6, flower: 'Pūriri', native: 'Pipiri', kanji: '', season: 'winter' },
  { month: 7, flower: 'Tawhai', native: 'Hōngongoi', kanji: '', season: 'winter' },
  { month: 8, flower: 'Kōtukutuku', native: 'Here-turi-kōkā', kanji: '', season: 'winter' },
  { month: 9, flower: 'Kōwhai', native: 'Mahuru', kanji: '', season: 'spring' },
  { month: 10, flower: 'Mamaku', native: 'Whiringa-ā-nuku', kanji: '', season: 'spring' },
  { month: 11, flower: 'Tī kōuka', native: 'Whiringa-ā-rangi', kanji: '', season: 'spring' },
  { month: 12, flower: 'Harakeke', native: 'Hakihea', kanji: '', season: 'summer' },
];

const MONTHS_BY_LAND: Record<Land, readonly MonthDef[]> = {
  nippon: NIPPON_MONTHS,
  aotearoa: AOTEAROA_MONTHS,
};

/** Month numbers 1..12, for loops that only need the number. */
export const MONTH_NUMBERS: readonly Month[] = NIPPON_MONTHS.map((m) => m.month);

interface Spec {
  type: CardType;
  name?: string;
  tags?: CardTag[];
}

type Layout = Record<Month, [Spec, Spec, Spec, Spec]>;

const chaff: Spec = { type: 'chaff' };
const redPoetry: Spec = { type: 'ribbon', name: 'Red Poetry Ribbon', tags: ['redPoetry'] };
const blue: Spec = { type: 'ribbon', name: 'Blue Ribbon', tags: ['blueRibbon'] };
const plainRed: Spec = { type: 'ribbon', name: 'Red Ribbon', tags: ['plainRed'] };

const NIPPON: Layout = {
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

/** Kōkōwai (red ochre) ribbons stand in for the red poetry ribbons, pounamu for the blue. */
const kokowai: Spec = { type: 'ribbon', name: 'Kōkōwai Ribbon', tags: ['redPoetry'] };
const pounamu: Spec = { type: 'ribbon', name: 'Pounamu Ribbon', tags: ['blueRibbon'] };

/**
 * The Aotearoa deck. Te Pō (kiwi, ruru, wētā: all three nocturnal) takes the part of
 * Ino-Shika-Chō, so the three carry the boar, deer and butterflies roles.
 */
const AOTEAROA: Layout = {
  1: [{ type: 'bright', name: 'Kōtuku and Sun', tags: ['crane', 'bird'] }, kokowai, chaff, chaff],
  2: [{ type: 'animal', name: 'Korimako', tags: ['warbler', 'bird'] }, kokowai, chaff, chaff],
  3: [
    { type: 'bright', name: 'Full Moon', tags: ['moon'] },
    { type: 'animal', name: 'Kuaka', tags: ['geese', 'bird'] },
    chaff,
    chaff,
  ],
  4: [{ type: 'animal', name: 'Kete of Pipi', tags: ['sakeCup'] }, pounamu, chaff, chaff],
  5: [{ type: 'animal', name: 'Ruru', tags: ['deer', 'bird'] }, pounamu, chaff, chaff],
  6: [{ type: 'bright', name: 'Matariki', tags: ['phoenix'] }, chaff, chaff, chaff],
  7: [{ type: 'animal', name: 'Kea', tags: ['cuckoo', 'bird'] }, plainRed, chaff, chaff],
  8: [
    { type: 'bright', name: 'Ua', tags: ['rainMan'] },
    { type: 'animal', name: 'Pīwakawaka', tags: ['swallow', 'bird'] },
    plainRed,
    { type: 'chaff', name: 'Storm', tags: ['lightning'] },
  ],
  9: [{ type: 'bright', name: 'Kōwhai in Bloom', tags: ['curtain'] }, kokowai, chaff, chaff],
  10: [{ type: 'animal', name: 'Kiwi', tags: ['boar', 'bird'] }, pounamu, chaff, chaff],
  11: [{ type: 'animal', name: 'Wētā', tags: ['butterflies'] }, plainRed, chaff, chaff],
  12: [{ type: 'animal', name: 'Tūī', tags: ['bridge', 'bird'] }, plainRed, chaff, chaff],
};

const LAYOUTS: Record<Land, Layout> = { nippon: NIPPON, aotearoa: AOTEAROA };

/** Each land's cards take the next 48 ids: Nippon 0..47, Aotearoa 48..95. */
const LAND_BASE: Record<Land, number> = { nippon: 0, aotearoa: 48 };

function buildDeck(land: Land): CardDef[] {
  const out: CardDef[] = [];
  for (const m of MONTHS_BY_LAND[land]) {
    const specs = LAYOUTS[land][m.month];
    let chaffVariant = 0;
    specs.forEach((spec, slot) => {
      const isPlainChaff = spec.type === 'chaff' && !spec.name;
      if (spec.type === 'chaff') chaffVariant += 1;
      out.push({
        id: LAND_BASE[land] + (m.month - 1) * 4 + slot,
        land,
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

/**
 * Every card of every land, indexed by id. Look cards up here; to walk one land's deck use
 * landCards(land), never this table.
 */
export const ALL_CARDS: readonly CardDef[] = LANDS.flatMap(buildDeck);

const BY_LAND: Record<Land, readonly CardDef[]> = {
  nippon: ALL_CARDS.filter((c) => c.land === 'nippon'),
  aotearoa: ALL_CARDS.filter((c) => c.land === 'aotearoa'),
};

export function landCards(land: Land): readonly CardDef[] {
  return BY_LAND[land];
}

export function landCardIds(land: Land): CardId[] {
  return BY_LAND[land].map((c) => c.id);
}

export function card(id: CardId): CardDef {
  const c = ALL_CARDS[id];
  if (!c) throw new Error(`Unknown card id ${id}`);
  return c;
}

export function landMonths(land: Land): readonly MonthDef[] {
  return MONTHS_BY_LAND[land];
}

export function monthDef(month: Month, land: Land): MonthDef {
  return MONTHS_BY_LAND[land][month - 1] as MonthDef;
}

export function hasTag(id: CardId, tag: CardTag): boolean {
  return card(id).tags.includes(tag);
}

/** Find a land's single card carrying a unique role tag (e.g. 'moon'). */
export function cardWithTag(tag: CardTag, land: Land): CardId {
  const c = BY_LAND[land].find((d) => d.tags.includes(tag));
  if (!c) throw new Error(`No ${land} card with tag ${tag}`);
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
  const pre = c.land === 'nippon' ? '' : `${c.land}-`;
  return pre + (c.type === 'chaff' ? `m${m}-chaff${c.variant}` : `m${m}-${c.type}`);
}

export function monthOf(id: CardId): Month {
  return card(id).month;
}

export function seasonOf(month: Month, land: Land): Season {
  return monthDef(month, land).season;
}

export function nextMonth(month: Month): Month {
  return (month === 12 ? 1 : month + 1) as Month;
}
