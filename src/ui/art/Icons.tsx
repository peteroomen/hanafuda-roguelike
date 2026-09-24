/**
 * Charm (omamori), talisman (ofuda) and poem icons as inline SVG. Their motif is
 * the item's kanji, embroidered or brushed, so every item is distinct.
 */
import { ofudaDef, type OfudaId } from '@/content/ofuda';
import { omamoriDef, type OmamoriId } from '@/content/omamori';
import { yakuDef, type YakuId } from '@/content/yaku';

function vertical(text: string, x: number, y: number, size: number, fill: string, maxChars = 3) {
  const chars = Array.from(text).slice(0, maxChars);
  const step = size * 1.02;
  const top = y - ((chars.length - 1) * step) / 2;
  return chars.map((ch, i) => (
    <text
      key={i}
      x={x}
      y={top + i * step}
      fontSize={size}
      fontFamily="Shippori, serif"
      fontWeight={800}
      fill={fill}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {ch}
    </text>
  ));
}

export function OmamoriIcon({ id, size = 44 }: { id: OmamoriId; size?: number }) {
  const d = omamoriDef(id);
  const silk = `hsl(${d.hue}, 58%, 42%)`;
  const silkDark = `hsl(${d.hue}, 60%, 26%)`;
  const rim = d.rarity === 'rare' ? '#f6d27a' : d.rarity === 'uncommon' ? '#d9dce2' : '#caa46a';
  const kanji = d.kanji.length > 3 ? d.kanji.slice(0, 3) : d.kanji;
  return (
    <svg width={size} height={size * (80 / 60)} viewBox="0 0 60 80" aria-label={d.name} role="img">
      <defs>
        <pattern id={`bro-${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M4 0 L8 4 L4 8 L0 4Z" fill="rgba(255,255,255,0.09)" />
        </pattern>
      </defs>
      <path
        d="M22 12 C18 2 42 2 38 12"
        fill="none"
        stroke={rim}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 16 Q30 10 46 16 L50 70 Q50 76 44 76 L16 76 Q10 76 10 70 Z"
        fill={silk}
        stroke="#1d1712"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M14 16 Q30 10 46 16 L50 70 Q50 76 44 76 L16 76 Q10 76 10 70 Z"
        fill={`url(#bro-${id})`}
      />
      <path d="M13 22 Q30 16 47 22" fill="none" stroke={rim} strokeWidth="2.2" />
      <circle cx="30" cy="16" r="4" fill={rim} stroke="#1d1712" strokeWidth="1.5" />
      <rect
        x="19"
        y="27"
        width="22"
        height="43"
        rx="3"
        fill="#f6efdf"
        stroke={silkDark}
        strokeWidth="1.5"
      />
      {vertical(kanji, 30, 48.5, kanji.length >= 3 ? 12 : 15, '#1d1712')}
    </svg>
  );
}

export function OfudaIcon({ id, size = 30 }: { id: OfudaId; size?: number }) {
  const d = ofudaDef(id);
  return (
    <svg width={size} height={size * (80 / 36)} viewBox="0 0 36 80" aria-label={d.name} role="img">
      <rect
        x="2"
        y="2"
        width="32"
        height="76"
        rx="2"
        fill="#f7f1e2"
        stroke="#1d1712"
        strokeWidth="2"
      />
      <rect x="6" y="6" width="24" height="68" fill="none" stroke="#b8322a" strokeWidth="1" />
      <circle cx="18" cy="16" r="6.5" fill="#c8321e" />
      <text
        x="18"
        y="16.5"
        fontSize="7"
        fill="#f7f1e2"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Shippori, serif"
        fontWeight={800}
      >
        符
      </text>
      {vertical(d.kanji, 18, 48, 12, '#1d1712', 2)}
    </svg>
  );
}

export function PoemIcon({ id, size = 30 }: { id: YakuId; size?: number }) {
  const d = yakuDef(id);
  const color =
    d.family === 'ribbons'
      ? '#c8321e'
      : d.family === 'brights'
        ? '#d99a1e'
        : d.family === 'animals'
          ? '#3f7c39'
          : d.family === 'sake'
            ? '#7a3b8a'
            : d.family === 'chaff'
              ? '#8a6a3a'
              : '#2b4f9c';
  const k = d.kanji.replace('・', '').slice(0, 3);
  return (
    <svg
      width={size}
      height={size * (80 / 36)}
      viewBox="0 0 36 80"
      aria-label={`${d.name} poem`}
      role="img"
    >
      <path
        d="M6 2 L30 2 L32 78 L4 78 Z"
        fill={color}
        stroke="#1d1712"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 6 L27 6 L28 74 L8 74 Z" fill="#f7efdc" />
      {vertical(k, 18, 40, k.length >= 3 ? 11 : 13, '#1d1712')}
    </svg>
  );
}

/** Small heart-like petal used for HP. */
export function PetalIcon({ size = 16, color = '#f19ab2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path
        d="M10 18 C3 13 1 8 3 5 C5 2 9 3 10 6 C11 3 15 2 17 5 C19 8 17 13 10 18Z"
        fill={color}
        stroke="#1d1712"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="8.5" fill="#e3a92a" stroke="#6b4808" strokeWidth="1.5" />
      <rect x="7.5" y="7.5" width="5" height="5" fill="#6b4808" />
    </svg>
  );
}

/** The twelve-petal crest used as the game's emblem. */
export function Crest({
  size = 64,
  color = '#f19ab2',
  center = '#f6d27a',
}: {
  size?: number;
  color?: string;
  center?: string;
}) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {petals.map((a) => (
        <ellipse
          key={a}
          cx="50"
          cy="24"
          rx="8"
          ry="20"
          fill={color}
          stroke="#1d1712"
          strokeWidth="1.5"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="12" fill={center} stroke="#1d1712" strokeWidth="2" />
    </svg>
  );
}
