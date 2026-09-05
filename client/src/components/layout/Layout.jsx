import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgress from '../common/ScrollProgress';

export default function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // A client-side route change doesn't reset scroll position the way a
  // real page load does, so without this, navigating to any page (via a
  // Navbar link, a card, a button, anything) leaves the viewport at
  // whatever scrollY the *previous* page happened to be at — landing
  // the new page mid-content instead of at the top. Skipped when the
  // new URL carries a hash (e.g. Home's "#process-details" links) so an
  // in-page anchor jump gets to do its own scroll instead of being
  // immediately overridden by this one.
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (isAdminRoute) {
    return <div className="min-h-screen bg-paper font-sans text-ink">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans text-ink relative selection:bg-signal selection:text-white">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1 relative z-10 animate-fade-in">{children}</main>
      <Footer />
    </div>
  );
}
