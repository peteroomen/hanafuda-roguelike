/**
 * Yaku detection and progress. Pure functions of a captured pile plus context.
 */
import { ALL_CARDS, type CardId, type Month } from '@/content/cards';
import type { RuleSet } from '@/content/rules';
import { yakuDef, type YakuId } from '@/content/yaku';
import type { YakuHit, YakuMods } from './types';

export interface YakuContext {
  readonly month: Month;
  readonly rules: RuleSet;
  readonly mods: YakuMods;
  /** Cards that count double toward the count yaku (Torn). */
  readonly doubleCount?: ReadonlySet<CardId>;
  /** Cards of the current month present in this game (for Tsukifuda). */
  readonly monthCards: readonly CardId[];
}

export function needOf(id: YakuId, mods: YakuMods): number {
  return mods.need[id] ?? yakuDef(id).need;
}

function enabled(id: YakuId, mods: YakuMods): boolean {
  return !mods.disabled.includes(id);
}

interface Tally {
  brights: CardId[];
  animals: CardId[];
  ribbons: CardId[];
  chaff: CardId[];
  red: CardId[];
  blue: CardId[];
  animalW: number;
  ribbonW: number;
  chaffW: number;
  moon: CardId;
  curtain: CardId;
  sake: CardId;
  boar: CardId;
  deer: CardId;
  butterflies: CardId;
  rainMan: CardId;
}

function tally(captured: readonly CardId[], ctx: YakuContext): Tally {
  const t: Tally = {
    brights: [],
    animals: [],
    ribbons: [],
    chaff: [],
    red: [],
    blue: [],
    animalW: 0,
    ribbonW: 0,
    chaffW: 0,
    moon: -1,
    curtain: -1,
    sake: -1,
    boar: -1,
    deer: -1,
    butterflies: -1,
    rainMan: -1,
  };
  const dbl = ctx.doubleCount;
  for (const id of captured) {
    const c = ALL_CARDS[id];
    if (!c) continue;
    const w = dbl && dbl.has(id) ? 2 : 1;
    switch (c.type) {
      case 'bright':
        t.brights.push(id);
        break;
      case 'animal':
        t.animals.push(id);
        t.animalW += w;
        break;
      case 'ribbon':
        t.ribbons.push(id);
        t.ribbonW += w;
        break;
      case 'chaff':
        t.chaff.push(id);
        t.chaffW += w;
        break;
    }
    for (const tag of c.tags) {
      switch (tag) {
        case 'moon':
          t.moon = id;
          break;
        case 'curtain':
          t.curtain = id;
          break;
        case 'sakeCup':
          t.sake = id;
          if (ctx.rules.sakeCupIsChaff) {
            t.chaff.push(id);
            t.chaffW += w;
          }
          break;
        case 'boar':
          t.boar = id;
          break;
        case 'deer':
          t.deer = id;
          break;
        case 'butterflies':
          t.butterflies = id;
          break;
        case 'rainMan':
          t.rainMan = id;
          break;
        case 'redPoetry':
          t.red.push(id);
          break;
        case 'blueRibbon':
          t.blue.push(id);
          break;
        case 'lightning':
          if (ctx.mods.lightningIsBright) t.brights.push(id);
          break;
        default:
          break;
      }
    }
  }
  return t;
}

/** Every yaku this pile currently makes, after exclusive groups. */
export function detectYaku(captured: readonly CardId[], ctx: YakuContext): YakuHit[] {
  const { mods } = ctx;
  const t = tally(captured, ctx);
  const hits: YakuHit[] = [];
  const add = (id: YakuId, cards: CardId[], extra = 0) => {
    const def = yakuDef(id);
    hits.push({
      id,
      points: def.points + def.perExtra * Math.max(0, extra),
      cards,
      extra: Math.max(0, extra),
    });
  };

  // Brights: a ladder, only the best one scores.
  const rainCounts = mods.rainManPenalty && t.rainMan >= 0;
  const clearBrights = rainCounts ? t.brights.filter((id) => id !== t.rainMan) : t.brights;
  if (enabled('goko', mods) && t.brights.length >= needOf('goko', mods)) {
    add('goko', t.brights.slice());
  } else if (enabled('shiko', mods) && clearBrights.length >= needOf('shiko', mods)) {
    add('shiko', clearBrights.slice());
  } else if (
    enabled('ameShiko', mods) &&
    rainCounts &&
    t.brights.length >= needOf('ameShiko', mods)
  ) {
    add('ameShiko', t.brights.slice());
  } else if (enabled('sanko', mods) && clearBrights.length >= needOf('sanko', mods)) {
    add('sanko', clearBrights.slice());
  }

  // Sake yaku.
  if (t.sake >= 0) {
    if (enabled('tsukimi', mods) && t.moon >= 0) add('tsukimi', [t.moon, t.sake]);
    const curtainLike = t.curtain >= 0 ? t.curtain : mods.moonIsCurtain ? t.moon : -1;
    if (enabled('hanami', mods) && curtainLike >= 0) add('hanami', [curtainLike, t.sake]);
  }

  // Boar, Deer, Butterflies.
  if (enabled('inoshikacho', mods) && t.boar >= 0 && t.deer >= 0 && t.butterflies >= 0) {
    add('inoshikacho', t.animals.slice(), t.animals.length - 3);
  }

  // Poetry ribbons: the combined yaku replaces both halves.
  const redNeed = needOf('akatan', mods);
  const blueNeed = needOf('aotan', mods);
  const hasRed = t.red.length >= redNeed;
  const hasBlue = t.blue.length >= blueNeed;
  if (hasRed && hasBlue && enabled('akaao', mods)) {
    add('akaao', t.ribbons.slice(), t.ribbons.length - (redNeed + blueNeed));
  } else {
    if (hasRed && enabled('akatan', mods))
      add('akatan', t.ribbons.slice(), t.ribbons.length - redNeed);
    if (hasBlue && enabled('aotan', mods))
      add('aotan', t.ribbons.slice(), t.ribbons.length - blueNeed);
  }

  // Count yaku.
  const taneNeed = needOf('tane', mods);
  if (enabled('tane', mods) && t.animalW >= taneNeed)
    add('tane', t.animals.slice(), t.animalW - taneNeed);
  const tanNeed = needOf('tan', mods);
  if (enabled('tan', mods) && t.ribbonW >= tanNeed)
    add('tan', t.ribbons.slice(), t.ribbonW - tanNeed);
  const kasuNeed = needOf('kasu', mods);
  if (enabled('kasu', mods) && t.chaffW >= kasuNeed)
    add('kasu', t.chaff.slice(), t.chaffW - kasuNeed);

  // Month cards.
  if (ctx.rules.tsukifuda && enabled('tsukifuda', mods) && ctx.monthCards.length > 0) {
    const set = new Set(captured);
    if (ctx.monthCards.every((id) => set.has(id))) add('tsukifuda', ctx.monthCards.slice());
  }

  return hits;
}

export function totalPoints(hits: readonly YakuHit[]): number {
  let p = 0;
  for (const h of hits) p += h.points;
  return p;
}

/** The union of cards across all hits, in first-seen order. */
export function scoringCards(hits: readonly YakuHit[]): CardId[] {
  const seen = new Set<CardId>();
  const out: CardId[] = [];
  for (const h of hits) {
    for (const id of h.cards) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export interface YakuProgress {
  readonly id: YakuId;
  readonly have: number;
  readonly need: number;
  readonly complete: boolean;
  /** No longer reachable because the opponent holds a card it needs. */
  readonly blocked: boolean;
  /**
   * Cards still out there (not captured by either seat) that would advance it.
   * For set yaku these are the specific missing cards; for count yaku, any card
   * of the right kind.
   */
  readonly wanted: readonly CardId[];
}

export interface ProgressInput {
  readonly own: readonly CardId[];
  readonly opponent: readonly CardId[];
  /** Cards that exist in this game (the run deck). */
  readonly inGame: readonly CardId[];
}

/**
 * Progress toward every enabled yaku. Used by the yaku tracker, spirit intent
 * and the AI. Cheap enough to call inside simulations.
 */
export function yakuProgress(input: ProgressInput, ctx: YakuContext): YakuProgress[] {
  const { mods } = ctx;
  const own = new Set(input.own);
  const opp = new Set(input.opponent);
  const out: YakuProgress[] = [];
  const free = (id: CardId) => !own.has(id) && !opp.has(id);
  const inGame = input.inGame;
  const dbl = ctx.doubleCount;
  const weight = (id: CardId) => (dbl && dbl.has(id) ? 2 : 1);

  const isBright = (id: CardId) => {
    const c = ALL_CARDS[id];
    if (!c) return false;
    return c.type === 'bright' || (mods.lightningIsBright && c.tags.includes('lightning'));
  };
  const isChaff = (id: CardId) => {
    const c = ALL_CARDS[id];
    if (!c) return false;
    return c.type === 'chaff' || (ctx.rules.sakeCupIsChaff && c.tags.includes('sakeCup'));
  };
  const tagged = (tag: string) =>
    inGame.filter((id) => (ALL_CARDS[id]?.tags as readonly string[]).includes(tag));

  const setYaku = (id: YakuId, required: CardId[][], need: number) => {
    // `required` is a list of alternatives per slot; a slot is filled if any alternative is owned.
    if (!enabled(id, mods)) return;
    let have = 0;
    let blocked = false;
    const wanted: CardId[] = [];
    for (const alts of required) {
      if (alts.some((a) => own.has(a))) have += 1;
      else {
        const open = alts.filter(free);
        if (open.length === 0) blocked = true;
        wanted.push(...open);
      }
    }
    out.push({
      id,
      have: Math.min(have, need),
      need,
      complete: have >= need,
      blocked: have < need && blocked,
      wanted,
    });
  };

  const countYaku = (id: YakuId, pool: CardId[], need: number, weighted = true) => {
    if (!enabled(id, mods)) return;
    let have = 0;
    let possible = 0;
    const wanted: CardId[] = [];
    for (const c of pool) {
      const w = weighted ? weight(c) : 1;
      if (own.has(c)) have += w;
      else if (free(c)) {
        wanted.push(c);
        possible += w;
      }
    }
    out.push({
      id,
      have: Math.min(have, need),
      need,
      complete: have >= need,
      blocked: have + possible < need,
      wanted,
    });
  };

  // Brights ladder: report Sankō/Shikō/Gokō as one progression toward the next rung.
  const brights = inGame.filter(isBright);
  const rain = tagged('rainMan')[0];
  const ownBrights = brights.filter((b) => own.has(b));
  const ownClear = ownBrights.filter((b) => !(mods.rainManPenalty && b === rain));
  const freeBrights = brights.filter(free);
  const ladder: YakuId[] = ['sanko', 'shiko', 'goko'];
  for (const rung of ladder) {
    if (!enabled(rung, mods)) continue;
    const need = needOf(rung, mods);
    const haveCount = rung === 'goko' ? ownBrights.length : ownClear.length;
    const wanted = freeBrights.filter(
      (b) => rung === 'goko' || !(mods.rainManPenalty && b === rain),
    );
    const possible = haveCount + wanted.length;
    if (haveCount < need || rung === 'goko') {
      out.push({
        id: rung,
        have: Math.min(haveCount, need),
        need,
        complete: haveCount >= need,
        blocked: possible < need,
        wanted,
      });
      break;
    }
  }

  const moon = tagged('moon');
  const curtain = tagged('curtain');
  const sake = tagged('sakeCup');
  if (sake.length) {
    if (moon.length) setYaku('tsukimi', [moon, sake], 2);
    const curtainAlts = mods.moonIsCurtain ? [...curtain, ...moon] : curtain;
    if (curtainAlts.length) setYaku('hanami', [curtainAlts, sake], 2);
  }
  const boar = tagged('boar');
  const deer = tagged('deer');
  const butterflies = tagged('butterflies');
  if (boar.length && deer.length && butterflies.length)
    setYaku('inoshikacho', [boar, deer, butterflies], 3);

  const red = tagged('redPoetry');
  const blue = tagged('blueRibbon');
  countYaku('akatan', red, needOf('akatan', mods), false);
  countYaku('aotan', blue, needOf('aotan', mods), false);

  countYaku(
    'tane',
    inGame.filter((id) => ALL_CARDS[id]?.type === 'animal'),
    needOf('tane', mods),
  );
  countYaku(
    'tan',
    inGame.filter((id) => ALL_CARDS[id]?.type === 'ribbon'),
    needOf('tan', mods),
  );
  countYaku('kasu', inGame.filter(isChaff), needOf('kasu', mods));

  if (ctx.rules.tsukifuda && ctx.monthCards.length) {
    countYaku('tsukifuda', ctx.monthCards.slice(), ctx.monthCards.length, false);
  }
  return out;
}
