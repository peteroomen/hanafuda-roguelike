import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings, type Settings } from './store';

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
