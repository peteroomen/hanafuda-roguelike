/**
 * One hand of Koi-Koi as a pure state machine.
 *
 *   play ─► (playChoice) ─► flip ─► (frogDecide) ─► (flipChoice) ─► end of turn
 *   end of turn: yaku improved? ─► decide (stop / koi-koi) ─► next turn / over
 *
 * `step` never mutates its input: it clones, applies one action and returns the
 * new state plus the events a UI needs to animate what happened.
 */
import { ALL_CARD_IDS, CARDS, type CardId, type Month, nextMonth } from '@/content/cards';
import type { RuleSet } from '@/content/rules';
import type { YakuId } from '@/content/yaku';
import { Rng, type RngState } from './rng';
import { detectYaku, totalPoints, type YakuContext } from './yaku';
import {
  DEFAULT_YAKU_MODS,
  type EnhancementId,
  other,
  type Seat,
  type YakuHit,
  type YakuMods,
} from './types';

export type HandPhase =
  'play' | 'playChoice' | 'flip' | 'frogDecide' | 'flipChoice' | 'decide' | 'over';

export interface HandBossRules {
  /** Tengu: snatches the first Bright this seat captures each hand and hides it under the pile. */
  readonly stealFirstBrightFrom?: Seat;
  /** Yuki-onna: after each turn of `by`, one field card freezes; at most `max` stay frozen. */
  readonly freeze?: { readonly by: Seat; readonly max: number };
  /** Kitsune: up to `max` field cards show `victim` a false month until touched. */
  readonly disguise?: { readonly victim: Seat; readonly max: number; readonly chance: number };
  /** Namazu: every `every` full rounds the field is shaken back into the pile. */
  readonly quake?: { readonly every: number };
}

export interface HandSetup {
  readonly rules: RuleSet;
  readonly month: Month;
  readonly seed: RngState;
  readonly lead: Seat;
  readonly deck?: readonly CardId[];
  readonly yakuMods?: readonly [YakuMods, YakuMods];
  readonly enhancements?: Readonly<Record<number, EnhancementId>>;
  readonly boss?: HandBossRules;
}

export interface Pending {
  readonly kind: 'playChoice' | 'flipChoice';
  readonly card: CardId;
  readonly options: readonly CardId[];
}

export type HandResult =
  | {
      readonly kind: 'stop';
      readonly winner: Seat;
      readonly hits: readonly YakuHit[];
      readonly points: number;
      /** Weighted koi-koi calls per seat when the hand ended. */
      readonly koikoi: readonly [number, number];
    }
  | { readonly kind: 'exhausted'; readonly koikoi: readonly [number, number] };

export interface HandState {
  readonly rules: RuleSet;
  readonly month: Month;
  readonly lead: Seat;
  readonly deckIds: readonly CardId[];
  readonly yakuMods: readonly [YakuMods, YakuMods];
  readonly enhancements: Readonly<Record<number, EnhancementId>>;
  readonly boss: HandBossRules;
  rng: RngState;
  pile: CardId[];
  field: CardId[];
  hands: [CardId[], CardId[]];
  captured: [CardId[], CardId[]];
  active: Seat;
  phase: HandPhase;
  pending: Pending | null;
  /** Weighted koi-koi counter (stakes and punishment read this). */
  koikoi: [number, number];
  /** Raw number of koi-koi calls. */
  koikoiCalls: [number, number];
  /** Yaku points at each seat's last decision. */
  decided: [number, number];
  decidedYaku: [YakuId[], YakuId[]];
  /** Half-turns completed. */
  turn: number;
  frozen: CardId[];
  /** Kitsune disguises: card id → the false month shown to the victim. */
  disguised: Record<string, Month>;
  /** Cards revealed on top of the pile by Peek (top first). */
  peeked: CardId[];
  frogArmed: [boolean, boolean];
  skipFlip: [boolean, boolean];
  /** revealHand[s]: seat s can see the opponent's hand. */
  revealHand: [boolean, boolean];
  stolen: boolean;
  /** The card turned over while a Frog decision is pending. */
  revealed: CardId | null;
  result: HandResult | null;
  redeals: number;
}

export type HandAction =
  /**
   * Play a card from hand. `target` says which field card to take if two match, so a player who
   * aimed at one (tapped or dragged onto it) isn't asked again. Ignored unless it's one of them.
   */
  | { readonly type: 'play'; readonly card: CardId; readonly target?: CardId }
  | { readonly type: 'choose'; readonly card: CardId }
  | { readonly type: 'flip' }
  | { readonly type: 'keepFlip' }
  | { readonly type: 'redoFlip' }
  | { readonly type: 'koikoi' }
  | { readonly type: 'stop' };

export type HandEvent =
  | { readonly t: 'deal'; readonly redeals: number }
  | { readonly t: 'turn'; readonly seat: Seat }
  | { readonly t: 'play'; readonly seat: Seat; readonly card: CardId }
  | { readonly t: 'flip'; readonly seat: Seat; readonly card: CardId }
  | { readonly t: 'place'; readonly seat: Seat; readonly card: CardId }
  | {
      readonly t: 'match';
      readonly seat: Seat;
      readonly card: CardId;
      readonly with: readonly CardId[];
    }
  | {
      readonly t: 'choice';
      readonly seat: Seat;
      readonly card: CardId;
      readonly options: readonly CardId[];
    }
  | { readonly t: 'capture'; readonly seat: Seat; readonly cards: readonly CardId[] }
  | { readonly t: 'frog'; readonly seat: Seat; readonly card: CardId }
  | { readonly t: 'leap'; readonly seat: Seat; readonly card: CardId }
  | { readonly t: 'noFlip'; readonly seat: Seat }
  | {
      readonly t: 'yaku';
      readonly seat: Seat;
      readonly hits: readonly YakuHit[];
      readonly points: number;
      readonly fresh: readonly YakuId[];
    }
  | { readonly t: 'decide'; readonly seat: Seat }
  | { readonly t: 'koikoi'; readonly seat: Seat; readonly calls: number }
  | { readonly t: 'stop'; readonly seat: Seat; readonly points: number }
  | { readonly t: 'exhausted' }
  | { readonly t: 'steal'; readonly from: Seat; readonly card: CardId }
  | { readonly t: 'freeze'; readonly card: CardId }
  | { readonly t: 'thaw'; readonly card: CardId }
  | { readonly t: 'disguise'; readonly card: CardId; readonly as: Month }
  | { readonly t: 'reveal'; readonly card: CardId }
  | { readonly t: 'quake' }
  | { readonly t: 'downpour' }
  | {
      readonly t: 'swap';
      readonly seat: Seat;
      readonly handCard: CardId;
      readonly fieldCard: CardId;
    }
  | { readonly t: 'peek'; readonly cards: readonly CardId[] };

export interface StepResult {
  readonly state: HandState;
  readonly events: HandEvent[];
}

const TYPE_WEIGHT = { bright: 4, animal: 3, ribbon: 2, chaff: 1 } as const;

// ---------------------------------------------------------------------------
// Context helpers (memoised on the immutable setup objects so the hot loop in
// simulations does not rebuild them).

interface CtxEntry {
  readonly rules: RuleSet;
  readonly month: Month;
  readonly enhancements: object;
  readonly deckIds: readonly CardId[];
  readonly pair: [YakuContext, YakuContext];
}

const ctxCache = new WeakMap<object, CtxEntry>();

export function yakuContext(s: HandState, seat: Seat): YakuContext {
  const hit = ctxCache.get(s.yakuMods);
  if (
    hit &&
    hit.rules === s.rules &&
    hit.month === s.month &&
    hit.enhancements === s.enhancements &&
    hit.deckIds === s.deckIds
  ) {
    return hit.pair[seat];
  }
  const monthCards = s.deckIds.filter((id) => CARDS[id]?.month === s.month);
  const torn = Object.entries(s.enhancements)
    .filter(([, e]) => e === 'torn')
    .map(([id]) => Number(id));
  const doubleCount = torn.length ? new Set<CardId>(torn) : undefined;
  const make = (mods: YakuMods): YakuContext => ({
    month: s.month,
    rules: s.rules,
    mods,
    monthCards,
    ...(doubleCount ? { doubleCount } : {}),
  });
  const pair: [YakuContext, YakuContext] = [make(s.yakuMods[0]), make(s.yakuMods[1])];
  ctxCache.set(s.yakuMods, {
    rules: s.rules,
    month: s.month,
    enhancements: s.enhancements,
    deckIds: s.deckIds,
    pair,
  });
  return pair[seat];
}

export function currentYaku(s: HandState, seat: Seat): YakuHit[] {
  return detectYaku(s.captured[seat], yakuContext(s, seat));
}

/** The months a card matches as (Inked cards also match the next month). */
export function matchMonths(s: HandState, id: CardId): readonly Month[] {
  const c = CARDS[id];
  if (!c) return [];
  return s.enhancements[id] === 'inked' ? [c.month, nextMonth(c.month)] : [c.month];
}

export function cardsMatch(s: HandState, a: CardId, b: CardId): boolean {
  const ma = matchMonths(s, a);
  const mb = matchMonths(s, b);
  for (const x of ma) if (mb.includes(x)) return true;
  return false;
}

/** Field cards a card would capture (frozen cards can't be matched). */
export function fieldMatches(s: HandState, id: CardId): CardId[] {
  const out: CardId[] = [];
  for (const f of s.field) {
    if (s.frozen.includes(f)) continue;
    if (cardsMatch(s, id, f)) out.push(f);
  }
  return out;
}

/** The month a viewer sees on a card (Kitsune disguises fool their victim). */
export function apparentMonth(s: HandState, id: CardId, viewer: Seat): Month {
  const fake = s.disguised[String(id)];
  if (fake !== undefined && s.boss.disguise?.victim === viewer) return fake;
  return (CARDS[id] as { month: Month }).month;
}

/** Field cards that *look* like matches to a viewer (for highlights and bots). */
export function apparentMatches(s: HandState, id: CardId, viewer: Seat): CardId[] {
  const own = matchMonths(s, id);
  const out: CardId[] = [];
  for (const f of s.field) {
    if (s.frozen.includes(f)) continue;
    const shown = apparentMonth(s, f, viewer);
    const fMonths = s.enhancements[f] === 'inked' ? [shown, nextMonth(shown)] : [shown];
    if (own.some((m) => fMonths.includes(m))) out.push(f);
  }
  return out;
}

// ---------------------------------------------------------------------------

function clone(s: HandState): HandState {
  return {
    ...s,
    pile: s.pile.slice(),
    field: s.field.slice(),
    hands: [s.hands[0].slice(), s.hands[1].slice()],
    captured: [s.captured[0].slice(), s.captured[1].slice()],
    koikoi: [s.koikoi[0], s.koikoi[1]],
    koikoiCalls: [s.koikoiCalls[0], s.koikoiCalls[1]],
    decided: [s.decided[0], s.decided[1]],
    decidedYaku: [s.decidedYaku[0].slice(), s.decidedYaku[1].slice()],
    frozen: s.frozen.slice(),
    disguised: { ...s.disguised },
    peeked: s.peeked.slice(),
    frogArmed: [s.frogArmed[0], s.frogArmed[1]],
    skipFlip: [s.skipFlip[0], s.skipFlip[1]],
    revealHand: [s.revealHand[0], s.revealHand[1]],
  };
}

function hasFourOfAMonth(ids: readonly CardId[]): boolean {
  const counts = new Array<number>(13).fill(0);
  for (const id of ids) {
    const m = CARDS[id]?.month ?? 0;
    counts[m] = (counts[m] ?? 0) + 1;
    if ((counts[m] ?? 0) >= 4) return true;
  }
  return false;
}

export function newHand(setup: HandSetup): StepResult {
  const rules = setup.rules;
  const deckIds = setup.deck ? setup.deck.slice() : ALL_CARD_IDS.slice();
  const rng = new Rng(setup.seed);
  const handSize = rules.handSize;
  const fieldSize = rules.fieldSize;
  let redeals = 0;
  let shuffled = rng.shuffle(deckIds);
  while (
    rules.redealOnFourOnField &&
    redeals < rules.maxRedeals &&
    hasFourOfAMonth(shuffled.slice(handSize * 2, handSize * 2 + fieldSize))
  ) {
    redeals += 1;
    shuffled = rng.shuffle(deckIds);
  }
  const hands: [CardId[], CardId[]] = [
    shuffled.slice(0, handSize),
    shuffled.slice(handSize, handSize * 2),
  ];
  const field = shuffled.slice(handSize * 2, handSize * 2 + fieldSize);
  const pile = shuffled.slice(handSize * 2 + fieldSize);
  const state: HandState = {
    rules,
    month: setup.month,
    lead: setup.lead,
    deckIds,
    yakuMods: setup.yakuMods ?? [DEFAULT_YAKU_MODS, DEFAULT_YAKU_MODS],
    enhancements: setup.enhancements ?? {},
    boss: setup.boss ?? {},
    rng: rng.state,
    pile,
    field,
    hands,
    captured: [[], []],
    active: setup.lead,
    phase: 'play',
    pending: null,
    koikoi: [0, 0],
    koikoiCalls: [0, 0],
    decided: [0, 0],
    decidedYaku: [[], []],
    turn: 0,
    frozen: [],
    disguised: {},
    peeked: [],
    frogArmed: [false, false],
    skipFlip: [false, false],
    revealHand: [false, false],
    stolen: false,
    revealed: null,
    result: null,
    redeals,
  };
  const events: HandEvent[] = [{ t: 'deal', redeals }];
  if (state.boss.disguise) {
    for (const f of state.field.slice()) maybeDisguise(state, f, events);
  }
  events.push({ t: 'turn', seat: state.active });
  return { state, events };
}

// ---------------------------------------------------------------------------
// Boss mechanics

function maybeDisguise(s: HandState, id: CardId, events: HandEvent[]): void {
  const d = s.boss.disguise;
  if (!d) return;
  if (Object.keys(s.disguised).length >= d.max) return;
  const rng = new Rng(s.rng);
  if (rng.next() >= d.chance) {
    s.rng = rng.state;
    return;
  }
  const trueMonth = (CARDS[id] as { month: Month }).month;
  // Tempt the victim: prefer a month they hold in hand.
  const tempting = [
    ...new Set(s.hands[d.victim].map((h) => (CARDS[h] as { month: Month }).month)),
  ].filter((m) => m !== trueMonth);
  let fake: Month;
  if (tempting.length) fake = rng.pick(tempting);
  else {
    const offset = 1 + rng.int(11);
    fake = (((trueMonth - 1 + offset) % 12) + 1) as Month;
  }
  s.rng = rng.state;
  s.disguised[String(id)] = fake;
  events.push({ t: 'disguise', card: id, as: fake });
}

function reveal(s: HandState, id: CardId, events: HandEvent[]): void {
  if (s.disguised[String(id)] !== undefined) {
    delete s.disguised[String(id)];
    events.push({ t: 'reveal', card: id });
  }
}

function afterTurnBoss(s: HandState, seat: Seat, events: HandEvent[]): void {
  const fz = s.boss.freeze;
  if (fz && fz.by === seat) {
    const victim = other(seat);
    const victimMonths = new Set(s.hands[victim].map((h) => CARDS[h]?.month));
    const candidates = s.field.filter((f) => !s.frozen.includes(f));
    if (candidates.length > 0) {
      const rng = new Rng(s.rng);
      let best = candidates[0] as CardId;
      let bestScore = -Infinity;
      for (const f of candidates) {
        const c = CARDS[f];
        if (!c) continue;
        const score = TYPE_WEIGHT[c.type] * 2 + (victimMonths.has(c.month) ? 3 : 0) + rng.next();
        if (score > bestScore) {
          bestScore = score;
          best = f;
        }
      }
      s.rng = rng.state;
      s.frozen.push(best);
      events.push({ t: 'freeze', card: best });
      while (s.frozen.length > fz.max) {
        const thawed = s.frozen.shift() as CardId;
        events.push({ t: 'thaw', card: thawed });
      }
    }
  }
  const qk = s.boss.quake;
  if (qk && (s.turn + 1) % (qk.every * 2) === 0 && s.field.length > 0) {
    reshuffleField(s);
    events.push({ t: 'quake' });
  }
}

function reshuffleField(s: HandState): void {
  const count = s.field.length;
  const rng = new Rng(s.rng);
  const pool = s.pile.concat(s.field);
  let shuffled = rng.shuffle(pool);
  for (let i = 0; i < 10 && hasFourOfAMonth(shuffled.slice(shuffled.length - count)); i++) {
    shuffled = rng.shuffle(pool);
  }
  s.rng = rng.state;
  s.field = shuffled.slice(shuffled.length - count);
  s.pile = shuffled.slice(0, shuffled.length - count);
  s.frozen = [];
  s.disguised = {};
  s.peeked = [];
}

// ---------------------------------------------------------------------------
// Core resolution

function capture(s: HandState, seat: Seat, ids: readonly CardId[], events: HandEvent[]): void {
  for (const id of ids) {
    const idx = s.field.indexOf(id);
    if (idx >= 0) {
      s.field.splice(idx, 1);
      reveal(s, id, events);
    }
  }
  s.captured[seat].push(...ids);
  events.push({ t: 'capture', seat, cards: ids.slice() });

  const thiefVictim = s.boss.stealFirstBrightFrom;
  if (thiefVictim === seat && !s.stolen) {
    const bright = ids.find((id) => CARDS[id]?.type === 'bright');
    if (bright !== undefined) {
      // The Tengu snatches it and hides it at the bottom of the draw pile.
      s.stolen = true;
      const pile = s.captured[seat];
      pile.splice(pile.indexOf(bright), 1);
      s.pile.unshift(bright);
      events.push({ t: 'steal', from: seat, card: bright });
    }
  }
}

/** Resolve a card arriving at the field. Returns true if a choice is now pending. */
function resolveArrival(
  s: HandState,
  seat: Seat,
  id: CardId,
  source: 'play' | 'flip',
  events: HandEvent[],
  target?: CardId,
): boolean {
  const matches = fieldMatches(s, id);
  if (source === 'play' && s.boss.disguise?.victim === seat) {
    // A fox's trick is exposed when the victim reaches for a card that only looked like a match.
    for (const f of apparentMatches(s, id, seat)) {
      if (!matches.includes(f)) reveal(s, f, events);
    }
  }
  if (matches.length === 0) {
    s.field.push(id);
    events.push({ t: 'place', seat, card: id });
    maybeDisguise(s, id, events);
    return false;
  }
  if (matches.length === 2 && target !== undefined && matches.includes(target)) {
    events.push({ t: 'match', seat, card: id, with: [target] });
    capture(s, seat, [id, target], events);
    return false;
  }
  if (matches.length === 2) {
    const kind = source === 'play' ? 'playChoice' : 'flipChoice';
    s.pending = { kind, card: id, options: matches };
    s.phase = kind;
    events.push({ t: 'choice', seat, card: id, options: matches });
    return true;
  }
  events.push({ t: 'match', seat, card: id, with: matches });
  capture(s, seat, [id, ...matches], events);
  return false;
}

function toFlip(s: HandState, events: HandEvent[]): void {
  const seat = s.active;
  if (s.skipFlip[seat] || s.pile.length === 0) {
    s.skipFlip[seat] = false;
    events.push({ t: 'noFlip', seat });
    endTurn(s, events);
    return;
  }
  s.phase = 'flip';
}

function flipCard(s: HandState, id: CardId, events: HandEvent[]): void {
  const seat = s.active;
  s.peeked = s.peeked.filter((p) => p !== id);
  events.push({ t: 'flip', seat, card: id });
  if (!resolveArrival(s, seat, id, 'flip', events)) endTurn(s, events);
}

function finish(
  s: HandState,
  seat: Seat,
  hits: YakuHit[],
  points: number,
  events: HandEvent[],
): void {
  s.result = { kind: 'stop', winner: seat, hits, points, koikoi: [s.koikoi[0], s.koikoi[1]] };
  s.phase = 'over';
  s.pending = null;
  events.push({ t: 'stop', seat, points });
}

function endTurn(s: HandState, events: HandEvent[]): void {
  const seat = s.active;
  s.pending = null;
  afterTurnBoss(s, seat, events);
  const hits = currentYaku(s, seat);
  const points = totalPoints(hits);
  if (points > s.decided[seat]) {
    const before = s.decidedYaku[seat];
    const fresh = hits.map((h) => h.id).filter((id) => !before.includes(id));
    events.push({ t: 'yaku', seat, hits, points, fresh });
    if (s.hands[seat].length > 0) {
      s.phase = 'decide';
      events.push({ t: 'decide', seat });
      return;
    }
    // Nothing left to play: a koi-koi could never pay off, so the hand is scored.
    finish(s, seat, hits, points, events);
    return;
  }
  advance(s, events);
}

function advance(s: HandState, events: HandEvent[]): void {
  const cur = s.active;
  const nxt = other(cur);
  if (s.hands[0].length === 0 && s.hands[1].length === 0) {
    s.result = { kind: 'exhausted', koikoi: [s.koikoi[0], s.koikoi[1]] };
    s.phase = 'over';
    events.push({ t: 'exhausted' });
    return;
  }
  s.turn += 1;
  s.active = s.hands[nxt].length > 0 ? nxt : cur;
  s.phase = 'play';
  events.push({ t: 'turn', seat: s.active });
}

// ---------------------------------------------------------------------------
// Public API

export function legalActions(s: HandState): HandAction[] {
  switch (s.phase) {
    case 'play':
      return s.hands[s.active].map((card) => ({ type: 'play', card }) as const);
    case 'playChoice':
    case 'flipChoice':
      return (s.pending?.options ?? []).map((card) => ({ type: 'choose', card }) as const);
    case 'flip':
      return [{ type: 'flip' }];
    case 'frogDecide':
      return [{ type: 'keepFlip' }, { type: 'redoFlip' }];
    case 'decide':
      return [{ type: 'stop' }, { type: 'koikoi' }];
    case 'over':
      return [];
  }
}

export function isLegal(s: HandState, a: HandAction): boolean {
  return legalActions(s).some(
    (l) => l.type === a.type && ('card' in l ? 'card' in a && l.card === a.card : true),
  );
}

export function step(state: HandState, action: HandAction): StepResult {
  if (!isLegal(state, action)) {
    throw new Error(`Illegal action ${JSON.stringify(action)} in phase ${state.phase}`);
  }
  const s = clone(state);
  const events: HandEvent[] = [];
  const seat = s.active;
  switch (action.type) {
    case 'play': {
      const hand = s.hands[seat];
      hand.splice(hand.indexOf(action.card), 1);
      events.push({ t: 'play', seat, card: action.card });
      if (!resolveArrival(s, seat, action.card, 'play', events, action.target)) toFlip(s, events);
      break;
    }
    case 'choose': {
      const p = s.pending as Pending;
      s.pending = null;
      events.push({ t: 'match', seat, card: p.card, with: [action.card] });
      capture(s, seat, [p.card, action.card], events);
      if (p.kind === 'playChoice') toFlip(s, events);
      else endTurn(s, events);
      break;
    }
    case 'flip': {
      const top = s.pile.pop() as CardId;
      if (s.frogArmed[seat]) {
        s.frogArmed[seat] = false;
        s.revealed = top;
        s.peeked = s.peeked.filter((p) => p !== top);
        s.phase = 'frogDecide';
        events.push({ t: 'frog', seat, card: top });
      } else {
        flipCard(s, top, events);
      }
      break;
    }
    case 'keepFlip': {
      const c = s.revealed as CardId;
      s.revealed = null;
      flipCard(s, c, events);
      break;
    }
    case 'redoFlip': {
      const c = s.revealed as CardId;
      s.revealed = null;
      s.pile.unshift(c);
      events.push({ t: 'leap', seat, card: c });
      const next = s.pile.pop() as CardId;
      flipCard(s, next, events);
      break;
    }
    case 'koikoi': {
      const hits = currentYaku(s, seat);
      const points = totalPoints(hits);
      s.koikoi[seat] += s.rules.koiKoiCallWeight;
      s.koikoiCalls[seat] += 1;
      s.decided[seat] = points;
      s.decidedYaku[seat] = hits.map((h) => h.id);
      events.push({ t: 'koikoi', seat, calls: s.koikoiCalls[seat] });
      advance(s, events);
      break;
    }
    case 'stop': {
      const hits = currentYaku(s, seat);
      finish(s, seat, hits, totalPoints(hits), events);
      break;
    }
  }
  return { state: s, events };
}

// ---------------------------------------------------------------------------
// Talisman (Ofuda) effects on a hand. All require the seat to be about to play.

function assertCanAct(s: HandState, seat: Seat): void {
  if (s.phase !== 'play' || s.active !== seat)
    throw new Error('Talismans can only be used before you play');
}

export function canUseTalisman(s: HandState, seat: Seat): boolean {
  return s.phase === 'play' && s.active === seat;
}

export function swapCards(
  state: HandState,
  seat: Seat,
  handCard: CardId,
  fieldCard: CardId,
): StepResult {
  assertCanAct(state, seat);
  if (!state.hands[seat].includes(handCard) || !state.field.includes(fieldCard)) {
    throw new Error('Swap needs a card in hand and a card on the field');
  }
  if (state.frozen.includes(fieldCard)) throw new Error('Frozen cards cannot be swapped');
  const s = clone(state);
  const events: HandEvent[] = [];
  reveal(s, fieldCard, events);
  const h = s.hands[seat];
  h[h.indexOf(handCard)] = fieldCard;
  s.field[s.field.indexOf(fieldCard)] = handCard;
  events.push({ t: 'swap', seat, handCard, fieldCard });
  return { state: s, events };
}

export function downpour(state: HandState, seat: Seat): StepResult {
  assertCanAct(state, seat);
  const s = clone(state);
  reshuffleField(s);
  const events: HandEvent[] = [{ t: 'downpour' }];
  if (s.boss.disguise) for (const f of s.field.slice()) maybeDisguise(s, f, events);
  return { state: s, events };
}

export function peek(state: HandState, count: number): StepResult {
  const s = clone(state);
  s.peeked = s.pile.slice(Math.max(0, s.pile.length - count)).reverse();
  return { state: s, events: [{ t: 'peek', cards: s.peeked.slice() }] };
}

export function armFrog(state: HandState, seat: Seat): StepResult {
  const s = clone(state);
  s.frogArmed[seat] = true;
  return { state: s, events: [] };
}

export function revealOpponentHand(state: HandState, seat: Seat): StepResult {
  const s = clone(state);
  s.revealHand[seat] = true;
  return { state: s, events: [] };
}

export function skipNextFlip(state: HandState, target: Seat): StepResult {
  const s = clone(state);
  s.skipFlip[target] = true;
  return { state: s, events: [] };
}

/** Swap in new enhancements mid-hand (e.g. Gold Leaf on a card in hand). */
export function withEnhancements(
  state: HandState,
  enhancements: Readonly<Record<number, EnhancementId>>,
): HandState {
  return { ...clone(state), enhancements };
}

/** Every card accounted for exactly once. Used by tests and dev assertions. */
export function cardCensus(s: HandState): CardId[] {
  const all = [
    ...s.pile,
    ...s.field,
    ...s.hands[0],
    ...s.hands[1],
    ...s.captured[0],
    ...s.captured[1],
  ];
  if (s.pending && (s.phase === 'playChoice' || s.phase === 'flipChoice')) all.push(s.pending.card);
  if (s.revealed !== null) all.push(s.revealed);
  return all;
}
