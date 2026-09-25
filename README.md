# Twelve Petals

A mobile-first roguelike built on the Japanese flower-card game **Koi-Koi**, in the spirit of
Balatro.

One run is one year. Each month you sit down opposite a yokai spirit and play Koi-Koi for its
life: match cards by flower, capture them, and form _yaku_ (scoring sets). The moment you form a
yaku, you choose:

- **Stop:** strike the spirit now. Your damage is chips × mult.
- **Koi-koi:** keep playing to double your stake. If the spirit forms a yaku first, its hit is
  doubled instead.

Win and you visit the Shrine Market for charms (_omamori_), one-shot talismans (_ofuda_), card
enhancements and poems that level up your yaku. Survive twelve months and four bosses to see the
new year in.

## What's in it

- The full 48-card hanafuda deck (traditional faces, or the game's own drawn style) and all 14
  standard Koi-Koi yaku.
- 12 regular spirits and 8 bosses, each with its own persona, passive and rule-bending twist
  (Tengu steals a bright, Kitsune disguises cards, Yuki-onna freezes the field…).
- 39 omamori across 9 archetypes, 9 ofuda, 7 enhancements and a poem for every yaku.
- 7 seasonal starting decks and 6 omens (difficulty levels).
- A guided first year: months 1–3 teach matching, yaku and the stop/koi-koi call, with the Rain
  Man as your guide. Training wheels, a live yaku tracker and a yaku book.
- Synthesised sound (koto, taiko, clappers, seasonal ambience), haptics, and saves that resume
  exactly where you left off.
- An installable PWA that works offline.

## Balance

Balance was tuned by simulation, not guesswork. `pnpm sim --suite` plays thousands of full runs
with scripted players and writes [`docs/balance/report.md`](docs/balance/report.md). At the
default difficulty, a strong player wins about 45% of years. A player who never calls koi-koi
wins less often, and one who taps at random never wins. Every archetype and starting deck is
viable, and each omen makes the year clearly harder.

## Development

Node 22 and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # engine unit tests
pnpm sim --suite  # balance report
pnpm e2e          # scripted playthroughs in headless Chromium at phone size
pnpm build        # static build into dist/
```

The rules engine (`src/engine`) is pure TypeScript with seeded randomness and JSON state. All
content and balance numbers are data in `src/content`. See [`CLAUDE.md`](CLAUDE.md) for the
architecture.

## Deploying

The build is a static site. On Vercel, import the repo and keep the detected Vite preset (build
`pnpm build`, output `dist`). `vercel.json` stops the service worker and manifest from being
cached, so updates reach players.

## Credits

The traditional card faces are adapted from the traditional-colour hanafuda set on
[Wikimedia Commons](<https://commons.wikimedia.org/wiki/Category:SVG_Hanafuda_with_traditional_colors_(black_border)>),
a recolouring of the hanafuda SVGs by Louiemantia, under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). They are resized and
converted to WebP, and those files stay under the same licence (see
`public/cards/traditional/LICENSE.md`).
