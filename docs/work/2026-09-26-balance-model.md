# Balance: fights are too short, and charms snowball

Status: **modelled, waiting on decisions** (see the end). No balance numbers changed yet.

## What prompted it

Play-test (2026-09-26): with Thousand Cranes, Red Seal and Picnic Box from the first three or four
shops, the player never felt in danger, never needed koi-koi, and every spirit fell in one hand.
Suspected causes: mon is easy to come by and shops are everywhere, and the year (12 fights) is
longer than a Balatro run.

## How it was modelled

`scripts/balance-probe.ts` plays 300–400 runs per variant with the sim bots and reports, by part
of the year: win rate, koi-koi calls, how often a fight is won by the player's first stop, how
much of the spirit's HP that first stop deals, and how full the charm slots are. Variants tweak
`BALANCE` for one batch, and the driver can now start a run with charms already owned
(`startCharms` in `src/sim/driver.ts`) to model a lucky early shop.

```
pnpm tsx --tsconfig tsconfig.sim.json scripts/balance-probe.ts <group> [runs]
# groups: base, charms, hp, shape, trade, package, economy
```

Yes, the sim does model charms: the bots buy them (scored by archetype and rarity), fill slots,
sell and reroll. Two caveats about the bots, which matter below:

- They call koi-koi rarely (0.4 per run), so they can't show how a design that rewards koi-koi
  plays. (Already on the roadmap: a greed-aware bot.)
- They are weaker than a person at racing the spirit and at choosing charms. The row "starts with
  all three" is the closest stand-in for a strong player with a good early shop.

## What the model says

| Variant (smart bot unless noted)                           | Win | Koi-koi/run | Fights won by the first stop, months 2–4 / 5–8 / 9–12 | First stop ÷ spirit HP (median) |
| ---------------------------------------------------------- | --- | ----------- | ----------------------------------------------------- | ------------------------------- |
| Today                                                      | 48% | 0.4         | 85% / 85% / 75%                                       | 2.8 / 2.5 / 1.7                 |
| Today, casual bot                                          | 34% | 0.4         | 83% / 84% / 72%                                       | 2.6 / 2.3 / 1.5                 |
| Today, no charms ever                                      | 6%  | 0.9         | 72% / 50% / 37%                                       | 1.5 / 0.7 / 0.4                 |
| Today, starts with Red Seal + Picnic Box + Thousand Cranes | 71% | 0.0         | 100% / 100% / 94%                                     | 8.3 / 5.5 / 3.1                 |

1. **The typical stop kills.** The median first stop deals 2–3× a spirit's HP for most of the
   year. A fight is a race to score first; winning it ends the fight, so there's never a reason
   to koi-koi, and the only danger is the spirit scoring first.
2. **Charms are all of the scaling.** Without charms the same bot wins 6% and a stop does under
   half a spirit's HP by autumn. That's the Balatro shape (jokers are the power), but here it
   overshoots: charms push stops to 2–3× HP, and a good early set to 5–8×.
3. **Thousand Cranes is the outlier, not the other two.** Owned from the start: Red Seal +3
   points of win rate, Picnic Box +3, Stone Lantern +4, **Thousand Cranes +17** (48% → 65%). It
   gains +15 Chips per hand won, and since most hands are won, it reaches about +180 Chips.
   At +8 per hand it's +9 points (57%), still the best growth charm.
4. **Money isn't the lever it looks like.** Slots are full (5 charms) by the sixth shop either
   way. Two charm offers instead of three changed nothing; a stingier rarity roll (70/25/5)
   changed nothing. Less income does help: no Swift Victory bonus and rewards −1 mon slows the
   slots (2 at shop 3, 4 at shop 6, instead of 3 and 5) and costs about 4 points of win rate.
5. **More HP alone makes the game harder, not more interesting.** HP ×2 drops the win rate to
   27% and fights are still 60–70% one-stop, because stop damage is very spread out (a p90 stop
   is 4–6× a p25 stop). Longer fights just give the spirit more chances to hit.
6. **More HP with softer hits changes the texture at the same difficulty.** HP ×2.5 with
   ferocity ×0.6: 47% win (casual 36%), one-stop wins fall to about 60%, koi-koi goes from 0.4
   to 1.8 per run, and a first stop deals about 1.2× HP. But softer hits make a lucky player even
   safer (82% with all three), so on its own it doesn't fix the play-test.
7. **The early easing is part of the boredom.** Months 1–4 have the highest stop-to-HP ratio
   (easing at 0.75). Turning it off costs only 4 points of win rate.

### A combined package

Thousand Cranes +8 per hand · easing no lower than 0.9 · spirit HP ×2.5 · no Swift Victory bonus
· rewards −1 mon:

| Variant                           | Win | Koi-koi/run | First-stop wins 2–4 / 5–8 / 9–12 | First stop ÷ HP | Charms at shop 3 / 6 |
| --------------------------------- | --- | ----------- | -------------------------------- | --------------- | -------------------- |
| Today                             | 48% | 0.5         | 85% / 84% / 75%                  | 2.8 / 2.5 / 1.7 | 3 / 5                |
| Today, all three from the start   | 69% | 0.0         | 100% / 100% / 94%                | 8.3 / 5.5 / 3.2 | 5 / 5                |
| Package, ferocity ×0.6            | 42% | 2.1         | 51% / 53% / 46%                  | 1.0 / 1.1 / 0.8 | 2 / 4                |
| Package, ferocity ×0.6, casual    | 26% | 1.4         | 47% / 48% / 39%                  | 0.8 / 0.9 / 0.6 | 2 / 4                |
| Package, ferocity ×0.6, all three | 74% | 0.5         | 96% / 86% / 61%                  | 2.1 / 1.8 / 1.2 | 5 / 5                |
| Package, ferocity ×0.7            | 32% | 1.9         | 51% / 54% / 46%                  | 1.0 / 1.1 / 0.8 | 2 / 4                |

With the package, a typical stop about kills a spirit: half of fights take a second stop or a
koi-koi, and koi-koi is called four times as often. A lucky player still wins more (74%), which
is earned, but by midsummer they're finishing fights in one stop 86% of the time, not 100%.
The casual bot drops to 26%, below the 30–35% target, so the ferocity or rewards need a final
tune when this is built.

## Ideas, in order of confidence

1. **Nerf Thousand Cranes** (+15 → +8 Chips per hand won), and consider making it rare. The
   one clear outlier.
2. **Raise spirit HP and soften their hits** (about HP ×2.5, ferocity ×0.6), and **ease the early
   months less** (0.9 instead of 0.75). This is what turns fights into two exchanges and makes
   koi-koi worth calling. Targets to tune to: first stop ≈ 1× spirit HP at the median; smart bot
   ~45%, casual ~33%; lucky start ≤ 75%.
3. **Trim the income that rewards snowballing:** drop the Swift Victory bonus (+2 mon for a
   one-hand win pays you for already being ahead) and take 1 mon off each fight's reward.
4. **Make rarity visible and earned.** It exists (60% common, 32% uncommon, 8% rare, prices 4 /
   6 / 8) but only shows as the icon's rim and a word in the details. Colour the shop tile and
   the charm's slot by rarity (bronze, silver, gold, like the rims), name it on the tile, and
   hold rares back until month 3 or so, so an early rare is an event. Thousand Cranes would be
   the fifth rare.
5. **A ward on stops, broken by koi-koi** (a stop without koi-koi can take at most, say, 60% of a
   spirit's HP; a koi-koi stop is uncapped). The most direct way to make koi-koi the tool for
   finishing a fight. Prototyped: the sim bots don't koi-koi, so they just take more hits and the
   win rate falls to 19%. Can't judge it until the greed-aware bot exists, and it changes the
   rules a lot. Parked.
6. **Ruled out by the model:** fewer charm offers, a stingier rarity roll, and more HP without
   softer hits.

## Decisions needed

- Go with the package (ideas 1–3) as one balance PR, tuned to the targets in idea 2?
- Rarity (idea 4): colour-code, and hold rares back early? Make Thousand Cranes rare?
- The ward (idea 5): park until the greed-aware bot, or not at all?
