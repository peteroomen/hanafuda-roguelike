import { useEffect, useRef, useState } from 'react';
import { ALL_CARDS, type Season } from '@/content/cards';
import { omamoriDef } from '@/content/omamori';
import { spiritDef, type SpiritId } from '@/content/spirits';
import { yakuText } from '@/content/yaku';
import { enhancementDef } from '@/content/enhancements';
import type { ScoreResult, ScoreStep, SpiritHit } from '@/engine/scoring';
import type { YakuHit } from '@/engine/types';
import * as sfx from '@/ui/audio/audio';
import { cardFaceUrl, spiritUrl } from '@/ui/art/images';
import { OmamoriIcon } from '@/ui/art/Icons';
import { Seal } from '@/ui/art/Kiwi';
import { currentLand, speedFactor, useLand } from '@/ui/state/store';

function fmt(x: number): string {
  if (x >= 100000) return `${Math.round(x / 1000)}k`;
  const r = Math.round(x * 100) / 100;
  return r.toLocaleString('en-US');
}

function stepLabel(s: ScoreStep): string {
  const src = s.source;
  switch (src.kind) {
    case 'yaku': {
      const d = yakuText(src.id, currentLand());
      return `${d.name}${src.level ? ` · poem Lv ${src.level}` : ''}${src.halved ? ' · halved' : ''}`;
    }
    case 'card':
      return src.pass > 0
        ? `${ALL_CARDS[src.card]?.name ?? ''} again!`
        : (ALL_CARDS[src.card]?.name ?? '');
    case 'enhancement':
      return enhancementDef(src.id).name;
    case 'omamori':
      return omamoriDef(src.id).name;
    case 'rule':
      return src.id === 'sevenPlus'
        ? 'Seven or more points'
        : src.id === 'opponentKoikoi'
          ? 'The spirit called koi-koi'
          : src.id === 'stake'
            ? 'Your koi-koi stakes'
            : 'Taiko Drum';
  }
}

function stepDelay(s: ScoreStep): number {
  switch (s.source.kind) {
    case 'yaku':
      return 420;
    case 'card':
      return 150;
    case 'enhancement':
      return 260;
    case 'omamori':
      return 360;
    case 'rule':
      return 480;
  }
}

export function ScoreSequence({
  score,
  hits,
  onDone,
}: {
  score: ScoreResult;
  hits: readonly YakuHit[];
  onDone: () => void;
}) {
  const land = useLand();
  const [i, setI] = useState(-1);
  const [final, setFinal] = useState(false);
  const skip = useRef(false);
  const done = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const f = speedFactor();
    const run = async () => {
      await new Promise((r) => setTimeout(r, 250 * f));
      let chipsTicks = 0;
      for (let k = 0; k < score.steps.length && !cancelled; k++) {
        if (skip.current) break;
        const s = score.steps[k] as ScoreStep;
        setI(k);
        if (s.xmult) sfx.clack();
        else if (s.mult) sfx.tick(Math.min(9, Math.round(s.totalMult / 3)), 'mult');
        else if (s.chips) sfx.tick(Math.min(9, chipsTicks++), 'chips');
        await new Promise((r) => setTimeout(r, stepDelay(s) * f));
      }
      if (cancelled) return;
      setI(score.steps.length - 1);
      setFinal(true);
      sfx.taiko(1.2);
      await new Promise((r) => setTimeout(r, 900 * f));
      if (!cancelled && !done.current) {
        done.current = true;
        onDone();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [score, onDone]);
  const step = i >= 0 ? score.steps[i] : undefined;
  const chips = step ? step.totalChips : 0;
  const mult = step ? step.totalMult : 0;
  const activeCard =
    step?.source.kind === 'card' || step?.source.kind === 'enhancement' ? step.source.card : null;
  const activeYaku = step?.source.kind === 'yaku' ? step.source.id : null;
  const activeCharm = step?.source.kind === 'omamori' ? step.source.id : null;
  const label = step ? stepLabel(step) : '';
  const tap = () => {
    if (final && !done.current) {
      done.current = true;
      onDone();
    } else skip.current = true;
  };
  return (
    <div className="seq-scrim" onClick={tap} data-testid="score-seq">
      <div className="score-panel pop-in">
        <div className="score-yaku">
          {hits.map((h) => (
            <span key={h.id} className={`score-yaku-name ${activeYaku === h.id ? 'active' : ''}`}>
              <span className="kanji">
                <Seal land={land} kanji={yakuText(h.id, land).kanji} />
              </span>{' '}
              {yakuText(h.id, land).name}
            </span>
          ))}
        </div>
        <div className="score-cards">
          {score.cards.map((c) => (
            <img key={c} src={cardFaceUrl(c)} alt="" className={activeCard === c ? 'active' : ''} />
          ))}
        </div>
        <div className="chips-mult">
          <div className={`box chips ${step?.chips ? 'bump' : ''}`} key={`c${i}`}>
            {fmt(chips)}
          </div>
          <div className="times">×</div>
          <div className={`box mult ${step?.mult || step?.xmult ? 'bump' : ''}`} key={`m${i}`}>
            {fmt(mult)}
          </div>
        </div>
        <div className="step-label">
          {activeCharm && <OmamoriIcon id={activeCharm} size={20} />}
          <span>{label}</span>
          {step?.chips ? <b className="c">+{fmt(step.chips)}</b> : null}
          {step?.mult ? <b className="m">+{fmt(step.mult)}</b> : null}
          {step?.xmult ? <b className="x">×{fmt(step.xmult)}</b> : null}
        </div>
        <div className={`score-total display ${final ? 'show' : ''}`}>{fmt(score.damage)}</div>
      </div>
    </div>
  );
}

export function StrikeSequence(props: {
  hit: SpiritHit;
  hits: readonly YakuHit[];
  spirit: SpiritId;
  season: Season;
  boss: boolean;
  onDone: () => void;
}) {
  const land = useLand();
  const [show, setShow] = useState(false);
  const done = useRef(false);
  const { hit } = props;
  useEffect(() => {
    const f = speedFactor();
    const t1 = setTimeout(() => {
      setShow(true);
      sfx.taiko(1);
    }, 500 * f);
    const t2 = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        props.onDone();
      }
    }, 2100 * f);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit]);
  const s = spiritDef(props.spirit);
  const finish = () => {
    if (!done.current) {
      done.current = true;
      props.onDone();
    }
  };
  return (
    <div className="seq-scrim danger" onClick={finish} data-testid="strike-seq">
      <div className="strike-panel pop-in">
        <img className="strike-face" src={spiritUrl(s.id, props.season, props.boss)} alt="" />
        <div className="strike-title display">{s.name} scores</div>
        <div className="strike-yaku">
          {props.hits.map((h) => (
            <span key={h.id}>
              {yakuText(h.id, land).name} <b>{h.points}</b>
            </span>
          ))}
        </div>
        <div className="strike-math">
          <span>{hit.points} pts</span>
          <span>× {hit.ferocity}</span>
          {hit.punished > 1 && <span className="warn">× {hit.punished} your koi-koi</span>}
          {hit.bossMult !== 1 && <span className="warn">× {hit.bossMult}</span>}
          {hit.flat > 0 && <span className="warn">+ {hit.flat}</span>}
          {hit.blocked > 0 && <span className="good">− {hit.blocked} salt</span>}
        </div>
        <div className={`strike-total display ${show ? 'show' : ''}`}>−{hit.damage}</div>
      </div>
    </div>
  );
}
