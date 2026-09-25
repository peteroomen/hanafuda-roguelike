/**
 * Meta progression: records runs in the profile and works out what unlocked.
 */
import { DECKS, deckDef, OMENS, type UnlockCondition } from '@/content/decks';
import { yakuDef } from '@/content/yaku';
import type { RunState } from '@/engine/run';
import { getState, type Profile, updateProfile } from './store';

function met(c: UnlockCondition, p: Profile, run: RunState | null): boolean {
  switch (c.kind) {
    case 'always':
      return true;
    case 'reachMonth':
      return p.bestMonth >= c.month;
    case 'defeatBoss':
      return p.defeatedSpirits.some((id) =>
        ['tanuki', 'tengu', 'kappa', 'namazu', 'kitsune', 'nue', 'yukiOnna', 'oni'].includes(id),
      );
    case 'scoreFamily':
      return Object.keys(p.yakuScored).some((y) => yakuDef(y as never).family === c.family);
    case 'koikoiInHand':
      return (run?.stats.maxKoikoiInHand ?? 0) >= c.calls || p.koikoiCalls >= 999;
    case 'winRun':
      return p.runsWon > 0;
    case 'stopDamage':
      return p.biggestHit >= c.damage;
  }
}

/** Fold a run into the profile. Returns human-readable unlock lines. */
export function recordRun(run: RunState, finished: boolean): string[] {
  const before = getState().profile;
  const won = run.phase === 'victory';
  const yakuScored = { ...before.yakuScored };
  for (const [k, v] of Object.entries(run.stats.yakuScored)) {
    yakuScored[k as keyof typeof yakuScored] =
      (yakuScored[k as keyof typeof yakuScored] ?? 0) + (v ?? 0);
  }
  const defeated = new Set(before.defeatedSpirits);
  for (let m = 1; m < run.month || (won && m <= 12); m++) {
    const id = run.schedule[m - 1];
    if (id) defeated.add(id);
    if (m >= 12) break;
  }
  let next: Profile = {
    ...before,
    runsWon: before.runsWon + (won ? 1 : 0),
    bestMonth: Math.max(before.bestMonth, run.month),
    biggestHit: Math.max(before.biggestHit, run.stats.biggestHit),
    koikoiCalls: before.koikoiCalls + run.stats.koikoiCalls,
    maxOmenWon: won ? Math.max(before.maxOmenWon, run.omen) : before.maxOmenWon,
    yakuScored,
    defeatedSpirits: [...defeated],
    guidedDone: before.guidedDone || run.month > 3 || won,
    history: finished
      ? [
          ...before.history.slice(-29),
          {
            won,
            month: run.month,
            deck: run.deckId,
            omen: run.omen,
            hit: run.stats.biggestHit,
            date: new Date().toISOString().slice(0, 10),
          },
        ]
      : before.history,
  };
  const unlocks: string[] = [];
  const decks = new Set(next.unlockedDecks);
  for (const d of DECKS) {
    if (!decks.has(d.id) && met(d.unlock, next, run)) {
      decks.add(d.id);
      unlocks.push(`${deckDef(d.id).name}: ${deckDef(d.id).text}`);
    }
  }
  next = { ...next, unlockedDecks: [...decks] };
  if (won && run.omen === before.maxOmenWon + 1 && run.omen + 1 < OMENS.length) {
    const o = OMENS[run.omen + 1];
    if (o) unlocks.push(`Omen ${o.level}: ${o.name}. ${o.text}`);
  }
  updateProfile(() => next);
  return unlocks;
}

export function noteSeen(run: RunState): void {
  updateProfile((p) => {
    const spirits = new Set(p.seenSpirits);
    const id = run.schedule[run.month - 1];
    if (id) spirits.add(id);
    const charms = new Set(p.seenCharms);
    for (const o of run.shop?.offers ?? []) if (o.kind === 'omamori') charms.add(o.id);
    for (const m of run.omamori) charms.add(m.id);
    if (spirits.size === p.seenSpirits.length && charms.size === p.seenCharms.length) return p;
    return { ...p, seenSpirits: [...spirits], seenCharms: [...charms] };
  });
}
