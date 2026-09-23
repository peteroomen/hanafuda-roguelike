/**
 * Original card faces for all 48 cards, drawn as SVG strings (viewBox 100×164).
 * Inspired by the traditional 19th-century motifs; no modern deck is copied.
 */
import { CARDS, type CardId } from '@/content/cards';
import {
  artRng,
  blossom,
  branch,
  circle,
  el,
  ellipse,
  g,
  INK,
  INK_THIN,
  leaf,
  maple,
  n,
  P,
  path,
  pineCluster,
  polygon,
  rect,
  tanzaku,
} from './svg';

export const CARD_W = 100;
export const CARD_H = 164;

type Kind = 'bright' | 'animal' | 'ribbon' | 'chaff1' | 'chaff2' | 'chaff3';

function kindOf(id: CardId): Kind {
  const c = CARDS[id];
  if (!c) return 'chaff1';
  if (c.type === 'chaff') return `chaff${Math.min(3, c.variant)}` as Kind;
  return c.type;
}

// ---------------------------------------------------------------------------
// Backgrounds

const skyBand = (y: number, h: number, color: string) => rect(-2, y, 104, h, { fill: color });

function cloudBand(y: number, color: string, seed: number): string {
  const r = artRng(seed);
  let d = `M-2,${y}`;
  for (let x = -2; x <= 104; x += 14) d += ` q7,${n(-6 - r() * 5)} 14,0`;
  d += ` L104,${y + 40} L-2,${y + 40}Z`;
  return path(d, { fill: color });
}

// ---------------------------------------------------------------------------
// January: Pine

function pine(kind: Kind): string {
  const dark = P.greenDeep;
  const light = P.greenLight;
  let out = '';
  if (kind === 'bright') {
    out += circle(50, 50, 31, { fill: P.red, ...INK });
    out += circle(50, 50, 24, { fill: 'rgba(255,255,255,0.08)' });
    out += branch(
      [
        [6, 170],
        [22, 140],
        [42, 128],
        [70, 118],
        [98, 110],
      ],
      6,
      P.brownLight,
    );
    out +=
      pineCluster(18, 150, 17, dark, light) +
      pineCluster(46, 136, 15, dark, light) +
      pineCluster(84, 124, 16, dark, light);
    out += crane(52, 104);
  } else if (kind === 'ribbon') {
    out += branch(
      [
        [10, 170],
        [30, 120],
        [58, 92],
        [92, 70],
      ],
      6,
      P.brownLight,
    );
    out += branch(
      [
        [40, 108],
        [30, 84],
        [18, 66],
      ],
      3.5,
      P.brownLight,
    );
    out +=
      pineCluster(22, 70, 17, dark, light) +
      pineCluster(62, 90, 18, dark, light) +
      pineCluster(88, 70, 14, dark, light);
    out += pineCluster(30, 132, 18, dark, light) + pineCluster(78, 140, 15, dark, light);
    out += tanzaku(52, 118, 17, 56, -12, P.red, true);
  } else {
    const flip = kind === 'chaff2';
    const t = flip ? 'translate(100,0) scale(-1,1)' : '';
    out += skyBand(128, 40, P.red);
    out += g(
      { transform: t },
      branch(
        [
          [8, 168],
          [26, 120],
          [52, 86],
          [86, 60],
        ],
        6,
        P.brownLight,
      ),
      branch(
        [
          [34, 108],
          [60, 118],
          [88, 112],
        ],
        3.5,
        P.brownLight,
      ),
      pineCluster(20, 76, 16, dark, light),
      pineCluster(54, 62, 18, dark, light),
      pineCluster(86, 52, 13, dark, light),
      pineCluster(64, 110, 17, dark, light),
      pineCluster(28, 118, 15, dark, light),
    );
  }
  return out;
}

function crane(x: number, y: number): string {
  // A standing crane facing left, neck arched up toward the sun.
  const body = path(
    `M${x + 26},${y + 10} C${x + 22},${y - 4} ${x + 4},${y - 6} ${x - 4},${y + 4} C${x - 10},${y + 12} ${x + 2},${y + 24} ${x + 16},${y + 22} C${x + 24},${y + 20} ${x + 30},${y + 18} ${x + 26},${y + 10}Z`,
    { fill: P.white, ...INK },
  );
  const tail = path(
    `M${x + 20},${y + 6} C${x + 32},${y + 4} ${x + 40},${y + 14} ${x + 38},${y + 26} C${x + 32},${y + 20} ${x + 26},${y + 18} ${x + 18},${y + 18}Z`,
    {
      fill: P.ink,
      ...INK_THIN,
    },
  );
  const wing = path(
    `M${x + 2},${y + 6} C${x + 12},${y + 2} ${x + 22},${y + 8} ${x + 24},${y + 16} C${x + 14},${y + 16} ${x + 6},${y + 14} ${x + 2},${y + 6}Z`,
    {
      fill: '#e8e2d4',
      ...INK_THIN,
    },
  );
  const neck =
    path(`M${x - 2},${y + 6} C${x - 12},${y - 8} ${x - 16},${y - 30} ${x - 8},${y - 40}`, {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 6.5,
      'stroke-linecap': 'round',
    }) +
    path(`M${x - 2},${y + 6} C${x - 12},${y - 8} ${x - 16},${y - 30} ${x - 8},${y - 40}`, {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 4.5,
      'stroke-linecap': 'round',
    });
  const head =
    ellipse(x - 7, y - 42, 5, 4, { fill: P.white, ...INK_THIN }) +
    ellipse(x - 6, y - 45, 2.6, 1.8, { fill: P.red });
  const beak = path(`M${x - 11},${y - 42} L${x - 24},${y - 38} L${x - 11},${y - 40}Z`, {
    fill: P.gold,
    ...INK_THIN,
  });
  const eye = circle(x - 8, y - 42.5, 0.8, { fill: P.ink });
  const legs = path(
    `M${x + 8},${y + 22} L${x + 6},${y + 44} M${x + 14},${y + 22} L${x + 16},${y + 44} M${x + 6},${y + 44} l-5,2 M${x + 16},${y + 44} l5,2`,
    {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 1.3,
    },
  );
  return g({}, legs, tail, body, wing, neck, head, beak, eye);
}

// ---------------------------------------------------------------------------
// February: Plum

function plumBranch(seed: number, mirror: boolean): string {
  const r = artRng(seed);
  const t = mirror ? 'translate(100,0) scale(-1,1)' : '';
  let flowers = '';
  const spots: [number, number][] = [
    [26, 58],
    [40, 72],
    [58, 60],
    [72, 44],
    [84, 30],
    [18, 98],
    [34, 110],
    [66, 92],
    [80, 76],
    [50, 124],
  ];
  for (const [x, y] of spots) {
    const white = r() < 0.25;
    flowers += blossom(
      x + r() * 4 - 2,
      y + r() * 4 - 2,
      6 + r() * 2,
      white ? P.white : P.crimson,
      white ? P.crimson : P.yellow,
      { rot: r() * 60 },
    );
  }
  let buds = '';
  for (let i = 0; i < 6; i++)
    buds += circle(10 + r() * 80, 20 + r() * 110, 2, { fill: P.crimson, ...INK_THIN });
  return g(
    { transform: t },
    branch(
      [
        [4, 150],
        [20, 120],
        [30, 84],
        [50, 66],
        [76, 40],
        [96, 22],
      ],
      5.5,
      P.inkSoft,
    ),
    branch(
      [
        [30, 90],
        [18, 70],
        [12, 52],
      ],
      3,
      P.inkSoft,
    ),
    branch(
      [
        [44, 72],
        [60, 84],
        [76, 80],
        [92, 86],
      ],
      3,
      P.inkSoft,
    ),
    branch(
      [
        [24, 118],
        [40, 124],
        [56, 136],
      ],
      2.5,
      P.inkSoft,
    ),
    buds,
    flowers,
  );
}

function plum(kind: Kind): string {
  let out = '';
  if (kind === 'chaff1' || kind === 'chaff2') out += skyBand(-2, 34, P.red);
  out += plumBranch(
    kind === 'animal' ? 11 : kind === 'ribbon' ? 12 : kind === 'chaff1' ? 13 : 14,
    kind === 'chaff2',
  );
  if (kind === 'animal') out += warbler(56, 100);
  if (kind === 'ribbon') out += tanzaku(50, 124, 17, 52, 8, P.red, true);
  return out;
}

function warbler(x: number, y: number): string {
  const olive = '#8a9a2c';
  const body = path(
    `M${x - 14},${y + 2} C${x - 12},${y - 10} ${x + 6},${y - 12} ${x + 12},${y - 2} C${x + 14},${y + 6} ${x + 4},${y + 12} ${x - 6},${y + 10}Z`,
    {
      fill: olive,
      ...INK,
    },
  );
  const belly = path(
    `M${x - 8},${y + 8} C${x - 2},${y + 4} ${x + 6},${y + 4} ${x + 10},${y + 2} C${x + 8},${y + 8} ${x},${y + 11} ${x - 8},${y + 8}Z`,
    {
      fill: '#d9d38a',
    },
  );
  const head = circle(x + 12, y - 6, 6.5, { fill: olive, ...INK });
  const eye =
    circle(x + 14, y - 7, 1.3, { fill: P.ink }) + circle(x + 14.4, y - 7.4, 0.4, { fill: P.white });
  const beak = path(`M${x + 18},${y - 6} L${x + 23},${y - 5} L${x + 18},${y - 3.5}Z`, {
    fill: P.inkSoft,
    ...INK_THIN,
  });
  const wing = path(
    `M${x - 8},${y - 2} C${x - 2},${y - 6} ${x + 6},${y - 4} ${x + 6},${y + 2} C${x},${y + 4} ${x - 6},${y + 2} ${x - 8},${y - 2}Z`,
    {
      fill: '#6b7a22',
      ...INK_THIN,
    },
  );
  const tail = path(
    `M${x - 13},${y + 2} L${x - 28},${y + 12} L${x - 24},${y + 14} L${x - 10},${y + 8}Z`,
    { fill: '#6b7a22', ...INK },
  );
  const feet = path(`M${x - 2},${y + 10} l-1,5 M${x + 3},${y + 10} l1,5`, {
    stroke: P.ink,
    'stroke-width': 1,
  });
  return g({}, tail, body, belly, wing, head, eye, beak, feet);
}

// ---------------------------------------------------------------------------
// March: Cherry

function cherryCloud(seed: number, top: number): string {
  const r = artRng(seed);
  let out = '';
  const clouds: [number, number, number, number][] = [
    [30, top + 20, 30, 18],
    [72, top + 14, 30, 16],
    [50, top + 40, 36, 18],
    [20, top + 52, 20, 12],
    [84, top + 48, 18, 12],
  ];
  for (const [x, y, rx, ry] of clouds)
    out += ellipse(x, y, rx, ry, { fill: P.pinkLight, stroke: '#e9a3b6', 'stroke-width': 0.8 });
  for (let i = 0; i < 24; i++) {
    const x = 8 + r() * 84;
    const y = top + 6 + r() * 52;
    out += blossom(x, y, 5 + r() * 2.5, r() < 0.4 ? P.white : P.pink, P.crimson, {
      notched: true,
      rot: r() * 72,
    });
  }
  return out;
}

function cherry(kind: Kind): string {
  let out = '';
  if (kind === 'bright') {
    out += skyBand(-2, 60, '#fbe3e7');
    out += branch(
      [
        [0, 30],
        [30, 26],
        [70, 12],
        [102, 4],
      ],
      4,
      P.inkSoft,
    );
    out += cherryCloud(31, 0);
    out += curtain(90);
  } else if (kind === 'ribbon') {
    out += branch(
      [
        [0, 150],
        [24, 110],
        [44, 84],
        [80, 60],
        [102, 40],
      ],
      5,
      P.inkSoft,
    );
    out += cherryCloud(32, 10);
    out += cherryCloud(33, 86);
    out += tanzaku(46, 104, 17, 52, -6, P.red, true);
  } else {
    out += skyBand(116, 50, P.red);
    out += cloudBand(110, P.red, kind === 'chaff1' ? 5 : 6);
    out += branch(
      kind === 'chaff1'
        ? [
            [0, 120],
            [26, 90],
            [60, 70],
            [102, 60],
          ]
        : [
            [102, 130],
            [70, 96],
            [40, 74],
            [0, 58],
          ],
      5,
      P.inkSoft,
    );
    out += cherryCloud(kind === 'chaff1' ? 34 : 35, 20);
    out += cherryCloud(kind === 'chaff1' ? 36 : 37, 62);
  }
  return out;
}

function curtain(top: number): string {
  // A festival curtain: red and white panels, a pole and an original crest.
  const h = 70;
  let panels = '';
  const w = 94 / 5;
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * w;
    const sway = i % 2 === 0 ? 2 : -2;
    panels += path(
      `M${n(x)},${top} L${n(x + w)},${top} L${n(x + w + sway)},${top + h} Q${n(x + w / 2)},${top + h + 5} ${n(x + sway)},${top + h}Z`,
      {
        fill: i % 2 === 0 ? P.crimson : P.white,
        ...INK,
      },
    );
  }
  const pole = rect(-2, top - 5, 104, 6, { fill: P.brownLight, ...INK });
  const crest =
    circle(50, top + 34, 15, { fill: P.white, ...INK }) +
    circle(50, top + 34, 12.5, { fill: 'none', stroke: P.crimson, 'stroke-width': 1.5 }) +
    blossom(50, top + 34, 10, P.crimson, P.white, { notched: true, rot: 0, ink: false });
  const tassels = path(`M6,${top} l0,-9 M94,${top} l0,-9`, { stroke: P.gold, 'stroke-width': 2.5 });
  return g({}, panels, pole, tassels, crest);
}

// ---------------------------------------------------------------------------
// April: Wisteria

function raceme(x: number, top: number, len: number, seed: number): string {
  const r = artRng(seed);
  let out = path(`M${x},${top} q${n(r() * 4 - 2)},${n(len / 2)} ${n(r() * 3 - 1.5)},${n(len)}`, {
    stroke: P.inkSoft,
    'stroke-width': 0.8,
    fill: 'none',
  });
  const steps = Math.floor(len / 5);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const size = 5.5 * (1 - t * 0.7);
    const yy = top + 4 + i * 5;
    const xx = x + Math.sin(i * 1.3) * 1.6;
    out += ellipse(xx - size * 0.45, yy, size * 0.55, size * 0.45, {
      fill: i % 3 === 0 ? P.purpleLight : P.purple,
      ...INK_THIN,
    });
    out += ellipse(xx + size * 0.45, yy + 1.5, size * 0.55, size * 0.45, {
      fill: i % 2 === 0 ? P.purple : P.purpleLight,
      ...INK_THIN,
    });
  }
  return out;
}

function wisteria(kind: Kind): string {
  let out = '';
  if (kind === 'animal') {
    out += skyBand(-2, 168, P.redDeep);
    out += path('M72,112 a22,22 0 1,0 18,-34 a18,18 0 1,1 -18,34Z', { fill: P.yellow, ...INK });
    out += cuckoo(46, 118);
  }
  out += branch(
    [
      [-2, 8],
      [30, 14],
      [60, 8],
      [102, 14],
    ],
    4,
    P.inkSoft,
  );
  for (let i = 0; i < 8; i++)
    out += leaf(8 + i * 12, 12 + (i % 2) * 3, 12, 4, 60 + (i % 3) * 25, P.leaf);
  const count = kind === 'animal' ? 3 : 5;
  for (let i = 0; i < count; i++) {
    const x = kind === 'animal' ? 16 + i * 14 : 12 + i * 19;
    out += raceme(x, 12, kind === 'animal' ? 50 + (i % 2) * 14 : 70 + ((i * 17) % 40), 40 + i);
  }
  if (kind === 'ribbon') out += tanzaku(58, 118, 17, 52, 10, P.red, false);
  if (kind === 'chaff1') out += skyBand(140, 30, P.inkSoft);
  if (kind === 'chaff2') out += cloudBand(138, P.redDeep, 9);
  return out;
}

function cuckoo(x: number, y: number): string {
  const grey = '#4a4e57';
  const body = path(
    `M${x - 18},${y + 4} C${x - 10},${y - 6} ${x + 8},${y - 6} ${x + 16},${y} C${x + 8},${y + 6} ${x - 6},${y + 10} ${x - 18},${y + 4}Z`,
    {
      fill: grey,
      ...INK,
    },
  );
  const wingUp = path(
    `M${x - 6},${y - 2} C${x - 2},${y - 22} ${x + 12},${y - 32} ${x + 26},${y - 34} C${x + 18},${y - 20} ${x + 10},${y - 8} ${x + 4},${y - 2}Z`,
    {
      fill: '#2f323a',
      ...INK,
    },
  );
  const wingDown = path(
    `M${x - 4},${y + 4} C${x - 8},${y + 18} ${x - 20},${y + 26} ${x - 30},${y + 26} C${x - 22},${y + 16} ${x - 14},${y + 8} ${x - 8},${y + 4}Z`,
    {
      fill: '#2f323a',
      ...INK,
    },
  );
  const head = circle(x + 17, y - 2, 5, { fill: grey, ...INK });
  const eye = circle(x + 19, y - 3, 1.1, { fill: P.yellow });
  const beak = path(`M${x + 21},${y - 2} L${x + 27},${y} L${x + 21},${y + 1}Z`, {
    fill: P.gold,
    ...INK_THIN,
  });
  const tail = path(`M${x - 17},${y + 3} L${x - 34},${y - 2} L${x - 32},${y + 6}Z`, {
    fill: '#2f323a',
    ...INK,
  });
  const belly = path(`M${x - 8},${y + 5} q10,4 20,-2`, {
    stroke: '#d8d8d0',
    'stroke-width': 1.5,
    fill: 'none',
  });
  return g({}, tail, wingDown, body, belly, wingUp, head, eye, beak);
}

// ---------------------------------------------------------------------------
// May: Iris

function irisFlower(x: number, y: number, s: number, color: string): string {
  const fall = (a: number) =>
    path(
      `M${x},${y} C${n(x + Math.cos(a) * 8 * s)},${n(y - 2 * s)} ${n(x + Math.cos(a) * 12 * s)},${n(y + 8 * s)} ${n(x + Math.cos(a) * 7 * s)},${n(y + 12 * s)} C${n(x + Math.cos(a) * 3 * s)},${n(y + 8 * s)} ${x},${n(y + 4 * s)} ${x},${y}Z`,
      {
        fill: color,
        ...INK_THIN,
      },
    );
  const standard = path(
    `M${n(x - 3 * s)},${y} C${n(x - 5 * s)},${n(y - 10 * s)} ${n(x - 1 * s)},${n(y - 14 * s)} ${x},${n(y - 16 * s)} C${n(x + 1 * s)},${n(y - 14 * s)} ${n(x + 5 * s)},${n(y - 10 * s)} ${n(x + 3 * s)},${y}Z`,
    {
      fill: color,
      ...INK_THIN,
    },
  );
  const signal = path(
    `M${n(x - 5 * s)},${n(y + 5 * s)} q-1,3 -2,5 M${n(x + 5 * s)},${n(y + 5 * s)} q1,3 2,5`,
    {
      stroke: P.yellow,
      'stroke-width': 1.3 * s,
      fill: 'none',
    },
  );
  return g({}, fall(Math.PI), fall(0), standard, signal);
}

function iris(kind: Kind): string {
  let out = '';
  if (kind === 'chaff2') out += skyBand(-2, 30, P.indigo);
  const blades: [number, number, number][] = [
    [14, 164, 70],
    [26, 164, 82],
    [40, 164, 64],
    [58, 164, 88],
    [72, 164, 70],
    [86, 164, 80],
  ];
  for (const [x, y, h] of blades) {
    out += path(
      `M${x - 3},${y} C${x - 2},${y - h * 0.5} ${x + 2},${y - h * 0.8} ${x + 5},${y - h} C${x + 3},${y - h * 0.6} ${x + 4},${y - h * 0.3} ${x + 4},${y}Z`,
      {
        fill: P.green,
        ...INK_THIN,
      },
    );
  }
  const flowers: [number, number][] =
    kind === 'animal'
      ? [
          [20, 46],
          [78, 40],
        ]
      : kind === 'ribbon'
        ? [
            [22, 60],
            [74, 44],
            [48, 86],
          ]
        : [
            [24, 70],
            [60, 50],
            [80, 90],
            [40, 106],
          ];
  flowers.forEach(([x, y], i) => {
    out += path(`M${x},${y + 10} L${x + (i % 2 ? 2 : -2)},${y + 80}`, {
      stroke: P.greenDeep,
      'stroke-width': 2,
    });
    out += irisFlower(x, y, 1.3, i % 2 ? P.purple : P.indigo);
  });
  if (kind === 'animal') out += bridge(88);
  if (kind === 'ribbon') out += tanzaku(46, 122, 17, 50, -14, P.red, false);
  return out;
}

function bridge(y: number): string {
  // Eight-plank bridge: zig-zag boards over water.
  const water = path(
    `M-2,${y + 30} q12,-4 24,0 t24,0 t24,0 t24,0 t24,0 L104,${y + 80} L-2,${y + 80}Z`,
    { fill: '#6fa3c9', ...INK_THIN },
  );
  const plank = (x: number, yy: number, ang: number) =>
    g(
      { transform: `translate(${x},${yy}) rotate(${ang})` },
      rect(-34, -6, 68, 12, { fill: '#b07a44', ...INK }),
      path('M-30,-2 L30,-2 M-30,2 L30,2', { stroke: '#7c5028', 'stroke-width': 0.8 }),
    );
  const posts = [18, 48, 82]
    .map((x) => rect(x - 2.5, y + 14, 5, 34, { fill: P.brown, ...INK }))
    .join('');
  return g({}, water, posts, plank(30, y + 20, 18), plank(70, y + 34, -18));
}

// ---------------------------------------------------------------------------
// June: Peony

function peony(x: number, y: number, r: number, color: string, light: string): string {
  let out = '';
  for (let ring = 3; ring >= 1; ring--) {
    const rr = (r * ring) / 3;
    const petals = 5 + ring * 2;
    let d = '';
    for (let i = 0; i < petals; i++) {
      const a0 = (i / petals) * Math.PI * 2 + ring;
      const a1 = ((i + 1) / petals) * Math.PI * 2 + ring;
      const am = (a0 + a1) / 2;
      const p0 = [x + Math.cos(a0) * rr * 0.8, y + Math.sin(a0) * rr * 0.8];
      const pm = [x + Math.cos(am) * rr * 1.18, y + Math.sin(am) * rr * 1.18];
      const p1 = [x + Math.cos(a1) * rr * 0.8, y + Math.sin(a1) * rr * 0.8];
      d += `${i === 0 ? 'M' : 'L'}${n(p0[0] as number)},${n(p0[1] as number)} Q${n(pm[0] as number)},${n(pm[1] as number)} ${n(p1[0] as number)},${n(p1[1] as number)} `;
    }
    out += path(d + 'Z', { fill: ring === 2 ? light : color, ...INK_THIN });
  }
  return out + circle(x, y, r * 0.18, { fill: P.yellow, ...INK_THIN });
}

function peonyLeaves(seed: number): string {
  const r = artRng(seed);
  let out = '';
  for (let i = 0; i < 9; i++)
    out += leaf(
      10 + r() * 80,
      100 + r() * 60,
      18 + r() * 8,
      6,
      -60 - r() * 60,
      i % 2 ? P.leaf : P.green,
    );
  return out;
}

function peonyCard(kind: Kind): string {
  let out = '';
  if (kind === 'chaff1') out += skyBand(-2, 40, P.red);
  out += peonyLeaves(kind.length * 7);
  if (kind === 'animal') {
    out += peony(50, 112, 26, P.crimson, P.pink);
    out += butterfly(30, 44, 1, P.yellow) + butterfly(72, 62, 0.85, P.blue);
  } else if (kind === 'ribbon') {
    out += peony(34, 70, 22, P.crimson, P.pink) + peony(72, 124, 20, P.crimson, P.pink);
    out += tanzaku(66, 62, 17, 54, 10, P.indigo, true);
  } else {
    out += peony(
      40,
      84,
      26,
      kind === 'chaff2' ? P.pink : P.crimson,
      kind === 'chaff2' ? P.white : P.pink,
    );
    out += peony(76, 130, 16, P.crimson, P.pink);
  }
  return out;
}

function butterfly(x: number, y: number, s: number, color: string): string {
  const wing = (dx: number, dy: number, rx: number, ry: number, rot: number) =>
    ellipse(x + dx * s, y + dy * s, rx * s, ry * s, {
      fill: color,
      ...INK,
      transform: `rotate(${rot},${n(x + dx * s)},${n(y + dy * s)})`,
    });
  const spots =
    circle(x - 8 * s, y - 6 * s, 2 * s, { fill: P.ink }) +
    circle(x + 8 * s, y - 6 * s, 2 * s, { fill: P.ink });
  const body = ellipse(x, y, 1.8 * s, 9 * s, { fill: P.ink });
  const antennae = path(`M${x},${n(y - 8 * s)} q-3,-6 -6,-7 M${x},${n(y - 8 * s)} q3,-6 6,-7`, {
    stroke: P.ink,
    'stroke-width': 0.8,
    fill: 'none',
  });
  return g(
    {},
    wing(-9, -5, 10, 7, -25),
    wing(9, -5, 10, 7, 25),
    wing(-7, 6, 6, 5, 20),
    wing(7, 6, 6, 5, -20),
    spots,
    body,
    antennae,
  );
}

// ---------------------------------------------------------------------------
// July: Bush clover

function cloverArcs(seed: number, count: number): string {
  const r = artRng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x0 = 6 + r() * 30;
    const y0 = 160;
    const x1 = 30 + r() * 70;
    const y1 = 20 + r() * 60;
    const d = `M${n(x0)},${y0} Q${n(x0 + 10)},${n(y1 - 20)} ${n(x1)},${n(y1)}`;
    out += path(d, { stroke: P.brown, 'stroke-width': 1.6, fill: 'none' });
    for (let t = 0.2; t <= 1.0; t += 0.12) {
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + 10) + t * t * x1;
      const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y1 - 20) + t * t * y1;
      out += ellipse(bx + 3, by, 2.4, 1.6, { fill: r() < 0.5 ? P.leaf : P.green, ...INK_THIN });
      if (r() < 0.6)
        out += ellipse(bx - 2.5, by - 1, 1.8, 1.4, {
          fill: r() < 0.5 ? P.crimson : '#b5467e',
          ...INK_THIN,
        });
    }
  }
  return out;
}

function clover(kind: Kind): string {
  let out = '';
  if (kind !== 'animal') out += skyBand(-2, 50, P.red);
  out += cloverArcs(70 + kind.length, kind === 'animal' ? 5 : 7);
  if (kind === 'animal') out += boar(52, 118);
  if (kind === 'ribbon') out += tanzaku(58, 104, 17, 54, 6, P.red, false);
  return out;
}

function boar(x: number, y: number): string {
  const fur = '#4a3322';
  const body = path(
    `M${x - 30},${y + 4} C${x - 30},${y - 16} ${x - 6},${y - 24} ${x + 14},${y - 18} C${x + 26},${y - 14} ${x + 30},${y - 4} ${x + 34},${y} L${x + 40},${y + 4} C${x + 36},${y + 10} ${x + 28},${y + 10} ${x + 20},${y + 12} C${x},${y + 16} ${x - 20},${y + 16} ${x - 30},${y + 4}Z`,
    {
      fill: fur,
      ...INK,
    },
  );
  const bristles = path(
    `M${x - 22},${y - 12} l-2,-6 M${x - 14},${y - 17} l-1,-6 M${x - 6},${y - 20} l0,-6 M${x + 2},${y - 21} l1,-6 M${x + 10},${y - 20} l2,-5`,
    {
      stroke: P.ink,
      'stroke-width': 1.4,
    },
  );
  const legs = path(
    `M${x - 22},${y + 10} l-4,14 M${x - 12},${y + 12} l2,14 M${x + 12},${y + 12} l-4,13 M${x + 22},${y + 10} l5,12`,
    {
      stroke: fur,
      'stroke-width': 4,
      'stroke-linecap': 'round',
    },
  );
  const legsInk = path(
    `M${x - 22},${y + 10} l-4,14 M${x - 12},${y + 12} l2,14 M${x + 12},${y + 12} l-4,13 M${x + 22},${y + 10} l5,12`,
    {
      stroke: P.ink,
      'stroke-width': 5.5,
      'stroke-linecap': 'round',
    },
  );
  const eye = circle(x + 24, y - 6, 1.4, { fill: P.yellow });
  const tusk = path(`M${x + 36},${y + 4} q4,-2 5,-8`, {
    stroke: P.white,
    'stroke-width': 2,
    fill: 'none',
    'stroke-linecap': 'round',
  });
  const ear = path(`M${x + 16},${y - 14} l3,-8 l4,7Z`, { fill: fur, ...INK_THIN });
  const snout = ellipse(x + 40, y + 2, 2, 3, { fill: '#6b4a33', ...INK_THIN });
  const tail = path(`M${x - 30},${y - 2} q-6,-2 -6,-8`, {
    stroke: P.ink,
    'stroke-width': 1.3,
    fill: 'none',
  });
  return g({}, legsInk, legs, tail, body, bristles, ear, eye, snout, tusk);
}

// ---------------------------------------------------------------------------
// August: Susuki grass

function hill(color: string): string {
  return path('M-4,168 L-4,112 C18,88 50,82 78,92 C92,97 100,104 106,110 L106,168Z', {
    fill: color,
    ...INK,
  });
}

function grass(seed: number): string {
  const r = artRng(seed);
  let out = '';
  for (let i = 0; i < 14; i++) {
    const x = 4 + r() * 94;
    const y = 104 + r() * 50;
    const h = 20 + r() * 26;
    const lean = (r() - 0.3) * 20;
    out += path(`M${n(x)},${n(y)} q${n(lean / 2)},${n(-h / 2)} ${n(lean)},${n(-h)}`, {
      stroke: P.white,
      'stroke-width': 1.2,
      fill: 'none',
      'stroke-linecap': 'round',
    });
    out += ellipse(x + lean, y - h, 1.6, 5, {
      fill: P.white,
      transform: `rotate(${n(lean)},${n(x + lean)},${n(y - h)})`,
    });
  }
  return out;
}

function susuki(kind: Kind): string {
  let out = '';
  const sky = kind === 'chaff2' ? '#f0d9a8' : P.sky;
  out += skyBand(-2, 168, sky);
  if (kind === 'bright') {
    out += circle(50, 60, 34, { fill: '#fff7de', ...INK });
    out += circle(50, 60, 30, { fill: 'none', stroke: '#f3dfa5', 'stroke-width': 2 });
  }
  if (kind === 'animal') {
    out += goose(28, 40, 1) + goose(62, 30, 0.9) + goose(78, 60, 0.8);
  }
  out += hill(P.ink);
  out += grass(80 + kind.length * 3);
  return out;
}

function goose(x: number, y: number, s: number): string {
  const c = '#2b2926';
  return g(
    { transform: `translate(${x},${y}) scale(${s})` },
    path('M-16,4 C-8,-2 8,-2 16,2 C10,6 -6,8 -16,4Z', { fill: c, ...INK_THIN }),
    path('M-4,0 C-2,-12 6,-18 16,-20 C10,-10 6,-4 4,0Z', { fill: '#3f3b36', ...INK_THIN }),
    path('M-2,4 C-6,14 -14,18 -22,18 C-14,12 -10,8 -8,4Z', { fill: '#3f3b36', ...INK_THIN }),
    path('M16,2 L24,0 L16,-1', { fill: P.gold, ...INK_THIN }),
    circle(14, 0.5, 0.8, { fill: P.white }),
  );
}

// ---------------------------------------------------------------------------
// September: Chrysanthemum

function chrysanthemum(x: number, y: number, r: number, color: string, centre: string): string {
  let out = '';
  const petals = 20;
  for (let layer = 0; layer < 2; layer++) {
    const rr = layer === 0 ? r : r * 0.66;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + layer * 0.16;
      const px = x + Math.cos(a) * rr * 0.55;
      const py = y + Math.sin(a) * rr * 0.55;
      out += ellipse(px, py, rr * 0.5, rr * 0.13, {
        fill: layer === 0 ? color : P.white,
        ...INK_THIN,
        transform: `rotate(${n((a * 180) / Math.PI)},${n(px)},${n(py)})`,
      });
    }
  }
  return out + circle(x, y, r * 0.22, { fill: centre, ...INK_THIN });
}

function kiku(kind: Kind): string {
  let out = '';
  if (kind === 'chaff1') out += skyBand(-2, 36, P.red);
  if (kind === 'chaff2') out += skyBand(128, 40, P.indigo);
  const r = artRng(90 + kind.length);
  for (let i = 0; i < 8; i++)
    out += leaf(8 + r() * 84, 90 + r() * 70, 16, 7, -40 - r() * 100, P.leaf);
  if (kind === 'animal') {
    out += chrysanthemum(24, 40, 17, P.yellow, P.orange) + chrysanthemum(78, 36, 14, P.gold, P.red);
    out += sakeCup(50, 108);
  } else if (kind === 'ribbon') {
    out +=
      chrysanthemum(30, 48, 18, P.yellow, P.orange) +
      chrysanthemum(76, 116, 16, P.gold, P.red) +
      chrysanthemum(24, 128, 12, P.yellow, P.orange);
    out += tanzaku(58, 70, 17, 54, -8, P.indigo, true);
  } else {
    out += chrysanthemum(34, 70, 20, kind === 'chaff2' ? P.white : P.yellow, P.orange);
    out += chrysanthemum(74, 104, 17, P.gold, P.red);
  }
  return out;
}

function sakeCup(x: number, y: number): string {
  const lacquer = P.red;
  const bowl = path(
    `M${x - 34},${y - 8} C${x - 30},${y + 14} ${x + 30},${y + 14} ${x + 34},${y - 8}Z`,
    { fill: lacquer, ...INK },
  );
  const rim = ellipse(x, y - 8, 34, 8, { fill: '#e04a2a', ...INK });
  const inner = ellipse(x, y - 8, 30, 6, { fill: '#b01e1a', ...INK_THIN });
  const crest = g(
    {},
    circle(x, y - 8, 5, { fill: 'none', stroke: P.gold, 'stroke-width': 1.3 }),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i / 8) * Math.PI * 2;
      return ellipse(x + Math.cos(a) * 3.2, y - 8 + Math.sin(a) * 1.2, 1.4, 0.6, { fill: P.gold });
    }),
  );
  const foot = path(
    `M${x - 12},${y + 8} L${x - 16},${y + 20} L${x + 16},${y + 20} L${x + 12},${y + 8}Z`,
    { fill: '#8f1616', ...INK },
  );
  const stand = ellipse(x, y + 20, 18, 4, { fill: P.ink });
  const shine = path(`M${x - 24},${y - 2} q10,8 24,8`, {
    stroke: 'rgba(255,255,255,0.4)',
    'stroke-width': 2,
    fill: 'none',
  });
  return g({}, stand, foot, bowl, rim, inner, crest, shine);
}

// ---------------------------------------------------------------------------
// October: Maple

function mapleTree(seed: number, density: number, low: boolean): string {
  const r = artRng(seed);
  let out = branch(
    [
      [-2, 40],
      [30, 46],
      [60, 30],
      [102, 36],
    ],
    4,
    P.inkSoft,
  );
  out += branch(
    [
      [40, 42],
      [50, 70],
      [70, 84],
    ],
    2.5,
    P.inkSoft,
  );
  const colors = [P.red, P.red, P.redDeep, P.orange, P.gold];
  for (let i = 0; i < density; i++) {
    const x = 6 + r() * 88;
    const y = (low ? 20 : 14) + r() * (low ? 110 : 80);
    out += maple(
      x,
      y,
      8 + r() * 4,
      r() * 60 - 30,
      colors[Math.floor(r() * colors.length)] as string,
    );
  }
  return out;
}

function mapleCard(kind: Kind): string {
  let out = '';
  if (kind === 'chaff2') out += skyBand(-2, 168, '#f3d9a0');
  if (kind === 'animal') {
    out += mapleTree(101, 12, false);
    out += deer(50, 120);
  } else if (kind === 'ribbon') {
    out += mapleTree(102, 16, true);
    out += tanzaku(48, 110, 17, 54, 12, P.indigo, true);
  } else {
    out += mapleTree(kind === 'chaff1' ? 103 : 104, 22, true);
  }
  return out;
}

function deer(x: number, y: number): string {
  const coat = '#a4642f';
  const legs =
    path(
      `M${x - 18},${y + 8} l-3,26 M${x - 10},${y + 10} l0,24 M${x + 12},${y + 10} l-2,24 M${x + 20},${y + 8} l3,25`,
      {
        stroke: P.ink,
        'stroke-width': 4,
        'stroke-linecap': 'round',
      },
    ) +
    path(
      `M${x - 18},${y + 8} l-3,26 M${x - 10},${y + 10} l0,24 M${x + 12},${y + 10} l-2,24 M${x + 20},${y + 8} l3,25`,
      {
        stroke: coat,
        'stroke-width': 2.4,
        'stroke-linecap': 'round',
      },
    );
  const body = path(
    `M${x - 24},${y + 4} C${x - 24},${y - 10} ${x + 14},${y - 12} ${x + 24},${y - 4} C${x + 28},${y + 6} ${x + 14},${y + 14} ${x - 4},${y + 14} C${x - 16},${y + 14} ${x - 24},${y + 12} ${x - 24},${y + 4}Z`,
    {
      fill: coat,
      ...INK,
    },
  );
  let spots = '';
  for (const [dx, dy] of [
    [-12, -2],
    [-4, -4],
    [4, -3],
    [12, 0],
    [-8, 4],
    [2, 3],
  ] as const)
    spots += circle(x + dx, y + dy, 1.4, { fill: '#f3e3c3' });
  const neck = path(
    `M${x + 16},${y - 4} C${x + 20},${y - 18} ${x + 18},${y - 28} ${x + 10},${y - 34} L${x + 4},${y - 28} C${x + 10},${y - 22} ${x + 10},${y - 12} ${x + 8},${y - 4}Z`,
    {
      fill: coat,
      ...INK,
    },
  );
  // Head turned back over the shoulder.
  const head = path(
    `M${x + 12},${y - 36} C${x + 4},${y - 40} ${x - 8},${y - 38} ${x - 10},${y - 32} C${x - 4},${y - 28} ${x + 6},${y - 28} ${x + 12},${y - 30}Z`,
    {
      fill: coat,
      ...INK,
    },
  );
  const antlers = path(
    `M${x + 8},${y - 38} C${x + 10},${y - 50} ${x + 18},${y - 54} ${x + 24},${y - 56} M${x + 14},${y - 48} l6,-2 M${x + 4},${y - 38} C${x},${y - 48} ${x - 2},${y - 54} ${x - 8},${y - 58} M${x},${y - 48} l-6,0`,
    {
      stroke: '#5a3a24',
      'stroke-width': 2,
      fill: 'none',
      'stroke-linecap': 'round',
    },
  );
  const eye = circle(x - 2, y - 33, 1, { fill: P.ink });
  const nose = circle(x - 10, y - 32, 1.2, { fill: P.ink });
  const ear = ellipse(x + 12, y - 38, 4, 2, {
    fill: coat,
    ...INK_THIN,
    transform: `rotate(-30,${x + 12},${y - 38})`,
  });
  const tail = path(`M${x - 24},${y} l-4,-4`, {
    stroke: P.white,
    'stroke-width': 2.5,
    'stroke-linecap': 'round',
  });
  return g({}, legs, tail, body, spots, neck, head, ear, antlers, eye, nose);
}

// ---------------------------------------------------------------------------
// November: Willow

function willowStrands(seed: number, count: number, color: string): string {
  const r = artRng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r() * 104 - 2;
    const len = 60 + r() * 70;
    const sway = (r() - 0.5) * 18;
    const d = `M${n(x)},-2 C${n(x + sway)},${n(len * 0.4)} ${n(x - sway)},${n(len * 0.7)} ${n(x + sway * 0.6)},${n(len)}`;
    out += path(d, { stroke: color, 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round' });
    for (let t = 0.15; t < 1; t += 0.14)
      out += leaf(x + sway * (t - 0.5) * 0.6, len * t, 6, 1.8, 95 + (r() - 0.5) * 30, color, {
        stroke: 'none',
      });
  }
  return out;
}

function willow(kind: Kind): string {
  let out = '';
  if (kind === 'bright') {
    out += skyBand(-2, 168, '#3b3d4a');
    for (let i = 0; i < 22; i++) {
      const x = (i * 37) % 104;
      out += path(`M${x},${(i * 53) % 150} l-5,12`, {
        stroke: 'rgba(220,230,255,0.35)',
        'stroke-width': 0.8,
      });
    }
    out += willowStrands(111, 7, '#7fae44');
    out += path('M-2,150 q14,-6 28,0 t28,0 t28,0 t28,0 L106,170 L-2,170Z', {
      fill: '#3f6f9a',
      ...INK_THIN,
    });
    out += rainMan(56, 96) + frog(20, 138);
  } else if (kind === 'animal') {
    out += skyBand(-2, 168, '#e7dcc0');
    out += willowStrands(112, 9, P.green);
    out += swallow(46, 92);
  } else if (kind === 'ribbon') {
    out += skyBand(-2, 168, '#e7dcc0');
    out += willowStrands(113, 10, P.green);
    out += tanzaku(52, 104, 17, 54, -10, P.red, false);
  } else {
    out += lightning();
  }
  return out;
}

function rainMan(x: number, y: number): string {
  // The calligrapher in the rain: umbrella, robe, a step toward the willow.
  const umbrella = path(`M${x - 30},${y - 22} Q${x - 4},${y - 50} ${x + 26},${y - 30} Z`, {
    fill: P.yellow,
    ...INK,
  });
  let ribs = '';
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    ribs += path(`M${x - 2},${y - 38} L${n(x - 30 + 56 * t)},${n(y - 22 - 8 * t)}`, {
      stroke: P.brownLight,
      'stroke-width': 0.8,
    });
  }
  const handle = path(`M${x - 2},${y - 38} L${x - 2},${y + 6}`, {
    stroke: P.brown,
    'stroke-width': 1.6,
  });
  const robe = path(
    `M${x - 14},${y - 10} C${x - 16},${y + 14} ${x - 20},${y + 36} ${x - 24},${y + 46} L${x + 16},${y + 46} C${x + 12},${y + 30} ${x + 10},${y + 10} ${x + 8},${y - 10} Z`,
    {
      fill: P.redDeep,
      ...INK,
    },
  );
  const inner = path(`M${x - 4},${y - 10} L${x - 8},${y + 46}`, {
    stroke: P.gold,
    'stroke-width': 1.5,
  });
  const sash = path(`M${x - 16},${y + 12} L${x + 11},${y + 10}`, {
    stroke: P.ink,
    'stroke-width': 3,
  });
  const head = circle(x - 3, y - 16, 6, { fill: '#f1d6b8', ...INK });
  const hat = path(`M${x - 10},${y - 18} Q${x - 3},${y - 26} ${x + 4},${y - 18}Z`, { fill: P.ink });
  const sleeve = path(
    `M${x + 8},${y - 6} C${x + 14},${y} ${x + 16},${y + 8} ${x + 12},${y + 12} L${x + 2},${y + 6}Z`,
    { fill: P.redDeep, ...INK_THIN },
  );
  const geta = path(`M${x - 22},${y + 48} l10,0 M${x + 2},${y + 48} l10,0`, {
    stroke: P.ink,
    'stroke-width': 2.5,
  });
  return g({}, robe, inner, sash, sleeve, head, hat, geta, handle, umbrella, ribs);
}

function frog(x: number, y: number): string {
  const skin = '#4f9a3a';
  return g(
    {},
    path(
      `M${x - 10},${y} C${x - 10},${y - 10} ${x + 10},${y - 10} ${x + 12},${y} C${x + 8},${y + 5} ${x - 6},${y + 5} ${x - 10},${y}Z`,
      { fill: skin, ...INK },
    ),
    path(`M${x + 8},${y + 2} l8,-8 l4,2 M${x - 8},${y + 2} l-6,6 l-4,-1`, {
      stroke: P.ink,
      'stroke-width': 2.4,
      fill: 'none',
      'stroke-linecap': 'round',
    }),
    path(`M${x + 8},${y + 2} l8,-8 l4,2 M${x - 8},${y + 2} l-6,6 l-4,-1`, {
      stroke: skin,
      'stroke-width': 1.2,
      fill: 'none',
      'stroke-linecap': 'round',
    }),
    circle(x + 6, y - 7, 2.4, { fill: skin, ...INK_THIN }),
    circle(x + 6.4, y - 7.2, 1, { fill: P.ink }),
  );
}

function swallow(x: number, y: number): string {
  const blue = '#1f2a44';
  return g(
    {},
    path(
      `M${x - 6},${y} C${x - 24},${y - 18} ${x - 36},${y - 22} ${x - 44},${y - 20} C${x - 30},${y - 8} ${x - 18},${y + 2} ${x - 8},${y + 4}Z`,
      { fill: blue, ...INK },
    ),
    path(
      `M${x + 2},${y + 2} C${x + 14},${y + 16} ${x + 30},${y + 26} ${x + 42},${y + 28} C${x + 30},${y + 14} ${x + 18},${y + 4} ${x + 8},${y - 2}Z`,
      { fill: blue, ...INK },
    ),
    path(
      `M${x - 10},${y + 2} C${x - 4},${y - 6} ${x + 12},${y - 8} ${x + 20},${y - 14} C${x + 16},${y - 4} ${x + 6},${y + 6} ${x - 10},${y + 2}Z`,
      { fill: blue, ...INK },
    ),
    path(`M${x - 10},${y + 2} L${x - 26},${y + 14} L${x - 18},${y + 4} L${x - 30},${y + 6}Z`, {
      fill: blue,
      ...INK_THIN,
    }),
    circle(x + 18, y - 12, 4, { fill: blue, ...INK_THIN }),
    circle(x + 19, y - 9.5, 2, { fill: P.red }),
    circle(x + 19, y - 13, 0.8, { fill: P.white }),
    path(`M${x + 22},${y - 12} L${x + 27},${y - 13} L${x + 22},${y - 10}Z`, { fill: P.ink }),
    path(`M${x - 4},${y + 3} q8,2 16,-4`, { stroke: '#e8e0cc', 'stroke-width': 1.4, fill: 'none' }),
  );
}

function lightning(): string {
  const bg = skyBand(-2, 168, P.redDeep);
  let clouds = '';
  const blobs: [number, number, number][] = [
    [14, 26, 18],
    [42, 18, 20],
    [74, 28, 22],
    [96, 16, 14],
    [10, 132, 16],
    [40, 146, 20],
    [78, 138, 22],
  ];
  for (const [x, y, r] of blobs)
    clouds +=
      circle(x, y, r, { fill: P.ink }) +
      circle(x + r * 0.3, y - r * 0.2, r * 0.55, { fill: '#2e2622' });
  const bolt = polygon(
    [
      [58, 30],
      [34, 82],
      [52, 82],
      [38, 132],
      [74, 70],
      [54, 70],
      [70, 30],
    ],
    { fill: P.yellow, ...INK },
  );
  let drums = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - 0.4;
    const x = 50 + Math.cos(a) * 34;
    const y = 84 + Math.sin(a) * 34;
    drums +=
      circle(x, y, 7, { fill: P.gold, ...INK }) +
      circle(x, y, 3.6, { fill: 'none', stroke: P.redDeep, 'stroke-width': 1.3 });
  }
  const ring = circle(50, 84, 34, { fill: 'none', stroke: P.ink, 'stroke-width': 2 });
  return bg + clouds + ring + drums + bolt;
}

// ---------------------------------------------------------------------------
// December: Paulownia

function kiriLeaf(x: number, y: number, s: number, rot: number): string {
  const d = `M0,0 C-14,-4 -22,-20 -16,-34 C-10,-30 -6,-36 0,-44 C6,-36 10,-30 16,-34 C22,-20 14,-4 0,0Z`;
  return g(
    { transform: `translate(${n(x)},${n(y)}) rotate(${n(rot)}) scale(${n(s)})` },
    path(d, { fill: P.green, ...INK }),
    path('M0,0 L0,-40 M0,-14 L-10,-24 M0,-14 L10,-24 M0,-26 L-8,-32 M0,-26 L8,-32', {
      stroke: P.greenDeep,
      'stroke-width': 1,
      fill: 'none',
    }),
  );
}

function kiriFlower(x: number, y: number, h: number): string {
  let out = path(`M${x},${y} L${x},${y - h}`, { stroke: P.brown, 'stroke-width': 1.6 });
  for (let i = 0; i < 5; i++) {
    const yy = y - h + i * (h / 5);
    out +=
      ellipse(x - 4, yy, 3.4, 2.4, { fill: P.purple, ...INK_THIN }) +
      ellipse(x + 4, yy + 2, 3.4, 2.4, { fill: P.purpleLight, ...INK_THIN });
  }
  return out;
}

function kiri(kind: Kind): string {
  let out = '';
  if (kind === 'bright') {
    out += skyBand(-2, 168, '#f2b33d');
    out += cloudBand(120, P.red, 12);
    out += phoenix(50, 70);
    out += kiriLeaf(22, 164, 0.9, -20) + kiriLeaf(80, 164, 0.8, 25);
    return out;
  }
  if (kind === 'chaff3') out += skyBand(122, 50, P.yellow);
  if (kind === 'chaff2') out += skyBand(-2, 30, P.red);
  out += kiriFlower(30, 76, 50) + kiriFlower(50, 66, 56) + kiriFlower(70, 76, 50);
  out += kiriLeaf(24, 140, 1.2, -18) + kiriLeaf(76, 142, 1.15, 20) + kiriLeaf(50, 160, 1.3, 0);
  return out;
}

function phoenix(x: number, y: number): string {
  const tail = [
    { c: P.red, d: `M${x},${y + 10} C${x - 20},${y + 40} ${x - 40},${y + 50} ${x - 46},${y + 84}` },
    {
      c: P.green,
      d: `M${x + 2},${y + 12} C${x - 8},${y + 44} ${x - 20},${y + 64} ${x - 16},${y + 92}`,
    },
    {
      c: P.blue,
      d: `M${x + 4},${y + 12} C${x + 8},${y + 44} ${x + 4},${y + 70} ${x + 14},${y + 94}`,
    },
    {
      c: P.gold,
      d: `M${x + 6},${y + 10} C${x + 24},${y + 40} ${x + 34},${y + 60} ${x + 44},${y + 80}`,
    },
  ];
  let tails = '';
  for (const t of tail) {
    tails += path(t.d, {
      stroke: P.ink,
      'stroke-width': 7,
      fill: 'none',
      'stroke-linecap': 'round',
    });
    tails += path(t.d, {
      stroke: t.c,
      'stroke-width': 4.8,
      fill: 'none',
      'stroke-linecap': 'round',
    });
  }
  const eyes = [
    [x - 44, y + 80],
    [x - 16, y + 90],
    [x + 14, y + 92],
    [x + 42, y + 78],
  ]
    .map(
      ([ex, ey]) =>
        circle(ex as number, ey as number, 4, { fill: P.gold, ...INK_THIN }) +
        circle(ex as number, ey as number, 1.8, { fill: P.indigo }),
    )
    .join('');
  const wingL = path(
    `M${x - 4},${y} C${x - 30},${y - 6} ${x - 44},${y - 26} ${x - 48},${y - 44} C${x - 34},${y - 34} ${x - 20},${y - 30} ${x - 6},${y - 12}Z`,
    { fill: P.red, ...INK },
  );
  const wingL2 = path(
    `M${x - 6},${y - 4} C${x - 24},${y - 10} ${x - 34},${y - 22} ${x - 38},${y - 34} C${x - 26},${y - 26} ${x - 16},${y - 22} ${x - 6},${y - 12}Z`,
    { fill: P.gold, ...INK_THIN },
  );
  const wingR = path(
    `M${x + 6},${y} C${x + 30},${y - 8} ${x + 42},${y - 28} ${x + 46},${y - 46} C${x + 32},${y - 36} ${x + 20},${y - 30} ${x + 8},${y - 12}Z`,
    { fill: P.red, ...INK },
  );
  const wingR2 = path(
    `M${x + 8},${y - 4} C${x + 24},${y - 12} ${x + 32},${y - 24} ${x + 36},${y - 36} C${x + 24},${y - 28} ${x + 16},${y - 22} ${x + 8},${y - 12}Z`,
    { fill: P.green, ...INK_THIN },
  );
  const body = ellipse(x + 1, y + 2, 9, 14, { fill: P.gold, ...INK });
  const neck =
    path(`M${x + 2},${y - 10} C${x + 4},${y - 24} ${x + 10},${y - 32} ${x + 16},${y - 36}`, {
      stroke: P.ink,
      'stroke-width': 6.5,
      fill: 'none',
      'stroke-linecap': 'round',
    }) +
    path(`M${x + 2},${y - 10} C${x + 4},${y - 24} ${x + 10},${y - 32} ${x + 16},${y - 36}`, {
      stroke: P.red,
      'stroke-width': 4.5,
      fill: 'none',
      'stroke-linecap': 'round',
    });
  const head = circle(x + 18, y - 38, 5, { fill: P.red, ...INK });
  const crest = path(`M${x + 16},${y - 42} q-2,-8 4,-12 M${x + 19},${y - 42} q2,-8 8,-10`, {
    stroke: P.gold,
    'stroke-width': 1.8,
    fill: 'none',
    'stroke-linecap': 'round',
  });
  const beak = path(`M${x + 22},${y - 38} L${x + 29},${y - 36} L${x + 22},${y - 35}Z`, {
    fill: P.gold,
    ...INK_THIN,
  });
  const eye = circle(x + 19, y - 39, 1, { fill: P.white });
  return g({}, tails, eyes, wingL, wingL2, wingR, wingR2, body, neck, head, crest, beak, eye);
}

// ---------------------------------------------------------------------------

const MONTH_ART: Record<number, (k: Kind) => string> = {
  1: pine,
  2: plum,
  3: cherry,
  4: wisteria,
  5: iris,
  6: peonyCard,
  7: clover,
  8: susuki,
  9: kiku,
  10: mapleCard,
  11: willow,
  12: kiri,
};

/** Full SVG markup for a card face. */
export function cardFaceSvg(id: CardId): string {
  const c = CARDS[id];
  if (!c) throw new Error(`no card ${id}`);
  const art = (MONTH_ART[c.month] as (k: Kind) => string)(kindOf(id));
  const clip = `cf${id}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}">${el(
    'defs',
    {},
    el('clipPath', { id: clip }, rect(3.5, 3.5, 93, 157, { rx: 4 })) +
      el(
        'radialGradient',
        { id: `v${id}`, cx: '50%', cy: '45%', r: '75%' },
        el('stop', { offset: '60%', 'stop-color': '#000', 'stop-opacity': 0 }) +
          el('stop', { offset: '100%', 'stop-color': '#3b2410', 'stop-opacity': 0.28 }),
      ),
  )}${rect(0, 0, CARD_W, CARD_H, { rx: 6.5, fill: '#1c120d' })}${g(
    { 'clip-path': `url(#${clip})` },
    rect(0, 0, CARD_W, CARD_H, { fill: P.paper }),
    art,
    rect(0, 0, CARD_W, CARD_H, { fill: `url(#v${id})` }),
  )}${rect(3.5, 3.5, 93, 157, { rx: 4, fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 0.6 })}</svg>`;
}

/** The card back: deep lacquer red-black with the twelve-petal crest. */
export function cardBackSvg(hue = 0): string {
  const base = hue === 0 ? '#3a0f0c' : `hsl(${hue},45%,18%)`;
  const accent = hue === 0 ? '#7a1d16' : `hsl(${hue},45%,30%)`;
  let petals = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    petals += ellipse(50, 70, 3.6, 10, { fill: accent, transform: `rotate(${a},50,82)` });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}">${rect(0, 0, CARD_W, CARD_H, { rx: 6.5, fill: '#140b08' })}${rect(
    3.5,
    3.5,
    93,
    157,
    {
      rx: 4,
      fill: base,
    },
  )}${rect(9, 9, 82, 146, { rx: 3, fill: 'none', stroke: accent, 'stroke-width': 1.2 })}${g({}, petals)}${circle(50, 82, 5, { fill: accent })}${circle(
    50,
    82,
    20,
    {
      fill: 'none',
      stroke: accent,
      'stroke-width': 1.2,
    },
  )}</svg>`;
}
