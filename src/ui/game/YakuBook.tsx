import { useState } from 'react';
import { CARDS, type CardId, MONTHS, cardWithTag } from '@/content/cards';
import { DEFAULT_RULES } from '@/content/rules';
import { YAKU, type YakuId } from '@/content/yaku';
import { cardFaceUrl } from '@/ui/art/images';

const EXAMPLES: Record<YakuId, CardId[]> = {
  goko: ['crane', 'curtain', 'moon', 'rainMan', 'phoenix'].map((t) => cardWithTag(t as never)),
  shiko: ['crane', 'curtain', 'moon', 'phoenix'].map((t) => cardWithTag(t as never)),
  ameShiko: ['crane', 'curtain', 'moon', 'rainMan'].map((t) => cardWithTag(t as never)),
  sanko: ['crane', 'curtain', 'phoenix'].map((t) => cardWithTag(t as never)),
  tsukimi: ['moon', 'sakeCup'].map((t) => cardWithTag(t as never)),
  hanami: ['curtain', 'sakeCup'].map((t) => cardWithTag(t as never)),
  inoshikacho: ['boar', 'deer', 'butterflies'].map((t) => cardWithTag(t as never)),
  akaao: CARDS.filter((c) => c.tags.includes('redPoetry') || c.tags.includes('blueRibbon')).map(
    (c) => c.id,
  ),
  akatan: CARDS.filter((c) => c.tags.includes('redPoetry')).map((c) => c.id),
  aotan: CARDS.filter((c) => c.tags.includes('blueRibbon')).map((c) => c.id),
  tane: CARDS.filter((c) => c.type === 'animal')
    .slice(0, 5)
    .map((c) => c.id),
  tan: CARDS.filter((c) => c.type === 'ribbon')
    .slice(3, 8)
    .map((c) => c.id),
  kasu: CARDS.filter((c) => c.type === 'chaff')
    .slice(0, 10)
    .map((c) => c.id),
  tsukifuda: CARDS.filter((c) => c.month === 3).map((c) => c.id),
};

export function YakuList({ poems }: { poems?: Partial<Record<YakuId, number>> }) {
  return (
    <div className="yaku-list">
      {YAKU.map((y) => {
        const lv = poems?.[y.id] ?? 0;
        return (
          <div key={y.id} className="yaku-entry">
            <div className="yaku-head">
              <span className="yaku-kanji display">{y.kanji}</span>
              <span className="yaku-name">
                <b>{y.name}</b> <small>{y.gloss}</small>
              </span>
              <span className="yaku-pts">
                {y.points}
                <small>pts</small>
              </span>
            </div>
            <div className="yaku-req">
              {y.requirement}
              {y.id === 'tsukifuda' ? ' (uses the fight’s month)' : ''}
              {lv > 0 && (
                <span className="yaku-lv">
                  {' '}
                  · Poem Lv {lv}: +{lv * y.poem.chips} chips, +{lv * y.poem.mult} mult
                </span>
              )}
            </div>
            <div className="yaku-cards">
              {(EXAMPLES[y.id] ?? []).map((c) => (
                <img key={c} src={cardFaceUrl(c)} alt="" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CardGallery() {
  return (
    <div className="gallery">
      {MONTHS.map((m) => (
        <div key={m.month} className="gallery-month">
          <div className="gallery-head">
            <span className="display">{m.month}</span> {m.flower}{' '}
            <small>
              {m.flowerJp} {m.kanji}
            </small>
          </div>
          <div className="gallery-cards">
            {CARDS.filter((c) => c.month === m.month).map((c) => (
              <figure key={c.id}>
                <img src={cardFaceUrl(c.id)} alt={c.name} />
                <figcaption>
                  {c.type === 'chaff' ? 'Chaff' : c.name}
                  <small> · {DEFAULT_RULES.chips[c.type]} chips</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Rules() {
  return (
    <div className="rules">
      <p>
        <b>Matching.</b> Play a card from your hand. If a field card shares its flower (its month),
        you capture both. With two matches you choose one; with three, you sweep all four. Then the
        top card of the deck is flipped and matched the same way.
      </p>
      <p>
        <b>Yaku.</b> Captured cards form yaku (see the list). Brights are worth 20 Chips, Animals
        10, Ribbons 5, Chaff 1.
      </p>
      <p>
        <b>Stop or koi-koi.</b> When you form or improve a yaku you choose: <em>stop</em> and deal
        damage now, or call <em>koi-koi</em> to keep playing. Each koi-koi doubles your next stop,
        but if the spirit scores first its hit is doubled.
      </p>
      <p>
        <b>Damage.</b> Chips (from the yaku’s cards) × Mult (from the yaku’s points). Seven or more
        points doubles the Mult, and so does stopping after the spirit called koi-koi. Charms add
        more.
      </p>
      <p>
        <b>The spirit.</b> It hits for its yaku points × its ferocity. The eye marks the cards it is
        chasing.
      </p>
    </div>
  );
}

export function YakuBook({
  onClose,
  poems,
}: {
  onClose: () => void;
  poems?: Partial<Record<YakuId, number>>;
}) {
  const [tab, setTab] = useState<'yaku' | 'cards' | 'rules'>('yaku');
  return (
    <div className="sheet-scrim fade-in" onClick={onClose} data-testid="yaku-book">
      <div className="sheet paper tall pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="tabs">
            <button className={tab === 'yaku' ? 'on' : ''} onClick={() => setTab('yaku')}>
              Yaku
            </button>
            <button className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>
              Cards
            </button>
            <button className={tab === 'rules' ? 'on' : ''} onClick={() => setTab('rules')}>
              Rules
            </button>
          </div>
          <button className="close" onClick={onClose} aria-label="Close" data-testid="close-sheet">
            ×
          </button>
        </div>
        <div className="sheet-body scroll">
          {tab === 'yaku' && <YakuList {...(poems ? { poems } : {})} />}
          {tab === 'cards' && <CardGallery />}
          {tab === 'rules' && <Rules />}
        </div>
      </div>
    </div>
  );
}
