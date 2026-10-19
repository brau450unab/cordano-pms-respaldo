import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro de Service Worker para resiliencia Offline en Garita / Subterráneo con actualización inmediata
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Forzar chequeo de actualización contra el servidor
        reg.update();
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Nueva versión detectada, recargando para aplicar cambios.');
                window.location.reload();
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('[SW] Error registrando Service Worker:', err);
      });
  });
}

