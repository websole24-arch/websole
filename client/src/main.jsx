import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CountryProvider } from './context/CountryContext.jsx';
import { ThemeProvider, applyThemeClass } from './context/ThemeContext.jsx';
import './index.css';

// Applied synchronously, before the first paint, so a visitor who saved
// dark mode doesn't see a flash of the light theme on every page load —
// ThemeProvider's own effect (which runs after mount) would be too late
// for that first frame.
try {
  const stored = localStorage.getItem('theme');
  const initial = stored === 'dark' || stored === 'light'
    ? stored
    : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyThemeClass(initial);
} catch {
  // ignore — ThemeProvider's own effect will settle this shortly after
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CountryProvider>
            <App />
          </CountryProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
