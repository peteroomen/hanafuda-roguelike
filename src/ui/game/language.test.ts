import { describe, expect, it } from 'vitest';
import { TIPS } from './tips';
import { LANDS, landCards, landMonths, type Land } from '@/content/cards';
import { DECKS, OMENS } from '@/content/decks';
import { ENHANCEMENTS } from '@/content/enhancements';
import { landText, terms } from '@/content/lands';
import { OFUDA } from '@/content/ofuda';
import { OMAMORI } from '@/content/omamori';
import { SPIRITS } from '@/content/spirits';
import { YAKU, yakuText } from '@/content/yaku';

/** Every player-facing content text, as the player reads it in a land. */
function texts(land: Land): [string, string][] {
  const render = (x: unknown): string =>
    JSON.stringify(x, (_k, v: unknown) =>
      typeof v === 'function' ? landText(v as Parameters<typeof landText>[0], land) : v,
    );
  return [
    ...OMAMORI.map((d): [string, string] => [`charm ${d.id}`, render(d)]),
    ...OFUDA.map((d): [string, string] => [`talisman ${d.id}`, render(d)]),
    ...ENHANCEMENTS.map((d): [string, string] => [`enhancement ${d.id}`, render(d)]),
    ...SPIRITS.map((d): [string, string] => [`spirit ${d.id}`, render(d)]),
    ...DECKS.map((d): [string, string] => [`deck ${d.id}`, render(d)]),
    ...OMENS.map((d): [string, string] => [`omen ${d.level}`, render(d)]),
    ...YAKU.map((d): [string, string] => {
      const t = yakuText(d.id, land);
      return [`yaku ${d.id}`, render({ requirement: t.requirement, haiku: t.haiku })];
    }),
    ...Object.entries(TIPS).map(([k, v]): [string, string] => [`tip ${k}`, landText(v, land)]),
  ];
}

/**
 * The naming rule: a yaku is always called by its name in the land's language (Sankō in
 * Nippon, Te Pō in Aotearoa), card types are English (Brights, Ribbons), and a yaku's English
 * meaning (its gloss) appears only as a subtitle. Single-word glosses (Animals, Ribbons, Chaff)
 * are also card types, so only the multi-word ones are checked.
 */
describe.each(LANDS)('naming in %s', (land) => {
  const glosses = YAKU.map((y) => yakuText(y.id, land).gloss).filter((g) => g.includes(' '));

  it('never calls a yaku by its English meaning', () => {
    const offenders = texts(land).flatMap(([where, text]) =>
      glosses.filter((g) => text.includes(g)).map((g) => `${where}: "${g}"`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives every yaku a name and an English gloss', () => {
    for (const y of YAKU) {
      const t = yakuText(y.id, land);
      expect(t.name).not.toBe(t.gloss);
      expect(t.gloss.length).toBeGreaterThan(0);
    }
  });

  it('gives every yaku its own name', () => {
    const names = YAKU.map((y) => yakuText(y.id, land).name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Aotearoa words', () => {
  const nipponYaku = YAKU.map((y) => yakuText(y.id, 'nippon').name);
  const kanaOrKanji = /[぀-ヿ㐀-鿿]/;

  it('never names a Nippon yaku or card in Aotearoa text', () => {
    const nipponWords = [
      ...nipponYaku,
      'Rain Man',
      'Sake Cup',
      'Curtain',
      'Lightning card',
      'Red poetry',
      'red poetry',
      'Blue ribbon',
      'blue ribbon',
    ];
    const offenders = texts('aotearoa').flatMap(([where, text]) =>
      nipponWords.filter((w) => new RegExp(`\\b${w}\\b`).test(text)).map((w) => `${where}: "${w}"`),
    );
    expect(offenders).toEqual([]);
  });

  it('has no kanji or kana in its cards, months or yaku', () => {
    const words = [
      ...landCards('aotearoa').map((c) => c.name),
      ...landMonths('aotearoa').flatMap((m) => [m.flower, m.native, m.kanji]),
      ...YAKU.flatMap((y) => Object.values(yakuText(y.id, 'aotearoa')).flat()),
      ...Object.values(terms('aotearoa')).flatMap((v) =>
        typeof v === 'string' ? [v] : Object.values(v),
      ),
    ];
    expect(words.filter((w) => kanaOrKanji.test(w))).toEqual([]);
  });
});
