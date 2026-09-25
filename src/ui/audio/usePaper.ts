import { useEffect } from 'react';
import { paperRustle } from './audio';

/** A sheet or panel of paper being opened: a rustle when it first appears. */
export function usePaperOnOpen(): void {
  useEffect(() => {
    paperRustle();
  }, []);
}
