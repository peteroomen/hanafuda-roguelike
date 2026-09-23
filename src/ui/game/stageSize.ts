import { useEffect, useState } from 'react';
import { MIN_STAGE_H, STAGE_W } from './layout';

interface Size {
  readonly scale: number;
  readonly h: number;
  readonly left: number;
  readonly top: number;
}

let probe: HTMLDivElement | null = null;

/** Safe-area insets (notches, home indicators) in CSS pixels. */
function insets(): { top: number; bottom: number } {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
}

function measure(): Size {
  const vw = window.innerWidth;
  const inset = insets();
  const vh = window.innerHeight - inset.top - inset.bottom;
  let scale = Math.min(vw / STAGE_W, 1.4);
  if (vh / scale < MIN_STAGE_H) scale = vh / MIN_STAGE_H;
  const h = vh / scale;
  return { scale, h, left: (vw - STAGE_W * scale) / 2, top: inset.top };
}

export function useStageSize(): Size {
  const [size, setSize] = useState(measure);
  useEffect(() => {
    const on = () => setSize(measure());
    window.addEventListener('resize', on);
    window.visualViewport?.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      window.visualViewport?.removeEventListener('resize', on);
    };
  }, []);
  return size;
}
