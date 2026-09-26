/**
 * Plays whole runs headlessly with a bot and records what happened.
 */
import type { DeckId } from '@/content/decks';
import type { OmamoriId } from '@/content/omamori';
import type { SpiritId } from '@/content/spirits';
import type { YakuId } from '@/content/yaku';
import type { Land } from '@/content/cards';
import { newRun, type RunEvent, type RunState, runStep } from '@/engine/run';
import { type BotConfig, makeBot } from './bots';

export interface FightLog {
  readonly month: number;
  readonly spirit: SpiritId;
  readonly boss: boolean;
  readonly hands: number;
  readonly won: boolean;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly damageTaken: number;
}

export interface RunSummary {
  readonly seed: number;
  readonly won: boolean;
  readonly monthReached: number;
  readonly fights: FightLog[];
  readonly omamori: OmamoriId[];
  readonly charmsEverOwned: OmamoriId[];
  readonly playerStops: {
    damage: number;
    points: number;
    koikoi: number;
    yaku: YakuId[];
    month: number;
  }[];
  readonly spiritStops: { damage: number; points: number; punished: boolean; month: number }[];
  readonly exhausted: number;
  readonly koikoiCalls: number;
  readonly koikoiWins: number;
  readonly finalState: RunState;
  readonly steps: number;
}

export interface RunOptions {
  readonly seed: number;
  readonly deckId?: DeckId;
  readonly land?: Land;
  readonly omen?: number;
  readonly guided?: boolean;
  readonly bot: BotConfig;
  readonly onEvents?: (run: RunState, events: readonly RunEvent[]) => void;
}

export function playRun(opts: RunOptions): RunSummary {
  let { state } = newRun({
    seed: opts.seed,
    deckId: opts.deckId ?? 'pine',
    land: opts.land ?? 'nippon',
    omen: opts.omen ?? 0,
    guided: opts.guided ?? false,
  });
  const bot = makeBot(opts.bot, opts.seed * 7919 + 13);
  const fights: FightLog[] = [];
  const playerStops: RunSummary['playerStops'] = [];
  const spiritStops: RunSummary['spiritStops'] = [];
  const charmsEver = new Set<OmamoriId>(state.omamori.map((m) => m.id));
  let exhausted = 0;
  let hpBefore = state.hp;
  let steps = 0;
  while (state.phase !== 'victory' && state.phase !== 'defeat') {
    if (++steps > 20000) throw new Error(`run ${opts.seed} did not finish`);
    const action = bot.next(state);
    const month = state.month;
    const fight = state.fight;
    const res = runStep(state, action);
    opts.onEvents?.(res.state, res.events);
    for (const e of res.events) {
      if (e.t === 'playerStop') {
        const h = res.state.fight?.hand;
        playerStops.push({
          damage: e.score.damage,
          points: e.score.basePoints,
          koikoi: h?.koikoiCalls[0] ?? 0,
          yaku: (h?.result?.kind === 'stop' ? h.result.hits.map((x) => x.id) : []) as YakuId[],
          month,
        });
      } else if (e.t === 'spiritStop') {
        spiritStops.push({
          damage: e.hit.damage,
          points: e.hit.points,
          punished: e.hit.punished > 1,
          month,
        });
      } else if (e.t === 'hand' && e.e.t === 'exhausted') {
        exhausted += 1;
      } else if (e.t === 'fightWon' || e.t === 'defeat') {
        const f = res.state.fight ?? fight;
        fights.push({
          month,
          spirit: (f?.spiritId ?? 'kodama') as SpiritId,
          boss: Boolean(f?.boss),
          hands: f?.handNo ?? 0,
          won: e.t === 'fightWon',
          hpBefore,
          hpAfter: res.state.hp,
          damageTaken: hpBefore - res.state.hp,
        });
      } else if (e.t === 'fightStart') {
        hpBefore = res.state.hp;
      }
    }
    for (const m of res.state.omamori) charmsEver.add(m.id);
    state = res.state;
  }
  return {
    seed: opts.seed,
    won: state.phase === 'victory',
    monthReached: state.month,
    fights,
    omamori: state.omamori.map((m) => m.id),
    charmsEverOwned: [...charmsEver],
    playerStops,
    spiritStops,
    exhausted,
    koikoiCalls: state.stats.koikoiCalls,
    koikoiWins: state.stats.koikoiWins,
    finalState: state,
    steps,
  };
}
