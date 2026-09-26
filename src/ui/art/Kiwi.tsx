/**
 * The little kiwi: Aotearoa's mark wherever Nippon shows kanji as decoration (month and yaku
 * seals, deck seals, poems). Traced from the designer's kiwi; the eye is a hole, so it shows
 * whatever is behind. Drawn in the current text colour.
 */
import type { Land } from '@/content/cards';

/** The kiwi silhouette (even-odd fill), in the square box KIWI_VIEWBOX. */
export const KIWI_PATH =
  'M 259 81.0 C 208.6 84.4, 152.9 108.1, 106.5 145.8 C 58.4 185.0, 22.9 255.1, 22.8 311.5 C 22.6 372.0, 59.0 407.0, 133.5 418.1 C 147.3 420.2, 208.2 419.9, 227 417.6 C 255.9 414.2, 272.5 411.2, 286.6 406.9 C 351.3 387.0, 404.7 322.6, 420.9 245 C 422.9 235.3, 422.1 235.7, 433.5 238.4 C 463.1 245.2, 501.6 236.8, 519.2 219.7 C 538.5 200.9, 534.3 172.1, 508.5 146.6 C 475.9 114.3, 426.3 104.5, 396.1 124.4 C 393.2 126.4, 390.6 128, 390.3 128 C 390.0 128, 386.3 125.0, 382.1 121.4 C 347.3 91.4, 305.7 77.8, 259 81.0 M 473.5 190.9 C 467.9 193.2, 465.7 199.6, 468.9 204.7 C 472.7 210.8, 479.8 211.3, 484.4 205.8 C 490.9 198.0, 482.8 187.0, 473.5 190.9 M 498.5 254.7 C 494.1 256.4, 487.2 258.7, 483.2 259.6 C 475.1 261.5, 475.2 261.4, 479.0 269.1 C 486.5 283.9, 494.4 307.4, 507.5 353.6 C 512.7 372.2, 518.7 392.4, 520.7 398.5 L 524.4 409.5 525.2 397.5 C 526.8 374.1, 524.6 332.3, 520.4 306.1 C 517.7 289.5, 510.9 261.6, 507.6 254.1 L 506.5 251.4 498.5 254.7 M 246.7 436.7 C 242.4 437.6, 239 438.6, 239 439.0 C 239 439.4, 244.1 450.5, 250.5 463.6 L 262.0 487.5 230.4 488.3 C 213.0 488.8, 198.6 488.9, 198.3 488.7 C 198.1 488.4, 195.1 477.9, 191.7 465.3 C 188.4 452.7, 185.5 442.3, 185.3 442.1 C 185.0 441.6, 165.7 439.9, 165.3 440.3 C 165.2 440.4, 168.0 451.3, 171.5 464.4 C 175.1 477.6, 178 488.9, 178 489.5 C 178 490.3, 174.0 491.0, 166.7 491.6 L 155.5 492.5 155.7 498 C 156.2 510.1, 156.8 511.9, 159.8 511.4 C 165.4 510.5, 192.8 509.0, 225.3 507.8 C 264.4 506.5, 333.7 508.4, 352.1 511.4 C 355.0 511.9, 355.5 510.4, 356.2 497.5 L 356.5 492.5 350 491.7 C 344.5 491.1, 290.4 488.0, 285.2 487.9 C 283.9 487.9, 280.1 480.9, 271 461.5 C 260.6 439.6, 258.1 435.0, 256.5 435.1 C 255.4 435.2, 251.0 435.9, 246.7 436.7';
export const KIWI_VIEWBOX = '18 35 520 520';

export function Kiwi({ size = '1em', title }: { size?: number | string; title?: string }) {
  return (
    <svg
      className="kiwi"
      width={size}
      height={size}
      viewBox={KIWI_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={KIWI_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** A land's seal: the kanji in Nippon, the kiwi in Aotearoa. */
export function Seal({ land, kanji }: { land: Land; kanji: string }) {
  return land === 'aotearoa' ? <Kiwi /> : <>{kanji}</>;
}
