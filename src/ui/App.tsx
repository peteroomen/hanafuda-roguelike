import { useEffect } from 'react';
import { preloadCards } from '@/ui/art/images';
import { setVolumes, stopMusic, unlockAudio, woodTock } from '@/ui/audio/audio';
import { GameScreen } from '@/ui/game/GameScreen';
import { Collection } from '@/ui/screens/Collection';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { Setup } from '@/ui/screens/Setup';
import { Title } from '@/ui/screens/Title';
import { setState, speedFactorOf, useStore } from '@/ui/state/store';

export function App() {
  const screen = useStore((s) => s.screen);
  const run = useStore((s) => s.run);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    setVolumes(settings.sfx, settings.music);
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
    const f = speedFactorOf(settings.speed);
    document.documentElement.style.setProperty('--move-ms', `${Math.round(300 * f)}ms`);
  }, [settings]);

  // Every button knocks like a small wooden block. One listener, so they all sound the same.
  // Buttons with their own sound opt out with data-quiet.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const b = (e.target as HTMLElement | null)?.closest('button');
      if (!b || b.disabled || b.hasAttribute('data-quiet')) return;
      unlockAudio();
      woodTock();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // Decode the chosen card faces up front so nothing flashes in during play.
  useEffect(() => {
    void preloadCards();
  }, [settings.cardStyle]);

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
