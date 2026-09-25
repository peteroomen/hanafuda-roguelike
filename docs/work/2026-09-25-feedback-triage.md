# Play-test feedback: triage and fix plan

**Date:** 2026-09-25
**Source:** Google Doc "koi koi feedback" (19 items, written after a play session).
**Branch:** `claude/game-bugs-triage-plan-iewzo2` (this plan only; each workstream below gets its
own branch and PR, per CLAUDE.md).
**Status:** PRs A–D merged (#7, #8, #9), plus the audio fix (#10). PR E (style pass) is done. PR F (balance) is next.

## Goal

Fix every reported problem, grouped into focused PRs, and pin down the design-level items
(balance, new mechanics, style) before we build them.

## Triage

Each item is labelled with a type, its root cause in the code (where there is one) and a size.
S = under an hour, M = a few hours, L = a day or more.

| #   | Item                                             | Type    | Cause / where                                                                                                                                                                                                  | Size |
| --- | ------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | Captured-card lanes too short, not the same size | UI      | `layout.ts`: the spirit's lane uses `MINI = 0.36` and fixed per-group steps, and yours uses `capScale` 0.5/0.58.                                                                                               | M    |
| 2   | Drag from hand onto a match                      | Feature | `CardLayer.tsx` only has `onPointerDown` taps. There is no drag handling.                                                                                                                                      | M    |
| 3   | Remove "Capture cards to start a yaku" copy      | UI      | `Hud.tsx` `Tracker` empty state. Keep the tap target so it still opens the yaku book.                                                                                                                          | S    |
| 4   | Duplicate "next month" in the shop               | UI      | `ShopView.tsx`: the header says "Next: month N, flower · spirit" and the footer button says "To month N →".                                                                                                    | S    |
| 5   | Draw pile has a dark smudge                      | **Bug** | `game.css .card-flip` gives every card a `0 4px 6px rgba(0,0,0,.45)` shadow. About 24 pile cards sit within 5px of each other (depth is capped at 4), so the shadows stack into a black halo (see screenshot). | S    |
| 6   | Hand should be sorted                            | UI      | The engine's hand order is used as-is (`visualFromHand`, `applyEvent`). Nothing sorts it.                                                                                                                      | S    |
| 7   | Shop layout inconsistent, no sections            | UI      | Offers are `.offer` tiles (icon, name, price, stacked). Shrine, Onsen and New wares are `.service` rows with a different layout.                                                                               | M    |
| 8   | Fights drag on and HP is a sponge                | Balance | See **Balance** below.                                                                                                                                                                                         | M    |
| 9   | A high-score deck                                | Content | `decks.ts`. There are 7 decks and none is built for a huge single score.                                                                                                                                       | S–M  |
| 10  | Items that change how you play or target yaku    | Design  | Discussion only, as the doc asks. See **Mechanics to model**.                                                                                                                                                  | —    |
| 11  | Some charms locked behind achievements           | Feature | Decks and omens unlock through `meta.ts`. Charms have no unlock field.                                                                                                                                         | M    |
| 12  | Language is inconsistent                         | Copy    | Yaku use three names: English (`name`), romaji (`Tan`, `Kasu`) and kanji. Text mixes them, for example "Red **Poems**" next to "Blue **Ribbons**", and "Tan needs only 4 Ribbons" next to "Five Ribbons".      | M    |
| 13  | Stop / koi-koi screen covers your yaku           | UI      | `DecisionSheet` is a bottom sheet over a 65% black scrim. It hides your captured lane, the tracker and your hand.                                                                                              | M    |
| 14  | Fewer gradients: flat, woodblock UI              | Style   | 37 gradients across the CSS. Keep the fight backgrounds and make them more seasonal.                                                                                                                           | M    |
| 15  | UI feels inconsistent and not game-like          | Style   | Part 1 is covered by this plan's fixes. Part 2 is a dedicated design pass later.                                                                                                                               | L    |
| 16  | Hero font: Zen Loop                              | Style   | `--font-display` is Shippori Mincho, self-hosted in `public/fonts`. Zen Loop would also be self-hosted, so it works offline in the PWA.                                                                        | S    |
| 17  | Spirit quote in a fukidashi                      | Feature | `Intro.tsx` shows `taunt` as plain quoted text. Needs a mood per spirit plus bubble shapes.                                                                                                                    | M    |
| 18  | Played card zips to the middle first             | **Bug** | `visual.ts` `play` puts the card in the `held` zone at the field centre. Then `place`/`match` moves it again. Play-to-empty-slot also needs drag (see #2).                                                     | S    |
| 19  | Field goes to 3 rows                             | UI      | `makeStage`: `rows = max(2, ceil(n / 4))`. Fix it at 2 rows and widen/overlap columns instead.                                                                                                                 | S    |
| 20  | Re-deal zips cards to odd places                 | **Bug** | `useGame` `deal`: it snaps every card to the pile with the CSS transition still on and waits 60ms, then retargets. Cards from the last hand fly toward the pile and get redirected mid-flight.                 | S–M  |

## Plan: seven PRs, in order

### PR A: Table fixes (#1, #3, #5, #6, #18, #19, #20)

Most of the reported bugs are here, all in `layout.ts`, `visual.ts`, `useGame.ts` and CSS.

- **Pile shadow (#5).** Give only the bottom pile card the drop shadow. The rest keep just the 1px
  dark edge (a `pile-under` class), so the stack reads as a thick deck, not a smudge.
- **Sorted hand (#6).** Sort the player's hand in the visual layer by month (Jan → Dec), then
  Bright > Animal > Ribbon > Chaff within a month. The sort lives in the UI, so the engine and saves
  are unchanged. Drawn or swapped cards slide into their sorted spot.
- **Straight to the spot (#18).** When a play is followed by `place`, move the card straight from
  the hand to its free slot. When it's followed by `match`, move it straight onto the target card.
  Skip the `held` hop for both. Look ahead one event in `animate`. `held` stays for `choice` only,
  where it parks over the pile as it does now.
- **Smooth re-deal (#20).** Between hands: (1) sweep last hand's cards to the pile as one visible
  gather animation and wait for it to finish, (2) snap to the shuffled start with transitions off
  for a frame, (3) deal in the order hand ↔ field ↔ spirit, alternating like a real deal. The
  first deal of a fight skips step 1.
- **Two field rows (#19).** `rows = 2` always and `cols = max(4, ceil(n / 2))`. The column step
  shrinks to fit and cards overlap from the left, so the month pip and flower stay visible. Slot
  positions stay stable.
- **Captured lanes (#1).** Both lanes use the same card scale (about 0.56 at 640 tall and 0.62 at
  760+) and the same group layout (`playerCapLayout`, generalised). The spirit's lane stops short
  of its hand stack. The height comes from the field's spare room, which the fixed 2 rows free up.
  Check it at 360×640, where the budget is tightest.
- **Tracker copy (#3).** The empty tracker shows nothing, but the strip stays tappable and opens
  the yaku book. It gets a small 役 mark so it doesn't look dead.

Tests: unit tests for the hand sort, for `makeStage` (always 2 rows, no overlap with the lanes at
640 tall) and for the play → place visual path. Run the e2e playthrough and read the screenshots.

### PR B: Drag to play (#2, #18 part 2)

- Pointer handling moves up to `FightView`. Pointer down on a hand card starts a _maybe-drag_.
  Moving more than 8px turns it into a drag, and the card follows the finger at z 1000.
  Releasing:
  - on a matching field card: play it with that card as the intended target (the existing
    `intendedTarget` path);
  - on the field area with no match: play it to the field;
  - anywhere else: it springs back.
- Moving less than 8px is a tap, so the tap-twice flow is unchanged.
- While you drag, matching field cards glow as they do when a card is lifted.
- Drawn cards stay tap-only, as the doc says.
- The e2e tests keep using taps, plus one new drag test.

### PR C: Shop (#4, #7)

- Remove "Next: …" from the header. The footer button becomes "To month 8 · Susuki · Nopperabō →"
  (it wraps to two lines when narrow).
- One tile component for everything: icon on top, name, one line of text, price. Group into
  labelled sections: **Charms**, **Talismans**, **Poems** and **Services** (Shrine, Onsen, New
  wares). An empty section is hidden.
- Check at 360×640 that the whole shop fits without scrolling or with one short scroll. Today it
  already scrolls a little.

As built, after the mockup (https://claude.ai/artifact/ANGwK4jktvPwVhjwDC5hnh) was approved:

- HP and mon sit in the header. The status-pill row is gone, and slot counts are on the shelf
  labels.
- Shelves: Charms; Talismans and Poems sharing a row; Services; Yours.
- Every tile (offers and services alike) shows art, name, a short line and the price. Tapping a
  tile opens one shared details sheet with the action on its button. Onsen and New wares no
  longer spend mon on the first tap. The e2e bot taps the tile, then `btn-buy`.
- The footer button reads "Month N →" over "Season · Flower". The header's "Next: …" line is gone.
- Fits at 360×640 and 390×844 with no scrolling.

### PR D: Language pass (#12)

Proposed convention (see question 3):

- **Yaku** always use their romaji name: _Sankō, Shikō, Gokō, Ame-Shikō, Tsukimi-zake,
  Hanami-zake, Ino-Shika-Chō, Akatan, Aotan, Akatan-Aotan, Tane, Tan, Kasu, Tsukifuda_.
  The English gloss appears once, as a subtitle in the yaku book and the Poem detail.
- **Card types** are always English: _Brights, Animals, Ribbons, Chaff_.
- **Game terms** keep their Japanese names where the game uses them as names (_koi-koi, mon,
  omamori/charm_…). Proposal: English "charm" and "talisman" everywhere, since that's what the UI
  already mostly says.
- **Kanji** are decoration only (seals, icons, big display marks) and never the only label.
- Add a `yakuName(id)` helper and replace every hard-coded yaku mention in `src/content` text.
  Add a unit test that fails if content text mentions an English yaku name.

As built:

- `YakuDef.name` is now the Japanese name in English letters, and the English moved to `gloss`
  (shown under the name in the yaku book and the shop's poem details). The `romaji` and `short`
  fields and `yakuShort()` are gone. Every screen that shows a yaku name reads `name`.
- The charm, intro and tip texts that used English yaku names now use the Japanese ones (for
  example "Tan (5 Ribbons), Tane (5 Animals) or Kasu (10 Chaff)").
- `src/ui/game/language.test.ts` fails if any charm, talisman, enhancement, spirit, deck, omen,
  yaku requirement or tip uses a multi-word English yaku name.
- Also made consistent: "Chips" and "Mult" are capitalised everywhere, the koi-koi banner reads
  "Koi-koi!" like the button, and month 12's short label is "Paulownia" (was "Kiri", while the
  deck is the Paulownia Deck).
- Kanji stay decorative. One exception is left alone: a card's enhancement badge is only a kanji
  (金, 破…). It has a tooltip, and the style pass can decide whether it needs more.

### PR E: Light style pass (#13, #14, #16, #17, and part 1 of #15)

- **Stop / koi-koi (#13).** Replace the bottom sheet with a compact panel that sits over the
  hand and bottom bar. The field, both captured lanes and the tracker stay visible, and there's no
  full-screen scrim. A "peek" button (press and hold) hides the panel so you can see your hand.
  Options are in question 4.
- **Flat UI (#14).** Swap the UI gradients (buttons, pills, sheets, HP bars, shop tiles) for flat
  fills, 2px ink outlines and hard offset shadows, like a printed woodblock. Keep the fight
  backgrounds and make them seasonal:
  - Spring: pale plum wash, drifting petals.
  - Summer: deep indigo night, fireflies.
  - Autumn: persimmon dusk, falling maple leaves.
  - Winter: slate blue, snow, and a still pale moon.
    Each is a 2–3 stop gradient plus the particle style that already exists.
- **Hero font (#16).** Self-host Zen Loop for `--font-display` titles and names. See question 5
  about numbers and kanji.
- **Fukidashi (#17).** Add a `mood` to each spirit: `menace`, `sly`, `calm`, `cold`, `wild` or
  `sorrow`. Each mood draws its own SVG speech bubble: spiky burst, wavy, round, icicle-edged,
  jagged, or wobbly with drip. The intro shows the taunt in that bubble next to the portrait.
- **Consistency (#15 part 1).** Use one button style, one panel style and one pill style, and
  remove anything they make redundant. The big design pass is a separate plan later.

As built, after the style board (https://claude.ai/artifact/DBpo59ARbihxRnWc8iAzEX) and the
user's answers (keep Shippori Mincho as the hero font; spirits speak mid-fight; peek is
hold-to-see):

- **Woodblock tokens** in `global.css`: `--line` (ink), `--edge` (2px ink border), `--print`
  (a hard 3px shadow straight down), `--sumi` and `--sumi-2` (flat dark surfaces). Buttons, icon
  buttons, paper panels, pills, HP bars, slots, lanes, the table, banners, hints, the Rain Man's
  bubble, score and strike panels, shop tiles, deck and omen pickers, tabs and toggles all use
  them. There are no soft glows or blurred shadows left in the UI. Card highlights (matches,
  choices) are a thick gold frame with an ink edge.
- **Gradients left on purpose:** the bokashi skies (`--season-sky` over the season's night on
  every screen and the intro), the table's wood grain, card effects (lacquer sheen, frost, the
  red flash when you're hurt) and a few icons drawn with hard colour stops.
- **Seasons:** spring plum sky with petals, summer indigo with fireflies, autumn persimmon with
  maple leaves (a clip-path leaf), winter slate with snow and a pale moon.
- **Stop / koi-koi** (`DecisionSheet`): no scrim. A compact panel over the hand and bottom bar:
  "N points. Stop, or koi-koi?" and a **Hold: hand** button on top, then two big buttons that
  carry their own numbers (Stop: damage and what it leaves; Koi-koi!: the stake, cards left and
  the risk). The yaku are on the tracker just above, so the panel doesn't repeat them. Holding
  the button slides the panel down, leaving its top row; letting go brings it back.
  `e2e/peek.spec.ts` covers it.
- **Fukidashi** (`Fukidashi.tsx`): six bubble shapes by mood. The intro shows the spirit's
  opening line beside its portrait. In a fight, lines appear under the portrait for 2.8 s.
- **Spirit voices** (`src/content/voices.ts`): a mood and lines per spirit for when it hits you,
  when you hurt it, when it or you call koi-koi, when it's calmed, when you take more than 12 s
  over your turn (impatient and eerie spirits only), and when a boss rule fires (once per hand).
  Oni and Kamaitachi never call koi-koi, so they have no line for it. The Nopperabō says only
  "…" until it's calmed. `voices.test.ts` checks every spirit has the lines a fight needs, and
  that every line fits a bubble.
- The intent pill drops the word "Chasing" (the red eye already means it) so long yaku names fit.

Follow-ups reported during PR E, fixed in the same PR:

- **Matched cards still zipped to the deck sometimes.** Two causes. (1) Aiming at one of two
  matches (tapping or dropping onto it) played the card, let the engine ask "which one?", parked
  the card over the draw pile, then answered for you. Now `play` takes an optional `target`, and
  the engine takes that match at once, so the card flies straight to it. (2) A card waiting on a
  real choice (dropped on the field with two matches, or the spirit choosing) parked over the
  draw pile. It now waits near where it came from: just above your hand, or beside the spirit's
  hand. A drawn card still waits by the pile.
- **Tooltips for the Japanese yaku names.** Tap a yaku on your tracker or on the spirit's intent
  to see its English meaning, what it needs and its points. Another tap, a tap elsewhere, or
  5 seconds closes it. The empty tracker's 役 mark and the top bar's 役 button still open the
  yaku book.

### PR F: Balance (#8)

The play report was 7 hands to beat the Tengu (a boss), finishing on 6 HP. That's a war of
attrition: spirits hit softly, you outlast them on a big HP pool, and then the next fights heal you
back up. The sim says about 2.6 hands per fight, so a human scores far less per hand than the smart
bot does.

Proposed direction (question 2 has the choices):

- **Shorter fights, harder hits.** Lower spirit HP (about 25%, more for bosses) so one good stop
  or one koi-koi is decisive. Raise ferocity so each spirit hit takes 15–25% of your HP instead
  of about 8%.
- **Less free healing.** Cut `fightHeal` from 20% to 10%, and `bossHeal` from 60% to 40%. HP
  becomes a resource you buy back at the Onsen, not a pool that refills.
- **New targets:** 2–3 hands a fight _for a human_. To estimate that, add a "casual" sim bot
  that never looks ahead and stops at the first yaku, and tune until that bot averages 3 hands
  and the smart bot still wins about 45%. Rerun `pnpm sim --suite` and update `docs/balance/`.

This builds on the unmerged "ease the early months" commit (`1735cca`, see question 1).

### PR G: Score deck and charm unlocks (#9, #11)

- **New deck, the "Firework Deck" (花火, Hanabi).** Start with Carp Streamer. Every yaku's mult
  is ×1.5, but spirit HP is +50%. It's built to chase one enormous stop. It unlocks when you deal
  1,000+ damage in one stop. Name and effect are up for discussion.
- **Charm unlocks.** Add an optional `unlock` field to charms, reusing `UnlockCondition` from
  decks (and adding kinds like `damageInStop` and `winWithDeck`). Locked charms never appear in
  the shop. They show as silhouettes in the Collection with their unlock text, and unlocking one
  shows a line on the end screen, as decks do. Start with about 6 of the rare and flashy ones
  (question 6).

### Not in any PR: mechanics to model (#10)

As the doc asks, this is for discussion first. I'll write up
`docs/work/…-new-mechanics.md` with sim runs for each idea, using the charm and talisman hooks
the engine already has.

| Idea                                                                                      | Kind              | Notes                                                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pickpocket**: take 1 card from the spirit's captured pile                               | Talisman (active) | The engine already has a `steal` event (the Tengu's rule), so this is cheap to build. It is also denial and interacts with the spirit's intent.          |
| **Offering**: after the deal, take 1 field card into your captures, free, no match needed | Charm (passive)   | Directly helps you "get the hand you want". Likely strong, so cap it at once per hand and consider only allowing Chaff or Ribbons.                       |
| **Pairs laid down**: pairs, triples or quads in your starting hand capture at once        | Charm             | Traditional koi-koi has _teshi_ (4 of a month) as an instant win, so this is thematic. It would need a sim to see how often it fires (pairs are common). |
| **Self-match**: on your turn, match two cards of one month from your hand                 | Talisman          | Probably too strong as a charm. As a single-use talisman it is a "cash in two cards now" tool.                                                           |
| Switch (existing)                                                                         | Talisman          | Already covers "trade a hand card for a field card".                                                                                                     |

The sim can measure each idea's win-rate change and how often it's taken, so we can compare them
before building UI.

## Queued after the plan

- **Music keeps playing in a background tab** (reported 2026-09-25). Cause: `src/ui/audio/audio.ts`
  never listens for the page being hidden, so the `AudioContext` keeps running. Fix: on
  `visibilitychange`, suspend the context when hidden and resume it when visible, but only if it
  was running before. Also pause the music phrase timer while hidden (`startMusic`'s
  `setTimeout` loop). Otherwise notes queue up against the suspended clock and play in a burst
  on return. Test: start a fight, switch tabs, switch back, and check the music stops and
  resumes cleanly.
  - **Done:** only the suspend and resume were needed. Every sound, music notes included, goes
    through `ready()`, which skips it while the context isn't running, so nothing queues up.
    `e2e/audio.spec.ts` fakes a hidden tab and checks the context suspends and resumes.

## Manual test steps (all PRs)

1. `pnpm lint`, `pnpm typecheck` and `pnpm test`.
2. `pnpm build`, then `npx vite preview --port 5299`, then `PW_BASE_URL=http://localhost:5299 pnpm e2e`.
   Read the screenshots at 390×844 and 360×640.
3. Play a fight at normal speed and check: the pile has no smudge; the hand is sorted; played
   cards go straight to their spot; the re-deal gathers and then deals cleanly; the field never
   has a third row; both lanes are the same size; drag-to-match works; stop/koi-koi leaves your
   yaku visible.
4. After PR F, play at least months 1–3 and one boss, and report hands per fight.

## Out of scope

- The big dedicated design pass (#15 part 2). It gets its own plan after PR E lands.
  - Note from the user for that pass: anything persistent (player HP, mon, charms and talismans)
    should have one consistent home on every screen, never moved or covered. Today HP is
    bottom-left in a fight and in the header in the shop.
- Building any of the new-mechanic items (#10) until we've discussed them.

## Answers (2026-09-25)

1. **Balance patch:** merge it first. Done as PR #6 (`monthEase`, `spiritSlip`).
2. **Balance direction:** fine, but model it in the sim when we get to PR F.
3. **Language convention:** agreed as written in PR D.
4. **Stop / koi-koi:** the compact panel with press-and-hold peek, kept near the thumb.
5. **Zen Loop:** try it; not committed to it.
6. **Locked charms:** about 6 for now, but audit all charms at PR G (some existing ones may get
   locked too). Also add a Balatro-style record: a glossary of runs, stats and unlocks.
7. **Score deck:** model it at PR G, and audit all the decks then.
8. **Hand order:** January to December, then Bright > Animal > Ribbon > Chaff. Correct.
9. **PR A and PR B ship as one PR.**
10. **Shop (PR C):** services get the confirm step, and tiles keep the three lines (name, short
    line, price).
11. **Style (PR E):** keep Shippori Mincho (it suits woodblock); spirits speak mid-fight with a
    few personality lines each (including an impatient taunt when you take too long); peek is
    hold, not tap.
