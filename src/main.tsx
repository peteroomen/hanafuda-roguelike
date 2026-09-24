import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/ui/App';
import { loadPortraitArt } from '@/ui/art/portraitArt';
import '@/ui/styles/global.css';
import '@/ui/styles/game.css';
import '@/ui/styles/hud.css';
import '@/ui/styles/screens.css';

if (import.meta.env.PROD && !navigator.webdriver) {
  registerSW({ immediate: true });
}

function render() {
  const root = document.getElementById('root');
  if (!root) return;
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Wait briefly for the painted portraits so spirits don't swap art mid-game; never block for long.
void Promise.race([loadPortraitArt(), new Promise((r) => setTimeout(r, 1500))]).finally(render);
