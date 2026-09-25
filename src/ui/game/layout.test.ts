import { describe, expect, it } from 'vitest';
import { CARDS } from '@/content/cards';
import { CARD_H, CARD_W, capLayout, fieldSlotCell, makeStage, sortHand, STAGE_W } from './layout';
import { dealOrder } from './visual';

describe('makeStage', () => {
  for (const h of [640, 700, 844]) {
    for (const n of [0, 8, 9, 12, 16]) {
      it(`keeps ${n} field cards in two rows between the lanes at height ${h}`, () => {
        const st = makeStage(h, n);
        expect(st.rows).toBe(2);
        const capH = CARD_H * st.capScale;
        // Below the spirit's lane and its counts, above the tracker.
        expect(st.fieldTop).toBeGreaterThanOrEqual(st.spiritCapY + capH + 14);
        expect(st.fieldTop + st.fieldH).toBeLessThanOrEqual(st.trackerY);
        // Every column fits on the stage.
        const lastX = st.fieldX + (st.cols - 1) * st.colStep + CARD_W * st.fieldScale;
        expect(lastX).toBeLessThanOrEqual(STAGE_W);
      });
    }
  }

  it('adds columns, not rows, past eight cards', () => {
    expect(makeStage(640, 8).cols).toBe(4);
    expect(makeStage(640, 9).cols).toBe(5);
    expect(makeStage(640, 12).cols).toBe(6);
  });
});

describe('fieldSlotCell', () => {
  it('lays the opening deal out as 4×2 and grows columns top then bottom', () => {
    expect(fieldSlotCell(0)).toEqual({ col: 0, row: 0 });
    expect(fieldSlotCell(4)).toEqual({ col: 0, row: 1 });
    expect(fieldSlotCell(7)).toEqual({ col: 3, row: 1 });
    expect(fieldSlotCell(8)).toEqual({ col: 4, row: 0 });
    expect(fieldSlotCell(9)).toEqual({ col: 4, row: 1 });
    expect(fieldSlotCell(10)).toEqual({ col: 5, row: 0 });
  });
});

describe('capLayout', () => {
  it('gives both seats the same card size and keeps the spirit clear of its hand', () => {
    const st = makeStage(640, 8);
    const counts = [3, 4, 5, 12];
    const mine = capLayout(st, 0, counts);
    const theirs = capLayout(st, 1, counts);
    const end = (l: { starts: number[]; step: number }) =>
      (l.starts[3] as number) + 11 * l.step + CARD_W * st.capScale;
    expect(end(mine)).toBeLessThanOrEqual(STAGE_W - 10);
    expect(end(theirs)).toBeLessThan(end(mine));
  });
});

describe('sortHand', () => {
  it('sorts by month, then Bright, Animal, Ribbon, Chaff', () => {
    const pick = (month: number, type: string) =>
      CARDS.find((c) => c.month === month && c.type === type)?.id as number;
    const hand = [pick(12, 'chaff'), pick(3, 'ribbon'), pick(1, 'bright'), pick(3, 'bright')];
    expect(sortHand(hand)).toEqual([
      pick(1, 'bright'),
      pick(3, 'bright'),
      pick(3, 'ribbon'),
      pick(12, 'chaff'),
    ]);
    // Doesn't touch its input.
    expect(hand[0]).toBe(pick(12, 'chaff'));
  });
});

describe('dealOrder', () => {
  it('deals two at a time: you, the field, the spirit', () => {
    expect(dealOrder([1, 2, 3, 4], [11, 12, 13, 14], [21, 22, 23, 24])).toEqual([
      1, 2, 11, 12, 21, 22, 3, 4, 13, 14, 23, 24,
    ]);
  });
});
