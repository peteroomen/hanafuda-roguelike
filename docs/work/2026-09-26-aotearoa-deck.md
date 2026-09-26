# Aotearoa deck: a second card set with Te Reo names

Status: **built (2026-09-26)** on `claude/aotearoa-hanafuda-mode-x7xufb`. See "What was built" at
the end; the sections in between are the plan as first written.

## Goal

A player can start a run with the Aotearoa cards: 48 cards of native New Zealand flora and fauna
drawn by the user, with Te Reo Māori names for months, cards and yaku in place of the Japanese
ones. The gameplay stays the same. The only rules difference is that some special cards (Brights,
Animals, Ribbons) sit in different months than in the Japanese deck.

Later (not now): opponents from Māori mythology in place of the yokai. The design below leaves
room for that without building it.

## Naming

"Deck" already means the seven run-start variants (Pine Deck, Moon Deck, ...). The new concept is
a **card set**: `CardSetId = 'hanafuda' | 'aotearoa'`. A run has one card set _and_ one deck. The
player-facing word is up to the user (see open questions); this doc says "card set".

## What has to change, and why it isn't just a skin

Card ids are `(month - 1) * 4 + slot`, and one module-level table, `CARDS` in
`src/content/cards.ts`, gives each id its month, type and tags. The engine reads that table in
about 35 places (`hand.ts`, `yaku.ts`, `scoring.ts`, `ai.ts`, `run.ts`) and the UI in about 25
files.

If only names and pictures changed, a new image folder and a text overlay would do. But moving a
special card to another month changes _which cards match which_, so the Aotearoa set needs its own
card table and the engine must know which table a run uses. That is the core of the work.

### What stays shared

- Card ids 0..47 and the id formula.
- **Role tags** (`moon`, `curtain`, `rainMan`, `boar`, `deer`, `butterflies`, `sakeCup`,
  `redPoetry`, `blueRibbon`, `plainRed`, `bird`, `lightning`, ...). They are engine identifiers,
  not names. An Aotearoa card carries the role tag of the card it stands in for (e.g. whatever
  replaces the Boar carries `boar`), so Ino-Shika-Chō, Tsukimi, Hanami, the Rain Man rule, the
  Moon Deck's enhancements and the tag-filtered charms all keep working with no engine change.
- The composition: 5 Brights, 9 Animals, 10 Ribbons (3 red poetry, 3 blue, 4 plain red),
  24 Chaff, 4 cards per month. A content test enforces this for every set.
- Every balance number, all yaku points and rules, spirits, bosses, charms, talismans, decks.

### What becomes per set

| Data                                        | Today                                          | Per set                                      |
| ------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Month layout (which card is which)          | `LAYOUT` in `cards.ts`                         | `layout` in the set                          |
| Month names, flower, glyph, season          | `MONTHS` (`flowerJp`, `kanji`)                 | `months` in the set                          |
| Card names                                  | `Spec.name`                                    | per card in the set                          |
| Yaku name, gloss, glyph, requirement, haiku | `YAKU` in `yaku.ts`                            | text overlay per set; numbers stay in `YAKU` |
| Deck names and blurbs ("Pine Deck")         | `DECKS`                                        | optional name overlay per set                |
| Card faces                                  | `public/cards/traditional/*.webp` or drawn SVG | `public/cards/aotearoa/*.webp`               |
| Card back                                   | drawn, tinted by deck hue                      | the user's back, if they have one            |
| Tutorial and tip text naming yaku           | `tips.ts`, guided text                         | read the name from the set, not a literal    |

## Approach

### 1. Content: card sets as data (`src/content/cardSets/`)

- `hanafuda.ts`: today's `MONTHS` and `LAYOUT`, moved as is.
- `aotearoa.ts`: the user's layout, month names, card names, yaku text.
- `index.ts`: `CARD_SETS`, `cardsOf(set)`, `monthsOf(set)`, `yakuText(set, id)`.
- `cards.ts` keeps its types and helpers, but `card`, `monthDef`, `monthOf`, `seasonOf`,
  `cardWithTag` take a set (`card(id, set)`). The old global `CARDS` goes away so a missed call
  site is a type error rather than a silent Japanese card in an Aotearoa run. (This is the lesson
  from the prototype's silent find-and-replace: make the compiler find every site.)

### 2. Engine: the run knows its card set

- `RunState.cardSet` and `HandState.cardSet` (plain string, so saves and replays stay exact).
  Engine code resolves the table from state: `cardsOf(state.cardSet)`. No module-level mutable
  "current set".
- `newRun({ ..., cardSet })`, default `'hanafuda'`. Old saves load as `'hanafuda'` (migration in
  `store.ts`, next to `migrateSettings`).
- `YakuContext` / scoring input get the table from the hand state they already receive.
- `ai.ts` month-based heuristics already work from month data, so they follow the table.

### 3. Seasons

The Japanese deck puts January in spring. In Aotearoa January is summer. `season` drives three
things: the bokashi sky and music (cosmetic), and which spirits fight in which quarter of the year
(gameplay: `REGULARS_BY_SEASON` in `run.ts`).

Proposal: the spirit schedule keeps using the _game's_ quarter (months 1–3, 4–6, ...), so
difficulty and bosses are identical in both sets. The Aotearoa set gets its own season per month
for the sky and music only, so January looks and sounds like summer. (Open question 4.)

### 4. Language

- Te Reo text lives in `aotearoa.ts`, with macrons (ā ē ī ō ū). Card types stay English (Bright,
  Animal, Ribbon, Chaff) as they do now; "Chips", "Mult", "koi-koi" stay.
- Where the UI shows kanji as decoration (month kanji on the intro and yaku book, yaku kanji,
  deck kanji) the Aotearoa set supplies a `glyph`, which may be empty; the UI must lay out
  cleanly without one.
- `language.test.ts` gains the Aotearoa rule: every yaku has a Te Reo `name` and an English
  `gloss`, and no Aotearoa text contains kana/kanji.
- Fonts are subset to the glyphs in `src/` (`scripts/subset-fonts.py`). `ō` is already in
  (Sankō); `ā ē ī ū` and their capitals are not, so rerun the subset script, and add the macron
  vowels to `EXTRA` so they never drop out. Check the display font (Shippori Mincho) actually
  has them; if not, fall back to a Latin font for Te Reo only.

Draft yaku names to start the conversation. **These are placeholders, not proposals to ship:**
they need checking by a fluent speaker (ideally someone with a view on the whole set, including
tikanga around naming taonga species).

| Yaku (meaning)                 | Draft Te Reo                              |
| ------------------------------ | ----------------------------------------- |
| Gokō (Five Brights)            | Rima Mārama                               |
| Shikō (Four Brights)           | Whā Mārama                                |
| Ame-Shikō (Rainy Four Brights) | Whā Mārama Ua                             |
| Sankō (Three Brights)          | Toru Mārama                               |
| Tsukimi (Moon viewing)         | _depends on the Aotearoa moon card_       |
| Hanami (Flower viewing)        | _depends on the curtain card_             |
| Ino-Shika-Chō                  | _named after the three Aotearoa animals_  |
| Akatan / Aotan / both          | Rīpene Whero / Rīpene Kahurangi / both    |
| Tane (Animals)                 | Kararehe (or Manu, if they are all birds) |
| Tan (Ribbons)                  | Rīpene                                    |
| Kasu (Chaff)                   | _e.g. Para_                               |
| Tsukifuda (Month cards)        | _e.g. Ngā Kāri o te Marama_               |

Month names: the standard modern names (Kohitātea, Hui-tanguru, Poutū-te-rangi, Paenga-whāwhā,
Haratua, Pipiri, Hōngongoi, Here-turi-kōkā, Mahuru, Whiringa-ā-nuku, Whiringa-ā-rangi, Hakihea),
unless the user prefers the maramataka.

### 5. UI

- **Choosing the set**: a two-way switch on the Setup screen above the deck list, remembered as
  the last choice. Stored on the run, shown in run history.
- **Card faces**: `cardFaceUrl(id)` picks `public/cards/aotearoa/{id}.webp` when the run's set is
  Aotearoa. The Settings "card style" (traditional / drawn) only applies to the Japanese set and is
  hidden or greyed out in an Aotearoa run. `disguiseUrl` (Kitsune) and the shop's card pickers
  follow automatically once they read the run's set.
- **Everywhere a card, month or yaku name is shown** (yaku book, tracker, score sequence, intro,
  end screen, shop poems, collection) reads it through the set.
- Collection: yaku counts stay shared (same `YakuId`), shown with the name of the currently
  selected set.
- Settings → Credits: a line crediting the user for the Aotearoa art, and a
  `public/cards/aotearoa/LICENSE.md` with whatever licence they choose.

### 6. Art pipeline

- The user supplies 48 faces (plus a back, optionally) in any common format, named or mapped to
  month and slot.
- Convert with the same settings as the traditional set: 320×525 WebP. Source files go in
  `art-source/cards/aotearoa/`, output in `public/cards/aotearoa/`.
- `scripts/art-sheet.ts` renders a contact sheet of all 48 so the mapping can be checked by eye
  before anything else is built.

### 7. Balance

Moving special cards between months changes what a month's fight tends to offer (Tsukifuda,
month-filtered charms, the month-sealed boss rules). Run `pnpm sim --suite` for both sets
(`--set aotearoa`) and compare win rates in `docs/balance/report.md`. Expect a small shift; we
only retune if the Aotearoa set moves a bot's win rate by more than a few points.

## Steps (PRs)

1. **Card data and art in** (no engine change): `aotearoa.ts` data, the converted images, the
   composition test, a contact sheet. Reviewable on its own; nothing player-facing yet.
2. **Engine knows the set**: move `hanafuda` into `cardSets/`, thread `cardSet` through run and
   hand state, save migration, engine tests parametrised over both sets, sim `--set` flag and a
   balance run.
3. **UI and language**: Setup switch, faces, per-set text everywhere, glyphs, fonts, language
   test, credits, e2e.

## What I need from the user

1. The 48 card images (and a back, if there is one), and the licence for them.
2. For each card: month, type (Bright / Animal / Ribbon / Chaff), which Japanese card's role it
   takes (e.g. "the tūī is the Bush Warbler"), species name in Te Reo and English. A table or
   spreadsheet is fine.
3. Ribbon colours: which three are "red poetry", which three "blue", which four plain red, and
   whether the Aotearoa ribbons carry writing.
4. Who will check the Te Reo.

## Open questions

1. Player-facing name for the choice: "Cards: Nihon / Aotearoa"? "Land"? Something else?
2. Is Aotearoa available from the first run, or unlocked (e.g. after the guided year)? The guided
   year would stay on the Japanese set either way, since its lessons are tuned to those months.
3. How far does Te Reo reach this time? Proposal: cards, months, yaku and deck names only.
   Spirits, charms (omamori), talismans (ofuda), mon and shop stay Japanese until the Māori
   mythology follow-up, which would bring its own opponents, and maybe its own charms and voice
   lines as a second step.
4. Seasons: January as summer for sky and music (proposal above), or keep the Japanese seasons?
5. Glyphs: is there a mark to show where the kanji sit now (a kōwhaiwhai motif, the Te Reo word,
   nothing)?

## Manual test steps (when built)

- Start an Aotearoa run at 390×844 and 360×640: every card face is an Aotearoa card, matching
  follows the Aotearoa months, the moon/curtain/boar-role cards score their yaku.
- Yaku book, tracker, score sequence, intro and end screen show Te Reo names with macrons in the
  right font; no kanji anywhere in the run.
- Kitsune disguises show an Aotearoa chaff; Moon Deck gilds the Aotearoa moon and curtain roles.
- Load a save from before the change: it plays as the Japanese set.
- Switch back to a Japanese run: nothing has changed.

## Out of scope

- Māori mythology opponents, voice lines, portraits.
- Any rule change beyond the card layout.
- Drawn-SVG versions of the Aotearoa cards (only the user's art).
- Translating the whole UI into Te Reo.

## Decisions (from the user)

- Player-facing name: **Land**, with the choices **Nippon** and **Aotearoa**.
- Aotearoa is available from the first run (the guided months work in either land).
- Te Reo reaches cards, months, yaku and deck names. Spirits, charms, talismans and the shop stay
  as they are until the Māori mythology follow-up.
- January is summer in Aotearoa (sky and music); the spirit schedule still follows the year's
  quarters, so difficulty is unchanged.
- Where Nippon shows kanji as decoration (month, yaku, deck and poem seals), Aotearoa shows a
  little kiwi, traced from the user's drawing.

## What was built

- **Cards** (`src/content/cards.ts`): one table, `ALL_CARDS`, holds both lands. Nippon keeps ids
  0..47, so old saves are untouched; Aotearoa is 48..95. Walk a land with `landCards(land)`.
  The global `CARDS` and `ALL_CARD_IDS` are gone, so every site that walked "the deck" had to
  choose a land. Aotearoa cards carry the role tags of the cards they stand in for (kiwi =
  `boar`, ruru = `deer`, wētā = `butterflies`, kete = `sakeCup`, Ua = `rainMan`, storm =
  `lightning`, kōwhai in bloom = `curtain`, Matariki = `phoenix`), so the engine needed no rule
  changes. Eight Aotearoa cards are birds (Nippon has six), which makes Bird Whistle a little
  stronger there.
- **Engine**: `RunState.land` (saves without it load as Nippon, `migrateRun` in `store.ts`);
  `newRun({ land })` deals that land's 48 cards. Lookups by id go through `ALL_CARDS[id]`.
- **Words**: yaku text per land (`yakuText(id, land)` in `yaku.ts`; numbers stay in `YAKU`).
  Charm, deck, spirit, enhancement and tip text that names a yaku or card is a `LandText`, a
  function of the land's `Terms` (`src/content/lands.ts`). `language.test.ts` checks both lands
  and fails if a Nippon yaku or card name shows up in Aotearoa text.
- **Art**: `scripts/aotearoa-cards.ts` turns `art-source/cards/aotearoa/*.svg` into
  `public/cards/aotearoa/{0..47}.webp` (cropped evenly at the sides to the game's card shape and
  re-bordered, no squashing). The back is drawn in code (`aotearoaBackSvg`) after `00-back.svg`,
  so it takes each deck's hue. The kiwi is `src/ui/art/Kiwi.tsx`.
- **Fonts**: the display and UI fonts had no macron vowels at all (even Sankō's ō fell back to
  a system font). `scripts/subset-fonts.py` now builds ā ē ī ō ū (and capitals) from each font's
  own vowel and macron.
- **UI**: a Land switch on the Setup screen (remembered in settings); the collection shows the
  land picked last. The Settings card-style switch is now labelled "Nippon cards".
- **Sim**: `pnpm sim --land aotearoa`, and the suite reports the smart and casual bots in
  Aotearoa. The two lands are level within noise: over 3,000 runs on the same seeds the smart
  bot won 50% in Nippon and 48% in Aotearoa (another 1,000-run batch gave 48% and 50%). No retune.
- **Tests**: composition and role tests for both lands, Aotearoa yaku tests,
  `e2e/aotearoa.spec.ts` (a whole year in Aotearoa at phone size).

## Still open

- The Te Reo yaku names other than Te Pō, Kōkōwai and Pounamu are drafts and need a fluent
  speaker's check (and the card and month names a second look).
- The licence for the Aotearoa art (`public/cards/aotearoa/LICENSE.md` says "to be confirmed").
- Charm names that mention Japanese cards (Boar Tusk, Deer Call, Thousand Cranes, Phoenix Plume)
  are unchanged; their descriptions already use the Aotearoa words.
- The README's known issues: the Kuaka and Toetoe clump cards are due for regeneration. Rerun
  `pnpm tsx scripts/aotearoa-cards.ts` after replacing an SVG.
