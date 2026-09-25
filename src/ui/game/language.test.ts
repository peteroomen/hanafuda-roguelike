import { describe, expect, it } from 'vitest';
import { TIPS } from './tips';
import { DECKS, OMENS } from '@/content/decks';
import { ENHANCEMENTS } from '@/content/enhancements';
import { OFUDA } from '@/content/ofuda';
import { OMAMORI } from '@/content/omamori';
import { SPIRITS } from '@/content/spirits';
import { YAKU } from '@/content/yaku';

/**
 * The naming rule: a yaku is always called by its Japanese name in English letters (Sankō, Tan),
 * card types are English (Brights, Ribbons), and a yaku's English meaning (its gloss) appears
 * only as a subtitle. Single-word glosses (Animals, Ribbons, Chaff) are also card types, so only
 * the multi-word ones are checked.
 */
describe('naming', () => {
  const glosses = YAKU.map((y) => y.gloss).filter((g) => g.includes(' '));
  const texts: [string, string][] = [
    ...OMAMORI.map((d): [string, string] => [`charm ${d.id}`, JSON.stringify(d)]),
    ...OFUDA.map((d): [string, string] => [`talisman ${d.id}`, JSON.stringify(d)]),
    ...ENHANCEMENTS.map((d): [string, string] => [`enhancement ${d.id}`, JSON.stringify(d)]),
    ...SPIRITS.map((d): [string, string] => [`spirit ${d.id}`, JSON.stringify(d)]),
    ...DECKS.map((d): [string, string] => [`deck ${d.id}`, JSON.stringify(d)]),
    ...OMENS.map((d): [string, string] => [`omen ${d.level}`, JSON.stringify(d)]),
    ...YAKU.map((d): [string, string] => [
      `yaku ${d.id}`,
      JSON.stringify({ requirement: d.requirement, haiku: d.haiku }),
    ]),
    ...Object.entries(TIPS).map(([k, v]): [string, string] => [`tip ${k}`, v]),
  ];

  it('never calls a yaku by its English meaning', () => {
    const offenders = texts.flatMap(([where, text]) =>
      glosses.filter((g) => text.includes(g)).map((g) => `${where}: "${g}"`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives every yaku a Japanese name and an English gloss', () => {
    for (const y of YAKU) {
      expect(y.name).not.toBe(y.gloss);
      expect(y.gloss.length).toBeGreaterThan(0);
    }
  });
});
