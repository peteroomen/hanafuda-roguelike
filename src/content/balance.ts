/**
 * Run-level balance numbers. Tuned with the simulator (see docs/balance/).
 */

export interface Balance {
  readonly playerHp: number;
  readonly startMon: number;
  /** Regular spirit HP by month (index 0 = month 1). */
  readonly monthHp: readonly number[];
  /** Spirit ferocity by month: its hit = its yaku points × ferocity. */
  readonly monthFerocity: readonly number[];
  readonly bossHp: number;
  readonly bossFerocity: number;
  /**
   * Early-year easing for human players: multiplies spirit HP and ferocity by month
   * (index 0 = month 1). 1 = full strength.
   */
  readonly monthEase: readonly number[];
  /**
   * Chance, by month, that a spirit slips and plays its second-best move instead of its best.
   * Spirits play well, not perfectly; they are sloppier early in the year.
   */
  readonly spiritSlip: readonly number[];
  /** A spirit's ferocity grows by this fraction for every hand after the first in a fight. */
  readonly handFerocityGrowth: number;
  /** The player's koi-koi multiplies the spirit's hit by this (standard: 2). */
  readonly koikoiPunish: number;
  readonly reward: {
    readonly base: readonly number[];
    readonly boss: number;
    /** Bonus for winning a fight in its first hand. */
    readonly swift: number;
    readonly interestPer: number;
    readonly interestCap: number;
  };
  readonly shop: {
    readonly charmOffers: number;
    readonly rerollBase: number;
    readonly rerollStep: number;
    readonly healFraction: number;
    readonly healPrice: number;
    readonly rarityWeights: {
      readonly common: number;
      readonly uncommon: number;
      readonly rare: number;
    };
    /** Chance each shop has a second talisman offer. */
    readonly extraOfudaChance: number;
  };
  /** Fraction of missing HP restored after defeating a boss. */
  readonly bossHeal: number;
  /** Fraction of missing HP restored after every other fight. */
  readonly fightHeal: number;
  readonly guided: {
    readonly month1Hp: number;
    readonly month2Hp: number;
    readonly month3HpMult: number;
    /** HP the player loses whenever the spirit captures in month 1. */
    readonly captureSting: number;
  };
}

export const BALANCE: Balance = {
  playerHp: 80,
  startMon: 4,
  // Tuned 2026-09-25 (see docs/balance/): spirits have 28% less HP than v1.0 and hit about twice
  // as hard early in the year (1.15× by December), so fights are short and every hit matters.
  monthHp: [72, 108, 151, 202, 266, 346, 446, 576, 720, 900, 1116, 1368],
  monthFerocity: [1.9, 1.9, 2.12, 2.2, 2.28, 2.34, 2.39, 2.42, 2.51, 2.51, 2.56, 2.59],
  bossHp: 1.35,
  bossFerocity: 1.25,
  monthEase: [0.75, 0.75, 0.75, 0.75, 0.82, 0.9, 1, 1, 1, 1, 1, 1],
  spiritSlip: [0.3, 0.3, 0.25, 0.22, 0.18, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.05],
  handFerocityGrowth: 0.2,
  koikoiPunish: 2,
  reward: {
    base: [4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8],
    boss: 3,
    swift: 2,
    interestPer: 5,
    interestCap: 5,
  },
  shop: {
    charmOffers: 3,
    rerollBase: 2,
    rerollStep: 1,
    healFraction: 0.35,
    healPrice: 3,
    rarityWeights: { common: 60, uncommon: 32, rare: 8 },
    extraOfudaChance: 0.35,
  },
  bossHeal: 0.55,
  fightHeal: 0.15,
  guided: { month1Hp: 60, month2Hp: 40, month3HpMult: 0.75, captureSting: 1 },
};
