/**
 * Painted portraits that replace a spirit's drawn one. Each image is square with a transparent
 * background; the drawn seasonal backdrop and frame stay, and the painting sits inside them.
 * Sources live in art-source/yokai/; the game ships 512px webp copies.
 */
import type { SpiritId } from '@/content/spirits';
import kasaObake from './portraits/kasaObake.webp';
import kappa from './portraits/kappa.webp';
import kitsune from './portraits/kitsune.webp';
import namazu from './portraits/namazu.webp';
import nue from './portraits/nue.webp';
import oni from './portraits/oni.webp';
import yukiOnna from './portraits/yukiOnna.webp';
import bakeneko from './portraits/bakeneko.webp';
import chochinObake from './portraits/chochinObake.webp';
import hitotsumeKozo from './portraits/hitotsumeKozo.webp';
import ittanMomen from './portraits/ittanMomen.webp';
import kamaitachi from './portraits/kamaitachi.webp';
import kawauso from './portraits/kawauso.webp';
import nopperabo from './portraits/nopperabo.webp';
import rokurokubi from './portraits/rokurokubi.webp';
import yamauba from './portraits/yamauba.webp';
import zashikiWarashi from './portraits/zashikiWarashi.webp';
import kodama from './portraits/kodama.webp';
import rainMan from './portraits/rainMan.webp';
import tanuki from './portraits/tanuki.webp';
import tengu from './portraits/tengu.webp';

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

/** The Rain Man is the guide, not a spirit, but his portrait works the same way. */
export type PortraitId = SpiritId | 'rainMan';

export const PORTRAIT_ART: Partial<Record<PortraitId, PortraitArt>> = {
  oni: {
    src: oni,
    close: { cx: 0.5, cy: 0.3, size: 0.5 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  yukiOnna: {
    src: yukiOnna,
    close: { cx: 0.55, cy: 0.3, size: 0.5 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  nue: {
    src: nue,
    close: { cx: 0.42, cy: 0.35, size: 0.5 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kappa: {
    src: kappa,
    close: { cx: 0.5, cy: 0.3, size: 0.55 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  namazu: {
    src: namazu,
    close: { cx: 0.5, cy: 0.42, size: 0.62 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kitsune: {
    src: kitsune,
    close: { cx: 0.5, cy: 0.25, size: 0.5 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  rokurokubi: {
    src: rokurokubi,
    close: { cx: 0.7, cy: 0.36, size: 0.52 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  yamauba: {
    src: yamauba,
    close: { cx: 0.7, cy: 0.37, size: 0.6 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kamaitachi: {
    src: kamaitachi,
    close: { cx: 0.72, cy: 0.54, size: 0.6 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  nopperabo: {
    src: nopperabo,
    close: { cx: 0.5, cy: 0.38, size: 0.6 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  bakeneko: {
    src: bakeneko,
    close: { cx: 0.5, cy: 0.27, size: 0.56 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  ittanMomen: {
    src: ittanMomen,
    close: { cx: 0.72, cy: 0.26, size: 0.56 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  hitotsumeKozo: {
    src: hitotsumeKozo,
    close: { cx: 0.52, cy: 0.36, size: 0.62 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kawauso: {
    src: kawauso,
    close: { cx: 0.56, cy: 0.28, size: 0.55 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  chochinObake: {
    src: chochinObake,
    close: { cx: 0.52, cy: 0.42, size: 0.7 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  zashikiWarashi: {
    src: zashikiWarashi,
    close: { cx: 0.5, cy: 0.32, size: 0.58 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kodama: {
    src: kodama,
    close: { cx: 0.54, cy: 0.46, size: 0.56 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  tanuki: {
    src: tanuki,
    close: { cx: 0.51, cy: 0.33, size: 0.58 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  tengu: {
    src: tengu,
    close: { cx: 0.52, cy: 0.3, size: 0.62 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  rainMan: {
    src: rainMan,
    close: { cx: 0.56, cy: 0.42, size: 0.64 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
  kasaObake: {
    src: kasaObake,
    close: { cx: 0.49, cy: 0.37, size: 0.56 },
    full: { cx: 0.5, cy: 0.5, size: 1.02 },
  },
};

/** The paintings as data URLs: an SVG shown through <img> can only embed images inline. */
const loaded = new Map<PortraitId, string>();

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
        loaded.set(id as PortraitId, await toDataUrl(await res.blob()));
      } catch (e) {
        console.warn(`Portrait for ${id} failed to load; using the drawn one.`, e);
      }
    }),
  );
}

export function paintedPortrait(
  id: PortraitId,
  framing: Framing,
): { readonly href: string; readonly crop: Crop } | null {
  const art = PORTRAIT_ART[id];
  const href = loaded.get(id);
  return art && href ? { href, crop: art[framing] } : null;
}
