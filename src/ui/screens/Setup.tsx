import { useState } from 'react';
import { DECKS, type DeckId, OMENS } from '@/content/decks';
import { omamoriDef } from '@/content/omamori';
import { newRun } from '@/engine/run';
import { cardBackUrl } from '@/ui/art/images';
import * as sfx from '@/ui/audio/audio';
import { setState, updateProfile, useStore } from '@/ui/state/store';
import { Viewport } from '@/ui/game/Viewport';

export function Setup() {
  const profile = useStore((s) => s.profile);
  const [deck, setDeck] = useState<DeckId>('pine');
  const maxOmen = Math.min(OMENS.length - 1, profile.maxOmenWon + 1);
  const [omen, setOmen] = useState(0);
  const [guided, setGuided] = useState(!profile.guidedDone);
  const begin = () => {
    sfx.unlockAudio();
    const seed = (Math.floor(Math.random() * 2 ** 31) ^ Date.now()) >>> 0;
    const { state } = newRun({ seed, deckId: deck, omen, guided });
    updateProfile((p) => ({ ...p, runsStarted: p.runsStarted + 1 }));
    setState({ run: state, screen: 'game' });
  };
  return (
    <Viewport season="spring">
      {(h) => (
        <div className="setup screen-pad" style={{ height: h }} data-testid="setup">
          <div className="setup-head">
            <button
              className="icon-btn"
              onClick={() => setState({ screen: 'title' })}
              aria-label="Back"
            >
              ←
            </button>
            <div className="display setup-title">A new year</div>
          </div>
          <div className="setup-label">Deck</div>
          <div className="decks scroll">
            {DECKS.map((d) => {
              const locked = !profile.unlockedDecks.includes(d.id);
              return (
                <button
                  key={d.id}
                  className={`deck ${deck === d.id ? 'on' : ''} ${locked ? 'locked' : ''}`}
                  disabled={locked}
                  onClick={() => setDeck(d.id)}
                  data-testid={`deck-${d.id}`}
                >
                  <img src={cardBackUrl(d.hue)} alt="" />
                  <span className="deck-kanji display">{d.kanji}</span>
                  <span className="deck-text">
                    <b>{d.name}</b>
                    <small>{locked ? `Locked. ${d.unlockText}` : d.text}</small>
                    {!locked && d.start.omamori && (
                      <small className="deck-start">
                        Starts with {d.start.omamori.map((id) => omamoriDef(id).name).join(', ')}
                      </small>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="setup-label">Omen</div>
          <div className="omens">
            {OMENS.map((o) => (
              <button
                key={o.level}
                className={`omen ${omen === o.level ? 'on' : ''}`}
                disabled={o.level > maxOmen}
                onClick={() => setOmen(o.level)}
                data-testid={`omen-${o.level}`}
              >
                <span className="display">{o.kanji}</span>
                <small>{o.name}</small>
              </button>
            ))}
          </div>
          <div className="omen-text">
            {OMENS[omen]?.text}
            {omen > 0 ? ' And every omen before it.' : ''}
          </div>
          <label className="setting guided">
            <span>
              Guided first months
              <small>
                Months 1–3 teach the game step by step, with the Rain Man as your guide.
              </small>
            </span>
            <input
              type="checkbox"
              checked={guided}
              onChange={(e) => setGuided(e.target.checked)}
              data-testid="toggle-guided"
            />
          </label>
          <button className="btn red wide begin" onClick={begin} data-testid="btn-begin-year">
            Begin the year
          </button>
        </div>
      )}
    </Viewport>
  );
}
