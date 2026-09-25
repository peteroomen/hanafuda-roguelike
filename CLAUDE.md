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
- Art: the drawn card style is original SVG in `src/ui/art/`. The traditional card faces are
  CC BY-SA 4.0 from Wikimedia Commons: keep the Settings → Credits text and
  `public/cards/traditional/LICENSE.md` if they change. Spirit portraits are generated
  paintings (`art-source/yokai/`). Do not copy modern printed decks.
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

- **v1.0 complete (2026-09-23)** on branch `claude/hanafuda-roguelike-handoff-o39d8a`. The whole
  game is built: guided first year, 12 months with 12 spirits and 8 bosses, the shop with charms,
  talismans, enhancements and poems, 7 decks, 6 omens, a collection screen, settings, audio, haptics
  and PWA. See `docs/work/2026-09-23-full-game-build.md`.
- Balance: the smart bot wins about 44% at Clear Sky and the casual bot (a learning player)
  about 35%; omens step the smart bot down to 7% (`docs/balance/report.md`). Spirit hits are
  about 10–15% of your HP early and 25–30% by December. Rerun `pnpm sim --suite` after any change
  to `src/content/` (about 6 minutes at 400 runs).
- E2E: build first (`pnpm build`), run `npx vite preview --port 5299`, then
  `PW_BASE_URL=http://localhost:5299 pnpm e2e`. `e2e/playthrough.spec.ts` plays a whole year
  through the UI in about 1 minute. `e2e/tour.spec.ts` screenshots every overlay at normal speed
  (slow).
- **Follow-ups after first play (2026-09-24):**
  - The default animation speed is half as fast; the old pace is now "Fast".
  - Guided month 2 teaches Ribbons, Animals and Chaff together (it used to be Ribbons only,
    which averaged 4.1 hands).
  - Your captured cards are larger and spaced so each card's face shows (`capLayout` in
    `layout.ts`).
  - Shop details dismiss on a second tap or a tap outside, and the shop shows owned talismans.
  - The pixel-art restyle was scoped and declined (`docs/work/2026-09-24-pixel-art-restyle.md`).
- **Early-year easing (2026-09-25):** spirits have 75% HP and ferocity in months 1–4, easing
  back to full strength by month 7 (`monthEase`). They also slip, playing their second-best move
  30% of the time early and 5% late (`spiritSlip`, seeded so replays match). The smart bot now
  wins 53% at Clear Sky; omens step down to 14%.
- **Play-test feedback (2026-09-25):** triaged into seven PRs in
  `docs/work/2026-09-25-feedback-triage.md`, with the user's answers. Done: table fixes and drag
  to play (PRs A and B, shipped together):
  - Hand cards act on release, so they can be tapped (lift, then play) or dragged onto a match
    or the field. `e2e/drag.spec.ts` covers it. `tapCard` in `e2e/autoplay.ts` sends a press and
    a release.
  - The field is always 2 rows. Past 8 cards it adds overlapping columns (`fieldSlotCell`).
  - Both captured lanes use the same card size (`capLayout`). The hand is shown sorted
    (`sortHand`; engine order is unchanged). Only the bottom pile card casts a shadow.
  - A played card moves straight to its slot, match or choice spot (`animatePlay` in
    `useGame.ts`). A re-deal gathers every card into the pile, then deals two at a time.
  - Training wheels has three levels: `off`, `dots` (just the playable dot) and `full` (dot plus
    month labels). Old boolean saves are migrated by `migrateSettings` in `store.ts`.
  - Shop (PR C): labelled shelves of one tile style (`Tile` and `Shelf` in `ShopView.tsx`).
    Every tile, services included, opens one details sheet whose button (`btn-buy`) buys.
  - Language (PR D): a yaku's `name` is its Japanese name in English letters (Sankō, Tan); the
    English meaning is `gloss`, shown only as a subtitle. Card types stay English. "Chips" and
    "Mult" are capitalised. `src/ui/game/language.test.ts` enforces the yaku rule.
  - Sound pauses while the tab is hidden (`onVisibilityChange` in `audio.ts`, covered by
    `e2e/audio.spec.ts`).
  - Style (PR E): the woodblock look. Flat fills, a 2px ink edge and a hard printed shadow
    (`--line`, `--edge`, `--print`, `--sumi` in `global.css`); no blurred shadows or glows.
    Gradients only for the bokashi skies (`--season-sky`) and card effects. Stop/koi-koi is a
    compact bottom panel with a hold-to-peek button. Spirits speak in mood-shaped speech
    bubbles (`Fukidashi.tsx`, lines in `src/content/voices.ts`, `say()` in `useGame.ts`).
  - Balance (PR F): spirits have 28% less HP than v1.0 and hit about twice as hard early (1.15×
    by December); heals are 15% after a fight and 55% after a boss. The intro centres the
    portrait, with the speech bubble up and to the right.
  - UI sounds are paper, wood and water (`woodTock`, `paperRustle`, `paperSlide`, `waterDrop`,
    a bronze-and-wood `coinSound` in `audio.ts`). Every button knocks via one listener in
    `App.tsx` (`data-quiet` opts out); sheets rustle via `usePaperOnOpen`. `e2e/sound.spec.ts`
    measures the output. The peek no longer triggers text selection.
  - Queued in the triage doc: HP visible while deciding stop or koi-koi (for the design pass).
  - The build type-checks `e2e/` too: a broken scratch spec fails `pnpm build`, so don't hide
    its output when building for e2e.
  - Next up: PR G (decks, charm unlocks, record book): plan in
    `docs/work/2026-09-25-decks-and-unlocks.md`, awaiting confirmation. The Firework Deck
    (×2 yaku Mult, +50% spirit HP, deck modifiers `yakuMult` and `spiritHp`) is prototyped.
  - What comes after (the design pass, including HP visible while deciding, and the mechanics
    to model) lives in `docs/roadmap.md`.
- Deploy: static Vite build on Vercel (`vercel.json`), production branch `main`.
