/**
 * Spirits: the twelve opponents of a year. Regular spirits appear in their
 * season; the last month of each season is a boss with a rule change.
 */
import type { Season } from './cards';
import type { LandText } from './lands';
import type { YakuFamily, YakuId } from './yaku';

export interface AiPersona {
  /** Multipliers on how much it values progress toward each yaku family. */
  readonly prefs: Partial<Record<YakuFamily, number>>;
  /** How much it values taking cards the player needs. */
  readonly denial: number;
  /** Calls koi-koi while its yaku points are below this. */
  readonly stopAt: number;
  /** Needs at least this many cards in hand to call koi-koi. */
  readonly minCards: number;
  /** Stops early when the player's closest yaku is at least this close (0..1). */
  readonly caution: number;
  /** Extra weight on its declared intent. */
  readonly focus: number;
  /** Considers the flip after its play. */
  readonly lookahead: boolean;
  /** Sees the player's hand. */
  readonly seesHand?: boolean;
}

export type BossRuleId =
  'tanuki' | 'tengu' | 'kappa' | 'namazu' | 'kitsune' | 'nue' | 'yukiOnna' | 'oni';

export interface BossRule {
  readonly id: BossRuleId;
  readonly title: string;
  readonly text: string;
  /** Each koi-koi call counts this many times (both seats). */
  readonly koikoiWeight?: number;
  readonly stealFirstBright?: boolean;
  /** Yaku disabled for both seats. */
  readonly disabled?: readonly YakuId[];
  readonly quakeEvery?: number;
  readonly disguise?: { readonly max: number; readonly chance: number };
  /** Yaku the player has already scored this fight are worth half. */
  readonly halveRepeats?: boolean;
  readonly freezeMax?: number;
  /** Multiplies the spirit's hits. */
  readonly damageMult?: number;
}

export interface SpiritPassive {
  readonly text: LandText;
  readonly hiddenIntent?: boolean;
  readonly bonusMon?: number;
  readonly flatDamage?: number;
  /** Yaku requirement changes for the spirit only. */
  readonly need?: Partial<Record<YakuId, number>>;
}

export type SpiritId =
  | 'kodama'
  | 'zashikiWarashi'
  | 'kasaObake'
  | 'chochinObake'
  | 'kawauso'
  | 'hitotsumeKozo'
  | 'bakeneko'
  | 'ittanMomen'
  | 'nopperabo'
  | 'kamaitachi'
  | 'rokurokubi'
  | 'yamauba'
  | 'tanuki'
  | 'tengu'
  | 'kappa'
  | 'namazu'
  | 'kitsune'
  | 'nue'
  | 'yukiOnna'
  | 'oni';

export interface SpiritDef {
  readonly id: SpiritId;
  readonly name: string;
  readonly kanji: string;
  readonly epithet: string;
  readonly season: Season;
  readonly boss: boolean;
  /** One line of flavour for the fight intro. */
  readonly lore: string;
  /** What it says when the fight starts. */
  readonly taunt: string;
  /** Multiplier on the month's base HP. */
  readonly hp: number;
  /** Multiplier on the month's base ferocity. */
  readonly ferocity: number;
  readonly persona: AiPersona;
  readonly passive?: SpiritPassive;
  readonly rule?: BossRule;
}

const calm: AiPersona = {
  prefs: {},
  denial: 0.6,
  stopAt: 1,
  minCards: 3,
  caution: 0.5,
  focus: 0.5,
  lookahead: false,
};

export const SPIRITS: readonly SpiritDef[] = [
  // Spring
  {
    id: 'kodama',
    name: 'Kodama',
    kanji: '木霊',
    epithet: 'Echo of the Pines',
    season: 'spring',
    boss: false,
    lore: 'A tree spirit that answers every sound in the forest.',
    taunt: '…the pines… the pines are listening…',
    hp: 0.85,
    ferocity: 0.8,
    persona: { ...calm, stopAt: 1, denial: 0.3 },
  },
  {
    id: 'zashikiWarashi',
    name: 'Zashiki-warashi',
    kanji: '座敷童子',
    epithet: 'The House Child',
    season: 'spring',
    boss: false,
    lore: 'A mischievous child spirit. Houses it favours prosper.',
    taunt: 'Play with me! Winner keeps the coins!',
    hp: 1,
    ferocity: 1,
    persona: { ...calm, stopAt: 5, minCards: 3, caution: 0.6 },
    passive: { text: 'Drops 4 extra mon when defeated.', bonusMon: 4 },
  },
  {
    id: 'kasaObake',
    name: 'Kasa-obake',
    kanji: '傘お化け',
    epithet: 'The Hopping Umbrella',
    season: 'spring',
    boss: false,
    lore: 'An old umbrella that came alive on its hundredth birthday.',
    taunt: '*hop* *hop* Ribbons! Give me your ribbons!',
    hp: 1,
    ferocity: 1,
    persona: { ...calm, prefs: { ribbons: 1.8 }, focus: 1, stopAt: 5 },
  },
  // Summer
  {
    id: 'chochinObake',
    name: 'Chōchin-obake',
    kanji: '提灯お化け',
    epithet: 'The Lantern Tongue',
    season: 'summer',
    boss: false,
    lore: 'A paper lantern with a long tongue, drawn to every light.',
    taunt: 'Bright things… I want all the bright things.',
    hp: 1,
    ferocity: 1,
    persona: { ...calm, prefs: { brights: 1.8, sake: 1.2 }, focus: 1, stopAt: 7, caution: 0.75 },
  },
  {
    id: 'kawauso',
    name: 'Kawauso',
    kanji: '川獺',
    epithet: 'The River Otter',
    season: 'summer',
    boss: false,
    lore: 'A shape-shifting otter that loves a riverside wager.',
    taunt: 'A little game by the water? What could go wrong?',
    hp: 1,
    ferocity: 1,
    persona: {
      ...calm,
      prefs: { animals: 1.8 },
      denial: 1.1,
      focus: 1,
      stopAt: 5,
      lookahead: true,
    },
  },
  {
    id: 'hitotsumeKozo',
    name: 'Hitotsume-kozō',
    kanji: '一つ目小僧',
    epithet: 'The One-Eyed Boy',
    season: 'summer',
    boss: false,
    lore: 'A bald little monk with one enormous eye. It sees everything.',
    taunt: 'I can see your cards, you know.',
    hp: 0.95,
    ferocity: 1,
    persona: { ...calm, denial: 1.6, stopAt: 3, lookahead: true, seesHand: true },
    passive: { text: 'Sees your hand.' },
  },
  // Autumn
  {
    id: 'bakeneko',
    name: 'Bakeneko',
    kanji: '化け猫',
    epithet: 'The Changeling Cat',
    season: 'autumn',
    boss: false,
    lore: 'A house cat grown old enough to walk upright and hold a grudge.',
    taunt: 'Mrrow. Whatever you want, I want more.',
    hp: 1,
    ferocity: 1.05,
    persona: { ...calm, denial: 2, stopAt: 3, caution: 0.45, lookahead: true },
  },
  {
    id: 'ittanMomen',
    name: 'Ittan-momen',
    kanji: '一反木綿',
    epithet: 'The Flying Cloth',
    season: 'autumn',
    boss: false,
    lore: 'A long strip of cotton that flutters down on travellers at dusk.',
    taunt: 'Wrap… wrap… wrap you up in ribbons…',
    hp: 1,
    ferocity: 1,
    persona: { ...calm, prefs: { ribbons: 2 }, focus: 1.2, stopAt: 5 },
    passive: { text: (t) => `Its ${t.y.tan} needs only 4 Ribbons.`, need: { tan: 4 } },
  },
  {
    id: 'nopperabo',
    name: 'Nopperabō',
    kanji: 'のっぺらぼう',
    epithet: 'The Faceless One',
    season: 'autumn',
    boss: false,
    lore: 'It looks like anyone at all, until it turns to face you.',
    taunt: '…',
    hp: 1.05,
    ferocity: 1,
    persona: { ...calm, stopAt: 5, lookahead: true },
    passive: { text: 'Its intent is hidden.', hiddenIntent: true },
  },
  // Winter
  {
    id: 'kamaitachi',
    name: 'Kamaitachi',
    kanji: '鎌鼬',
    epithet: 'The Sickle Weasel',
    season: 'winter',
    boss: false,
    lore: 'A weasel riding the winter wind, with sickles for claws.',
    taunt: 'Quick cuts. Quick cuts!',
    hp: 0.9,
    ferocity: 1,
    persona: { ...calm, stopAt: 1, minCards: 9, lookahead: true },
    passive: { text: 'Always stops at once, and its hits deal 3 extra damage.', flatDamage: 3 },
  },
  {
    id: 'rokurokubi',
    name: 'Rokurokubi',
    kanji: 'ろくろ首',
    epithet: 'The Long Neck',
    season: 'winter',
    boss: false,
    lore: 'By day an ordinary woman. By night her neck stretches over the whole table.',
    taunt: 'I can reach every card on this table.',
    hp: 1.05,
    ferocity: 1,
    persona: { ...calm, denial: 1.2, stopAt: 5, lookahead: true, focus: 0.8 },
  },
  {
    id: 'yamauba',
    name: 'Yama-uba',
    kanji: '山姥',
    epithet: 'The Mountain Crone',
    season: 'winter',
    boss: false,
    lore: 'A crone of the high passes who shelters travellers, and then eats them.',
    taunt: 'Sit, sit. Warm yourself. Play a hand with granny.',
    hp: 1.1,
    ferocity: 1.05,
    persona: {
      ...calm,
      prefs: { brights: 1.4, sake: 1.6 },
      stopAt: 7,
      caution: 0.7,
      lookahead: true,
    },
  },

  // Bosses
  {
    id: 'tanuki',
    name: 'Tanuki',
    kanji: '狸',
    epithet: 'The Belly-Drummer of Cherry Hill',
    season: 'spring',
    boss: true,
    lore: 'A raccoon dog, a trickster and a gambler. It drums its belly at every bet.',
    taunt: 'Double or nothing! Always double or nothing!',
    hp: 1,
    ferocity: 1,
    persona: { ...calm, stopAt: 6, minCards: 2, caution: 0.8, lookahead: true },
    rule: {
      id: 'tanuki',
      title: 'Belly Drum',
      text: 'Every koi-koi counts twice, for both of you: twice the stakes, twice the danger.',
      koikoiWeight: 2,
    },
  },
  {
    id: 'tengu',
    name: 'Tengu',
    kanji: '天狗',
    epithet: 'The Crag Goblin',
    season: 'spring',
    boss: true,
    lore: 'A long-nosed mountain goblin with a hoard of stolen lights.',
    taunt: 'Every light on this mountain belongs to me.',
    hp: 0.85,
    ferocity: 0.9,
    persona: { ...calm, prefs: { brights: 1.5 }, stopAt: 5, lookahead: true },
    rule: {
      id: 'tengu',
      title: 'Feather Thief',
      text: 'The first Bright you capture each hand is snatched away and hidden at the bottom of the deck.',
      stealFirstBright: true,
    },
  },
  {
    id: 'kappa',
    name: 'Kappa',
    kanji: '河童',
    epithet: 'The River Imp',
    season: 'summer',
    boss: true,
    lore: 'A river imp with a dish of water on its head. Bow, and it must bow back.',
    taunt: 'Ribbons? In my river? Washed away!',
    hp: 1,
    ferocity: 1,
    persona: {
      ...calm,
      prefs: { animals: 1.4, brights: 1.2 },
      stopAt: 5,
      lookahead: true,
      denial: 1,
    },
    rule: {
      id: 'kappa',
      title: 'River Current',
      text: "Ribbons don't count toward any yaku.",
      disabled: ['tan', 'akatan', 'aotan', 'akaao'],
    },
  },
  {
    id: 'namazu',
    name: 'Ōnamazu',
    kanji: '大鯰',
    epithet: 'The Earthquake Catfish',
    season: 'summer',
    boss: true,
    lore: 'A giant catfish under the islands. When it thrashes, the earth shakes.',
    taunt: 'Hold on to something.',
    hp: 1.05,
    ferocity: 1,
    persona: { ...calm, stopAt: 3, lookahead: true },
    rule: {
      id: 'namazu',
      title: 'Earthquake',
      text: 'Every second round the ground shakes and the field is dealt again.',
      quakeEvery: 2,
    },
  },
  {
    id: 'kitsune',
    name: 'Kitsune',
    kanji: '狐',
    epithet: 'The Nine-Tailed Illusion',
    season: 'autumn',
    boss: true,
    lore: 'An ancient fox whose foxfire makes things seem what they are not.',
    taunt: 'Are you sure that is a chrysanthemum?',
    hp: 0.9,
    ferocity: 1,
    persona: { ...calm, denial: 1.2, stopAt: 5, lookahead: true },
    rule: {
      id: 'kitsune',
      title: 'Foxfire',
      text: 'Some field cards show you the wrong month until they are touched. Watch for the flicker.',
      disguise: { max: 2, chance: 0.5 },
    },
  },
  {
    id: 'nue',
    name: 'Nue',
    kanji: '鵺',
    epithet: 'The Chimera of the Palace Roof',
    season: 'autumn',
    boss: true,
    lore: 'Monkey face, badger body, tiger legs, a serpent for a tail. It learns.',
    taunt: 'Show me that trick again. I dare you.',
    hp: 0.95,
    ferocity: 1,
    persona: { ...calm, stopAt: 5, lookahead: true, denial: 1.2 },
    rule: {
      id: 'nue',
      title: 'It Learns',
      text: 'Each yaku you have already scored this fight is worth half.',
      halveRepeats: true,
    },
  },
  {
    id: 'yukiOnna',
    name: 'Yuki-onna',
    kanji: '雪女',
    epithet: 'The Snow Woman',
    season: 'winter',
    boss: true,
    lore: 'She walks in on the last night of the year, and everything she looks at freezes.',
    taunt: 'Come in from the snow. Stay a while. Stay forever.',
    hp: 0.9,
    ferocity: 1,
    persona: { ...calm, denial: 1.4, stopAt: 6, lookahead: true, caution: 0.6 },
    rule: {
      id: 'yukiOnna',
      title: 'Frost',
      text: 'After each of her turns she freezes the field card you most want. Up to two stay frozen and cannot be taken.',
      freezeMax: 2,
    },
  },
  {
    id: 'oni',
    name: 'Oni',
    kanji: '鬼',
    epithet: 'The Ogre at the Gate',
    season: 'winter',
    boss: true,
    lore: 'A red ogre with an iron club, collecting debts on the last night of the year.',
    taunt: 'Pay what you owe.',
    hp: 0.8,
    ferocity: 1,
    persona: { ...calm, stopAt: 1, minCards: 9, lookahead: true, denial: 1 },
    rule: {
      id: 'oni',
      title: 'Iron Club',
      text: 'Its hits deal 60% more damage, but it never calls koi-koi.',
      damageMult: 1.6,
    },
  },
];

const BY_ID = new Map<SpiritId, SpiritDef>(SPIRITS.map((s) => [s.id, s]));

export function spiritDef(id: SpiritId): SpiritDef {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown spirit ${id}`);
  return d;
}

export const REGULARS_BY_SEASON: Record<Season, SpiritId[]> = {
  spring: ['kodama', 'zashikiWarashi', 'kasaObake'],
  summer: ['chochinObake', 'kawauso', 'hitotsumeKozo'],
  autumn: ['bakeneko', 'ittanMomen', 'nopperabo'],
  winter: ['kamaitachi', 'rokurokubi', 'yamauba'],
};

export const BOSSES_BY_SEASON: Record<Season, SpiritId[]> = {
  spring: ['tanuki', 'tengu'],
  summer: ['kappa', 'namazu'],
  autumn: ['kitsune', 'nue'],
  winter: ['yukiOnna', 'oni'],
};
