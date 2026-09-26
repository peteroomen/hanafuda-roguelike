import { type OfudaId } from '@/content/ofuda';
import { spiritDef } from '@/content/spirits';
import { yakuDef, type YakuId, yakuText } from '@/content/yaku';
import type { Intent } from '@/engine/ai';
import type { HandState } from '@/engine/hand';
import type { FightState, RunState } from '@/engine/run';
import { omamoriText } from '@/engine/scoring';
import { yakuContext } from '@/engine/hand';
import { detectYaku, yakuProgress } from '@/engine/yaku';
import { spiritUrl } from '@/ui/art/images';
import { CoinIcon, OfudaIcon, OmamoriIcon, PetalIcon } from '@/ui/art/Icons';
import { seasonOf } from '@/content/cards';
import { Seal } from '@/ui/art/Kiwi';
import { useLand } from '@/ui/state/store';
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
  onYaku: OnYaku;
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
        <img src={spiritUrl(s.id, seasonOf(run.month, run.land), s.boss)} alt={s.name} />
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
          <button
            className={`intent ${props.intent ? '' : 'none'}`}
            data-testid="intent"
            data-gloss
            disabled={!props.intent || hidden}
            onClick={(e) => props.intent && props.onYaku(props.intent.id, e.currentTarget)}
          >
            <span className="eye" />
            {hidden ? (
              <span>Its face hides its plan</span>
            ) : props.intent ? (
              <span>
                {/* The red eye already says "it wants": the name alone fits the long ones. */}
                <span className="intent-name">
                  <b>{yakuText(props.intent.id, run.land).name}</b>
                </span>
                <span className="intent-count">
                  {props.intent.have}/{props.intent.need}
                </span>
              </span>
            ) : (
              <span>Biding its time</span>
            )}
          </button>
          <div
            className="ferocity"
            title="Its hits take its yaku points × this from your HP"
            aria-label="Damage to you"
          >
            {/* A cracked heart: this multiplies the damage it deals to your HP (the heart). */}
            <svg width="14" height="13" viewBox="0 0 14 13" aria-hidden>
              <path
                d="M7 12.2 C3 9.2 0.8 7 0.8 4.2 C0.8 2.2 2.3 0.8 4.1 0.8 C5.3 0.8 6.4 1.5 7 2.5 C7.6 1.5 8.7 0.8 9.9 0.8 C11.7 0.8 13.2 2.2 13.2 4.2 C13.2 7 11 9.2 7 12.2 Z"
                fill="#e87d9a"
                stroke="#0d0806"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M7 2.6 L5.6 5.4 L8.2 6.8 L6.4 10"
                fill="none"
                stroke="#0d0806"
                strokeWidth="1.3"
                strokeLinejoin="round"
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
          <span>{shortFlower(run.month, run.land)}</span>
        </div>
        <button
          className="icon-btn"
          onClick={props.onBook}
          aria-label="Yaku book"
          data-testid="open-book"
        >
          <span className="book-glyph">
            <Seal land={run.land} kanji="役" />
          </span>
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

/** Tap a yaku's name to see what it means (you're learning the Japanese names). */
export type OnYaku = (id: YakuId, el: HTMLElement) => void;

export function Tracker({
  hand,
  onOpen,
  onYaku,
}: {
  hand: HandState;
  onOpen: () => void;
  onYaku: OnYaku;
}) {
  const land = useLand();
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
    <div className="tracker" data-testid="tracker">
      {empty && (
        <button className="tracker-empty" aria-label="Yaku book" onClick={onOpen}>
          <Seal land={land} kanji="役" />
        </button>
      )}
      {formed.map((h) => (
        <button
          key={h.id}
          className="chip formed"
          data-gloss
          onClick={(e) => onYaku(h.id, e.currentTarget)}
        >
          {yakuText(h.id, land).name} <b>{h.points}</b>
        </button>
      ))}
      {prog.map((p) => (
        <button
          key={p.id}
          className="chip"
          data-gloss
          onClick={(e) => onYaku(p.id, e.currentTarget)}
        >
          {yakuText(p.id, land).name}{' '}
          <b>
            {p.have}/{p.need}
          </b>
        </button>
      ))}
    </div>
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
              aria-label={inst ? omamoriText(inst, run.land) : 'Empty charm slot'}
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
