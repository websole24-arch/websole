import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

// variant="onDark" is for placement inside a panel that's *literally*
// always dark regardless of the site theme (e.g. the admin sidebar,
// AdminLogin) — the default variant uses the ink/paper tokens, which
// would render invisible dark-on-dark text there in light mode, since
// those panels don't flip with the toggle.
export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const variantClass = variant === 'onDark'
    ? 'border-white/15 text-white hover:border-white/30 hover:bg-white/10'
    : 'border-ink/10 text-ink hover:border-ink/20 hover:bg-ink/5';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${variantClass} ${className}`}
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="h-4.5 w-4.5" aria-hidden="true" />
    </button>
  );
}
