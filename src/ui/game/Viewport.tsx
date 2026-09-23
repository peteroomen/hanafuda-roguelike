import { type ReactNode, useMemo } from 'react';
import type { Season } from '@/content/cards';
import { useStageSize } from './stageSize';

function Particles({ season }: { season: Season }) {
  const bits = useMemo(
    () =>
      Array.from({ length: season === 'summer' ? 10 : 14 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: -((i * 1.7) % 14),
        dur: 10 + ((i * 5) % 9),
        drift: ((i * 29) % 120) - 40,
        scale: 0.6 + ((i * 7) % 5) / 8,
      })),
    [season],
  );
  return (
    <div className="particles" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ['--drift' as string]: `${b.drift}px`,
            scale: String(b.scale),
          }}
        />
      ))}
    </div>
  );
}

/** Full-screen seasonal background plus a scaled 390-wide logical stage. */
export function Viewport({
  season,
  children,
}: {
  season: Season;
  children: (stageH: number) => ReactNode;
}) {
  const size = useStageSize();
  return (
    <div className="viewport washi" data-season={season}>
      <Particles season={season} />
      <div
        className="stage"
        style={{
          height: size.h,
          transform: `translate(${size.left}px, ${size.top}px) scale(${size.scale})`,
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      >
        {children(size.h)}
      </div>
    </div>
  );
}
