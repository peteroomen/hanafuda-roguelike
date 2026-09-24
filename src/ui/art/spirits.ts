/**
 * Original yokai portraits (viewBox 200×200) drawn as bold ink medallions.
 */
import type { Season } from '@/content/cards';
import type { SpiritId } from '@/content/spirits';
import { circle, el, ellipse, g, n, P, path, polygon, rect } from './svg';

const SEASON_BG: Record<Season, [string, string]> = {
  spring: ['#f6d4dc', '#d98aa0'],
  summer: ['#bcd3ea', '#4d73a8'],
  autumn: ['#f3cf9e', '#c96a2b'],
  winter: ['#dfe6ec', '#7d8b99'],
};

const K = {
  stroke: P.ink,
  'stroke-width': 3,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
} as const;
const K2 = {
  stroke: P.ink,
  'stroke-width': 2,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
} as const;

function eye(
  x: number,
  y: number,
  r: number,
  iris: string = P.ink,
  white: string = P.white,
  pupil?: 'slit',
): string {
  return (
    ellipse(x, y, r, r * 0.8, { fill: white, ...K2 }) +
    (pupil === 'slit'
      ? ellipse(x, y, r * 0.22, r * 0.72, { fill: iris })
      : circle(x, y, r * 0.5, { fill: iris }) +
        circle(x + r * 0.2, y - r * 0.2, r * 0.16, { fill: P.white }))
  );
}

function tongue(x: number, y: number, len: number, bend: number): string {
  return path(
    `M${x - 6},${y} C${x - 7},${y + len * 0.6} ${x + bend - 8},${y + len} ${x + bend},${y + len} C${x + bend + 8},${y + len} ${x + 7},${y + len * 0.6} ${x + 6},${y}Z`,
    {
      fill: '#d9435a',
      ...K2,
    },
  );
}

// --- Spring ----------------------------------------------------------------

function kodama(): string {
  return g(
    {},
    path(
      'M100,40 C70,40 52,70 54,104 C56,142 74,168 100,168 C126,168 144,142 146,104 C148,70 130,40 100,40Z',
      { fill: '#eef0dc', ...K },
    ),
    path('M76,70 q10,-8 18,0 M108,62 q12,-6 20,6', {
      stroke: '#b9bea0',
      'stroke-width': 2,
      fill: 'none',
    }),
    ellipse(82, 102, 9, 12, { fill: P.ink }),
    ellipse(118, 100, 9, 12, { fill: P.ink }),
    ellipse(100, 132, 6, 8, { fill: P.ink }),
    path('M100,40 C98,30 90,24 82,24 M100,40 C104,28 114,22 124,26', {
      stroke: P.brown,
      'stroke-width': 3,
      fill: 'none',
    }),
    ...[0, 1, 2, 3, 4, 5].map((i) =>
      path(`M${82 + i * 8},${22 - (i % 2) * 4} l${i < 3 ? -6 : 6},-10`, {
        stroke: P.green,
        'stroke-width': 2.4,
      }),
    ),
  );
}

function zashikiWarashi(): string {
  return g(
    {},
    path('M40,200 C44,160 70,146 100,146 C130,146 156,160 160,200Z', { fill: P.crimson, ...K }),
    path('M86,146 L100,170 L114,146', { fill: P.white, ...K2 }),
    circle(100, 100, 44, { fill: '#f6dcc4', ...K }),
    path(
      'M56,100 C54,58 78,44 100,44 C122,44 146,58 144,100 L144,112 L132,112 L132,86 L68,86 L68,112 L56,112Z',
      { fill: P.ink },
    ),
    path('M68,86 L132,86', { stroke: P.ink, 'stroke-width': 2 }),
    ellipse(84, 104, 5, 6, { fill: P.ink }),
    ellipse(116, 104, 5, 6, { fill: P.ink }),
    circle(85.5, 102, 1.6, { fill: P.white }),
    circle(117.5, 102, 1.6, { fill: P.white }),
    ellipse(74, 118, 7, 4, { fill: '#f19aa6', opacity: 0.8 }),
    ellipse(126, 118, 7, 4, { fill: '#f19aa6', opacity: 0.8 }),
    path('M90,124 Q100,134 110,124', { fill: 'none', ...K2 }),
  );
}

function kasaObake(): string {
  let ribs = '';
  for (let i = 0; i < 7; i++)
    ribs += path(`M100,24 L${n(52 + i * 16)},150`, { stroke: '#a8623a', 'stroke-width': 1.5 });
  return g(
    {},
    path('M100,22 L44,152 Q100,168 156,152Z', { fill: '#e8b04a', ...K }),
    ribs,
    path('M44,152 Q100,168 156,152', { fill: 'none', stroke: P.ink, 'stroke-width': 3 }),
    rect(96, 8, 8, 18, { fill: P.brown, ...K2 }),
    eye(100, 92, 20, P.ink),
    tongue(100, 130, 48, 18),
    path('M100,166 L100,196', { stroke: P.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }),
    path('M100,166 L100,196', { stroke: '#f1d6b8', 'stroke-width': 4, 'stroke-linecap': 'round' }),
  );
}

// --- Summer ----------------------------------------------------------------

function chochinObake(): string {
  let ribs = '';
  for (let i = 0; i < 7; i++)
    ribs += path(
      `M${n(50 + i * 0.5)},${54 + i * 16} C80,${50 + i * 16} 120,${50 + i * 16} ${n(150 - i * 0.5)},${54 + i * 16}`,
      { stroke: '#b86a2a', 'stroke-width': 1.5, fill: 'none' },
    );
  return g(
    {},
    circle(100, 104, 70, { fill: 'rgba(255,190,90,0.35)' }),
    rect(74, 28, 52, 14, { fill: P.ink, rx: 3 }),
    rect(74, 164, 52, 14, { fill: P.ink, rx: 3 }),
    path('M74,42 C40,60 40,150 74,164 L126,164 C160,150 160,60 126,42Z', { fill: '#f6d27a', ...K }),
    ribs,
    path('M66,118 C80,106 120,106 134,118 C124,146 76,146 66,118Z', { fill: '#3b0f0c', ...K2 }),
    tongue(100, 132, 50, -20),
    eye(82, 84, 12),
    eye(122, 80, 9),
  );
}

function kawauso(): string {
  return g(
    {},
    path('M50,200 C54,164 74,150 100,150 C126,150 146,164 150,200Z', { fill: '#6d4a2c', ...K }),
    ellipse(100, 108, 48, 42, { fill: '#8c5e36', ...K }),
    ellipse(100, 124, 26, 18, { fill: '#e7c9a0', ...K2 }),
    circle(60, 76, 9, { fill: '#8c5e36', ...K2 }),
    circle(140, 76, 9, { fill: '#8c5e36', ...K2 }),
    path('M78,98 q8,-8 16,0 M106,98 q8,-8 16,0', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 3.5,
    }),
    ellipse(100, 116, 7, 5, { fill: P.ink }),
    path('M100,122 q-6,8 -12,4 M100,122 q6,8 12,4', { fill: 'none', ...K2 }),
    path('M74,120 l-24,-4 M74,126 l-24,4 M126,120 l24,-4 M126,126 l24,4', {
      stroke: P.ink,
      'stroke-width': 1.5,
    }),
    // Straw hat of a riverside trickster.
    path('M40,74 Q100,20 160,74 Q100,64 40,74Z', { fill: '#d8b25c', ...K }),
    path('M60,66 Q100,40 140,66', { fill: 'none', stroke: '#a88a3c', 'stroke-width': 2 }),
  );
}

function hitotsumeKozo(): string {
  return g(
    {},
    path('M44,200 C48,164 72,150 100,150 C128,150 152,164 156,200Z', { fill: '#5f7fa6', ...K }),
    path('M86,150 L100,176 L114,150', { fill: P.white, ...K2 }),
    ellipse(100, 98, 46, 52, { fill: '#f3dcc6', ...K }),
    eye(100, 90, 24, '#3a2a14', P.white),
    path('M74,64 q26,-12 52,0', { fill: 'none', stroke: '#e4c4a4', 'stroke-width': 3 }),
    path('M86,128 Q100,138 114,128', { fill: '#b8323a', ...K2 }),
    tongue(100, 134, 20, 4),
  );
}

// --- Autumn ----------------------------------------------------------------

function bakeneko(): string {
  return g(
    {},
    path('M150,190 C180,160 176,120 190,100 M150,192 C176,176 186,150 196,140', {
      stroke: '#e0d6c6',
      'stroke-width': 10,
      fill: 'none',
      'stroke-linecap': 'round',
    }),
    path('M150,190 C180,160 176,120 190,100 M150,192 C176,176 186,150 196,140', {
      stroke: P.ink,
      'stroke-width': 2,
      fill: 'none',
    }),
    path('M52,196 C56,160 76,150 100,150 C124,150 144,160 148,196Z', { fill: '#e8dfd0', ...K }),
    path('M46,70 L64,24 L86,62Z M154,70 L136,24 L114,62Z', { fill: '#e8dfd0', ...K }),
    path('M52,64 L64,34 L76,60Z M148,64 L136,34 L124,60Z', { fill: '#e8a0a8' }),
    ellipse(100, 104, 56, 50, { fill: '#e8dfd0', ...K }),
    path('M52,86 C66,70 80,74 88,82 C74,86 62,92 52,86Z', { fill: '#d69a44' }),
    path('M60,40 Q100,20 140,40 L136,60 Q100,48 64,60Z', { fill: '#3c6fb0', ...K2 }),
    ...[64, 80, 96, 112, 128].map((x) => circle(x, 50, 2.5, { fill: P.white })),
    eye(78, 98, 13, '#1d1712', '#f2c740', 'slit'),
    eye(122, 98, 13, '#1d1712', '#f2c740', 'slit'),
    path('M94,116 L100,122 L106,116Z', { fill: '#d98a94', ...K2 }),
    path('M80,128 Q90,138 100,128 Q110,138 120,128', { fill: 'none', ...K2 }),
    path('M86,132 l3,8 l3,-7 M108,132 l3,8 l3,-7', { fill: P.white, ...K2 }),
    path('M60,118 l-26,-4 M60,124 l-26,4 M140,118 l26,-4 M140,124 l26,4', {
      stroke: P.ink,
      'stroke-width': 1.5,
    }),
  );
}

function ittanMomen(): string {
  return g(
    {},
    path(
      'M36,20 C80,30 120,24 164,34 C150,70 160,110 140,150 C120,180 90,170 70,190 C60,160 70,120 50,90 C40,70 44,40 36,20Z',
      { fill: '#f6f3ea', ...K },
    ),
    path('M52,60 C80,64 120,62 150,70', { fill: 'none', stroke: '#d8d2c2', 'stroke-width': 2 }),
    path('M60,130 C84,128 112,122 138,118', { fill: 'none', stroke: '#d8d2c2', 'stroke-width': 2 }),
    path('M74,90 q12,-8 22,2', { fill: 'none', stroke: P.ink, 'stroke-width': 4 }),
    path('M110,86 q12,-8 22,2', { fill: 'none', stroke: P.ink, 'stroke-width': 4 }),
    ellipse(86, 94, 4, 5, { fill: P.ink }),
    ellipse(121, 90, 4, 5, { fill: P.ink }),
    path('M40,40 C20,50 12,70 16,90 M160,60 C184,70 190,90 186,110', {
      fill: 'none',
      stroke: '#f6f3ea',
      'stroke-width': 9,
      'stroke-linecap': 'round',
    }),
    path('M40,40 C20,50 12,70 16,90 M160,60 C184,70 190,90 186,110', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 1.5,
    }),
  );
}

function nopperabo(): string {
  return g(
    {},
    path('M44,200 C48,164 72,150 100,150 C128,150 152,164 156,200Z', { fill: '#3b4a5c', ...K }),
    path('M86,150 L100,172 L114,150', { fill: P.white, ...K2 }),
    ellipse(100, 98, 44, 54, { fill: '#f2e0cc', ...K }),
    path('M56,92 C54,52 76,40 100,40 C124,40 146,52 144,92 C130,70 70,70 56,92Z', { fill: P.ink }),
    ellipse(100, 36, 12, 9, { fill: P.ink }),
    path('M86,120 q14,4 28,0', { fill: 'none', stroke: '#e6cdb4', 'stroke-width': 2 }),
    path('M76,100 q6,-3 12,0 M112,100 q6,-3 12,0', {
      fill: 'none',
      stroke: '#e6cdb4',
      'stroke-width': 2,
    }),
  );
}

// --- Winter ----------------------------------------------------------------

function kamaitachi(): string {
  const wind = [0, 1, 2]
    .map((i) =>
      path(
        `M${20 + i * 8},${150 - i * 30} C60,${120 - i * 30} 140,${140 - i * 30} 184,${110 - i * 30}`,
        {
          stroke: 'rgba(255,255,255,0.7)',
          'stroke-width': 3,
          fill: 'none',
          'stroke-linecap': 'round',
        },
      ),
    )
    .join('');
  return g(
    {},
    wind,
    ellipse(100, 112, 50, 40, { fill: '#b98a4e', ...K }),
    ellipse(100, 126, 28, 18, { fill: '#f2e2c4', ...K2 }),
    path('M62,84 L66,58 L84,76Z M138,84 L134,58 L116,76Z', { fill: '#b98a4e', ...K2 }),
    path('M72,100 L94,106 L72,110Z M128,100 L106,106 L128,110Z', { fill: '#f2c740', ...K2 }),
    circle(84, 106, 2.4, { fill: P.ink }),
    circle(116, 106, 2.4, { fill: P.ink }),
    ellipse(100, 120, 6, 4, { fill: P.ink }),
    path('M90,132 L96,140 L100,132 L104,140 L110,132', { fill: P.white, ...K2 }),
    // Sickle claws.
    path('M36,160 C20,130 30,100 56,90 C46,112 44,134 52,160Z', { fill: '#cfd6de', ...K }),
    path('M164,160 C180,130 170,100 144,90 C154,112 156,134 148,160Z', { fill: '#cfd6de', ...K }),
  );
}

function rokurokubi(): string {
  return g(
    {},
    path('M40,200 C44,176 60,168 76,168 C92,168 104,176 108,200Z', { fill: '#7a3b5a', ...K }),
    path('M74,170 C60,130 140,120 130,86 C122,60 70,76 84,48', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 20,
      'stroke-linecap': 'round',
    }),
    path('M74,170 C60,130 140,120 130,86 C122,60 70,76 84,48', {
      fill: 'none',
      stroke: '#f6e6d6',
      'stroke-width': 15,
      'stroke-linecap': 'round',
    }),
    ellipse(100, 48, 30, 32, { fill: '#f6e6d6', ...K, transform: 'rotate(-15,100,48)' }),
    path('M70,44 C68,14 108,6 126,24 C134,32 132,44 128,52 C118,34 90,28 72,52Z', { fill: P.ink }),
    ellipse(112, 16, 16, 10, { fill: P.ink }),
    path('M126,12 l18,-8 M124,18 l20,0', { stroke: P.gold, 'stroke-width': 3 }),
    path('M88,50 q6,-4 12,0 M110,44 q6,-4 12,0', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 3,
    }),
    path('M104,66 q6,4 12,-2', { fill: 'none', stroke: P.crimson, 'stroke-width': 3.5 }),
  );
}

function yamauba(): string {
  let hair = '';
  for (let i = 0; i < 14; i++) {
    const a = (-160 + i * 11) * (Math.PI / 180);
    hair += path(
      `M100,96 C${n(100 + Math.cos(a) * 50)},${n(96 + Math.sin(a) * 50)} ${n(100 + Math.cos(a) * 70)},${n(96 + Math.sin(a) * 60)} ${n(100 + Math.cos(a) * 86)},${n(96 + Math.sin(a) * 76)}`,
      {
        stroke: '#e8e6e0',
        'stroke-width': 8,
        fill: 'none',
        'stroke-linecap': 'round',
      },
    );
  }
  return g(
    {},
    path('M36,200 C40,166 66,150 100,150 C134,150 160,166 164,200Z', { fill: P.redDeep, ...K }),
    hair,
    ellipse(100, 104, 40, 46, { fill: '#e9cfae', ...K }),
    path('M72,90 q10,-6 18,2 M110,92 q8,-8 18,-2', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 3,
    }),
    circle(82, 98, 3, { fill: P.ink }),
    circle(118, 98, 3, { fill: P.ink }),
    path('M72,122 Q100,150 128,122 Q100,134 72,122Z', { fill: '#5a1a14', ...K2 }),
    path('M86,126 l2,6 l3,-5 M106,128 l3,5 l2,-6', { fill: P.white, ...K2 }),
    path('M80,108 q20,6 40,0', { fill: 'none', stroke: '#c9a888', 'stroke-width': 1.5 }),
  );
}

// --- Bosses ----------------------------------------------------------------

function tanuki(): string {
  return g(
    {},
    ellipse(100, 186, 58, 40, { fill: '#e8d8b4', ...K }),
    circle(56, 70, 16, { fill: '#7d5a3a', ...K }),
    circle(144, 70, 16, { fill: '#7d5a3a', ...K }),
    ellipse(100, 106, 58, 52, { fill: '#9a7048', ...K }),
    path(
      'M52,100 C60,78 86,80 92,104 C86,120 60,122 52,100Z M148,100 C140,78 114,80 108,104 C114,120 140,122 148,100Z',
      { fill: '#3a2616' },
    ),
    circle(76, 100, 8, { fill: P.white }),
    circle(124, 100, 8, { fill: P.white }),
    circle(77, 101, 4.5, { fill: P.ink }),
    circle(123, 101, 4.5, { fill: P.ink }),
    ellipse(100, 128, 22, 16, { fill: '#efe2c6', ...K2 }),
    ellipse(100, 120, 8, 6, { fill: P.ink }),
    path('M88,134 Q100,142 112,134', { fill: 'none', ...K2 }),
    // The shape-shifting leaf.
    path('M100,56 C88,40 94,22 112,14 C116,30 112,46 100,56Z', { fill: P.green, ...K2 }),
    path('M100,56 L108,24', { stroke: P.greenDeep, 'stroke-width': 1.5 }),
  );
}

function tengu(): string {
  return g(
    {},
    path('M40,200 C44,164 70,150 100,150 C130,150 156,164 160,200Z', { fill: '#e8e2d2', ...K }),
    path('M100,150 L80,200 M100,150 L120,200', { stroke: P.ink, 'stroke-width': 2 }),
    path('M44,110 C40,150 70,172 100,172 C130,172 160,150 156,110Z', { fill: P.white, ...K2 }),
    ellipse(100, 98, 44, 46, { fill: '#c82a1e', ...K }),
    path('M100,98 C120,96 150,92 176,84 C152,104 124,112 100,112Z', { fill: '#d63a26', ...K }),
    path('M60,76 L90,86 M140,76 L110,86', {
      stroke: P.ink,
      'stroke-width': 6,
      'stroke-linecap': 'round',
    }),
    path('M62,74 L86,82 M138,74 L114,82', { stroke: P.white, 'stroke-width': 2 }),
    eye(76, 92, 8, P.ink, '#f2c740'),
    eye(120, 90, 8, P.ink, '#f2c740'),
    rect(84, 34, 32, 22, { fill: P.ink, rx: 3, transform: 'rotate(-8,100,45)' }),
    path('M86,54 l30,-6', { stroke: P.gold, 'stroke-width': 2 }),
  );
}

function kappa(): string {
  return g(
    {},
    path('M40,200 C44,166 70,152 100,152 C130,152 156,166 160,200Z', { fill: '#3f7a4a', ...K }),
    path('M60,176 L140,176 M64,188 L136,188', { stroke: '#2c5a36', 'stroke-width': 3 }),
    ellipse(100, 104, 48, 50, { fill: '#5fa25a', ...K }),
    path('M50,76 C60,50 140,50 150,76 C130,62 70,62 50,76Z', { fill: '#1f3a24' }),
    ...[56, 70, 84, 98, 112, 126, 140].map((x) =>
      path(`M${x},68 l${x < 100 ? -4 : 4},-14`, {
        stroke: '#1f3a24',
        'stroke-width': 5,
        'stroke-linecap': 'round',
      }),
    ),
    ellipse(100, 58, 26, 8, { fill: '#b8dff0', ...K2 }),
    ellipse(100, 57, 18, 4, { fill: '#e8f6fb' }),
    eye(80, 98, 10, P.ink, '#f7f1c0'),
    eye(120, 98, 10, P.ink, '#f7f1c0'),
    path('M84,120 C92,114 108,114 116,120 L100,140Z', { fill: '#f2c740', ...K }),
  );
}

function namazu(): string {
  return g(
    {},
    path(
      'M10,120 C20,70 70,50 110,56 C160,62 190,90 192,120 C190,150 160,176 110,178 C60,178 18,160 10,120Z',
      { fill: '#4b5a6a', ...K },
    ),
    path('M30,150 C70,168 130,170 180,140 C150,166 110,176 76,172 C54,168 38,160 30,150Z', {
      fill: '#c9cfbf',
    }),
    path('M24,118 C60,120 110,124 160,114', { stroke: P.ink, 'stroke-width': 3.5, fill: 'none' }),
    path('M30,120 C60,140 120,142 160,118', { fill: '#7a1d1a', ...K2 }),
    path('M40,112 C20,90 12,70 16,48 M58,112 C48,84 50,62 60,44', {
      stroke: P.ink,
      'stroke-width': 3,
      fill: 'none',
      'stroke-linecap': 'round',
    }),
    eye(78, 90, 6, P.ink, '#f2c740'),
    eye(126, 86, 6, P.ink, '#f2c740'),
    ...[0, 1, 2, 3].map((i) =>
      path(`M${120 + i * 14},${150 - i * 4} q6,-6 12,0`, {
        stroke: '#6b7a8a',
        'stroke-width': 2,
        fill: 'none',
      }),
    ),
  );
}

function kitsune(): string {
  let tails = '';
  for (let i = 0; i < 9; i++) {
    const a = (-150 + i * 15) * (Math.PI / 180);
    const x = 100 + Math.cos(a) * 92;
    const y = 150 + Math.sin(a) * 92;
    tails += path(
      `M100,150 Q${n((100 + x) / 2 + Math.sin(a) * 18)},${n((150 + y) / 2 - Math.cos(a) * 18)} ${n(x)},${n(y)}`,
      {
        stroke: '#fbf4e4',
        'stroke-width': 18,
        fill: 'none',
        'stroke-linecap': 'round',
      },
    );
    tails += circle(x, y, 6, { fill: '#6fd0ff', opacity: 0.8 });
  }
  return g(
    {},
    tails,
    path('M46,76 L58,18 L90,58Z M154,76 L142,18 L110,58Z', { fill: '#fbf4e4', ...K }),
    path('M54,66 L60,32 L80,58Z M146,66 L140,32 L120,58Z', { fill: P.crimson }),
    path(
      'M52,74 C52,56 78,50 100,50 C122,50 148,56 148,74 C148,110 124,150 100,158 C76,150 52,110 52,74Z',
      { fill: '#fbf4e4', ...K },
    ),
    path('M68,88 Q80,78 92,90 Q80,94 68,88Z M132,88 Q120,78 108,90 Q120,94 132,88Z', {
      fill: P.crimson,
      ...K2,
    }),
    path('M72,88 l12,0 M116,88 l12,0', { stroke: P.ink, 'stroke-width': 2.5 }),
    path('M96,64 C92,76 108,76 104,64', { fill: P.crimson }),
    ellipse(100, 142, 7, 5, { fill: P.ink }),
    path('M74,112 q10,8 20,4 M126,112 q-10,8 -20,4', {
      stroke: P.crimson,
      'stroke-width': 3,
      fill: 'none',
    }),
  );
}

function nue(): string {
  let stripes = '';
  for (let i = 0; i < 6; i++)
    stripes += path(`M${40 + i * 22},160 q6,-14 0,-28`, {
      stroke: P.ink,
      'stroke-width': 5,
      fill: 'none',
      'stroke-linecap': 'round',
    });
  return g(
    {},
    path('M20,200 C24,150 60,130 100,130 C140,130 176,150 180,200Z', { fill: '#e0a032', ...K }),
    stripes,
    path('M150,196 C190,180 196,130 170,110 C160,100 168,86 180,84', {
      stroke: '#4f7a3a',
      'stroke-width': 12,
      fill: 'none',
      'stroke-linecap': 'round',
    }),
    path('M150,196 C190,180 196,130 170,110 C160,100 168,86 180,84', {
      stroke: P.ink,
      'stroke-width': 2,
      fill: 'none',
    }),
    polygon(
      [
        [176, 78],
        [192, 80],
        [182, 92],
      ],
      { fill: '#4f7a3a', ...K2 },
    ),
    circle(100, 88, 48, { fill: '#7a5238', ...K }),
    path(
      'M64,92 C64,64 84,56 100,56 C116,56 136,64 136,92 C136,118 120,130 100,130 C80,130 64,118 64,92Z',
      { fill: '#e8b89a', ...K2 },
    ),
    eye(84, 88, 8, '#7a1d1a', '#f2c740'),
    eye(116, 88, 8, '#7a1d1a', '#f2c740'),
    path('M88,112 Q100,122 112,112', { fill: 'none', ...K2 }),
    path('M92,102 l4,2 M108,102 l-4,2', { stroke: P.ink, 'stroke-width': 2 }),
  );
}

function yukiOnna(): string {
  let flakes = '';
  const spots: [number, number][] = [
    [30, 40],
    [168, 52],
    [40, 150],
    [170, 150],
    [150, 20],
    [20, 96],
  ];
  for (const [x, y] of spots) {
    flakes += path(
      `M${x - 6},${y} L${x + 6},${y} M${x},${y - 6} L${x},${y + 6} M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}`,
      {
        stroke: P.white,
        'stroke-width': 1.6,
      },
    );
  }
  return g(
    {},
    flakes,
    path('M52,60 C52,20 148,20 148,60 L156,196 L44,196Z', { fill: '#141a24' }),
    path('M50,200 C54,166 74,152 100,152 C126,152 146,166 150,200Z', { fill: '#f4f7fb', ...K }),
    path('M84,152 L100,184 L116,152', { fill: 'none', stroke: '#9fb2c6', 'stroke-width': 3 }),
    ellipse(100, 100, 36, 46, { fill: '#eef2f7', ...K }),
    path('M64,92 C62,56 82,48 100,50 C118,48 138,56 136,92 C124,70 76,70 64,92Z', {
      fill: '#141a24',
    }),
    path('M80,102 q8,5 16,0 M104,102 q8,5 16,0', {
      fill: 'none',
      stroke: '#2a3a52',
      'stroke-width': 2.6,
    }),
    path('M92,126 q8,4 16,0', {
      fill: 'none',
      stroke: '#7aa0c8',
      'stroke-width': 3.2,
      'stroke-linecap': 'round',
    }),
    ellipse(80, 116, 6, 3, { fill: '#c9d8ea' }),
    ellipse(120, 116, 6, 3, { fill: '#c9d8ea' }),
  );
}

function oni(): string {
  let hair = '';
  for (let i = 0; i < 11; i++)
    hair += path(`M${46 + i * 10.8},70 l${(i - 5) * 3},-24`, {
      stroke: P.ink,
      'stroke-width': 7,
      'stroke-linecap': 'round',
    });
  return g(
    {},
    rect(150, 60, 22, 136, { fill: '#5a5f66', rx: 8, ...K }),
    ...[0, 1, 2, 3, 4].map((i) => circle(161, 80 + i * 24, 4, { fill: '#2b2f35' })),
    hair,
    path('M60,60 L50,20 L76,50Z M140,60 L150,20 L124,50Z', { fill: '#f1e3c6', ...K }),
    path(
      'M46,98 C46,60 72,52 100,52 C128,52 154,60 154,98 C154,140 128,168 100,168 C72,168 46,140 46,98Z',
      { fill: '#cf3326', ...K },
    ),
    path('M62,82 L92,94 M138,82 L108,94', {
      stroke: P.ink,
      'stroke-width': 7,
      'stroke-linecap': 'round',
    }),
    eye(78, 102, 10, P.ink, '#f2c740'),
    eye(122, 102, 10, P.ink, '#f2c740'),
    path('M70,134 Q100,156 130,134 Q100,142 70,134Z', { fill: '#3b0f0c', ...K2 }),
    path('M78,136 l4,-12 l4,13 M114,137 l4,-13 l4,12', { fill: P.white, ...K2 }),
    ellipse(100, 120, 9, 6, { fill: '#a0241c', ...K2 }),
  );
}

// --- The guide -------------------------------------------------------------

export function rainManSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${el(
    'defs',
    {},
    el('clipPath', { id: 'rmclip' }, circle(100, 100, 94)),
  )}${circle(100, 100, 98, { fill: '#2f3442' })}${g(
    { 'clip-path': 'url(#rmclip)' },
    rect(0, 0, 200, 200, { fill: '#3e4658' }),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
      path(`M${i * 26},${(i * 37) % 80} l-8,20`, {
        stroke: 'rgba(210,225,255,0.4)',
        'stroke-width': 2,
      }),
    ),
    path('M26,200 C30,160 60,142 100,142 C140,142 170,160 174,200Z', { fill: P.redDeep, ...K }),
    path('M90,142 L100,170 L110,142', { fill: P.gold, ...K2 }),
    circle(100, 104, 36, { fill: '#f1d6b8', ...K }),
    path('M64,96 Q100,52 136,96 Q100,82 64,96Z', { fill: P.ink }),
    rect(90, 44, 20, 26, { fill: P.ink, rx: 4 }),
    path('M84,106 q6,-4 12,0 M104,106 q6,-4 12,0', {
      fill: 'none',
      stroke: P.ink,
      'stroke-width': 3,
    }),
    path('M90,124 Q100,130 110,124', { fill: 'none', ...K2 }),
    path('M20,64 Q70,6 180,40 L100,60Z', { fill: P.yellow, ...K }),
    path('M100,60 L100,30', { stroke: P.brown, 'stroke-width': 3 }),
    ...[0, 1, 2, 3].map((i) =>
      path(`M100,60 L${40 + i * 40},${58 - i * 6}`, { stroke: '#b8862a', 'stroke-width': 1.5 }),
    ),
  )}${circle(100, 100, 95, { fill: 'none', stroke: P.gold, 'stroke-width': 4 })}</svg>`;
}

const PORTRAITS: Record<SpiritId, () => string> = {
  kodama,
  zashikiWarashi,
  kasaObake,
  chochinObake,
  kawauso,
  hitotsumeKozo,
  bakeneko,
  ittanMomen,
  nopperabo,
  kamaitachi,
  rokurokubi,
  yamauba,
  tanuki,
  tengu,
  kappa,
  namazu,
  kitsune,
  nue,
  yukiOnna,
  oni,
};

/** A spirit's portrait medallion. Bosses get a gold rim. */
export function spiritSvg(id: SpiritId, season: Season, boss: boolean): string {
  const [light, dark] = SEASON_BG[season];
  const clip = `sp-${id}`;
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rays += path(
      `M100,100 L${n(100 + Math.cos(a) * 140)},${n(100 + Math.sin(a) * 140)} L${n(100 + Math.cos(a + 0.12) * 140)},${n(100 + Math.sin(a + 0.12) * 140)}Z`,
      {
        fill: 'rgba(255,255,255,0.12)',
      },
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${el(
    'defs',
    {},
    el('clipPath', { id: clip }, circle(100, 100, 94)) +
      el(
        'radialGradient',
        { id: `${clip}-bg`, cx: '50%', cy: '42%', r: '70%' },
        el('stop', { offset: '0%', 'stop-color': light }) +
          el('stop', { offset: '100%', 'stop-color': dark }),
      ),
  )}${circle(100, 100, 99, { fill: P.ink })}${g(
    { 'clip-path': `url(#${clip})` },
    rect(0, 0, 200, 200, { fill: `url(#${clip}-bg)` }),
    rays,
    PORTRAITS[id](),
  )}${circle(100, 100, 95, { fill: 'none', stroke: boss ? P.gold : '#2b2320', 'stroke-width': boss ? 6 : 4 })}${
    boss
      ? circle(100, 100, 88, { fill: 'none', stroke: 'rgba(227,169,42,0.5)', 'stroke-width': 1.5 })
      : ''
  }</svg>`;
}
