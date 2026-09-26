/**
 * Damage when a side stops.
 *
 *   Player → spirit:  damage = chips × mult, Balatro-style, with a step-by-step
 *                     trace the UI animates (yaku, cards, charms, stakes).
 *   Spirit → player:  hit = yaku points × ferocity (× punishment if you called
 *                     koi-koi), a small readable scale for a persistent HP bar.
 */
import { landText } from '@/content/lands';
import { ALL_CARDS, type CardId, type Land, type Month, TYPE_ORDER } from '@/content/cards';
import { enhancementDef } from '@/content/enhancements';
import {
  type Amount,
  type Bonus,
  type CardFilter,
  type Condition,
  omamoriDef,
  type OmamoriId,
  type Quantity,
  type YakuFilter,
} from '@/content/omamori';
import type { RuleSet } from '@/content/rules';
import { yakuDef, type YakuId } from '@/content/yaku';
import type { EnhancementId, YakuHit } from './types';
import { scoringCards } from './yaku';

export interface OmamoriInstance {
  readonly id: OmamoriId;
  readonly counter: number;
}

export interface StopInput {
  readonly hits: readonly YakuHit[];
  readonly captured: readonly CardId[];
  readonly month: Month;
  readonly rules: RuleSet;
  /** Raw koi-koi calls by the stopper this hand (charms read this). */
  readonly ownCalls: number;
  /** Weighted koi-koi calls by the stopper (the stake reads this). */
  readonly ownStake: number;
  readonly opponentCalled: boolean;
  readonly omamori: readonly OmamoriInstance[];
  readonly poems: Readonly<Partial<Record<YakuId, number>>>;
  readonly enhancements: Readonly<Record<number, EnhancementId>>;
  readonly hpFraction: number;
  /** Nue: yaku already scored this fight count half. */
  readonly halved: readonly YakuId[];
  /** Taiko Drum multiplier (1 when unused). */
  readonly drum: number;
  readonly lightningIsBright: boolean;
  /** Overrides rules.koiKoiStake.factor (Gambler's Deck). */
  readonly stakeFactor?: number;
}

export type ScoreSource =
  | { readonly kind: 'yaku'; readonly id: YakuId; readonly level: number; readonly halved: boolean }
  | { readonly kind: 'card'; readonly card: CardId; readonly pass: number }
  | { readonly kind: 'enhancement'; readonly card: CardId; readonly id: EnhancementId }
  | {
      readonly kind: 'omamori';
      readonly id: OmamoriId;
      readonly slot: number;
      readonly card?: CardId;
    }
  | { readonly kind: 'rule'; readonly id: 'sevenPlus' | 'opponentKoikoi' | 'stake' | 'drum' };

export interface ScoreStep {
  readonly source: ScoreSource;
  readonly chips?: number;
  readonly mult?: number;
  readonly xmult?: number;
  readonly totalChips: number;
  readonly totalMult: number;
}

export interface ScoreResult {
  readonly steps: readonly ScoreStep[];
  readonly chips: number;
  readonly mult: number;
  readonly damage: number;
  readonly basePoints: number;
  /** Scoring cards in the order they were counted. */
  readonly cards: readonly CardId[];
}

export function cardChips(id: CardId, rules: RuleSet, lightningIsBright: boolean): number {
  const c = ALL_CARDS[id];
  if (!c) return 0;
  if (lightningIsBright && c.tags.includes('lightning')) return rules.chips.bright;
  return rules.chips[c.type];
}

function quantity(
  q: Quantity | undefined,
  input: StopInput,
  counter: number,
  extraChaff: number,
): number {
  switch (q) {
    case undefined:
      return 0;
    case 'koikoiCalls':
      return input.ownCalls;
    case 'month':
      return input.month;
    case 'counter':
      return counter;
    case 'capturedChaff':
      return input.captured.filter((id) => {
        const c = ALL_CARDS[id];
        return c?.type === 'chaff' || (input.rules.sakeCupIsChaff && c?.tags.includes('sakeCup'));
      }).length;
    case 'capturedRibbons':
      return input.captured.filter((id) => ALL_CARDS[id]?.type === 'ribbon').length;
    case 'capturedAnimals':
      return input.captured.filter((id) => ALL_CARDS[id]?.type === 'animal').length;
    case 'yakuCount':
      return input.hits.length;
    case 'extraChaff':
      return extraChaff;
  }
}

export function amount(a: Amount | undefined, q: (x: Quantity | undefined) => number): number {
  if (!a) return 0;
  return (a.base ?? 0) + (a.perUnit ?? 0) * q(a.per);
}

function matchesCard(f: CardFilter, id: CardId, month: Month, highest: CardId): boolean {
  const c = ALL_CARDS[id];
  if (!c) return false;
  if (f.type && c.type !== f.type) return false;
  if (f.tag && !c.tags.includes(f.tag)) return false;
  if (f.currentMonth && c.month !== month) return false;
  if (f.highest && id !== highest) return false;
  return true;
}

function matchesYaku(f: YakuFilter, id: YakuId): boolean {
  if (f.ids && !f.ids.includes(id)) return false;
  if (f.family && yakuDef(id).family !== f.family) return false;
  return true;
}

function conditionHolds(c: Condition | undefined, input: StopInput): boolean {
  if (!c) return true;
  if (c.minKoikoi !== undefined && input.ownCalls < c.minKoikoi) return false;
  if (c.hpBelow !== undefined && !(input.hpFraction < c.hpBelow)) return false;
  if (c.spiritCalled !== undefined && input.opponentCalled !== c.spiritCalled) return false;
  return true;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function yakuPointsAfterHalving(hit: YakuHit, halved: readonly YakuId[]): number {
  return halved.includes(hit.id) ? Math.max(1, Math.floor(hit.points / 2)) : hit.points;
}

export function stakeMultiplier(rules: RuleSet, stake: number, factorOverride?: number): number {
  if (stake <= 0) return 1;
  const factor = factorOverride ?? rules.koiKoiStake.factor;
  return rules.koiKoiStake.mode === 'multiplicative'
    ? Math.pow(factor, stake)
    : 1 + (factor - 1) * stake;
}

/** Score a stop by the player. Pure; returns the full animation trace. */
export function scoreStop(input: StopInput): ScoreResult {
  const steps: ScoreStep[] = [];
  let chips = 0;
  let mult = 0;
  const push = (source: ScoreSource, add: { chips?: number; mult?: number; xmult?: number }) => {
    if (add.chips) chips += add.chips;
    if (add.mult) mult += add.mult;
    if (add.xmult !== undefined && add.xmult !== 1) mult *= add.xmult;
    steps.push({
      source,
      ...(add.chips ? { chips: round2(add.chips) } : {}),
      ...(add.mult ? { mult: round2(add.mult) } : {}),
      ...(add.xmult !== undefined && add.xmult !== 1 ? { xmult: round2(add.xmult) } : {}),
      totalChips: round2(chips),
      totalMult: round2(mult),
    });
  };

  // 1. Yaku: base points become mult; Poem levels and base chips add on top.
  const hits = input.hits.slice().sort((a, b) => b.points - a.points);
  let basePoints = 0;
  for (const h of hits) {
    const def = yakuDef(h.id);
    const level = input.poems[h.id] ?? 0;
    const pts = yakuPointsAfterHalving(h, input.halved);
    basePoints += pts;
    push(
      { kind: 'yaku', id: h.id, level, halved: pts !== h.points },
      { chips: def.baseChips + level * def.poem.chips, mult: pts + level * def.poem.mult },
    );
  }

  // 2. Traditional doublings.
  if (input.rules.sevenPlusThreshold > 0 && basePoints >= input.rules.sevenPlusThreshold) {
    push({ kind: 'rule', id: 'sevenPlus' }, { xmult: 2 });
  }
  if (input.rules.opponentKoiKoiDoubles && input.opponentCalled) {
    push({ kind: 'rule', id: 'opponentKoikoi' }, { xmult: 2 });
  }

  // 3. Cards, in order: Brights, Animals, Ribbons, Chaff.
  const cards = scoringCards(hits).sort((a, b) => {
    const ca = ALL_CARDS[a];
    const cb = ALL_CARDS[b];
    if (!ca || !cb) return 0;
    return TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] || ca.month - cb.month || a - b;
  });
  let highest: CardId = -1;
  let highestChips = -1;
  for (const id of cards) {
    const v = cardChips(id, input.rules, input.lightningIsBright);
    if (v > highestChips) {
      highest = id;
      highestChips = v;
    }
  }
  const kasu = input.hits.find((h) => h.id === 'kasu');
  const extraChaff = kasu ? kasu.extra : 0;
  const defs = input.omamori.map((m) => ({ inst: m, def: omamoriDef(m.id) }));

  for (const id of cards) {
    const enh = input.enhancements[id];
    let passes = 1;
    if (enh) passes += enhancementDef(enh).retrigger ?? 0;
    for (const { def } of defs) {
      for (const e of def.effects) {
        if (e.kind === 'card' && e.retrigger && matchesCard(e.filter, id, input.month, highest))
          passes += e.retrigger;
      }
    }
    for (let pass = 0; pass < passes; pass++) {
      push(
        { kind: 'card', card: id, pass },
        { chips: cardChips(id, input.rules, input.lightningIsBright) },
      );
      if (enh) {
        const ed = enhancementDef(enh);
        if (ed.chips || ed.mult || ed.xmult) {
          push(
            { kind: 'enhancement', card: id, id: enh },
            {
              ...(ed.chips ? { chips: ed.chips } : {}),
              ...(ed.mult ? { mult: ed.mult } : {}),
              ...(ed.xmult ? { xmult: ed.xmult } : {}),
            },
          );
        }
      }
      defs.forEach(({ inst, def }, slot) => {
        for (const e of def.effects) {
          if (e.kind !== 'card' || !matchesCard(e.filter, id, input.month, highest)) continue;
          const q = (x: Quantity | undefined) => quantity(x, input, inst.counter, extraChaff);
          const add = bonus(e, q);
          if (add) push({ kind: 'omamori', id: def.id, slot, card: id }, add);
        }
      });
    }
  }

  // 4. Charms in slot order: per-yaku effects, then per-stop effects.
  defs.forEach(({ inst, def }, slot) => {
    for (const e of def.effects) {
      if (e.kind === 'yaku') {
        for (const h of hits) {
          if (!matchesYaku(e.filter, h.id)) continue;
          const q = (x: Quantity | undefined) =>
            quantity(x, input, inst.counter, h.id === 'kasu' ? h.extra : extraChaff);
          const add = bonus(e, q);
          if (add) push({ kind: 'omamori', id: def.id, slot }, add);
        }
      } else if (e.kind === 'stop') {
        const q = (x: Quantity | undefined) => quantity(x, input, inst.counter, extraChaff);
        const b: Bonus | undefined = conditionHolds(e.when, input) ? e : e.otherwise;
        const add = b ? bonus(b, q) : null;
        if (add) push({ kind: 'omamori', id: def.id, slot }, add);
      }
    }
  });

  // 5. Your own koi-koi stakes, then the Taiko Drum.
  const stake = stakeMultiplier(input.rules, input.ownStake, input.stakeFactor);
  if (stake !== 1) push({ kind: 'rule', id: 'stake' }, { xmult: stake });
  if (input.drum !== 1) push({ kind: 'rule', id: 'drum' }, { xmult: input.drum });

  const damage = Math.max(0, Math.round(chips * mult));
  return { steps, chips: round2(chips), mult: round2(mult), damage, basePoints, cards };
}

function bonus(
  b: Bonus,
  q: (x: Quantity | undefined) => number,
): { chips?: number; mult?: number; xmult?: number } | null {
  const chips = amount(b.chips, q);
  const mult = amount(b.mult, q);
  const xmult = b.xmult ? amount(b.xmult, q) : 1;
  if (!chips && !mult && xmult === 1) return null;
  return {
    ...(chips ? { chips } : {}),
    ...(mult ? { mult } : {}),
    ...(xmult !== 1 ? { xmult } : {}),
  };
}

export interface SpiritHitInput {
  readonly points: number;
  readonly ferocity: number;
  /** The player called koi-koi this hand. */
  readonly playerCalled: boolean;
  readonly punish: number;
  readonly noKoikoiDouble: boolean;
  readonly bossMult: number;
  readonly spiritFlat: number;
  readonly defenseFlat: number;
}

export interface SpiritHit {
  readonly points: number;
  readonly ferocity: number;
  readonly punished: number;
  readonly bossMult: number;
  readonly flat: number;
  readonly blocked: number;
  readonly damage: number;
}

/** The spirit's hit on the player when it stops. */
export function spiritHit(input: SpiritHitInput): SpiritHit {
  const punished = input.playerCalled && !input.noKoikoiDouble ? input.punish : 1;
  const raw = input.points * input.ferocity * punished * input.bossMult + input.spiritFlat;
  const damage = Math.max(1, Math.round(raw) - input.defenseFlat);
  return {
    points: input.points,
    ferocity: input.ferocity,
    punished,
    bossMult: input.bossMult,
    flat: input.spiritFlat,
    blocked: Math.max(0, Math.min(input.defenseFlat, Math.round(raw) - 1)),
    damage,
  };
}

/** Live value text for growth charms, e.g. Bonsai's current +Mult. */
export function omamoriText(inst: OmamoriInstance, land: Land): string {
  const def = omamoriDef(inst.id);
  const stop = def.effects.find((e) => e.kind === 'stop');
  const q = (x: Quantity | undefined) => (x === 'counter' ? inst.counter : 0);
  let text = landText(def.text, land);
  if (stop && stop.kind === 'stop') {
    text = text
      .replace('{chips}', String(amount(stop.chips, q)))
      .replace('{mult}', String(amount(stop.mult, q)))
      .replace('{xmult}', String(round2(stop.xmult ? amount(stop.xmult, q) : 1)));
  }
  return text;
}
