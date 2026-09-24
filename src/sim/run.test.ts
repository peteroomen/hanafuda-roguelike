import { describe, expect, it } from 'vitest';
import { ALL_CARD_IDS, CARDS } from '@/content/cards';
import { OMAMORI_IDS, omamoriDef } from '@/content/omamori';
import { OFUDA_IDS } from '@/content/ofuda';
import { SPIRITS, spiritDef } from '@/content/spirits';
import { YAKU_IDS } from '@/content/yaku';
import { DECKS } from '@/content/decks';
import { playRun } from './driver';
import { cardCensus } from '@/engine/hand';
import {
  newRun,
  playerYakuMods,
  type RunState,
  runStep,
  spiritStats,
  spiritYakuMods,
  waitingOn,
} from '@/engine/run';

function censusOk(run: RunState): boolean {
  if (!run.fight) return true;
  const c = cardCensus(run.fight.hand).sort((a, b) => a - b);
  // Compare with the hand's own deck: a Torn card may crumble from the run deck mid-fight.
  const deck = run.fight.hand.deckIds.slice().sort((a, b) => a - b);
  return c.length === deck.length && c.every((id, i) => id === deck[i]);
}

describe('new run', () => {
  it('starts in month 1 with a fight and a dealt hand', () => {
    const { state, events } = newRun({ seed: 1 });
    expect(state.month).toBe(1);
    expect(state.phase).toBe('fight');
    expect(state.fight?.hand.hands[0]).toHaveLength(8);
    expect(events.some((e) => e.t === 'fightStart')).toBe(true);
    expect(waitingOn(state)).toBe('player');
    expect(state.schedule).toHaveLength(12);
    for (const m of [3, 6, 9, 12]) {
      expect(SPIRITS.find((s) => s.id === state.schedule[m - 1])?.boss).toBe(true);
    }
  });

  it('the guided year uses the tutorial spirits and stages', () => {
    const { state } = newRun({ seed: 5, guided: true });
    expect(state.schedule.slice(0, 3)).toEqual(['kodama', 'kasaObake', 'tanuki']);
    expect(state.fight?.stage).toBe('matching');
    expect(state.fight?.hand.yakuMods[0].disabled.length).toBeGreaterThan(10);
  });

  it('guided month 2 teaches all three counting sets, for both sides', () => {
    const spirit = spiritDef('kasaObake');
    const { state } = newRun({ seed: 5, guided: true });
    const live = (disabled: readonly string[]) =>
      YAKU_IDS.filter((id) => !disabled.includes(id)).sort();
    expect(live(playerYakuMods(state, spirit, 'oneYaku').disabled)).toEqual([
      'kasu',
      'tan',
      'tane',
    ]);
    expect(live(spiritYakuMods(spirit, 'oneYaku').disabled)).toEqual(['kasu', 'tan', 'tane']);
  });

  it('every deck starts cleanly', () => {
    for (const d of DECKS) {
      const { state } = newRun({ seed: 3, deckId: d.id });
      expect(state.deckId).toBe(d.id);
      expect(state.hp).toBeGreaterThan(0);
      expect(state.omamori.length).toBeLessThanOrEqual(state.omamoriSlots);
    }
  });

  it('spirit HP grows through the year and bosses are tougher', () => {
    const at = (month: number, id: string) =>
      spiritStats(
        { month: month as 1, omen: 0, guided: false },
        SPIRITS.find((s) => s.id === id) as (typeof SPIRITS)[number],
      );
    expect(at(12, 'kamaitachi').hp).toBeGreaterThan(at(1, 'kodama').hp * 5);
    expect(at(6, 'kappa').hp).toBeGreaterThan(at(5, 'kawauso').hp);
  });
});

describe('whole runs', () => {
  it('bots play full years to victory or defeat with every card accounted for', () => {
    for (const kind of ['random', 'greedy', 'smart'] as const) {
      for (let seed = 1; seed <= 12; seed++) {
        const r = playRun({
          seed,
          bot: { kind, archetype: 'auto' },
          guided: seed % 3 === 0,
          omen: seed % 6,
          onEvents: (state) => {
            if (!censusOk(state)) throw new Error(`census broken (${kind}, seed ${seed})`);
          },
        });
        expect(['victory', 'defeat']).toContain(r.finalState.phase);
        expect(r.finalState.hp).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('runs are deterministic for a seed and bot', () => {
    const a = playRun({ seed: 77, bot: { kind: 'smart', archetype: 'auto' } });
    const b = playRun({ seed: 77, bot: { kind: 'smart', archetype: 'auto' } });
    expect(JSON.stringify(a.finalState)).toBe(JSON.stringify(b.finalState));
  });

  it('run state survives a JSON round trip', () => {
    let { state } = newRun({ seed: 9 });
    const card = state.fight?.hand.hands[0][0] as number;
    state = runStep(state, { type: 'hand', action: { type: 'play', card } }).state;
    const copy = JSON.parse(JSON.stringify(state)) as RunState;
    expect(JSON.stringify(copy)).toBe(JSON.stringify(state));
  });
});

describe('shop', () => {
  function shopState(): RunState {
    // Drive a smart run until the first shop.
    let { state } = newRun({ seed: 21 });
    let guard = 0;
    const r = playRun({
      seed: 21,
      bot: { kind: 'smart', archetype: 'auto' },
      onEvents: (s) => {
        if (s.phase === 'shop' && guard === 0) {
          guard = 1;
          state = s;
        }
      },
    });
    expect(r).toBeTruthy();
    return state;
  }

  it('offers charms, a poem and talismans, and buying spends mon', () => {
    const s = shopState();
    expect(s.phase).toBe('shop');
    const offers = s.shop?.offers ?? [];
    expect(offers.filter((o) => o.kind === 'omamori').length).toBe(3);
    expect(offers.some((o) => o.kind === 'poem')).toBe(true);
    expect(offers.some((o) => o.kind === 'ofuda')).toBe(true);
    const rich = { ...s, mon: 99 };
    const idx = offers.findIndex((o) => o.kind === 'omamori');
    const after = runStep(rich, { type: 'buy', offer: idx }).state;
    expect(after.omamori.length).toBe(s.omamori.length + 1);
    expect(after.mon).toBeLessThan(99);
    expect(() => runStep(after, { type: 'buy', offer: idx })).toThrow();
  });

  it('rerolls, heals once, enhances a card and sells charms', () => {
    const s = { ...shopState(), mon: 99, hp: 10 };
    const rerolled = runStep(s, { type: 'reroll' }).state;
    expect(rerolled.shop?.rerolls).toBe(1);
    const healed = runStep(s, { type: 'heal' }).state;
    expect(healed.hp).toBeGreaterThan(10);
    expect(() => runStep(healed, { type: 'heal' })).toThrow();
    const enhanced = runStep(s, { type: 'enhance', card: 0 }).state;
    expect(enhanced.enhancements['0']).toBe(s.shop?.shrine.enhancement);
    const withCharm = { ...s, omamori: [{ id: 'redSeal' as const, counter: 0 }] };
    const sold = runStep(withCharm, { type: 'sell', slot: 0 }).state;
    expect(sold.omamori).toHaveLength(0);
    expect(sold.mon).toBe(99 + 2);
  });

  it('leaving the shop starts the next month', () => {
    const s = shopState();
    const next = runStep(s, { type: 'leaveShop' }).state;
    expect(next.phase).toBe('fight');
    expect(next.month).toBe(2);
  });
});

describe('talismans in a run', () => {
  it('every talisman can be used on your turn', () => {
    for (const id of OFUDA_IDS) {
      const { state } = newRun({ seed: 4 });
      const s: RunState = { ...state, ofuda: [id] };
      const h = s.fight?.hand;
      const handCard = h?.hands[0][0];
      const fieldCard = h?.field.find((c) => !h.frozen.includes(c));
      const after = runStep(s, {
        type: 'ofuda',
        slot: 0,
        ...(handCard !== undefined ? { handCard } : {}),
        ...(fieldCard !== undefined ? { fieldCard } : {}),
      }).state;
      expect(after.ofuda).toHaveLength(0);
    }
  });
});

describe('content sanity', () => {
  it('every charm has text, a price and at least one effect', () => {
    for (const id of OMAMORI_IDS) {
      const d = omamoriDef(id);
      expect(d.text.length).toBeGreaterThan(5);
      expect(d.price).toBeGreaterThan(0);
      expect(d.effects.length).toBeGreaterThan(0);
    }
  });
  it('the card table is intact', () => {
    expect(CARDS).toHaveLength(ALL_CARD_IDS.length);
  });
});
