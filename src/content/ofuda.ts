/**
 * Ofuda (talismans): one-shot tactical effects, held in two slots and used on
 * your turn before you play a card. Numbers are data; effects are applied by
 * @/engine/run.
 */

export type OfudaId =
  | 'peek'
  | 'swap'
  | 'downpour'
  | 'frog'
  | 'foxMask'
  | 'warmSake'
  | 'windCharm'
  | 'taiko'
  | 'goldLeaf';

export type OfudaTarget = 'none' | 'handCard' | 'handAndField';

export interface OfudaDef {
  readonly id: OfudaId;
  readonly name: string;
  readonly kanji: string;
  readonly text: string;
  readonly price: number;
  readonly target: OfudaTarget;
  /** Can be used outside a hand (e.g. in the shop). */
  readonly anytime: boolean;
  readonly amount?: number;
  readonly motif: string;
}

export const OFUDA: readonly OfudaDef[] = [
  {
    id: 'peek',
    name: 'Far Sight',
    kanji: '遠見',
    text: 'Reveal the top 3 cards of the draw pile.',
    price: 3,
    target: 'none',
    anytime: false,
    amount: 3,
    motif: 'eye',
  },
  {
    id: 'swap',
    name: 'Switch',
    kanji: '入替',
    text: 'Trade a card in your hand for a card on the field.',
    price: 3,
    target: 'handAndField',
    anytime: false,
    motif: 'swap',
  },
  {
    id: 'downpour',
    name: 'Downpour',
    kanji: '夕立',
    text: 'Wash the field back into the deck and lay a fresh one.',
    price: 3,
    target: 'none',
    anytime: false,
    motif: 'rain',
  },
  {
    id: 'frog',
    name: 'Frog',
    kanji: '蛙',
    text: 'Your next flip: keep it, or leap to the next card.',
    price: 3,
    target: 'none',
    anytime: false,
    motif: 'frog',
  },
  {
    id: 'foxMask',
    name: 'Fox Mask',
    kanji: '狐面',
    text: "See the spirit's hand for the rest of this hand.",
    price: 3,
    target: 'none',
    anytime: false,
    motif: 'fox',
  },
  {
    id: 'warmSake',
    name: 'Warm Sake',
    kanji: '燗酒',
    text: 'Restore 12 HP.',
    price: 3,
    target: 'none',
    anytime: true,
    amount: 12,
    motif: 'tokkuri',
  },
  {
    id: 'windCharm',
    name: 'Wind Charm',
    kanji: '風守',
    text: "The spirit's next flip blows away. It gets no flip on its next turn.",
    price: 3,
    target: 'none',
    anytime: false,
    motif: 'wind',
  },
  {
    id: 'taiko',
    name: 'Taiko Drum',
    kanji: '太鼓',
    text: 'Your next stop this fight deals ×2 damage.',
    price: 4,
    target: 'none',
    anytime: false,
    amount: 2,
    motif: 'drum',
  },
  {
    id: 'goldLeaf',
    name: 'Gold Leaf',
    kanji: '金箔',
    text: 'Gild a card in your hand for the rest of the year (+20 Chips when it scores).',
    price: 4,
    target: 'handCard',
    anytime: false,
    motif: 'leaf',
  },
];

const BY_ID = new Map<OfudaId, OfudaDef>(OFUDA.map((d) => [d.id, d]));

export function ofudaDef(id: OfudaId): OfudaDef {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown ofuda ${id}`);
  return d;
}

export const OFUDA_IDS: readonly OfudaId[] = OFUDA.map((d) => d.id);
