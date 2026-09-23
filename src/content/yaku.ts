/**
 * Yaku (scoring patterns) as data. The detection logic lives in @/engine/yaku and
 * reads its thresholds, points and scaling from here, so balance tuning never
 * needs a code change.
 */

export type YakuId =
  | 'goko'
  | 'shiko'
  | 'ameShiko'
  | 'sanko'
  | 'tsukimi'
  | 'hanami'
  | 'inoshikacho'
  | 'akaao'
  | 'akatan'
  | 'aotan'
  | 'tane'
  | 'tan'
  | 'kasu'
  | 'tsukifuda';

export type YakuFamily = 'brights' | 'sake' | 'animals' | 'ribbons' | 'chaff' | 'month';

export interface YakuDef {
  readonly id: YakuId;
  readonly name: string;
  readonly romaji: string;
  readonly kanji: string;
  readonly requirement: string;
  readonly family: YakuFamily;
  /** Base yaku points (the traditional score). Becomes mult when you stop. */
  readonly points: number;
  /** Extra points per card beyond the requirement. */
  readonly perExtra: number;
  /** Cards needed (count yaku) or set size (set yaku). */
  readonly need: number;
  /** Flat chips added when this yaku scores (balance lever for the count yaku). */
  readonly baseChips: number;
  /** Only the best yaku of an exclusive group scores. */
  readonly group?: 'brights' | 'poetry';
  /** What one Poem level adds when this yaku scores. */
  readonly poem: { readonly chips: number; readonly mult: number };
  /** An original haiku shown on this yaku's Poem. */
  readonly haiku: readonly [string, string, string];
}

export const YAKU: readonly YakuDef[] = [
  {
    id: 'goko',
    name: 'Five Brights',
    romaji: 'Gokō',
    kanji: '五光',
    requirement: 'All 5 Brights',
    family: 'brights',
    points: 10,
    perExtra: 0,
    need: 5,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 40, mult: 4 },
    haiku: [
      'five lights in the dark',
      'crane, curtain, moon, rain, phoenix',
      'the whole year is lit',
    ],
  },
  {
    id: 'shiko',
    name: 'Four Brights',
    romaji: 'Shikō',
    kanji: '四光',
    requirement: '4 Brights, without the Rain Man',
    family: 'brights',
    points: 8,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 35, mult: 3 },
    haiku: [
      'four lamps on the path',
      'the fifth one lost in the rain',
      'still, the road is bright',
    ],
  },
  {
    id: 'ameShiko',
    name: 'Rainy Four',
    romaji: 'Ame-Shikō',
    kanji: '雨四光',
    requirement: '4 Brights, including the Rain Man',
    family: 'brights',
    points: 7,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 30, mult: 3 },
    haiku: ['rain on the willow', 'three lamps and one soaked stranger', 'glowing all the same'],
  },
  {
    id: 'sanko',
    name: 'Three Brights',
    romaji: 'Sankō',
    kanji: '三光',
    requirement: '3 Brights, without the Rain Man',
    family: 'brights',
    points: 5,
    perExtra: 0,
    need: 3,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 30, mult: 2 },
    haiku: ['three lights in the room', 'enough to read by, and more', 'than enough to win'],
  },
  {
    id: 'tsukimi',
    name: 'Moon Viewing',
    romaji: 'Tsukimi-zake',
    kanji: '月見酒',
    requirement: 'Full Moon + Sake Cup',
    family: 'sake',
    points: 5,
    perExtra: 0,
    need: 2,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
    haiku: ['the moon in my cup', 'I drink it slowly, and still', 'it is in the sky'],
  },
  {
    id: 'hanami',
    name: 'Flower Viewing',
    romaji: 'Hanami-zake',
    kanji: '花見酒',
    requirement: 'Curtain + Sake Cup',
    family: 'sake',
    points: 5,
    perExtra: 0,
    need: 2,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
    haiku: ['blossoms in the cup', 'who can say which of us two', 'is drunk on the spring'],
  },
  {
    id: 'inoshikacho',
    name: 'Boar, Deer, Butterflies',
    romaji: 'Inoshikachō',
    kanji: '猪鹿蝶',
    requirement: 'Boar + Deer + Butterflies. +1 per extra Animal',
    family: 'animals',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
    haiku: ['boar in the clover', 'deer beneath the maple leaves', 'butterflies, and me'],
  },
  {
    id: 'akaao',
    name: 'Red and Blue Poems',
    romaji: 'Akatan-Aotan',
    kanji: '赤短青短',
    requirement: '3 red poetry + 3 blue ribbons. +1 per extra Ribbon',
    family: 'ribbons',
    points: 10,
    perExtra: 1,
    need: 6,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 25, mult: 3 },
    haiku: ['red ink and blue ink', 'the whole poem written out', 'nothing left to say'],
  },
  {
    id: 'akatan',
    name: 'Red Poems',
    romaji: 'Akatan',
    kanji: '赤短',
    requirement: '3 red poetry ribbons. +1 per extra Ribbon',
    family: 'ribbons',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 15, mult: 2 },
    haiku: ['three red poems tied', 'to three branches in the wind', 'each says: it is good'],
  },
  {
    id: 'aotan',
    name: 'Blue Ribbons',
    romaji: 'Aotan',
    kanji: '青短',
    requirement: '3 blue ribbons. +1 per extra Ribbon',
    family: 'ribbons',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 15, mult: 2 },
    haiku: ['blue ribbons, dyed deep', 'peony, chrysanthemum,', 'the last maple leaf'],
  },
  {
    id: 'tane',
    name: 'Animals',
    romaji: 'Tane',
    kanji: 'タネ',
    requirement: 'Any 5 Animals. +1 per extra',
    family: 'animals',
    points: 1,
    perExtra: 1,
    need: 5,
    baseChips: 10,
    poem: { chips: 15, mult: 1 },
    haiku: ['cuckoo, geese, swallow', 'every creature of the year', 'comes home to my hand'],
  },
  {
    id: 'tan',
    name: 'Ribbons',
    romaji: 'Tan',
    kanji: 'タン',
    requirement: 'Any 5 Ribbons. +1 per extra',
    family: 'ribbons',
    points: 1,
    perExtra: 1,
    need: 5,
    baseChips: 15,
    poem: { chips: 15, mult: 1 },
    haiku: ['ribbons on the trees', 'each one a wish someone tied', 'I keep all of them'],
  },
  {
    id: 'kasu',
    name: 'Chaff',
    romaji: 'Kasu',
    kanji: 'カス',
    requirement: 'Any 10 Chaff. +1 per extra',
    family: 'chaff',
    points: 1,
    perExtra: 1,
    need: 10,
    baseChips: 20,
    poem: { chips: 12, mult: 1 },
    haiku: ['leaves swept from the step', 'into a small humble pile', 'even these have worth'],
  },
  {
    id: 'tsukifuda',
    name: 'Month Cards',
    romaji: 'Tsukifuda',
    kanji: '月札',
    requirement: "All 4 cards of this fight's month",
    family: 'month',
    points: 4,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
    haiku: ['all four of the month', 'flower, ribbon, leaf and stem', 'a season in hand'],
  },
];

const BY_ID = new Map<YakuId, YakuDef>(YAKU.map((y) => [y.id, y]));

export function yakuDef(id: YakuId): YakuDef {
  const y = BY_ID.get(id);
  if (!y) throw new Error(`Unknown yaku ${id}`);
  return y;
}

export const YAKU_IDS: readonly YakuId[] = YAKU.map((y) => y.id);
