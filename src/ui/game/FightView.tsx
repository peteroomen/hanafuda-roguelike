import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CardId, seasonOf } from '@/content/cards';
import { deckDef } from '@/content/decks';
import { ofudaDef } from '@/content/ofuda';
import { apparentMatches, canUseTalisman } from '@/engine/hand';
import { type FightState, type RunState, waitingOn } from '@/engine/run';
import { setState, useStore } from '@/ui/state/store';
import * as sfx from '@/ui/audio/audio';
import { haptics } from '@/ui/audio/haptics';
import { CardLayer, type CardMarks } from './CardLayer';
import { DecisionSheet, FrogSheet, HandOverPanel, Hint } from './Decision';
import { BottomBar, CapturedCounts, SpiritBar, Tracker } from './Hud';
import { IntroOverlay } from './Intro';
import { makeStage, placements } from './layout';
import { BannerView, Floaters, GuideBubble } from './Overlays';
import { ScoreSequence, StrikeSequence } from './Sequences';
import { CharmSheet, MenuSheet, OfudaSheet, SpiritSheet } from './Sheets';
import type { GameApi } from './useGame';
import { YakuBook } from './YakuBook';

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
  const intendedTarget = useRef<CardId | null>(null);

  const stage = useMemo(
    () => makeStage(stageH, view.visual.slots.length),
    [stageH, view.visual.slots.length],
  );
  const myTurn = canAct && fight.phase === 'hand' && hand.active === 0;
  const playing = myTurn && hand.phase === 'play' && !targeting;
  const choosing = myTurn && (hand.phase === 'playChoice' || hand.phase === 'flipChoice');

  // Clear a stale lift when the turn moves on.
  useEffect(() => {
    if (!playing) setLifted(null);
  }, [playing]);

  // If the player aimed at a specific field card and a choice came up, take it.
  useEffect(() => {
    if (
      choosing &&
      intendedTarget.current !== null &&
      hand.pending?.options.includes(intendedTarget.current)
    ) {
      const target = intendedTarget.current;
      intendedTarget.current = null;
      dispatch({ type: 'hand', action: { type: 'choose', card: target } });
    } else if (!choosing) {
      intendedTarget.current = null;
    }
  }, [choosing, hand.pending, dispatch]);

  const matches = useMemo(() => {
    if (lifted === null) return new Set<CardId>();
    return new Set(apparentMatches(hand, lifted, 0));
  }, [lifted, hand]);

  const playable = useMemo(() => {
    if (!settings.trainingWheels || !playing) return new Set<CardId>();
    return new Set(hand.hands[0].filter((c) => apparentMatches(hand, c, 0).length > 0));
  }, [settings.trainingWheels, playing, hand]);

  const marks: CardMarks = {
    matches,
    wanted: new Set(view.intent && !isHidden(fight) ? view.intent.wanted : []),
    playable,
    enhancements: run.enhancements,
    trainingWheels: settings.trainingWheels,
    deckHue: deckDef(run.deckId).hue,
  };

  const placed = useMemo(
    () => placements(view.visual, stage, { lifted, selectable: myTurn }),
    [view.visual, stage, lifted, myTurn],
  );

  const onTap = useCallback(
    (id: CardId) => {
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
        if (lifted === id) {
          setLifted(null);
          dispatch({ type: 'hand', action: { type: 'play', card: id } });
        } else {
          haptics.tap();
          sfx.uiTap();
          setLifted(id);
        }
        return;
      }
      if (zone.z === 'field' && lifted !== null && matches.has(id)) {
        intendedTarget.current = id;
        const card = lifted;
        setLifted(null);
        dispatch({ type: 'hand', action: { type: 'play', card } });
      }
    },
    [view.visual.zone, targeting, choosing, playing, lifted, matches, hand, dispatch],
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
  const fieldBottom = stage.fieldTop + stage.fieldH;
  const decide = myTurn && hand.phase === 'decide';
  const frog = myTurn && hand.phase === 'frogDecide';
  const handOver = canAct && fight.phase === 'handOver' && run.phase === 'fight';
  const scoreHits = run.fight?.outcome?.kind === 'playerStop' ? run.fight.outcome.hits : [];

  return (
    <div
      className={`fight ${view.shake ? 'shaking' : ''}`}
      style={{ height: stageH }}
      onPointerDown={() => sfx.unlockAudio()}
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
        <div className="cap-lane spirit" style={{ top: stage.spiritCapY - 2 }} />
        <div className="cap-lane player" style={{ top: stage.playerCapY - 2 }} />
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
        />
        <div
          className="pile-count"
          style={{ left: stage.pileX, top: stage.pileY + 92 * stage.fieldScale + 4 }}
        >
          {view.visual.pile.length}
        </div>
        <CapturedCounts visual={view.visual} stage={stage} />
        <div style={{ position: 'absolute', left: 10, right: 10, top: stage.trackerY }}>
          <Tracker hand={hand} onOpen={() => setSheet({ kind: 'book' })} />
        </div>
        <CardLayer
          visual={view.visual}
          placements={placed}
          marks={marks}
          {...(view.delays ? { delays: view.delays } : {})}
          onTap={onTap}
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
        {lifted !== null && playing && (
          <div className="lift-hint" style={{ top: stage.handY - 56 }}>
            {matches.size > 0
              ? 'Tap again to play, or tap a glowing card'
              : 'No match: tap again to lay it on the field'}
          </div>
        )}
        {view.hurt > 0 && <div className="hurt-flash" key={`hurt-${view.hurt}`} />}
      </div>

      <BannerView banner={view.banner} />
      <Floaters floaters={view.floaters} stageH={stageH} />

      {choosing && <Hint text="Two cards match: choose which to take" />}
      {targeting?.kind === 'swap' && (
        <Hint
          text={
            targeting.handCard === null
              ? 'Switch: pick a card in your hand'
              : 'Now pick a field card to trade it for'
          }
          onCancel={() => setTargeting(null)}
        />
      )}
      {targeting?.kind === 'gild' && (
        <Hint
          text="Gold Leaf: pick a card in your hand to gild"
          onCancel={() => setTargeting(null)}
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
        <ScoreSequence
          score={view.score}
          hits={scoreHits}
          onDone={api.resolveWait.bind(null, 'score')}
        />
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
