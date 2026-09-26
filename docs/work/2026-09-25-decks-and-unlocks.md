# PR G: decks, charm unlocks and the record book

**Date:** 2026-09-25
**Source:** play-test feedback items #9 (a high-score deck) and #11 (charms behind achievements),
plus the answers in `2026-09-25-feedback-triage.md`: lock about 6 charms for now, audit every
charm and deck, add a Balatro-style record of runs and unlocks, and model the score deck.
**Status:** Built (see "As built" at the end). All three questions answered yes: lock the 7,
buff the weak charms and give Plum an identity in this PR, and sim with everything unlocked plus a
starter-set row.

## Goal

Give the game long-term goals: things to unlock by playing, a deck for chasing one enormous
number, and one place (the Collection) where you can see everything you've done and everything
still to find.

## Audit

All figures are from `pnpm sim --suite --runs 400` after PR F. Charm figures are the win rate of
smart-bot runs that owned the charm. That's confounded (a charm bought when you're winning looks
good), so treat it as a pointer, not a verdict.

### Charms (36)

| Band             | Charms                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Strongest (60%+) | Leaf Pile 72%, Bonsai 67%, Almanac 64%, Picnic Box 61%                                                             |
| Healthy (45–59%) | 25 charms, including Phoenix Plume, Yata Mirror, Koi Pond, Daruma, Wind Chime, Carp Streamer                       |
| Weak (under 40%) | Paper Umbrella 30%, Sake Barrel 33%, Two Moons 33%, Seed Pouch 36% (only 14 runs), Gambler's Dice 36%, Sweeper 39% |

### Decks (7, plus the new one)

| Deck          | Smart | Notes                                                                              |
| ------------- | ----- | ---------------------------------------------------------------------------------- |
| Willow, Maple | 50%   | Healthy.                                                                           |
| Moon          | 48%   | Healthy.                                                                           |
| Paulownia     | 47%   | Healthy.                                                                           |
| Pine          | 44%   | The plain deck.                                                                    |
| Plum          | 43%   | Plays almost exactly like Pine: its talismans don't change much. Weakest identity. |
| Gambler's     | 41%   | Lowest win rate, but the highest single stops (up to 164k). Fine as a risky deck.  |

All within the "about 15 points of the best" target. The one real problem is Plum's identity.

## Proposal

### 1. The Firework Deck (花火), prototyped

- **Rule:** every yaku gives ×2 Mult, but spirits have 50% more HP. You start with Carp Streamer.
- **Unlock:** deal 1,000 damage in one stop.
- **Engine:** two new deck modifiers, `yakuMult` (in `scoreStop`) and `spiritHp` (in
  `spiritStats`), plus a `stopDamage` unlock kind.
- **Modelled** (300 runs, suite seeds):

  | Variant              | Smart | Casual | Typical stop vs Pine | Best stop |
  | -------------------- | ----- | ------ | -------------------- | --------- |
  | ×1.5 Mult, +50% HP   | 35%   | 24%    | +20%                 | 146k      |
  | **×2 Mult, +50% HP** | 39%   | 33%    | +45%                 | **201k**  |
  | ×1.5 Mult, +25% HP   | 39%   | 33%    | +20%                 | 164k      |
  | ×2 Mult, +60% HP     | 37%   | 28%    | +45%                 | 201k      |
  | Pine, for reference  | 43%   | 35%    | —                    | 55k       |

  **×2 Mult, +50% HP** is the pick. It's the biggest-number deck in the game, at a win rate
  matching the Gambler's Deck.

### 2. Locked charms (7)

Locked charms never appear in the shop. In the Collection they show as a silhouette with how to
unlock them. Unlocking one adds a line to the end-of-run screen, as decks do. Every condition
uses stats the profile already keeps, so existing players unlock anything they've already earned
the first time the game loads.

| Charm                       | Why lock it                   | Unlock                            |
| --------------------------- | ----------------------------- | --------------------------------- |
| Leaf Pile (Kasu at 8)       | Strongest charm (72%)         | Score Kasu 10 times               |
| Bonsai (growing Mult)       | Second strongest (67%)        | Reach June                        |
| Almanac (month cards ×2)    | Strong (64%), build-defining  | Score Tsukifuda                   |
| Phoenix Plume (×2 Brights)  | Rare, flashy                  | Score Sankō 3 times               |
| Koi Pond (scaling ×Mult)    | Rare, rewards koi-koi mastery | Call koi-koi 25 times (all years) |
| Yata Mirror (×3 vs koi-koi) | Rare                          | Calm the Tengu                    |
| Daruma (×3 at low HP)       | Rare, risky                   | Calm 10 different spirits         |

That leaves 29 charms available from the first run. New unlock kinds: `scoreYaku` (id and
count), `koikoiTotal`, `calmSpirit` and `spiritsCalmed`.

### 3. The record book (Collection)

- **Decks tab (new):** every deck with its rule, locked or unlocked (with the condition), and
  your record with it: years played, years completed, and the highest omen beaten. The omen is
  shown as a kanji seal, like Balatro's stake stickers. Needs a new `deckRecords` field in the
  profile.
- **Charms tab:** locked charms show a silhouette and their unlock condition. Seen and unseen
  work as today.
- **Records tab:** keeps today's totals and history, and adds your most-scored yaku, your best
  single stop and which deck it was on, spirits calmed out of 20, and charms and decks unlocked
  out of the total.
- **End screen:** lists charm unlocks along with deck and omen unlocks.

### 4. Small fixes from the audit (optional, same PR)

- **Buff the weakest charms,** simming each until it's at or above 40%:
  - Sake Barrel: +8 → +15 Mult.
  - Two Moons: also gives Hanami-zake ×1.5.
  - Paper Umbrella: also +5 Mult per koi-koi you call.
  - Gambler's Dice: +10 → +15 Mult per koi-koi.
- **Plum Deck:** give it an identity. Proposal: "Talismans cost 1 mon less, and you start with
  Frog, Far Sight and a third talisman slot."

## Steps

1. Content: the Firework Deck (done), unlock fields on the 7 charms, new unlock kinds.
2. Engine: the shop skips locked charms (the run carries the unlocked list, so it stays pure).
3. Profile: `deckRecords`, plus migration for existing saves (unlocks recomputed on load).
4. UI: the Decks tab, locked charms in the Charms tab, more records, charm unlock lines at the end.
5. Sim: the bots play with everything unlocked (as a veteran would), plus one suite row with the
   starter set. Rerun `pnpm sim --suite` and update `docs/balance/`.
6. Tests: unlock conditions, the shop never offering a locked charm, profile migration, and an
   e2e visit to each Collection tab.

## Manual test steps

1. Clear the site data, start a year, open the shop: none of the 7 locked charms appear.
2. The Collection's Charms tab shows 7 silhouettes with their conditions. The Decks tab shows
   the Firework Deck locked, with "Deal 1,000 damage in one stop."
3. Play until a condition is met (the fastest is Score Tsukifuda, or edit the save). The end
   screen names the unlock, and the charm appears in later shops.
4. Unlock the Firework Deck (edit `biggestHit`), start a year with it, and check the ×2 Mult in
   the score sequence and the higher spirit HP on the intro.

## Out of scope

- New charms or talismans. The mechanics to model (stealing, a free field card, pairs laid down)
  stay in the roadmap.
- The design pass, including HP visibility while deciding (see `docs/roadmap.md`).

## As built

- **Content:** `src/content/unlocks.ts` holds the 7 charm unlocks (`CHARM_UNLOCKS`,
  `LOCKED_AT_START`) and the `UnlockCondition` kinds shared with decks.
- **Engine:** `newRun({ lockedCharms })` stores the list on the run (omitted for sims and old
  saves, which means everything is available). `rollCharms` in `shop.ts` skips it, in the first
  roll and in rerolls. A new deck modifier `ofudaDiscount` takes 1 mon off talismans (Plum).
- **Profile:** `unlockedCharms`, `deckRecords` (years, completed, best omen) and `biggestHitDeck`.
  Older saves get the defaults from the shallow merge on load, and `refreshUnlocks()` (on app
  start) silently grants anything already earned.
- **Collection:** a Decks tab (rule or unlock condition, record, best omen as a red seal), locked
  charms as silhouettes with their condition, and more records (spirits calmed, charms and decks
  unlocked, most-scored yaku, the deck of your biggest hit). The end screen lists charm unlocks.
- **Buffs:** Sake Barrel +15 Mult, Two Moons also Hanami-zake ×1.5, Paper Umbrella also +5 Mult
  per koi-koi, Gambler's Dice +15 per koi-koi.
- **Tests:** `src/engine/shop.test.ts` (locked charms never offered; Plum prices),
  `src/ui/state/meta.test.ts` (conditions, defaults, the veteran refresh) and
  `e2e/collection.spec.ts` (every tab, silhouettes, a veteran save).

### Balance after the build (`pnpm sim --suite --runs 400`)

- Smart 44%, casual 34%, **starter set 43%**: locking the 7 costs a new player about 1 point.
- Decks: Pine 44%, Plum 48% (was 43%), Moon 48%, Willow 49%, Maple 50%, Gambler's 42%,
  Paulownia 47%, Firework 42%. All within 8 points.
- Omens 44/37/31/21/12/8%.
- **The weak-charm buffs don't show up in the bot numbers.** The "runs that owned it" figures
  stayed low (Sake Barrel 32%, Two Moons 31%, Gambler's Dice 36%, Paper Umbrella 28%), so I ran an
  A/B instead, starting 300 suite-seed runs with each charm owned (baseline 42%):

  | Charm           | Old | New |
  | --------------- | --- | --- |
  | Sake Barrel     | 44% | 44% |
  | Two Moons       | 44% | 44% |
  | Paper Umbrella  | 42% | 42% |
  | Gambler's Dice  | 41% | 41% |
  | Leaf Pile (ref) | 54% |     |
  | Bonsai (ref)    | 64% |     |

  The sake charms were never weak: the low "owned" figure is the confound (bought while chasing
  a risky sake build). The two koi-koi charms are neutral **for the bot** because it calls koi-koi
  about once every two runs. A player who calls koi-koi gets the value, so the buffs stay. Making
  the smart bot lean into koi-koi when it holds greed charms is queued in the roadmap.

## Questions (answered)

1. **Which charms to lock:** are these 7 right, and are the conditions fun? Too easy or too hard?
2. **Weak-charm buffs and the Plum Deck:** in this PR, or later?
3. **Should the sim bots play with everything unlocked** (veteran balance), with one extra row
   for a new player's starter set? I'd say yes, since unlocks shouldn't make the game harder to
   win for new players, only less varied.
