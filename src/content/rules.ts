/**
 * Every rule value the balance simulator may tune. Nothing here is logic.
 */
import type { CardType } from './cards';

export type KoiKoiStakeMode = 'multiplicative' | 'additive';

export interface RuleSet {
  handSize: number;
  fieldSize: number;
  /** Chip value of each card type when it is part of a scoring yaku. */
  chips: Record<CardType, number>;
  /** The sake cup also counts as Chaff toward Kasu. */
  sakeCupIsChaff: boolean;
  /** Tsukifuda (all four cards of the current month) is live. */
  tsukifuda: boolean;
  /** Yaku points at or above this threshold double the base mult (0 disables). */
  sevenPlusThreshold: number;
  /** A stop made after the opponent has called koi-koi doubles the base mult. */
  opponentKoiKoiDoubles: boolean;
  /**
   * The stake the stopper earns for their own koi-koi calls, applied as a final
   * ×mult: multiplicative → factor^calls, additive → 1 + (factor - 1) × calls.
   */
  koiKoiStake: { mode: KoiKoiStakeMode; factor: number };
  /** How much one koi-koi call adds to the call counter (a boss may raise this). */
  koiKoiCallWeight: number;
  /** Redeal when four cards of one month land on the initial field. */
  redealOnFourOnField: boolean;
  /** Redeal attempts before accepting a four-of-a-month field. */
  maxRedeals: number;
  /** Points awarded to the leader when a hand runs out with no stop (0 = none). */
  exhaustedHandAward: number;
}

export const DEFAULT_RULES: RuleSet = {
  handSize: 8,
  fieldSize: 8,
  chips: { bright: 20, animal: 10, ribbon: 5, chaff: 1 },
  sakeCupIsChaff: true,
  tsukifuda: false,
  sevenPlusThreshold: 7,
  opponentKoiKoiDoubles: true,
  koiKoiStake: { mode: 'multiplicative', factor: 2 },
  koiKoiCallWeight: 1,
  redealOnFourOnField: true,
  maxRedeals: 25,
  exhaustedHandAward: 0,
};

export function withRules(base: RuleSet, patch: Partial<RuleSet>): RuleSet {
  return {
    ...base,
    ...patch,
    chips: { ...base.chips, ...(patch.chips ?? {}) },
    koiKoiStake: { ...base.koiKoiStake, ...(patch.koiKoiStake ?? {}) },
  };
}
