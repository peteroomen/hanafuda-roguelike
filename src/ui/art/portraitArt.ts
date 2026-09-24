/**
 * Painted portraits that replace a spirit's drawn one. Each image is square with a transparent
 * background; the drawn seasonal backdrop and frame stay, and the painting sits inside them.
 * Sources live in art-source/yokai/; the game ships 640px webp copies.
 */
import type { SpiritId } from '@/content/spirits';
import kasaObake from './portraits/kasaObake.webp';

/** A square window onto the image, in fractions of its width: centre and size. */
export interface Crop {
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
}

export interface PortraitArt {
  readonly src: string;
  /** For small portraits (the fight header, the shop): the face. */
  readonly close: Crop;
  /** For big portraits (intro, reward, the spirit sheet): the whole figure. */
  readonly full: Crop;
}

export type Framing = 'close' | 'full';

export const PORTRAIT_ART: Partial<Record<SpiritId, PortraitArt>> = {
  kasaObake: {
    src: kasaObake,
    close: { cx: 0.49, cy: 0.37, size: 0.56 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
};

/** The paintings as data URLs: an SVG shown through <img> can only embed images inline. */
const loaded = new Map<SpiritId, string>();

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('Could not read portrait'));
    r.readAsDataURL(blob);
  });
}

/** Load every painting. Portraits fall back to the drawn art until (or unless) this finishes. */
export async function loadPortraitArt(): Promise<void> {
  await Promise.all(
    Object.entries(PORTRAIT_ART).map(async ([id, art]) => {
      try {
        const res = await fetch(art.src);
        if (!res.ok) throw new Error(`${res.status} for ${art.src}`);
        loaded.set(id as SpiritId, await toDataUrl(await res.blob()));
      } catch (e) {
        console.warn(`Portrait for ${id} failed to load; using the drawn one.`, e);
      }
    }),
  );
}

export function paintedPortrait(
  id: SpiritId,
  framing: Framing,
): { readonly href: string; readonly crop: Crop } | null {
  const art = PORTRAIT_ART[id];
  const href = loaded.get(id);
  return art && href ? { href, crop: art[framing] } : null;
}
