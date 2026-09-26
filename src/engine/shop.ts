/**
 * Shop generation and pricing. Pure; seeded from the run.
 */
import { BALANCE } from '@/content/balance';
import { deckDef, omenEffects } from '@/content/decks';
import { ENHANCEMENTS } from '@/content/enhancements';
import { OFUDA, ofudaDef, type OfudaId } from '@/content/ofuda';
import { OMAMORI, omamoriDef, type OmamoriId } from '@/content/omamori';
import { YAKU, type YakuId } from '@/content/yaku';
import { deriveSeed, Rng } from './rng';
import type { EnhancementId } from './types';

export type ShopOffer =
  | { readonly kind: 'omamori'; readonly id: OmamoriId; readonly sold: boolean }
  | { readonly kind: 'ofuda'; readonly id: OfudaId; readonly sold: boolean }
  | { readonly kind: 'poem'; readonly id: YakuId; readonly sold: boolean };

export interface ShopState {
  offers: ShopOffer[];
  rerolls: number;
  healUsed: boolean;
  shrine: { readonly enhancement: EnhancementId; used: boolean };
}

export interface ShopContext {
  readonly seed: number;
  readonly month: number;
  readonly owned: readonly OmamoriId[];
  /** Charms not yet unlocked; never offered. */
  readonly locked?: readonly OmamoriId[];
  readonly deckId: Parameters<typeof deckDef>[0];
  readonly omen: number;
  readonly discount: number;
}

/** Relative likelihood of each yaku's Poem showing up. Common yaku are offered more. */
const POEM_WEIGHT: Partial<Record<YakuId, number>> = {
  kasu: 5,
  tan: 5,
  tane: 5,
  akatan: 3,
  aotan: 3,
  inoshikacho: 3,
  tsukimi: 3,
  hanami: 3,
  sanko: 3,
  akaao: 1,
  shiko: 1,
  ameShiko: 1,
  goko: 0.5,
  tsukifuda: 2,
};

function rollCharms(
  rng: Rng,
  owned: readonly OmamoriId[],
  locked: readonly OmamoriId[],
  count: number,
): OmamoriId[] {
  const w = BALANCE.shop.rarityWeights;
  const out: OmamoriId[] = [];
  for (let i = 0; i < count; i++) {
    const pool = OMAMORI.filter(
      (d) => !owned.includes(d.id) && !locked.includes(d.id) && !out.includes(d.id),
    );
    if (!pool.length) break;
    const pick = rng.weighted(pool, (d) => w[d.rarity]);
    out.push(pick.id);
  }
  return out;
}

export function rollOffers(ctx: ShopContext, rerolls: number): ShopOffer[] {
  const rng = new Rng(deriveSeed(ctx.seed, `shop:${ctx.month}:${rerolls}`));
  const charms = rollCharms(rng, ctx.owned, ctx.locked ?? [], BALANCE.shop.charmOffers).map(
    (id) => ({ kind: 'omamori', id, sold: false }) as const,
  );
  const poem = rng.weighted(YAKU, (y) => POEM_WEIGHT[y.id] ?? 1);
  const ofudaA = rng.pick(OFUDA);
  const offers: ShopOffer[] = [
    ...charms,
    { kind: 'poem', id: poem.id, sold: false },
    { kind: 'ofuda', id: ofudaA.id, sold: false },
  ];
  if (rng.next() < BALANCE.shop.extraOfudaChance) {
    const rest = OFUDA.filter((o) => o.id !== ofudaA.id);
    offers.push({ kind: 'ofuda', id: rng.pick(rest).id, sold: false });
  }
  return offers;
}

export function newShop(ctx: ShopContext): ShopState {
  const rng = new Rng(deriveSeed(ctx.seed, `shrine:${ctx.month}`));
  const weights = { common: 6, uncommon: 3, rare: 1 } as const;
  const enh = rng.weighted(ENHANCEMENTS, (e) => weights[e.rarity]);
  return {
    offers: rollOffers(ctx, 0),
    rerolls: 0,
    healUsed: false,
    shrine: { enhancement: enh.id, used: false },
  };
}

export function applyDiscount(price: number, discount: number, omen: number): number {
  const withOmen = price + omenEffects(omen).priceDelta;
  return Math.max(1, Math.round(withOmen * (1 - discount)));
}

export function offerPrice(
  offer: ShopOffer,
  ctx: Pick<ShopContext, 'deckId' | 'omen' | 'discount'>,
): number {
  let base: number;
  switch (offer.kind) {
    case 'omamori':
      base = omamoriDef(offer.id).price;
      break;
    case 'ofuda':
      base = ofudaDef(offer.id).price - (deckDef(ctx.deckId).modifiers?.ofudaDiscount ?? 0);
      break;
    case 'poem':
      base = deckDef(ctx.deckId).modifiers?.poemPrice ?? 3;
      break;
  }
  return applyDiscount(base, ctx.discount, ctx.omen);
}

export function rerollPrice(rerolls: number, ctx: Pick<ShopContext, 'omen' | 'discount'>): number {
  return applyDiscount(
    BALANCE.shop.rerollBase + rerolls * BALANCE.shop.rerollStep,
    ctx.discount,
    ctx.omen,
  );
}

export function healPrice(ctx: Pick<ShopContext, 'omen' | 'discount'>): number {
  return applyDiscount(BALANCE.shop.healPrice, ctx.discount, ctx.omen);
}

export function shrinePrice(
  enh: EnhancementId,
  ctx: Pick<ShopContext, 'omen' | 'discount'>,
): number {
  const def = ENHANCEMENTS.find((e) => e.id === enh);
  return applyDiscount(def?.price ?? 4, ctx.discount, ctx.omen);
}

export function sellPrice(id: OmamoriId): number {
  return Math.max(1, Math.floor(omamoriDef(id).price / 2));
}
