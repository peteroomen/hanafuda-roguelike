import { rainManUrl } from '@/ui/art/images';
import type { Banner, Floater } from './useGame';
import { landText } from '@/content/lands';
import { useLand } from '@/ui/state/store';
import { TIPS } from './tips';

export function BannerView({ banner }: { banner: Banner | null }) {
  if (!banner) return null;
  return (
    <div
      className={`banner banner-${banner.kind} ${banner.seat === 1 ? 'theirs' : ''}`}
      key={banner.id}
      data-testid="banner"
    >
      <div className="banner-title display">{banner.title}</div>
      {banner.sub && <div className="banner-sub">{banner.sub}</div>}
    </div>
  );
}

export function Floaters({ floaters, stageH }: { floaters: readonly Floater[]; stageH: number }) {
  return (
    <>
      {floaters.map((f, i) => {
        const top = f.at === 'spirit' ? 40 : f.at === 'player' ? stageH - 110 : stageH / 2;
        const left = f.at === 'spirit' ? 150 : f.at === 'player' ? 40 : 150;
        return (
          <div
            key={f.id}
            className={`floater floater-${f.kind}`}
            style={{ top: top - (i % 3) * 14, left }}
          >
            {f.text}
          </div>
        );
      })}
    </>
  );
}

export function GuideBubble({
  tip,
  onDismiss,
  bottom,
}: {
  tip: string | null;
  onDismiss: () => void;
  bottom: number;
}) {
  const land = useLand();
  if (!tip) return null;
  const raw = TIPS[tip];
  if (!raw) return null;
  const text = landText(raw, land);
  return (
    <button className="guide pop-in" style={{ bottom }} onClick={onDismiss} data-testid="guide">
      <img src={rainManUrl()} alt="The Rain Man" className="guide-face" />
      <div className="guide-text">
        {text}
        <span className="guide-ok">tap</span>
      </div>
    </button>
  );
}
