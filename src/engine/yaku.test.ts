import { describe, expect, it } from 'vitest';
import {
  type CardId,
  type CardTag,
  cardWithTag,
  type Land,
  landCards,
  type Month,
} from '@/content/cards';
import { DEFAULT_RULES, withRules } from '@/content/rules';
import type { YakuId } from '@/content/yaku';
import { DEFAULT_YAKU_MODS, type YakuMods } from './types';
import { detectYaku, totalPoints, yakuProgress, type YakuContext } from './yaku';

const CARDS = landCards('nippon');
const T = (tag: CardTag, land: Land = 'nippon'): CardId => cardWithTag(tag, land);
const ofType = (type: string) => CARDS.filter((c) => c.type === type).map((c) => c.id);
const plainChaff = CARDS.filter((c) => c.type === 'chaff' && c.tags.length === 0).map((c) => c.id);
const monthCards = (m: number) => CARDS.filter((c) => c.month === m).map((c) => c.id);

function ctx(
  opts: {
    mods?: Partial<YakuMods>;
    month?: Month;
    rules?: Partial<typeof DEFAULT_RULES>;
    torn?: CardId[];
  } = {},
): YakuContext {
  const month = opts.month ?? 1;
  return {
    month,
    rules: withRules(DEFAULT_RULES, opts.rules ?? {}),
    mods: { ...DEFAULT_YAKU_MODS, ...(opts.mods ?? {}) },
    monthCards: monthCards(month),
    ...(opts.torn ? { doubleCount: new Set(opts.torn) } : {}),
  };
}

function yaku(captured: CardId[], c: YakuContext = ctx()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of detectYaku(captured, c)) out[h.id] = h.points;
  return out;
}

describe('bright yaku', () => {
  const crane = T('crane');
  const curtain = T('curtain');
  const moon = T('moon');
  const rain = T('rainMan');
  const phoenix = T('phoenix');

  it('Five Brights', () => {
    expect(yaku([crane, curtain, moon, rain, phoenix])).toEqual({ goko: 10 });
  });
  it('Four Brights without the Rain Man', () => {
    expect(yaku([crane, curtain, moon, phoenix])).toEqual({ shiko: 8 });
  });
  it('Rainy Four with the Rain Man', () => {
    expect(yaku([crane, curtain, moon, rain])).toEqual({ ameShiko: 7 });
  });
  it('Three Brights without the Rain Man', () => {
    expect(yaku([crane, curtain, phoenix])).toEqual({ sanko: 5 });
  });
  it('three Brights including the Rain Man make nothing', () => {
    expect(yaku([crane, curtain, rain])).toEqual({});
  });
  it('Willow Wind: the Rain Man no longer weakens bright yaku', () => {
    const c = ctx({ mods: { rainManPenalty: false } });
    expect(yaku([crane, curtain, rain], c)).toEqual({ sanko: 5 });
    expect(yaku([crane, curtain, moon, rain], c)).toEqual({ shiko: 8 });
  });
  it('Lightning Rod: the Lightning card counts as a Bright', () => {
    const c = ctx({ mods: { lightningIsBright: true } });
    expect(yaku([crane, curtain, T('lightning')], c)).toEqual({ sanko: 5 });
    expect(yaku([crane, curtain, moon, phoenix, T('lightning')], c)).toEqual({ goko: 10 });
  });
});

describe('sake yaku', () => {
  it('Moon Viewing and Flower Viewing', () => {
    expect(yaku([T('moon'), T('sakeCup')])).toEqual({ tsukimi: 5 });
    expect(yaku([T('curtain'), T('sakeCup')])).toEqual({ hanami: 5 });
    expect(yaku([T('moon'), T('curtain'), T('sakeCup')])).toEqual({ tsukimi: 5, hanami: 5 });
  });
  it('Two Moons: the Moon counts toward both', () => {
    const c = ctx({ mods: { moonIsCurtain: true } });
    expect(yaku([T('moon'), T('sakeCup')], c)).toEqual({ tsukimi: 5, hanami: 5 });
  });
  it('needs the cup', () => {
    expect(yaku([T('moon'), T('curtain')])).toEqual({});
  });
});

describe('animal yaku', () => {
  it('Boar, Deer, Butterflies, +1 per extra Animal', () => {
    const base = [T('boar'), T('deer'), T('butterflies')];
    expect(yaku(base)).toEqual({ inoshikacho: 5 });
    expect(yaku([...base, T('geese')])).toEqual({ inoshikacho: 6 });
    // Five animals also make Tane.
    expect(yaku([...base, T('geese'), T('cuckoo')])).toEqual({ inoshikacho: 7, tane: 1 });
  });
  it('Tane scales +1 per extra Animal', () => {
    const animals = [T('warbler'), T('cuckoo'), T('bridge'), T('geese'), T('swallow')];
    expect(yaku(animals)).toEqual({ tane: 1 });
    expect(yaku([...animals, T('sakeCup')])).toEqual({ tane: 2 });
  });
  it('Menagerie: Tane with 4 Animals', () => {
    const c = ctx({ mods: { need: { tane: 4 } } });
    expect(yaku([T('warbler'), T('cuckoo'), T('bridge'), T('geese')], c)).toEqual({ tane: 1 });
  });
});

describe('ribbon yaku', () => {
  const red = CARDS.filter((c) => c.tags.includes('redPoetry')).map((c) => c.id);
  const blue = CARDS.filter((c) => c.tags.includes('blueRibbon')).map((c) => c.id);
  const plain = CARDS.filter((c) => c.tags.includes('plainRed')).map((c) => c.id);

  it('Red Poems and Blue Ribbons, +1 per extra Ribbon', () => {
    expect(yaku(red)).toEqual({ akatan: 5 });
    expect(yaku(blue)).toEqual({ aotan: 5 });
    expect(yaku([...red, plain[0] as CardId])).toEqual({ akatan: 6 });
  });
  it('both together replace the halves', () => {
    expect(yaku([...red, ...blue])).toEqual({ akaao: 10, tan: 2 });
    expect(yaku([...red, ...blue, plain[0] as CardId])).toEqual({ akaao: 11, tan: 3 });
  });
  it('Tan: any 5 ribbons, +1 per extra', () => {
    expect(yaku([...plain, blue[0] as CardId])).toEqual({ tan: 1 });
    expect(yaku([...plain, ...blue.slice(0, 2)])).toEqual({ tan: 2 });
  });
  it('Tanzaku Strings: Tan with 4 ribbons', () => {
    expect(yaku(plain, ctx({ mods: { need: { tan: 4 } } }))).toEqual({ tan: 1 });
  });
  it('Kappa: ribbons disabled', () => {
    const c = ctx({ mods: { disabled: ['akatan', 'aotan', 'akaao', 'tan'] } });
    expect(yaku([...red, ...blue], c)).toEqual({});
  });
});

describe('chaff and month yaku', () => {
  it('Kasu: 10 chaff, +1 per extra', () => {
    expect(yaku(plainChaff.slice(0, 9))).toEqual({});
    expect(yaku(plainChaff.slice(0, 10))).toEqual({ kasu: 1 });
    expect(yaku(plainChaff.slice(0, 12))).toEqual({ kasu: 3 });
  });
  it('the Lightning card is chaff', () => {
    expect(yaku([...plainChaff.slice(0, 9), T('lightning')])).toEqual({ kasu: 1 });
  });
  it('the sake cup counts as chaff when the rule is on', () => {
    const nine = plainChaff.slice(0, 9);
    expect(yaku([...nine, T('sakeCup')])).toEqual({ kasu: 1 });
    expect(yaku([...nine, T('sakeCup')], ctx({ rules: { sakeCupIsChaff: false } }))).toEqual({});
  });
  it('Torn cards count double toward count yaku', () => {
    const five = plainChaff.slice(0, 5);
    expect(yaku(five, ctx({ torn: five }))).toEqual({ kasu: 1 });
  });
  it('Tsukifuda only when enabled and only for the current month', () => {
    const march = monthCards(3);
    expect(yaku(march, ctx({ month: 3 }))).toEqual({});
    expect(yaku(march, ctx({ month: 3, rules: { tsukifuda: true } }))).toEqual({ tsukifuda: 4 });
    expect(yaku(march, ctx({ month: 4, rules: { tsukifuda: true } }))).toEqual({});
  });
  it('points add up across yaku', () => {
    const hits = detectYaku([T('moon'), T('sakeCup'), T('curtain'), T('crane')], ctx());
    expect(hits.map((h) => h.id).sort()).toEqual(['hanami', 'sanko', 'tsukimi']);
    expect(totalPoints(hits)).toBe(15);
  });
});

describe('progress', () => {
  it('reports have/need and wanted cards, and blocking', () => {
    const inGame = CARDS.map((c) => c.id);
    const prog = yakuProgress({ own: [T('boar'), T('deer')], opponent: [], inGame }, ctx());
    const ino = prog.find((p) => p.id === 'inoshikacho');
    expect(ino).toMatchObject({ have: 2, need: 3, complete: false, blocked: false });
    expect(ino?.wanted).toEqual([T('butterflies')]);

    const blocked = yakuProgress(
      { own: [T('boar'), T('deer')], opponent: [T('butterflies')], inGame },
      ctx(),
    );
    expect(blocked.find((p) => p.id === 'inoshikacho')?.blocked).toBe(true);
  });

  it('tracks the bright ladder rung by rung', () => {
    const inGame = CARDS.map((c) => c.id);
    const rung = (own: CardId[]) =>
      yakuProgress({ own, opponent: [], inGame }, ctx()).find((p) =>
        ['sanko', 'shiko', 'goko'].includes(p.id),
      );
    expect(rung([T('crane')])).toMatchObject({ id: 'sanko', have: 1, need: 3 });
    expect(rung([T('crane'), T('moon'), T('curtain')])).toMatchObject({
      id: 'shiko',
      have: 3,
      need: 4,
    });
  });

  it('never reports a disabled yaku', () => {
    const inGame = CARDS.map((c) => c.id);
    const disabled: YakuId[] = ['tan', 'akatan', 'aotan', 'akaao'];
    const prog = yakuProgress({ own: [], opponent: [], inGame }, ctx({ mods: { disabled } }));
    for (const id of disabled) expect(prog.some((p) => p.id === id)).toBe(false);
  });

  it('counts types across the whole deck', () => {
    const inGame = CARDS.map((c) => c.id);
    const kasu = yakuProgress({ own: [], opponent: [], inGame }, ctx()).find(
      (p) => p.id === 'kasu',
    );
    // 24 chaff plus the sake cup.
    expect(kasu?.wanted).toHaveLength(25);
    expect(ofType('bright')).toHaveLength(5);
  });
});

describe('Aotearoa: the same yaku with the redrawn deck', () => {
  const A = (tag: CardTag) => T(tag, 'aotearoa');
  const aCards = landCards('aotearoa');
  const aMonth = (m: number) => aCards.filter((c) => c.month === m).map((c) => c.id);
  const actx = (month: Month): YakuContext => ({
    ...ctx({ month, rules: { tsukifuda: true } }),
    monthCards: aMonth(month),
  });

  it('scores the Brights, with Ua as the rain card', () => {
    const [kotuku, kowhai, moon, ua, matariki] = [
      A('crane'),
      A('curtain'),
      A('moon'),
      A('rainMan'),
      A('phoenix'),
    ];
    expect(yaku([kotuku, kowhai, moon, ua, matariki])).toEqual({ goko: 10 });
    expect(yaku([kotuku, moon, matariki])).toEqual({ sanko: 5 });
    expect(yaku([kotuku, moon, ua])).toEqual({});
    expect(yaku([kotuku, kowhai, moon, ua])).toEqual({ ameShiko: 7 });
  });

  it('scores moon and kōwhai viewing with the kete', () => {
    expect(yaku([A('moon'), A('sakeCup')])).toEqual({ tsukimi: 5 });
    expect(yaku([A('curtain'), A('sakeCup')])).toEqual({ hanami: 5 });
  });

  it('scores Te Pō: kiwi, ruru and wētā', () => {
    expect(yaku([A('boar'), A('deer'), A('butterflies')])).toEqual({ inoshikacho: 5 });
  });

  it('scores kōkōwai and pounamu ribbons', () => {
    const red = aCards.filter((c) => c.tags.includes('redPoetry')).map((c) => c.id);
    const green = aCards.filter((c) => c.tags.includes('blueRibbon')).map((c) => c.id);
    expect(yaku(red)).toEqual({ akatan: 5 });
    expect(yaku(green)).toEqual({ aotan: 5 });
    expect(yaku([...red, ...green])).toEqual({ akaao: 10, tan: 2 });
  });

  it('counts the kete as Chaff toward Kasu', () => {
    const plain = aCards.filter((c) => c.type === 'chaff' && c.tags.length === 0).map((c) => c.id);
    expect(yaku([...plain.slice(0, 9), A('sakeCup')])).toEqual({ kasu: 1 });
  });

  it('scores Tsukifuda with the four cards of an Aotearoa month', () => {
    expect(yaku(aMonth(6), actx(6))).toEqual({ tsukifuda: 4 });
    expect(yaku(aMonth(6), actx(7))).toEqual({});
  });
});
