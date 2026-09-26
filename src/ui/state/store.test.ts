import { describe, expect, it } from 'vitest';
import { newRun } from '@/engine/run';
import { DEFAULT_SETTINGS, migrateRun, migrateSettings, type Settings } from './store';

describe('migrateSettings', () => {
  const old = (tw: unknown) => ({ ...DEFAULT_SETTINGS, trainingWheels: tw }) as unknown as Settings;

  it('maps the old on/off training wheels to full/off', () => {
    expect(migrateSettings(old(true)).trainingWheels).toBe('full');
    expect(migrateSettings(old(false)).trainingWheels).toBe('off');
  });

  it('keeps the three levels and repairs anything else', () => {
    for (const tw of ['off', 'dots', 'full'] as const)
      expect(migrateSettings(old(tw)).trainingWheels).toBe(tw);
    expect(migrateSettings(old('lots')).trainingWheels).toBe('full');
  });
});

describe('migrateRun', () => {
  it('loads a run saved before lands existed as a Nippon run', () => {
    const { state } = newRun({ seed: 1 });
    const { land: _land, ...old } = state;
    expect(migrateRun(old as typeof state).land).toBe('nippon');
  });

  it('keeps an Aotearoa run in Aotearoa, with its own cards', () => {
    const { state } = newRun({ seed: 1, land: 'aotearoa' });
    expect(migrateRun(state).land).toBe('aotearoa');
    expect(Math.min(...state.deck)).toBe(48);
  });
});
