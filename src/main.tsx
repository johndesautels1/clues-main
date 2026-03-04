import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          maxWidth: '400px',
          fontSize: '0.875rem',
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    />
    <App />
  </StrictMode>,
);
