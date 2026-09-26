/**
 * Turns the generated SVG art into cached object URLs for <img> tags, so each
 * face is parsed and rasterised once.
 */
import { card, type CardId, type Land, landCards, type Month, type Season } from '@/content/cards';
import type { SpiritId } from '@/content/spirits';
import { aotearoaBackSvg, cardBackSvg, cardFaceSvg } from './cards';
import { getState } from '@/ui/state/store';
import { type Framing, paintedPortrait } from './portraitArt';
import { rainManSvg, spiritSvg } from './spirits';

const cache = new Map<string, string>();

function url(key: string, make: () => string): string {
  let u = cache.get(key);
  if (!u) {
    const svg = make();
    try {
      u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    } catch {
      u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
    cache.set(key, u);
  }
  return u;
}

/** The traditional deck: black-bordered hanafuda from Wikimedia Commons, as 320px webp. */
function traditional(file: string): string {
  return `${import.meta.env.BASE_URL}cards/traditional/${file}.webp`;
}

/** The Aotearoa deck, drawn for this game: 320px webp by position in the land (0..47). */
function aotearoa(index: number): string {
  return `${import.meta.env.BASE_URL}cards/aotearoa/${index}.webp`;
}

export function cardFaceUrl(id: CardId): string {
  const c = card(id);
  if (c.land === 'aotearoa') return aotearoa(id - (landCards('aotearoa')[0]?.id ?? 0));
  if (getState().settings.cardStyle === 'traditional') return traditional(String(id));
  return url(`face:${id}`, () => cardFaceSvg(id));
}

/** What a Kitsune disguise shows: a chaff of the false month, from the land's deck. */
export function disguiseUrl(month: Month, land: Land): string {
  const cards = landCards(land);
  const chaff = cards.find((c) => c.month === month && c.type === 'chaff') ?? cards[0];
  return cardFaceUrl(chaff?.id ?? 0);
}

/**
 * Nippon's two face styles share the drawn back (the traditional one is plain black and vanishes
 * on the table). Aotearoa has its own. Both take the deck's accent hue.
 */
export function cardBackUrl(hue: number, land: Land): string {
  if (land === 'aotearoa') return url(`back:aotearoa:${hue}`, () => aotearoaBackSvg(hue));
  return url(`back:${hue}`, () => cardBackSvg(hue));
}

export function spiritUrl(
  id: SpiritId,
  season: Season,
  boss: boolean,
  framing: Framing = 'close',
): string {
  const art = paintedPortrait(id, framing);
  if (!art) return url(`spirit:${id}:${season}`, () => spiritSvg(id, season, boss));
  return url(`spirit:${id}:${season}:${framing}`, () => spiritSvg(id, season, boss, art));
}

export function rainManUrl(): string {
  const art = paintedPortrait('rainMan', 'close');
  if (art) return url('rainman:art', () => rainManSvg(art));
  return url('rainman', () => rainManSvg());
}

/** Decode every card face up front so nothing flashes in during play. */
export async function preloadCards(land: Land): Promise<void> {
  const jobs = landCards(land).map((c) => {
    const img = new Image();
    img.src = cardFaceUrl(c.id);
    return img.decode().catch(() => undefined);
  });
  const back = new Image();
  back.src = cardBackUrl(0, land);
  jobs.push(back.decode().catch(() => undefined));
  await Promise.all(jobs);
}
