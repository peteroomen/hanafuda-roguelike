# Yokai portraits

Painted portraits, generated with an image model from the prompt below. They replace
the drawn portraits in `src/ui/art/spirits.ts` one spirit at a time.

## Adding one

1. Generate a square image, ideally 1024×1024 or larger, with a transparent background.
   Keep the style and composition blocks below word for word; write a new subject
   block.
2. Save the original here as `<spiritId>.png` (the id from `src/content/spirits.ts`).
3. Make the game copy. `scripts/cutout.py` removes a flat paper background (only the paper
   touching the edges, so paper-coloured areas inside the figure survive) and writes a 640px
   webp: `python3 scripts/cutout.py art-source/yokai/ID.png src/ui/art/portraits/ID.webp`
   (needs `pip install pillow numpy scipy`).
4. Register it in `src/ui/art/portraitArt.ts` with two crops, given as fractions of
   the image width:
   - `close`: the face, for 60px portraits.
   - `full`: the whole figure, for the intro and reward screens.

## Prompt

```
STYLE (keep identical for every yokai):
A character portrait for a Japanese hanafuda card game, in the style of traditional
hanafuda cards and Edo-period woodblock prints. Flat colour fills with no gradients,
bold black outlines of even weight, and a restrained traditional palette: vermilion
red, deep indigo, pine green, ochre gold, soft plum pink, off-white paper and black.
No shading beyond a single flat shadow tone. Simple, bold shapes that stay readable
when shrunk to 60 pixels wide. Charming and a little mischievous rather than scary.

COMPOSITION:
Square image. The character is centred, facing the viewer, and fills about 75% of
the frame, framed from the top of its head to its chest, with nothing important
near the corners, because the image will be cropped to a circle. Transparent
background, or a flat off-white background if transparency isn't available. No
text, no lettering, no border, no frame, no signature.

SUBJECT: <name>, "<epithet>"
<What the creature is, one strong silhouette idea, one detail tied to its role in
the game, and its mood.>
```

## Done

| Spirit    | Subject notes                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------- |
| kasaObake | Old oiled-paper umbrella, one eye, long tongue, one leg in a geta, hugging stolen ribbon strips.    |
| kodama    | Pale round-headed tree spirit with a pine sprig, peeking from behind a twisted pine.                |
| tanuki    | Plump belly-drumming tanuki in a straw hat and blossom-print scarf, with a sake gourd.              |
| tengu     | Red long-nosed tengu with white mane, tokin cap and crow wings, clutching a stolen red sun.         |
| rainMan   | The guide: an elderly court poet with a yellow umbrella, red cloud-pattern robe and a leaping frog. |
