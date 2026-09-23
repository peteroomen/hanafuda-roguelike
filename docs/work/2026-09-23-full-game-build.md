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

- [ ] Scaffold, CLAUDE.md, purity enforcement
- [ ] M0 engine: deck, deal, turns, yaku, scoring, tests
- [ ] AI (intent, greedy capture, stop thresholds), fight, run, shop, all content
- [ ] Simulator + tuning + balance report
- [ ] Art: 48 cards, card back, yokai portraits, icons
- [ ] UI: table, hand, animations, scoring sequence, decisions, shop, menus, settings, tutorial
- [ ] Audio, haptics, PWA, persistence
- [ ] E2E playthroughs + screenshot review; fix everything found
- [ ] Docs, final checks, push

## Manual test steps

- [ ] `pnpm dev`, open at 390×844 in device mode. New Year → month 1 teaches matching only; the
      Rain Man explains; capture cards and win.
- [ ] Month 2: the Ribbons tracker fills; forming Tan ends the hand with a damage animation.
- [ ] Month 3: first Stop / Koi-koi decision; koi-koi, then watch the spirit's intent; stop and see
      the stake ×mult in the scoring sequence.
- [ ] Shop: buy a charm, a poem and an enhancement; sell a charm; reroll; heal.
- [ ] Use each talisman (Peek, Swap, Downpour, Frog, Fox Mask, Warm Sake, Wind Charm, Taiko, Gold
      Leaf) at least once.
- [ ] Reload mid-fight: the run resumes exactly where it was.
- [ ] Edge: lose all HP → defeat screen with run summary; start a new year.
- [ ] Edge: 360×640: nothing important is off screen; hand cards are ≥44px wide.
- [ ] Edge: toggle training wheels off → month labels disappear from cards.

## Out of scope

Native app store builds, accounts, cloud saves, online leaderboards, localisation beyond English
(with Japanese names as flavour).

---

## What actually happened

(filled in at the end of the session)

## Files created / modified

## Deferred to next session

## Status

- [x] In progress
