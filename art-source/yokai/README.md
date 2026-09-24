# Yokai portraits

Painted portraits, generated with an image model from the prompt below. They replace
the drawn portraits in `src/ui/art/spirits.ts` one spirit at a time.

## Adding one

1. Generate a square image, ideally 1024×1024 or larger, with a transparent background.
   Keep the style and composition blocks below word for word; write a new subject
   block.
2. Save the original here as `<spiritId>.png` (the id from `src/content/spirits.ts`).
3. Make the game copy:
   `python3 -c "from PIL import Image; Image.open('art-source/yokai/ID.png').convert('RGBA').resize((640,640), Image.LANCZOS).save('src/ui/art/portraits/ID.webp','WEBP',quality=86,method=6)"`
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

| Spirit    | Subject notes                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------ |
| kasaObake | Old oiled-paper umbrella, one eye, long tongue, one leg in a geta, hugging stolen ribbon strips. |
