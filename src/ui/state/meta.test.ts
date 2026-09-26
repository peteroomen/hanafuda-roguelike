import { describe, expect, it } from 'vitest';
import { landText } from '@/content/lands';
import { CHARM_UNLOCKS, LOCKED_AT_START } from '@/content/unlocks';
import { lockedCharms, met, refreshUnlocks } from './meta';
import { DEFAULT_PROFILE, getState, type Profile, setState } from './store';

const p = (patch: Partial<Profile>): Profile => ({ ...DEFAULT_PROFILE, ...patch });

describe('charm unlocks', () => {
  it('locks the seven charms for a new profile', () => {
    expect(LOCKED_AT_START).toHaveLength(7);
    expect(lockedCharms(DEFAULT_PROFILE)).toEqual(LOCKED_AT_START);
    expect(DEFAULT_PROFILE.unlockedCharms).toEqual([]);
    expect(DEFAULT_PROFILE.deckRecords).toEqual({});
  });

  it('checks each condition against the profile', () => {
    expect(
      met({ kind: 'scoreYaku', id: 'kasu', times: 10 }, p({ yakuScored: { kasu: 9 } }), null),
    ).toBe(false);
    expect(
      met({ kind: 'scoreYaku', id: 'kasu', times: 10 }, p({ yakuScored: { kasu: 10 } }), null),
    ).toBe(true);
    expect(met({ kind: 'koikoiTotal', calls: 25 }, p({ koikoiCalls: 24 }), null)).toBe(false);
    expect(met({ kind: 'koikoiTotal', calls: 25 }, p({ koikoiCalls: 25 }), null)).toBe(true);
    expect(met({ kind: 'calmSpirit', id: 'tengu' }, p({ defeatedSpirits: ['kappa'] }), null)).toBe(
      false,
    );
    expect(met({ kind: 'calmSpirit', id: 'tengu' }, p({ defeatedSpirits: ['tengu'] }), null)).toBe(
      true,
    );
    const ten = [
      'kodama',
      'kasaObake',
      'tanuki',
      'tengu',
      'kappa',
      'namazu',
      'kitsune',
      'nue',
      'yukiOnna',
      'oni',
    ] as const;
    expect(
      met({ kind: 'spiritsCalmed', count: 10 }, p({ defeatedSpirits: [...ten.slice(1)] }), null),
    ).toBe(false);
    expect(met({ kind: 'spiritsCalmed', count: 10 }, p({ defeatedSpirits: [...ten] }), null)).toBe(
      true,
    );
    expect(met({ kind: 'stopDamage', damage: 1000 }, p({ biggestHit: 999 }), null)).toBe(false);
    expect(met({ kind: 'stopDamage', damage: 1000 }, p({ biggestHit: 1000 }), null)).toBe(true);
  });

  it('gives a veteran every charm they already earned, on load', () => {
    setState({ profile: p({ bestMonth: 7, yakuScored: { kasu: 12, tsukifuda: 1 } }) });
    refreshUnlocks();
    const unlocked = getState().profile.unlockedCharms;
    expect(unlocked.sort()).toEqual(['almanac', 'bonsai', 'leafPile']);
    expect(lockedCharms(getState().profile)).toHaveLength(4);
  });

  it('describes every locked charm', () => {
    for (const id of LOCKED_AT_START)
      expect(landText(CHARM_UNLOCKS[id]?.unlockText ?? '', 'nippon')).toMatch(/\.$/);
  });
});
