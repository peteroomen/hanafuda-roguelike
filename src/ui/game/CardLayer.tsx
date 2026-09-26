import { memo, type PointerEvent } from 'react';
import { ALL_CARDS, type CardId } from '@/content/cards';
import { useLand } from '@/ui/state/store';
import { shortFlower } from './labels';
import type { EnhancementId } from '@/engine/types';
import { enhancementDef } from '@/content/enhancements';
import { cardBackUrl, cardFaceUrl, disguiseUrl } from '@/ui/art/images';
import { CARD_H, CARD_W, type Placement } from './layout';
import type { Visual } from './visual';

export interface CardMarks {
  /** Field cards that match the lifted hand card. */
  readonly matches: ReadonlySet<CardId>;
  /** Cards the spirit is chasing. */
  readonly wanted: ReadonlySet<CardId>;
  /** Hand cards that can capture something right now. */
  readonly playable: ReadonlySet<CardId>;
  readonly enhancements: Readonly<Record<string, EnhancementId>>;
  /** Month number and flower name on every card (full training wheels). */
  readonly monthLabels: boolean;
  readonly deckHue: number;
}

interface CardProps {
  readonly id: CardId;
  readonly p: Placement;
  readonly slamKey: number | undefined;
  readonly frozen: boolean;
  readonly disguisedAs: number | undefined;
  readonly option: boolean;
  readonly match: boolean;
  readonly wanted: boolean;
  readonly playable: boolean;
  readonly enhancement: EnhancementId | undefined;
  readonly monthLabels: boolean;
  readonly mini: boolean;
  readonly delay: number;
  readonly backUrl: string;
  /** Computed by the layer so a card-style change redraws memoised cards. */
  readonly faceUrl: string;
  readonly onPress: ((id: CardId, e: PointerEvent) => void) | undefined;
}

const Card = memo(function Card(props: CardProps) {
  const { id, p } = props;
  const c = ALL_CARDS[id];
  if (!c) return null;
  const w = CARD_W * p.scale;
  const h = CARD_H * p.scale;
  const shownMonth = props.disguisedAs ?? c.month;
  const face = props.faceUrl;
  const transform = `translate(${p.x + w / 2}px, ${p.y + h / 2}px) rotate(${p.rot}deg) translate(${-w / 2}px, ${-h / 2}px) scale(${p.scale})`;
  const cls = [
    'card',
    p.faceUp ? '' : 'down',
    props.option ? 'option' : '',
    props.match ? 'match' : '',
    props.frozen ? 'frozen' : '',
    props.disguisedAs !== undefined ? 'disguised' : '',
    props.mini ? 'mini' : '',
    props.onPress && p.interactive ? 'tappable' : '',
    p.stacked ? 'stacked' : '',
    p.dragging ? 'dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      data-card={id}
      data-testid={`card-${id}`}
      style={{
        transform,
        zIndex: p.z,
        transitionDelay: props.delay ? `${props.delay}ms` : undefined,
      }}
      onPointerDown={
        props.onPress && p.interactive ? (e: PointerEvent) => props.onPress?.(id, e) : undefined
      }
    >
      <div
        className="card-body"
        key={props.slamKey ?? 0}
        data-slam={props.slamKey !== undefined ? 'y' : undefined}
      >
        <div className="card-flip">
          <img className="face" src={face} alt={`${c.name}, month ${c.month}`} draggable={false} />
          <img className="back" src={props.backUrl} alt="" draggable={false} />
        </div>
        {p.faceUp && !props.mini && (
          <>
            {props.monthLabels && (
              <div className="tw">
                <span className="tw-n">{shownMonth}</span>
                <span className="tw-name">{shortFlower(shownMonth, c.land)}</span>
              </div>
            )}
            {props.enhancement && (
              <div
                className={`enh enh-${props.enhancement}`}
                title={enhancementDef(props.enhancement).name}
              >
                {enhancementDef(props.enhancement).kanji}
              </div>
            )}
            {props.wanted && <div className="want" aria-label="the spirit wants this" />}
            {props.playable && <div className="playable" />}
          </>
        )}
        {props.frozen && <div className="frost" />}
        {props.enhancement && p.faceUp && (
          <div className={`enh-glow enh-glow-${props.enhancement}`} />
        )}
      </div>
    </div>
  );
});

export interface CardLayerProps {
  readonly visual: Visual;
  readonly placements: ReadonlyMap<CardId, Placement>;
  readonly marks: CardMarks;
  readonly delays?: ReadonlyMap<CardId, number>;
  /** Pointer down on an interactive card. */
  readonly onPress?: (id: CardId, e: PointerEvent) => void;
}

export function CardLayer({ visual, placements, marks, delays, onPress }: CardLayerProps) {
  const land = useLand();
  const back = cardBackUrl(marks.deckHue, land);
  const cards: CardId[] = [];
  for (const id of placements.keys()) cards.push(id);
  cards.sort((a, b) => a - b);
  return (
    <div className="card-layer">
      {cards.map((id) => {
        const p = placements.get(id) as Placement;
        const zone = visual.zone[id];
        const mini = p.scale < 0.5;
        const disguise = visual.disguised[String(id)];
        return (
          <Card
            key={id}
            id={id}
            p={p}
            slamKey={visual.slams[id]}
            frozen={visual.frozen.includes(id)}
            disguisedAs={zone?.z === 'field' ? disguise : undefined}
            faceUrl={
              zone?.z === 'field' && disguise !== undefined
                ? disguiseUrl(disguise as 1, land)
                : cardFaceUrl(id)
            }
            option={visual.options.includes(id)}
            match={marks.matches.has(id)}
            wanted={zone?.z === 'field' && marks.wanted.has(id)}
            playable={zone?.z === 'hand' && marks.playable.has(id)}
            enhancement={marks.enhancements[String(id)]}
            monthLabels={marks.monthLabels}
            mini={mini}
            delay={delays?.get(id) ?? 0}
            backUrl={back}
            onPress={onPress}
          />
        );
      })}
    </div>
  );
}
