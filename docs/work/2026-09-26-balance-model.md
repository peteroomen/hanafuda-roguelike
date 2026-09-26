# Balance: fights are too short, and charms snowball

Status: **plan agreed (see "The plan" at the end), not built yet.** No balance numbers changed.

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

### Fewer shops (asked after the first write-up)

Prototyped in the engine for the sim only (not committed):

| Variant                                                                              | Win | Koi-koi/run | First-stop wins 2–4 / 5–8 / 9–12 | First stop ÷ HP | Charms in month 4 / 7 | Mon at 1st shop |
| ------------------------------------------------------------------------------------ | --- | ----------- | -------------------------------- | --------------- | --------------------- | --------------- |
| Today                                                                                | 48% | 0.4         | 85% / 85% / 75%                  | 2.8 / 2.5 / 1.7 | 4 / 5                 | 10              |
| Shop only after bosses (months 3, 6, 9)                                              | 32% | 0.6         | 66% / 73% / 69%                  | 1.8 / 1.6 / 1.4 | 3 / 5                 | 29              |
| … casual bot                                                                         | 18% | 0.5         | 64% / 72% / 67%                  | 1.7 / 1.5 / 1.2 | 3 / 5                 | 29              |
| Shop every other month                                                               | 41% | 0.5         | 75% / 80% / 72%                  | 2.0 / 2.2 / 1.6 | 3 / 5                 | 18              |
| Charms only after bosses; a small shop (talismans, poems, shrine, onsen) every month | 36% | 0.6         | 69% / 65% / 65%                  | 1.8 / 1.3 / 1.3 | 2 / 3                 | 10              |
| … casual bot                                                                         | 23% | 0.6         | 68% / 66% / 69%                  | 1.7 / 1.2 / 1.3 | 2 / 3                 | 10              |

- **Shop only after bosses** is harder, but blunt. Mon piles up (about 29 at the first shop), so
  you buy three to five charms at once and the slots are full by month 7 anyway. Months 1–3
  have no charms at all, and the onsen (the only heal you can buy) is gone for most of the year.
- **Charms only after bosses, with a small shop every month**, does what the idea is after:
  charms come slowly (2 by month 4, 3 by month 7, against 4 and 5 today), each change of season
  is a big market to look forward to, and a strong charm there feels earned. The monthly small
  shop keeps heals, talismans, poems and the shrine, so mon still has somewhere to go. It's a
  real difficulty step (36% / 23%), so it would ship together with the spirit retune, which
  would then need less HP. It doesn't change the fight texture on its own (one-stop wins still
  about 65%).

### A smaller shop, and a boss draft

Two more shapes, prototyped the same way. Here the charm count applies to restocks too (the
first "charms only after bosses" prototype only emptied the first roll, so restocks leaked
charms back in; corrected below). "Boss draft" is a free pick of one charm out of three after
each boss (before months 4, 7 and 10).

| Variant                                        | Win (smart / casual) | First-stop wins 2–4 / 5–8 / 9–12 | Charms in month 4 / 7 |
| ---------------------------------------------- | -------------------- | -------------------------------- | --------------------- |
| Today                                          | 48% / 34%            | 85% / 85% / 75%                  | 4 / 5                 |
| 1 charm on offer each month, 3 after bosses    | 44% / 36%            | 79% / 82% / 71%                  | 3 / 5                 |
| 1 charm on offer each month, 4 after bosses    | 44% / 35%            | 79% / 82% / 71%                  | 3 / 5                 |
| Charms only after bosses (3 on offer)          | 37% / 23%            | 69% / 65% / 65%                  | 2 / 3                 |
| Boss draft only, no charms in the shop         | 26% / 16%            | 68% / 60% / 60%                  | 1 / 2                 |
| Boss draft + 1 charm on offer each month       | 47% / 34%            | 79% / 83% / 75%                  | 4 / 5                 |
| Draft after month 1 and each boss + 1 on offer | 47% / 42%            | 86% / 84% / 76%                  | 5 / 5                 |
| Boss draft + today's shop                      | 49% / 36%            | 85% / 86% / 74%                  | 5 / 5                 |

What this says:

- **The five charm slots are the real ceiling.** Under almost any shop, a year fills them by
  month 7. Shop shape changes how _fast_ you get there, which is pacing, not how fights play:
  first-stop wins stay at 65–85% unless charms are cut so hard that the game gets much harder.
  Fight texture still needs the spirit retune (idea 2).
- **A reduced shop (one charm on offer, three after bosses) is a gentle nudge.** Slightly harder
  (44% / 36%), one fewer charm by month 4, same by month 7.
- **The boss draft plus a one-charm shop is difficulty-neutral** (47% / 34%, same as today),
  but it moves where power comes from: a free pick after each boss, so beating a boss is a
  reward moment and a strong charm there is earned. The draft is the natural place for rares
  (for example: draft picks roll uncommon or better, and rares appear only in drafts).
- **Draft only (no shop charms) is too harsh**, and a draft on top of today's shop just adds
  power.

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
6. **Change the shop's shape for pacing.** Best of the variants: a **boss draft** (pick one of
   three charms free after each boss, uncommon or better, the only place rares appear) plus a
   shop with **one charm on offer** in other months. Same difficulty as today, but power comes
   in bursts you earn by beating bosses. Alternatives: season markets (charms only after
   bosses; harder) or a reduced shop (one charm, three after bosses; a gentle nudge). See
   "Fewer shops" and "A smaller shop, and a boss draft" above.
7. **Ruled out by the model:** fewer charm offers, a stingier rarity roll, more HP without
   softer hits, and closing the shop entirely between bosses.

## Decisions needed

- Go with the package (ideas 1–3) as one balance PR, tuned to the targets in idea 2?
- Rarity (idea 4): colour-code, and hold rares back early? Make Thousand Cranes rare?
- The ward (idea 5): park until the greed-aware bot, or not at all?
- Shop shape (idea 6): season markets (charms only after bosses), a reduced shop (one charm
  on offer, three after bosses), or a boss draft plus a one-charm shop? My pick is the boss
  draft plus a one-charm shop, with rares only in drafts.

## Charm audit: which charms define a run?

Each charm owned from the start of a run, alone (`balance-probe.ts audit`, 300 runs, about ±3
points of noise; baseline 48%):

| Lift     | Charms                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| **+22**  | Bonsai (uncommon)                                                                                               |
| **+17**  | Thousand Cranes (uncommon)                                                                                      |
| **+8**   | Leaf Pile (uncommon)                                                                                            |
| +3 to +5 | Daruma (rare), Stone Lantern, Gold Koban, Rice Bale, Red Seal, Picnic Box, Obi Sash, Willow Wind, Lightning Rod |
| about 0  | most of the rest, including Yata Mirror (rare)                                                                  |
| −3 to −7 | Koi Pond (rare), Phoenix Plume (rare), Calligrapher, Bird Whistle, Boar Tusk, Sweeper                           |

The strongest charms are uncommon, and today's rares are weak. Phoenix Plume and Koi Pond are
build-arounds (Brights, koi-koi) the bots can't play to, so they undersell them, but a rare
should be strong without a perfect build.

## The plan (agreed 2026-09-26)

The player's design, modelled:

- **The shop after a regular fight** keeps 3 charm offers, rolled mostly common: weights 75
  common / 22 uncommon / 12 rare per charm, which works out at about 1.4 rares seen in shops per
  run. You mostly see commons and the odd uncommon.
- **After each boss** (before months 4, 7 and 10), a free **draft: pick 1 of 3 rare charms**.
  Rares are the run-defining ones; you can find one in a shop, but realistically they come from
  bosses.
- **Rare tier re-cut:** Bonsai, Thousand Cranes and Leaf Pile become rare (price 8), joining
  Daruma, Yata Mirror, Phoenix Plume and Koi Pond.
- **Spirit retune:** HP ×2.5, ferocity ×0.58, early easing no lower than 0.9, no Swift Victory
  bonus, fight rewards −1 mon.
- **Rarity made visible:** bronze / silver / gold on shop tiles, charm slots and the draft.

| Variant (400 runs)                         | Win       | Koi-koi/run | First-stop wins 2–4 / 5–8 / 9–12 | First stop ÷ HP   | Rares seen in shop / owned at end |
| ------------------------------------------ | --------- | ----------- | -------------------------------- | ----------------- | --------------------------------- |
| Today, smart                               | 48%       | 0.5         | 85% / 84% / 75%                  | 2.8 / 2.5 / 1.7   | 0.6 / 0.3                         |
| Today, casual                              | 35%       | 0.4         | 84% / 83% / 73%                  | 2.7 / 2.3 / 1.5   | 0.6 / 0.2                         |
| **Plan, smart**                            | **53%**   | **2.0**     | 55% / 58% / 49%                  | 1.1 / 1.1 / 0.9   | 1.4 / 2.5                         |
| **Plan, casual**                           | **33%**   | 1.4         | 49% / 53% / 38%                  | 0.9 / 1.0 / 0.6   | 1.3 / 1.1                         |
| Plan, rare weight 8 (smart / casual)       | 51% / 33% | 2.1 / 1.5   | 55% / 58% / 48%                  | 1.1 / 1.1 / 0.8   | 0.9 / 2.5                         |
| Plan, lucky: Bonsai + Cranes from month 1  | 88%       | 0.1         | 100% / 99% / 96%                 | 3.6 / 4.9 / 4.1   | –                                 |
| Today, lucky: Bonsai + Cranes from month 1 | 70%       | 0.0         | 100% / 100% / 97%                | 10.5 / 10.9 / 8.4 | –                                 |

- On target (smart about 50%, casual about 33%), with half the fights needing a second exchange
  or a koi-koi, and koi-koi called about four times as often as today.
- The Thousand Cranes nerf is no longer needed once it's a rare you draft (it moved the win rate
  by a point). Keep it at +15.
- Two growth rares together from month 1 is still a walkover (88%). The draft makes that
  unlikely before month 4, but Bonsai (+3 Mult per fight won) is the one to trim in the final
  tune if drafted runs snowball.

### Things the build has to handle

- **Unlocks.** Six of the seven rares (Bonsai, Leaf Pile, Phoenix Plume, Koi Pond, Yata Mirror,
  Daruma) start locked, so a new player's draft would only ever offer Thousand Cranes. Rework
  `src/content/unlocks.ts` so at least four rares are open from the start and the rest unlock
  over time, or let the draft offer locked rares as a preview.
- **Rare pool size.** Seven rares, three drafts of three: you'd see nearly all of them every run.
  Worth adding rares over time, and buffing Phoenix Plume and Koi Pond so every rare feels
  run-defining.
- **The casual bot takes about one draft rare per run** (it never sells, so a full slot blocks
  it). A person would swap a common for a free rare; the draft UI should make that easy (pick,
  then choose which charm to let go if slots are full).
- **The draft screen** is new UI: three rare charms, gold-edged, after the boss reward.
- The sim bots need to pick from the draft (the smart bot already scores charms).
