import { describe, expect, it } from 'vitest';
import {
  ALL_CARDS,
  card,
  type CardTag,
  cardWithTag,
  type Land,
  LANDS,
  landCards,
  landMonths,
} from './cards';

describe.each(LANDS)('%s deck composition', (land) => {
  const CARDS = landCards(land);

  it('has 48 unique cards, four per month', () => {
    expect(CARDS).toHaveLength(48);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(48);
    for (const m of landMonths(land)) {
      expect(CARDS.filter((c) => c.month === m.month)).toHaveLength(4);
    }
    for (const c of CARDS) expect(ALL_CARDS[c.id]).toBe(c);
  });

  it('has 5 Brights, 9 Animals, 10 Ribbons and 24 Chaff', () => {
    const count = (t: string) => CARDS.filter((c) => c.type === t).length;
    expect(count('bright')).toBe(5);
    expect(count('animal')).toBe(9);
    expect(count('ribbon')).toBe(10);
    expect(count('chaff')).toBe(24);
  });

  it('has 3 red poetry, 3 blue and 4 plain red ribbons', () => {
    const count = (tag: CardTag) => CARDS.filter((c) => c.tags.includes(tag)).length;
    expect(count('redPoetry')).toBe(3);
    expect(count('blueRibbon')).toBe(3);
    expect(count('plainRed')).toBe(4);
  });

  it('gives every unique role to exactly one card of the right type', () => {
    const roles: [CardTag, string][] = [
      ['crane', 'bright'],
      ['curtain', 'bright'],
      ['moon', 'bright'],
      ['rainMan', 'bright'],
      ['phoenix', 'bright'],
      ['warbler', 'animal'],
      ['cuckoo', 'animal'],
      ['bridge', 'animal'],
      ['butterflies', 'animal'],
      ['boar', 'animal'],
      ['geese', 'animal'],
      ['sakeCup', 'animal'],
      ['deer', 'animal'],
      ['swallow', 'animal'],
      ['lightning', 'chaff'],
    ];
    for (const [tag, type] of roles) {
      expect(
        CARDS.filter((c) => c.tags.includes(tag)),
        tag,
      ).toHaveLength(1);
      expect(card(cardWithTag(tag, land)).type, tag).toBe(type);
    }
  });
});

describe('Nippon', () => {
  const CARDS = landCards('nippon');
  const at = (tag: CardTag) => card(cardWithTag(tag, 'nippon')).month;

  it('keeps its card ids 0..47', () => {
    CARDS.forEach((c, i) => expect(c.id).toBe(i));
  });

  it('has the ribbons in the traditional months', () => {
    const months = (tag: CardTag) => CARDS.filter((c) => c.tags.includes(tag)).map((c) => c.month);
    expect(months('redPoetry')).toEqual([1, 2, 3]);
    expect(months('blueRibbon')).toEqual([6, 9, 10]);
    expect(months('plainRed')).toEqual([4, 5, 7, 11]);
  });

  it('places every Bright and Animal in its traditional month', () => {
    const expected: [CardTag, number][] = [
      ['crane', 1],
      ['curtain', 3],
      ['moon', 8],
      ['rainMan', 11],
      ['phoenix', 12],
      ['warbler', 2],
      ['cuckoo', 4],
      ['bridge', 5],
      ['butterflies', 6],
      ['boar', 7],
      ['geese', 8],
      ['sakeCup', 9],
      ['deer', 10],
      ['swallow', 11],
      ['lightning', 11],
    ];
    for (const [tag, month] of expected) expect(at(tag), tag).toBe(month);
  });

  it('has the irregular months right: August has no ribbon, November one chaff, December three', () => {
    const types = (m: number) => CARDS.filter((c) => c.month === m).map((c) => c.type);
    expect(types(8)).toEqual(['bright', 'animal', 'chaff', 'chaff']);
    expect(types(11)).toEqual(['bright', 'animal', 'ribbon', 'chaff']);
    expect(types(12)).toEqual(['bright', 'chaff', 'chaff', 'chaff']);
  });

  it('marks six birds', () => {
    expect(CARDS.filter((c) => c.tags.includes('bird')).map((c) => c.name)).toEqual([
      'Crane and Sun',
      'Bush Warbler',
      'Cuckoo',
      'Geese',
      'Swallow',
      'Phoenix',
    ]);
  });
});

describe('Aotearoa', () => {
  const land: Land = 'aotearoa';
  const CARDS = landCards(land);
  const named = (tag: CardTag) => card(cardWithTag(tag, land));

  it('takes ids 48..95', () => {
    CARDS.forEach((c, i) => expect(c.id).toBe(48 + i));
  });

  it('moves the Brights to fit the NZ seasons', () => {
    expect([named('crane').name, named('crane').month]).toEqual(['Kōtuku and Sun', 1]);
    expect([named('moon').name, named('moon').month]).toEqual(['Full Moon', 3]);
    expect([named('phoenix').name, named('phoenix').month]).toEqual(['Matariki', 6]);
    expect([named('rainMan').name, named('rainMan').month]).toEqual(['Ua', 8]);
    expect([named('curtain').name, named('curtain').month]).toEqual(['Kōwhai in Bloom', 9]);
  });

  it('has Te Pō (kiwi, ruru, wētā) in the Ino-Shika-Chō roles, and the kete as the wild card', () => {
    expect(named('boar').name).toBe('Kiwi');
    expect(named('deer').name).toBe('Ruru');
    expect(named('butterflies').name).toBe('Wētā');
    expect(named('sakeCup').name).toBe('Kete of Pipi');
  });

  it('has kōkōwai and pounamu ribbons in the designed months', () => {
    const months = (tag: CardTag) => CARDS.filter((c) => c.tags.includes(tag)).map((c) => c.month);
    expect(months('redPoetry')).toEqual([1, 2, 9]);
    expect(months('blueRibbon')).toEqual([4, 5, 10]);
    expect(months('plainRed')).toEqual([7, 8, 11, 12]);
  });

  it('has June with three plain cards, and the storm in August', () => {
    const types = (m: number) => CARDS.filter((c) => c.month === m).map((c) => c.type);
    expect(types(6)).toEqual(['bright', 'chaff', 'chaff', 'chaff']);
    expect(types(8)).toEqual(['bright', 'animal', 'ribbon', 'chaff']);
    expect(named('lightning').name).toBe('Storm');
  });

  it('runs its seasons on the NZ calendar', () => {
    const season = (m: number) => landMonths(land)[m - 1]?.season;
    expect([season(1), season(4), season(7), season(10)]).toEqual([
      'summer',
      'autumn',
      'winter',
      'spring',
    ]);
  });
});
