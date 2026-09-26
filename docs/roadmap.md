# Roadmap

What's planned after the current work. Each item links to where it was raised. When one is picked
up, it gets its own plan in `docs/work/`.

## Now

Nothing in progress. The 2026-09-25 play-test feedback is fully shipped (PRs A–G, #7–#14; see
`docs/work/2026-09-25-feedback-triage.md`). Everything still open from it is below. Pick up from
**Next** when work resumes.

## Next: the design pass

Raised in the 2026-09-25 play-test ("the UI feels inconsistent and not game-like enough… a real
big dedicated design pass later"). PR E (the woodblock style) was part one.

- **One fixed home for everything persistent.** Your HP, mon, charms and talismans sit in the
  same place on every screen (fight, shop, reward) and are never moved or covered.
  Today HP is bottom-left in a fight and in the header in the shop.
- **HP visible while deciding stop or koi-koi.** The decision panel covers the bottom bar,
  where HP lives, and HP is exactly what the koi-koi risk depends on. The fixed home above
  solves it. Until then, a stopgap is to show "risk ~14 of your 52 HP" on the Koi-koi! button.
  Reported after PR E; see `docs/work/2026-09-25-feedback-triage.md`.
- **"Do less":** fewer kinds of pill, label and panel; one type scale; one spacing scale.
- **More game-like moments:** transitions between screens, a proper month-change beat, and a
  victory sequence for the year.

## Later: Aotearoa

The Aotearoa land shipped in #15 with its own cards, Te Reo names and NZ seasons; everything else
in the run is still Japanese. See `docs/work/2026-09-26-aotearoa-deck.md`. In rough order:

- **A fluent speaker's check of the Te Reo.** Most of the yaku names are drafts (only Te Pō,
  Kōkōwai and Pounamu came from the deck's designer), and the card names, month names and
  descriptions deserve a look too. Worth doing before anything below adds more Te Reo.
- **Opponents from Māori mythology.** Twelve spirits and eight bosses, each with a portrait,
  lore, voice lines and (for bosses) a rule. The spirit schedule is already per quarter, so a
  land can bring its own roster. Lean on creatures and beings of story (taniwha, patupaiarehe,
  ponaturi, maero, Kurangaituku) rather than atua, and get cultural advice on which figures are
  appropriate to fight in a game at all.
- **A charm and shop pass.** Same effects, new theming: omamori become taonga (pounamu,
  hei-tiki, kete), ofuda become something one-shot, the onsen becomes hot pools, mon perhaps
  stays as coin. Charm names that point at Japanese cards (Boar Tusk, Deer Call, Thousand
  Cranes, Phoenix Plume, Two Moons) would change with it.
- **The guide.** The Rain Man narrates the guided months in both lands. Aotearoa could have its
  own guide (Ua's frog, or a pīwakawaka) with a portrait and its own tips.
- **Sound.** The music and UI plucks use a Japanese koto scale. Aotearoa could have its own
  palette: birdsong for captures and yaku (tūī, korimako, ruru), and something flute-like in
  the spirit of taonga pūoro (with care: some of those instruments carry real significance).
- **Small touches.** Falling pōhutukawa stamens instead of cherry petals on the menus; an
  Aotearoa title screen; land-specific unlocks (a deck back per land) in the record book.
- **Art.** Regenerate the Kuaka and Toetoe clump cards (the designer's known issues), then
  rerun `scripts/aotearoa-cards.ts`.
- **Maybe, later: land-specific yaku.** For example a Matariki yaku. This changes gameplay, so
  it needs its own plan and a balance run; the lands are level today.
- **Watch the balance.** The two lands are within noise of each other, but the 400-run suite
  has had Aotearoa a few points easier. Recheck after the charm pass.

## Later: mechanics to model

From feedback item #10 (discussion first, then sim each before building). See the table in
`docs/work/2026-09-25-feedback-triage.md`.

- **Pickpocket** talisman: take a card from the spirit's captures (the engine already has
  `steal`).
- **Offering** charm: take one field card for free after the deal.
- **Pairs laid down:** pairs or more of a month in your starting hand capture at once (_teshi_
  is an instant win in traditional koi-koi).
- **Self-match** talisman: match two cards of one month from your own hand.

## Later: sim and balance

- **A greed-aware smart bot.** The bot calls koi-koi about once every two runs, so it can't
  measure the koi-koi charms (Gambler's Dice, Paper Umbrella, Koi Pond). Have it lean into
  koi-koi when it holds them, then re-check those charms with the start-owned A/B from PR G
  (`docs/work/2026-09-25-decks-and-unlocks.md`, "Balance after the build").
- **Re-audit the charms with that A/B, not the "runs that owned it" table.** The owned table is
  confounded (Sake Barrel looked weak at 32% but is 44% when owned from the start). Leaf Pile
  (54%) and Bonsai (64%) are the outliers worth a look now that they're locked.
- **Deck spread:** Plum jumped from 43% to 48% with cheaper talismans; Gambler's and Firework
  sit at 42%. All within target, but check again after any shop change.

## Ideas parked

- A settings toggle for the spirits' idle taunts, if they grate.
- More unlockables once the record book has been played with: omen-gated charms, a deck per
  season boss, Balatro-style deck stickers beyond the best-omen seal.
