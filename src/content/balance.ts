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
  playerHp: 60,
  startMon: 4,
  monthHp: [100, 150, 210, 280, 370, 480, 620, 800, 1000, 1250, 1550, 1900],
  monthFerocity: [1, 1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.1, 2.3, 2.5],
  bossHp: 1.35,
  bossFerocity: 1.25,
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
  bossHeal: 0.6,
  fightHeal: 0.2,
  guided: { month1Hp: 45, month2Hp: 40, month3HpMult: 0.75, captureSting: 1 },
};
