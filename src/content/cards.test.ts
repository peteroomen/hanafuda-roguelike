import { describe, expect, it } from 'vitest';
import { ALL_CARD_IDS, CARDS, card, cardWithTag, MONTHS } from './cards';

describe('deck composition', () => {
  it('has 48 unique cards, four per month', () => {
    expect(CARDS).toHaveLength(48);
    expect(new Set(ALL_CARD_IDS).size).toBe(48);
    for (const m of MONTHS) {
      expect(CARDS.filter((c) => c.month === m.month)).toHaveLength(4);
    }
    CARDS.forEach((c, i) => expect(c.id).toBe(i));
  });

  it('has 5 Brights, 9 Animals, 10 Ribbons and 24 Chaff', () => {
    const count = (t: string) => CARDS.filter((c) => c.type === t).length;
    expect(count('bright')).toBe(5);
    expect(count('animal')).toBe(9);
    expect(count('ribbon')).toBe(10);
    expect(count('chaff')).toBe(24);
  });

  it('has 3 red poetry, 3 blue and 4 plain red ribbons in the right months', () => {
    const months = (tag: 'redPoetry' | 'blueRibbon' | 'plainRed') =>
      CARDS.filter((c) => c.tags.includes(tag)).map((c) => c.month);
    expect(months('redPoetry')).toEqual([1, 2, 3]);
    expect(months('blueRibbon')).toEqual([6, 9, 10]);
    expect(months('plainRed')).toEqual([4, 5, 7, 11]);
  });

  it('places every Bright and Animal in its traditional month', () => {
    const expectAt = (tag: Parameters<typeof cardWithTag>[0], month: number, type: string) => {
      const c = card(cardWithTag(tag));
      expect(c.month).toBe(month);
      expect(c.type).toBe(type);
    };
    expectAt('crane', 1, 'bright');
    expectAt('curtain', 3, 'bright');
    expectAt('moon', 8, 'bright');
    expectAt('rainMan', 11, 'bright');
    expectAt('phoenix', 12, 'bright');
    expectAt('warbler', 2, 'animal');
    expectAt('cuckoo', 4, 'animal');
    expectAt('bridge', 5, 'animal');
    expectAt('butterflies', 6, 'animal');
    expectAt('boar', 7, 'animal');
    expectAt('geese', 8, 'animal');
    expectAt('sakeCup', 9, 'animal');
    expectAt('deer', 10, 'animal');
    expectAt('swallow', 11, 'animal');
    expectAt('lightning', 11, 'chaff');
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
