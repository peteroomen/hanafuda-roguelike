import { usePaperOnOpen } from '@/ui/audio/usePaper';
import { type ReactNode, useState } from 'react';
import { type CardId, type Land, landCards, landMonths, monthDef, seasonOf } from '@/content/cards';
import { landText } from '@/content/lands';
import { enhancementDef } from '@/content/enhancements';
import { ofudaDef } from '@/content/ofuda';
import { type Archetype, omamoriDef } from '@/content/omamori';
import { spiritDef } from '@/content/spirits';
import { yakuDef, yakuText } from '@/content/yaku';
import { type RunState, shopDiscount } from '@/engine/run';
import { omamoriText } from '@/engine/scoring';
import {
  healPrice,
  offerPrice,
  rerollPrice,
  sellPrice,
  shrinePrice,
  type ShopOffer,
} from '@/engine/shop';
import { BALANCE } from '@/content/balance';
import { cardFaceUrl, spiritUrl } from '@/ui/art/images';
import { CoinIcon, OfudaIcon, OmamoriIcon, PetalIcon, PoemIcon } from '@/ui/art/Icons';
import * as sfx from '@/ui/audio/audio';
import { CharmSheet, OfudaSheet } from './Sheets';
import type { GameApi } from './useGame';
import { GuideBubble } from './Overlays';
import { markTip, useStore } from '@/ui/state/store';

function offerTitle(o: ShopOffer, land: Land): string {
  if (o.kind === 'omamori') return omamoriDef(o.id).name;
  if (o.kind === 'ofuda') return ofudaDef(o.id).name;
  // The shelf and the details sheet both say it's a poem.
  return yakuText(o.id, land).name;
}

function offerText(o: ShopOffer, run: RunState): string {
  if (o.kind === 'omamori') return omamoriText({ id: o.id, counter: 0 }, run.land);
  if (o.kind === 'ofuda') return ofudaDef(o.id).text;
  const y = yakuDef(o.id);
  const lv = (run.poems[o.id] ?? 0) + 1;
  return `${yakuText(o.id, run.land).name} to Lv ${lv}: +${y.poem.chips} Chips and +${y.poem.mult} Mult each time it scores.`;
}

type Service = 'shrine' | 'heal' | 'reroll';
/** What the details sheet is showing: an offer (by index) or a service. */
type Picked = { kind: 'offer'; i: number } | { kind: 'service'; id: Service } | null;

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  brights: 'Brights',
  ribbons: 'Ribbons',
  animals: 'Animals',
  chaff: 'Chaff',
  greed: 'Greed',
  season: 'Season',
  denial: 'Denial',
  sake: 'Sake',
  growth: 'Growth',
  general: 'Any hand',
};

function offerSub(o: ShopOffer, run: RunState): string {
  if (o.kind === 'omamori') return ARCHETYPE_LABEL[omamoriDef(o.id).archetype];
  if (o.kind === 'ofuda') return 'One use';
  const lv = run.poems[o.id] ?? 0;
  return `Lv ${lv} → ${lv + 1}`;
}

function Tile(props: {
  art: ReactNode;
  name: string;
  sub: string;
  price: number | null;
  /** Shown instead of the price when there is none. */
  soldLabel?: string;
  picked: boolean;
  dim: boolean;
  onTap: () => void;
  testId: string;
  kind: string;
}) {
  return (
    <button
      className={`tile tile-${props.kind} ${props.dim ? 'dim' : ''} ${props.picked ? 'picked' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        props.onTap();
      }}
      aria-pressed={props.picked}
      data-testid={props.testId}
    >
      <div className="tile-art">{props.art}</div>
      <div className="tile-name">{props.name}</div>
      <div className="tile-sub">{props.sub}</div>
      <div className="tile-price">
        {props.price === null ? (
          (props.soldLabel ?? 'Sold')
        ) : (
          <>
            <CoinIcon size={12} /> {props.price}
          </>
        )}
      </div>
    </button>
  );
}

function Shelf({ label, count, children }: { label: string; count?: string; children: ReactNode }) {
  return (
    <section className="shelf">
      <div className="shelf-label">
        <span>{label}</span>
        {count && <span className="shelf-count">{count}</span>}
      </div>
      {children}
    </section>
  );
}

export function ShopView({ api }: { api: GameApi }) {
  const run = api.view.shown;
  const shop = run.shop;
  const { dispatch } = api;
  const [picked, setPicked] = useState<Picked>(null);
  const [shrineOpen, setShrineOpen] = useState(false);
  const [charm, setCharm] = useState<number | null>(null);
  const [talisman, setTalisman] = useState<number | null>(null);
  const tipsSeen = useStore((s) => s.profile.tipsSeen);
  const guideOn = useStore((s) => s.settings.guide);
  if (!shop) return null;
  const ctx = { deckId: run.deckId, omen: run.omen, discount: shopDiscount(run) };
  const nextSpirit = spiritDef(run.schedule[run.month - 1] ?? 'kodama');
  const m = monthDef(run.month, run.land);
  const season = seasonOf(run.month, run.land);

  const canBuy = (o: ShopOffer) => {
    if (o.sold) return false;
    if (run.mon < offerPrice(o, ctx)) return false;
    if (o.kind === 'omamori' && run.omamori.length >= run.omamoriSlots) return false;
    if (o.kind === 'ofuda' && run.ofuda.length >= run.ofudaSlots) return false;
    return true;
  };
  const why = (o: ShopOffer) => {
    if (o.sold) return '';
    if (o.kind === 'omamori' && run.omamori.length >= run.omamoriSlots)
      return 'Charm slots full: sell one first';
    if (o.kind === 'ofuda' && run.ofuda.length >= run.ofudaSlots) return 'Talisman slots full';
    if (run.mon < offerPrice(o, ctx)) return 'Not enough mon';
    return '';
  };
  const showTip = guideOn && !tipsSeen.includes('shop');
  const healAmount = Math.min(
    run.maxHp - run.hp,
    Math.round(run.maxHp * BALANCE.shop.healFraction),
  );
  const enh = enhancementDef(shop.shrine.enhancement);
  const prices: Record<Service, number> = {
    shrine: shrinePrice(shop.shrine.enhancement, ctx),
    heal: healPrice(ctx),
    reroll: rerollPrice(shop.rerolls, ctx),
  };
  const serviceWhy = (id: Service): string => {
    if (id === 'shrine' && shop.shrine.used) return 'The shrine has blessed a card this month';
    if (id === 'heal' && shop.healUsed) return 'You have already rested this month';
    if (id === 'heal' && run.hp >= run.maxHp) return 'You are at full HP';
    if (run.mon < prices[id]) return 'Not enough mon';
    return '';
  };
  const serviceDone = (id: Service) =>
    (id === 'shrine' && shop.shrine.used) || (id === 'heal' && shop.healUsed);

  const isPicked = (p: NonNullable<Picked>) =>
    picked !== null &&
    picked.kind === p.kind &&
    (p.kind === 'offer'
      ? picked.kind === 'offer' && picked.i === p.i
      : picked.kind === 'service' && picked.id === p.id);
  // A second tap on the same tile puts the details away.
  const toggle = (p: NonNullable<Picked>) => setPicked(isPicked(p) ? null : p);

  const offerTile = (i: number) => {
    const o = shop.offers[i] as ShopOffer;
    return (
      <Tile
        key={`${o.kind}-${o.id}-${i}`}
        kind={o.kind}
        art={
          o.kind === 'omamori' ? (
            <OmamoriIcon id={o.id} size={31} />
          ) : o.kind === 'ofuda' ? (
            <OfudaIcon id={o.id} size={19} />
          ) : (
            <PoemIcon id={o.id} land={run.land} size={19} />
          )
        }
        name={offerTitle(o, run.land)}
        sub={offerSub(o, run)}
        price={o.sold ? null : offerPrice(o, ctx)}
        picked={isPicked({ kind: 'offer', i })}
        dim={o.sold}
        onTap={() => toggle({ kind: 'offer', i })}
        testId={`offer-${i}`}
      />
    );
  };
  const indexes = (kind: ShopOffer['kind']) =>
    shop.offers.flatMap((o, i) => (o.kind === kind ? [i] : []));
  const charmIdx = indexes('omamori');
  const ofudaIdx = indexes('ofuda');
  const poemIdx = indexes('poem');

  const serviceTile = (id: Service) => {
    const kanji = id === 'shrine' ? enh.kanji : id === 'heal' ? '湯' : '替';
    const name = id === 'shrine' ? 'Shrine' : id === 'heal' ? 'Onsen' : 'New wares';
    const sub =
      id === 'shrine'
        ? shop.shrine.used
          ? 'Used this month'
          : enh.name
        : id === 'heal'
          ? shop.healUsed
            ? 'Used this month'
            : healAmount > 0
              ? `+${healAmount} HP`
              : 'Full HP'
          : 'Restock';
    return (
      <Tile
        key={id}
        kind="service"
        art={<span className="seal display">{kanji}</span>}
        name={name}
        sub={sub}
        price={serviceDone(id) ? null : prices[id]}
        soldLabel="Used"
        picked={isPicked({ kind: 'service', id })}
        dim={serviceDone(id)}
        onTap={() => toggle({ kind: 'service', id })}
        testId={id === 'shrine' ? 'btn-shrine' : id === 'heal' ? 'btn-heal' : 'btn-reroll'}
      />
    );
  };

  const buyService = (id: Service) => {
    setPicked(null);
    if (id === 'shrine') {
      setShrineOpen(true);
      return;
    }
    sfx.coinSound();
    dispatch(id === 'heal' ? { type: 'heal' } : { type: 'reroll' });
  };

  const detail = (() => {
    if (!picked) return null;
    if (picked.kind === 'offer') {
      const o = shop.offers[picked.i];
      if (!o) return null;
      return (
        <DetailSheet
          kind={o.kind === 'omamori' ? 'Charm' : o.kind === 'ofuda' ? 'Talisman' : 'Poem'}
          art={
            o.kind === 'omamori' ? (
              <OmamoriIcon id={o.id} size={31} />
            ) : o.kind === 'ofuda' ? (
              <OfudaIcon id={o.id} size={19} />
            ) : (
              <PoemIcon id={o.id} land={run.land} size={19} />
            )
          }
          name={offerTitle(o, run.land)}
          action={o.sold ? 'Sold' : `Buy · ${offerPrice(o, ctx)} mon`}
          enabled={canBuy(o)}
          why={why(o)}
          onAct={() => {
            sfx.coinSound();
            dispatch({ type: 'buy', offer: picked.i });
            setPicked(null);
          }}
          onClose={() => setPicked(null)}
        >
          {o.kind === 'omamori' && (
            <div className="detail-sub">
              {omamoriDef(o.id).kanji} · {omamoriDef(o.id).rarity} ·{' '}
              {ARCHETYPE_LABEL[omamoriDef(o.id).archetype]}
            </div>
          )}
          {o.kind === 'poem' && <div className="detail-sub">{yakuText(o.id, run.land).gloss}</div>}
          {o.kind === 'poem' && (
            <div className="haiku">
              {yakuText(o.id, run.land).haiku.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          )}
          <p className="detail-text">{offerText(o, run)}</p>
        </DetailSheet>
      );
    }
    const id = picked.id;
    const done = serviceDone(id);
    return (
      <DetailSheet
        kind="Service"
        art={
          <span className="seal display">
            {id === 'shrine' ? enh.kanji : id === 'heal' ? '湯' : '替'}
          </span>
        }
        name={id === 'shrine' ? `Shrine: ${enh.name}` : id === 'heal' ? 'Onsen' : 'New wares'}
        action={
          done
            ? 'Used this month'
            : id === 'shrine'
              ? `Choose a card · ${prices.shrine} mon`
              : id === 'heal'
                ? `Rest · ${prices.heal} mon`
                : `Restock · ${prices.reroll} mon`
        }
        enabled={serviceWhy(id) === ''}
        why={done ? '' : serviceWhy(id)}
        onAct={() => buyService(id)}
        onClose={() => setPicked(null)}
      >
        {id === 'shrine' && (
          <p className="detail-text">
            Bless one card in your deck. {landText(enh.text, run.land)} The deck is shared, so the
            spirit may capture it too.
          </p>
        )}
        {id === 'heal' && (
          <>
            <p className="detail-text">
              Restore {Math.round(BALANCE.shop.healFraction * 100)}% of your max HP, once per
              market.
            </p>
            <div className="detail-hp">
              <span>{run.hp}</span>
              <div className="detail-hpbar">
                <i style={{ width: `${(run.hp / run.maxHp) * 100}%` }} />
                <i className="gain" style={{ width: `${(healAmount / run.maxHp) * 100}%` }} />
              </div>
              <span>{run.maxHp}</span>
            </div>
          </>
        )}
        {id === 'reroll' && (
          <p className="detail-text">
            Replace every charm, talisman and poem on offer. Each restock this month costs more than
            the last.
          </p>
        )}
      </DetailSheet>
    );
  })();

  return (
    // Tapping anywhere outside a tile or its details puts the details away.
    <div className="shop screen-pad" data-testid="shop" onClick={() => setPicked(null)}>
      <div className="shop-head">
        <div className="shop-title display">The Shrine Market</div>
        <div className="shop-wallet">
          <span className="wallet-pill">
            <PetalIcon size={13} /> {run.hp}
            <small>/{run.maxHp}</small>
          </span>
          <span className="wallet-pill purse">
            <CoinIcon size={16} />
            <span className="display" data-testid="mon">
              {run.mon}
            </span>
          </span>
        </div>
      </div>

      {charmIdx.length > 0 && (
        <Shelf label="Charms" count={`${run.omamori.length}/${run.omamoriSlots} slots`}>
          <div className="tiles">{charmIdx.map(offerTile)}</div>
        </Shelf>
      )}

      <div
        className="shelf-split"
        style={{ gridTemplateColumns: `${Math.max(1, ofudaIdx.length)}fr ${poemIdx.length}fr` }}
      >
        {ofudaIdx.length > 0 && (
          <Shelf label="Talismans" count={`${run.ofuda.length}/${run.ofudaSlots}`}>
            <div
              className="tiles"
              style={{ gridTemplateColumns: `repeat(${ofudaIdx.length}, 1fr)` }}
            >
              {ofudaIdx.map(offerTile)}
            </div>
          </Shelf>
        )}
        {poemIdx.length > 0 && (
          <Shelf label="Poems">
            <div
              className="tiles"
              style={{ gridTemplateColumns: `repeat(${poemIdx.length}, 1fr)` }}
            >
              {poemIdx.map(offerTile)}
            </div>
          </Shelf>
        )}
      </div>

      <Shelf label="Services">
        <div className="tiles">{(['shrine', 'heal', 'reroll'] as const).map(serviceTile)}</div>
      </Shelf>

      <Shelf label="Yours" count="tap to sell or move">
        <div className="owned-row">
          <div className="charm-row big">
            {Array.from({ length: run.omamoriSlots }, (_, i) => {
              const inst = run.omamori[i];
              return (
                <button
                  key={i}
                  className={`slot charm ${inst ? '' : 'empty'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inst) setCharm(i);
                  }}
                  data-testid={`shop-charm-${i}`}
                >
                  {inst && <OmamoriIcon id={inst.id} size={28} />}
                </button>
              );
            })}
          </div>
          <div className="ofuda-row">
            {Array.from({ length: run.ofudaSlots }, (_, i) => {
              const id = run.ofuda[i];
              return (
                <button
                  key={i}
                  className={`slot ofuda ${id ? '' : 'empty'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (id) setTalisman(i);
                  }}
                  aria-label={id ? ofudaDef(id).name : 'Empty talisman slot'}
                  data-testid={`shop-ofuda-${i}`}
                >
                  {id && <OfudaIcon id={id} size={17} />}
                </button>
              );
            })}
          </div>
        </div>
      </Shelf>

      <div className="shop-foot">
        <div className="next-spirit">
          <img src={spiritUrl(nextSpirit.id, season, nextSpirit.boss)} alt="" />
          <div>
            <div className="display">{nextSpirit.name}</div>
            <small>
              {nextSpirit.boss ? 'Boss · ' : ''}
              {nextSpirit.rule ? nextSpirit.rule.title : nextSpirit.epithet}
            </small>
          </div>
        </div>
        <button
          className="btn red go-btn"
          onClick={() => dispatch({ type: 'leaveShop' })}
          data-testid="btn-leave-shop"
        >
          <span className="display">Month {run.month} →</span>
          <small>
            {season[0]?.toUpperCase()}
            {season.slice(1)} · {m.flower}
          </small>
        </button>
      </div>

      {detail}

      {shrineOpen && (
        <ShrinePicker
          run={run}
          onPick={(card) => {
            sfx.coinSound();
            dispatch({ type: 'enhance', card });
            setShrineOpen(false);
          }}
          onClose={() => setShrineOpen(false)}
        />
      )}
      {charm !== null && run.omamori[charm] && (
        <CharmSheet
          inst={run.omamori[charm] as NonNullable<(typeof run.omamori)[number]>}
          slot={charm}
          count={run.omamori.length}
          onMove={(from, to) => {
            dispatch({ type: 'moveOmamori', from, to });
            setCharm(to);
          }}
          onSell={() => {
            dispatch({ type: 'sell', slot: charm });
            setCharm(null);
          }}
          sellPrice={sellPrice(
            (run.omamori[charm] as NonNullable<(typeof run.omamori)[number]>).id,
          )}
          onClose={() => setCharm(null)}
        />
      )}
      {talisman !== null && run.ofuda[talisman] && (
        <OfudaSheet
          id={run.ofuda[talisman] as NonNullable<(typeof run.ofuda)[number]>}
          usable={false}
          reason="Talismans are used during a fight, on your turn."
          onUse={() => undefined}
          onDiscard={() => {
            dispatch({ type: 'discardOfuda', slot: talisman });
            setTalisman(null);
          }}
          onClose={() => setTalisman(null)}
        />
      )}
      {showTip && <GuideBubble tip="shop" onDismiss={() => markTip('shop')} bottom={90} />}
    </div>
  );
}

/** The one details sheet every tile opens: what it is, what it does, and the button to get it. */
function DetailSheet(props: {
  kind: string;
  art: ReactNode;
  name: string;
  action: string;
  enabled: boolean;
  why: string;
  onAct: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  usePaperOnOpen();
  return (
    <div
      className="shop-detail paper pop-in"
      data-testid="offer-detail"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="detail-top">
        <div className="detail-art">{props.art}</div>
        <div>
          <div className="detail-kind">{props.kind}</div>
          <div className="detail-name display">{props.name}</div>
        </div>
      </div>
      {props.children}
      <div className="detail-actions">
        <button
          className="btn gold"
          disabled={!props.enabled}
          onClick={props.onAct}
          data-testid="btn-buy"
        >
          {props.action}
        </button>
        <button className="btn ghost small" onClick={props.onClose}>
          Close
        </button>
      </div>
      {props.why && <div className="offer-why">{props.why}</div>}
    </div>
  );
}

function ShrinePicker({
  run,
  onPick,
  onClose,
}: {
  run: RunState;
  onPick: (card: CardId) => void;
  onClose: () => void;
}) {
  usePaperOnOpen();
  const enh = run.shop?.shrine.enhancement;
  return (
    <div className="sheet-scrim fade-in" onClick={onClose} data-testid="shrine">
      <div className="sheet paper tall pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="item-name display">
            Bless a card: {enh ? enhancementDef(enh).name : ''}
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="shrine-note">
          {enh ? landText(enhancementDef(enh).text, run.land) : ''} The deck is shared, so the
          spirit may capture it too.
        </div>
        <div className="sheet-body scroll">
          {landMonths(run.land).map((m) => (
            <div key={m.month} className="shrine-month">
              <div className="shrine-month-name">
                {m.month} · {m.flower}
              </div>
              <div className="shrine-cards">
                {landCards(run.land)
                  .filter((c) => c.month === m.month && run.deck.includes(c.id))
                  .map((c) => {
                    const cur = run.enhancements[String(c.id)];
                    return (
                      <button
                        key={c.id}
                        className="shrine-card"
                        onClick={() => onPick(c.id)}
                        data-testid={`shrine-card-${c.id}`}
                      >
                        <img src={cardFaceUrl(c.id)} alt={c.name} />
                        {cur && (
                          <span className={`enh enh-${cur}`}>{enhancementDef(cur).kanji}</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
