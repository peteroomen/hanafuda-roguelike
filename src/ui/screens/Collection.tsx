import { useState } from 'react';
import { seasonOf } from '@/content/cards';
import { DECKS, deckDef, OMENS } from '@/content/decks';
import { OMAMORI } from '@/content/omamori';
import { SPIRITS } from '@/content/spirits';
import { CHARM_UNLOCKS } from '@/content/unlocks';
import { yakuDef, type YakuId } from '@/content/yaku';
import { OmamoriIcon } from '@/ui/art/Icons';
import { cardBackUrl, spiritUrl } from '@/ui/art/images';
import { CardGallery, Rules, YakuList } from '@/ui/game/YakuBook';
import { Viewport } from '@/ui/game/Viewport';
import { lockedCharms } from '@/ui/state/meta';
import { setState, useStore } from '@/ui/state/store';

type Tab = 'yaku' | 'cards' | 'charms' | 'spirits' | 'decks' | 'records' | 'rules';

const SEASON_MONTH = { spring: 1, summer: 4, autumn: 7, winter: 10 } as const;

export function Collection() {
  const [tab, setTab] = useState<Tab>('yaku');
  const profile = useStore((s) => s.profile);
  const tabs: [Tab, string][] = [
    ['yaku', 'Yaku'],
    ['cards', 'Cards'],
    ['charms', 'Charms'],
    ['spirits', 'Spirits'],
    ['decks', 'Decks'],
    ['records', 'Records'],
    ['rules', 'Rules'],
  ];
  const locked = lockedCharms(profile);
  const [topYaku, topYakuTimes] = Object.entries(profile.yakuScored).reduce<
    [string | null, number]
  >((best, [id, n]) => ((n ?? 0) > best[1] ? [id, n ?? 0] : best), [null, 0]);
  return (
    <Viewport season="autumn">
      {(h) => (
        <div className="collection screen-pad" style={{ height: h }} data-testid="collection">
          <div className="setup-head">
            <button
              className="icon-btn"
              onClick={() => setState({ screen: 'title' })}
              aria-label="Back"
            >
              ←
            </button>
            <div className="display setup-title">Collection</div>
          </div>
          <div className="tabs wrap">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? 'on' : ''}
                onClick={() => setTab(id)}
                data-testid={`tab-${id}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="paper collection-body scroll">
            {tab === 'yaku' && <YakuList />}
            {tab === 'cards' && <CardGallery />}
            {tab === 'rules' && <Rules />}
            {tab === 'charms' && (
              <div className="charm-grid">
                {OMAMORI.map((d) => {
                  const unlock = CHARM_UNLOCKS[d.id];
                  if (unlock && locked.includes(d.id))
                    return (
                      <div key={d.id} className="charm-card locked" data-testid="charm-locked">
                        <OmamoriIcon id={d.id} size={40} />
                        <div>
                          <b>Locked</b>
                          <small>{unlock.unlockText}</small>
                        </div>
                      </div>
                    );
                  const seen = profile.seenCharms.includes(d.id);
                  return (
                    <div key={d.id} className={`charm-card ${seen ? '' : 'unseen'}`}>
                      <OmamoriIcon id={d.id} size={40} />
                      <div>
                        <b>{seen ? d.name : '???'}</b>
                        <small>
                          {seen
                            ? d.text.replace(/\s*\(now[^)]*\)/, '')
                            : `${d.rarity === 'uncommon' ? 'An' : 'A'} ${d.rarity} charm not yet found`}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'spirits' && (
              <div className="spirit-grid">
                {SPIRITS.map((s) => {
                  const seen = profile.seenSpirits.includes(s.id);
                  const beaten = profile.defeatedSpirits.includes(s.id);
                  return (
                    <div key={s.id} className={`spirit-card ${seen ? '' : 'unseen'}`}>
                      <img
                        src={spiritUrl(s.id, seasonOf(SEASON_MONTH[s.season] as 1), s.boss)}
                        alt=""
                      />
                      <b>{seen ? s.name : '???'}</b>
                      <small>
                        {seen
                          ? s.rule
                            ? s.rule.title
                            : s.epithet
                          : s.boss
                            ? 'A great yokai'
                            : 'Unknown spirit'}
                        {beaten ? ' · calmed' : ''}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'decks' && (
              <div className="charm-grid">
                {DECKS.map((d) => {
                  const open = profile.unlockedDecks.includes(d.id);
                  const rec = profile.deckRecords[d.id];
                  const seal = rec && rec.bestOmen >= 0 ? OMENS[rec.bestOmen] : undefined;
                  return (
                    <div
                      key={d.id}
                      className={`charm-card deck-row ${open ? '' : 'locked'}`}
                      data-testid={`deck-record-${d.id}`}
                    >
                      <span className="deck-row-back">
                        <img src={cardBackUrl(d.hue)} alt="" />
                        <span className="display">{d.kanji}</span>
                      </span>
                      <div>
                        <b>{d.name}</b>
                        <small>{open ? d.text : `Locked. ${d.unlockText}`}</small>
                        {open && (
                          <small className="deck-row-record">
                            {rec
                              ? `${rec.runs} ${rec.runs === 1 ? 'year' : 'years'} played · ${rec.wins} completed`
                              : 'Not played yet'}
                          </small>
                        )}
                      </div>
                      {seal && (
                        <span
                          className="omen-seal display"
                          title={`Highest omen beaten: ${seal.name}`}
                          aria-label={`Highest omen beaten: ${seal.name}`}
                        >
                          {seal.kanji}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'records' && (
              <div className="records">
                <div className="record-grid">
                  <div>
                    <b>{profile.runsStarted}</b>
                    <span>years begun</span>
                  </div>
                  <div>
                    <b>{profile.runsWon}</b>
                    <span>years completed</span>
                  </div>
                  <div>
                    <b>{profile.bestMonth}</b>
                    <span>furthest month</span>
                  </div>
                  <div>
                    <b>{profile.biggestHit.toLocaleString('en-US')}</b>
                    <span>
                      biggest hit
                      {profile.biggestHitDeck
                        ? ` (${deckDef(profile.biggestHitDeck).name.replace(' Deck', '')})`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <b>{profile.koikoiCalls}</b>
                    <span>koi-koi called</span>
                  </div>
                  <div>
                    <b>{profile.maxOmenWon < 0 ? '—' : profile.maxOmenWon}</b>
                    <span>highest omen beaten</span>
                  </div>
                  <div>
                    <b>
                      {profile.defeatedSpirits.length}/{SPIRITS.length}
                    </b>
                    <span>spirits calmed</span>
                  </div>
                  <div>
                    <b>
                      {OMAMORI.length - locked.length}/{OMAMORI.length}
                    </b>
                    <span>charms unlocked</span>
                  </div>
                  <div>
                    <b>
                      {profile.unlockedDecks.length}/{DECKS.length}
                    </b>
                    <span>decks unlocked</span>
                  </div>
                </div>
                {topYaku && (
                  <div className="record-line">
                    Most scored: <b>{yakuDef(topYaku as YakuId).name}</b>, {topYakuTimes}{' '}
                    {topYakuTimes === 1 ? 'time' : 'times'}
                  </div>
                )}
                <div className="history">
                  {profile.history
                    .slice()
                    .reverse()
                    .map((r, i) => (
                      <div key={i} className={`history-row ${r.won ? 'won' : ''}`}>
                        <span>{r.date}</span>
                        <span>{r.won ? 'Completed' : `Fell in month ${r.month}`}</span>
                        <span>
                          {deckDef(r.deck).name.replace(' Deck', '')} · omen {r.omen}
                        </span>
                        <span>{r.hit.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  {profile.history.length === 0 && (
                    <div className="history-empty">No years played yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Viewport>
  );
}
