import { usePaperOnOpen } from '@/ui/audio/usePaper';
import { useState } from 'react';
import * as sfx from '@/ui/audio/audio';
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
  usePaperOnOpen();
  const [peek, setPeek] = useState(false);
  const f = run.fight as FightState;
  const h = f.hand;
  const points = totalPoints(currentYaku(h, 0));
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
    // No scrim: the field, both captured lanes and the tracker stay in view. The panel covers only
    // your hand and the bottom bar. Holding the peek button slides it down (leaving its top row)
    // so you can see your hand; letting go brings it back.
    <div className={`decide-panel ${peek ? 'peeking' : ''}`} data-testid="decision">
      <div className="decide-top">
        {/* The yaku themselves are on the tracker, just above the panel. */}
        <div className="decide-q">
          <b>{points}</b> point{points === 1 ? '' : 's'}. Stop, or koi-koi?
        </div>
        <button
          className="peek-btn"
          onPointerDown={(e) => {
            // No long-press text selection (and its buzz) while holding.
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            sfx.waterDrop();
            setPeek(true);
          }}
          data-quiet
          onPointerUp={() => setPeek(false)}
          onPointerCancel={() => setPeek(false)}
          onLostPointerCapture={() => setPeek(false)}
          onContextMenu={(e) => e.preventDefault()}
          data-testid="btn-peek"
        >
          <span className="peek-eye" aria-hidden />
          {peek ? 'Let go' : 'Hold: hand'}
        </button>
      </div>
      <div className="decision-buttons">
        <button className="decide-btn stop" onClick={onStop} data-testid="btn-stop">
          <span className="decide-label">Stop</span>
          <span className="decide-big display">{dmg.toLocaleString('en-US')}</span>
          <span className="decide-note">
            {kills ? (
              <>finishes the {spirit.name}</>
            ) : (
              <>damage · leaves {Math.max(0, f.hp - dmg).toLocaleString('en-US')} HP</>
            )}
          </span>
        </button>
        <button className="decide-btn koikoi" onClick={onKoikoi} data-testid="btn-koikoi">
          <span className="decide-label">Koi-koi!</span>
          <span className="decide-big display">×{nextStake}</span>
          <span className="decide-note">
            {cardsLeft} card{cardsLeft === 1 ? '' : 's'} left · risk ~{risk.damage} HP
          </span>
        </button>
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
  usePaperOnOpen();
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
  usePaperOnOpen();
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
