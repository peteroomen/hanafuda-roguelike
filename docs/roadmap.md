# Roadmap

What's planned after the current work. Each item links to where it was raised. When one is picked
up, it gets its own plan in `docs/work/`.

## Now

- **PR G: decks, charm unlocks and the record book.** Built; see
  `docs/work/2026-09-25-decks-and-unlocks.md`.

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

## Later: mechanics to model

From feedback item #10 (discussion first, then sim each before building). See the table in
`docs/work/2026-09-25-feedback-triage.md`.

- **Pickpocket** talisman: take a card from the spirit's captures (the engine already has
  `steal`).
- **Offering** charm: take one field card for free after the deal.
- **Pairs laid down:** pairs or more of a month in your starting hand capture at once (_teshi_
  is an instant win in traditional koi-koi).
- **Self-match** talisman: match two cards of one month from your own hand.

## Ideas parked

- **Sim: a greed-aware smart bot.** The bot calls koi-koi about once every two runs, so it can't
  measure the koi-koi charms (Gambler's Dice, Paper Umbrella, Koi Pond). Have it lean into
  koi-koi when it holds them. Found in PR G.
- A settings toggle for the spirits' idle taunts, if they grate.
