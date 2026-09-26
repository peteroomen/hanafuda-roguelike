/**
 * Balance probe: how fights actually go under a set of tweaks. For each variant: win rate,
 * koi-koi calls, how often a fight is won by the first stop, how much of the spirit's HP the
 * first stop deals, and how fast the charm slots fill.
 *
 *   pnpm tsx --tsconfig tsconfig.sim.json scripts/balance-probe.ts <group> [runs]
 *
 * Groups: base, charms, hp, shape, trade, package, economy. Tweaks mutate BALANCE for one variant and are undone after.
 */
import { BALANCE, type Balance } from '@/content/balance';
import { OMAMORI, OMAMORI_IDS, type OmamoriId } from '@/content/omamori';
import type { BotConfig } from '@/sim/bots';
import { playRun } from '@/sim/driver';

const group = process.argv[2] ?? 'base';
const runs = Number(process.argv[3] ?? 300);

type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };
const B = BALANCE as Mutable<Balance>;

interface Variant {
  name: string;
  bot?: BotConfig;
  lockedCharms?: readonly OmamoriId[];
  startCharms?: readonly OmamoriId[];
  tweak?: () => void;
}

/** Thousand Cranes' chips per hand won, adjustable per variant. */
const cranesEffect = OMAMORI.find((d) => d.id === 'thousandCranes')?.effects[0] as {
  chips: { perUnit: number };
};
let cranesPer: number;

const smart: BotConfig = { kind: 'smart', archetype: 'auto' };
const casual: BotConfig = { kind: 'casual', archetype: 'auto' };
const scaleHp = (f: (month: number) => number) => () => {
  B.monthHp = B.monthHp.map((hp, i) => Math.round(hp * f(i + 1)));
};

const GROUPS: Record<string, Variant[]> = {
  base: [
    { name: 'baseline' },
    { name: 'no charms ever', lockedCharms: OMAMORI_IDS },
    { name: 'casual bot', bot: casual },
  ],
  charms: [
    { name: 'baseline' },
    { name: '+ Red Seal from start', startCharms: ['redSeal'] },
    { name: '+ Picnic Box from start', startCharms: ['picnicBox'] },
    { name: '+ Thousand Cranes from start', startCharms: ['thousandCranes'] },
    { name: '+ Stone Lantern from start', startCharms: ['stoneLantern'] },
    { name: '+ all three', startCharms: ['redSeal', 'picnicBox', 'thousandCranes'] },
  ],
  hp: [
    { name: 'baseline' },
    { name: 'HP ×1.5', tweak: scaleHp(() => 1.5) },
    { name: 'HP ×2', tweak: scaleHp(() => 2) },
    { name: 'HP ×2.5', tweak: scaleHp(() => 2.5) },
    { name: 'HP ×1.5 early → ×3 late', tweak: scaleHp((m) => 1.5 + (1.5 * (m - 1)) / 11) },
    { name: 'HP ×2, casual bot', bot: casual, tweak: scaleHp(() => 2) },
    { name: 'HP ×2, no charms', lockedCharms: OMAMORI_IDS, tweak: scaleHp(() => 2) },
  ],
  shape: [
    { name: 'baseline' },
    {
      name: 'HP ×2, ferocity ×0.7',
      tweak: () => {
        scaleHp(() => 2)();
        B.monthFerocity = B.monthFerocity.map((x) => x * 0.7);
      },
    },
    {
      name: 'no early easing (monthEase all 1)',
      tweak: () => {
        B.monthEase = B.monthEase.map(() => 1);
      },
    },
    {
      name: 'Cranes +8/hand (from start)',
      startCharms: ['thousandCranes'],
      tweak: () => {
        cranesPer = 8;
      },
    },
  ],
  trade: [
    { name: 'baseline' },
    { name: 'baseline + all three', startCharms: ['redSeal', 'picnicBox', 'thousandCranes'] },
    ...(
      [
        [2, 0.7],
        [2.5, 0.6],
        [3, 0.55],
      ] as const
    ).flatMap(([hp, fer]) => [
      {
        name: `HP ×${hp}, ferocity ×${fer}`,
        tweak: () => {
          scaleHp(() => hp)();
          B.monthFerocity = B.monthFerocity.map((x) => x * fer);
        },
      },
      {
        name: `HP ×${hp}, ferocity ×${fer}, casual`,
        bot: casual,
        tweak: () => {
          scaleHp(() => hp)();
          B.monthFerocity = B.monthFerocity.map((x) => x * fer);
        },
      },
      {
        name: `HP ×${hp}, ferocity ×${fer}, + all three`,
        startCharms: ['redSeal', 'picnicBox', 'thousandCranes'] as OmamoriId[],
        tweak: () => {
          scaleHp(() => hp)();
          B.monthFerocity = B.monthFerocity.map((x) => x * fer);
        },
      },
    ]),
  ],
  package: (() => {
    const pkg = (fer: number) => () => {
      cranesPer = 8;
      B.monthEase = B.monthEase.map((x) => Math.max(x, 0.9));
      scaleHp(() => 2.5)();
      B.monthFerocity = B.monthFerocity.map((x) => x * fer);
      B.reward.swift = 0;
      B.reward.base = B.reward.base.map((x) => x - 1);
    };
    const trio: OmamoriId[] = ['redSeal', 'picnicBox', 'thousandCranes'];
    return [
      { name: 'baseline' },
      { name: 'baseline + all three', startCharms: trio },
      ...[0.6, 0.7, 0.8].flatMap((fer) => [
        { name: `package, ferocity ×${fer}`, tweak: pkg(fer) },
        { name: `package, ferocity ×${fer}, casual`, bot: casual, tweak: pkg(fer) },
        { name: `package, ferocity ×${fer}, + all three`, startCharms: trio, tweak: pkg(fer) },
      ]),
    ];
  })(),
  economy: [
    { name: 'baseline' },
    {
      name: '2 charm offers',
      tweak: () => {
        B.shop.charmOffers = 2;
      },
    },
    {
      name: 'no swift bonus, rewards −1',
      tweak: () => {
        B.reward.swift = 0;
        B.reward.base = B.reward.base.map((x) => x - 1);
      },
    },
    {
      name: 'rarity 70/25/5',
      tweak: () => {
        B.shop.rarityWeights = { common: 70, uncommon: 25, rare: 5 };
      },
    },
    {
      name: '2 offers + no swift + rewards −1',
      tweak: () => {
        B.shop.charmOffers = 2;
        B.reward.swift = 0;
        B.reward.base = B.reward.base.map((x) => x - 1);
      },
    },
  ],
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.floor(s.length / 2)] as number) : NaN;
};
const bands: [string, number, number][] = [
  ['2–4', 2, 4],
  ['5–8', 5, 8],
  ['9–12', 9, 12],
];

console.log(
  `| Variant | Win | Koi-koi/run | One-stop wins ${bands.map((b) => b[0]).join(' / ')} | 1st stop ÷ HP ${bands.map((b) => b[0]).join(' / ')} | Charms at shop 3 / 6 | Cranes at end |`,
);
console.log('| --- | --- | --- | --- | --- | --- | --- |');
const snapshot = JSON.stringify(BALANCE);
for (const v of GROUPS[group] ?? []) {
  Object.assign(B, JSON.parse(snapshot) as Balance);
  cranesPer = 15;
  v.tweak?.();
  cranesEffect.chips.perUnit = cranesPer;
  const ratio: number[][] = Array.from({ length: 13 }, () => []);
  const oneStop = new Array<number>(13).fill(0);
  const fightsWon = new Array<number>(13).fill(0);
  const charmsAtShop: number[][] = Array.from({ length: 13 }, () => []);
  const cranes: number[] = [];
  let wins = 0;
  let koikoi = 0;
  for (let i = 0; i < runs; i++) {
    let maxHp = 0;
    let stops = 0;
    let shops = 0;
    let lastPhase = '';
    const r = playRun({
      seed: 30_000 + i,
      bot: v.bot ?? smart,
      ...(v.lockedCharms ? { lockedCharms: v.lockedCharms } : {}),
      ...(v.startCharms ? { startCharms: v.startCharms } : {}),
      onEvents: (run, events) => {
        // Month 1's fight starts inside newRun, before any event: read its HP on the first step.
        if (!maxHp && run.fight) maxHp = run.fight.maxHp;
        for (const e of events) {
          if (e.t === 'fightStart') {
            maxHp = run.fight?.maxHp ?? 0;
            stops = 0;
          } else if (e.t === 'playerStop') {
            if (stops === 0 && maxHp) ratio[run.month]?.push(e.score.damage / maxHp);
            stops += 1;
          } else if (e.t === 'fightWon') {
            fightsWon[run.month] = (fightsWon[run.month] ?? 0) + 1;
            if (stops === 1) oneStop[run.month] = (oneStop[run.month] ?? 0) + 1;
          }
        }
        if (run.phase === 'shop' && lastPhase !== 'shop') {
          shops += 1;
          charmsAtShop[shops]?.push(run.omamori.length);
        }
        lastPhase = run.phase;
      },
    });
    if (r.won) wins += 1;
    koikoi += r.koikoiCalls;
    const c = r.finalState.omamori.find((m) => m.id === 'thousandCranes');
    if (c) cranes.push(c.counter * cranesPer);
  }
  const band = (from: number, to: number, f: (m: number) => number[]) =>
    med(Array.from({ length: to - from + 1 }, (_, k) => f(from + k)).flat());
  const oneStopBand = (from: number, to: number) => {
    let w = 0;
    let o = 0;
    for (let m = from; m <= to; m++) {
      w += fightsWon[m] ?? 0;
      o += oneStop[m] ?? 0;
    }
    return w ? o / w : 0;
  };
  console.log(
    `| ${v.name} | ${pct(wins / runs)} | ${(koikoi / runs).toFixed(1)} | ${bands.map((b) => pct(oneStopBand(b[1], b[2]))).join(' / ')} | ${bands.map((b) => band(b[1], b[2], (m) => ratio[m] ?? []).toFixed(1)).join(' / ')} | ${med(charmsAtShop[3] ?? [])} / ${med(charmsAtShop[6] ?? [])} | ${cranes.length ? `+${med(cranes)} chips` : '–'} |`,
  );
}
Object.assign(B, JSON.parse(snapshot) as Balance);
