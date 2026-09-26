import { describe, expect, it } from 'vitest';
import { type CardId, landCardIds, landCards } from '@/content/cards';
import { DEFAULT_RULES } from '@/content/rules';
import {
  apparentMonth,
  armFrog,
  cardCensus,
  downpour,
  type HandEvent,
  type HandState,
  legalActions,
  newHand,
  peek,
  skipNextFlip,
  step,
  swapCards,
} from './hand';
import { chaffOf, handWith, playRandom, run, tag } from './testkit';

const CARDS = landCards('nippon');
const ALL_CARD_IDS = landCardIds('nippon');

// Card ids used below (see content/cards.ts): Jan 0 crane, 1 red poetry, 2-3 chaff;
// Feb 4 warbler, 5 poetry, 6-7 chaff; Mar 8 curtain; Aug 28 moon; Dec 44 phoenix, 45-47 chaff.
const [janChaffA, janChaffB] = chaffOf(1) as [CardId, CardId];
const [febChaffA, febChaffB] = chaffOf(2) as [CardId, CardId];
const decChaff = chaffOf(12) as [CardId, CardId, CardId];
const crane = tag('crane');
const janRibbon = 1;

const sorted = (ids: readonly CardId[]) => ids.slice().sort((a, b) => a - b);

describe('capture rules (played card)', () => {
  it('no match: the card stays on the field', () => {
    const s = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [febChaffB],
      pile: [decChaff[0]],
    });
    const after = step(s, { type: 'play', card: janChaffA }).state;
    expect(after.field).toContain(janChaffA);
    expect(after.captured[0]).toEqual([]);
    expect(after.phase).toBe('flip');
  });

  it('one match: both cards are captured', () => {
    const s = handWith({ hands: [[janChaffA], [febChaffA]], field: [crane], pile: [decChaff[0]] });
    const after = step(s, { type: 'play', card: janChaffA }).state;
    expect(sorted(after.captured[0])).toEqual(sorted([janChaffA, crane]));
    expect(after.field).not.toContain(crane);
  });

  it('two matches: the player chooses which to take', () => {
    const s = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [crane, janRibbon],
      pile: [decChaff[0]],
    });
    const mid = step(s, { type: 'play', card: janChaffA }).state;
    expect(mid.phase).toBe('playChoice');
    expect(legalActions(mid)).toEqual([
      { type: 'choose', card: crane },
      { type: 'choose', card: janRibbon },
    ]);
    const after = step(mid, { type: 'choose', card: janRibbon }).state;
    expect(sorted(after.captured[0])).toEqual(sorted([janChaffA, janRibbon]));
    expect(after.field).toContain(crane);
    expect(after.phase).toBe('flip');
  });

  it('two matches with a target: takes that one without asking', () => {
    const s = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [crane, janRibbon],
      pile: [decChaff[0]],
    });
    const { state: after, events } = step(s, { type: 'play', card: janChaffA, target: janRibbon });
    expect(after.phase).toBe('flip');
    expect(sorted(after.captured[0])).toEqual(sorted([janChaffA, janRibbon]));
    expect(after.field).toContain(crane);
    expect(events.map((ev) => ev.t)).not.toContain('choice');
  });

  it('a target that is not a match is ignored', () => {
    const s = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [crane, janRibbon, febChaffB],
      pile: [decChaff[0]],
    });
    const mid = step(s, { type: 'play', card: janChaffA, target: febChaffB }).state;
    expect(mid.phase).toBe('playChoice');
  });

  it('three matches: all four are taken', () => {
    const s = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [crane, janRibbon, janChaffB],
      pile: [decChaff[0]],
    });
    const after = step(s, { type: 'play', card: janChaffA }).state;
    expect(sorted(after.captured[0])).toEqual(sorted([crane, janRibbon, janChaffA, janChaffB]));
  });

  it('playing a card you do not hold is illegal', () => {
    const s = handWith({ hands: [[janChaffA], [febChaffA]], field: [crane] });
    expect(() => step(s, { type: 'play', card: febChaffA })).toThrow();
  });
});

describe('capture rules (flipped card)', () => {
  it('a flip that matches two cards asks for a choice', () => {
    const s = handWith({
      hands: [[decChaff[0], decChaff[1]], [febChaffA]],
      field: [crane, janRibbon],
      pile: [janChaffA],
    });
    const afterPlay = step(s, { type: 'play', card: decChaff[0] }).state;
    const mid = step(afterPlay, { type: 'flip' }).state;
    expect(mid.phase).toBe('flipChoice');
    const after = step(mid, { type: 'choose', card: crane }).state;
    expect(sorted(after.captured[0])).toEqual(sorted([janChaffA, crane]));
    expect(after.active).toBe(1);
  });

  it('a flip with one match captures', () => {
    const s = handWith({
      hands: [[decChaff[0], decChaff[1]], [febChaffA]],
      field: [crane],
      pile: [janChaffA],
    });
    const after = run(s, [{ type: 'play', card: decChaff[0] }, { type: 'flip' }]);
    expect(sorted(after.captured[0])).toEqual(sorted([janChaffA, crane]));
  });

  it('a flip with three matches sweeps', () => {
    const s = handWith({
      hands: [[decChaff[0], decChaff[1]], [febChaffA]],
      field: [crane, janRibbon, janChaffB],
      pile: [janChaffA],
    });
    const after = run(s, [{ type: 'play', card: decChaff[0] }, { type: 'flip' }]);
    expect(after.captured[0]).toHaveLength(4);
  });
});

describe('stop and koi-koi', () => {
  // Seat 0 already has the Curtain and Moon; capturing the Crane makes Three Brights.
  const setup = () =>
    handWith({
      hands: [
        [janChaffA, decChaff[0], decChaff[1]],
        [febChaffA, febChaffB, 12],
      ],
      field: [crane, 16],
      captured: [[tag('curtain'), tag('moon')], []],
      pile: [decChaff[2], 20, 24, 36],
    });

  it('forming a yaku asks for a decision', () => {
    const s = run(setup(), [{ type: 'play', card: janChaffA }, { type: 'flip' }]);
    expect(s.phase).toBe('decide');
    expect(legalActions(s).map((a) => a.type)).toEqual(['stop', 'koikoi']);
  });

  it('stop ends the hand and scores it', () => {
    const s = run(setup(), [{ type: 'play', card: janChaffA }, { type: 'flip' }, { type: 'stop' }]);
    expect(s.phase).toBe('over');
    expect(s.result).toMatchObject({ kind: 'stop', winner: 0, points: 5 });
    expect(legalActions(s)).toEqual([]);
  });

  it('koi-koi hands the turn over and only improvement asks again', () => {
    let s = run(setup(), [{ type: 'play', card: janChaffA }, { type: 'flip' }, { type: 'koikoi' }]);
    expect(s.phase).toBe('play');
    expect(s.active).toBe(1);
    expect(s.koikoi).toEqual([1, 0]);
    s = run(s, [{ type: 'play', card: febChaffA }, { type: 'flip' }]);
    s = run(s, [{ type: 'play', card: decChaff[0] }, { type: 'flip' }]);
    // No new yaku for seat 0, so play simply continues.
    expect(s.phase).toBe('play');
  });

  it('forming a yaku with no cards left scores automatically', () => {
    const s0 = handWith({
      hands: [[janChaffA], [febChaffA]],
      field: [crane],
      captured: [[tag('curtain'), tag('moon')], []],
      pile: [decChaff[1], decChaff[0]],
    });
    const s = run(s0, [{ type: 'play', card: janChaffA }, { type: 'flip' }]);
    expect(s.phase).toBe('over');
    expect(s.result).toMatchObject({ kind: 'stop', winner: 0 });
  });

  it('a hand with no stop is exhausted', () => {
    const s0 = handWith({ hands: [[janChaffA], [febChaffA]], field: [16], pile: [45, 46] });
    const s = run(s0, [
      { type: 'play', card: janChaffA },
      { type: 'flip' },
      { type: 'play', card: febChaffA },
      { type: 'flip' },
    ]);
    expect(s.phase).toBe('over');
    expect(s.result?.kind).toBe('exhausted');
  });

  it('koi-koi weight follows the rule set (Tanuki counts calls double)', () => {
    const s0 = handWith(
      {
        hands: [
          [janChaffA, decChaff[0]],
          [febChaffA, febChaffB],
        ],
        field: [crane],
        captured: [[tag('curtain'), tag('moon')], []],
        pile: [decChaff[1], decChaff[2]],
      },
      { rules: { ...DEFAULT_RULES, koiKoiCallWeight: 2 } },
    );
    const s = run(s0, [{ type: 'play', card: janChaffA }, { type: 'flip' }, { type: 'koikoi' }]);
    expect(s.koikoi).toEqual([2, 0]);
    expect(s.koikoiCalls).toEqual([1, 0]);
  });
});

describe('talismans', () => {
  it('Frog: keep or leap to the next card', () => {
    const s0 = handWith({
      hands: [[decChaff[0], decChaff[1]], [febChaffA]],
      field: [crane],
      pile: [janChaffA, 16],
    });
    const armed = armFrog(s0, 0).state;
    const revealed = run(armed, [{ type: 'play', card: decChaff[0] }, { type: 'flip' }]);
    expect(revealed.phase).toBe('frogDecide');
    expect(revealed.revealed).toBe(16);
    const leapt = step(revealed, { type: 'redoFlip' }).state;
    // The iris card went to the bottom; the January chaff was flipped and took the crane.
    expect(leapt.pile[0]).toBe(16);
    expect(sorted(leapt.captured[0])).toEqual(sorted([janChaffA, crane]));
    const kept = step(revealed, { type: 'keepFlip' }).state;
    expect(kept.field).toContain(16);
  });

  it('Swap trades a hand card for a field card without capturing', () => {
    const s0 = handWith({ hands: [[janChaffA], [febChaffA]], field: [crane] });
    const s = swapCards(s0, 0, janChaffA, crane).state;
    expect(s.hands[0]).toEqual([crane]);
    expect(s.field).toEqual([janChaffA]);
    expect(s.captured[0]).toEqual([]);
  });

  it('Downpour deals a fresh field of the same size', () => {
    const s0 = newHand({ rules: DEFAULT_RULES, month: 1, seed: 7, lead: 0 }).state;
    const s = downpour(s0, 0).state;
    expect(s.field).toHaveLength(s0.field.length);
    expect(sorted(cardCensus(s))).toEqual(sorted(ALL_CARD_IDS));
  });

  it('Peek reveals the top three cards in draw order', () => {
    const s0 = handWith({ hands: [[janChaffA], [febChaffA]], pile: [45, 46, 47] });
    const s = peek(s0, 3).state;
    expect(s.peeked).toEqual([47, 46, 45]);
  });

  it('Wind Charm skips the next flip', () => {
    const s0 = handWith({
      hands: [[janChaffA], [febChaffA, febChaffB]],
      field: [crane],
      pile: [45],
    });
    const s1 = skipNextFlip(s0, 0).state;
    const s = step(s1, { type: 'play', card: janChaffA }).state;
    expect(s.active).toBe(1);
    expect(s.pile).toContain(45);
  });
});

describe('enhancements', () => {
  it('Inked cards also match the next month', () => {
    const s0 = handWith(
      { hands: [[janChaffA], [febChaffB]], field: [4], pile: [45] },
      { enhancements: { [janChaffA]: 'inked' } },
    );
    const s = step(s0, { type: 'play', card: janChaffA }).state;
    expect(sorted(s.captured[0])).toEqual(sorted([janChaffA, 4]));
  });
});

describe('boss mechanics', () => {
  it('Tengu snatches the first Bright you capture each hand and hides it under the pile', () => {
    const s0 = handWith(
      {
        hands: [
          [janChaffA, 10],
          [febChaffA, febChaffB],
        ],
        field: [crane, tag('curtain')],
        pile: [45, 46, 47],
      },
      { boss: { stealFirstBrightFrom: 0 } },
    );
    const r = step(s0, { type: 'play', card: janChaffA });
    expect(r.events.some((e: HandEvent) => e.t === 'steal')).toBe(true);
    expect(r.state.captured[0]).toEqual([janChaffA]);
    expect(r.state.captured[1]).toEqual([]);
    expect(r.state.pile[0]).toBe(crane);
    let s = run(r.state, [{ type: 'flip' }, { type: 'play', card: febChaffA }, { type: 'flip' }]);
    s = step(s, { type: 'play', card: 10 }).state;
    expect(s.captured[0]).toContain(tag('curtain'));
  });

  it('Yuki-onna freezes field cards, which then cannot be captured', () => {
    const s0 = handWith(
      {
        hands: [
          [janChaffA, decChaff[0]],
          [febChaffA, decChaff[1]],
        ],
        field: [crane, 16],
        pile: [decChaff[2], 20],
      },
      { boss: { freeze: { by: 1, max: 1 } }, lead: 1 },
    );
    const s1 = run({ ...s0, active: 1 }, [{ type: 'play', card: febChaffA }, { type: 'flip' }]);
    expect(s1.frozen).toEqual([crane]);
    const s2 = step(s1, { type: 'play', card: janChaffA }).state;
    expect(s2.captured[0]).toEqual([]);
    expect(s2.field).toContain(janChaffA);
  });

  it('Kitsune disguises field cards for its victim until they are touched', () => {
    const s0 = newHand({
      rules: DEFAULT_RULES,
      month: 9,
      seed: 3,
      lead: 0,
      boss: { disguise: { victim: 0, max: 3, chance: 1 } },
    }).state;
    const disguised = Object.keys(s0.disguised).map(Number);
    expect(disguised).toHaveLength(3);
    for (const id of disguised) {
      expect(apparentMonth(s0, id, 0)).not.toBe(CARDS[id]?.month);
      expect(apparentMonth(s0, id, 1)).toBe(CARDS[id]?.month);
    }
  });

  it('Namazu shakes the field back into the pile on schedule', () => {
    const s0 = newHand({
      rules: DEFAULT_RULES,
      month: 6,
      seed: 11,
      lead: 0,
      boss: { quake: { every: 1 } },
    }).state;
    let s: HandState = s0;
    const events: HandEvent[] = [];
    for (let i = 0; i < 12 && s.phase !== 'over' && !events.some((e) => e.t === 'quake'); i++) {
      const legal = legalActions(s);
      const a = legal.find((x) => x.type === 'stop') ?? legal[0];
      const r = step(s, a as NonNullable<typeof a>);
      events.push(...r.events);
      s = r.state;
    }
    expect(events.some((e) => e.t === 'quake')).toBe(true);
    expect(sorted(cardCensus(s))).toEqual(sorted(ALL_CARD_IDS));
  });
});

describe('invariants over random play', () => {
  it('every card is accounted for at every step, and every hand ends', () => {
    const all = sorted(ALL_CARD_IDS);
    for (let seed = 1; seed <= 1500; seed++) {
      const final = playRandom(
        {
          rules: DEFAULT_RULES,
          month: ((seed % 12) + 1) as 1,
          seed,
          lead: (seed % 2) as 0 | 1,
          ...(seed % 5 === 0 ? { boss: { freeze: { by: 1 as const, max: 3 } } } : {}),
          ...(seed % 7 === 0
            ? { boss: { disguise: { victim: 0 as const, max: 3, chance: 0.5 } } }
            : {}),
          ...(seed % 11 === 0 ? { boss: { quake: { every: 2 } } } : {}),
          ...(seed % 13 === 0 ? { boss: { stealFirstBrightFrom: 0 as const } } : {}),
        },
        seed * 31,
        (s) => {
          const census = sorted(cardCensus(s));
          if (census.length !== 48 || census.some((id, i) => id !== all[i])) {
            throw new Error(`census broken at seed ${seed}: ${census.length}`);
          }
        },
      );
      expect(final.phase).toBe('over');
      expect(legalActions(final)).toEqual([]);
    }
  });

  it('never deals four of a month to the field when redeals are on', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const s = newHand({ rules: DEFAULT_RULES, month: 1, seed, lead: 0 }).state;
      const counts = new Map<number, number>();
      for (const id of s.field)
        counts.set(CARDS[id]?.month ?? 0, (counts.get(CARDS[id]?.month ?? 0) ?? 0) + 1);
      expect(Math.max(...counts.values())).toBeLessThan(4);
    }
  });
});

describe('determinism', () => {
  it('same seed and same actions give the same result', () => {
    const setup = { rules: DEFAULT_RULES, month: 5 as const, seed: 424242, lead: 0 as const };
    const a = playRandom(setup, 99);
    const b = playRandom(setup, 99);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different seeds deal differently', () => {
    const a = newHand({ rules: DEFAULT_RULES, month: 1, seed: 1, lead: 0 }).state;
    const b = newHand({ rules: DEFAULT_RULES, month: 1, seed: 2, lead: 0 }).state;
    expect(a.hands[0]).not.toEqual(b.hands[0]);
  });

  it('state survives a JSON round trip mid-hand', () => {
    const setup = { rules: DEFAULT_RULES, month: 2 as const, seed: 5, lead: 1 as const };
    let s = newHand(setup).state;
    s = step(s, legalActions(s)[0] as never).state;
    const copy = JSON.parse(JSON.stringify(s)) as HandState;
    const next = legalActions(s)[0] as never;
    expect(JSON.stringify(step(copy, next).state)).toBe(JSON.stringify(step(s, next).state));
  });
});
