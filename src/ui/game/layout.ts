/**
 * Where everything sits on the portrait stage (logical width 390, height ≥ 640).
 * Cards are positioned absolutely from these numbers and animate between them.
 */
import { CARDS, type CardId, TYPE_ORDER } from '@/content/cards';
import type { Seat } from '@/engine/types';
import { typeGroup, type Visual } from './visual';

export const STAGE_W = 390;
export const MIN_STAGE_H = 640;

/** Base card size (scale 1) — the field size. */
export const CARD_W = 56;
export const CARD_H = 92;

export interface Stage {
  readonly w: number;
  readonly h: number;
  readonly topBar: number;
  readonly spiritCapY: number;
  readonly fieldTop: number;
  readonly fieldX: number;
  readonly cols: number;
  readonly colStep: number;
  readonly rowStep: number;
  readonly rows: number;
  readonly fieldH: number;
  readonly pileX: number;
  readonly pileY: number;
  readonly trackerY: number;
  readonly playerCapY: number;
  readonly handY: number;
  readonly handScale: number;
  readonly bottomBarY: number;
  readonly fieldScale: number;
  /** Scale of the player's captured cards. */
  readonly capScale: number;
}

/** The opening deal fills a 4×2 grid; later cards add columns to the right. */
const BASE_COLS = 4;
/** Captured-card groups are separated by this gap (both lanes). */
const CAP_GAP = 10;

export function makeStage(h: number, fieldCount: number): Stage {
  const H = Math.max(MIN_STAGE_H, h);
  const bottomBar = 62;
  const tall = H >= 760;
  const handScale = tall ? 1.18 : 1.1;
  const handCardH = CARD_H * handScale;
  const bottomBarY = H - bottomBar;
  const handY = bottomBarY - handCardH - 12;
  // Both captured lanes use the same card size: they are the yaku in progress, yours and the
  // spirit's, and both need to be readable.
  const capScale = tall ? 0.62 : 0.52;
  const capH = CARD_H * capScale;
  const playerCapY = handY - capH - 18;
  const trackerY = playerCapY - 30;
  const topBar = 78;
  const spiritCapY = topBar + 2;
  // The spirit's lane, then its group counts underneath.
  const top = spiritCapY + capH + 20;
  const bottom = trackerY - 6;
  const avail = bottom - top;
  // Always two rows. Past eight cards the field grows extra columns, which squeeze together and
  // overlap (each card's month pip is on its left edge, so it stays readable).
  const rows = 2;
  const cols = Math.max(BASE_COLS, BASE_COLS + Math.ceil(Math.max(0, fieldCount - 8) / 2));
  const cardW0 = CARD_W * (tall ? 1.18 : 1.08);
  const cardH0 = CARD_H * (tall ? 1.18 : 1.08);
  // Shrink the field only if two rows can't fit (they can at 360×640; this is a safety net).
  const fit = Math.min(1, (avail - 6) / (cardH0 * 2));
  const fieldScale = (tall ? 1.18 : 1.08) * fit;
  const cardW = cardW0 * fit;
  const cardH = cardH0 * fit;
  const pileX = 12;
  const fieldLeft = pileX + cardW + 12;
  const fieldRight = STAGE_W - 8;
  const natural = cardW + (tall ? 9 : 8);
  const colStep = Math.min(natural, (fieldRight - fieldLeft - cardW) / (cols - 1));
  // Centre the columns in the space right of the draw pile.
  const fieldX =
    fieldLeft + Math.max(0, (fieldRight - fieldLeft - (colStep * (cols - 1) + cardW)) / 2);
  const rowStep = Math.min(cardH + 8, avail - cardH);
  const fieldH = rowStep * (rows - 1) + cardH;
  const fieldTop = top + Math.max(0, Math.min((avail - fieldH) * 0.4, 36));
  const pileY = fieldTop + rowStep / 2;
  return {
    w: STAGE_W,
    h: H,
    topBar,
    spiritCapY,
    fieldTop,
    fieldX,
    cols,
    colStep,
    rowStep,
    rows,
    fieldH,
    pileX,
    pileY,
    trackerY,
    playerCapY,
    handY,
    handScale,
    bottomBarY,
    fieldScale,
    capScale,
  };
}

export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly rot: number;
  readonly scale: number;
  readonly z: number;
  readonly faceUp: boolean;
  readonly interactive: boolean;
  /** Sits on another card (inside the draw pile): no drop shadow, or the shadows stack up. */
  readonly stacked?: boolean;
  /** Follows the finger: no transition. */
  readonly dragging?: boolean;
}

const MINI = 0.36;

/** Where the spirit keeps its hand, and where its captured lane stops. */
export const SPIRIT_HAND_X = 336;

/**
 * Slots 0–7 are the opening 4×2 grid, row by row. Later slots fill extra columns top then bottom,
 * so a card never jumps to a new row when the field grows.
 */
export function fieldSlotCell(slot: number): { col: number; row: number } {
  if (slot < BASE_COLS * 2) return { col: slot % BASE_COLS, row: Math.floor(slot / BASE_COLS) };
  const k = slot - BASE_COLS * 2;
  return { col: BASE_COLS + Math.floor(k / 2), row: k % 2 };
}

function fieldSlotPos(st: Stage, slot: number): { x: number; y: number } {
  const { col, row } = fieldSlotCell(slot);
  return { x: st.fieldX + col * st.colStep, y: st.fieldTop + row * st.rowStep };
}

const CAP_LEFT = 14;
const CAP_RIGHT = STAGE_W - 12;
/** The spirit's lane stops short of its hand stack. */
const SPIRIT_CAP_RIGHT = SPIRIT_HAND_X - 10;

/**
 * Captured groups (Brights, Animals, Ribbons, Chaff) sit side by side, each as wide as its cards
 * need. Cards in a group overlap by as little as the lane allows, so each card's face stays
 * readable; only a very full lane squeezes them. Both seats use the same layout and card size.
 */
export function capLayout(
  st: Stage,
  seat: Seat,
  counts: readonly number[],
): { starts: number[]; step: number } {
  const w = CARD_W * st.capScale;
  const right = seat === 0 ? CAP_RIGHT : SPIRIT_CAP_RIGHT;
  const overlaps = counts.reduce((a, n) => a + Math.max(0, n - 1), 0);
  const fixed = 4 * w + 3 * CAP_GAP;
  const room = right - CAP_LEFT - fixed;
  const step = Math.min(w * 0.64, overlaps > 0 ? room / overlaps : w);
  const starts: number[] = [];
  let x = CAP_LEFT;
  for (const n of counts) {
    starts.push(x);
    x += w + Math.max(0, n - 1) * step + CAP_GAP;
  }
  return { starts, step };
}

/** Top of a seat's captured lane. */
export function capY(st: Stage, seat: Seat): number {
  return seat === 0 ? st.playerCapY : st.spiritCapY;
}

export function capGroups(ids: readonly CardId[]): CardId[][] {
  const groups: CardId[][] = [[], [], [], []];
  for (const c of ids) (groups[typeGroup(c)] as CardId[]).push(c);
  return groups;
}

/** Horizontal groups for captured cards: Brights, Animals, Ribbons, Chaff. */
function capPos(st: Stage, v: Visual, seat: Seat, id: CardId): { x: number; y: number } {
  const groups = capGroups(v.cap[seat]);
  const g = typeGroup(id);
  const idx = (groups[g] as CardId[]).indexOf(id);
  const { starts, step } = capLayout(
    st,
    seat,
    groups.map((x) => x.length),
  );
  return { x: (starts[g] as number) + Math.max(0, idx) * step, y: capY(st, seat) };
}

/** The player's hand, as shown: by month (January first), then Bright, Animal, Ribbon, Chaff. */
export function sortHand(ids: readonly CardId[]): CardId[] {
  const key = (id: CardId) => {
    const c = CARDS[id];
    return c ? c.month * 10 + TYPE_ORDER[c.type] : id;
  };
  return ids.slice().sort((a, b) => key(a) - key(b) || a - b);
}

export function handPositions(n: number, st: Stage): { x: number; y: number; rot: number }[] {
  const w = CARD_W * st.handScale;
  const avail = STAGE_W - 20 - w;
  const step = n > 1 ? Math.min(w + 6, avail / (n - 1)) : 0;
  const total = step * (n - 1) + w;
  const x0 = (STAGE_W - total) / 2;
  const mid = (n - 1) / 2;
  const out: { x: number; y: number; rot: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = i - mid;
    out.push({ x: x0 + i * step, y: st.handY + d * d * 1.3, rot: d * 2.6 });
  }
  return out;
}

export interface LayoutOptions {
  readonly lifted: CardId | null;
  readonly selectable: boolean;
  /** A hand card being dragged: its top-left corner in stage coordinates. */
  readonly drag?: { readonly id: CardId; readonly x: number; readonly y: number } | null;
}

export function placements(v: Visual, st: Stage, opts: LayoutOptions): Map<CardId, Placement> {
  const out = new Map<CardId, Placement>();
  const moved = (id: CardId) => (v.moved[id] ?? 0) % 100000;
  // Pile: a neat stack with a little visible depth.
  v.pile.forEach((id, i) => {
    const depth = Math.min(4, v.pile.length - 1 - i);
    const peekIdx = v.peeked.indexOf(id);
    if (peekIdx >= 0) {
      out.set(id, {
        x: st.pileX + 2 + peekIdx * 8,
        y: st.pileY - 14 - peekIdx * 10,
        rot: -4 + peekIdx * 4,
        scale: 0.7,
        z: 300 + (3 - peekIdx),
        faceUp: true,
        interactive: false,
      });
      return;
    }
    out.set(id, {
      x: st.pileX - depth * 0.6,
      y: st.pileY - depth * 1.3,
      rot: 0,
      scale: st.fieldScale,
      z: 10 + i,
      faceUp: false,
      interactive: false,
      stacked: i > 0,
    });
  });
  // Spirit's hand: a small stack at the right of its lane (spread out if revealed).
  v.hand[1].forEach((id, i) => {
    const revealed = v.revealHand;
    out.set(id, {
      x: revealed ? 150 + i * 29 : SPIRIT_HAND_X + i * 2.2,
      y: revealed
        ? st.spiritCapY + CARD_H * st.capScale + 4
        : st.spiritCapY + (CARD_H * (st.capScale - MINI)) / 2 - i * 0.6,
      rot: revealed ? 0 : i % 2 ? 2 : -2,
      scale: revealed ? 0.46 : MINI,
      z: 200 + i,
      faceUp: revealed,
      interactive: false,
    });
  });
  // Player's hand: a fan, sorted by month.
  const hp = handPositions(v.hand[0].length, st);
  sortHand(v.hand[0]).forEach((id, i) => {
    const p = hp[i] as { x: number; y: number; rot: number };
    const lift = opts.lifted === id;
    if (opts.drag?.id === id) {
      out.set(id, {
        x: opts.drag.x,
        y: opts.drag.y,
        rot: 0,
        scale: st.handScale * 1.06,
        z: 1000,
        faceUp: true,
        interactive: opts.selectable,
        dragging: true,
      });
      return;
    }
    out.set(id, {
      x: p.x,
      y: lift ? p.y - 26 : p.y,
      rot: lift ? 0 : p.rot,
      scale: lift ? st.handScale * 1.06 : st.handScale,
      z: lift ? 900 : 500 + i,
      faceUp: true,
      interactive: opts.selectable,
    });
  });
  v.slots.forEach((id, slot) => {
    if (id === null) return;
    const p = fieldSlotPos(st, slot);
    out.set(id, {
      ...p,
      rot: 0,
      scale: st.fieldScale,
      z: 100 + slot,
      faceUp: true,
      interactive: true,
    });
  });
  for (const seat of [0, 1] as const) {
    v.cap[seat].forEach((id, i) => {
      const p = capPos(st, v, seat, id);
      out.set(id, {
        ...p,
        rot: 0,
        scale: seat === 0 ? st.capScale : MINI,
        z: 50 + i,
        faceUp: true,
        interactive: false,
      });
    });
  }
  // Transient zones.
  for (const [key, zone] of Object.entries(v.zone)) {
    const id = Number(key);
    if (
      out.has(id) &&
      zone.z !== 'held' &&
      zone.z !== 'flip' &&
      zone.z !== 'land' &&
      zone.z !== 'reveal'
    )
      continue;
    switch (zone.z) {
      case 'held': {
        if (zone.choosing) {
          // Waiting for a choice between two matches: it waits near where it came from, clear of
          // the field, then flies straight to the one chosen. A drawn card waits by the pile; a
          // played one just above your hand, or beside the spirit's hand.
          const s = st.fieldScale * (zone.from === 'hand' && zone.seat === 1 ? 0.8 : 1.06);
          const w = CARD_W * s;
          const pos =
            zone.from !== 'hand'
              ? { x: st.pileX + 2, y: st.pileY - 14 }
              : zone.seat === 0
                ? { x: (STAGE_W - w) / 2, y: st.handY - CARD_H * s * 0.55 }
                : { x: SPIRIT_HAND_X - w - 8, y: st.spiritCapY + 2 };
          out.set(id, {
            ...pos,
            rot: -3,
            scale: s,
            z: 950 + (moved(id) % 20),
            faceUp: true,
            interactive: false,
          });
          break;
        }
        const y = st.fieldTop + st.fieldH / 2 - CARD_H * 0.6;
        const x = st.fieldX + (st.colStep * (st.cols - 1)) / 2;
        out.set(id, {
          x,
          y: zone.seat === 0 ? y + 30 : y - 30,
          rot: -4,
          scale: 1.2,
          z: 950 + (moved(id) % 20),
          faceUp: true,
          interactive: false,
        });
        break;
      }
      case 'flip':
        out.set(id, {
          x: st.pileX + 12,
          y: st.pileY - 16,
          rot: 6,
          scale: 1.15,
          z: 960,
          faceUp: true,
          interactive: false,
        });
        break;
      case 'land': {
        const target = out.get(zone.on);
        const base = target ?? { x: st.fieldX, y: st.fieldTop };
        out.set(id, {
          x: base.x + 9,
          y: base.y + 12,
          rot: 7,
          scale: st.fieldScale,
          z: 700 + (moved(id) % 50),
          faceUp: true,
          interactive: false,
        });
        break;
      }
      case 'reveal':
        out.set(id, {
          x: STAGE_W / 2 - CARD_W,
          y: st.fieldTop + 10,
          rot: 0,
          scale: 2,
          z: 990,
          faceUp: true,
          interactive: false,
        });
        break;
      default:
        break;
    }
  }
  return out;
}

export function fieldSlotCount(v: Visual): number {
  return v.slots.length;
}
