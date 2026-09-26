import { describe, expect, it } from 'vitest';
import { OFUDA } from '@/content/ofuda';
import type { OmamoriId } from '@/content/omamori';
import { LOCKED_AT_START } from '@/content/unlocks';
import { newShop, offerPrice, rollOffers, type ShopContext } from './shop';

const ctx = (seed: number, month: number, locked?: readonly OmamoriId[]): ShopContext => ({
  seed,
  month,
  owned: [],
  ...(locked ? { locked } : {}),
  deckId: 'pine',
  omen: 0,
  discount: 0,
});

function charmsOffered(locked?: readonly OmamoriId[]): Set<OmamoriId> {
  const seen = new Set<OmamoriId>();
  for (let seed = 1; seed <= 150; seed++)
    for (let month = 1; month <= 12; month++) {
      const c = ctx(seed, month, locked);
      for (const o of [...newShop(c).offers, ...rollOffers(c, 1), ...rollOffers(c, 2)])
        if (o.kind === 'omamori') seen.add(o.id);
    }
  return seen;
}

describe('shop and locked charms', () => {
  it('never offers a locked charm, in the first roll or a reroll', () => {
    const seen = charmsOffered(LOCKED_AT_START);
    for (const id of LOCKED_AT_START) expect(seen.has(id)).toBe(false);
    expect(seen.size).toBeGreaterThan(20);
  });

  it('offers every charm once nothing is locked', () => {
    const seen = charmsOffered();
    for (const id of LOCKED_AT_START) expect(seen.has(id)).toBe(true);
  });
});

describe('Plum Deck', () => {
  it('sells talismans for 1 mon less (never below 1)', () => {
    for (const d of OFUDA) {
      const offer = { kind: 'ofuda', id: d.id, sold: false } as const;
      const pine = offerPrice(offer, { deckId: 'pine', omen: 0, discount: 0 });
      const plum = offerPrice(offer, { deckId: 'plum', omen: 0, discount: 0 });
      expect(plum).toBe(Math.max(1, pine - 1));
    }
  });
});
