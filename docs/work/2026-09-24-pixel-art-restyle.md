# Pixel-art restyle: scope and plan

**Date:** 2026-09-24
**Branch:** `claude/hanafuda-roguelike-handoff-o39d8a` (restarted from `main` after PR #1 merged)
**Status:** Declined; see the end of this file.

## Goal

Move Twelve Petals from its current flat SVG look to a cohesive pixel-art look, prompted by the
user's reference: a pixel hanafuda crane card (Pine bright) and a matching card back. Every
screen should feel like one pixel world, not pixel cards pasted onto a smooth UI.

## The reference, read closely

- **Limited palette:** warm off-white card stock, near-black ink, a flat red sun, one gold, and a
  grey or two for shading. No gradients; shading is done with dithering and hard steps.
- **Detail:** the crane card is about 48×76 art pixels. That's enough for a readable bird, a sun
  and pine fronds, with black outlines and 1-pixel highlights.
- **Card back:** black with a dotted field, a double pixel border and two mirrored crest roundels.
  It looks like a printed back rather than a pattern fill.
- **Mood:** closer to a Game Boy Color or PC-98 card game than to modern "hi-bit" pixel art.
  That points to chunky pixels and a strict palette.

## What has to change

The current art is isolated in `src/ui/art/` (about 2,700 lines), and 14 components consume it
through `cardFaceUrl`, `spiritUrl`, `OmamoriIcon`, `OfudaIcon` and friends. That isolation makes
the swap tractable. A rough inventory, largest first:

| Area                    | Count                                                                      | Notes                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card faces              | 48 + back                                                                  | The core of the job. Plus 7 enhancement overlays (Gilded, Torn, Moonlit…), the month-label "training wheels", and the "disguised" and "frozen" boss states.                                                                     |
| Mini cards              | 48                                                                         | The captured strips show cards at about 20 px wide. Pixel art can't be downscaled that far and stay crisp, so the strips need their own tiny sprites (about 12×20) or a different design, such as stacked month and type chips. |
| Spirit portraits        | 20 + Rain Man                                                              | 12 spirits and 8 bosses, each with a seasonal background tint. Portraits appear at about 60 px (HUD) and about 150 px (intro and reward).                                                                                       |
| Icons                   | 39 omamori, 9 ofuda, poems, petal, coin, crest, fang, book and menu glyphs | Small (16–32 art px), so this goes quickly once the palette is set.                                                                                                                                                             |
| UI chrome               | ~70 rounded or shadowed CSS rules                                          | Buttons, panels, sheets, chips, HP bars, the shop grid and the decision card. They become 9-slice pixel frames with hard drop shadows and no blur or radius.                                                                    |
| Type                    | 2 faces                                                                    | Shippori and ZenMaru become a pixel font that also covers Japanese: **DotGothic16** (Google Fonts, OFL) or **k8x12 / PixelMplus** (free licences). Numbers in the score sequence may want a custom bitmap numeral set.          |
| Backgrounds and effects | Seasonal table, petals, score bursts, screen shake                         | Dithered seasonal backdrops. Particles become 2–4 px sprites, and motion moves in whole pixels.                                                                                                                                 |
| Title and store assets  | Title fan, favicon, PWA icons                                              | Redrawn from the new card set.                                                                                                                                                                                                  |
| Audio (optional)        | —                                                                          | The synthesised koto and taiko already suit a retro look. Chiptune-flavoured variants are optional.                                                                                                                             |

The engine, content, simulator and balance are untouched. This is purely `src/ui`.

## The key technical decision: crisp pixels at phone sizes

The game scales a 390-wide stage to fit the screen, and cards scale again inside it (hand ×1.18,
field ×1–1.18, captured ×0.36). Pixel art only looks right when each art pixel covers a whole
number of device pixels. At DPR 3, a 48 px card drawn at 66 CSS px is 4.1 device pixels per art
pixel, so some art pixels come out 4 px and some 5 px. That gives uneven, shimmering outlines,
worst during animation.

Options:

1. **Snap the layout to whole pixels.** Compute device pixels per art pixel as
   `devicePixelRatio × stageScale × cardScale`, round it to an integer, and size cards from that.
   Cards shift by a few CSS pixels between phones, so layout needs slack. Card motion also snaps
   to whole art pixels, which reads as deliberately retro.
2. **Render the table to a low-res canvas** (e.g. 195×422 art px) and upscale it by an integer.
   Most authentic, but it's a rewrite of the card layer, which today uses DOM transforms and CSS
   transitions. Text stays in the DOM on top. This is a big change.
3. **Just use `image-rendering: pixelated`** and accept some uneven pixels. Cheapest, but it looks
   worst on exactly the cards people stare at.

**Recommendation:** option 1, decided by a spike on real phone sizes.

## Where the art comes from

1. **The pack in the screenshot.** We need its source and licence before anything else. Many
   itch.io packs allow use in games but not redistribution in a public repo, and the repo is public.
   The pack must also cover all 48 cards plus the back. If it only has cards, spirits and UI must
   still be drawn to match someone else's style exactly, which is the hardest version of this job.
2. **Original pixel art authored in code.** Palette-indexed sprite grids in TypeScript, rendered to
   canvas and cached as data URLs, the same pipeline the SVG art uses today. This keeps the
   project's "all art is original" rule, stays tiny and deterministic, and gives full control over
   the matching spirits and UI. The risk is quality: 48 hand-placed cards at about 48×78 is a lot of
   careful work. Iterating through screenshots works, as it did for the SVG art.
3. **Hybrid.** Rasterise the existing SVGs to low resolution, quantise to the palette, then clean
   up by hand. It's fast, but auto-downscaled art looks like blurred mush rather than pixel art.
   Only worth it as a starting point that gets cleaned up by hand.

**Recommendation:** use the pack if its licence allows it and it's complete, and draw spirits and
UI in its style. Otherwise, author original pixel art (option 2) using the screenshot as a style
reference only, not copying it.

## Phased plan

1. **Spike (1 session).** Draw one card (Pine crane), the back, one spirit, one button and panel,
   and set the pixel font. Wire in an `artSet` switch (`classic` | `pixel`) behind the existing
   art functions. Try the whole-pixel layout at 360×640, 390×844 and 430×932, at DPR 2 and 3.
   Deliverable: screenshots side by side with the current look, and a go/no-go on the style, the
   palette and the rendering approach.
2. **Palette and style guide.** 16–24 named colours, outline and shading rules, the seasonal
   accent for each month, and a sprite-grid format with a validator test (right size, colours
   only from the palette).
3. **Cards (the bulk).** 48 faces, the back, 48 minis, the enhancement overlays, training-wheel
   labels and the boss states. Review contact sheets month by month (the existing
   `scripts/art-sheet.ts`).
4. **UI chrome and type.** 9-slice frames, buttons, HP bars, chips, sheets and the shop; the
   pixel font subset including Japanese glyphs; bitmap numerals for the score sequence.
5. **Spirits.** 20 portraits and the Rain Man, at two sizes or one crisp-scaled size.
6. **Icons, backgrounds, particles, title and store assets.**
7. **Motion and polish.** Whole-pixel card motion, pixel particle bursts, and hard-cut screen
   shake. Rerun the E2E playthroughs and the photo tour. Check at both phone sizes, and in dark
   rooms (the black card back on a dark table needs contrast).
8. **Remove or keep the classic set.** Keeping it as a setting costs little while both sets
   share an interface. Deleting it halves future art work. Decide after playing with pixel.

Size, roughly: the spike is one session; the full restyle is 5–8 sessions of focused work,
mostly cards and spirits. Each phase lands as its own PR so the game stays playable throughout,
and the `artSet` switch means half-finished art never ships as the default.

## Manual test steps (for the finished restyle)

- [ ] On a real phone (DPR 3) and a DPR 2 Android, every card outline is crisp and even in the
      hand, on the field and mid-animation.
- [ ] All 48 cards can be told apart at hand size without the month labels. Brights, animals,
      ribbons and chaff read correctly at mini size in the captured strips.
- [ ] Japanese text renders in the pixel font (spirit names, the yaku book, the 役 button).
- [ ] Enhanced, disguised (Kitsune) and frozen (Yuki-onna) cards remain distinguishable.
- [ ] Edge: at 360×640 nothing important overflows with the pixel font's wider glyphs.
- [ ] Edge: switching the art style in Settings mid-run redraws everything without a reload.

## Open questions for the user

1. **Where are those cards from?** A link or pack name tells us the licence, whether all 48 cards
   exist, and at what native size.
2. **How far should it go?** The full pixel world (cards, UI, type, spirits), or pixel cards and
   spirits with a quieter, flatter version of the current UI? Full is more cohesive and about
   30–40% more work.
3. **Keep the current art as an option,** or replace it outright?

## Out of scope

Gameplay, balance and content changes. Chiptune music, unless asked for.

---

## What actually happened

(to fill in when work starts)

## Files created / modified

- `docs/work/2026-09-24-pixel-art-restyle.md` (this plan)

## Deferred to next session

Everything: this session only scoped the work.

## Status

- [x] **Declined (2026-09-24).** The user prefers the current card style and flagged that yaku
      readability is already the bigger problem. They may source a card set that scales better
      instead. Kept for reference.
