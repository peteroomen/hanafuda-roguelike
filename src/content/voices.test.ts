import { describe, expect, it } from 'vitest';
import { SPIRITS } from './spirits';
import { VOICES } from './voices';

describe('spirit voices', () => {
  it('gives every spirit a mood and the lines every fight can need', () => {
    for (const s of SPIRITS) {
      const v = VOICES[s.id];
      expect(v, s.id).toBeDefined();
      for (const moment of ['hit', 'hurt', 'playerKoikoi', 'calmed'] as const)
        expect(v.lines[moment]?.length ?? 0, `${s.id} ${moment}`).toBeGreaterThan(0);
    }
  });

  it('keeps every line short enough for a speech bubble', () => {
    for (const [id, v] of Object.entries(VOICES))
      for (const lines of Object.values(v.lines))
        for (const line of lines) expect(line.length, `${id}: ${line}`).toBeLessThanOrEqual(48);
  });

  it('gives boss rule lines only to spirits with a rule', () => {
    for (const s of SPIRITS)
      if (VOICES[s.id].lines.rule) expect(s.rule, `${s.id} has rule lines`).toBeDefined();
  });
});
