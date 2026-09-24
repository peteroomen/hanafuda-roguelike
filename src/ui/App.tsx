import { useEffect } from 'react';
import { setVolumes, stopMusic } from '@/ui/audio/audio';
import { GameScreen } from '@/ui/game/GameScreen';
import { Collection } from '@/ui/screens/Collection';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { Setup } from '@/ui/screens/Setup';
import { Title } from '@/ui/screens/Title';
import { setState, useStore } from '@/ui/state/store';

export function App() {
  const screen = useStore((s) => s.screen);
  const run = useStore((s) => s.run);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    setVolumes(settings.sfx, settings.music);
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
    const f = settings.speed === 'instant' ? 0 : settings.speed === 'fast' ? 0.5 : 1;
    document.documentElement.style.setProperty('--move-ms', `${Math.round(300 * f)}ms`);
  }, [settings]);

  useEffect(() => {
    if (screen === 'game' && !run) setState({ screen: 'title' });
    if (screen !== 'game') stopMusic();
  }, [screen, run]);

  switch (screen) {
    case 'game':
      return run ? <GameScreen key={run.seed} /> : null;
    case 'setup':
      return <Setup />;
    case 'collection':
      return <Collection />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <Title />;
  }
}
