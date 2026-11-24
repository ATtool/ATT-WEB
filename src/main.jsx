import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import { BASE, currentPath } from './lib/paths.js';

const initialData = window.__DATA__ || {};
const path = currentPath();
const ssrPath = window.__PATH__ || null;
const rootElement = document.getElementById('root');
const app = <App initialPath={path} initialData={initialData} />;

if (ssrPath && ssrPath === path && rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  rootElement.innerHTML = '';
  createRoot(rootElement).render(app);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${BASE}sw.js`, { scope: BASE })
      .then((registration) => {
        const askForLibrary = () => registration.active?.postMessage({ type: 'CACHE_LIBRARY' });
        if ('requestIdleCallback' in window) window.requestIdleCallback(askForLibrary, { timeout: 8000 });
        else setTimeout(askForLibrary, 3000);
      })
      .catch((error) => console.warn('[sw] registration failed', error));
  });
}
