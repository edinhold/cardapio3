import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR / WebSocket errors in the sandboxed preview environment
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason || '');
  if (
    message.includes('WebSocket') ||
    message.includes('vite') ||
    message.includes('fechado sem ter sido aberto') ||
    message.includes('closed before it was established')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

// Also suppress error events for the same reason
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('WebSocket') ||
    event.message?.includes('vite') ||
    event.message?.includes('fechado sem ter sido aberto')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
