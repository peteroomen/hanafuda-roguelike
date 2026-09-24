/**
 * App-level state: which screen, settings, the persistent profile and the
 * current run. A tiny external store read with useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';
import type { DeckId } from '@/content/decks';
import type { OmamoriId } from '@/content/omamori';
import type { SpiritId } from '@/content/spirits';
import type { YakuId } from '@/content/yaku';
import { RUN_VERSION, type RunState } from '@/engine/run';

export type Screen = 'title' | 'setup' | 'game' | 'collection' | 'settings';
export type Speed = 'normal' | 'fast' | 'instant';

export interface Settings {
  trainingWheels: boolean;
  guide: boolean;
  sfx: number;
  music: number;
  haptics: boolean;
  speed: Speed;
  reduceMotion: boolean;
}

export interface Profile {
  runsStarted: number;
  runsWon: number;
  bestMonth: number;
  biggestHit: number;
  koikoiCalls: number;
  /** Highest omen won (−1 = none). The next level up is unlocked. */
  maxOmenWon: number;
  unlockedDecks: DeckId[];
  seenCharms: OmamoriId[];
  seenSpirits: SpiritId[];
  defeatedSpirits: SpiritId[];
  tipsSeen: string[];
  yakuScored: Partial<Record<YakuId, number>>;
  guidedDone: boolean;
  history: { won: boolean; month: number; deck: DeckId; omen: number; hit: number; date: string }[];
}

export interface AppState {
  screen: Screen;
  settings: Settings;
  profile: Profile;
  run: RunState | null;
}

export const DEFAULT_SETTINGS: Settings = {
  trainingWheels: true,
  guide: true,
  sfx: 0.8,
  music: 0.5,
  haptics: true,
  speed: 'normal',
  reduceMotion: false,
};

export const DEFAULT_PROFILE: Profile = {
  runsStarted: 0,
  runsWon: 0,
  bestMonth: 0,
  biggestHit: 0,
  koikoiCalls: 0,
  maxOmenWon: -1,
  unlockedDecks: ['pine'],
  seenCharms: [],
  seenSpirits: [],
  defeatedSpirits: [],
  tipsSeen: [],
  yakuScored: {},
  guidedDone: false,
  history: [],
};

const KEYS = { settings: 'tp.settings.v1', profile: 'tp.profile.v1', run: 'tp.run.v1' };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return typeof fallback === 'object' && fallback !== null ? { ...fallback, ...parsed } : parsed;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); the game still runs.
  }
}

function loadRun(): RunState | null {
  const run = load<RunState | null>(KEYS.run, null);
  if (!run || run.version !== RUN_VERSION) return null;
  if (run.phase === 'victory' || run.phase === 'defeat') return null;
  return run;
}

let state: AppState = {
  screen: 'title',
  settings: load(KEYS.settings, DEFAULT_SETTINGS),
  profile: load(KEYS.profile, DEFAULT_PROFILE),
  run: loadRun(),
};

const listeners = new Set<() => void>();

export function getState(): AppState {
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  const prev = state;
  state = { ...state, ...next };
  if (next.settings && next.settings !== prev.settings) save(KEYS.settings, state.settings);
  if (next.profile && next.profile !== prev.profile) save(KEYS.profile, state.profile);
  if ('run' in next && next.run !== prev.run) save(KEYS.run, state.run);
  for (const l of listeners) l();
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  );
}

export function updateSettings(patch: Partial<Settings>): void {
  setState((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function updateProfile(fn: (p: Profile) => Profile): void {
  setState((s) => ({ profile: fn(s.profile) }));
}

export function markTip(id: string): void {
  updateProfile((p) => (p.tipsSeen.includes(id) ? p : { ...p, tipsSeen: [...p.tipsSeen, id] }));
}

export function resetProgress(): void {
  save(KEYS.profile, null);
  save(KEYS.run, null);
  setState({ profile: { ...DEFAULT_PROFILE }, run: null, screen: 'title' });
}

/**
 * Animation timing multiplier for a speed setting. Timings in the code are written at 'fast';
 * 'normal' plays everything at half speed so each move is easy to follow.
 */
export function speedFactorOf(speed: Speed): number {
  return speed === 'instant' ? 0 : speed === 'fast' ? 1 : 2;
}

/** Animation timing multiplier for the current speed setting. */
export function speedFactor(): number {
  return speedFactorOf(state.settings.speed);
}
