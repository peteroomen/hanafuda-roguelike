import { Crest } from '@/ui/art/Icons';
import { cardFaceUrl } from '@/ui/art/images';
import * as sfx from '@/ui/audio/audio';
import { setState, useStore } from '@/ui/state/store';
import { Viewport } from '@/ui/game/Viewport';

const FAN = [0, 28, 8, 40, 44];

export function Title() {
  const run = useStore((s) => s.run);
  const profile = useStore((s) => s.profile);
  const go = (screen: 'setup' | 'game' | 'collection' | 'settings') => {
    sfx.unlockAudio();
    sfx.uiTap();
    setState({ screen });
  };
  return (
    <Viewport season="spring">
      {(h) => (
        <div className="title-screen" style={{ height: h }} data-testid="title">
          <div className="title-fan">
            {FAN.map((id, i) => (
              <img
                key={id}
                src={cardFaceUrl(id)}
                alt=""
                style={{
                  transform: `rotate(${(i - 2) * 11}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                }}
              />
            ))}
          </div>
          <div className="title-crest">
            <Crest size={74} />
          </div>
          <h1 className="title-name display">Twelve Petals</h1>
          <div className="title-jp display">十二の花びら</div>
          <div className="title-tag">
            A Koi-Koi roguelike · twelve months, twelve spirits, one year
          </div>
          <div className="title-buttons">
            {run && (
              <button
                className="btn red wide"
                onClick={() => go('game')}
                data-testid="btn-continue"
              >
                Continue · month {run.month}
              </button>
            )}
            <button
              className={`btn ${run ? '' : 'red'} wide`}
              onClick={() => go('setup')}
              data-testid="btn-new"
            >
              New year
            </button>
            <div className="title-row">
              <button
                className="btn ghost"
                onClick={() => go('collection')}
                data-testid="btn-collection"
              >
                Collection
              </button>
              <button
                className="btn ghost"
                onClick={() => go('settings')}
                data-testid="btn-settings"
              >
                Settings
              </button>
            </div>
          </div>
          <div className="title-foot">
            {profile.runsStarted > 0 ? (
              <>
                Years begun {profile.runsStarted} · completed {profile.runsWon} · furthest month{' '}
                {profile.bestMonth}
              </>
            ) : (
              <>New to hanafuda? The first three months teach you everything.</>
            )}
          </div>
        </div>
      )}
    </Viewport>
  );
}
