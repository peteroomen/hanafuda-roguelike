import { describe, expect, it } from 'vitest';
import { spiritDef } from '@/content/spirits';
import { choosePlay, makeEvaluator, scorePlay } from './ai';
import { handWith } from './testkit';

describe('spirit slips', () => {
  // The spirit holds the Crane (Jan bright, matching the Jan chaff on the field) and two
  // chaff with no match: capturing the Crane is clearly its best play.
  const h = handWith({ hands: [[], [0, 22, 38]], field: [2], captured: [[], []] });
  const ev = makeEvaluator(h, 1, spiritDef('kodama').persona, null);

  it('plays its best card normally', () => {
    expect(choosePlay(h, ev)).toBe(0);
  });

  it('plays its second-best card when it slips, never a random one', () => {
    const ranked = [0, 22, 38].sort((a, b) => scorePlay(h, ev, b) - scorePlay(h, ev, a));
    expect(choosePlay(h, ev, true)).toBe(ranked[1]);
  });
});
