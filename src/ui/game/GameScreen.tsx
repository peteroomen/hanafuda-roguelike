import { useEffect, useRef, useState } from 'react';
import { seasonOf } from '@/content/cards';
import { recordRun, noteSeen } from '@/ui/state/meta';
import { EndView } from './EndView';
import { FightView } from './FightView';
import { RewardView } from './RewardView';
import { ShopView } from './ShopView';
import { useGame } from './useGame';
import { Viewport } from './Viewport';

export function GameScreen() {
  const api = useGame();
  const run = api.view.shown;
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const recorded = useRef(false);

  useEffect(() => {
    noteSeen(run);
    if ((run.phase === 'victory' || run.phase === 'defeat') && !recorded.current) {
      recorded.current = true;
      setUnlocks(recordRun(run, true));
    }
  }, [run]);

  const season = seasonOf(run.month);
  return (
    <Viewport season={season}>
      {(h) => (
        <div
          className="screen"
          style={{ height: h }}
          key={run.phase === 'fight' ? `fight-${run.month}` : run.phase}
        >
          {run.phase === 'fight' && run.fight && <FightView api={api} stageH={h} />}
          {run.phase === 'reward' && <RewardView api={api} />}
          {run.phase === 'shop' && <ShopView api={api} />}
          {(run.phase === 'victory' || run.phase === 'defeat') && (
            <EndView run={run} unlocks={unlocks} />
          )}
        </div>
      )}
    </Viewport>
  );
}
