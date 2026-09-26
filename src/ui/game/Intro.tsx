import { monthDef, seasonOf } from '@/content/cards';
import { landText, terms } from '@/content/lands';
import { spiritDef } from '@/content/spirits';
import type { FightState, RunState } from '@/engine/run';
import { spiritUrl } from '@/ui/art/images';
import { voiceOf } from '@/content/voices';
import { Kiwi } from '@/ui/art/Kiwi';
import { Fukidashi } from './Fukidashi';

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
  const m = monthDef(run.month, run.land);
  const y = terms(run.land).y;
  const stageText =
    fight.stage === 'matching'
      ? 'This month, every card you capture strikes the spirit. No yaku yet.'
      : fight.stage === 'oneYaku'
        ? `This month, three yaku: ${y.tan} (5 Ribbons), ${y.tane} (5 Animals) or ${y.kasu} (10 Chaff). Form one to strike.`
        : fight.stage === 'koikoi'
          ? 'Every yaku is live, and now you choose: stop, or koi-koi.'
          : null;
  return (
    <div className="intro fade-in" data-testid="intro" onClick={onBegin}>
      <div className="intro-month">
        <span className="display intro-month-n">{run.month}</span>
        <span className="intro-month-name">
          {m.flower} · {m.native} {run.land === 'aotearoa' ? <Kiwi /> : m.kanji}
        </span>
        <span className="intro-season">{seasonOf(run.month, run.land)}</span>
      </div>
      <div className="intro-hero">
        <img
          className={`intro-face ${s.boss ? 'boss' : ''}`}
          src={spiritUrl(s.id, seasonOf(run.month, run.land), s.boss, 'full')}
          alt={s.name}
        />
        <Fukidashi mood={voiceOf(s.id).mood} text={s.taunt} className="intro-bubble" />
      </div>
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
      {s.passive && <div className="intro-passive">{landText(s.passive.text, run.land)}</div>}
      {stageText && <div className="intro-stage">{stageText}</div>}
      <button className="btn red intro-begin" onClick={onBegin} data-testid="btn-begin">
        Begin
      </button>
    </div>
  );
}
