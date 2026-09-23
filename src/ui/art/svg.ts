/**
 * Tiny SVG string helpers and shared drawing primitives for the original card
 * art. Everything here is pure string building so it can render in the browser,
 * in tests and in the art-sheet script alike.
 */

export const P = {
  paper: '#f4ead3',
  paperDeep: '#e9dcbd',
  ink: '#1d1712',
  inkSoft: '#3a2e26',
  red: '#d2391f',
  redDeep: '#a51d1c',
  crimson: '#c0223a',
  indigo: '#233f86',
  blue: '#3561b3',
  gold: '#e3a92a',
  yellow: '#f2c740',
  greenDeep: '#24502e',
  green: '#3f7c39',
  greenLight: '#7fae44',
  leaf: '#2f6a37',
  pink: '#f19ab2',
  pinkLight: '#fbd0da',
  purple: '#6b479f',
  purpleLight: '#a585d2',
  brown: '#5a3923',
  brownLight: '#8a5a33',
  white: '#fffaf0',
  grey: '#8a8f96',
  sky: '#c83a24',
  night: '#1f1a2b',
  orange: '#e86a1f',
  teal: '#2b7a78',
} as const;

export type Attrs = Record<string, string | number | undefined>;

export function attrs(a: Attrs): string {
  let out = '';
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined) continue;
    out += ` ${k}="${v}"`;
  }
  return out;
}

export const el = (tag: string, a: Attrs, children = ''): string =>
  children ? `<${tag}${attrs(a)}>${children}</${tag}>` : `<${tag}${attrs(a)}/>`;

export const g = (a: Attrs, ...children: string[]): string => el('g', a, children.join(''));

export const path = (d: string, a: Attrs = {}): string => el('path', { d, ...a });

export const circle = (cx: number, cy: number, r: number, a: Attrs = {}): string =>
  el('circle', { cx: n(cx), cy: n(cy), r: n(r), ...a });

export const ellipse = (cx: number, cy: number, rx: number, ry: number, a: Attrs = {}): string =>
  el('ellipse', { cx: n(cx), cy: n(cy), rx: n(rx), ry: n(ry), ...a });

export const rect = (x: number, y: number, w: number, h: number, a: Attrs = {}): string =>
  el('rect', { x: n(x), y: n(y), width: n(w), height: n(h), ...a });

export const polygon = (pts: [number, number][], a: Attrs = {}): string =>
  el('polygon', { points: pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' '), ...a });

/** Round to 2 decimals to keep the SVG strings small. */
export function n(x: number): string {
  return String(Math.round(x * 100) / 100);
}

export const INK = {
  stroke: P.ink,
  'stroke-width': 1.3,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
};
export const INK_THIN = {
  stroke: P.ink,
  'stroke-width': 0.8,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
};

/** Deterministic tiny PRNG for art variation (not game RNG). */
export function artRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const deg = (a: number) => (a * Math.PI) / 180;

/** A pointed leaf from (x,y) along angle, as a path. */
export function leaf(
  x: number,
  y: number,
  len: number,
  width: number,
  angle: number,
  fill: string,
  a: Attrs = {},
): string {
  const r = deg(angle);
  const tx = x + Math.cos(r) * len;
  const ty = y + Math.sin(r) * len;
  const nx = -Math.sin(r) * width;
  const ny = Math.cos(r) * width;
  const mx = x + Math.cos(r) * len * 0.45;
  const my = y + Math.sin(r) * len * 0.45;
  const d = `M${n(x)},${n(y)} Q${n(mx + nx)},${n(my + ny)} ${n(tx)},${n(ty)} Q${n(mx - nx)},${n(my - ny)} ${n(x)},${n(y)}Z`;
  const vein = `M${n(x)},${n(y)} L${n(x + (tx - x) * 0.85)},${n(y + (ty - y) * 0.85)}`;
  return (
    path(d, { fill, ...INK_THIN, ...a }) +
    path(vein, { fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 0.6 })
  );
}

/** A five-petal blossom (plum: round petals; cherry: notched petals). */
export function blossom(
  cx: number,
  cy: number,
  r: number,
  fill: string,
  centre: string,
  opts: { notched?: boolean; rot?: number; ink?: boolean } = {},
): string {
  const rot = opts.rot ?? 0;
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = deg(rot + i * 72 - 90);
    const px = cx + Math.cos(a) * r * 0.55;
    const py = cy + Math.sin(a) * r * 0.55;
    if (opts.notched) {
      // Heart-shaped notched petal.
      const tipX = cx + Math.cos(a) * r;
      const tipY = cy + Math.sin(a) * r;
      const side = deg(rot + i * 72 - 90 + 90);
      const sx = Math.cos(side) * r * 0.42;
      const sy = Math.sin(side) * r * 0.42;
      const notchX = cx + Math.cos(a) * r * 0.8;
      const notchY = cy + Math.sin(a) * r * 0.8;
      petals += path(
        `M${n(cx)},${n(cy)} C${n(px + sx)},${n(py + sy)} ${n(tipX + sx)},${n(tipY + sy)} ${n(notchX + sx * 0.25)},${n(notchY + sy * 0.25)} L${n(notchX)},${n(notchY)} L${n(notchX - sx * 0.25)},${n(notchY - sy * 0.25)} C${n(tipX - sx)},${n(tipY - sy)} ${n(px - sx)},${n(py - sy)} ${n(cx)},${n(cy)}Z`,
        { fill, ...(opts.ink === false ? {} : INK_THIN) },
      );
    } else {
      petals += circle(px, py, r * 0.48, { fill, ...(opts.ink === false ? {} : INK_THIN) });
    }
  }
  let stamens = '';
  for (let i = 0; i < 6; i++) {
    const a = deg(rot + i * 60);
    stamens += path(
      `M${n(cx)},${n(cy)} L${n(cx + Math.cos(a) * r * 0.42)},${n(cy + Math.sin(a) * r * 0.42)}`,
      {
        stroke: centre,
        'stroke-width': 0.6,
      },
    );
    stamens += circle(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45, 0.7, {
      fill: centre,
    });
  }
  return g({}, petals, circle(cx, cy, r * 0.2, { fill: centre }), stamens);
}

/** A tanzaku poem ribbon: a slightly curved strip at an angle. */
export function tanzaku(
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
  color: string,
  poetry: boolean,
): string {
  const hw = w / 2;
  const hh = h / 2;
  const d = `M${n(-hw)},${n(-hh)} Q0,${n(-hh - 3)} ${n(hw)},${n(-hh)} L${n(hw + 1)},${n(hh)} Q0,${n(hh + 3)} ${n(-hw + 1)},${n(hh)}Z`;
  let marks = '';
  if (poetry) {
    // Calligraphy: three short brush phrases in dark ink.
    const strokes = [
      `M-2,${n(-hh + 7)} q3,1 4,3 q-2,2 -4,1`,
      `M-3,${n(-hh + 16)} q4,-1 5,2 M0,${n(-hh + 15)} l0,7 q-1,2 -3,1`,
      `M-2,${n(-hh + 27)} q2,-1 4,1 q0,3 -3,4 q-1,-2 1,-3`,
      `M1,${n(-hh + 37)} q-3,1 -3,4 q2,2 4,-1`,
    ];
    marks = strokes
      .map((s) =>
        path(s, { fill: 'none', stroke: P.ink, 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
      )
      .join('');
  }
  const shine = path(`M${n(-hw + 2)},${n(-hh + 3)} L${n(-hw + 2.5)},${n(hh - 3)}`, {
    stroke: 'rgba(255,255,255,0.35)',
    'stroke-width': 1.2,
  });
  return g(
    { transform: `translate(${n(cx)},${n(cy)}) rotate(${n(angle)})` },
    path(d, { fill: color, ...INK }),
    shine,
    marks,
  );
}

/** Radial needle cluster for pine. */
export function pineCluster(
  cx: number,
  cy: number,
  r: number,
  dark: string,
  light: string,
): string {
  let out = path(`M${n(cx - r)},${n(cy)} A${n(r)},${n(r * 0.8)} 0 0 1 ${n(cx + r)},${n(cy)} Z`, {
    fill: dark,
    ...INK,
  });
  for (let i = 0; i <= 10; i++) {
    const a = deg(180 + i * 18);
    out += path(
      `M${n(cx)},${n(cy)} L${n(cx + Math.cos(a) * r * 0.95)},${n(cy + Math.sin(a) * r * 0.78)}`,
      {
        stroke: light,
        'stroke-width': 1,
        'stroke-linecap': 'round',
      },
    );
  }
  return out;
}

/** A stroked branch through points (smooth quadratic chain). */
export function branch(points: [number, number][], width: number, color: string): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points as [[number, number], ...[number, number][]];
  let d = `M${n(first[0])},${n(first[1])}`;
  for (let i = 0; i < rest.length; i++) {
    const p = rest[i] as [number, number];
    const next = rest[i + 1];
    if (next) {
      const mx = (p[0] + next[0]) / 2;
      const my = (p[1] + next[1]) / 2;
      d += ` Q${n(p[0])},${n(p[1])} ${n(mx)},${n(my)}`;
    } else {
      d += ` L${n(p[0])},${n(p[1])}`;
    }
  }
  return (
    path(d, {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': width + 1.6,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }) +
    path(d, {
      fill: 'none',
      stroke: color,
      'stroke-width': width,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    })
  );
}

/** Seven-pointed maple leaf. */
export function maple(cx: number, cy: number, r: number, rot: number, fill: string): string {
  const pts: string[] = [];
  const lobes = [0, 40, 80, 125, -125, -80, -40];
  const lens = [1, 0.85, 0.62, 0.35, 0.35, 0.62, 0.85];
  const order = [4, 5, 6, 0, 1, 2, 3];
  for (const idx of order) {
    const a = deg(rot - 90 + (lobes[idx] as number));
    const l = (lens[idx] as number) * r;
    const b1 = deg(rot - 90 + (lobes[idx] as number) - 14);
    const b2 = deg(rot - 90 + (lobes[idx] as number) + 14);
    pts.push(`${n(cx + Math.cos(b1) * l * 0.45)},${n(cy + Math.sin(b1) * l * 0.45)}`);
    pts.push(`${n(cx + Math.cos(a) * l)},${n(cy + Math.sin(a) * l)}`);
    pts.push(`${n(cx + Math.cos(b2) * l * 0.45)},${n(cy + Math.sin(b2) * l * 0.45)}`);
  }
  const stemA = deg(rot + 90);
  return (
    path(
      `M${n(cx)},${n(cy)} L${n(cx + Math.cos(stemA) * r * 0.55)},${n(cy + Math.sin(stemA) * r * 0.55)}`,
      {
        stroke: P.ink,
        'stroke-width': 1,
      },
    ) + el('polygon', { points: pts.join(' '), fill, ...INK_THIN })
  );
}
