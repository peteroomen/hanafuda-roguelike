/**
 * Turns the generated SVG art into cached object URLs for <img> tags, so each
 * face is parsed and rasterised once.
 */
import { CARDS, type CardId, type Month, type Season } from '@/content/cards';
import type { SpiritId } from '@/content/spirits';
import { cardBackSvg, cardFaceSvg } from './cards';
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

export function cardFaceUrl(id: CardId): string {
  return url(`face:${id}`, () => cardFaceSvg(id));
}

/** What a Kitsune disguise shows: a chaff of the false month. */
export function disguiseUrl(month: Month): string {
  const chaff = CARDS.find((c) => c.month === month && c.type === 'chaff');
  return cardFaceUrl(chaff ? chaff.id : 0);
}

export function cardBackUrl(hue = 0): string {
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
  return url('rainman', rainManSvg);
}

/** Decode every card face up front so nothing flashes in during play. */
export async function preloadCards(): Promise<void> {
  const jobs = CARDS.map((c) => {
    const img = new Image();
    img.src = cardFaceUrl(c.id);
    return img.decode().catch(() => undefined);
  });
  const back = new Image();
  back.src = cardBackUrl();
  jobs.push(back.decode().catch(() => undefined));
  await Promise.all(jobs);
}
