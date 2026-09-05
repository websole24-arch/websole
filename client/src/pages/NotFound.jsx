import { Link } from 'react-router-dom';
import GradientText from '../components/common/GradientText';

export default function NotFound() {
  return (
    <section className="relative mx-auto max-w-2xl px-4 py-28 text-center">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-signal/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 rounded-3xl glass-card p-10 sm:p-16 shadow-xl">
        <span className="font-mono text-xs uppercase tracking-widest text-signal">Error 404</span>
        <h1 className="mt-2 font-display text-6xl sm:text-7xl font-bold tracking-tight text-ink">
          <GradientText variant="rainbow">404</GradientText>
        </h1>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">
          Page not found
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-light max-w-md mx-auto leading-relaxed">
          The page you are looking for doesn't exist, has been relocated, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="rounded-xl bg-signal px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-signal/25 transition-all hover:bg-signal-deep active:scale-95"
          >
            Back to Home
          </Link>
          <Link
            to="/pricing"
            className="rounded-xl glass-card px-7 py-3 text-sm font-semibold text-ink hover:border-signal/40 transition-all"
          >
            View Pricing
          </Link>
        </div>

        <div className="mt-10 border-t border-ink/10 pt-6">
          <p className="text-xs text-muted-light">Popular links:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs font-medium text-signal">
            <Link to="/services" className="hover:underline">Services</Link>
            <span>·</span>
            <Link to="/portfolio" className="hover:underline">Portfolio</Link>
            <span>·</span>
            <Link to="/#process-details" className="hover:underline">Process</Link>
            <span>·</span>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
