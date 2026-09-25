import { type OfudaId } from '@/content/ofuda';
import { spiritDef } from '@/content/spirits';
import { yakuDef } from '@/content/yaku';
import type { Intent } from '@/engine/ai';
import type { HandState } from '@/engine/hand';
import type { FightState, RunState } from '@/engine/run';
import { omamoriText } from '@/engine/scoring';
import { yakuContext } from '@/engine/hand';
import { detectYaku, yakuProgress } from '@/engine/yaku';
import { spiritUrl } from '@/ui/art/images';
import { CoinIcon, OfudaIcon, OmamoriIcon, PetalIcon } from '@/ui/art/Icons';
import { seasonOf } from '@/content/cards';
import { CARD_H, capLayout, capY, SPIRIT_HAND_X, type Stage } from './layout';
import { shortFlower } from './labels';
import { typeGroup, type Visual } from './visual';

export function HpBar({ hp, max, tone }: { hp: number; max: number; tone: 'spirit' | 'player' }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? hp / max : 0));
  return (
    <div className={`hpbar hpbar-${tone}`}>
      <div className="hpbar-fill" style={{ width: `${pct * 100}%` }} />
      <div className="hpbar-ghost" style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export function SpiritBar(props: {
  run: RunState;
  fight: FightState;
  hp: number;
  intent: Intent | null;
  onPortrait: () => void;
  onBook: () => void;
  onMenu: () => void;
  calmed: boolean;
  shaking: number;
}) {
  const { run, fight } = props;
  const s = spiritDef(fight.spiritId);
  const hidden = Boolean(s.passive?.hiddenIntent);
  return (
    <div className="spirit-bar">
      <button
        className={`portrait ${fight.boss ? 'boss' : ''} ${props.calmed ? 'calmed' : ''}`}
        onClick={props.onPortrait}
        aria-label={`About ${s.name}`}
        data-testid="spirit-portrait"
        key={props.shaking}
      >
        <img src={spiritUrl(s.id, seasonOf(run.month), s.boss)} alt={s.name} />
      </button>
      <div className="spirit-info">
        <div className="spirit-name">
          <span className="display">{s.name}</span>
          {fight.boss && <span className="boss-tag">Boss</span>}
        </div>
        <div className="spirit-hp">
          <HpBar hp={props.hp} max={fight.maxHp} tone="spirit" />
          <span className="hp-num" data-testid="spirit-hp">
            {Math.ceil(props.hp)}
            <small>/{fight.maxHp}</small>
          </span>
        </div>
        <div className="intent-row">
          <div className={`intent ${props.intent ? '' : 'none'}`} data-testid="intent">
            <span className="eye" />
            {hidden ? (
              <span>Its face hides its plan</span>
            ) : props.intent ? (
              <span>
                {/* The red eye already says "it wants": the name alone fits the long ones. */}
                <span className="intent-name" title="The spirit is chasing this yaku">
                  <b>{yakuDef(props.intent.id).name}</b>
                </span>
                <span className="intent-count">
                  {props.intent.have}/{props.intent.need}
                </span>
              </span>
            ) : (
              <span>Biding its time</span>
            )}
          </div>
          <div className="ferocity" title="The spirit hits for its yaku points times this">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path
                d="M3.5 1 Q2 6 2.5 11 M7 1 Q5.5 6 6 11 M10.5 1 Q9 6 9.5 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            ×{Math.round(fight.ferocity * 10) / 10}
          </div>
        </div>
      </div>
      <div className="top-buttons">
        <div className="month-chip">
          <span className="display">{run.month}</span>
          <span>{shortFlower(run.month)}</span>
        </div>
        <button
          className="icon-btn"
          onClick={props.onBook}
          aria-label="Yaku book"
          data-testid="open-book"
        >
          <span className="book-glyph">役</span>
        </button>
        <button
          className="icon-btn"
          onClick={props.onMenu}
          aria-label="Menu"
          data-testid="open-menu"
        >
          <span className="menu-glyph" />
        </button>
      </div>
    </div>
  );
}

/** Group counts next to the captured strips. */
export function CapturedCounts({ visual, stage }: { visual: Visual; stage: Stage }) {
  const counts = (seat: 0 | 1) => {
    const c = [0, 0, 0, 0];
    for (const id of visual.cap[seat]) c[typeGroup(id)] = (c[typeGroup(id)] ?? 0) + 1;
    return c;
  };
  const tones = ['#f2c740', '#7fbf5a', '#ef5b3a', '#b99a6a'];
  const capH = CARD_H * stage.capScale;
  return (
    <>
      <div
        className="hand-count"
        style={{ left: SPIRIT_HAND_X + 18, top: stage.spiritCapY + capH / 2 + 6 }}
      >
        {visual.hand[1].length}
      </div>
      {([1, 0] as const).map((seat) => {
        const c = counts(seat);
        const y = capY(stage, seat) + capH + 1;
        const { starts } = capLayout(stage, seat, c);
        return c.map((n, g) =>
          n > 0 ? (
            <div
              key={`${seat}-${g}`}
              className="cap-count"
              style={{ left: (starts[g] as number) - 2, top: y }}
            >
              <span className="cap-dot" style={{ background: tones[g] }} />
              {n}
            </div>
          ) : null,
        );
      })}
    </>
  );
}

export function Tracker({ hand, onOpen }: { hand: HandState; onOpen: () => void }) {
  const ctx = yakuContext(hand, 0);
  const formed = detectYaku(hand.captured[0], ctx);
  const prog = yakuProgress(
    { own: hand.captured[0], opponent: hand.captured[1], inGame: hand.deckIds },
    ctx,
  )
    .filter((p) => !p.complete && !p.blocked && p.have > 0)
    .sort(
      (a, b) => b.have / b.need - a.have / a.need || yakuDef(b.id).points - yakuDef(a.id).points,
    )
    .slice(0, Math.max(0, 3 - Math.min(2, formed.length)));
  const empty = formed.length === 0 && prog.length === 0;
  return (
    <button className="tracker" onClick={onOpen} data-testid="tracker">
      {empty && (
        <span className="tracker-empty" aria-label="Yaku book">
          役
        </span>
      )}
      {formed.map((h) => (
        <span key={h.id} className="chip formed">
          {yakuDef(h.id).name} <b>{h.points}</b>
        </span>
      ))}
      {prog.map((p) => (
        <span key={p.id} className="chip">
          {yakuDef(p.id).name}{' '}
          <b>
            {p.have}/{p.need}
          </b>
        </span>
      ))}
    </button>
  );
}

export function BottomBar(props: {
  run: RunState;
  hp: number;
  onCharm: (slot: number) => void;
  onOfuda: (slot: number) => void;
  highlightOfuda: boolean;
}) {
  const { run } = props;
  const low = props.hp / run.maxHp < 0.34;
  return (
    <div className="bottom-bar">
      <div className={`hp-pill ${low ? 'low' : ''}`} data-testid="player-hp">
        <PetalIcon size={18} />
        <div className="hp-pill-text">
          <span className="display">{Math.ceil(props.hp)}</span>
          <small>/{run.maxHp}</small>
        </div>
        <HpBar hp={props.hp} max={run.maxHp} tone="player" />
        <div className="mon-mini">
          <CoinIcon size={11} /> {run.mon}
        </div>
      </div>
      <div className="charm-row">
        {Array.from({ length: run.omamoriSlots }, (_, i) => {
          const inst = run.omamori[i];
          return (
            <button
              key={i}
              className={`slot charm ${inst ? '' : 'empty'}`}
              onClick={() => inst && props.onCharm(i)}
              aria-label={inst ? omamoriText(inst) : 'Empty charm slot'}
              data-testid={`charm-${i}`}
            >
              {inst && <OmamoriIcon id={inst.id} size={26} />}
            </button>
          );
        })}
      </div>
      <div className="ofuda-row">
        {Array.from({ length: run.ofudaSlots }, (_, i) => {
          const id = run.ofuda[i] as OfudaId | undefined;
          return (
            <button
              key={i}
              className={`slot ofuda ${id ? '' : 'empty'} ${id && props.highlightOfuda ? 'ready' : ''}`}
              onClick={() => id && props.onOfuda(i)}
              aria-label={id ? `Talisman ${id}` : 'Empty talisman slot'}
              data-testid={`ofuda-${i}`}
            >
              {id && <OfudaIcon id={id} size={17} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
