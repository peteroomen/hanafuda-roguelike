/**
 * Yaku (scoring patterns) as data. The detection logic lives in @/engine/yaku and
 * reads its thresholds, points and scaling from here, so balance tuning never
 * needs a code change.
 */
import type { Land } from './cards';

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
}

/** How a yaku reads in one land. The numbers above are shared by every land. */
export interface YakuText {
  /**
   * The yaku's name everywhere in the game: in Nippon its Japanese name in English letters
   * (Sankō, Tan), in Aotearoa its Te Reo name (Te Pō, Kōkōwai). Card types stay English
   * (Brights, Ribbons), and kanji are decoration only.
   */
  readonly name: string;
  /** What the name means, in English. Shown once, as a subtitle (yaku book, poem details). */
  readonly gloss: string;
  /** Decoration. Empty in Aotearoa, which shows a little kiwi instead. */
  readonly kanji: string;
  readonly requirement: string;
  /** An original haiku shown on this yaku's Poem. */
  readonly haiku: readonly [string, string, string];
}

export const YAKU: readonly YakuDef[] = [
  {
    id: 'goko',
    family: 'brights',
    points: 10,
    perExtra: 0,
    need: 5,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 40, mult: 4 },
  },
  {
    id: 'shiko',
    family: 'brights',
    points: 8,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 35, mult: 3 },
  },
  {
    id: 'ameShiko',
    family: 'brights',
    points: 7,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 30, mult: 3 },
  },
  {
    id: 'sanko',
    family: 'brights',
    points: 5,
    perExtra: 0,
    need: 3,
    baseChips: 0,
    group: 'brights',
    poem: { chips: 30, mult: 2 },
  },
  {
    id: 'tsukimi',
    family: 'sake',
    points: 5,
    perExtra: 0,
    need: 2,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
  },
  {
    id: 'hanami',
    family: 'sake',
    points: 5,
    perExtra: 0,
    need: 2,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
  },
  {
    id: 'inoshikacho',
    family: 'animals',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
  },
  {
    id: 'akaao',
    family: 'ribbons',
    points: 10,
    perExtra: 1,
    need: 6,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 25, mult: 3 },
  },
  {
    id: 'akatan',
    family: 'ribbons',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 15, mult: 2 },
  },
  {
    id: 'aotan',
    family: 'ribbons',
    points: 5,
    perExtra: 1,
    need: 3,
    baseChips: 0,
    group: 'poetry',
    poem: { chips: 15, mult: 2 },
  },
  {
    id: 'tane',
    family: 'animals',
    points: 1,
    perExtra: 1,
    need: 5,
    baseChips: 10,
    poem: { chips: 15, mult: 1 },
  },
  {
    id: 'tan',
    family: 'ribbons',
    points: 1,
    perExtra: 1,
    need: 5,
    baseChips: 15,
    poem: { chips: 15, mult: 1 },
  },
  {
    id: 'kasu',
    family: 'chaff',
    points: 1,
    perExtra: 1,
    need: 10,
    baseChips: 20,
    poem: { chips: 12, mult: 1 },
  },
  {
    id: 'tsukifuda',
    family: 'month',
    points: 4,
    perExtra: 0,
    need: 4,
    baseChips: 0,
    poem: { chips: 20, mult: 2 },
  },
];

/**
 * The Te Reo names are drafts (see docs/work/2026-09-26-aotearoa-deck.md) and should be checked
 * by a fluent speaker. Te Pō, Kōkōwai and Pounamu come from the deck's designer.
 */
const YAKU_TEXT: Record<Land, Record<YakuId, YakuText>> = {
  nippon: {
    goko: {
      name: 'Gokō',
      gloss: 'Five Brights',
      kanji: '五光',
      requirement: 'All 5 Brights',
      haiku: [
        'five lights in the dark',
        'crane, curtain, moon, rain, phoenix',
        'the whole year is lit',
      ],
    },
    shiko: {
      name: 'Shikō',
      gloss: 'Four Brights',
      kanji: '四光',
      requirement: '4 Brights, without the Rain Man',
      haiku: [
        'four lamps on the path',
        'the fifth one lost in the rain',
        'still, the road is bright',
      ],
    },
    ameShiko: {
      name: 'Ame-Shikō',
      gloss: 'Rainy Four Brights',
      kanji: '雨四光',
      requirement: '4 Brights, including the Rain Man',
      haiku: ['rain on the willow', 'three lamps and one soaked stranger', 'glowing all the same'],
    },
    sanko: {
      name: 'Sankō',
      gloss: 'Three Brights',
      kanji: '三光',
      requirement: '3 Brights, without the Rain Man',
      haiku: ['three lights in the room', 'enough to read by, and more', 'than enough to win'],
    },
    tsukimi: {
      name: 'Tsukimi-zake',
      gloss: 'Moon Viewing',
      kanji: '月見酒',
      requirement: 'Full Moon + Sake Cup',
      haiku: ['the moon in my cup', 'I drink it slowly, and still', 'it is in the sky'],
    },
    hanami: {
      name: 'Hanami-zake',
      gloss: 'Flower Viewing',
      kanji: '花見酒',
      requirement: 'Curtain + Sake Cup',
      haiku: ['blossoms in the cup', 'who can say which of us two', 'is drunk on the spring'],
    },
    inoshikacho: {
      name: 'Ino-Shika-Chō',
      gloss: 'Boar, Deer, Butterflies',
      kanji: '猪鹿蝶',
      requirement: 'Boar + Deer + Butterflies. +1 per extra Animal',
      haiku: ['boar in the clover', 'deer beneath the maple leaves', 'butterflies, and me'],
    },
    akaao: {
      name: 'Akatan-Aotan',
      gloss: 'Red and Blue Ribbons',
      kanji: '赤短青短',
      requirement: '3 red poetry + 3 blue ribbons. +1 per extra Ribbon',
      haiku: ['red ink and blue ink', 'the whole poem written out', 'nothing left to say'],
    },
    akatan: {
      name: 'Akatan',
      gloss: 'Red Poetry Ribbons',
      kanji: '赤短',
      requirement: '3 red poetry ribbons. +1 per extra Ribbon',
      haiku: ['three red poems tied', 'to three branches in the wind', 'each says: it is good'],
    },
    aotan: {
      name: 'Aotan',
      gloss: 'Blue Ribbons',
      kanji: '青短',
      requirement: '3 blue ribbons. +1 per extra Ribbon',
      haiku: ['blue ribbons, dyed deep', 'peony, chrysanthemum,', 'the last maple leaf'],
    },
    tane: {
      name: 'Tane',
      gloss: 'Animals',
      kanji: 'タネ',
      requirement: 'Any 5 Animals. +1 per extra',
      haiku: ['cuckoo, geese, swallow', 'every creature of the year', 'comes home to my hand'],
    },
    tan: {
      name: 'Tan',
      gloss: 'Ribbons',
      kanji: 'タン',
      requirement: 'Any 5 Ribbons. +1 per extra',
      haiku: ['ribbons on the trees', 'each one a wish someone tied', 'I keep all of them'],
    },
    kasu: {
      name: 'Kasu',
      gloss: 'Chaff',
      kanji: 'カス',
      requirement: 'Any 10 Chaff. +1 per extra',
      haiku: ['leaves swept from the step', 'into a small humble pile', 'even these have worth'],
    },
    tsukifuda: {
      name: 'Tsukifuda',
      gloss: 'Month Cards',
      kanji: '月札',
      requirement: "All 4 cards of this fight's month",
      haiku: ['all four of the month', 'flower, ribbon, leaf and stem', 'a season in hand'],
    },
  },
  aotearoa: {
    goko: {
      name: 'Mārama e Rima',
      gloss: 'Five Brights',
      kanji: '',
      requirement: 'All 5 Brights',
      haiku: [
        'five lights over the land',
        'kōtuku, moon, stars, rain, kōwhai',
        'the whole year is lit',
      ],
    },
    shiko: {
      name: 'Mārama e Whā',
      gloss: 'Four Brights',
      kanji: '',
      requirement: '4 Brights, without Ua',
      haiku: [
        'four lamps on the track',
        'the fifth one lost in the rain',
        'still, the road is bright',
      ],
    },
    ameShiko: {
      name: 'Ua me ngā Mārama',
      gloss: 'Rainy Four Brights',
      kanji: '',
      requirement: '4 Brights, including Ua',
      haiku: ['rain on the fuchsia', 'a frog sings with the bright ones', 'glowing all the same'],
    },
    sanko: {
      name: 'Mārama e Toru',
      gloss: 'Three Brights',
      kanji: '',
      requirement: '3 Brights, without Ua',
      haiku: ['three lights in the whare', 'enough to read by, and more', 'than enough to win'],
    },
    tsukimi: {
      name: 'Mātakitaki Marama',
      gloss: 'Moon Viewing',
      kanji: '',
      requirement: 'Full Moon + Kete of Pipi',
      haiku: ['full moon on the toetoe', 'pipi shells tipped from the kete', 'we eat by its light'],
    },
    hanami: {
      name: 'Mātakitaki Kōwhai',
      gloss: 'Kōwhai Viewing',
      kanji: '',
      requirement: 'Kōwhai in Bloom + Kete of Pipi',
      haiku: ['kōwhai in the sun', 'the tūī drunk on nectar', 'and so, maybe, me'],
    },
    inoshikacho: {
      name: 'Te Pō',
      gloss: 'The Night',
      kanji: '',
      requirement: 'Kiwi + Ruru + Wētā. +1 per extra Animal',
      haiku: ['kiwi in the fern', 'ruru calling, wētā creaking', 'the night is awake'],
    },
    akaao: {
      name: 'Kōkōwai-Pounamu',
      gloss: 'Ochre and Greenstone Ribbons',
      kanji: '',
      requirement: '3 kōkōwai + 3 pounamu ribbons. +1 per extra Ribbon',
      haiku: ['red ochre, greenstone', 'the whole poem written out', 'nothing left to say'],
    },
    akatan: {
      name: 'Kōkōwai',
      gloss: 'Red Ochre Ribbons',
      kanji: '',
      requirement: '3 kōkōwai ribbons. +1 per extra Ribbon',
      haiku: ['three red ribbons tied', 'to three branches in the wind', 'each says: tino pai'],
    },
    aotan: {
      name: 'Pounamu',
      gloss: 'Greenstone Ribbons',
      kanji: '',
      requirement: '3 pounamu ribbons. +1 per extra Ribbon',
      haiku: ['greenstone ribbons hang', 'from karaka, kahikatea', 'and the black tree fern'],
    },
    tane: {
      name: 'Kararehe',
      gloss: 'Animals',
      kanji: '',
      requirement: 'Any 5 Animals. +1 per extra',
      haiku: ['kea, kuaka, tūī', 'every creature of the year', 'comes home to my hand'],
    },
    tan: {
      name: 'Rīpene',
      gloss: 'Ribbons',
      kanji: '',
      requirement: 'Any 5 Ribbons. +1 per extra',
      haiku: ['ribbons on the trees', 'each one a wish someone tied', 'I keep all of them'],
    },
    kasu: {
      name: 'Otaota',
      gloss: 'Chaff',
      kanji: '',
      requirement: 'Any 10 Chaff. +1 per extra',
      haiku: ['leaves swept from the step', 'into a small humble pile', 'even these have worth'],
    },
    tsukifuda: {
      name: 'Te Marama Katoa',
      gloss: 'The Whole Month',
      kanji: '',
      requirement: "All 4 cards of this fight's month",
      haiku: ['all four of the month', 'flower, ribbon, leaf and stem', 'a season in hand'],
    },
  },
};

export function yakuText(id: YakuId, land: Land): YakuText {
  return YAKU_TEXT[land][id];
}

/** Every yaku's name in one land, for text templates ("{name} needs only 4 Ribbons"). */
export function yakuNames(land: Land): Record<YakuId, string> {
  const t = YAKU_TEXT[land];
  return Object.fromEntries(YAKU_IDS.map((id) => [id, t[id].name])) as Record<YakuId, string>;
}

const BY_ID = new Map<YakuId, YakuDef>(YAKU.map((y) => [y.id, y]));

export function yakuDef(id: YakuId): YakuDef {
  const y = BY_ID.get(id);
  if (!y) throw new Error(`Unknown yaku ${id}`);
  return y;
}

export const YAKU_IDS: readonly YakuId[] = YAKU.map((y) => y.id);
