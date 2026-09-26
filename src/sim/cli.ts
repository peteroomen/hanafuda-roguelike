/**
 * Balance simulator CLI.
 *
 *   pnpm sim --runs 500 --bot smart --archetype auto --omen 0
 *   pnpm sim --suite            (the full balance report, written to docs/balance/)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import type { Land } from '@/content/cards';
import type { DeckId } from '@/content/decks';
import type { Archetype } from '@/content/omamori';
import type { BotConfig } from './bots';
import { playRun, type RunSummary } from './driver';
import { summarise, formatSummary } from './report';
import { runSuite } from './suite';

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : 'true';
}

if (process.argv.includes('--help')) {
  console.log(`pnpm sim [--runs N] [--seed S] [--bot random|greedy|smart|casual] [--archetype auto|brights|...]
          [--omen 0-5] [--deck pine|plum|...] [--land nippon|aotearoa] [--guided] [--json out.json]
pnpm sim --suite [--runs N]   writes docs/balance/report.md`);
  process.exit(0);
}

if (process.argv.includes('--suite')) {
  const runs = Number(arg('runs', '400'));
  const md = runSuite(runs);
  mkdirSync('docs/balance', { recursive: true });
  writeFileSync('docs/balance/report.md', md);
  console.log(md);
} else {
  const runs = Number(arg('runs', '200'));
  const seed = Number(arg('seed', '1'));
  const bot: BotConfig = {
    kind: (arg('bot', 'smart') as BotConfig['kind']) ?? 'smart',
    archetype: (arg('archetype', 'auto') as Archetype | 'auto') ?? 'auto',
  };
  const started = process.hrtime.bigint();
  const results: RunSummary[] = [];
  for (let i = 0; i < runs; i++) {
    results.push(
      playRun({
        seed: seed + i,
        bot,
        deckId: (arg('deck', 'pine') as DeckId) ?? 'pine',
        land: (arg('land', 'nippon') as Land) ?? 'nippon',
        omen: Number(arg('omen', '0')),
        guided: process.argv.includes('--guided'),
      }),
    );
  }
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  const s = summarise(results);
  console.log(formatSummary(s));
  console.log(`\n${runs} runs in ${(ms / 1000).toFixed(1)}s`);
  const out = arg('json');
  if (out) writeFileSync(out, JSON.stringify(s, null, 2));
}
