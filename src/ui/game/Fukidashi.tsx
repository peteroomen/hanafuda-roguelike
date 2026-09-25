/**
 * Fukidashi: a manga speech bubble whose shape carries the speaker's mood. Dotted for a whisper,
 * round for play, a cloud for scheming, a burst for a shout, dark spikes for menace, icicles for
 * cold. Shapes are drawn in a 300×132 box with the tail at the bottom left; `tail="up"` flips the
 * shape (not the text) so the tail points up at a portrait above.
 */
import type { Mood } from '@/content/voices';

const W = 300;
const H = 132;

function points(
  n: number,
  radius: (k: number) => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  const pts: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const r = radius(k);
    pts.push(`${(cx + rx * r * Math.cos(a)).toFixed(1)},${(cy + ry * r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** A fixed wobble so bursts look hand-cut but are the same every time. */
const WOBBLE = [0, 0.05, -0.03, 0.04, -0.05, 0.02, -0.02, 0.05, -0.04, 0.03, 0, -0.05, 0.04];

function scallop(cx: number, cy: number, rx: number, ry: number, n: number): string {
  const p = (k: number) =>
    `${(cx + rx * Math.cos((2 * Math.PI * k) / n)).toFixed(1)},${(cy + ry * Math.sin((2 * Math.PI * k) / n)).toFixed(1)}`;
  let d = `M${p(0)}`;
  for (let k = 1; k <= n; k++) d += ` A 14 12 0 0 1 ${p(k % n)}`;
  return `${d} Z`;
}

function icicles(x: number, y: number, w: number, h: number, r = 14): string {
  let d = `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h}`;
  let k = x + w - r;
  let i = 0;
  while (k > x + r + 8) {
    d += ` L${k - 5},${y + h + (i % 3 === 0 ? 14 : 8)} L${k - 10},${y + h}`;
    k -= 12;
    i += 1;
  }
  return `${d} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

const SHAPES: Record<Mood, string[]> = {
  whisper: [points(80, () => 1, 150, 62, 132, 46), 'M78,100 L64,124 L96,104'],
  playful: [
    points(80, (k) => 1 + 0.04 * Math.sin((5 * 2 * Math.PI * k) / 80), 150, 60, 134, 46),
    'M84,98 Q70,118 58,126 Q88,118 104,102',
  ],
  sly: [scallop(150, 60, 124, 40, 14)],
  shout: [
    points(
      34,
      (k) => (k % 2 === 0 ? 1 : 0.78 + (WOBBLE[k % WOBBLE.length] ?? 0)),
      150,
      62,
      140,
      52,
    ),
  ],
  menace: [
    points(
      26,
      (k) => (k % 2 === 0 ? 1 : 0.72 + (WOBBLE[k % WOBBLE.length] ?? 0)),
      150,
      62,
      142,
      54,
    ),
  ],
  cold: [icicles(14, 16, 272, 82)],
};

export function Fukidashi({
  mood,
  text,
  tail = 'down',
  className,
}: {
  mood: Mood;
  text: string;
  tail?: 'down' | 'up';
  className?: string;
}) {
  const flip = tail === 'up' ? `translate(0 ${H}) scale(1 -1)` : undefined;
  // Long lines get a smaller size so they stay inside the shape.
  const size = text.length > 36 ? 'long' : text.length > 22 ? 'mid' : 'short';
  return (
    <div
      className={`fukidashi mood-${mood} tail-${tail} ${className ?? ''}`}
      data-testid="fukidashi"
    >
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <g transform={flip}>
          {SHAPES[mood].map((d, i) => (
            <path key={i} d={d} className="fk-shape" />
          ))}
          {mood === 'sly' && (
            <>
              <circle cx="70" cy="112" r="7" className="fk-shape" />
              <circle cx="56" cy="124" r="4" className="fk-shape" />
            </>
          )}
        </g>
      </svg>
      <div className={`fk-text fk-${size}`}>{text}</div>
    </div>
  );
}
