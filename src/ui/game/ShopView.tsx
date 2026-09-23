import { useState } from 'react';
import { CARDS, type CardId, MONTHS, monthDef, seasonOf } from '@/content/cards';
import { enhancementDef } from '@/content/enhancements';
import { ofudaDef } from '@/content/ofuda';
import { omamoriDef } from '@/content/omamori';
import { spiritDef } from '@/content/spirits';
import { yakuDef } from '@/content/yaku';
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
import { CharmSheet } from './Sheets';
import type { GameApi } from './useGame';
import { GuideBubble } from './Overlays';
import { markTip, useStore } from '@/ui/state/store';

function offerTitle(o: ShopOffer): string {
  if (o.kind === 'omamori') return omamoriDef(o.id).name;
  if (o.kind === 'ofuda') return ofudaDef(o.id).name;
  return `Poem: ${yakuDef(o.id).name}`;
}

function offerText(o: ShopOffer, run: RunState): string {
  if (o.kind === 'omamori') return omamoriText({ id: o.id, counter: 0 });
  if (o.kind === 'ofuda') return ofudaDef(o.id).text;
  const y = yakuDef(o.id);
  const lv = (run.poems[o.id] ?? 0) + 1;
  return `${y.name} to Lv ${lv}: +${y.poem.chips} chips and +${y.poem.mult} mult each time it scores.`;
}

export function ShopView({ api }: { api: GameApi }) {
  const run = api.view.shown;
  const shop = run.shop;
  const { dispatch } = api;
  const [picked, setPicked] = useState<number | null>(null);
  const [shrineOpen, setShrineOpen] = useState(false);
  const [charm, setCharm] = useState<number | null>(null);
  const tipsSeen = useStore((s) => s.profile.tipsSeen);
  const guideOn = useStore((s) => s.settings.guide);
  if (!shop) return null;
  const ctx = { deckId: run.deckId, omen: run.omen, discount: shopDiscount(run) };
  const nextSpirit = spiritDef(run.schedule[run.month - 1] ?? 'kodama');
  const m = monthDef(run.month);
  const pickedOffer = picked !== null ? shop.offers[picked] : undefined;
  const buy = (i: number) => {
    const o = shop.offers[i];
    if (!o) return;
    sfx.coinSound();
    dispatch({ type: 'buy', offer: i });
    setPicked(null);
  };
  const canBuy = (o: ShopOffer) => {
    if (o.sold) return false;
    if (run.mon < offerPrice(o, ctx)) return false;
    if (o.kind === 'omamori' && run.omamori.length >= run.omamoriSlots) return false;
    if (o.kind === 'ofuda' && run.ofuda.length >= run.ofudaSlots) return false;
    return true;
  };
  const why = (o: ShopOffer) => {
    if (o.sold) return 'Sold';
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
  return (
    <div className="shop screen-pad" data-testid="shop">
      <div className="shop-head">
        <div>
          <div className="shop-title display">The Shrine Market</div>
          <div className="shop-sub">
            Next: month {run.month}, {m.flower} · {nextSpirit.name}
            {nextSpirit.boss ? ' (boss)' : ''}
          </div>
        </div>
        <div className="purse">
          <CoinIcon size={18} />
          <span className="display" data-testid="mon">
            {run.mon}
          </span>
        </div>
      </div>

      <div className="shop-status">
        <span className="status-pill">
          <PetalIcon size={14} /> {run.hp}/{run.maxHp}
        </span>
        <span className="status-pill">
          Charms {run.omamori.length}/{run.omamoriSlots}
        </span>
        <span className="status-pill">
          Talismans {run.ofuda.length}/{run.ofudaSlots}
        </span>
      </div>

      <div className="offers">
        {shop.offers.map((o, i) => (
          <button
            key={`${o.kind}-${o.id}-${i}`}
            className={`offer ${o.sold ? 'sold' : ''} ${picked === i ? 'picked' : ''} offer-${o.kind}`}
            onClick={() => setPicked(i)}
            data-testid={`offer-${i}`}
          >
            <div className="offer-art">
              {o.kind === 'omamori' && <OmamoriIcon id={o.id} size={46} />}
              {o.kind === 'ofuda' && <OfudaIcon id={o.id} size={30} />}
              {o.kind === 'poem' && <PoemIcon id={o.id} size={30} />}
            </div>
            <div className="offer-name">{offerTitle(o)}</div>
            <div className="offer-price">
              {o.sold ? (
                'Sold'
              ) : (
                <>
                  <CoinIcon size={12} /> {offerPrice(o, ctx)}
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {pickedOffer && (
        <div
          className="offer-detail paper pop-in"
          data-testid="offer-detail"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="offer-detail-name display">{offerTitle(pickedOffer)}</div>
          {pickedOffer.kind === 'omamori' && (
            <div className="offer-detail-sub">
              {omamoriDef(pickedOffer.id).kanji} · {omamoriDef(pickedOffer.id).rarity} charm ·{' '}
              {omamoriDef(pickedOffer.id).archetype}
            </div>
          )}
          {pickedOffer.kind === 'poem' && (
            <div className="haiku">
              {yakuDef(pickedOffer.id).haiku.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          )}
          <div className="offer-detail-text">{offerText(pickedOffer, run)}</div>
          <div className="offer-detail-actions">
            <button
              className="btn gold"
              disabled={!canBuy(pickedOffer)}
              onClick={() => buy(picked as number)}
              data-testid="btn-buy"
            >
              Buy · {offerPrice(pickedOffer, ctx)} mon
            </button>
            <button className="btn ghost small" onClick={() => setPicked(null)}>
              Close
            </button>
          </div>
          {why(pickedOffer) && !pickedOffer.sold && (
            <div className="offer-why">{why(pickedOffer)}</div>
          )}
        </div>
      )}

      <div className="services">
        <button
          className="service"
          disabled={shop.shrine.used || run.mon < shrinePrice(shop.shrine.enhancement, ctx)}
          onClick={() => setShrineOpen(true)}
          data-testid="btn-shrine"
        >
          <span className="service-kanji display">
            {enhancementDef(shop.shrine.enhancement).kanji}
          </span>
          <b>
            {shop.shrine.used
              ? 'Blessed'
              : `Shrine: ${enhancementDef(shop.shrine.enhancement).name}`}
          </b>
          <small>{enhancementDef(shop.shrine.enhancement).text}</small>
          <span className="service-price">
            <CoinIcon size={11} /> {shrinePrice(shop.shrine.enhancement, ctx)}
          </span>
        </button>
        <button
          className="service"
          disabled={shop.healUsed || run.hp >= run.maxHp || run.mon < healPrice(ctx)}
          onClick={() => dispatch({ type: 'heal' })}
          data-testid="btn-heal"
        >
          <span className="service-kanji display">湯</span>
          <b>Onsen</b>
          <small>
            {shop.healUsed
              ? 'You are rested'
              : healAmount > 0
                ? `Restore ${healAmount} HP`
                : 'Already at full HP'}
          </small>
          <span className="service-price">
            <CoinIcon size={11} /> {healPrice(ctx)}
          </span>
        </button>
        <button
          className="service"
          disabled={run.mon < rerollPrice(shop.rerolls, ctx)}
          onClick={() => dispatch({ type: 'reroll' })}
          data-testid="btn-reroll"
        >
          <span className="service-kanji display">替</span>
          <b>New wares</b>
          <small>Restock the stalls</small>
          <span className="service-price">
            <CoinIcon size={11} /> {rerollPrice(shop.rerolls, ctx)}
          </span>
        </button>
      </div>

      <div className="shop-charms">
        <div className="shop-section-title">Your charms · tap to sell or reorder</div>
        <div className="charm-row big">
          {Array.from({ length: run.omamoriSlots }, (_, i) => {
            const inst = run.omamori[i];
            return (
              <button
                key={i}
                className={`slot charm ${inst ? '' : 'empty'}`}
                onClick={() => inst && setCharm(i)}
                data-testid={`shop-charm-${i}`}
              >
                {inst && <OmamoriIcon id={inst.id} size={30} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shop-foot">
        <div className="next-spirit">
          <img src={spiritUrl(nextSpirit.id, seasonOf(run.month), nextSpirit.boss)} alt="" />
          <div>
            <div className="display">{nextSpirit.name}</div>
            <small>{nextSpirit.rule ? nextSpirit.rule.title : nextSpirit.epithet}</small>
          </div>
        </div>
        <button
          className="btn red"
          onClick={() => dispatch({ type: 'leaveShop' })}
          data-testid="btn-leave-shop"
        >
          To month {run.month} →
        </button>
      </div>

      {shrineOpen && (
        <ShrinePicker
          run={run}
          onPick={(card) => {
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
      {showTip && <GuideBubble tip="shop" onDismiss={() => markTip('shop')} bottom={90} />}
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
          {enh ? enhancementDef(enh).text : ''} The deck is shared, so the spirit may capture it
          too.
        </div>
        <div className="sheet-body scroll">
          {MONTHS.map((m) => (
            <div key={m.month} className="shrine-month">
              <div className="shrine-month-name">
                {m.month} · {m.flower}
              </div>
              <div className="shrine-cards">
                {CARDS.filter((c) => c.month === m.month && run.deck.includes(c.id)).map((c) => {
                  const cur = run.enhancements[String(c.id)];
                  return (
                    <button
                      key={c.id}
                      className="shrine-card"
                      onClick={() => onPick(c.id)}
                      data-testid={`shrine-card-${c.id}`}
                    >
                      <img src={cardFaceUrl(c.id)} alt={c.name} />
                      {cur && <span className={`enh enh-${cur}`}>{enhancementDef(cur).kanji}</span>}
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
