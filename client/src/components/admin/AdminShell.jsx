import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminIcon from './AdminIcon';
import ThemeToggle from '../common/ThemeToggle';

// Chrome for the /admin dashboard — sidebar nav on desktop, a slide-in
// drawer on mobile. Rendered instead of the public Navbar/Footer (see
// Layout.jsx), so the dashboard doesn't share nav with the marketing site.
// `tabs` is [{ id, label, icon }], `active`/`onChange` drive selection —
// AdminDashboard owns the actual tab state.
export default function AdminShell({ tabs, active, onChange, children, badges = {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const select = (id) => {
    onChange(id);
    setDrawerOpen(false);
  };

  const NavList = () => (
    <nav className="space-y-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => select(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
            active === t.id
              ? 'bg-signal font-medium text-white'
              : 'text-muted-dark hover:bg-white/5 hover:text-white'
          }`}
        >
          <AdminIcon name={t.icon} className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t.label}</span>
          {badges[t.id] > 0 && (
            <span
              className={`grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-full px-1 text-[11px] font-semibold text-white ${
                active === t.id ? 'bg-white/25' : 'bg-signal'
              }`}
            >
              {badges[t.id]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );

  const Brand = ({ size = 'md' }) => (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-lg bg-signal font-semibold text-white ${
          size === 'md' ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs'
        }`}
      >
        A
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">Admin</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#12141C] text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavList />
        </div>
        <div className="border-t border-white/10 p-3">
          {user?.name && <p className="truncate px-3 pb-2 text-xs text-muted-dark">{user.name}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium transition-colors hover:border-white/30"
            >
              <AdminIcon name="logout" className="h-4 w-4" />
              Log out
            </button>
            <ThemeToggle variant="onDark" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-white/10 bg-[#12141C] px-4 py-4 text-white lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 hover:bg-white/10"
            >
              <AdminIcon name="menu" className="h-5 w-5" />
            </button>
            <Brand size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="onDark" />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium transition-colors hover:border-white/30"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-[#12141C] p-4 text-white shadow-xl">
              <div className="flex items-center justify-between px-1 pb-4">
                <Brand />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-1.5 hover:bg-white/10"
                >
                  <AdminIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <NavList />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
