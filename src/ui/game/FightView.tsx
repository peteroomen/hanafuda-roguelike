import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CardId, seasonOf } from '@/content/cards';
import { deckDef } from '@/content/decks';
import { ofudaDef } from '@/content/ofuda';
import { apparentMatches, canUseTalisman } from '@/engine/hand';
import { type FightState, type RunState, waitingOn } from '@/engine/run';
import { setState, speedFactor, useStore } from '@/ui/state/store';
import { IDLE_TAUNT_MS } from '@/content/voices';
import { yakuDef, type YakuId } from '@/content/yaku';
import * as sfx from '@/ui/audio/audio';
import { haptics } from '@/ui/audio/haptics';
import { CardLayer, type CardMarks } from './CardLayer';
import { DecisionSheet, FrogSheet, HandOverPanel, Hint } from './Decision';
import { Fukidashi } from './Fukidashi';
import { BottomBar, CapturedCounts, type OnYaku, SpiritBar, Tracker } from './Hud';
import { IntroOverlay } from './Intro';
import { CARD_H, CARD_W, makeStage, type Placement, placements, STAGE_W } from './layout';
import { BannerView, Floaters, GuideBubble } from './Overlays';
import { ScoreSequence, StrikeSequence } from './Sequences';
import { CharmSheet, MenuSheet, OfudaSheet, SpiritSheet } from './Sheets';
import type { GameApi } from './useGame';
import { YakuBook } from './YakuBook';

/** A finger (or mouse) held down on a hand card: a tap, or a drag once it moves far enough. */
interface Press {
  readonly id: CardId;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  /** Where on the card the finger is, so the card doesn't jump to be centred on it. */
  readonly offX: number;
  readonly offY: number;
  moved: boolean;
}

/** Past this many stage pixels, a press is a drag. */
const DRAG_START = 8;

function contains(p: Placement, x: number, y: number): boolean {
  return x >= p.x && x <= p.x + CARD_W * p.scale && y >= p.y && y <= p.y + CARD_H * p.scale;
}

type Targeting =
  { kind: 'swap'; slot: number; handCard: CardId | null } | { kind: 'gild'; slot: number } | null;

export function FightView({ api, stageH }: { api: GameApi; stageH: number }) {
  const { view, dispatch, canAct } = api;
  const run = view.shown;
  const fight = run.fight as FightState;
  const hand = fight.hand;
  const settings = useStore((s) => s.settings);
  const [lifted, setLifted] = useState<CardId | null>(null);
  const [sheet, setSheet] = useState<
    | { kind: 'book' }
    | { kind: 'menu' }
    | { kind: 'spirit' }
    | { kind: 'charm'; slot: number }
    | { kind: 'ofuda'; slot: number }
    | null
  >(null);
  const [targeting, setTargeting] = useState<Targeting>(null);
  const [drag, setDrag] = useState<{ id: CardId; x: number; y: number } | null>(null);
  const press = useRef<Press | null>(null);
  /** Removes the window listeners of the press in progress. */
  const endPress = useRef<(() => void) | null>(null);
  const fightRef = useRef<HTMLDivElement>(null);

  const stage = useMemo(
    () => makeStage(stageH, view.visual.slots.length),
    [stageH, view.visual.slots.length],
  );
  const myTurn = canAct && fight.phase === 'hand' && hand.active === 0;
  const playing = myTurn && hand.phase === 'play' && !targeting;
  const choosing = myTurn && (hand.phase === 'playChoice' || hand.phase === 'flipChoice');
  // Hints sit just above the field (over the spirit's captured lane) so they never cover a card.
  const hintTop = Math.max(84, stage.fieldTop - 42);

  // Clear a stale lift or drag when the turn moves on.
  useEffect(() => {
    if (!playing) {
      setLifted(null);
      setDrag(null);
      endPress.current?.();
    }
  }, [playing]);
  useEffect(() => () => endPress.current?.(), []);

  // An impatient spirit pipes up if your turn sits too long. Once per turn.
  const turnKey = `${fight.handNo}:${hand.turn}`;
  const say = api.say;
  useEffect(() => {
    if (!playing || speedFactor() === 0) return;
    const t = setTimeout(() => say('idle'), IDLE_TAUNT_MS);
    return () => clearTimeout(t);
  }, [playing, turnKey, say]);

  const matches = useMemo(() => {
    if (lifted === null) return new Set<CardId>();
    return new Set(apparentMatches(hand, lifted, 0));
  }, [lifted, hand]);

  const playable = useMemo(() => {
    if (settings.trainingWheels === 'off' || !playing) return new Set<CardId>();
    return new Set(hand.hands[0].filter((c) => apparentMatches(hand, c, 0).length > 0));
  }, [settings.trainingWheels, playing, hand]);

  const marks: CardMarks = {
    matches,
    wanted: new Set(view.intent && !isHidden(fight) ? view.intent.wanted : []),
    playable,
    enhancements: run.enhancements,
    monthLabels: settings.trainingWheels === 'full',
    deckHue: deckDef(run.deckId).hue,
  };

  const placed = useMemo(
    () => placements(view.visual, stage, { lifted, selectable: myTurn, drag }),
    [view.visual, stage, lifted, myTurn, drag],
  );

  /**
   * Play a hand card. When you aimed at a match (tapped or dropped onto it), the engine takes that
   * one straight away, so the card flies right to it instead of stopping to ask.
   */
  const playCard = useCallback(
    (card: CardId, target: CardId | null) => {
      setLifted(null);
      dispatch({
        type: 'hand',
        action: target === null ? { type: 'play', card } : { type: 'play', card, target },
      });
    },
    [dispatch],
  );

  /** A tap on a hand card: the first lifts it, the second plays it. */
  const tapHandCard = useCallback(
    (id: CardId) => {
      if (lifted === id) {
        playCard(id, null);
      } else {
        haptics.tap();
        sfx.uiTap();
        setLifted(id);
      }
    },
    [lifted, playCard],
  );

  const toStage = useCallback((clientX: number, clientY: number) => {
    const rect = fightRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: clientX, y: clientY };
    const k = rect.width / STAGE_W;
    return { x: (clientX - rect.left) / k, y: (clientY - rect.top) / k };
  }, []);

  // A yaku's meaning, shown when you tap its Japanese name (yours on the tracker, or the spirit's
  // intent). Another tap on it, a tap elsewhere, or a few seconds, and it goes away.
  const [gloss, setGloss] = useState<{ id: YakuId; x: number; y: number; below: boolean } | null>(
    null,
  );
  const showGloss: OnYaku = useCallback(
    (id, el) => {
      const r = el.getBoundingClientRect();
      const below = r.top < window.innerHeight / 2;
      const at = toStage(r.left + r.width / 2, below ? r.bottom : r.top);
      setGloss((g) => (g?.id === id ? null : { id, x: at.x, y: at.y, below }));
    },
    [toStage],
  );
  useEffect(() => {
    if (!gloss) return;
    const t = setTimeout(() => setGloss(null), 5000);
    return () => clearTimeout(t);
  }, [gloss]);

  // Everything the window listeners need, always current.
  const live = useRef({ placed, hand, stage, tapHandCard, playCard });
  live.current = { placed, hand, stage, tapHandCard, playCard };

  /** Release a dragged card: onto a match, onto the field, or back to the hand. */
  const drop = useCallback((id: CardId, x: number, y: number) => {
    const { placed: pl, hand: h, stage: st, playCard: play } = live.current;
    setDrag(null);
    const options = apparentMatches(h, id, 0);
    const onto = options.find((m) => {
      const p = pl.get(m);
      return p !== undefined && contains(p, x, y);
    });
    if (onto !== undefined) {
      play(id, onto);
      return;
    }
    const overField = y >= st.fieldTop - 24 && y <= st.fieldTop + st.fieldH + 24;
    if (overField) {
      play(id, null);
      return;
    }
    // Dropped somewhere else: it springs back, still lifted so the matches stay lit.
  }, []);

  const startPress = useCallback(
    (id: CardId, e: PointerEvent) => {
      endPress.current?.();
      const p = live.current.placed.get(id);
      const at = toStage(e.clientX, e.clientY);
      press.current = {
        id,
        pointerId: e.pointerId,
        startX: at.x,
        startY: at.y,
        offX: p ? at.x - p.x : 0,
        offY: p ? at.y - p.y : 0,
        moved: false,
      };
      const onMove = (ev: globalThis.PointerEvent) => {
        const pr = press.current;
        if (!pr || ev.pointerId !== pr.pointerId) return;
        const q = toStage(ev.clientX, ev.clientY);
        if (!pr.moved) {
          if (Math.hypot(q.x - pr.startX, q.y - pr.startY) < DRAG_START) return;
          pr.moved = true;
          haptics.tap();
          setLifted(pr.id);
        }
        setDrag({ id: pr.id, x: q.x - pr.offX, y: q.y - pr.offY });
      };
      const onUp = (ev: globalThis.PointerEvent) => {
        const pr = press.current;
        if (!pr || ev.pointerId !== pr.pointerId) return;
        endPress.current?.();
        if (ev.type === 'pointercancel') {
          setDrag(null);
          return;
        }
        if (pr.moved) {
          const q = toStage(ev.clientX, ev.clientY);
          drop(pr.id, q.x, q.y);
        } else {
          live.current.tapHandCard(pr.id);
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      endPress.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        press.current = null;
        endPress.current = null;
      };
    },
    [toStage, drop],
  );

  const onPress = useCallback(
    (id: CardId, e: PointerEvent) => {
      sfx.unlockAudio();
      const zone = view.visual.zone[id];
      if (!zone) return;
      // Talisman targeting.
      if (targeting) {
        if (targeting.kind === 'gild' && zone.z === 'hand' && zone.seat === 0) {
          dispatch({ type: 'ofuda', slot: targeting.slot, handCard: id });
          setTargeting(null);
        } else if (targeting.kind === 'swap') {
          if (zone.z === 'hand' && zone.seat === 0) setTargeting({ ...targeting, handCard: id });
          else if (zone.z === 'field' && targeting.handCard !== null && !hand.frozen.includes(id)) {
            dispatch({
              type: 'ofuda',
              slot: targeting.slot,
              handCard: targeting.handCard,
              fieldCard: id,
            });
            setTargeting(null);
          }
        }
        return;
      }
      if (choosing && zone.z === 'field' && hand.pending?.options.includes(id)) {
        haptics.tap();
        dispatch({ type: 'hand', action: { type: 'choose', card: id } });
        return;
      }
      if (!playing) return;
      if (zone.z === 'hand' && zone.seat === 0) {
        // Decided on release: a tap lifts or plays it, a drag carries it to the field.
        startPress(id, e);
        return;
      }
      if (zone.z === 'field' && lifted !== null && matches.has(id)) playCard(lifted, id);
    },
    [
      view.visual.zone,
      targeting,
      choosing,
      playing,
      lifted,
      matches,
      hand,
      dispatch,
      startPress,
      playCard,
    ],
  );

  const activateOfuda = (slot: number) => {
    const id = run.ofuda[slot];
    if (!id) return;
    setSheet(null);
    if (id === 'swap') {
      setTargeting({ kind: 'swap', slot, handCard: null });
      return;
    }
    if (id === 'goldLeaf') {
      setTargeting({ kind: 'gild', slot });
      return;
    }
    dispatch({ type: 'ofuda', slot });
  };

  const ofudaUsable = (slot: number): { ok: boolean; reason?: string } => {
    const id = run.ofuda[slot];
    if (!id) return { ok: false };
    if (ofudaDef(id).anytime) return { ok: canAct };
    if (!myTurn || hand.phase !== 'play' || !canUseTalisman(hand, 0))
      return { ok: false, reason: 'Use it on your turn, before you play a card.' };
    if (id === 'taiko' && fight.drum > 1)
      return { ok: false, reason: 'The drum is already beating.' };
    return { ok: true };
  };

  const season = seasonOf(run.month);
  const doneScore = useCallback(() => api.resolveWait('score'), [api]);
  const fieldBottom = stage.fieldTop + stage.fieldH;
  const decide = myTurn && hand.phase === 'decide';
  const frog = myTurn && hand.phase === 'frogDecide';
  const handOver = canAct && fight.phase === 'handOver' && run.phase === 'fight';

  return (
    <div
      ref={fightRef}
      className={`fight ${view.shake ? 'shaking' : ''}`}
      style={{ height: stageH }}
      onPointerDown={(e) => {
        sfx.unlockAudio();
        if (!(e.target as HTMLElement).closest('[data-gloss]')) setGloss(null);
      }}
    >
      <div
        className="fight-inner"
        key={`shake-${view.shake}`}
        data-shake={view.shake > 0 ? 'y' : undefined}
      >
        <div
          className="table-mat"
          style={{ top: stage.fieldTop - 10, height: fieldBottom - stage.fieldTop + 20 }}
        />
        <div
          className="cap-lane spirit"
          style={{ top: stage.spiritCapY - 3, height: CARD_H * stage.capScale + 6 }}
        />
        <div
          className="cap-lane player"
          style={{ top: stage.playerCapY - 3, height: CARD_H * stage.capScale + 6 }}
        />
        <SpiritBar
          run={run}
          fight={fight}
          hp={view.spiritHp}
          intent={view.intent}
          onPortrait={() => setSheet({ kind: 'spirit' })}
          onBook={() => setSheet({ kind: 'book' })}
          onMenu={() => setSheet({ kind: 'menu' })}
          calmed={view.calmed}
          shaking={view.shake}
          onYaku={showGloss}
        />
        <div
          className="pile-count"
          style={{ left: stage.pileX, top: stage.pileY + 92 * stage.fieldScale + 4 }}
        >
          {view.visual.pile.length}
        </div>
        <CapturedCounts visual={view.visual} stage={stage} />
        <div style={{ position: 'absolute', left: 10, right: 10, top: stage.trackerY }}>
          <Tracker hand={hand} onOpen={() => setSheet({ kind: 'book' })} onYaku={showGloss} />
        </div>
        <CardLayer
          visual={view.visual}
          placements={placed}
          marks={marks}
          {...(view.delays ? { delays: view.delays } : {})}
          onPress={onPress}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, top: stage.bottomBarY }}>
          <BottomBar
            run={run}
            hp={view.playerHp}
            onCharm={(slot) => setSheet({ kind: 'charm', slot })}
            onOfuda={(slot) => setSheet({ kind: 'ofuda', slot })}
            highlightOfuda={playing}
          />
        </div>
        {lifted !== null && playing && drag === null && (
          <div className="lift-hint" style={{ top: stage.handY - 56 }}>
            {matches.size > 0
              ? 'Tap or drag onto a glowing card'
              : 'No match: tap again or drag it to the field'}
          </div>
        )}
        {view.hurt > 0 && <div className="hurt-flash" key={`hurt-${view.hurt}`} />}
      </div>

      {view.speech && (
        <div
          className="speech"
          key={view.speech.id}
          style={{ top: stage.topBar - 4 }}
          data-testid="speech"
        >
          <Fukidashi mood={view.speech.mood} text={view.speech.text} tail="up" />
        </div>
      )}

      {gloss && (
        <div
          className={`gloss-tip ${gloss.below ? 'below' : 'above'}`}
          style={{ left: Math.min(STAGE_W - 104, Math.max(104, gloss.x)), top: gloss.y }}
          data-testid="gloss"
        >
          <div className="gloss-name">
            <b>{yakuDef(gloss.id).name}</b> · {yakuDef(gloss.id).gloss}
          </div>
          <div className="gloss-req">
            {yakuDef(gloss.id).requirement} · {yakuDef(gloss.id).points} pt
            {yakuDef(gloss.id).points === 1 ? '' : 's'}
          </div>
        </div>
      )}

      <BannerView banner={view.banner} />
      <Floaters floaters={view.floaters} stageH={stageH} />

      {choosing && <Hint text="Two cards match: choose which to take" top={hintTop} />}
      {targeting?.kind === 'swap' && (
        <Hint
          text={
            targeting.handCard === null
              ? 'Switch: pick a card in your hand'
              : 'Now pick a field card to trade it for'
          }
          onCancel={() => setTargeting(null)}
          top={hintTop}
        />
      )}
      {targeting?.kind === 'gild' && (
        <Hint
          text="Gold Leaf: pick a card in your hand to gild"
          onCancel={() => setTargeting(null)}
          top={hintTop}
        />
      )}

      {decide && (
        <DecisionSheet
          run={run}
          onStop={() => dispatch({ type: 'hand', action: { type: 'stop' } })}
          onKoikoi={() => dispatch({ type: 'hand', action: { type: 'koikoi' } })}
        />
      )}
      {frog && (
        <FrogSheet
          run={run}
          onKeep={() => dispatch({ type: 'hand', action: { type: 'keepFlip' } })}
          onLeap={() => dispatch({ type: 'hand', action: { type: 'redoFlip' } })}
        />
      )}
      {handOver && <HandOverPanel run={run} onNext={() => dispatch({ type: 'nextHand' })} />}

      {view.score && (
        <ScoreSequence score={view.score.result} hits={view.score.hits} onDone={doneScore} />
      )}
      {view.strike && (
        <StrikeSequence
          hit={view.strike.hit}
          hits={view.strike.hits}
          spirit={fight.spiritId}
          season={season}
          boss={fight.boss}
          onDone={() => api.resolveWait('strike')}
        />
      )}
      {view.intro && (
        <IntroOverlay
          run={run}
          fight={fight}
          onBegin={() => (sfx.unlockAudio(), api.resolveWait('intro'))}
        />
      )}

      <GuideBubble
        tip={view.tip}
        onDismiss={api.dismissTip}
        bottom={Math.max(12, stageH - stage.handY + 10)}
      />

      {sheet?.kind === 'book' && <YakuBook poems={run.poems} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'spirit' && (
        <SpiritSheet run={run} fight={fight} onClose={() => setSheet(null)} />
      )}
      {sheet?.kind === 'charm' && run.omamori[sheet.slot] && (
        <CharmSheet
          inst={run.omamori[sheet.slot] as NonNullable<(typeof run.omamori)[number]>}
          slot={sheet.slot}
          count={run.omamori.length}
          {...(canAct
            ? {
                onMove: (from: number, to: number) => {
                  dispatch({ type: 'moveOmamori', from, to });
                  setSheet({ kind: 'charm', slot: to });
                },
              }
            : {})}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'ofuda' && run.ofuda[sheet.slot] && (
        <OfudaSheet
          id={run.ofuda[sheet.slot] as NonNullable<(typeof run.ofuda)[number]>}
          usable={ofudaUsable(sheet.slot).ok}
          {...(ofudaUsable(sheet.slot).reason
            ? { reason: ofudaUsable(sheet.slot).reason as string }
            : {})}
          onUse={() => activateOfuda(sheet.slot)}
          onDiscard={() => {
            dispatch({ type: 'discardOfuda', slot: sheet.slot });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'menu' && (
        <MenuSheet
          onResume={() => setSheet(null)}
          onBook={() => setSheet({ kind: 'book' })}
          onTitle={() => {
            sfx.stopMusic();
            setState({ screen: 'title' });
          }}
          onAbandon={() => {
            if (window.confirm('Abandon this year? The run will be lost.')) {
              sfx.stopMusic();
              setState({ run: null, screen: 'title' });
            }
          }}
        />
      )}
      {waitingOn(run) === 'spirit' && !view.busy && <div className="thinking">…</div>}
    </div>
  );
}

function isHidden(f: FightState): boolean {
  return f.spiritId === 'nopperabo';
}

export type { RunState };
