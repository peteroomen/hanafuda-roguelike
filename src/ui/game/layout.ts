/**
 * Where everything sits on the portrait stage (logical width 390, height ≥ 640).
 * Cards are positioned absolutely from these numbers and animate between them.
 */
import type { CardId } from '@/content/cards';
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

export function makeStage(h: number, fieldCount: number): Stage {
  const H = Math.max(MIN_STAGE_H, h);
  const bottomBar = 62;
  const tall = H >= 760;
  const handScale = tall ? 1.18 : 1.1;
  const handCardH = CARD_H * handScale;
  const bottomBarY = H - bottomBar;
  const handY = bottomBarY - handCardH - 12;
  // The player's captured cards are the yaku in progress: keep them big enough to read.
  const capScale = tall ? 0.58 : 0.5;
  const playerCapY = handY - CARD_H * capScale - 18;
  const trackerY = playerCapY - 30;
  const topBar = 78;
  const spiritCapY = topBar + 2;
  const top = spiritCapY + 48;
  const bottom = trackerY - 10;
  const avail = bottom - top;
  // Tall phones get four big columns; compact phones five normal ones.
  const cols = tall ? 4 : 5;
  const fieldScale = tall ? 1.18 : 1;
  const cardW = CARD_W * fieldScale;
  const cardH = CARD_H * fieldScale;
  const colStep = cardW + (tall ? 9 : 5);
  const pileX = 12;
  const fieldX = tall ? pileX + cardW + 12 : 76;
  const rows = Math.max(2, Math.ceil(Math.max(fieldCount, 1) / cols));
  const natural = cardH + 8;
  const rowStep = Math.min(natural, rows > 1 ? (avail - cardH) / (rows - 1) : natural);
  const fieldH = rowStep * (rows - 1) + cardH;
  const fieldTop = top + Math.max(0, Math.min((avail - fieldH) * 0.4, 36));
  const pileRows = Math.min(rows, 2);
  const pileY = fieldTop + (rowStep * (pileRows - 1)) / 2;
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
}

const MINI = 0.36;

/** Where the spirit keeps its hand, and where its captured lane stops. */
export const SPIRIT_HAND_X = 336;

function fieldSlotPos(st: Stage, slot: number): { x: number; y: number } {
  const col = slot % st.cols;
  const row = Math.floor(slot / st.cols);
  return { x: st.fieldX + col * st.colStep, y: st.fieldTop + row * st.rowStep };
}

export const SPIRIT_CAP_STARTS = [12, 64, 128, 196];

const CAP_LEFT = 14;
const CAP_RIGHT = STAGE_W - 12;
const CAP_GAP = 10;

/**
 * The player's captured groups (Brights, Animals, Ribbons, Chaff) sit side by side, each as wide
 * as its cards need. Cards in a group overlap by as little as the lane allows, so each card's
 * face stays readable; only a very full lane squeezes them.
 */
export function playerCapLayout(
  st: Stage,
  counts: readonly number[],
): { starts: number[]; step: number } {
  const w = CARD_W * st.capScale;
  const overlaps = counts.reduce((a, n) => a + Math.max(0, n - 1), 0);
  const fixed = 4 * w + 3 * CAP_GAP;
  const room = CAP_RIGHT - CAP_LEFT - fixed;
  const step = Math.min(w * 0.64, overlaps > 0 ? room / overlaps : w);
  const starts: number[] = [];
  let x = CAP_LEFT;
  for (const n of counts) {
    starts.push(x);
    x += w + Math.max(0, n - 1) * step + CAP_GAP;
  }
  return { starts, step };
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
  const inGroup = groups[g] as CardId[];
  const idx = inGroup.indexOf(id);
  if (seat === 0) {
    const { starts, step } = playerCapLayout(
      st,
      groups.map((x) => x.length),
    );
    return { x: (starts[g] as number) + Math.max(0, idx) * step, y: st.playerCapY };
  }
  // The spirit's lane stays compact: its cards matter less than yours.
  const steps = [7, 6, 6, inGroup.length > 12 ? 4 : 6];
  return {
    x: (SPIRIT_CAP_STARTS[g] as number) + Math.max(0, idx) * (steps[g] as number),
    y: st.spiritCapY,
  };
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
    });
  });
  // Spirit's hand: a small stack at the right of its lane (spread out if revealed).
  v.hand[1].forEach((id, i) => {
    const revealed = v.revealHand;
    out.set(id, {
      x: revealed ? 150 + i * 29 : SPIRIT_HAND_X + i * 2.2,
      y: revealed ? st.spiritCapY + 44 : st.spiritCapY + 2 - i * 0.6,
      rot: revealed ? 0 : i % 2 ? 2 : -2,
      scale: revealed ? 0.46 : MINI,
      z: 200 + i,
      faceUp: revealed,
      interactive: false,
    });
  });
  // Player's hand: a fan.
  const hp = handPositions(v.hand[0].length, st);
  v.hand[0].forEach((id, i) => {
    const p = hp[i] as { x: number; y: number; rot: number };
    const lift = opts.lifted === id;
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
