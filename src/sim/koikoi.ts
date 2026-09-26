/**
 * Koi-koi expected value by rollout.
 *
 * At a real decision point we compare:
 *   stop    → damage now, the hand ends;
 *   koi-koi → play on (the player stops at its next chance) over many
 *             determinisations of the hidden cards (pile + spirit hand),
 *             measuring damage dealt, damage taken and exhaustion.
 */
import type { HandState } from '@/engine/hand';
import { Rng } from '@/engine/rng';
import { type FightState, previewPlayerStop, type RunState, runStep } from '@/engine/run';
import { makeBot } from './bots';

export interface KoikoiSample {
  readonly month: number;
  readonly cardsLeft: number;
  readonly callsSoFar: number;
  readonly stopDamage: number;
  readonly spiritHp: number;
  readonly playerHp: number;
  /** Mean damage dealt when continuing. */
  readonly goDealt: number;
  /** Mean damage taken when continuing. */
  readonly goTaken: number;
  readonly pWin: number;
  readonly pLose: number;
  readonly pExhaust: number;
  /** Probability that continuing kills the spirit this hand. */
  readonly pKill: number;
  /** Would stopping now kill? */
  readonly stopKills: boolean;
}

/** Shuffle the cards the player cannot see back into the pile and the spirit's hand. */
function determinise(h: HandState, rng: Rng): HandState {
  const hidden = [...h.pile, ...h.hands[1]];
  const shuffled = rng.shuffle(hidden);
  const spiritHand = shuffled.slice(0, h.hands[1].length);
  const pile = shuffled.slice(h.hands[1].length);
  return { ...h, pile, hands: [h.hands[0].slice(), spiritHand], peeked: [] };
}

export function sampleKoikoi(run: RunState, rollouts: number, seed: number): KoikoiSample | null {
  const f = run.fight as FightState;
  if (f.hand.phase !== 'decide' || f.hand.active !== 0) return null;
  const preview = previewPlayerStop(run);
  if (!preview) return null;
  const rng = new Rng(seed);
  let dealt = 0;
  let taken = 0;
  let win = 0;
  let lose = 0;
  let ex = 0;
  let kill = 0;
  const bot = makeBot(
    {
      kind: 'smart',
      archetype: 'auto',
      decide: { minCards: 99, maxThreat: 0, enoughFraction: 0, hpRisk: 0, maxCalls: 0 },
    },
    seed,
  );
  for (let i = 0; i < rollouts; i++) {
    // Call koi-koi, then play the rest of the hand with a stop-at-once player.
    let state: RunState = { ...run, fight: { ...f, hand: determinise(f.hand, rng) } };
    state = runStep(state, { type: 'hand', action: { type: 'koikoi' } }).state;
    let guard = 0;
    while (
      state.phase === 'fight' &&
      state.fight &&
      state.fight.phase === 'hand' &&
      guard++ < 200
    ) {
      const fh = state.fight.hand;
      state = runStep(state, fh.active === 1 ? { type: 'spirit' } : bot.next(state)).state;
    }
    const out = state.fight?.outcome;
    if (!out) {
      // The fight ended mid-hand (a strike) or the run ended.
      if (state.phase === 'reward' || state.phase === 'victory') {
        win += 1;
        kill += 1;
        dealt += f.hp;
      }
      continue;
    }
    if (out.kind === 'playerStop') {
      win += 1;
      dealt += out.score.damage;
      if (out.score.damage >= f.hp) kill += 1;
    } else if (out.kind === 'spiritStop') {
      lose += 1;
      taken += out.hit.damage;
    } else {
      ex += 1;
    }
  }
  return {
    month: run.month,
    cardsLeft: f.hand.hands[0].length,
    callsSoFar: f.hand.koikoiCalls[0],
    stopDamage: preview.damage,
    spiritHp: f.hp,
    playerHp: run.hp,
    goDealt: dealt / rollouts,
    goTaken: taken / rollouts,
    pWin: win / rollouts,
    pLose: lose / rollouts,
    pExhaust: ex / rollouts,
    pKill: kill / rollouts,
    stopKills: preview.damage >= f.hp,
  };
}

export function cardsIn(h: HandState): number {
  return h.deckIds.length - h.pile.length;
}
