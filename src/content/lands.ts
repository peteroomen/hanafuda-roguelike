/**
 * Lands: the card sets a year can be played with, and the words that change with them.
 *
 * Text that names a yaku or a particular card is a LandText: a function of the land's Terms,
 * so "Tan needs only 4 Ribbons" reads "Rīpene needs only 4 Ribbons" in Aotearoa. Everything
 * else (spirits, charms, talismans, the shop) stays as it is in every land for now.
 */
import type { Land } from './cards';
import { type YakuId, yakuNames } from './yaku';

export interface LandDef {
  readonly id: Land;
  readonly name: string;
  readonly text: string;
}

export const LAND_DEFS: readonly LandDef[] = [
  { id: 'nippon', name: 'Nippon', text: 'The traditional hanafuda deck.' },
  {
    id: 'aotearoa',
    name: 'Aotearoa',
    text: 'Redrawn with New Zealand plants and birds. Te Reo names, and the months follow the NZ seasons.',
  },
];

export function landDef(land: Land): LandDef {
  return LAND_DEFS.find((l) => l.id === land) as LandDef;
}

/** The words a LandText can use. Card terms carry their article, so write `cap(t.rainMan)`. */
export interface Terms {
  readonly land: Land;
  /** Yaku names: Sankō / Mārama e Toru. */
  readonly y: Readonly<Record<YakuId, string>>;
  readonly rainMan: string;
  readonly lightning: string;
  readonly moon: string;
  readonly curtain: string;
  readonly sakeCup: string;
  readonly redPoetry: string;
  readonly blueRibbons: string;
  /** The land's birds, for Bird Whistle. */
  readonly birds: string;
}

const TERMS: Record<Land, Omit<Terms, 'land' | 'y'>> = {
  nippon: {
    rainMan: 'the Rain Man',
    lightning: 'the Lightning card',
    moon: 'the Full Moon',
    curtain: 'the Curtain',
    sakeCup: 'the Sake Cup',
    redPoetry: 'red poetry ribbons',
    blueRibbons: 'blue ribbons',
    birds: 'Crane, Warbler, Cuckoo, Geese, Swallow, Phoenix',
  },
  aotearoa: {
    rainMan: 'Ua',
    lightning: 'the Storm card',
    moon: 'the Full Moon',
    curtain: 'Kōwhai in Bloom',
    sakeCup: 'the Kete of Pipi',
    redPoetry: 'kōkōwai ribbons',
    blueRibbons: 'pounamu ribbons',
    birds: 'Kōtuku, Korimako, Kuaka, Ruru, Kea, Pīwakawaka, Kiwi, Tūī',
  },
};

export function terms(land: Land): Terms {
  return { land, y: yakuNames(land), ...TERMS[land] };
}

export type LandText = string | ((t: Terms) => string);

/** Render a LandText for a land. */
export function landText(text: LandText, land: Land): string {
  return typeof text === 'string' ? text : text(terms(land));
}

/** A LandText that is simply different in each land (a deck's name). */
export function byLand(values: Readonly<Record<Land, string>>): (t: Terms) => string {
  return (t) => values[t.land];
}

/** Capitalise the first letter: `${cap(t.rainMan)} no longer...`. */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
