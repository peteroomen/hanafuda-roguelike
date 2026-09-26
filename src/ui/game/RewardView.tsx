import { useEffect, useState } from 'react';
import { seasonOf } from '@/content/cards';
import { spiritDef } from '@/content/spirits';
import { spiritUrl } from '@/ui/art/images';
import { CoinIcon } from '@/ui/art/Icons';
import * as sfx from '@/ui/audio/audio';
import { speedFactor } from '@/ui/state/store';
import type { GameApi } from './useGame';

export function RewardView({ api }: { api: GameApi }) {
  const run = api.view.shown;
  const reward = run.reward;
  const [shown, setShown] = useState(0);
  const lines = reward?.lines ?? [];
  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(
      () => {
        setShown((n) => n + 1);
        sfx.coinSound();
      },
      (shown === 0 ? 350 : 260) * speedFactor(),
    );
    return () => clearTimeout(t);
  }, [shown, lines.length]);
  if (!reward || !run.fight) return null;
  const s = spiritDef(run.fight.spiritId);
  return (
    <div className="reward screen-pad" data-testid="reward">
      <img
        className="reward-face calmed"
        src={spiritUrl(s.id, seasonOf(run.month, run.land), s.boss, 'full')}
        alt=""
      />
      <div className="reward-title display">{s.name} is calmed</div>
      <div className="reward-sub">
        Month {run.month} complete · {12 - run.month} to go
      </div>
      <div className="reward-lines paper">
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className="reward-line pop-in">
            <span>{l.label}</span>
            <span className="mon">
              +{l.mon} <CoinIcon size={12} />
            </span>
          </div>
        ))}
        {shown >= lines.length && (
          <div className="reward-line total pop-in">
            <span>Total</span>
            <span className="mon">
              +{reward.total} <CoinIcon size={13} />
            </span>
          </div>
        )}
        {shown >= lines.length && reward.heal > 0 && (
          <div className="reward-line heal pop-in">
            <span>{s.boss ? 'The season turns: you recover' : 'A moment’s rest'}</span>
            <span>+{reward.heal} HP</span>
          </div>
        )}
      </div>
      <button
        className="btn gold wide reward-go"
        onClick={() => api.dispatch({ type: 'collect' })}
        data-testid="btn-collect"
      >
        Collect and go to the market
      </button>
    </div>
  );
}
