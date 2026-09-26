/**
 * Omamori (charms): the Balatro "joker" layer. Score modifiers across several
 * scaling tiers (+chips, +mult, ×mult, retriggers, rule-changers) and archetypes.
 *
 * Effects are data in a small language interpreted by @/engine/scoring, so the
 * simulator can tune every number without touching logic.
 */
import { cap, type LandText } from './lands';
import type { CardTag, CardType } from './cards';
import type { YakuFamily, YakuId } from './yaku';

export type Rarity = 'common' | 'uncommon' | 'rare';

export type Archetype =
  | 'brights'
  | 'ribbons'
  | 'animals'
  | 'chaff'
  | 'greed'
  | 'season'
  | 'denial'
  | 'sake'
  | 'growth'
  | 'general';

/** Quantities an effect can scale with. */
export type Quantity =
  | 'koikoiCalls'
  | 'month'
  | 'counter'
  | 'capturedChaff'
  | 'capturedRibbons'
  | 'capturedAnimals'
  | 'yakuCount'
  | 'extraChaff';

/** value = base + perUnit × quantity */
export interface Amount {
  readonly base?: number;
  readonly per?: Quantity;
  readonly perUnit?: number;
}

export interface CardFilter {
  readonly type?: CardType;
  readonly tag?: CardTag;
  /** Only cards of the fight's month. */
  readonly currentMonth?: boolean;
  /** Only the single highest-chip scoring card. */
  readonly highest?: boolean;
}

export interface YakuFilter {
  readonly ids?: readonly YakuId[];
  readonly family?: YakuFamily;
}

export interface Condition {
  /** Stopper called koi-koi at least this many times this hand. */
  readonly minKoikoi?: number;
  /** Player HP is below this fraction of max. */
  readonly hpBelow?: number;
  /** The spirit called koi-koi this hand. */
  readonly spiritCalled?: boolean;
}

export interface Bonus {
  readonly chips?: Amount;
  readonly mult?: Amount;
  readonly xmult?: Amount;
}

export type OmamoriEffect =
  | ({ readonly kind: 'card'; readonly filter: CardFilter; readonly retrigger?: number } & Bonus)
  | ({ readonly kind: 'yaku'; readonly filter: YakuFilter } & Bonus)
  | ({ readonly kind: 'stop'; readonly when?: Condition; readonly otherwise?: Bonus } & Bonus)
  | {
      readonly kind: 'rule';
      readonly need?: Partial<Record<YakuId, number>>;
      readonly rainManPenalty?: boolean;
      readonly moonIsCurtain?: boolean;
      readonly lightningIsBright?: boolean;
    }
  | {
      readonly kind: 'defense';
      /** Flat reduction of every spirit hit (never below 1). */
      readonly flat?: number;
      /** Your koi-koi no longer doubles the spirit's hit. */
      readonly noKoikoiDouble?: boolean;
    }
  | {
      readonly kind: 'economy';
      readonly perKoikoi?: number;
      readonly perFight?: number;
      /** Fraction off shop prices. */
      readonly discount?: number;
    }
  | {
      readonly kind: 'grow';
      readonly on: 'fightWon' | 'handWon' | 'stopAfterKoikoi';
      readonly by: number;
    }
  | { readonly kind: 'thief'; readonly damage: Amount };

export interface OmamoriDef {
  readonly id: OmamoriId;
  readonly name: string;
  readonly kanji: string;
  readonly rarity: Rarity;
  readonly price: number;
  readonly archetype: Archetype;
  /** Player-facing text. {chips}, {mult} and {xmult} are replaced with live values. */
  readonly text: LandText;
  readonly effects: readonly OmamoriEffect[];
  /** Hue for the charm's silk (degrees), used by the icon renderer. */
  readonly hue: number;
  /** Icon motif key for the renderer. */
  readonly motif: string;
}

export type OmamoriId =
  | 'redSeal'
  | 'stoneLantern'
  | 'moonViewer'
  | 'paperLantern'
  | 'phoenixPlume'
  | 'willowWind'
  | 'lightningRod'
  | 'calligrapher'
  | 'indigoDye'
  | 'wishingStrings'
  | 'inkstone'
  | 'boarTusk'
  | 'birdWhistle'
  | 'seedPouch'
  | 'deerCall'
  | 'sweeper'
  | 'riceStraw'
  | 'leafPile'
  | 'riceBale'
  | 'carpStreamer'
  | 'gamblersDice'
  | 'manekiNeko'
  | 'paperUmbrella'
  | 'almanac'
  | 'picnicBox'
  | 'monthSeal'
  | 'thiefsSleeve'
  | 'saltCircle'
  | 'yataMirror'
  | 'bonsai'
  | 'thousandCranes'
  | 'koiPond'
  | 'windChime'
  | 'daruma'
  | 'goldKoban'
  | 'abacus'
  | 'twoMoons'
  | 'sakeBarrel'
  | 'obiSash';

const PRICE: Record<Rarity, number> = { common: 4, uncommon: 6, rare: 8 };

function o(
  id: OmamoriId,
  name: string,
  kanji: string,
  rarity: Rarity,
  archetype: Archetype,
  text: LandText,
  effects: OmamoriEffect[],
  hue: number,
  motif: string,
  price?: number,
): OmamoriDef {
  return {
    id,
    name,
    kanji,
    rarity,
    archetype,
    text,
    effects,
    hue,
    motif,
    price: price ?? PRICE[rarity],
  };
}

export const OMAMORI: readonly OmamoriDef[] = [
  // General starters: plain +chips and +mult.
  o(
    'redSeal',
    'Red Seal',
    '朱印',
    'common',
    'general',
    '+4 Mult on every stop.',
    [{ kind: 'stop', mult: { base: 4 } }],
    4,
    'seal',
  ),
  o(
    'stoneLantern',
    'Stone Lantern',
    '石灯籠',
    'common',
    'general',
    '+40 Chips on every stop.',
    [{ kind: 'stop', chips: { base: 40 } }],
    40,
    'lantern',
  ),
  o(
    'obiSash',
    'Obi Sash',
    '帯',
    'common',
    'general',
    '+3 Mult for each yaku in your stop.',
    [{ kind: 'stop', mult: { per: 'yakuCount', perUnit: 3 } }],
    300,
    'sash',
  ),

  // Brights
  o(
    'moonViewer',
    'Moon Viewer',
    '月見',
    'common',
    'brights',
    'Each Bright that scores gives +4 Mult.',
    [{ kind: 'card', filter: { type: 'bright' }, mult: { base: 4 } }],
    45,
    'moon',
  ),
  o(
    'paperLantern',
    'Paper Lantern',
    '提灯',
    'common',
    'brights',
    'Each Bright that scores gives +30 Chips.',
    [{ kind: 'card', filter: { type: 'bright' }, chips: { base: 30 } }],
    10,
    'chochin',
  ),
  o(
    'phoenixPlume',
    'Phoenix Plume',
    '鳳凰の羽',
    'rare',
    'brights',
    '×2 Mult when a Bright yaku scores.',
    [{ kind: 'yaku', filter: { family: 'brights' }, xmult: { base: 2 } }],
    20,
    'feather',
  ),
  o(
    'willowWind',
    'Willow Wind',
    '柳風',
    'uncommon',
    'brights',
    (t) => `${cap(t.rainMan)} no longer weakens Bright yaku.`,
    [{ kind: 'rule', rainManPenalty: false }],
    110,
    'willow',
  ),
  o(
    'lightningRod',
    'Lightning Rod',
    '避雷針',
    'uncommon',
    'brights',
    (t) => `${cap(t.lightning)} also counts as a Bright.`,
    [{ kind: 'rule', lightningIsBright: true }],
    55,
    'bolt',
  ),

  // Ribbons
  o(
    'calligrapher',
    'Calligrapher',
    '書家',
    'uncommon',
    'ribbons',
    (t) => `${cap(t.redPoetry)} score twice.`,
    [{ kind: 'card', filter: { tag: 'redPoetry' }, retrigger: 1 }],
    355,
    'brush',
  ),
  o(
    'indigoDye',
    'Indigo Dye',
    '藍染',
    'common',
    'ribbons',
    (t) => `${cap(t.blueRibbons)} give +5 Mult when they score.`,
    [{ kind: 'card', filter: { tag: 'blueRibbon' }, mult: { base: 5 } }],
    220,
    'dye',
  ),
  o(
    'wishingStrings',
    'Wishing Strings',
    '短冊',
    'uncommon',
    'ribbons',
    (t) => `${t.y.tan} needs only 4 Ribbons.`,
    [{ kind: 'rule', need: { tan: 4 } }],
    330,
    'tanzaku',
  ),
  o(
    'inkstone',
    'Inkstone',
    '硯',
    'common',
    'ribbons',
    '+2 Mult for each Ribbon you have captured this hand.',
    [{ kind: 'stop', mult: { per: 'capturedRibbons', perUnit: 2 } }],
    250,
    'inkstone',
  ),

  // Animals
  o(
    'boarTusk',
    'Boar Tusk',
    '猪牙',
    'uncommon',
    'animals',
    (t) => `${t.y.inoshikacho} gives ×2.5 Mult.`,
    [{ kind: 'yaku', filter: { ids: ['inoshikacho'] }, xmult: { base: 2.5 } }],
    25,
    'tusk',
  ),
  o(
    'birdWhistle',
    'Bird Whistle',
    '鳥笛',
    'uncommon',
    'animals',
    (t) => `Birds score twice: ${t.birds}.`,
    [{ kind: 'card', filter: { tag: 'bird' }, retrigger: 1 }],
    160,
    'whistle',
  ),
  o(
    'seedPouch',
    'Seed Pouch',
    '種袋',
    'uncommon',
    'animals',
    (t) => `${t.y.tane} needs only 4 Animals.`,
    [{ kind: 'rule', need: { tane: 4 } }],
    90,
    'pouch',
  ),
  o(
    'deerCall',
    'Deer Call',
    '鹿笛',
    'common',
    'animals',
    'Each Animal that scores gives +15 Chips.',
    [{ kind: 'card', filter: { type: 'animal' }, chips: { base: 15 } }],
    30,
    'antler',
  ),

  // Chaff
  o(
    'sweeper',
    'Sweeper',
    '箒',
    'uncommon',
    'chaff',
    (t) => `${t.y.kasu} gives ×2 Mult, and +×0.25 for every Chaff beyond ten.`,
    [
      {
        kind: 'yaku',
        filter: { ids: ['kasu'] },
        xmult: { base: 2, per: 'extraChaff', perUnit: 0.25 },
      },
    ],
    70,
    'broom',
  ),
  o(
    'riceStraw',
    'Rice Straw',
    '藁',
    'common',
    'chaff',
    'Each Chaff that scores gives +6 Chips.',
    [{ kind: 'card', filter: { type: 'chaff' }, chips: { base: 6 } }],
    48,
    'straw',
  ),
  o(
    'leafPile',
    'Leaf Pile',
    '落葉',
    'uncommon',
    'chaff',
    (t) => `${t.y.kasu} needs only 8 Chaff.`,
    [{ kind: 'rule', need: { kasu: 8 } }],
    15,
    'leaves',
  ),
  o(
    'riceBale',
    'Rice Bale',
    '米俵',
    'common',
    'chaff',
    '+1 Mult for each Chaff you have captured this hand.',
    [{ kind: 'stop', mult: { per: 'capturedChaff', perUnit: 1 } }],
    42,
    'bale',
  ),

  // Greed (koi-koi)
  o(
    'carpStreamer',
    'Carp Streamer',
    '鯉のぼり',
    'uncommon',
    'greed',
    '+×1 Mult for each koi-koi you called this hand.',
    [{ kind: 'stop', xmult: { base: 1, per: 'koikoiCalls', perUnit: 1 } }],
    0,
    'carp',
  ),
  o(
    'gamblersDice',
    "Gambler's Dice",
    '賽',
    'common',
    'greed',
    '+15 Mult for each koi-koi you called this hand.',
    [{ kind: 'stop', mult: { per: 'koikoiCalls', perUnit: 15 } }],
    350,
    'dice',
  ),
  o(
    'manekiNeko',
    'Maneki-neko',
    '招き猫',
    'common',
    'greed',
    'Earn 3 mon every time you call koi-koi.',
    [{ kind: 'economy', perKoikoi: 3 }],
    50,
    'cat',
  ),
  o(
    'paperUmbrella',
    'Paper Umbrella',
    '番傘',
    'uncommon',
    'greed',
    "Your koi-koi no longer doubles the spirit's hit, and gives +5 Mult for each one you called.",
    [
      { kind: 'defense', noKoikoiDouble: true },
      { kind: 'stop', mult: { per: 'koikoiCalls', perUnit: 5 } },
    ],
    200,
    'umbrella',
  ),

  // Season
  o(
    'almanac',
    'Almanac',
    '暦',
    'uncommon',
    'season',
    "Cards of this fight's month score twice.",
    [{ kind: 'card', filter: { currentMonth: true }, retrigger: 1 }],
    140,
    'almanac',
  ),
  o(
    'picnicBox',
    'Picnic Box',
    '重箱',
    'common',
    'season',
    '+1 Mult for each month of the year so far.',
    [{ kind: 'stop', mult: { per: 'month', perUnit: 1 } }],
    15,
    'bento',
  ),
  o(
    'monthSeal',
    'Month Seal',
    '月印',
    'uncommon',
    'season',
    (t) => `${t.y.tsukifuda} needs only 3 of the month's cards, and gives ×2 Mult.`,
    [
      { kind: 'rule', need: { tsukifuda: 3 } },
      { kind: 'yaku', filter: { ids: ['tsukifuda'] }, xmult: { base: 2 } },
    ],
    280,
    'stamp',
  ),

  // Sake
  o(
    'twoMoons',
    'Two Moons',
    '二つ月',
    'uncommon',
    'sake',
    (t) =>
      `${cap(t.moon)} also counts as ${t.curtain} for ${t.y.hanami}, and ${t.y.hanami} gives ×1.5 Mult.`,
    [
      { kind: 'rule', moonIsCurtain: true },
      { kind: 'yaku', filter: { ids: ['hanami'] }, xmult: { base: 1.5 } },
    ],
    230,
    'twomoons',
  ),
  o(
    'sakeBarrel',
    'Sake Barrel',
    '酒樽',
    'common',
    'sake',
    (t) => `${t.y.tsukimi} and ${t.y.hanami} each give +15 Mult.`,
    [{ kind: 'yaku', filter: { family: 'sake' }, mult: { base: 15 } }],
    18,
    'barrel',
  ),

  // Denial and defense
  o(
    'thiefsSleeve',
    "Thief's Sleeve",
    '袖',
    'uncommon',
    'denial',
    'Capturing a card the spirit is chasing strikes it for 12 + 3 per month damage.',
    [{ kind: 'thief', damage: { base: 12, per: 'month', perUnit: 3 } }],
    270,
    'sleeve',
  ),
  o(
    'saltCircle',
    'Salt Circle',
    '盛り塩',
    'common',
    'denial',
    "The spirit's hits deal 3 less damage.",
    [{ kind: 'defense', flat: 3 }],
    60,
    'salt',
  ),
  o(
    'yataMirror',
    'Yata Mirror',
    '八咫鏡',
    'rare',
    'denial',
    '×1.5 Mult. ×3 Mult instead if the spirit called koi-koi this hand.',
    [
      {
        kind: 'stop',
        when: { spiritCalled: true },
        xmult: { base: 3 },
        otherwise: { xmult: { base: 1.5 } },
      },
    ],
    190,
    'mirror',
  ),

  // Growth
  o(
    'bonsai',
    'Bonsai',
    '盆栽',
    'uncommon',
    'growth',
    '+3 Mult, growing by +3 for every fight you win (now +{mult}).',
    [
      { kind: 'stop', mult: { base: 3, per: 'counter', perUnit: 3 } },
      { kind: 'grow', on: 'fightWon', by: 1 },
    ],
    120,
    'bonsai',
  ),
  o(
    'thousandCranes',
    'Thousand Cranes',
    '千羽鶴',
    'uncommon',
    'growth',
    'Gains +15 Chips for every hand you win (now +{chips}).',
    [
      { kind: 'stop', chips: { per: 'counter', perUnit: 15 } },
      { kind: 'grow', on: 'handWon', by: 1 },
    ],
    340,
    'crane',
  ),
  o(
    'koiPond',
    'Koi Pond',
    '鯉池',
    'rare',
    'growth',
    'Gains ×0.25 Mult each time you stop after calling koi-koi (now ×{xmult}).',
    [
      { kind: 'stop', xmult: { base: 1, per: 'counter', perUnit: 0.25 } },
      { kind: 'grow', on: 'stopAfterKoikoi', by: 1 },
    ],
    195,
    'koi',
  ),

  // Utility
  o(
    'windChime',
    'Wind Chime',
    '風鈴',
    'uncommon',
    'general',
    'Your highest-chip scoring card scores twice.',
    [{ kind: 'card', filter: { highest: true }, retrigger: 1 }],
    180,
    'chime',
  ),
  o(
    'daruma',
    'Daruma',
    '達磨',
    'rare',
    'general',
    '×1.5 Mult. ×3 Mult instead while you are below half HP.',
    [
      {
        kind: 'stop',
        when: { hpBelow: 0.5 },
        xmult: { base: 3 },
        otherwise: { xmult: { base: 1.5 } },
      },
    ],
    0,
    'daruma',
  ),
  o(
    'goldKoban',
    'Gold Koban',
    '小判',
    'common',
    'general',
    'Earn 3 extra mon after every fight.',
    [{ kind: 'economy', perFight: 3 }],
    48,
    'koban',
  ),
  o(
    'abacus',
    "Merchant's Abacus",
    '算盤',
    'uncommon',
    'general',
    'Everything in the shop costs 25% less.',
    [{ kind: 'economy', discount: 0.25 }],
    28,
    'abacus',
  ),
];

const BY_ID = new Map<OmamoriId, OmamoriDef>(OMAMORI.map((d) => [d.id, d]));

export function omamoriDef(id: OmamoriId): OmamoriDef {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown omamori ${id}`);
  return d;
}

export const OMAMORI_IDS: readonly OmamoriId[] = OMAMORI.map((d) => d.id);
