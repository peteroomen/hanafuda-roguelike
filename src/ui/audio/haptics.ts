/**
 * Haptics via the Vibration API (Android browsers; iOS Safari ignores it).
 */
import { getState } from '@/ui/state/store';

function buzz(pattern: number | number[]): void {
  if (!getState().settings.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported.
  }
}

export const haptics = {
  tap: () => buzz(8),
  play: () => buzz(14),
  capture: () => buzz([22, 30, 18]),
  yaku: () => buzz([30, 40, 30, 40, 60]),
  koikoi: () => buzz([60, 50, 60]),
  hurt: () => buzz([80, 40, 120]),
  strike: () => buzz([40, 30, 90]),
};
