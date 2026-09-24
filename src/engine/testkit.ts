/**
 * Helpers for tests and the simulator: build hands with exact layouts and play
 * them out with simple policies.
 */
import { CARDS, type CardId, cardWithTag, type CardTag, type Month } from '@/content/cards';
import { DEFAULT_RULES, type RuleSet } from '@/content/rules';
import {
  type HandAction,
  type HandSetup,
  type HandState,
  legalActions,
  newHand,
  step,
} from './hand';
import { Rng } from './rng';
import type { Seat } from './types';

export const tag = (t: CardTag): CardId => cardWithTag(t);
export const monthIds = (m: number): CardId[] =>
  CARDS.filter((c) => c.month === m).map((c) => c.id);
export const chaffOf = (m: number): CardId[] =>
  CARDS.filter((c) => c.month === m && c.type === 'chaff').map((c) => c.id);

export interface Layout {
  hands?: [CardId[], CardId[]];
  field?: CardId[];
  /** Top of the pile is the LAST element. */
  pile?: CardId[];
  captured?: [CardId[], CardId[]];
  active?: Seat;
}

/**
 * A hand whose zones are set exactly. Cards not mentioned anywhere are put at the
 * bottom of the pile so the census still holds.
 */
export function handWith(layout: Layout, setup: Partial<HandSetup> = {}): HandState {
  const base = newHand({
    rules: setup.rules ?? DEFAULT_RULES,
    month: (setup.month ?? 1) as Month,
    seed: setup.seed ?? 1,
    lead: setup.lead ?? 0,
    ...(setup.deck ? { deck: setup.deck } : {}),
    ...(setup.yakuMods ? { yakuMods: setup.yakuMods } : {}),
    ...(setup.enhancements ? { enhancements: setup.enhancements } : {}),
    ...(setup.boss ? { boss: setup.boss } : {}),
  }).state;
  const hands: [CardId[], CardId[]] = layout.hands ?? [[], []];
  const field = layout.field ?? [];
  const captured: [CardId[], CardId[]] = layout.captured ?? [[], []];
  const used = new Set<CardId>([
    ...hands[0],
    ...hands[1],
    ...field,
    ...captured[0],
    ...captured[1],
    ...(layout.pile ?? []),
  ]);
  const rest = base.deckIds.filter((id) => !used.has(id));
  const pile = [...rest, ...(layout.pile ?? [])];
  return {
    ...base,
    hands: [hands[0].slice(), hands[1].slice()],
    field: field.slice(),
    captured: [captured[0].slice(), captured[1].slice()],
    pile,
    active: layout.active ?? base.lead,
    disguised: {},
    frozen: [],
  };
}

export function run(state: HandState, actions: HandAction[]): HandState {
  let s = state;
  for (const a of actions) s = step(s, a).state;
  return s;
}

/** Play a hand to the end with a seeded random policy. Returns the final state and every state seen. */
export function playRandom(
  setup: HandSetup,
  policySeed: number,
  onState?: (s: HandState) => void,
): HandState {
  let s = newHand(setup).state;
  const rng = new Rng(policySeed);
  onState?.(s);
  for (let i = 0; i < 500 && s.phase !== 'over'; i++) {
    const legal = legalActions(s);
    const a =
      legal.length === 2 && s.phase === 'decide'
        ? rng.next() < 0.35
          ? legal[1]
          : legal[0]
        : rng.pick(legal);
    s = step(s, a as HandAction).state;
    onState?.(s);
  }
  return s;
}

export function rulesWith(patch: Partial<RuleSet>): RuleSet {
  return { ...DEFAULT_RULES, ...patch };
}
