# Twelve Petals: full game build (M0–M7)

**Date:** 2026-09-23
**Branch:** `claude/hanafuda-roguelike-handoff-o39d8a`
**Milestones:** M0–M7 from the handoff brief, built in one session at the user's request
("build the whole thing at once, and balance using modelling/simulating playing it yourself").

## Goal

A complete, polished, installable mobile web game: a twelve-month Koi-Koi roguelike with fights,
a shop, build layers, bosses, a tutorial built into the first three months, original art, sound
and haptics. It's balanced by simulation and verified by scripted headless playthroughs.

## Decisions (confirmed with the user)

| Question                     | Decision                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Title                        | **Twelve Petals**                                                                                                                              |
| Stack                        | Vite + React + TypeScript (strict), Vitest, Playwright, PWA via vite-plugin-pwa, static deploy (Vercel)                                        |
| Scoring variants             | 7+ points doubles; stopping after the opponent's koi-koi doubles; rain cancellations off; Tsukifuda live in runs (current month = fight month) |
| Sake cup as Chaff            | Yes (`sakeCupIsChaff`)                                                                                                                         |
| Exhausted hand               | No score for either side                                                                                                                       |
| Chip source                  | Cards in the scoring yaku only (engine can also do all captured; sim compares)                                                                 |
| Koi-koi stake                | Configurable; starts multiplicative ×2 per call, tuned by the simulator                                                                        |
| Initial field four-of-a-kind | Redeal. Instant wins from the starting hand (teshi / kuttsuki) are off                                                                         |
| Lead                         | The player leads the first hand of a fight; afterwards the previous hand's winner leads                                                        |
| "Improved" yaku              | Total yaku points higher than at your last decision                                                                                            |

The deck and yaku tables match the standard Koi-Koi deck in the brief. An online cross-check
against pagat.com / sloperama.com was attempted but the container's network policy blocks those
hosts, so the tables were verified against reference knowledge and locked down with unit tests.

## Approach

- **Engine first, headless and pure.** Hand state machine → yaku/scoring → spirit AI → fight →
  run reducer (months, shop, rewards). Everything deterministic from a seed and JSON-serialisable.
- **Combat model.** Player damage = chips × mult (Balatro-style, with a scoring trace for the
  animation). Spirit damage = the spirit's yaku points × its ferocity (a smaller, readable scale),
  doubled if you'd called koi-koi. Player HP persists across the year.
- **Content as data** with a small effect language for Omamori (charms), so the simulator can tune
  every number and descriptions stay truthful.
- **Simulator** with heuristic bots that commit to archetypes, measuring win rate, fight length,
  koi-koi expected value and archetype viability. The data gets tuned until targets are met.
- **UI**: one absolutely positioned card layer driven by engine events (FLIP-style animation),
  portrait layout designed for 360×640 upward, all art as original SVG, sounds synthesised with
  Web Audio (the slap, koto plucks, taiko, wooden clappers), haptics via the Vibration API.
- **Verification**: unit tests, simulation reports, and Playwright playing whole runs through the
  real UI at phone size, with screenshots reviewed.

## Steps

- [x] Scaffold, CLAUDE.md, purity enforcement
- [x] M0 engine: deck, deal, turns, yaku, scoring, tests
- [x] AI (intent, greedy capture, stop thresholds), fight, run, shop, all content
- [x] Simulator + tuning + balance report
- [x] Art: 48 cards, card back, yokai portraits, icons
- [x] UI: table, hand, animations, scoring sequence, decisions, shop, menus, settings, tutorial
- [x] Audio, haptics, PWA, persistence
- [x] E2E playthroughs + screenshot review; fix everything found
- [x] Docs, final checks, push

## Manual test steps

- [x] `pnpm dev`, open at 390×844 in device mode. New Year → month 1 teaches matching only; the
      Rain Man explains; capture cards and win.
- [x] Month 2: the Ribbons tracker fills; forming Tan ends the hand with a damage animation.
- [x] Month 3: first Stop / Koi-koi decision; koi-koi, then watch the spirit's intent; stop and see
      the stake ×mult in the scoring sequence.
- [x] Shop: buy a charm, a poem and an enhancement; sell a charm; reroll; heal.
- [x] Use each talisman (Peek, Swap, Downpour, Frog, Fox Mask, Warm Sake, Wind Charm, Taiko, Gold
      Leaf) at least once.
- [x] Reload mid-fight: the run resumes exactly where it was.
- [x] Edge: lose all HP → defeat screen with run summary; start a new year.
- [x] Edge: 360×640: nothing important is off screen; hand cards are ≥44px wide.
- [x] Edge: toggle training wheels off → month labels disappear from cards.

## Out of scope

Native app store builds, accounts, cloud saves, online leaderboards, localisation beyond English
(with Japanese names as flavour).

---

## What actually happened

- Built everything in the plan: engine, content, simulator, UI, art, audio, PWA and E2E.
- **Combat numbers were retuned by simulation.** The first pass had the smart bot winning 2% of
  years. The fixes, in order:
  - Spirit ferocity moved to a per-month curve.
  - A hand-by-hand ferocity growth stops stalling.
  - Bosses lost some HP and ferocity.
  - Player HP was raised from 60 to 80.
  - The late-year ferocity curve was flattened (months 8–12).

  Final numbers (400 runs each, `docs/balance/report.md`):
  - The smart bot wins 46% at Clear Sky; the always-stop bot wins 37%; the random bot wins 0%.
  - Omens step down 46 → 41 → 30 → 19 → 13 → 9%.
  - Archetypes range from 39% (greed) to 53%, and seasonal decks from 42% to 53%.
  - Fights last 2.5–3.1 hands, and the final boss (74% fight win) is the hardest fight of the
    year.

- **Greed (koi-koi) charms were buffed** (Carp Streamer ×1 per call, Gambler's Dice +10 Mult,
  Maneki-neko 3 mon, Sweeper ×2). The bot now leans into koi-koi when it holds greed charms.
- **The koi-koi decision is close by design.** Rollouts (`src/sim/koikoi.ts`) show koi-koi and stop
  have similar expected value in most spots: calling wins the fight outright about 50–60% of the
  time and gets punished about 40% of the time. The choice is a real gamble, not a solved one.
- **UI found and fixed by the scripted playthroughs:**
  - The spirit's hand collided with the buttons.
  - The bottom bar overflowed at 360px.
  - Labels were truncated, and the score sequence was missing yaku names.
  - The shop was too tall; it's now a compact Shrine Market with detail overlays.
  - The intro didn't show after the shop.
  - Guide dismissal raced with the automated clicks.
- E2E runs against `vite preview` (not the dev server) so HMR can't disrupt a playthrough.

## Files created / modified

Everything in the repo. Key entry points:

- `src/engine/run.ts` (run reducer)
- `src/engine/hand.ts` (Koi-Koi state machine)
- `src/engine/scoring.ts`
- `src/content/*` (all data, including `balance.ts`)
- `src/sim/*` (simulator and bots)
- `src/ui/game/useGame.ts` (animation director)
- `src/ui/game/FightView.tsx`
- `e2e/playthrough.spec.ts`

## Deferred to next session

- Human playtesting. The balance targets come from a strong bot. Real players may be weaker
  (lower win rates) or better at koi-koi reads (higher). Adjust `playerHp` and `monthFerocity` in
  `src/content/balance.ts` first.
- The greed archetype is the weakest (39%). If players avoid it, make Paper Umbrella cheaper or
  common.
- Music is ambience only (no composed tracks).
- No cloud saves, accounts or leaderboards (out of scope).

## Status

- [x] Complete
