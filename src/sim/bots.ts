/**
 * Scripted player bots for the balance simulator.
 *
 * - random:  random legal moves, random shopping. A floor, not a player.
 * - greedy:  captures greedily, always stops at once, buys whatever it can afford.
 * - smart:   the AI evaluator with lookahead, fight-aware koi-koi decisions, an
 *            archetype it commits to in the shop, and sensible talisman use.
 */
import { CARDS, type CardId } from '@/content/cards';
import { ENHANCEMENTS } from '@/content/enhancements';
import type { OfudaId } from '@/content/ofuda';
import { type Archetype, omamoriDef, type OmamoriId } from '@/content/omamori';
import type { AiPersona } from '@/content/spirits';
import { yakuDef, type YakuFamily, type YakuId } from '@/content/yaku';
import {
  choosePlay,
  gain,
  makeEvaluator,
  opponentThreat,
  progressFor,
  unseenFor,
} from '@/engine/ai';
import { currentYaku, fieldMatches, type HandAction, legalActions } from '@/engine/hand';
import { Rng } from '@/engine/rng';
import {
  type FightState,
  previewPlayerStop,
  previewSpiritHit,
  type RunAction,
  type RunState,
  shopDiscount,
} from '@/engine/run';
import { healPrice, offerPrice, rerollPrice, shrinePrice } from '@/engine/shop';
import { totalPoints } from '@/engine/yaku';

export interface DecidePolicy {
  /** Minimum cards left in hand to call koi-koi. */
  readonly minCards: number;
  /** Maximum opponent threat (0..1) to call koi-koi. */
  readonly maxThreat: number;
  /** Stop if the damage now is at least this fraction of the spirit's HP. */
  readonly enoughFraction: number;
  /** Stop if a punished spirit hit would take more than this fraction of our HP. */
  readonly hpRisk: number;
  /** Never call more than this many koi-koi in a hand. */
  readonly maxCalls: number;
}

export interface BotConfig {
  readonly kind: 'random' | 'greedy' | 'smart';
  readonly archetype?: Archetype | 'auto';
  readonly decide?: DecidePolicy;
  /** Keep this much mon for interest when shopping (smart only). */
  readonly savings?: number;
}

export const DEFAULT_DECIDE: DecidePolicy = {
  minCards: 3,
  maxThreat: 0.45,
  enoughFraction: 0.7,
  hpRisk: 0.35,
  maxCalls: 2,
};

export const PLAYER_PERSONA: AiPersona = {
  prefs: {},
  denial: 0.9,
  stopAt: 99,
  minCards: 0,
  caution: 1,
  focus: 0,
  lookahead: true,
};

const FAMILY_FOR: Partial<Record<Archetype, YakuFamily[]>> = {
  brights: ['brights'],
  ribbons: ['ribbons'],
  animals: ['animals'],
  chaff: ['chaff'],
  sake: ['sake', 'brights'],
  season: ['month'],
};

export interface Bot {
  readonly config: BotConfig;
  /** The next action the bot wants to take (the driver loops until the run ends). */
  next(run: RunState): RunAction;
}

function personaFor(config: BotConfig, archetype: Archetype | null): AiPersona {
  if (config.kind !== 'smart' || !archetype) return PLAYER_PERSONA;
  const fams = FAMILY_FOR[archetype] ?? [];
  const prefs: Partial<Record<YakuFamily, number>> = {};
  for (const f of fams) prefs[f] = 1.4;
  return { ...PLAYER_PERSONA, prefs };
}

export function makeBot(config: BotConfig, seed: number): Bot {
  const rng = new Rng(seed);
  let archetype: Archetype | null =
    config.archetype && config.archetype !== 'auto' ? config.archetype : null;

  const handAction = (run: RunState): HandAction => {
    const f = run.fight as FightState;
    const h = f.hand;
    if (config.kind === 'random') {
      const legal = legalActions(h);
      if (h.phase === 'decide') return rng.next() < 0.3 ? { type: 'koikoi' } : { type: 'stop' };
      return rng.pick(legal);
    }
    const persona = personaFor(config, archetype);
    switch (h.phase) {
      case 'play':
        return { type: 'play', card: choosePlay(h, makeEvaluator(h, 0, persona, null)) };
      case 'playChoice':
      case 'flipChoice': {
        const ev = makeEvaluator(h, 0, persona, null);
        const opts = h.pending?.options ?? [];
        let best = opts[0] as CardId;
        for (const o of opts) if (gain(ev, o) > gain(ev, best)) best = o;
        return { type: 'choose', card: best };
      }
      case 'flip':
        return { type: 'flip' };
      case 'frogDecide': {
        const ev = makeEvaluator(h, 0, persona, null);
        const kept = h.revealed as CardId;
        const valueOf = (c: CardId) => {
          const m = fieldMatches(h, c);
          if (!m.length) return 0;
          return gain(ev, c) + Math.max(...m.map((x) => gain(ev, x)));
        };
        const pool = unseenFor(h, 0, false).filter((u) => u !== kept);
        const avg = pool.reduce((a, u) => a + valueOf(u), 0) / Math.max(1, pool.length);
        return valueOf(kept) >= avg ? { type: 'keepFlip' } : { type: 'redoFlip' };
      }
      case 'decide':
        return {
          type: config.kind === 'greedy' ? 'stop' : decide(run, config.decide ?? DEFAULT_DECIDE),
        };
      case 'over':
        throw new Error('hand over');
    }
  };

  const shopActions = (run: RunState): RunAction | null => {
    const shop = run.shop;
    if (!shop) return null;
    const ctx = { deckId: run.deckId, omen: run.omen, discount: shopDiscount(run) };
    const affordable = (price: number) => run.mon >= price;
    if (config.kind === 'random') {
      const options: RunAction[] = [];
      shop.offers.forEach((o, i) => {
        if (o.sold || !affordable(offerPrice(o, ctx))) return;
        if (o.kind === 'omamori' && run.omamori.length >= run.omamoriSlots) return;
        if (o.kind === 'ofuda' && run.ofuda.length >= run.ofudaSlots) return;
        options.push({ type: 'buy', offer: i });
      });
      if (options.length && rng.next() < 0.7) return rng.pick(options);
      return null;
    }
    // Heal when hurt.
    if (!shop.healUsed && run.hp < run.maxHp * 0.55 && affordable(healPrice(ctx)))
      return { type: 'heal' };
    if (!archetype && config.archetype === 'auto') archetype = pickArchetype(run, rng);
    const reserve = config.kind === 'smart' ? (config.savings ?? 0) : 0;
    let bestIdx = -1;
    let bestScore = 0;
    shop.offers.forEach((o, i) => {
      if (o.sold) return;
      const price = offerPrice(o, ctx);
      if (!affordable(price + (o.kind === 'omamori' ? 0 : reserve))) return;
      let score: number;
      if (o.kind === 'omamori') {
        if (run.omamori.length >= run.omamoriSlots) return;
        score = charmScore(o.id, archetype, run);
      } else if (o.kind === 'poem') {
        score = poemScore(o.id, archetype, run);
      } else {
        if (run.ofuda.length >= run.ofudaSlots) return;
        score = ofudaScore(o.id);
      }
      if (config.kind === 'greedy') score = 1;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) return { type: 'buy', offer: bestIdx };
    // Replace the weakest charm when full and a much better one is on offer.
    if (config.kind === 'smart' && run.omamori.length >= run.omamoriSlots) {
      const weakest = run.omamori
        .map((m, i) => ({ i, s: charmScore(m.id, archetype, run) }))
        .sort((a, b) => a.s - b.s)[0];
      const better = shop.offers.findIndex(
        (o) =>
          !o.sold &&
          o.kind === 'omamori' &&
          weakest &&
          charmScore(o.id, archetype, run) > weakest.s + 2 &&
          affordable(offerPrice(o, ctx) - 2),
      );
      if (weakest && better >= 0) return { type: 'sell', slot: weakest.i };
    }
    if (!shop.shrine.used && config.kind === 'smart') {
      const price = shrinePrice(shop.shrine.enhancement, ctx);
      const target = enhanceTarget(run, shop.shrine.enhancement, archetype);
      if (target !== null && affordable(price + reserve)) return { type: 'enhance', card: target };
    }
    if (
      config.kind === 'smart' &&
      run.mon >= rerollPrice(shop.rerolls, ctx) + 10 &&
      shop.rerolls < 2
    )
      return { type: 'reroll' };
    return null;
  };

  const ofudaAction = (run: RunState): RunAction | null => {
    if (config.kind !== 'smart') return null;
    const f = run.fight as FightState;
    const h = f.hand;
    if (h.phase !== 'play' || h.active !== 0) return null;
    for (let slot = 0; slot < run.ofuda.length; slot++) {
      const id = run.ofuda[slot] as OfudaId;
      switch (id) {
        case 'warmSake':
          if (run.hp < run.maxHp * 0.5) return { type: 'ofuda', slot };
          break;
        case 'taiko':
          if (f.drum === 1 && f.hp > 0) return { type: 'ofuda', slot };
          break;
        case 'peek':
        case 'frog':
        case 'windCharm':
        case 'foxMask':
          if (h.turn <= 3 && !h.frogArmed[0]) return { type: 'ofuda', slot };
          break;
        case 'downpour': {
          const ev = makeEvaluator(h, 0, PLAYER_PERSONA, null);
          const anyCapture = h.hands[0].some((c) => fieldMatches(h, c).length > 0);
          if (!anyCapture && ev) return { type: 'ofuda', slot };
          break;
        }
        case 'goldLeaf': {
          const best = h.hands[0].slice().sort((a, b) => rank(b) - rank(a))[0];
          if (best !== undefined && !run.enhancements[String(best)])
            return { type: 'ofuda', slot, handCard: best };
          break;
        }
        case 'swap': {
          // Take a bright off the field if nothing in hand can match it.
          const target = h.field.find(
            (c) =>
              CARDS[c]?.type === 'bright' &&
              !h.frozen.includes(c) &&
              !h.hands[0].some((x) => CARDS[x]?.month === CARDS[c]?.month),
          );
          const give = h.hands[0].slice().sort((a, b) => rank(a) - rank(b))[0];
          if (target !== undefined && give !== undefined)
            return { type: 'ofuda', slot, handCard: give, fieldCard: target };
          break;
        }
      }
    }
    return null;
  };

  return {
    config,
    next(run: RunState): RunAction {
      switch (run.phase) {
        case 'fight': {
          const f = run.fight as FightState;
          if (f.phase === 'handOver') return { type: 'nextHand' };
          if (f.hand.active === 1 && f.hand.phase !== 'over') return { type: 'spirit' };
          const o = ofudaAction(run);
          if (o) return o;
          return { type: 'hand', action: handAction(run) };
        }
        case 'reward':
          return { type: 'collect' };
        case 'shop':
          return shopActions(run) ?? { type: 'leaveShop' };
        default:
          throw new Error(`run is over (${run.phase})`);
      }
    },
  };
}

function rank(c: CardId): number {
  const t = CARDS[c]?.type;
  return t === 'bright' ? 4 : t === 'animal' ? 3 : t === 'ribbon' ? 2 : 1;
}

/** Fight-aware koi-koi decision for the smart bot. */
export function decide(run: RunState, base: DecidePolicy): 'stop' | 'koikoi' {
  // A player holding koi-koi charms leans into the gamble.
  const greed = run.omamori.filter((o) => omamoriDef(o.id).archetype === 'greed').length;
  const p: DecidePolicy = greed
    ? {
        minCards: base.minCards,
        maxThreat: base.maxThreat + 0.1 * greed,
        enoughFraction: base.enoughFraction + 0.4 * greed,
        hpRisk: base.hpRisk + 0.1 * greed,
        maxCalls: base.maxCalls + 1,
      }
    : base;
  const f = run.fight as FightState;
  const h = f.hand;
  if (h.hands[0].length === 0) return 'stop';
  const preview = previewPlayerStop(run);
  if (!preview) return 'stop';
  if (preview.damage >= f.hp) return 'stop';
  if (preview.damage >= f.hp * p.enoughFraction) return 'stop';
  if (h.koikoiCalls[0] >= p.maxCalls) return 'stop';
  if (h.hands[0].length < p.minCards) return 'stop';
  if (opponentThreat(h, 0) > p.maxThreat) return 'stop';
  // How badly would the spirit punish us? Assume it lands a middling yaku.
  const oppBest = Math.max(3, totalPoints(currentYaku(h, 1)) + 1);
  const punished = previewSpiritHit(run, oppBest).damage * (h.koikoi[0] > 0 ? 1 : 2);
  if (punished > run.hp * p.hpRisk) return 'stop';
  // Is there something worth pressing for?
  const prog = progressFor(h, 0);
  const upside =
    prog.some((x) => !x.complete && !x.blocked && x.need - x.have <= 2) ||
    prog.some((x) => x.complete && yakuDef(x.id).perExtra > 0);
  return upside ? 'koikoi' : 'stop';
}

const ARCHETYPES: Archetype[] = [
  'brights',
  'ribbons',
  'animals',
  'chaff',
  'greed',
  'sake',
  'season',
  'growth',
];

function pickArchetype(run: RunState, rng: Rng): Archetype {
  // Follow what the first shop offers, else a random one.
  const offered =
    run.shop?.offers
      .filter((o) => o.kind === 'omamori')
      .map((o) => omamoriDef(o.id as OmamoriId).archetype) ?? [];
  const specific = offered.filter((a) => ARCHETYPES.includes(a));
  return specific.length ? (specific[0] as Archetype) : rng.pick(ARCHETYPES);
}

export function charmScore(id: OmamoriId, archetype: Archetype | null, run: RunState): number {
  const def = omamoriDef(id);
  let s = def.rarity === 'rare' ? 5 : def.rarity === 'uncommon' ? 3.5 : 2.5;
  if (archetype && def.archetype === archetype) s += 4;
  if (def.archetype === 'general' || def.archetype === 'growth') s += 1.5;
  if (def.effects.some((e) => (e.kind === 'stop' || e.kind === 'yaku') && e.xmult)) s += 1.5;
  if (def.effects.some((e) => e.kind === 'economy')) s += run.month <= 4 ? 1 : -1.5;
  if (def.effects.some((e) => e.kind === 'defense')) s += run.hp < run.maxHp * 0.6 ? 1.5 : 0;
  if (def.effects.some((e) => e.kind === 'rule'))
    s += archetype && def.archetype === archetype ? 0.5 : -1.5;
  return s;
}

function poemScore(id: YakuId, archetype: Archetype | null, run: RunState): number {
  const fam = yakuDef(id).family;
  const fams = archetype ? (FAMILY_FOR[archetype] ?? []) : [];
  // Level what we actually score.
  const scored = run.stats.yakuScored[id] ?? 0;
  const total = Object.values(run.stats.yakuScored).reduce((a, b) => a + (b ?? 0), 0);
  const share = total > 0 ? scored / total : 0;
  let s = 1 + share * 8;
  if (fams.includes(fam)) s += 2;
  if (id === 'kasu' || id === 'tan' || id === 'tane') s += 0.8;
  return s;
}

function ofudaScore(id: OfudaId): number {
  switch (id) {
    case 'taiko':
      return 3;
    case 'warmSake':
      return 2;
    case 'frog':
    case 'peek':
    case 'windCharm':
      return 1.8;
    default:
      return 1.2;
  }
}

function enhanceTarget(run: RunState, enh: string, archetype: Archetype | null): CardId | null {
  const def = ENHANCEMENTS.find((e) => e.id === enh);
  if (!def) return null;
  if (enh === 'torn') {
    const fam =
      archetype === 'chaff'
        ? 'chaff'
        : archetype === 'ribbons'
          ? 'ribbon'
          : archetype === 'animals'
            ? 'animal'
            : 'chaff';
    const c = run.deck.find((id) => CARDS[id]?.type === fam && !run.enhancements[String(id)]);
    return c ?? null;
  }
  if (enh === 'inked' || enh === 'lucky') return null;
  const wantType =
    archetype === 'ribbons'
      ? 'ribbon'
      : archetype === 'animals'
        ? 'animal'
        : archetype === 'chaff'
          ? 'chaff'
          : 'bright';
  const c = run.deck.find((id) => CARDS[id]?.type === wantType && !run.enhancements[String(id)]);
  return c ?? null;
}
