/**
 * Spirit AI (and the building blocks the simulator's player bots reuse).
 *
 * v1 per the brief: greedy capture toward a declared intent, plus denial, with a
 * per-spirit stop / koi-koi threshold. Deterministic: no randomness at all.
 */
import { CARDS, type CardId } from '@/content/cards';
import type { AiPersona } from '@/content/spirits';
import { yakuDef, type YakuId } from '@/content/yaku';
import {
  apparentMatches,
  currentYaku,
  fieldMatches,
  type HandAction,
  type HandState,
  yakuContext,
} from './hand';
import { other, type Seat } from './types';
import { totalPoints, yakuProgress, type YakuProgress } from './yaku';

const TYPE_BASE = { bright: 3, animal: 1.6, ribbon: 1.3, chaff: 0.45 } as const;

export interface Intent {
  readonly id: YakuId;
  readonly have: number;
  readonly need: number;
  readonly wanted: readonly CardId[];
}

export function progressFor(s: HandState, seat: Seat): YakuProgress[] {
  return yakuProgress(
    { own: s.captured[seat], opponent: s.captured[other(seat)], inGame: s.deckIds },
    yakuContext(s, seat),
  );
}

/** How much each card is worth to a seat right now (type value + yaku progress). */
export function valueMap(
  s: HandState,
  seat: Seat,
  persona: AiPersona | null,
  intent: YakuId | null,
): Float64Array {
  const v = new Float64Array(48);
  for (const id of s.deckIds) {
    const c = CARDS[id];
    if (c) v[id] = TYPE_BASE[c.type];
  }
  for (const p of progressFor(s, seat)) {
    const def = yakuDef(p.id);
    const pref = persona?.prefs[def.family] ?? 1;
    if (p.complete) {
      if (def.perExtra > 0) for (const w of p.wanted) v[w] = (v[w] ?? 0) + def.perExtra * pref;
      continue;
    }
    if (p.blocked) continue;
    const rem = Math.max(1, p.need - p.have);
    const focus = intent === p.id ? 1 + (persona?.focus ?? 0) : 1;
    const step = ((def.points + 1.5) * pref * focus) / rem;
    for (const w of p.wanted) v[w] = (v[w] ?? 0) + step;
  }
  return v;
}

/** Cards whose location is unknown to `seat` (the pile, plus the opponent's hand unless it can see it). */
export function unseenFor(s: HandState, seat: Seat, seesHand: boolean): CardId[] {
  const known = new Set<CardId>([...s.hands[seat], ...s.field, ...s.captured[0], ...s.captured[1]]);
  if (s.pending) known.add(s.pending.card);
  if (s.revealed !== null) known.add(s.revealed);
  if (seesHand) for (const id of s.hands[other(seat)]) known.add(id);
  for (const id of s.peeked) known.add(id);
  return s.deckIds.filter((id) => !known.has(id));
}

function sameMonthUnseen(unseen: readonly CardId[], month: number): number {
  let k = 0;
  for (const id of unseen) if (CARDS[id]?.month === month) k++;
  return k;
}

/** Probability that the opponent holds at least one of k specific unseen cards. */
function probHolds(k: number, oppHand: number, unseenCount: number): number {
  if (k <= 0 || oppHand <= 0 || unseenCount <= 0) return 0;
  let pNone = 1;
  for (let i = 0; i < oppHand; i++) {
    const denom = unseenCount - i;
    if (denom <= 0) break;
    pNone *= Math.max(0, denom - k) / denom;
  }
  return 1 - pNone;
}

export interface Evaluator {
  readonly seat: Seat;
  readonly persona: AiPersona;
  readonly own: Float64Array;
  readonly opp: Float64Array;
  readonly unseen: readonly CardId[];
  readonly seesHand: boolean;
  /** Use apparent (possibly disguised) months, as the player would. */
  readonly fooled: boolean;
}

export function makeEvaluator(
  s: HandState,
  seat: Seat,
  persona: AiPersona,
  intent: YakuId | null,
): Evaluator {
  const seesHand = Boolean(persona.seesHand) || s.revealHand[seat];
  return {
    seat,
    persona,
    own: valueMap(s, seat, persona, intent),
    opp: valueMap(s, other(seat), null, null),
    unseen: unseenFor(s, seat, seesHand),
    seesHand,
    fooled: s.boss.disguise?.victim === seat,
  };
}

/** Value to `seat` of capturing card x (own gain plus denying the opponent). */
export function gain(ev: Evaluator, x: CardId): number {
  const c = CARDS[x];
  const base = c ? TYPE_BASE[c.type] : 0;
  const deny = Math.max(0, (ev.opp[x] ?? 0) - base * 0.5);
  return (ev.own[x] ?? 0) + ev.persona.denial * deny;
}

function captureValue(ev: Evaluator, card: CardId, matches: readonly CardId[]): number {
  if (matches.length === 0) return 0;
  if (matches.length === 2) {
    return (
      gain(ev, card) + Math.max(gain(ev, matches[0] as CardId), gain(ev, matches[1] as CardId))
    );
  }
  let v = gain(ev, card);
  for (const m of matches) v += gain(ev, m);
  return v;
}

function matchesFor(s: HandState, ev: Evaluator, card: CardId): CardId[] {
  return ev.fooled ? apparentMatches(s, card, ev.seat) : fieldMatches(s, card);
}

/** Risk of leaving `card` on the field for the opponent. */
function placeRisk(s: HandState, ev: Evaluator, card: CardId): number {
  const month = CARDS[card]?.month ?? 0;
  const oppHand = s.hands[other(ev.seat)];
  let p: number;
  if (ev.seesHand) p = oppHand.some((h) => CARDS[h]?.month === month) ? 1 : 0;
  else p = probHolds(sameMonthUnseen(ev.unseen, month), oppHand.length, ev.unseen.length);
  const oppValue = (ev.opp[card] ?? 0) + 0.6;
  let risk = p * oppValue;
  // Holding a partner of the same month means we may take it back next turn.
  const partner = s.hands[ev.seat].some((h) => h !== card && CARDS[h]?.month === month);
  if (partner) risk -= (1 - p) * 0.5 * gain(ev, card);
  return risk;
}

/** Expected value of the flip that follows, given the field after a play. */
function flipEV(
  ev: Evaluator,
  field: readonly CardId[],
  frozen: readonly CardId[],
  s: HandState,
): number {
  const pool = ev.unseen;
  if (pool.length === 0) return 0;
  let total = 0;
  for (const u of pool) {
    const um = CARDS[u]?.month;
    const matches: CardId[] = [];
    for (const f of field) if (!frozen.includes(f) && CARDS[f]?.month === um) matches.push(f);
    if (matches.length) total += captureValue(ev, u, matches);
  }
  // Only a fraction of unseen cards are actually in the pile.
  const pileShare = s.pile.length / Math.max(1, pool.length);
  return (total / pool.length) * Math.min(1, pileShare + 0.25);
}

export function scorePlay(s: HandState, ev: Evaluator, card: CardId): number {
  const matches = matchesFor(s, ev, card);
  let score: number;
  let fieldAfter: CardId[];
  if (matches.length === 0) {
    score = -placeRisk(s, ev, card);
    fieldAfter = [...s.field, card];
  } else {
    score = captureValue(ev, card, matches);
    const taken = matches.length === 2 ? [bestOf(ev, matches)] : matches;
    fieldAfter = s.field.filter((f) => !taken.includes(f));
  }
  if (ev.persona.lookahead) score += flipEV(ev, fieldAfter, s.frozen, s);
  return score;
}

function bestOf(ev: Evaluator, options: readonly CardId[]): CardId {
  let best = options[0] as CardId;
  let bestV = -Infinity;
  for (const o of options) {
    const v = gain(ev, o);
    if (v > bestV) {
      bestV = v;
      best = o;
    }
  }
  return best;
}

/** Best play, or with `slip` the second-best (a plausible mistake, never a random one). */
export function choosePlay(s: HandState, ev: Evaluator, slip = false): CardId {
  const ranked = s.hands[ev.seat]
    .map((card, i) => ({ card, sc: scorePlay(s, ev, card), i }))
    .sort((a, b) => b.sc - a.sc || a.i - b.i);
  const pick = slip && ranked.length > 1 ? ranked[1] : ranked[0];
  return (pick ?? ranked[0])?.card as CardId;
}

export function chooseMatch(s: HandState, ev: Evaluator, slip = false): CardId {
  const options = s.pending?.options ?? [];
  const best = bestOf(ev, options);
  if (!slip || options.length < 2) return best;
  return options.find((o) => o !== best) ?? best;
}

/** 0..1: how close the opponent looks to scoring. */
export function opponentThreat(s: HandState, seat: Seat): number {
  const opp = other(seat);
  const prog = progressFor(s, opp);
  const live = s.koikoi[opp] > 0;
  let threat = 0;
  for (const p of prog) {
    if (p.blocked) continue;
    const rem = p.need - p.have;
    let t: number;
    if (rem <= 0) t = live && yakuDef(p.id).perExtra > 0 ? 0.8 : 0;
    else if (rem === 1) t = 0.75;
    else if (rem === 2) t = 0.4;
    else if (rem === 3) t = 0.18;
    else t = 0.05;
    threat = Math.max(threat, t);
  }
  const cardsLeft = s.hands[opp].length;
  return threat * Math.min(1, cardsLeft / 4 + 0.25);
}

export interface DecideContext {
  /** Damage this seat's stop would deal right now. */
  readonly stopDamage?: number;
  /** The opponent's remaining HP. */
  readonly targetHp?: number;
}

export function chooseDecide(
  s: HandState,
  seat: Seat,
  persona: AiPersona,
  ctx: DecideContext = {},
): 'stop' | 'koikoi' {
  if (s.hands[seat].length === 0) return 'stop';
  if (ctx.stopDamage !== undefined && ctx.targetHp !== undefined && ctx.stopDamage >= ctx.targetHp)
    return 'stop';
  const points = totalPoints(currentYaku(s, seat));
  if (points >= persona.stopAt) return 'stop';
  if (s.hands[seat].length < persona.minCards) return 'stop';
  if (opponentThreat(s, seat) >= persona.caution) return 'stop';
  return 'koikoi';
}

/** Pick (or keep) the yaku a seat is chasing, from what it can see. */
export function chooseIntent(
  s: HandState,
  seat: Seat,
  persona: AiPersona,
  previous: YakuId | null,
): Intent | null {
  const prog = progressFor(s, seat);
  const hand = s.hands[seat];
  const handMonths = new Set(hand.map((h) => CARDS[h]?.month));
  const fieldMonths = new Set(
    s.field.filter((f) => !s.frozen.includes(f)).map((f) => CARDS[f]?.month),
  );
  let best: YakuProgress | null = null;
  let bestScore = 0;
  let prevScore = -1;
  for (const p of prog) {
    if (p.complete || p.blocked) continue;
    const def = yakuDef(p.id);
    const rem = p.need - p.have;
    let reach = 0;
    for (const w of p.wanted) {
      const m = CARDS[w]?.month;
      if (s.field.includes(w) && handMonths.has(m)) reach += 1;
      else if (hand.includes(w) && fieldMonths.has(m)) reach += 1;
    }
    const pref = persona.prefs[def.family] ?? 1;
    const score =
      ((def.points + 1.5) * pref * (p.have + 0.8 * Math.min(reach, rem) + 0.3)) /
      p.need /
      Math.sqrt(rem);
    if (p.id === previous) prevScore = score;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (!best) return null;
  if (previous && prevScore >= bestScore * 0.66) {
    const keep = prog.find((p) => p.id === previous);
    if (keep) return { id: keep.id, have: keep.have, need: keep.need, wanted: keep.wanted };
  }
  return { id: best.id, have: best.have, need: best.need, wanted: best.wanted };
}

/** Refresh an intent's progress numbers without re-choosing it. */
export function refreshIntent(s: HandState, seat: Seat, intent: Intent | null): Intent | null {
  if (!intent) return null;
  const p = progressFor(s, seat).find((x) => x.id === intent.id);
  if (!p) return null;
  return { id: p.id, have: p.have, need: p.need, wanted: p.wanted };
}

export interface SpiritTurnContext {
  readonly intent: YakuId | null;
  readonly decide?: DecideContext;
  /** Make a plausible mistake this move (play or choose the second-best option). */
  readonly slip?: boolean;
}

/** The AI's action for whatever the hand is waiting on. */
export function aiAction(
  s: HandState,
  seat: Seat,
  persona: AiPersona,
  ctx: SpiritTurnContext,
): HandAction {
  switch (s.phase) {
    case 'play': {
      const ev = makeEvaluator(s, seat, persona, ctx.intent);
      return { type: 'play', card: choosePlay(s, ev, ctx.slip) };
    }
    case 'playChoice':
    case 'flipChoice': {
      const ev = makeEvaluator(s, seat, persona, ctx.intent);
      return { type: 'choose', card: chooseMatch(s, ev, ctx.slip) };
    }
    case 'flip':
      return { type: 'flip' };
    case 'frogDecide': {
      const ev = makeEvaluator(s, seat, persona, ctx.intent);
      const kept = s.revealed as CardId;
      const keptValue = captureValue(ev, kept, fieldMatches(s, kept));
      const pool = ev.unseen.filter((u) => u !== kept);
      let ev2 = 0;
      for (const u of pool) ev2 += captureValue(ev, u, fieldMatches(s, u));
      ev2 /= Math.max(1, pool.length);
      return keptValue >= ev2 ? { type: 'keepFlip' } : { type: 'redoFlip' };
    }
    case 'decide':
      return { type: chooseDecide(s, seat, persona, ctx.decide) };
    case 'over':
      throw new Error('No action in a finished hand');
  }
}
