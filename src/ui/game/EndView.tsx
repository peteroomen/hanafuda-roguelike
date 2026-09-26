import { monthDef, seasonOf } from '@/content/cards';
import { cap } from '@/content/lands';
import { spiritDef } from '@/content/spirits';
import { type YakuId, yakuText } from '@/content/yaku';
import type { RunState } from '@/engine/run';
import { spiritUrl } from '@/ui/art/images';
import { Crest, OmamoriIcon } from '@/ui/art/Icons';
import { setState } from '@/ui/state/store';

export function EndView({ run, unlocks }: { run: RunState; unlocks: string[] }) {
  const won = run.phase === 'victory';
  const st = run.stats;
  const topYaku = Object.entries(st.yakuScored)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3) as [YakuId, number][];
  const killer = !won && run.fight ? spiritDef(run.fight.spiritId) : null;
  return (
    <div
      className={`end screen-pad ${won ? 'won' : 'lost'}`}
      data-testid={won ? 'victory' : 'defeat'}
    >
      {won ? (
        <Crest size={96} />
      ) : (
        killer && (
          <img
            className="end-face"
            src={spiritUrl(killer.id, seasonOf(run.month, run.land), killer.boss, 'full')}
            alt=""
          />
        )
      )}
      <div className="end-title display">{won ? 'The year is complete' : 'Your petals fall'}</div>
      <div className="end-sub">
        {won
          ? `Twelve spirits calmed. ${cap(seasonOf(1, run.land))} comes again.`
          : `In ${monthDef(run.month, run.land).flower} month, ${killer?.name ?? 'a spirit'} took the last of your petals.`}
      </div>
      <div className="end-stats paper">
        <div>
          <b>{st.fightsWon}</b>
          <span>spirits calmed</span>
        </div>
        <div>
          <b>{st.biggestHit.toLocaleString('en-US')}</b>
          <span>biggest hit</span>
        </div>
        <div>
          <b>{st.koikoiCalls}</b>
          <span>koi-koi called</span>
        </div>
        <div>
          <b>{st.handsWon}</b>
          <span>hands won</span>
        </div>
      </div>
      {topYaku.length > 0 && (
        <div className="end-yaku">
          Favourite yaku:{' '}
          {topYaku.map(([id, n]) => (
            <span key={id}>
              {yakuText(id, run.land).name} ×{n}
            </span>
          ))}
        </div>
      )}
      {run.omamori.length > 0 && (
        <div className="end-charms">
          {run.omamori.map((m, i) => (
            <OmamoriIcon key={i} id={m.id} size={30} />
          ))}
        </div>
      )}
      {unlocks.length > 0 && (
        <div className="unlocks paper pop-in">
          <div className="display">Unlocked</div>
          {unlocks.map((u) => (
            <div key={u}>{u}</div>
          ))}
        </div>
      )}
      <div className="end-buttons">
        <button
          className="btn red wide"
          onClick={() => setState({ run: null, screen: 'setup' })}
          data-testid="btn-new-year"
        >
          A new year
        </button>
        <button className="btn ghost wide" onClick={() => setState({ run: null, screen: 'title' })}>
          Title
        </button>
      </div>
    </div>
  );
}
