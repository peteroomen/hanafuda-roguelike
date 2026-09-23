import { monthDef, seasonOf } from '@/content/cards';
import { spiritDef } from '@/content/spirits';
import type { FightState, RunState } from '@/engine/run';
import { spiritUrl } from '@/ui/art/images';

export function IntroOverlay({
  run,
  fight,
  onBegin,
}: {
  run: RunState;
  fight: FightState;
  onBegin: () => void;
}) {
  const s = spiritDef(fight.spiritId);
  const m = monthDef(run.month);
  const stageText =
    fight.stage === 'matching'
      ? 'This month, every card you capture strikes the spirit. No yaku yet.'
      : fight.stage === 'oneYaku'
        ? 'This month there is one yaku: Tan, any five Ribbons. Form it to strike.'
        : fight.stage === 'koikoi'
          ? 'Every yaku is live, and now you choose: stop, or koi-koi.'
          : null;
  return (
    <div className="intro fade-in" data-testid="intro" onClick={onBegin}>
      <div className="intro-month">
        <span className="display intro-month-n">{run.month}</span>
        <span className="intro-month-name">
          {m.flower} · {m.flowerJp} {m.kanji}
        </span>
        <span className="intro-season">{seasonOf(run.month)}</span>
      </div>
      <img
        className={`intro-face ${s.boss ? 'boss' : ''}`}
        src={spiritUrl(s.id, seasonOf(run.month), s.boss)}
        alt={s.name}
      />
      <div className="intro-kanji display">{s.kanji}</div>
      <div className="intro-name display">{s.name}</div>
      <div className="intro-epithet">{s.epithet}</div>
      <div className="intro-lore">{s.lore}</div>
      <div className="intro-stats">
        <span>
          HP <b>{fight.maxHp.toLocaleString('en-US')}</b>
        </span>
        <span>
          Hits for <b>yaku points × {fight.ferocity}</b>
        </span>
      </div>
      {s.rule && (
        <div className="intro-rule">
          <div className="intro-rule-title display">{s.rule.title}</div>
          <div>{s.rule.text}</div>
        </div>
      )}
      {s.passive && <div className="intro-passive">{s.passive.text}</div>}
      {stageText && <div className="intro-stage">{stageText}</div>}
      <div className="intro-taunt">“{s.taunt}”</div>
      <button className="btn red intro-begin" onClick={onBegin} data-testid="btn-begin">
        Begin
      </button>
    </div>
  );
}
