import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/ui/App';
import { preloadCards } from '@/ui/art/images';
import '@/ui/styles/global.css';
import '@/ui/styles/game.css';
import '@/ui/styles/hud.css';
import '@/ui/styles/screens.css';

void preloadCards();

if (import.meta.env.PROD && !navigator.webdriver) {
  registerSW({ immediate: true });
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
