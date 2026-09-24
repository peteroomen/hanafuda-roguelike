import type { CardId, Month } from '@/content/cards';
import type { YakuId } from '@/content/yaku';

export type Seat = 0 | 1;

export const PLAYER: Seat = 0;
export const SPIRIT: Seat = 1;

export function other(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export type EnhancementId =
  'gilded' | 'lacquered' | 'inked' | 'torn' | 'blessed' | 'moonlit' | 'lucky';

/**
 * Rule-changing modifiers to yaku detection, per seat. Omamori and bosses write
 * these; detection only reads them.
 */
export interface YakuMods {
  readonly disabled: readonly YakuId[];
  /** Override the number of cards a yaku needs (e.g. Tan with 4 ribbons). */
  readonly need: Partial<Record<YakuId, number>>;
  /** The Rain Man weakens Bright yaku (standard). */
  readonly rainManPenalty: boolean;
  /** The Full Moon also counts as the Curtain for Flower Viewing. */
  readonly moonIsCurtain: boolean;
  /** The Lightning card also counts as a Bright. */
  readonly lightningIsBright: boolean;
}

export const DEFAULT_YAKU_MODS: YakuMods = {
  disabled: [],
  need: {},
  rainManPenalty: true,
  moonIsCurtain: false,
  lightningIsBright: false,
};

export interface YakuHit {
  readonly id: YakuId;
  readonly points: number;
  /** Cards that make up this yaku (including extras that raised its points). */
  readonly cards: readonly CardId[];
  readonly extra: number;
}

export type { CardId, Month, YakuId };
