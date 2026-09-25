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
              hanafuda, the Japanese flower cards. Every sound is synthesised in your browser.
            </p>
            <p>Add it to your home screen to play offline.</p>
          </div>
          <div className="about paper credits" data-testid="credits">
            <p>
              <b>Credits</b>
            </p>
            <p>
              Traditional card faces: the traditional-colour hanafuda set on{' '}
              <a
                href="https://commons.wikimedia.org/wiki/Category:SVG_Hanafuda_with_traditional_colors_(black_border)"
                target="_blank"
                rel="noreferrer"
              >
                Wikimedia Commons
              </a>
              , a recolouring of the hanafuda SVGs by Louiemantia. Licensed under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>
              . Resized and converted to WebP for the game; the modified images are shared under the
              same licence.
            </p>
            <p>The drawn card style, spirit portraits and sound are made for Twelve Petals.</p>
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
