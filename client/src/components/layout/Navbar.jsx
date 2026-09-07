import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCountry } from '../../context/CountryContext';
import useScrolled from '../../hooks/useScrolled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { PinIcon } from '../common/Icon';
import ThemeToggle from '../common/ThemeToggle';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

function Logo() {
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Link to="/" onClick={handleClick} className="group flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#12141C] to-slate-800 text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-signal/25">
        <span className="font-display font-bold text-sm tracking-tight text-white">W</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white" />
      </div>
      <span className="font-display text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-signal">
        Web_Sole<span className="text-signal">.</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { country, detecting } = useCountry();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-[0_4px_24px_rgba(18,20,28,0.06)] py-2.5'
          : 'bg-transparent py-4 border-b border-ink/5'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full glass-pill px-3 py-1.5 shadow-sm">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `relative px-3.5 py-1.5 text-sm font-medium transition-all duration-200 rounded-full ${
                  isActive
                    ? 'text-signal bg-signal-soft/80 shadow-xs font-semibold'
                    : 'text-muted-light hover:text-ink hover:bg-black/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Action button & Country pill */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          {!detecting && country && (
            <Link
              to="/pricing"
              title="Click to view pricing for your country"
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-light bg-black/5 hover:bg-black/10 hover:text-ink transition-colors"
            >
              <PinIcon className="h-3 w-3 text-signal" />
              <span>{country}</span>
            </Link>
          )}

          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className="relative inline-flex items-center justify-center rounded-xl bg-signal px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-signal-deep hover:shadow-md hover:shadow-signal/25 active:scale-95"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="relative inline-flex items-center justify-center rounded-xl bg-[#12141C] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95"
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xl glass-pill lg:hidden text-ink hover:bg-black/5 active:scale-95 transition-all"
        >
          <FontAwesomeIcon icon={open ? faXmark : faBars} className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="mx-4 mt-3 rounded-2xl glass-card border border-ink/10 p-4 shadow-xl lg:hidden animate-slide-down">
          <div className="flex items-center justify-between pb-3 mb-1 border-b border-ink/10">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-light">Theme</span>
            <ThemeToggle />
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-signal-soft text-signal font-semibold'
                      : 'text-ink/80 hover:bg-black/5 hover:text-ink'
                  }`
                }
              >
                <span>{l.label}</span>
                {l.to === '/pricing' && country && (
                  <span className="text-xs text-signal font-mono">{country}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 pt-3 border-t border-ink/10 flex flex-col gap-2">
            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="w-full rounded-xl bg-signal px-4 py-3 text-center text-sm font-medium text-white shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="rounded-xl border border-ink/15 px-4 py-2.5 text-center text-sm font-medium text-ink hover:bg-black/5"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-signal px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
