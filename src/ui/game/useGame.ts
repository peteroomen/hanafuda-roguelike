/**
 * The game director. Dispatches engine actions, then plays their events back
 * as animation, sound and haptics, one beat at a time; drives the spirit's
 * turns; and exposes everything the fight screen renders.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardId } from '@/content/cards';
import { spiritDef } from '@/content/spirits';
import { yakuDef, type YakuId } from '@/content/yaku';
import type { Intent } from '@/engine/ai';
import type { HandEvent } from '@/engine/hand';
import { type RunAction, type RunEvent, type RunState, runStep, waitingOn } from '@/engine/run';
import type { ScoreResult, SpiritHit } from '@/engine/scoring';
import type { Seat, YakuHit } from '@/engine/types';
import * as sfx from '@/ui/audio/audio';
import { haptics } from '@/ui/audio/haptics';
import { getState, setState, speedFactor } from '@/ui/state/store';
import {
  applyEvent,
  dealOrder,
  emptyVisual,
  reconcile,
  type Visual,
  visualFromHand,
} from './visual';

export type BannerKind = 'yaku' | 'koikoi' | 'stop' | 'wilt' | 'hand' | 'info' | 'danger' | 'calm';

export interface Banner {
  readonly id: number;
  readonly kind: BannerKind;
  readonly title: string;
  readonly sub?: string;
  readonly seat?: Seat;
}

export interface Floater {
  readonly id: number;
  readonly text: string;
  readonly kind: 'dmg' | 'hurt' | 'mon' | 'heal' | 'info';
  readonly at: 'spirit' | 'player' | 'center';
}

export type WaitKind = 'intro' | 'score' | 'strike';

export interface GameView {
  readonly visual: Visual;
  readonly delays: ReadonlyMap<CardId, number> | null;
  readonly shown: RunState;
  readonly spiritHp: number;
  readonly playerHp: number;
  readonly intent: Intent | null;
  readonly banner: Banner | null;
  readonly score: { result: ScoreResult; hits: readonly YakuHit[] } | null;
  readonly strike: { hit: SpiritHit; hits: readonly YakuHit[] } | null;
  readonly floaters: readonly Floater[];
  readonly shake: number;
  readonly hurt: number;
  readonly busy: boolean;
  readonly intro: boolean;
  readonly yakuFlash: { seat: Seat; ids: readonly YakuId[] } | null;
  readonly tip: string | null;
  readonly calmed: boolean;
}

let uid = 1;

export function sleep(ms: number): Promise<void> {
  const f = speedFactor();
  if (f === 0 || ms <= 0) return new Promise((r) => requestAnimationFrame(() => r()));
  return new Promise((r) => setTimeout(r, ms * f));
}

/** Two frames: the browser has painted what was just set. */
function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export interface GameApi {
  readonly view: GameView;
  dispatch(action: RunAction): void;
  resolveWait(kind: WaitKind): void;
  dismissTip(): void;
  canAct: boolean;
}

/** Guided-tutorial and first-time tips, keyed by id. The UI renders the text. */
export type TipId =
  | 'matching'
  | 'captured'
  | 'flip'
  | 'strike'
  | 'yakuIntro'
  | 'firstYaku'
  | 'decide'
  | 'koikoiDone'
  | 'intent'
  | 'boss'
  | 'spiritScored'
  | 'wilt';

export function useGame(): GameApi {
  const initial = getState().run as RunState;
  const [view, setView] = useState<GameView>(() => ({
    visual: initial.fight ? visualFromHand(initial.fight.hand) : emptyVisual(),
    delays: null,
    shown: initial,
    spiritHp: initial.fight?.hp ?? 0,
    playerHp: initial.hp,
    intent: initial.fight?.intent ?? null,
    banner: null,
    score: null,
    strike: null,
    floaters: [],
    shake: 0,
    hurt: 0,
    busy: false,
    intro: false,
    yakuFlash: null,
    tip: null,
    calmed: false,
  }));
  const viewRef = useRef(view);
  viewRef.current = view;
  const runRef = useRef<RunState>(initial);
  const busyRef = useRef(false);
  const waits = useRef(new Map<WaitKind, () => void>());
  const mounted = useRef(true);

  const patch = useCallback((p: Partial<GameView> | ((v: GameView) => Partial<GameView>)) => {
    if (!mounted.current) return;
    setView((v) => {
      const next = typeof p === 'function' ? p(v) : p;
      return { ...v, ...next };
    });
  }, []);

  const waitFor = useCallback((kind: WaitKind) => {
    if (speedFactor() === 0 && kind !== 'intro') return Promise.resolve();
    return new Promise<void>((resolve) => waits.current.set(kind, resolve));
  }, []);

  const resolveWait = useCallback((kind: WaitKind) => {
    const r = waits.current.get(kind);
    waits.current.delete(kind);
    r?.();
  }, []);

  const showTip = useCallback(
    (id: TipId) => {
      const s = getState();
      if (!s.settings.guide || s.profile.tipsSeen.includes(id)) return;
      setState((st) => ({ profile: { ...st.profile, tipsSeen: [...st.profile.tipsSeen, id] } }));
      patch({ tip: id });
    },
    [patch],
  );

  const floater = useCallback(
    (text: string, kind: Floater['kind'], at: Floater['at']) => {
      const f: Floater = { id: uid++, text, kind, at };
      patch((v) => ({ floaters: [...v.floaters, f] }));
      setTimeout(() => patch((v) => ({ floaters: v.floaters.filter((x) => x.id !== f.id) })), 1400);
    },
    [patch],
  );

  const banner = useCallback(
    async (kind: BannerKind, title: string, ms: number, sub?: string, seat?: Seat) => {
      const b: Banner = {
        id: uid++,
        kind,
        title,
        ...(sub ? { sub } : {}),
        ...(seat !== undefined ? { seat } : {}),
      };
      patch({ banner: b });
      await sleep(ms);
      patch((v) => (v.banner?.id === b.id ? { banner: null } : {}));
    },
    [patch],
  );

  // ---------------------------------------------------------------------------

  const animateHandEvent = useCallback(
    async (e: HandEvent, run: RunState) => {
      const f = run.fight;
      if (!f) return;
      const final = f.hand;
      const setVisual = (fn: (v: Visual) => Visual) => patch((v) => ({ visual: fn(v.visual) }));
      switch (e.t) {
        case 'deal': {
          const target = visualFromHand(final);
          const start: Visual = {
            ...target,
            zone: Object.fromEntries(final.deckIds.map((id) => [id, { z: 'pile' as const }])),
            faceUp: {},
            hand: [[], []],
            cap: [[], []],
            slots: [],
            pile: final.deckIds.slice(),
            options: [],
            peeked: [],
          };
          // A new hand in the same fight: first gather last hand's cards into the pile, and let
          // that finish, so no card changes course mid-flight.
          const onTable = Object.values(viewRef.current.visual.zone).some((z) => z.z !== 'pile');
          patch({ visual: start, delays: null });
          if (onTable) {
            sfx.flipSound();
            await sleep(460);
          } else {
            await nextFrame();
          }
          // Then deal two at a time, the way it's done at a table: you, the field, the spirit.
          const order = dealOrder(final.hands[0], final.field, final.hands[1]);
          const step = speedFactor() === 0 ? 0 : 38 * speedFactor();
          const delays = new Map<CardId, number>();
          order.forEach((id, i) => delays.set(id, i * step));
          patch({ visual: target, delays });
          sfx.flipSound();
          await sleep(order.length * 38 + 380);
          patch({ delays: null });
          break;
        }
        case 'turn':
          break;
        case 'play':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          if (e.seat === 0) haptics.play();
          await sleep(e.seat === 0 ? 150 : 320);
          break;
        case 'flip':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          await sleep(360);
          break;
        case 'place':
          setVisual((v) => applyEvent(v, e, final));
          sfx.slap(0.8);
          await sleep(240);
          break;
        case 'match':
          setVisual((v) => applyEvent(v, e, final));
          sfx.slap(1.1);
          if (e.seat === 0) haptics.capture();
          await sleep(300);
          break;
        case 'choice':
          setVisual((v) => applyEvent(v, e, final));
          await sleep(200);
          break;
        case 'capture':
          setVisual((v) => applyEvent(v, e, final));
          sfx.tock(e.seat === 0 ? 1100 : 800, 0.35);
          await sleep(320);
          if (e.seat === 0) {
            if (run.month === 1 && run.guided) showTip('captured');
          }
          break;
        case 'frog':
        case 'leap':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          await sleep(360);
          break;
        case 'noFlip':
          await banner('info', e.seat === 0 ? 'No flip' : 'The wind takes its flip', 700);
          break;
        case 'yaku': {
          const names = e.fresh.length ? e.fresh : e.hits.map((h) => h.id);
          patch({ yakuFlash: { seat: e.seat, ids: names } });
          sfx.yakuChime(Math.min(8, 3 + e.points));
          if (e.seat === 0) haptics.yaku();
          await banner(
            'yaku',
            names.map((id) => yakuDef(id).name).join(' · '),
            1150,
            e.seat === 0
              ? `${e.points} point${e.points === 1 ? '' : 's'}`
              : `${spiritDef(f.spiritId).name} forms a yaku`,
            e.seat,
          );
          patch({ yakuFlash: null });
          if (e.seat === 0 && f.stage !== 'matching') showTip('firstYaku');
          break;
        }
        case 'decide':
          if (e.seat === 1) await sleep(500);
          else showTip('decide');
          break;
        case 'koikoi':
          sfx.koikoiSound();
          haptics.koikoi();
          await banner(
            'koikoi',
            'Koi-Koi!',
            1200,
            e.seat === 0
              ? 'Stakes ×2 on your next stop'
              : `${spiritDef(f.spiritId).name} presses on`,
            e.seat,
          );
          if (e.seat === 0) showTip('koikoiDone');
          break;
        case 'stop':
          sfx.stopSound();
          await banner(
            'stop',
            'Stop',
            800,
            e.seat === 0 ? 'You take your winnings' : `${spiritDef(f.spiritId).name} stops`,
            e.seat,
          );
          break;
        case 'exhausted':
          await banner('wilt', 'The hand wilts', 1200, 'No one scores');
          showTip('wilt');
          break;
        case 'steal':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          await banner('danger', 'Snatched!', 900, 'The Tengu hides your Bright in the deck');
          break;
        case 'freeze':
          setVisual((v) => applyEvent(v, e, final));
          sfx.tock(2600, 0.3);
          await sleep(420);
          break;
        case 'thaw':
          setVisual((v) => applyEvent(v, e, final));
          await sleep(200);
          break;
        case 'disguise':
          setVisual((v) => applyEvent(v, e, final));
          break;
        case 'reveal':
          setVisual((v) => applyEvent(v, e, final));
          if (run.fight?.boss && spiritDef(f.spiritId).rule?.id === 'kitsune')
            await banner('danger', 'Foxfire!', 700, 'It was an illusion');
          break;
        case 'quake':
          patch((v) => ({ shake: v.shake + 1 }));
          sfx.taiko(1.2);
          setVisual((v) => applyEvent(v, e, final));
          await banner('danger', 'Earthquake!', 900, 'The field is dealt again');
          break;
        case 'downpour':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          await sleep(500);
          break;
        case 'swap':
        case 'peek':
          setVisual((v) => applyEvent(v, e, final));
          sfx.flipSound();
          await sleep(350);
          break;
      }
    },
    [patch, banner, showTip],
  );

  /** A card played from a hand, and where it lands, as one move. */
  const animatePlay = useCallback(
    async (play: HandEvent, land: HandEvent, run: RunState) => {
      const final = run.fight?.hand;
      if (!final || play.t !== 'play') return;
      patch((v) => ({ visual: applyEvent(applyEvent(v.visual, play, final), land, final) }));
      if (play.seat === 0) haptics.play();
      if (land.t === 'choice') {
        sfx.flipSound();
        await sleep(260);
        return;
      }
      sfx.slap(land.t === 'match' ? 1.1 : 0.8);
      if (land.t === 'match' && play.seat === 0) haptics.capture();
      await sleep(play.seat === 0 ? 320 : 420);
    },
    [patch],
  );

  const animate = useCallback(
    async (events: readonly RunEvent[], run: RunState) => {
      for (let i = 0; i < events.length; i++) {
        const re = events[i] as RunEvent;
        if (!mounted.current) return;
        switch (re.t) {
          case 'hand': {
            // A played card goes straight to where it lands (a free slot, the card it matches, or
            // the spot where you choose between two matches), not via the middle of the field.
            const next = events[i + 1];
            const e = re.e;
            if (
              e.t === 'play' &&
              next?.t === 'hand' &&
              (next.e.t === 'place' || next.e.t === 'match' || next.e.t === 'choice') &&
              next.e.card === e.card
            ) {
              await animatePlay(e, next.e, run);
              i += 1;
              break;
            }
            await animateHandEvent(e, run);
            break;
          }
          case 'fightStart': {
            patch({
              intro: true,
              calmed: false,
              spiritHp: run.fight?.maxHp ?? 0,
              intent: null,
              visual: emptyVisual(),
            });
            sfx.startMusic(seasonOfMonth(run.month));
            await waitFor('intro');
            patch({ intro: false });
            if (run.fight?.boss) showTip('boss');
            break;
          }
          case 'newHand':
            if (re.handNo > 1)
              await banner(
                'hand',
                `Hand ${re.handNo}`,
                700,
                re.lead === 0 ? 'You lead' : 'The spirit leads',
              );
            if (run.guided && run.month === 1 && re.handNo === 1) showTip('matching');
            if (run.guided && run.month === 2 && re.handNo === 1) showTip('yakuIntro');
            break;
          case 'intent':
            patch({ intent: re.intent });
            if (re.intent && run.month >= 2) showTip('intent');
            break;
          case 'strike':
            if (re.target === 'spirit') {
              patch((v) => ({ spiritHp: Math.max(0, v.spiritHp - re.amount) }));
              floater(`−${re.amount}`, 'dmg', 'spirit');
              sfx.strikeSound(false);
              if (re.source === 'capture') showTip('strike');
              else void banner('info', "Thief's Sleeve!", 700, `−${re.amount}`);
            } else {
              patch((v) => ({ playerHp: Math.max(0, v.playerHp - re.amount) }));
              floater(`−${re.amount}`, 'hurt', 'player');
              sfx.tock(500, 0.4);
            }
            await sleep(260);
            break;
          case 'playerStop':
            patch({ score: { result: re.score, hits: re.hits } });
            await waitFor('score');
            patch((v) => ({
              score: null,
              spiritHp: Math.max(0, v.spiritHp - re.score.damage),
              shake: v.shake + 1,
            }));
            sfx.strikeSound(true);
            haptics.strike();
            floater(`−${re.score.damage}`, 'dmg', 'spirit');
            await sleep(700);
            break;
          case 'spiritStop': {
            patch({ strike: { hit: re.hit, hits: re.hits } });
            await waitFor('strike');
            patch((v) => ({
              strike: null,
              playerHp: Math.max(0, v.playerHp - re.hit.damage),
              shake: v.shake + 1,
              hurt: v.hurt + 1,
            }));
            sfx.hurtSound();
            haptics.hurt();
            floater(`−${re.hit.damage}`, 'hurt', 'player');
            await sleep(800);
            showTip('spiritScored');
            break;
          }
          case 'fightWon':
            patch({ calmed: true });
            sfx.victorySound();
            await banner(
              'calm',
              `${spiritDef(re.spirit).name} is calmed`,
              1700,
              'The spirit returns to the year',
            );
            break;
          case 'defeat':
            sfx.defeatSound();
            await banner('danger', 'Your petals fall', 1600);
            break;
          case 'victory':
            sfx.victorySound();
            await banner('calm', 'The year is complete', 1800);
            break;
          case 'mon':
            if (re.reason !== 'Reward') floater(`+${re.amount} mon`, 'mon', 'player');
            sfx.coinSound();
            break;
          case 'heal':
            if (re.amount > 0) {
              floater(`+${re.amount}`, 'heal', 'player');
              patch((v) => ({ playerHp: Math.min(run.maxHp, v.playerHp + re.amount) }));
            }
            break;
          case 'grow':
            floater('Charm grows', 'info', 'player');
            break;
          case 'crumble':
            floater('A torn card crumbles', 'info', 'center');
            break;
          case 'ofuda':
            sfx.pluck(587, 0, 0.3);
            break;
          case 'poem':
          case 'enhanced':
            sfx.yakuChime(4);
            break;
        }
      }
    },
    [animateHandEvent, animatePlay, patch, waitFor, banner, floater, showTip],
  );

  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useCallback(
    (action: RunAction) => {
      if (busyRef.current) return;
      let res: { state: RunState; events: RunEvent[] };
      try {
        res = runStep(runRef.current, action);
      } catch (err) {
        console.warn('Rejected action', action, err);
        return;
      }
      const prev = runRef.current;
      busyRef.current = true;
      patch({ busy: true, tip: null });
      runRef.current = res.state;
      setState({ run: res.state });
      // A new fight starts: switch the screen to the table now so the intro can play on it.
      if (
        res.state.phase === 'fight' &&
        res.state.fight &&
        (prev.phase !== 'fight' || prev.month !== res.state.month)
      ) {
        patch({
          shown: res.state,
          visual: emptyVisual(),
          spiritHp: res.state.fight.maxHp,
          playerHp: res.state.hp,
          intent: null,
          calmed: false,
        });
      }
      void (async () => {
        try {
          await animate(res.events, res.state);
        } finally {
          busyRef.current = false;
          const run = res.state;
          patch((v) => ({
            busy: false,
            shown: run,
            visual: run.fight ? reconcile(v.visual, run.fight.hand) : v.visual,
            spiritHp: run.fight?.hp ?? v.spiritHp,
            playerHp: run.hp,
            intent: run.fight?.intent ?? null,
          }));
          afterStep(run);
        }
      })();
    },
    // afterStep is defined below and stable via ref.
    [animate, patch],
  );

  const afterStepRef = useRef<(run: RunState) => void>(() => undefined);
  function afterStep(run: RunState) {
    afterStepRef.current(run);
  }
  afterStepRef.current = (run: RunState) => {
    if (scheduleRef.current) clearTimeout(scheduleRef.current);
    if (run.phase !== 'fight' || !run.fight || run.fight.phase !== 'hand') return;
    const h = run.fight.hand;
    if (h.phase === 'over') return;
    const who = waitingOn(run);
    const later = (fn: () => void, ms: number) => {
      const f = speedFactor();
      scheduleRef.current = setTimeout(fn, f === 0 ? 0 : ms * f);
    };
    if (who === 'spirit') later(() => dispatch({ type: 'spirit' }), h.phase === 'play' ? 520 : 260);
    else if (h.phase === 'flip' && h.active === 0)
      later(() => dispatch({ type: 'hand', action: { type: 'flip' } }), 180);
  };

  // Kick things off: play the intro for a fresh fight, or resume where we were.
  useEffect(() => {
    mounted.current = true;
    const run = runRef.current;
    if (run.phase === 'fight' && run.fight) {
      const f = run.fight;
      const fresh =
        f.handNo === 1 &&
        f.hand.turn === 0 &&
        f.hand.phase === 'play' &&
        f.hand.captured[0].length === 0 &&
        f.hand.captured[1].length === 0 &&
        !f.hand.koikoi[0];
      if (fresh && f.hand.active === f.lead) {
        busyRef.current = true;
        patch({ busy: true });
        void (async () => {
          const startEvents: RunEvent[] = [
            { t: 'fightStart', spirit: f.spiritId, month: run.month },
            { t: 'newHand', handNo: 1, lead: f.lead },
            { t: 'hand', e: { t: 'deal', redeals: 0 } },
          ];
          await animate(startEvents, run);
          busyRef.current = false;
          patch({ busy: false, visual: visualFromHand(f.hand), intent: f.intent });
          afterStep(run);
        })();
      } else {
        sfx.startMusic(seasonOfMonth(run.month));
        afterStep(run);
      }
    }
    return () => {
      mounted.current = false;
      if (scheduleRef.current) clearTimeout(scheduleRef.current);
    };
    // Run once per mounted game screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAct = !view.busy && waitingOn(view.shown) === 'player';

  // A read-only hook for automated playthroughs (Playwright) and debugging.
  useEffect(() => {
    (window as unknown as { __tp?: unknown }).__tp = {
      canAct,
      busy: view.busy,
      intro: view.intro,
      scoring: Boolean(view.score || view.strike),
      run: view.shown,
    };
  }, [canAct, view.busy, view.intro, view.score, view.strike, view.shown]);
  const dismissTip = useCallback(() => patch({ tip: null }), [patch]);

  return useMemo(
    () => ({ view, dispatch, resolveWait, dismissTip, canAct }),
    [view, dispatch, resolveWait, dismissTip, canAct],
  );
}

function seasonOfMonth(m: number) {
  return m <= 3 ? 'spring' : m <= 6 ? 'summer' : m <= 9 ? 'autumn' : 'winter';
}
