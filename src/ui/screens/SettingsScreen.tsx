import { SettingsList } from '@/ui/game/Sheets';
import { Viewport } from '@/ui/game/Viewport';
import { resetProgress, setState } from '@/ui/state/store';

export function SettingsScreen() {
  return (
    <Viewport season="winter">
      {(h) => (
        <div className="settings-screen screen-pad" style={{ height: h }} data-testid="settings">
          <div className="setup-head">
            <button
              className="icon-btn"
              onClick={() => setState({ screen: 'title' })}
              aria-label="Back"
            >
              ←
            </button>
            <div className="display setup-title">Settings</div>
          </div>
          <div className="paper settings-panel">
            <SettingsList />
          </div>
          <div className="about paper">
            <p>
              <b>Twelve Petals</b> is a roguelike built on Koi-Koi, the classic game played with
              hanafuda, the Japanese flower cards. All art is original, drawn after the traditional
              motifs, and every sound is synthesised in your browser.
            </p>
            <p>Add it to your home screen to play offline.</p>
          </div>
          <button
            className="btn ghost wide danger-text"
            onClick={() => {
              if (window.confirm('Erase all progress, unlocks and the current year?'))
                resetProgress();
            }}
          >
            Reset all progress
          </button>
        </div>
      )}
    </Viewport>
  );
}
