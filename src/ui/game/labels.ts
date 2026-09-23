import { monthDef } from '@/content/cards';

const SHORT: Record<number, string> = {
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
  12: 'Kiri',
};

export function shortFlower(month: number): string {
  return SHORT[month] ?? monthDef(month as 1).flower;
}
