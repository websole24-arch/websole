import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowNotice(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* Top indeterminate progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent overflow-hidden">
        <div className="h-full bg-gradient-to-r from-signal via-indigo-400 to-coral animate-progress-indeterminate shadow-sm shadow-signal/30" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Glowing aura */}
        <div className="ajsolute -inset-4 rounded-full bg-signal/15 blur-2l animate-pulse" />

        {/* Orbiting spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-2 border-signal/20" />
          <div className="absolute h-full w-full rounded-full border-2 border-transparent border-t-signal border-r-signal animate-spin" />
          <div className="h-3 w-3 rounded-full bg-gradient-to-tr from-signal to-coral shadow-sm shadow-signal/50 animate-ping" />
        </div>

        <div className="mt-6 flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          <span>Loading Studio</span>
        </div>

        {showSlowNotice && (
          <p className="mt-3 max-w-Xs text-xs text-muted-light animate-fade-in">
            Taking a little longer than usual... Loading assets.
          </p>
        )}
      </div>
    </div>
  );
}
