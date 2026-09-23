# Twelve Petals: Claude Code Instructions

A mobile-first, Balatro-style roguelike built on the Japanese card game **Koi-Koi**. A run is one
year: twelve months, twelve fights against yokai spirits. Read this file before touching code.

## How to work here

1. **Plan before code.** Write the plan for a piece of work in `docs/work/YYYY-MM-DD-{slug}.md`
   (goal, approach, steps, manual test steps, out of scope). Get it confirmed unless the user has
   already said to proceed.
2. **One focused change at a time.** One milestone / feature per branch and PR.
3. **Finish every change with** `pnpm lint`, `pnpm typecheck` and `pnpm test`. If you changed
   balance data, rerun `pnpm sim` and update `docs/balance/`. If you touched the UI, run
   `pnpm e2e` (a real scripted playthrough in headless Chromium at phone size) and look at the
   screenshots it writes to `test-results/`.
4. **Verify by actually playing.** A green typecheck is not a test. The previous prototype shipped
   a broken build because a find-and-replace silently didn't apply.
5. Use the `@/*` path alias (`@/engine/...`, `@/content/...`).
6. Keep the **Current state** section below up to date at the end of a session.

## Architecture

```
src/
  engine/   Pure TypeScript rules engine. No DOM, no React, no Date, no Math.random.
            hand.ts (one hand of Koi-Koi) · yaku.ts · scoring.ts · ai.ts (spirit + bot AI)
            fight.ts / run.ts (run reducer) · shop.ts · rng.ts (seeded, serialisable)
  content/  Data only: cards, yaku, rules, omamori, ofuda, enhancements, spirits, bosses,
            decks, difficulty. Every balance number lives here.
  sim/      Headless balance simulator (pnpm sim). Plays thousands of runs with scripted bots.
  ui/       React rendering and input only. Reads engine state, dispatches engine actions.
```

- The engine is enforced pure: `tsconfig.engine.json` has no DOM lib, and ESLint bans UI/React
  imports, `window`/`document`, `Math.random`, `Date.now` and `new Date()` under `src/engine`,
  `src/content` and `src/sim`.
- All game state is plain JSON (including the RNG state), so saves, replays and sims are exact.
- Engine reducers never mutate their input; they clone, apply and return `{ state, events }`.
  The UI animates the `events` and then shows the new state.

## Conventions

- TypeScript strict, `noUncheckedIndexedAccess`. No `any`.
- Content is data: new omamori, spirits, bosses etc. go in `src/content/*` with their numbers,
  never hard-coded in engine logic.
- Mobile first: portrait, one thumb, 44px minimum touch targets, and everything important
  visible at 360×640 without scrolling. Check at 390×844 and 360×640.
- All art is original SVG drawn in code (`src/ui/art/`). Do not copy modern printed decks.
- No `console.log` in committed code (`console.warn`/`console.error` for real problems; the
  simulator CLI may print).
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

## Commands

| Command          | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server                                               |
| `pnpm build`     | Typecheck and production build (static, PWA) into `dist/`     |
| `pnpm test`      | Vitest unit tests (engine, content, scoring, AI, run reducer) |
| `pnpm lint`      | ESLint, including the engine purity rules                     |
| `pnpm typecheck` | `tsc -b` across engine, sim, app and node configs             |
| `pnpm sim`       | Balance simulator; see `pnpm sim --help`                      |
| `pnpm e2e`       | Playwright: scripted full playthroughs at phone viewport      |

Node 22. In the Claude Code remote container Chromium is pre-installed at `/opt/pw-browsers`
(Playwright 1.56.1 is pinned to match it). Don't run `playwright install`.

## Current state

- See `docs/work/` for session logs and `docs/balance/` for the latest simulation report.
