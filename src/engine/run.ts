/**
 * The run: a year of twelve fights, with rewards and a shop between them.
 *
 * One pure reducer, `runStep(state, action) → { state, events }`. The UI
 * dispatches the player's actions and asks the spirit to act (`{ type: 'spirit' }`)
 * one step at a time so each move can be animated.
 */
import { BALANCE } from '@/content/balance';
import { landText } from '@/content/lands';
import {
  ALL_CARDS,
  type CardId,
  cardWithTag,
  type Land,
  landCardIds,
  type Month,
  seasonOf,
} from '@/content/cards';
import { deckDef, type DeckId, omenEffects } from '@/content/decks';
import { enhancementDef } from '@/content/enhancements';
import { ofudaDef, type OfudaId } from '@/content/ofuda';
import { omamoriDef, type OmamoriId } from '@/content/omamori';
import { DEFAULT_RULES, type RuleSet } from '@/content/rules';
import {
  BOSSES_BY_SEASON,
  REGULARS_BY_SEASON,
  spiritDef,
  type SpiritDef,
  type SpiritId,
} from '@/content/spirits';
import { YAKU, YAKU_IDS, type YakuId } from '@/content/yaku';
import { aiAction, chooseIntent, type Intent, refreshIntent } from './ai';
import {
  armFrog,
  canUseTalisman,
  currentYaku,
  downpour,
  type HandAction,
  type HandBossRules,
  type HandEvent,
  type HandState,
  newHand,
  peek,
  revealOpponentHand,
  skipNextFlip,
  step as handStep,
  swapCards,
  withEnhancements,
} from './hand';
import { deriveSeed, Rng } from './rng';
import {
  type OmamoriInstance,
  type ScoreResult,
  scoreStop,
  type SpiritHit,
  spiritHit,
  type StopInput,
} from './scoring';
import {
  healPrice,
  newShop,
  offerPrice,
  rerollPrice,
  rollOffers,
  sellPrice,
  type ShopState,
  shrinePrice,
} from './shop';
import {
  DEFAULT_YAKU_MODS,
  type EnhancementId,
  type Seat,
  type YakuHit,
  type YakuMods,
} from './types';
import { totalPoints } from './yaku';

export const RUN_VERSION = 1;

export type TutorialStage = 'matching' | 'oneYaku' | 'koikoi';
export type RunPhase = 'fight' | 'reward' | 'shop' | 'victory' | 'defeat';

export type HandOutcome =
  | {
      readonly kind: 'playerStop';
      readonly hits: readonly YakuHit[];
      readonly score: ScoreResult;
      readonly koikoi: number;
    }
  | { readonly kind: 'spiritStop'; readonly hits: readonly YakuHit[]; readonly hit: SpiritHit }
  | { readonly kind: 'exhausted' }
  | { readonly kind: 'struck' };

export interface FightState {
  readonly spiritId: SpiritId;
  readonly boss: boolean;
  hp: number;
  readonly maxHp: number;
  readonly baseFerocity: number;
  ferocity: number;
  handNo: number;
  lead: Seat;
  phase: 'hand' | 'handOver';
  hand: HandState;
  intent: Intent | null;
  drum: number;
  scoredYaku: YakuId[];
  readonly stage: TutorialStage | null;
  outcome: HandOutcome | null;
  handsWon: number;
  handsLost: number;
}

export interface RewardLine {
  readonly label: string;
  readonly mon: number;
}

export interface RewardState {
  readonly lines: readonly RewardLine[];
  readonly total: number;
  readonly heal: number;
}

export interface RunStats {
  fightsWon: number;
  handsWon: number;
  handsLost: number;
  handsExhausted: number;
  koikoiCalls: number;
  koikoiWins: number;
  maxKoikoiInHand: number;
  biggestHit: number;
  damageDealt: number;
  damageTaken: number;
  monEarned: number;
  yakuScored: Partial<Record<YakuId, number>>;
  bossesDefeated: number;
  charmsBought: number;
}

export interface RunState {
  readonly version: number;
  readonly seed: number;
  readonly deckId: DeckId;
  /** Which card set the run plays with. Saves from before lands existed are Nippon. */
  readonly land: Land;
  readonly omen: number;
  readonly guided: boolean;
  /** Charms the shop never offers (not yet unlocked). Missing on old saves and sims = none. */
  readonly lockedCharms?: readonly OmamoriId[];
  month: Month;
  hp: number;
  maxHp: number;
  mon: number;
  omamori: OmamoriInstance[];
  omamoriSlots: number;
  ofuda: OfudaId[];
  ofudaSlots: number;
  poems: Partial<Record<YakuId, number>>;
  enhancements: Record<string, EnhancementId>;
  deck: CardId[];
  schedule: SpiritId[];
  phase: RunPhase;
  fight: FightState | null;
  reward: RewardState | null;
  shop: ShopState | null;
  stats: RunStats;
}

export type RunAction =
  | { readonly type: 'hand'; readonly action: HandAction }
  | { readonly type: 'spirit' }
  | {
      readonly type: 'ofuda';
      readonly slot: number;
      readonly handCard?: CardId;
      readonly fieldCard?: CardId;
    }
  | { readonly type: 'discardOfuda'; readonly slot: number }
  | { readonly type: 'nextHand' }
  | { readonly type: 'collect' }
  | { readonly type: 'buy'; readonly offer: number }
  | { readonly type: 'enhance'; readonly card: CardId }
  | { readonly type: 'heal' }
  | { readonly type: 'reroll' }
  | { readonly type: 'sell'; readonly slot: number }
  | { readonly type: 'moveOmamori'; readonly from: number; readonly to: number }
  | { readonly type: 'leaveShop' };

export type RunEvent =
  | { readonly t: 'hand'; readonly e: HandEvent }
  | { readonly t: 'fightStart'; readonly spirit: SpiritId; readonly month: Month }
  | { readonly t: 'newHand'; readonly handNo: number; readonly lead: Seat }
  | { readonly t: 'intent'; readonly intent: Intent | null; readonly changed: boolean }
  | {
      readonly t: 'strike';
      readonly target: 'spirit' | 'player';
      readonly amount: number;
      readonly source: 'capture' | 'thief';
    }
  | { readonly t: 'playerStop'; readonly score: ScoreResult; readonly hits: readonly YakuHit[] }
  | { readonly t: 'spiritStop'; readonly hit: SpiritHit; readonly hits: readonly YakuHit[] }
  | { readonly t: 'fightWon'; readonly spirit: SpiritId }
  | { readonly t: 'defeat' }
  | { readonly t: 'victory' }
  | { readonly t: 'mon'; readonly amount: number; readonly reason: string }
  | { readonly t: 'heal'; readonly amount: number }
  | { readonly t: 'ofuda'; readonly id: OfudaId }
  | { readonly t: 'grow'; readonly id: OmamoriId; readonly counter: number }
  | { readonly t: 'crumble'; readonly card: CardId }
  | { readonly t: 'poem'; readonly yaku: YakuId; readonly level: number }
  | { readonly t: 'enhanced'; readonly card: CardId; readonly enhancement: EnhancementId };

export interface RunStepResult {
  readonly state: RunState;
  readonly events: RunEvent[];
}

export interface NewRunOptions {
  readonly seed: number;
  readonly deckId?: DeckId;
  readonly land?: Land;
  readonly omen?: number;
  readonly guided?: boolean;
  /** Charms the player hasn't unlocked yet; the shop never offers them. Omitted = all. */
  readonly lockedCharms?: readonly OmamoriId[];
}

// ---------------------------------------------------------------------------
// Setup

function makeSchedule(seed: number, guided: boolean): SpiritId[] {
  const rng = new Rng(deriveSeed(seed, 'schedule'));
  const out: SpiritId[] = [];
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;
  for (const season of seasons) {
    const regs = rng.shuffle(REGULARS_BY_SEASON[season]);
    out.push(regs[0] as SpiritId, regs[1] as SpiritId, rng.pick(BOSSES_BY_SEASON[season]));
  }
  if (guided) {
    out[0] = 'kodama';
    out[1] = 'kasaObake';
    out[2] = 'tanuki';
  }
  return out;
}

function emptyStats(): RunStats {
  return {
    fightsWon: 0,
    handsWon: 0,
    handsLost: 0,
    handsExhausted: 0,
    koikoiCalls: 0,
    koikoiWins: 0,
    maxKoikoiInHand: 0,
    biggestHit: 0,
    damageDealt: 0,
    damageTaken: 0,
    monEarned: 0,
    yakuScored: {},
    bossesDefeated: 0,
    charmsBought: 0,
  };
}

export function newRun(opts: NewRunOptions): RunStepResult {
  const deck = deckDef(opts.deckId ?? 'pine');
  const land = opts.land ?? 'nippon';
  const omen = opts.omen ?? 0;
  const oe = omenEffects(omen);
  const maxHp = BALANCE.playerHp + (deck.start.hpDelta ?? 0) + oe.startHpDelta;
  const enhancements: Record<string, EnhancementId> = {};
  for (const e of deck.start.enhance ?? [])
    enhancements[String(cardWithTag(e.tag, land))] = e.enhancement;
  const poems: Partial<Record<YakuId, number>> = {};
  if (deck.start.poemLevels) {
    const rng = new Rng(deriveSeed(opts.seed, 'poems'));
    for (let i = 0; i < deck.start.poemLevels; i++) {
      const y = rng.pick(YAKU).id;
      poems[y] = (poems[y] ?? 0) + 1;
    }
  }
  const state: RunState = {
    version: RUN_VERSION,
    seed: opts.seed,
    deckId: deck.id,
    land,
    omen,
    guided: opts.guided ?? false,
    ...(opts.lockedCharms?.length ? { lockedCharms: opts.lockedCharms.slice() } : {}),
    month: 1,
    hp: maxHp,
    maxHp,
    mon: BALANCE.startMon + (deck.start.mon ?? 0),
    omamori: (deck.start.omamori ?? []).map((id) => ({ id, counter: 0 })),
    omamoriSlots: deck.start.omamoriSlots ?? 5,
    ofuda: (deck.start.ofuda ?? []).slice(),
    ofudaSlots: deck.start.ofudaSlots ?? 2,
    poems,
    enhancements,
    deck: landCardIds(land),
    schedule: makeSchedule(opts.seed, opts.guided ?? false),
    phase: 'fight',
    fight: null,
    reward: null,
    shop: null,
    stats: emptyStats(),
  };
  const events: RunEvent[] = [];
  startFight(state, events);
  return { state, events };
}

export function stageFor(run: Pick<RunState, 'guided' | 'month'>): TutorialStage | null {
  if (!run.guided) return null;
  if (run.month === 1) return 'matching';
  if (run.month === 2) return 'oneYaku';
  if (run.month === 3) return 'koikoi';
  return null;
}

export function runRules(run: RunState, spirit: SpiritDef): RuleSet {
  return {
    ...DEFAULT_RULES,
    tsukifuda: true,
    koiKoiCallWeight: spirit.rule?.koikoiWeight ?? DEFAULT_RULES.koiKoiCallWeight,
    ...(deckDef(run.deckId).modifiers?.stakeFactor
      ? {
          koiKoiStake: {
            ...DEFAULT_RULES.koiKoiStake,
            factor: deckDef(run.deckId).modifiers?.stakeFactor as number,
          },
        }
      : {}),
  };
}

const COUNTING_YAKU: readonly YakuId[] = ['tan', 'tane', 'kasu'];

function stageDisabled(stage: TutorialStage | null): YakuId[] {
  if (stage === 'matching') return YAKU_IDS.slice();
  // Month 2 teaches the three counting sets together, so every hand has several ways to finish.
  if (stage === 'oneYaku') return YAKU_IDS.filter((id) => !COUNTING_YAKU.includes(id));
  return [];
}

export function playerYakuMods(
  run: RunState,
  spirit: SpiritDef,
  stage: TutorialStage | null,
): YakuMods {
  let mods: YakuMods = { ...DEFAULT_YAKU_MODS, need: {} };
  const need: Partial<Record<YakuId, number>> = {};
  for (const inst of run.omamori) {
    for (const e of omamoriDef(inst.id).effects) {
      if (e.kind !== 'rule') continue;
      if (e.need) Object.assign(need, e.need);
      if (e.rainManPenalty !== undefined) mods = { ...mods, rainManPenalty: e.rainManPenalty };
      if (e.moonIsCurtain) mods = { ...mods, moonIsCurtain: true };
      if (e.lightningIsBright) mods = { ...mods, lightningIsBright: true };
    }
  }
  const disabled = [...(spirit.rule?.disabled ?? []), ...stageDisabled(stage)];
  return { ...mods, need, disabled };
}

export function spiritYakuMods(spirit: SpiritDef, stage: TutorialStage | null): YakuMods {
  return {
    ...DEFAULT_YAKU_MODS,
    need: { ...(spirit.passive?.need ?? {}) },
    disabled: [...(spirit.rule?.disabled ?? []), ...stageDisabled(stage)],
  };
}

function bossHooks(spirit: SpiritDef): HandBossRules {
  const r = spirit.rule;
  if (!r) return {};
  return {
    ...(r.stealFirstBright ? { stealFirstBrightFrom: 0 as Seat } : {}),
    ...(r.freezeMax ? { freeze: { by: 1 as Seat, max: r.freezeMax } } : {}),
    ...(r.disguise
      ? { disguise: { victim: 0 as Seat, max: r.disguise.max, chance: r.disguise.chance } }
      : {}),
    ...(r.quakeEvery ? { quake: { every: r.quakeEvery } } : {}),
  };
}

export function spiritStats(
  run: Pick<RunState, 'month' | 'omen' | 'guided' | 'deckId'>,
  spirit: SpiritDef,
): { hp: number; ferocity: number } {
  const oe = omenEffects(run.omen);
  const i = run.month - 1;
  let hp =
    (BALANCE.monthHp[i] ?? 1000) *
    spirit.hp *
    (spirit.boss ? BALANCE.bossHp : 1) *
    oe.hpMult *
    (deckDef(run.deckId).modifiers?.spiritHp ?? 1);
  const ferocity =
    (BALANCE.monthFerocity[i] ?? 3) *
    spirit.ferocity *
    (spirit.boss ? BALANCE.bossFerocity : 1) *
    oe.ferocityMult;
  if (run.guided) {
    if (run.month === 1) hp = BALANCE.guided.month1Hp;
    if (run.month === 2) hp = BALANCE.guided.month2Hp;
    if (run.month === 3) hp *= BALANCE.guided.month3HpMult;
  }
  const ease = BALANCE.monthEase[i] ?? 1;
  return {
    hp: Math.round((hp * ease) / 5) * 5,
    ferocity: Math.round(ferocity * ease * 100) / 100,
  };
}

function dealHand(run: RunState, fight: FightState, events: RunEvent[]): void {
  const spirit = spiritDef(fight.spiritId);
  const { state, events: he } = newHand({
    rules: runRules(run, spirit),
    month: run.month,
    seed: deriveSeed(run.seed, `m${run.month}:h${fight.handNo}`),
    lead: fight.lead,
    deck: run.deck,
    yakuMods: [playerYakuMods(run, spirit, fight.stage), spiritYakuMods(spirit, fight.stage)],
    enhancements: run.enhancements,
    boss: bossHooks(spirit),
  });
  fight.hand = state;
  fight.phase = 'hand';
  fight.outcome = null;
  events.push({ t: 'newHand', handNo: fight.handNo, lead: fight.lead });
  for (const e of he) events.push({ t: 'hand', e });
  updateIntent(fight, events, true);
}

function startFight(run: RunState, events: RunEvent[]): void {
  const spiritId = run.schedule[run.month - 1] as SpiritId;
  const spirit = spiritDef(spiritId);
  const { hp, ferocity } = spiritStats(run, spirit);
  const stage = stageFor(run);
  const lead: Seat = omenEffects(run.omen).spiritLeads ? 1 : 0;
  const fight: FightState = {
    spiritId,
    boss: spirit.boss,
    hp,
    maxHp: hp,
    baseFerocity: ferocity,
    ferocity,
    handNo: 1,
    lead,
    phase: 'hand',
    hand: null as unknown as HandState,
    intent: null,
    drum: 1,
    scoredYaku: [],
    stage,
    outcome: null,
    handsWon: 0,
    handsLost: 0,
  };
  run.fight = fight;
  run.phase = 'fight';
  events.push({ t: 'fightStart', spirit: spiritId, month: run.month });
  dealHand(run, fight, events);
}

// ---------------------------------------------------------------------------
// Queries

export type Waiting = 'player' | 'spirit' | 'none';

/** Who the run is waiting on. */
export function waitingOn(run: RunState): Waiting {
  if (run.phase !== 'fight' || !run.fight)
    return run.phase === 'reward' || run.phase === 'shop' ? 'player' : 'none';
  const f = run.fight;
  if (f.phase === 'handOver') return 'player';
  if (f.hand.phase === 'over') return 'none';
  return f.hand.active === 0 ? 'player' : 'spirit';
}

export function hasOmamori(run: RunState, id: OmamoriId): boolean {
  return run.omamori.some((m) => m.id === id);
}

function defenseFlat(run: RunState): number {
  let flat = 0;
  for (const inst of run.omamori) {
    for (const e of omamoriDef(inst.id).effects) if (e.kind === 'defense' && e.flat) flat += e.flat;
  }
  return flat;
}

function noKoikoiDouble(run: RunState): boolean {
  return run.omamori.some((inst) =>
    omamoriDef(inst.id).effects.some((e) => e.kind === 'defense' && e.noKoikoiDouble),
  );
}

export function shopDiscount(run: RunState): number {
  let d = 0;
  for (const inst of run.omamori) {
    for (const e of omamoriDef(inst.id).effects)
      if (e.kind === 'economy' && e.discount) d = Math.max(d, e.discount);
  }
  return d;
}

/** Everything scoreStop needs for the player's stop, from the current hand. */
export function playerStopInput(run: RunState, hits: readonly YakuHit[]): StopInput {
  const f = run.fight as FightState;
  const h = f.hand;
  const spirit = spiritDef(f.spiritId);
  return {
    hits,
    captured: h.captured[0],
    month: run.month,
    rules: h.rules,
    ownCalls: h.koikoiCalls[0],
    ownStake: h.koikoi[0],
    opponentCalled: h.koikoi[1] > 0,
    omamori: run.omamori,
    poems: run.poems,
    enhancements: run.enhancements,
    hpFraction: run.hp / run.maxHp,
    halved: spirit.rule?.halveRepeats ? f.scoredYaku : [],
    drum: f.drum,
    lightningIsBright: h.yakuMods[0].lightningIsBright,
    ...(deckDef(run.deckId).modifiers?.stakeFactor
      ? { stakeFactor: deckDef(run.deckId).modifiers?.stakeFactor as number }
      : {}),
    ...(deckDef(run.deckId).modifiers?.yakuMult
      ? { yakuMult: deckDef(run.deckId).modifiers?.yakuMult as number }
      : {}),
  };
}

/** Preview of the damage the player would deal by stopping now. */
export function previewPlayerStop(run: RunState): ScoreResult | null {
  const f = run.fight;
  if (!f) return null;
  const hits = currentYaku(f.hand, 0);
  if (!hits.length) return null;
  return scoreStop(playerStopInput(run, hits));
}

/** The hit the spirit would land if it stopped with `points`. */
export function previewSpiritHit(run: RunState, points: number): SpiritHit {
  const f = run.fight as FightState;
  const spirit = spiritDef(f.spiritId);
  return spiritHit({
    points,
    ferocity: f.ferocity,
    playerCalled: f.hand.koikoi[0] > 0,
    punish: deckDef(run.deckId).modifiers?.punish ?? BALANCE.koikoiPunish,
    noKoikoiDouble: noKoikoiDouble(run),
    bossMult: spirit.rule?.damageMult ?? 1,
    spiritFlat: spirit.passive?.flatDamage ?? 0,
    defenseFlat: defenseFlat(run),
  });
}

// ---------------------------------------------------------------------------
// Fight internals

function cloneRun(run: RunState): RunState {
  return {
    ...run,
    omamori: run.omamori.map((m) => ({ ...m })),
    ofuda: run.ofuda.slice(),
    poems: { ...run.poems },
    enhancements: { ...run.enhancements },
    deck: run.deck.slice(),
    schedule: run.schedule.slice(),
    fight: run.fight
      ? {
          ...run.fight,
          scoredYaku: run.fight.scoredYaku.slice(),
        }
      : null,
    shop: run.shop
      ? { ...run.shop, offers: run.shop.offers.slice(), shrine: { ...run.shop.shrine } }
      : null,
    stats: { ...run.stats, yakuScored: { ...run.stats.yakuScored } },
  };
}

function updateIntent(f: FightState, events: RunEvent[], rechoose: boolean): void {
  const spirit = spiritDef(f.spiritId);
  const before = f.intent;
  const next = rechoose
    ? chooseIntent(f.hand, 1, spirit.persona, before?.id ?? null)
    : refreshIntent(f.hand, 1, before);
  const changed = (before?.id ?? null) !== (next?.id ?? null);
  const moved = changed || before?.have !== next?.have;
  f.intent = next;
  if (moved) events.push({ t: 'intent', intent: next, changed });
}

function grow(
  run: RunState,
  on: 'fightWon' | 'handWon' | 'stopAfterKoikoi',
  events: RunEvent[],
): void {
  run.omamori = run.omamori.map((inst) => {
    let counter = inst.counter;
    for (const e of omamoriDef(inst.id).effects)
      if (e.kind === 'grow' && e.on === on) counter += e.by;
    if (counter !== inst.counter) events.push({ t: 'grow', id: inst.id, counter });
    return counter === inst.counter ? inst : { ...inst, counter };
  });
}

function earn(run: RunState, amount: number, reason: string, events: RunEvent[]): void {
  if (amount <= 0) return;
  run.mon += amount;
  run.stats.monEarned += amount;
  events.push({ t: 'mon', amount, reason });
}

/** React to what just happened in the hand: capture side effects and tutorial strikes. */
function afterHandEvents(run: RunState, he: readonly HandEvent[], events: RunEvent[]): void {
  const f = run.fight as FightState;
  let spiritTurnStarted = false;
  let captured = false;
  for (const e of he) {
    events.push({ t: 'hand', e });
    if (e.t === 'turn' && e.seat === 1) spiritTurnStarted = true;
    if (e.t === 'koikoi' && e.seat === 0) {
      run.stats.koikoiCalls += 1;
      run.stats.maxKoikoiInHand = Math.max(run.stats.maxKoikoiInHand, e.calls);
      for (const inst of run.omamori) {
        for (const x of omamoriDef(inst.id).effects) {
          if (x.kind === 'economy' && x.perKoikoi) earn(run, x.perKoikoi, 'Maneki-neko', events);
        }
      }
    }
    if (e.t !== 'capture') continue;
    captured = true;
    if (e.seat === 0) {
      // Lucky cards pay out, Thief's Sleeve strikes when you take what the spirit wants.
      for (const id of e.cards) {
        const enh = run.enhancements[String(id)];
        if (enh) {
          const mon = enhancementDef(enh).mon;
          if (mon) earn(run, mon, 'Lucky card', events);
        }
      }
      const wanted = f.intent?.wanted ?? [];
      const denied = e.cards.filter((id) => wanted.includes(id)).length;
      if (denied > 0) {
        for (const inst of run.omamori) {
          for (const x of omamoriDef(inst.id).effects) {
            if (x.kind !== 'thief') continue;
            const dmg = Math.round(
              ((x.damage.base ?? 0) +
                (x.damage.perUnit ?? 0) * (x.damage.per === 'month' ? run.month : 0)) *
                denied,
            );
            strikeSpirit(run, dmg, 'thief', events);
          }
        }
      }
      if (f.stage === 'matching') {
        let dmg = 0;
        for (const id of e.cards) dmg += f.hand.rules.chips[ALL_CARDS[id]?.type ?? 'chaff'];
        strikeSpirit(run, dmg, 'capture', events);
      }
    } else if (f.stage === 'matching') {
      const dmg = BALANCE.guided.captureSting;
      run.hp = Math.max(0, run.hp - dmg);
      run.stats.damageTaken += dmg;
      events.push({ t: 'strike', target: 'player', amount: dmg, source: 'capture' });
    }
  }
  if (spiritTurnStarted) updateIntent(f, events, true);
  else if (captured) updateIntent(f, events, false);
}

function strikeSpirit(
  run: RunState,
  amount: number,
  source: 'capture' | 'thief',
  events: RunEvent[],
): void {
  const f = run.fight as FightState;
  if (amount <= 0) return;
  f.hp = Math.max(0, f.hp - amount);
  run.stats.damageDealt += amount;
  events.push({ t: 'strike', target: 'spirit', amount, source });
}

function resolveHandEnd(run: RunState, events: RunEvent[]): void {
  const f = run.fight as FightState;
  const h = f.hand;
  const res = h.result;
  if (!res) return;
  if (res.kind === 'stop' && res.winner === 0) {
    const score = scoreStop(playerStopInput(run, res.hits));
    f.hp = Math.max(0, f.hp - score.damage);
    f.drum = 1;
    f.handsWon += 1;
    f.lead = 0;
    for (const hit of res.hits) {
      if (!f.scoredYaku.includes(hit.id)) f.scoredYaku.push(hit.id);
      run.stats.yakuScored[hit.id] = (run.stats.yakuScored[hit.id] ?? 0) + 1;
    }
    run.stats.handsWon += 1;
    run.stats.damageDealt += score.damage;
    run.stats.biggestHit = Math.max(run.stats.biggestHit, score.damage);
    if (h.koikoiCalls[0] > 0) run.stats.koikoiWins += 1;
    f.outcome = { kind: 'playerStop', hits: res.hits, score, koikoi: h.koikoiCalls[0] };
    events.push({ t: 'playerStop', score, hits: res.hits });
    grow(run, 'handWon', events);
    if (h.koikoiCalls[0] > 0) grow(run, 'stopAfterKoikoi', events);
    // Torn cards crumble after they score for you.
    for (const id of score.cards) {
      if (run.enhancements[String(id)] === 'torn' && run.deck.length > 40) {
        delete run.enhancements[String(id)];
        run.deck = run.deck.filter((c) => c !== id);
        events.push({ t: 'crumble', card: id });
      }
    }
  } else if (res.kind === 'stop' && res.winner === 1) {
    const hit = previewSpiritHit(run, res.points);
    run.hp = Math.max(0, run.hp - hit.damage);
    run.stats.damageTaken += hit.damage;
    run.stats.handsLost += 1;
    f.handsLost += 1;
    f.lead = 1;
    f.outcome = { kind: 'spiritStop', hits: res.hits, hit };
    events.push({ t: 'spiritStop', hit, hits: res.hits });
  } else {
    run.stats.handsExhausted += 1;
    f.outcome = { kind: 'exhausted' };
  }
  if (omenEffects(run.omen).spiritLeads) f.lead = 1;
  f.phase = 'handOver';
  checkFightEnd(run, events);
}

function checkFightEnd(run: RunState, events: RunEvent[]): boolean {
  const f = run.fight as FightState;
  if (f.hp <= 0) {
    fightWon(run, events);
    return true;
  }
  if (run.hp <= 0) {
    run.phase = 'defeat';
    events.push({ t: 'defeat' });
    return true;
  }
  return false;
}

function interest(run: RunState): number {
  const cap = deckDef(run.deckId).modifiers?.interestCap ?? BALANCE.reward.interestCap;
  return Math.min(cap, Math.floor(run.mon / BALANCE.reward.interestPer));
}

function fightWon(run: RunState, events: RunEvent[]): void {
  const f = run.fight as FightState;
  const spirit = spiritDef(f.spiritId);
  if (f.phase === 'hand') {
    f.phase = 'handOver';
    if (!f.outcome) f.outcome = { kind: 'struck' };
  }
  run.stats.fightsWon += 1;
  if (spirit.boss) run.stats.bossesDefeated += 1;
  events.push({ t: 'fightWon', spirit: f.spiritId });
  grow(run, 'fightWon', events);
  if (run.month === 12) {
    run.phase = 'victory';
    events.push({ t: 'victory' });
    return;
  }
  const lines: RewardLine[] = [
    { label: `${spirit.name} defeated`, mon: BALANCE.reward.base[run.month - 1] ?? 5 },
  ];
  if (spirit.boss) lines.push({ label: 'Boss bounty', mon: BALANCE.reward.boss });
  if (f.handNo === 1 && f.outcome?.kind !== 'spiritStop')
    lines.push({ label: 'Swift victory', mon: BALANCE.reward.swift });
  if (spirit.passive?.bonusMon)
    lines.push({
      label: landText(spirit.passive.text, run.land).replace(/\.$/, ''),
      mon: spirit.passive.bonusMon,
    });
  for (const inst of run.omamori) {
    for (const e of omamoriDef(inst.id).effects) {
      if (e.kind === 'economy' && e.perFight)
        lines.push({ label: omamoriDef(inst.id).name, mon: e.perFight });
    }
  }
  const int = interest(run);
  if (int > 0)
    lines.push({ label: `Interest (1 per ${BALANCE.reward.interestPer} held)`, mon: int });
  const total = lines.reduce((a, l) => a + l.mon, 0);
  const healFrac =
    (spirit.boss ? BALANCE.bossHeal : BALANCE.fightHeal) * omenEffects(run.omen).healMult;
  const heal = Math.round((run.maxHp - run.hp) * healFrac);
  run.reward = { lines, total, heal };
  run.phase = 'reward';
}

function applyHandAction(run: RunState, action: HandAction, events: RunEvent[]): void {
  const f = run.fight as FightState;
  const r = handStep(f.hand, action);
  f.hand = r.state;
  afterHandEvents(run, r.events, events);
  if (checkFightEnd(run, events)) return;
  // Month 2 of the guided year: forming the yaku ends the hand at once.
  if (f.stage === 'oneYaku' && f.hand.phase === 'decide') {
    const r2 = handStep(f.hand, { type: 'stop' });
    f.hand = r2.state;
    afterHandEvents(run, r2.events, events);
  }
  if (f.hand.phase === 'over') resolveHandEnd(run, events);
}

function spiritAct(run: RunState, events: RunEvent[]): void {
  const f = run.fight as FightState;
  const spirit = spiritDef(f.spiritId);
  const h = f.hand;
  let decide;
  if (h.phase === 'decide') {
    const points = totalPoints(currentYaku(h, 1));
    decide = { stopDamage: previewSpiritHit(run, points).damage, targetHp: run.hp };
  }
  // A seeded roll per spirit move, so slips replay exactly from a save.
  const moveNo = h.captured[0].length + h.captured[1].length + h.hands[1].length * 100;
  const roll = new Rng(
    deriveSeed(run.seed, `slip:${run.month}:${f.handNo}:${h.phase}:${moveNo}`),
  ).next();
  const action = aiAction(h, 1, spirit.persona, {
    intent: f.intent?.id ?? null,
    ...(decide ? { decide } : {}),
    slip: roll < (BALANCE.spiritSlip[run.month - 1] ?? 0),
  });
  applyHandAction(run, action, events);
}

// ---------------------------------------------------------------------------
// Talismans

function useOfuda(
  run: RunState,
  slot: number,
  handCard: CardId | undefined,
  fieldCard: CardId | undefined,
  events: RunEvent[],
): void {
  const id = run.ofuda[slot];
  if (!id) throw new Error('No talisman in that slot');
  const def = ofudaDef(id);
  const f = run.fight;
  const inHand =
    run.phase === 'fight' && f !== null && f.phase === 'hand' && canUseTalisman(f.hand, 0);
  if (!def.anytime && !inHand) throw new Error('That talisman can only be used on your turn');
  switch (id) {
    case 'warmSake': {
      const amount = Math.min(def.amount ?? 12, run.maxHp - run.hp);
      run.hp += amount;
      events.push({ t: 'heal', amount });
      break;
    }
    case 'peek':
      applyHandEffect(run, peek((f as FightState).hand, def.amount ?? 3), events);
      break;
    case 'swap':
      if (handCard === undefined || fieldCard === undefined)
        throw new Error('Switch needs a hand card and a field card');
      applyHandEffect(run, swapCards((f as FightState).hand, 0, handCard, fieldCard), events);
      break;
    case 'downpour':
      applyHandEffect(run, downpour((f as FightState).hand, 0), events);
      break;
    case 'frog':
      applyHandEffect(run, armFrog((f as FightState).hand, 0), events);
      break;
    case 'foxMask':
      applyHandEffect(run, revealOpponentHand((f as FightState).hand, 0), events);
      break;
    case 'windCharm':
      applyHandEffect(run, skipNextFlip((f as FightState).hand, 1), events);
      break;
    case 'taiko':
      (f as FightState).drum = def.amount ?? 2;
      break;
    case 'goldLeaf': {
      const fight = f as FightState;
      if (handCard === undefined || !fight.hand.hands[0].includes(handCard))
        throw new Error('Gold Leaf needs a card in your hand');
      run.enhancements[String(handCard)] = 'gilded';
      fight.hand = withEnhancements(fight.hand, { ...run.enhancements });
      events.push({ t: 'enhanced', card: handCard, enhancement: 'gilded' });
      break;
    }
  }
  run.ofuda.splice(slot, 1);
  events.push({ t: 'ofuda', id });
}

function applyHandEffect(
  run: RunState,
  r: { state: HandState; events: HandEvent[] },
  events: RunEvent[],
): void {
  const f = run.fight as FightState;
  f.hand = r.state;
  for (const e of r.events) events.push({ t: 'hand', e });
  updateIntent(f, events, false);
}

// ---------------------------------------------------------------------------
// Shop

function shopCtx(run: RunState) {
  return {
    seed: run.seed,
    month: run.month,
    owned: run.omamori.map((m) => m.id),
    locked: run.lockedCharms ?? [],
    deckId: run.deckId,
    omen: run.omen,
    discount: shopDiscount(run),
  };
}

function spend(run: RunState, price: number): void {
  if (run.mon < price) throw new Error('Not enough mon');
  run.mon -= price;
}

// ---------------------------------------------------------------------------
// Reducer

export function runStep(state: RunState, action: RunAction): RunStepResult {
  const run = cloneRun(state);
  const events: RunEvent[] = [];
  switch (action.type) {
    case 'hand': {
      if (waitingOn(run) !== 'player' || run.fight?.phase !== 'hand')
        throw new Error('Not your turn');
      applyHandAction(run, action.action, events);
      break;
    }
    case 'spirit': {
      if (waitingOn(run) !== 'spirit') throw new Error("Not the spirit's turn");
      spiritAct(run, events);
      break;
    }
    case 'ofuda':
      useOfuda(run, action.slot, action.handCard, action.fieldCard, events);
      break;
    case 'discardOfuda':
      run.ofuda.splice(action.slot, 1);
      break;
    case 'nextHand': {
      const f = run.fight;
      if (run.phase !== 'fight' || !f || f.phase !== 'handOver') throw new Error('No hand to deal');
      f.handNo += 1;
      f.ferocity =
        Math.round(f.baseFerocity * (1 + BALANCE.handFerocityGrowth * (f.handNo - 1)) * 100) / 100;
      dealHand(run, f, events);
      break;
    }
    case 'collect': {
      if (run.phase !== 'reward' || !run.reward) throw new Error('No reward to collect');
      earn(run, run.reward.total, 'Reward', events);
      if (run.reward.heal > 0) {
        run.hp = Math.min(run.maxHp, run.hp + run.reward.heal);
        events.push({ t: 'heal', amount: run.reward.heal });
      }
      run.reward = null;
      run.fight = null;
      run.month = (run.month + 1) as Month;
      run.shop = newShop(shopCtx(run));
      run.phase = 'shop';
      break;
    }
    case 'buy': {
      const shop = run.shop;
      if (run.phase !== 'shop' || !shop) throw new Error('Not in the shop');
      const offer = shop.offers[action.offer];
      if (!offer || offer.sold) throw new Error('Nothing to buy there');
      const price = offerPrice(offer, shopCtx(run));
      if (offer.kind === 'omamori' && run.omamori.length >= run.omamoriSlots)
        throw new Error('No free charm slot');
      if (offer.kind === 'ofuda' && run.ofuda.length >= run.ofudaSlots)
        throw new Error('No free talisman slot');
      spend(run, price);
      shop.offers[action.offer] = { ...offer, sold: true };
      if (offer.kind === 'omamori') {
        run.omamori.push({ id: offer.id, counter: 0 });
        run.stats.charmsBought += 1;
      } else if (offer.kind === 'ofuda') run.ofuda.push(offer.id);
      else {
        run.poems[offer.id] = (run.poems[offer.id] ?? 0) + 1;
        events.push({ t: 'poem', yaku: offer.id, level: run.poems[offer.id] as number });
      }
      break;
    }
    case 'enhance': {
      const shop = run.shop;
      if (run.phase !== 'shop' || !shop || shop.shrine.used)
        throw new Error('The shrine is closed');
      if (!run.deck.includes(action.card)) throw new Error('That card is not in your deck');
      spend(run, shrinePrice(shop.shrine.enhancement, shopCtx(run)));
      run.enhancements[String(action.card)] = shop.shrine.enhancement;
      shop.shrine = { ...shop.shrine, used: true };
      events.push({ t: 'enhanced', card: action.card, enhancement: shop.shrine.enhancement });
      break;
    }
    case 'heal': {
      const shop = run.shop;
      if (run.phase !== 'shop' || !shop || shop.healUsed) throw new Error('The onsen is closed');
      spend(run, healPrice(shopCtx(run)));
      const amount = Math.min(
        run.maxHp - run.hp,
        Math.round(run.maxHp * BALANCE.shop.healFraction * omenEffects(run.omen).healMult),
      );
      run.hp += amount;
      shop.healUsed = true;
      events.push({ t: 'heal', amount });
      break;
    }
    case 'reroll': {
      const shop = run.shop;
      if (run.phase !== 'shop' || !shop) throw new Error('Not in the shop');
      spend(run, rerollPrice(shop.rerolls, shopCtx(run)));
      shop.rerolls += 1;
      shop.offers = rollOffers(shopCtx(run), shop.rerolls);
      break;
    }
    case 'sell': {
      const inst = run.omamori[action.slot];
      if (!inst || run.phase !== 'shop') throw new Error('Nothing to sell');
      run.omamori.splice(action.slot, 1);
      run.mon += sellPrice(inst.id);
      break;
    }
    case 'moveOmamori': {
      const [moved] = run.omamori.splice(action.from, 1);
      if (!moved) throw new Error('No charm there');
      run.omamori.splice(Math.max(0, Math.min(run.omamori.length, action.to)), 0, moved);
      break;
    }
    case 'leaveShop': {
      if (run.phase !== 'shop') throw new Error('Not in the shop');
      run.shop = null;
      startFight(run, events);
      break;
    }
  }
  return { state: run, events };
}

export function season(run: RunState) {
  return seasonOf(run.month, run.land);
}
