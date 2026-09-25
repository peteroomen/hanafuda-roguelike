/**
 * The visual model of the table: where every card is *shown*. It trails the
 * engine state while events are animated, one event at a time.
 */
import { CARDS, type CardId, type Month } from '@/content/cards';
import type { HandEvent, HandState } from '@/engine/hand';
import type { Seat } from '@/engine/types';

export type Zone =
  | { readonly z: 'pile' }
  | { readonly z: 'hand'; readonly seat: Seat }
  | { readonly z: 'field' }
  | { readonly z: 'cap'; readonly seat: Seat }
  /** In the air above the field; `choosing` while its player picks which match to take. */
  | {
      readonly z: 'held';
      readonly seat: Seat;
      readonly choosing?: boolean;
      /** Where it came from, so a card waiting on a choice waits near there. */
      readonly from?: 'hand' | 'pile';
    }
  | { readonly z: 'flip' }
  | { readonly z: 'land'; readonly on: CardId }
  | { readonly z: 'reveal' }
  | { readonly z: 'gone' };

export interface Visual {
  readonly zone: Readonly<Record<number, Zone>>;
  readonly faceUp: Readonly<Record<number, boolean>>;
  readonly hand: readonly [readonly CardId[], readonly CardId[]];
  readonly cap: readonly [readonly CardId[], readonly CardId[]];
  /** Stable field slots so cards don't shuffle around when others leave. */
  readonly slots: readonly (CardId | null)[];
  /** Bottom → top. */
  readonly pile: readonly CardId[];
  readonly frozen: readonly CardId[];
  readonly disguised: Readonly<Record<string, Month>>;
  readonly peeked: readonly CardId[];
  /** Field cards a seat may choose between right now. */
  readonly options: readonly CardId[];
  /** Monotonic counter per card: the most recently moved card draws on top. */
  readonly moved: Readonly<Record<number, number>>;
  /** Cards that just hit the table (drives the slap animation). */
  readonly slams: Readonly<Record<number, number>>;
  readonly tick: number;
  readonly revealHand: boolean;
}

export function emptyVisual(): Visual {
  return {
    zone: {},
    faceUp: {},
    hand: [[], []],
    cap: [[], []],
    slots: [],
    pile: [],
    frozen: [],
    disguised: {},
    peeked: [],
    options: [],
    moved: {},
    slams: {},
    tick: 0,
    revealHand: false,
  };
}

/** A fresh visual that shows a hand state exactly. */
export function visualFromHand(h: HandState, prev?: Visual): Visual {
  const zone: Record<number, Zone> = {};
  const faceUp: Record<number, boolean> = {};
  for (const id of h.pile) {
    zone[id] = { z: 'pile' };
    faceUp[id] = false;
  }
  for (const seat of [0, 1] as const) {
    for (const id of h.hands[seat]) {
      zone[id] = { z: 'hand', seat };
      faceUp[id] = seat === 0 || h.revealHand[0];
    }
    for (const id of h.captured[seat]) {
      zone[id] = { z: 'cap', seat };
      faceUp[id] = true;
    }
  }
  // Keep existing slot positions where possible.
  const slots: (CardId | null)[] = [];
  const prevSlots = prev?.slots ?? [];
  const onField = new Set(h.field);
  prevSlots.forEach((id, i) => {
    slots[i] = id !== null && onField.has(id) ? id : null;
  });
  for (const id of h.field) {
    zone[id] = { z: 'field' };
    faceUp[id] = true;
    if (!slots.includes(id)) {
      const free = slots.indexOf(null);
      if (free >= 0) slots[free] = id;
      else slots.push(id);
    }
  }
  if (h.pending) {
    zone[h.pending.card] = {
      z: 'held',
      seat: h.active,
      choosing: true,
      from: h.pending.kind === 'flipChoice' ? 'pile' : 'hand',
    };
    faceUp[h.pending.card] = true;
  }
  if (h.revealed !== null) {
    zone[h.revealed] = { z: 'reveal' };
    faceUp[h.revealed] = true;
  }
  const keepCap = (seat: Seat) => {
    const old = prev?.cap[seat] ?? [];
    const now = new Set(h.captured[seat]);
    const kept = old.filter((id) => now.has(id));
    for (const id of h.captured[seat]) if (!kept.includes(id)) kept.push(id);
    return kept;
  };
  while (slots.length && slots[slots.length - 1] === null) slots.pop();
  return {
    zone,
    faceUp,
    hand: [h.hands[0].slice(), h.hands[1].slice()],
    cap: [keepCap(0), keepCap(1)],
    slots,
    pile: h.pile.slice(),
    frozen: h.frozen.slice(),
    disguised: { ...h.disguised },
    peeked: h.peeked.slice(),
    options: h.pending && h.active === 0 ? h.pending.options.slice() : [],
    moved: prev?.moved ?? {},
    slams: prev?.slams ?? {},
    tick: (prev?.tick ?? 0) + 1,
    revealHand: h.revealHand[0],
  };
}

function withZone(v: Visual, id: CardId, zone: Zone, faceUp?: boolean): Visual {
  const tick = v.tick + 1;
  return {
    ...v,
    zone: { ...v.zone, [id]: zone },
    faceUp: faceUp === undefined ? v.faceUp : { ...v.faceUp, [id]: faceUp },
    moved: { ...v.moved, [id]: tick },
    tick,
  };
}

function removeFrom(list: readonly CardId[], id: CardId): CardId[] {
  return list.filter((x) => x !== id);
}

function freeSlot(slots: readonly (CardId | null)[]): number {
  const i = slots.indexOf(null);
  return i >= 0 ? i : slots.length;
}

function clearSlot(slots: readonly (CardId | null)[], id: CardId): (CardId | null)[] {
  const out = slots.map((s) => (s === id ? null : s));
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function slam(v: Visual, id: CardId): Visual {
  return { ...v, slams: { ...v.slams, [id]: v.tick } };
}

/** Apply one engine event to the visual. `final` is the engine state after the whole step. */
export function applyEvent(v: Visual, e: HandEvent, final: HandState): Visual {
  switch (e.t) {
    case 'play': {
      let next = withZone(v, e.card, { z: 'held', seat: e.seat }, true);
      const hand: [CardId[], CardId[]] = [v.hand[0].slice(), v.hand[1].slice()];
      hand[e.seat] = removeFrom(hand[e.seat], e.card);
      next = { ...next, hand };
      return next;
    }
    case 'flip': {
      const next = withZone(v, e.card, { z: 'flip' }, true);
      return { ...next, pile: removeFrom(v.pile, e.card), peeked: removeFrom(v.peeked, e.card) };
    }
    case 'frog': {
      const next = withZone(v, e.card, { z: 'reveal' }, true);
      return { ...next, pile: removeFrom(v.pile, e.card) };
    }
    case 'leap': {
      const next = withZone(v, e.card, { z: 'pile' }, false);
      return { ...next, pile: [e.card, ...removeFrom(v.pile, e.card)] };
    }
    case 'place': {
      const slots = v.slots.slice();
      const i = freeSlot(slots);
      slots[i] = e.card;
      return slam({ ...withZone(v, e.card, { z: 'field' }, true), slots }, e.card);
    }
    case 'match':
      return slam(withZone(v, e.card, { z: 'land', on: e.with[0] as CardId }, true), e.card);
    case 'choice':
      return {
        ...withZone(
          v,
          e.card,
          {
            z: 'held',
            seat: e.seat,
            choosing: true,
            from: v.zone[e.card]?.z === 'flip' ? 'pile' : 'hand',
          },
          true,
        ),
        options: e.seat === 0 ? e.options.slice() : [],
      };
    case 'capture': {
      let next: Visual = { ...v, options: [] };
      let slots = v.slots.slice();
      const cap: [CardId[], CardId[]] = [v.cap[0].slice(), v.cap[1].slice()];
      for (const id of e.cards) {
        slots = clearSlot(slots, id);
        next = withZone(next, id, { z: 'cap', seat: e.seat }, true);
        cap[e.seat] = [...removeFrom(cap[e.seat], id), id];
      }
      return { ...next, slots, cap, frozen: v.frozen.filter((f) => !e.cards.includes(f)) };
    }
    case 'steal': {
      const next = withZone(v, e.card, { z: 'pile' }, false);
      const cap: [CardId[], CardId[]] = [v.cap[0].slice(), v.cap[1].slice()];
      cap[e.from] = removeFrom(cap[e.from], e.card);
      return { ...next, cap, pile: [e.card, ...removeFrom(v.pile, e.card)] };
    }
    case 'freeze':
      return { ...v, frozen: [...v.frozen, e.card] };
    case 'thaw':
      return { ...v, frozen: removeFrom(v.frozen, e.card) };
    case 'disguise':
      return { ...v, disguised: { ...v.disguised, [String(e.card)]: e.as } };
    case 'reveal': {
      const d = { ...v.disguised };
      delete d[String(e.card)];
      return { ...v, disguised: d };
    }
    case 'swap': {
      const hand: [CardId[], CardId[]] = [v.hand[0].slice(), v.hand[1].slice()];
      const i = hand[e.seat].indexOf(e.handCard);
      if (i >= 0) hand[e.seat][i] = e.fieldCard;
      const slots = v.slots.map((s) => (s === e.fieldCard ? e.handCard : s));
      let next = withZone(v, e.handCard, { z: 'field' }, true);
      next = withZone(next, e.fieldCard, { z: 'hand', seat: e.seat }, e.seat === 0);
      return { ...next, hand, slots };
    }
    case 'peek':
      return { ...v, peeked: e.cards.slice() };
    case 'quake':
    case 'downpour':
      return reshuffled(v, final);
    case 'deal':
    case 'turn':
    case 'noFlip':
    case 'yaku':
    case 'decide':
    case 'koikoi':
    case 'stop':
    case 'exhausted':
      return v;
  }
}

/** After a quake or downpour: the field was dealt anew from the pile. */
function reshuffled(v: Visual, final: HandState): Visual {
  let next: Visual = { ...v, slots: [], frozen: [], disguised: { ...final.disguised }, peeked: [] };
  const slots: (CardId | null)[] = [];
  for (const id of final.field) {
    slots.push(id);
    next = withZone(next, id, { z: 'field' }, true);
  }
  for (const id of final.pile) next = withZone(next, id, { z: 'pile' }, false);
  return { ...next, slots, pile: final.pile.slice() };
}

/** Snap any card whose shown zone disagrees with the engine back into place. */
export function reconcile(v: Visual, h: HandState): Visual {
  const truth = visualFromHand(h, v);
  let drift = false;
  for (const id of h.deckIds) {
    const a = v.zone[id];
    const b = truth.zone[id];
    if (!a || !b || a.z !== b.z || ('seat' in a && 'seat' in b && a.seat !== b.seat)) {
      drift = true;
      break;
    }
  }
  if (!drift && v.slots.length === truth.slots.length) {
    return {
      ...v,
      frozen: truth.frozen,
      disguised: truth.disguised,
      peeked: truth.peeked,
      revealHand: truth.revealHand,
      options: truth.options,
    };
  }
  return truth;
}

export function typeGroup(id: CardId): number {
  const t = CARDS[id]?.type;
  return t === 'bright' ? 0 : t === 'animal' ? 1 : t === 'ribbon' ? 2 : 3;
}

/** Deal order, two cards at a time: your hand, the field, the spirit's hand, and round again. */
export function dealOrder(
  mine: readonly CardId[],
  field: readonly CardId[],
  theirs: readonly CardId[],
): CardId[] {
  const out: CardId[] = [];
  const n = Math.max(mine.length, field.length, theirs.length);
  for (let i = 0; i < n; i += 2) {
    for (const list of [mine, field, theirs]) out.push(...list.slice(i, i + 2));
  }
  return out;
}
