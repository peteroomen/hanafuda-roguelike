/**
 * Aggregate statistics over simulated runs.
 */
import { OMAMORI_IDS, type OmamoriId } from '@/content/omamori';
import type { YakuId } from '@/content/yaku';
import type { RunSummary } from './driver';

export interface MonthStats {
  readonly month: number;
  readonly fights: number;
  readonly winRate: number;
  readonly avgHands: number;
  readonly avgDamageTaken: number;
  readonly deaths: number;
  readonly playerDamage: {
    readonly p25: number;
    readonly p50: number;
    readonly p75: number;
    readonly p90: number;
  };
  readonly spiritHitAvg: number;
  readonly hpAtStart: number;
}

export interface Summary {
  readonly runs: number;
  readonly winRate: number;
  readonly avgMonthReached: number;
  readonly months: readonly MonthStats[];
  readonly exhaustedPerHand: number;
  readonly koikoiPerRun: number;
  readonly koikoiWinShare: number;
  readonly yakuShare: Readonly<Partial<Record<YakuId, number>>>;
  readonly charmWinRate: Readonly<
    Partial<Record<OmamoriId, { readonly runs: number; readonly winRate: number }>>
  >;
  readonly avgStepsPerRun: number;
}

function pct(sorted: readonly number[], p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[i] as number;
}

export function summarise(results: readonly RunSummary[]): Summary {
  const months: MonthStats[] = [];
  for (let m = 1; m <= 12; m++) {
    const fights = results.flatMap((r) => r.fights.filter((f) => f.month === m));
    const dmg = results
      .flatMap((r) => r.playerStops.filter((s) => s.month === m).map((s) => s.damage))
      .sort((a, b) => a - b);
    const hits = results.flatMap((r) =>
      r.spiritStops.filter((s) => s.month === m).map((s) => s.damage),
    );
    months.push({
      month: m,
      fights: fights.length,
      winRate: fights.length ? fights.filter((f) => f.won).length / fights.length : 0,
      avgHands: fights.length ? fights.reduce((a, f) => a + f.hands, 0) / fights.length : 0,
      avgDamageTaken: fights.length
        ? fights.reduce((a, f) => a + f.damageTaken, 0) / fights.length
        : 0,
      deaths: fights.filter((f) => !f.won).length,
      playerDamage: {
        p25: pct(dmg, 0.25),
        p50: pct(dmg, 0.5),
        p75: pct(dmg, 0.75),
        p90: pct(dmg, 0.9),
      },
      spiritHitAvg: hits.length ? hits.reduce((a, b) => a + b, 0) / hits.length : 0,
      hpAtStart: fights.length ? fights.reduce((a, f) => a + f.hpBefore, 0) / fights.length : 0,
    });
  }
  const totalHands = results.reduce(
    (a, r) => a + r.playerStops.length + r.spiritStops.length + r.exhausted,
    0,
  );
  const yakuCount: Partial<Record<YakuId, number>> = {};
  let stops = 0;
  for (const r of results) {
    for (const s of r.playerStops) {
      stops += 1;
      for (const y of s.yaku) yakuCount[y] = (yakuCount[y] ?? 0) + 1;
    }
  }
  const yakuShare: Partial<Record<YakuId, number>> = {};
  for (const [k, v] of Object.entries(yakuCount)) yakuShare[k as YakuId] = v / Math.max(1, stops);
  const charmWinRate: Partial<Record<OmamoriId, { runs: number; winRate: number }>> = {};
  for (const id of OMAMORI_IDS) {
    const withIt = results.filter((r) => r.charmsEverOwned.includes(id));
    if (withIt.length)
      charmWinRate[id] = {
        runs: withIt.length,
        winRate: withIt.filter((r) => r.won).length / withIt.length,
      };
  }
  return {
    runs: results.length,
    winRate: results.filter((r) => r.won).length / Math.max(1, results.length),
    avgMonthReached: results.reduce((a, r) => a + r.monthReached, 0) / Math.max(1, results.length),
    months,
    exhaustedPerHand: results.reduce((a, r) => a + r.exhausted, 0) / Math.max(1, totalHands),
    koikoiPerRun: results.reduce((a, r) => a + r.koikoiCalls, 0) / Math.max(1, results.length),
    koikoiWinShare:
      results.reduce((a, r) => a + r.koikoiWins, 0) /
      Math.max(
        1,
        results.reduce((a, r) => a + r.koikoiCalls, 0),
      ),
    yakuShare,
    charmWinRate,
    avgStepsPerRun: results.reduce((a, r) => a + r.steps, 0) / Math.max(1, results.length),
  };
}

const f1 = (x: number) => x.toFixed(1);
const p0 = (x: number) => `${Math.round(x * 100)}%`;

export function formatSummary(s: Summary): string {
  const lines: string[] = [];
  lines.push(`runs ${s.runs}  win ${p0(s.winRate)}  avg month reached ${f1(s.avgMonthReached)}`);
  lines.push(
    `exhausted hands ${p0(s.exhaustedPerHand)}  koi-koi/run ${f1(s.koikoiPerRun)}  stops after koi-koi / calls ${p0(s.koikoiWinShare)}`,
  );
  lines.push('');
  lines.push(
    'month fights  win   hands  dmgTaken  hpStart  deaths  player dmg p25/p50/p75/p90   spirit hit',
  );
  for (const m of s.months) {
    lines.push(
      [
        String(m.month).padStart(5),
        String(m.fights).padStart(7),
        p0(m.winRate).padStart(5),
        f1(m.avgHands).padStart(6),
        f1(m.avgDamageTaken).padStart(9),
        f1(m.hpAtStart).padStart(8),
        String(m.deaths).padStart(7),
        `${m.playerDamage.p25}/${m.playerDamage.p50}/${m.playerDamage.p75}/${m.playerDamage.p90}`.padStart(
          30,
        ),
        f1(m.spiritHitAvg).padStart(12),
      ].join(''),
    );
  }
  lines.push('');
  lines.push(
    'yaku share of stops: ' +
      Object.entries(s.yakuShare)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .map(([k, v]) => `${k} ${p0(v ?? 0)}`)
        .join(', '),
  );
  return lines.join('\n');
}
