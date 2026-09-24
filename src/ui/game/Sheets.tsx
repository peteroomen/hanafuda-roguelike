import { seasonOf } from '@/content/cards';
import { ofudaDef, type OfudaId } from '@/content/ofuda';
import { omamoriDef } from '@/content/omamori';
import { spiritDef } from '@/content/spirits';
import { yakuDef } from '@/content/yaku';
import type { FightState, RunState } from '@/engine/run';
import { type OmamoriInstance, omamoriText } from '@/engine/scoring';
import { spiritUrl } from '@/ui/art/images';
import { OfudaIcon, OmamoriIcon } from '@/ui/art/Icons';
import { updateSettings, useStore } from '@/ui/state/store';

const RARITY: Record<string, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare' };

export function CharmSheet(props: {
  inst: OmamoriInstance;
  slot: number;
  count: number;
  onMove?: (from: number, to: number) => void;
  onSell?: () => void;
  sellPrice?: number;
  onClose: () => void;
}) {
  const d = omamoriDef(props.inst.id);
  return (
    <div className="sheet-scrim fade-in" onClick={props.onClose} data-testid="charm-sheet">
      <div className="sheet paper pop-in item-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="item-top">
          <OmamoriIcon id={d.id} size={64} />
          <div>
            <div className="item-name display">{d.name}</div>
            <div className="item-sub">
              {d.kanji} · {RARITY[d.rarity]} charm · {d.archetype}
            </div>
          </div>
        </div>
        <div className="item-text">{omamoriText(props.inst)}</div>
        <div className="item-actions">
          {props.onMove && (
            <>
              <button
                className="btn ghost small"
                disabled={props.slot === 0}
                onClick={() => props.onMove?.(props.slot, props.slot - 1)}
              >
                ← Move
              </button>
              <button
                className="btn ghost small"
                disabled={props.slot >= props.count - 1}
                onClick={() => props.onMove?.(props.slot, props.slot + 1)}
              >
                Move →
              </button>
            </>
          )}
          {props.onSell && (
            <button className="btn small" onClick={props.onSell} data-testid="btn-sell">
              Sell for {props.sellPrice} mon
            </button>
          )}
          <button className="btn small" onClick={props.onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfudaSheet(props: {
  id: OfudaId;
  usable: boolean;
  reason?: string;
  onUse: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const d = ofudaDef(props.id);
  return (
    <div className="sheet-scrim fade-in" onClick={props.onClose} data-testid="ofuda-sheet">
      <div className="sheet paper pop-in item-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="item-top">
          <OfudaIcon id={d.id} size={40} />
          <div>
            <div className="item-name display">{d.name}</div>
            <div className="item-sub">{d.kanji} · talisman · used once</div>
          </div>
        </div>
        <div className="item-text">{d.text}</div>
        {!props.usable && props.reason && <div className="item-note">{props.reason}</div>}
        <div className="item-actions">
          <button
            className="btn red"
            disabled={!props.usable}
            onClick={props.onUse}
            data-testid="btn-use-ofuda"
          >
            Use
          </button>
          <button className="btn ghost small" onClick={props.onDiscard}>
            Discard
          </button>
          <button className="btn small" onClick={props.onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function SpiritSheet({
  run,
  fight,
  onClose,
}: {
  run: RunState;
  fight: FightState;
  onClose: () => void;
}) {
  const s = spiritDef(fight.spiritId);
  return (
    <div className="sheet-scrim fade-in" onClick={onClose}>
      <div className="sheet paper pop-in item-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="item-top">
          <img
            className="sheet-face"
            src={spiritUrl(s.id, seasonOf(run.month), s.boss, 'full')}
            alt=""
          />
          <div>
            <div className="item-name display">
              {s.name} <span className="kanji">{s.kanji}</span>
            </div>
            <div className="item-sub">{s.epithet}</div>
          </div>
        </div>
        <div className="item-text">{s.lore}</div>
        {s.rule && (
          <div className="item-rule">
            <b>{s.rule.title}.</b> {s.rule.text}
          </div>
        )}
        {s.passive && <div className="item-rule">{s.passive.text}</div>}
        <div className="item-text small">
          Its hit is its yaku points × <b>{fight.ferocity}</b> (it grows fiercer each hand). If you
          have called koi-koi, the hit is doubled.
          {fight.intent && !s.passive?.hiddenIntent && (
            <>
              {' '}
              It is chasing <b>{yakuDef(fight.intent.id).name}</b>.
            </>
          )}
        </div>
        <div className="item-actions">
          <button className="btn small" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function MenuSheet(props: {
  onResume: () => void;
  onBook: () => void;
  onAbandon: () => void;
  onTitle: () => void;
}) {
  const settings = useStore((s) => s.settings);
  return (
    <div className="sheet-scrim fade-in" onClick={props.onResume} data-testid="menu">
      <div className="sheet paper pop-in menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="item-name display">Paused</div>
        <SettingsList />
        <div className="menu-buttons">
          <button className="btn red wide" onClick={props.onResume}>
            Resume
          </button>
          <button className="btn wide" onClick={props.onBook}>
            Yaku book
          </button>
          <button className="btn ghost wide" onClick={props.onTitle}>
            Save and quit to title
          </button>
          <button className="btn ghost wide danger-text" onClick={props.onAbandon}>
            Abandon this year
          </button>
        </div>
        <div className="menu-foot">{settings.speed === 'instant' ? 'Animations: instant' : ''}</div>
      </div>
    </div>
  );
}

export function SettingsList() {
  const s = useStore((st) => st.settings);
  return (
    <div className="settings-list">
      <label className="setting">
        <span>
          Training wheels
          <small>Month number and flower name on every card</small>
        </span>
        <input
          type="checkbox"
          checked={s.trainingWheels}
          onChange={(e) => updateSettings({ trainingWheels: e.target.checked })}
        />
      </label>
      <label className="setting">
        <span>
          The Rain Man’s advice
          <small>Tips the first time something new happens</small>
        </span>
        <input
          type="checkbox"
          checked={s.guide}
          onChange={(e) => updateSettings({ guide: e.target.checked })}
        />
      </label>
      <label className="setting">
        <span>Sound effects</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.sfx}
          onChange={(e) => updateSettings({ sfx: Number(e.target.value) })}
        />
      </label>
      <label className="setting">
        <span>Music and ambience</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.music}
          onChange={(e) => updateSettings({ music: Number(e.target.value) })}
        />
      </label>
      <label className="setting">
        <span>Haptics</span>
        <input
          type="checkbox"
          checked={s.haptics}
          onChange={(e) => updateSettings({ haptics: e.target.checked })}
        />
      </label>
      <div className="setting">
        <span>Animation speed</span>
        <div className="seg">
          {(['normal', 'fast', 'instant'] as const).map((sp) => (
            <button
              key={sp}
              className={s.speed === sp ? 'on' : ''}
              onClick={() => updateSettings({ speed: sp })}
            >
              {sp}
            </button>
          ))}
        </div>
      </div>
      <label className="setting">
        <span>Reduce motion</span>
        <input
          type="checkbox"
          checked={s.reduceMotion}
          onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
        />
      </label>
    </div>
  );
}
