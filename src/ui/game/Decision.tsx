import { spiritDef } from '@/content/spirits';
import { yakuDef } from '@/content/yaku';
import { currentYaku } from '@/engine/hand';
import { type FightState, previewPlayerStop, previewSpiritHit, type RunState } from '@/engine/run';
import { stakeMultiplier } from '@/engine/scoring';
import { cardFaceUrl } from '@/ui/art/images';
import { totalPoints } from '@/engine/yaku';

export function DecisionSheet({
  run,
  onStop,
  onKoikoi,
}: {
  run: RunState;
  onStop: () => void;
  onKoikoi: () => void;
}) {
  const f = run.fight as FightState;
  const h = f.hand;
  const hits = currentYaku(h, 0);
  const points = totalPoints(hits);
  const preview = previewPlayerStop(run);
  const dmg = preview?.damage ?? 0;
  const kills = dmg >= f.hp;
  const spirit = spiritDef(f.spiritId);
  const intentPts = f.intent ? yakuDef(f.intent.id).points : 3;
  const oppNow = totalPoints(currentYaku(h, 1));
  const riskPts = Math.max(intentPts, oppNow + 1);
  // What the spirit would land if it stops after your call.
  const risk = previewSpiritHit(
    {
      ...run,
      fight: {
        ...f,
        hand: { ...h, koikoi: [h.koikoi[0] + h.rules.koiKoiCallWeight, h.koikoi[1]] },
      },
    },
    riskPts,
  );
  const nextStake = stakeMultiplier(h.rules, h.koikoi[0] + h.rules.koiKoiCallWeight);
  const cardsLeft = h.hands[0].length;
  return (
    <div className="decision-scrim fade-in" data-testid="decision">
      <div className="decision paper pop-in">
        <div className="decision-yaku">
          {hits.map((y) => (
            <span key={y.id} className="yaku-pill">
              <span className="kanji">{yakuDef(y.id).kanji}</span>
              {yakuDef(y.id).name} <b>{y.points}</b>
            </span>
          ))}
        </div>
        <div className="decision-cols">
          <div className="decision-col">
            <div className="decision-head">Stop</div>
            <div className="decision-big display">{dmg.toLocaleString('en-US')}</div>
            <div className="decision-note">
              {kills ? (
                <b className="good">Finishes the {spirit.name}</b>
              ) : (
                <>
                  damage · leaves <b>{Math.max(0, f.hp - dmg).toLocaleString('en-US')}</b> HP
                </>
              )}
            </div>
          </div>
          <div className="decision-col koikoi">
            <div className="decision-head">Koi-koi</div>
            <div className="decision-big display">×{nextStake}</div>
            <div className="decision-note">
              your next stop · but if the spirit scores first: <b className="bad">~{risk.damage}</b>{' '}
              to you
            </div>
          </div>
        </div>
        <div className="decision-meta">
          {points} point{points === 1 ? '' : 's'} · {cardsLeft} card{cardsLeft === 1 ? '' : 's'}{' '}
          left in your hand
        </div>
        <div className="decision-buttons">
          <button className="btn gold" onClick={onStop} data-testid="btn-stop">
            Stop
          </button>
          <button className="btn red" onClick={onKoikoi} data-testid="btn-koikoi">
            Koi-koi!
          </button>
        </div>
      </div>
    </div>
  );
}

export function FrogSheet({
  run,
  onKeep,
  onLeap,
}: {
  run: RunState;
  onKeep: () => void;
  onLeap: () => void;
}) {
  const card = run.fight?.hand.revealed;
  return (
    <div className="decision-scrim fade-in" data-testid="frog">
      <div className="decision paper pop-in frog">
        <div className="decision-head">The Frog turns over…</div>
        {card !== null && card !== undefined && (
          <img className="frog-card" src={cardFaceUrl(card)} alt="" />
        )}
        <div className="decision-buttons">
          <button className="btn gold" onClick={onKeep} data-testid="btn-keep">
            Keep it
          </button>
          <button className="btn indigo" onClick={onLeap} data-testid="btn-leap">
            Leap again
          </button>
        </div>
      </div>
    </div>
  );
}

export function HandOverPanel({ run, onNext }: { run: RunState; onNext: () => void }) {
  const f = run.fight as FightState;
  const o = f.outcome;
  const s = spiritDef(f.spiritId);
  let title = 'The hand wilts';
  let body = 'No one scored this hand.';
  if (o?.kind === 'playerStop') {
    title = `You strike for ${o.score.damage.toLocaleString('en-US')}`;
    body = `${s.name} has ${f.hp.toLocaleString('en-US')} HP left.`;
  } else if (o?.kind === 'spiritStop') {
    title = `${s.name} hits you for ${o.hit.damage}`;
    body = `You have ${run.hp} HP. The spirit grows fiercer each hand.`;
  }
  return (
    <div className="handover fade-in" data-testid="handover">
      <div className="handover-card paper pop-in">
        <div className="handover-title display">{title}</div>
        <div className="handover-body">{body}</div>
        <button className="btn red wide" onClick={onNext} data-testid="btn-next-hand">
          Deal hand {f.handNo + 1}
        </button>
      </div>
    </div>
  );
}

export function Hint({
  text,
  onCancel,
  top,
}: {
  text: string;
  onCancel?: () => void;
  /** Stage y to sit at; hints go just above the field so they never cover a card. */
  top?: number;
}) {
  return (
    <div className="hint pop-in" data-testid="hint" style={top === undefined ? undefined : { top }}>
      <span>{text}</span>
      {onCancel && (
        <button className="btn ghost small" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}
