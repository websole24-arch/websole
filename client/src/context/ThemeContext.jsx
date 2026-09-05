import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through
    // to the OS preference below.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Applies the `dark` class to <html> that tailwind.config.js's
// darkMode: 'class' and index.css's `html.dark` rules key off of — kept
// as a standalone function (not just inside the effect) so it can also
// run once, synchronously, before React even mounts (see main.jsx) —
// otherwise the page would flash light-then-dark on every reload for
// someone who has dark mode saved.
export function applyThemeClass(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Non-fatal — theme just won't persist across visits this session.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
