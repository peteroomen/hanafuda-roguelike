# Aotearoa Hanafuda: SVG deck v1

A 48-card hanafuda deck redrawn with New Zealand plants, birds and skies, in the style of the classic Nintendo / Hachihachi cards. It plays exactly like a standard deck: 12 months of 4 cards, with the same card types, counts and scoring partners, so koi-koi and every other hanafuda game work unchanged.

## Files

`MM-mon-card-name.svg`, for example `06-jun-matariki.svg`, plus `00-back.svg` for the card back. There are 49 files, each 1024 × 1536 (2:3 portrait), with flat colours only. The ribbon inscriptions are vector shapes, so no font is needed.

## Card types

| Type             | Count | What it is                                                             |
| ---------------- | ----- | ---------------------------------------------------------------------- |
| Bright (hikari)  | 5     | The dramatic top card of its month                                     |
| Animal (tane)    | 9     | A bird, insect or special object                                       |
| Ribbon (tanzaku) | 10    | 3 kōkōwai (red poetry), 3 pounamu (green, replacing blue), 4 plain red |
| Plain (kasu)     | 24    | The month's plant alone                                                |

## Months

NZ seasons run opposite to Japan's, so the months follow the NZ calendar, not a direct plant-for-plant swap.

| #   | Month | Plant                     | Bright                           | Animal                      | Ribbon    |
| --- | ----- | ------------------------- | -------------------------------- | --------------------------- | --------- |
| 01  | Jan   | Pōhutukawa                | Kōtuku and the summer sun        | –                           | Kōkōwai   |
| 02  | Feb   | Mānuka                    | –                                | Korimako (bellbird)         | Kōkōwai   |
| 03  | Mar   | Toetoe                    | Full moon                        | Kuaka (godwits) departing   | –         |
| 04  | Apr   | Karaka                    | –                                | Kete of pipi, the wild card | Pounamu   |
| 05  | May   | Kahikatea                 | –                                | Ruru (morepork)             | Pounamu   |
| 06  | Jun   | Puriri                    | Matariki rising                  | –                           | –         |
| 07  | Jul   | Tawhai (beech) in snow    | –                                | Kea                         | Plain red |
| 08  | Aug   | Kōtukutuku (tree fuchsia) | Ua (rain), with a pepeketua frog | Pīwakawaka (fantail)        | Plain red |
| 09  | Sep   | Kōwhai                    | Kōwhai in full bloom             | –                           | Kōkōwai   |
| 10  | Oct   | Mamaku (black tree fern)  | –                                | Kiwi                        | Pounamu   |
| 11  | Nov   | Tī kōuka (cabbage tree)   | –                                | Wētā                        | Plain red |
| 12  | Dec   | Harakeke (flax)           | –                                | Tūī                         | Plain red |

**Counterparts in the Japanese deck:** the kōtuku is the crane, the full moon is the moon over pampas, Ua is the rain man, the kōwhai bloom is the cherry curtain, and Matariki takes the phoenix's place as the fifth bright. The kete is the sake cup, the kuaka are the geese, and the korimako is the bush warbler.

August's fourth card is the storm, the counterpart to the classic lightning card. June has three plain cards, as December does in the traditional deck.

## Yaku (scoring sets, koi-koi)

Point values follow common koi-koi rules. House rules vary.

| Yaku              | Traditional                             | Cards                                         | Points |
| ----------------- | --------------------------------------- | --------------------------------------------- | ------ |
| Five Brights      | Gokō                                    | Kōtuku, Full moon, Matariki, Ua, Kōwhai bloom | 10     |
| Four Brights      | Shikō                                   | Any 4 brights except Ua                       | 8      |
| Rainy Four        | Ame-shikō                               | 4 brights including Ua                        | 7      |
| Three Brights     | Sankō                                   | Any 3 brights except Ua                       | 5      |
| Kōwhai viewing    | Hanami-zake (cherry + sake)             | Kōwhai bloom + Kete of pipi                   | 5      |
| Moon viewing      | Tsukimi-zake (moon + sake)              | Full moon + Kete of pipi                      | 5      |
| Te Pō (the night) | Ino-shika-chō (boar, deer, butterflies) | Kiwi + Ruru + Wētā, all three nocturnal       | 5      |
| Kōkōwai           | Akatan (red poetry ribbons)             | Pōhutukawa, Mānuka and Kōwhai ribbons         | 5      |
| Pounamu           | Aotan (blue ribbons)                    | Karaka, Kahikatea and Mamaku ribbons          | 5      |
| Kōkōwai + Pounamu | Akatan-aotan                            | All six of the above                          | 10     |
| Animals           | Tane                                    | Any 5 animals (+1 each extra)                 | 1      |
| Ribbons           | Tan                                     | Any 5 ribbons (+1 each extra)                 | 1      |
| Plains            | Kasu                                    | Any 10 plains (+1 each extra)                 | 1      |

The kete of pipi is the wild card: like the sake cup, it can count as an animal or a plain. The te reo names (Te Pō, Kōkōwai, Pounamu, _tino pai_) should be checked by a fluent speaker before printing.

## Differences from a traditional deck

- **Brights move to fit NZ seasons.** The moon is in March (autumn), Matariki in June (the Māori New Year), the rain card in August (late winter) and the flower-viewing card in September (spring).
- **Pounamu replaces blue ribbons,** and kōkōwai (red ochre) replaces the red poetry ribbons. As in the real deck, two of the poetry ribbons carry the same phrase and one carries a place name. The mānuka and kōwhai ribbons read _tino pai_ ("very good"), standing in for あかよろし _akayoroshi_. The pōhutukawa ribbon reads _Te Araroa_, home of Te Waha o Rerekohu, the country's largest pōhutukawa, standing in for みよしの _Miyoshino_, the famous cherry-viewing place.
- **The wild card is a kete of pipi** instead of a sake cup. It counts as an animal or a plain, as the sake cup does.
- **Palette:** 14 flat colours shared across the deck, with foliage drawn as near-black silhouettes the way the classic cards draw pine.

## How it was made

The cards were generated as raster images with ChatGPT image generation, using a shared master style prompt and a classic Nintendo pine card as the style reference. Each card was reviewed against a consistency checklist, and some were fixed by editing or regenerating. They were then snapped to the deck palette, retouched by hand (the ninth Matariki star, the kete handles, removing leaf lines and the koru emblem, and filling the ribbon hole), and traced to SVG with VTracer. The ribbon inscriptions are set in Yuji Boku (SIL Open Font License) and converted to outlines.

## Known issues (v1)

- The Kuaka and Toetoe clump cards are due for regeneration: their plumes don't match the other March cards.
- Ribbon ties vary slightly between cards.
- The kete still reads a little like a basket rather than a soft flax bag.
