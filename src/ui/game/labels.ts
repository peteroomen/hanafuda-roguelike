import { type Land, monthDef } from '@/content/cards';

/** Short flower names for the month label drawn on each card (training wheels). */
const SHORT: Record<Land, Record<number, string>> = {
  nippon: {
    1: 'Pine',
    2: 'Plum',
    3: 'Cherry',
    4: 'Wisteria',
    5: 'Iris',
    6: 'Peony',
    7: 'Clover',
    8: 'Susuki',
    9: 'Mum',
    10: 'Maple',
    11: 'Willow',
    12: 'Paulownia',
  },
  // Aotearoa's flowers are already their own short names.
  aotearoa: {},
};

export function shortFlower(month: number, land: Land): string {
  return SHORT[land][month] ?? monthDef(month as 1, land).flower;
}
