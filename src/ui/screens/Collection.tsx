import { useState } from 'react';
import { seasonOf } from '@/content/cards';
import { OMAMORI } from '@/content/omamori';
import { SPIRITS } from '@/content/spirits';
import { OmamoriIcon } from '@/ui/art/Icons';
import { spiritUrl } from '@/ui/art/images';
import { CardGallery, Rules, YakuList } from '@/ui/game/YakuBook';
import { Viewport } from '@/ui/game/Viewport';
import { setState, useStore } from '@/ui/state/store';

type Tab = 'yaku' | 'cards' | 'charms' | 'spirits' | 'records' | 'rules';

const SEASON_MONTH = { spring: 1, summer: 4, autumn: 7, winter: 10 } as const;

export function Collection() {
  const [tab, setTab] = useState<Tab>('yaku');
  const profile = useStore((s) => s.profile);
  const tabs: [Tab, string][] = [
    ['yaku', 'Yaku'],
    ['cards', 'Cards'],
    ['charms', 'Charms'],
    ['spirits', 'Spirits'],
    ['records', 'Records'],
    ['rules', 'Rules'],
  ];
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
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
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
                  const seen = profile.seenCharms.includes(d.id);
                  return (
                    <div key={d.id} className={`charm-card ${seen ? '' : 'unseen'}`}>
                      <OmamoriIcon id={d.id} size={40} />
                      <div>
                        <b>{seen ? d.name : '???'}</b>
                        <small>
                          {seen
                            ? d.text.replace(/\s*\(now[^)]*\)/, '')
                            : `A ${d.rarity} charm not yet found`}
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
                    <span>biggest hit</span>
                  </div>
                  <div>
                    <b>{profile.koikoiCalls}</b>
                    <span>koi-koi called</span>
                  </div>
                  <div>
                    <b>{profile.maxOmenWon < 0 ? '—' : profile.maxOmenWon}</b>
                    <span>highest omen beaten</span>
                  </div>
                </div>
                <div className="history">
                  {profile.history
                    .slice()
                    .reverse()
                    .map((r, i) => (
                      <div key={i} className={`history-row ${r.won ? 'won' : ''}`}>
                        <span>{r.date}</span>
                        <span>{r.won ? 'Completed' : `Fell in month ${r.month}`}</span>
                        <span>
                          {r.deck} · omen {r.omen}
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
