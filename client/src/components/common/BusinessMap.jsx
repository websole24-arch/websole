import { ArrowRightIcon } from './Icon';

export default function BusinessMap({ className = '' }) {
  const address = import.meta.env.VITE_BUSINESS_ADDRESS || '';
  const mapQuery = import.meta.env.VITE_BUSINESS_MAP_QUERY || address;

  if (!mapQuery) {
    return (
      <div className={`grid place-items-center rounded-3xl border border-dashed border-ink/20 glass-card p-10 text-center text-xs text-muted-light ${className}`}>
        Location details coming soon.
      </div>
    );
  }

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className={`overflow-hidden rounded-3xl glass-card border border-ink/10 shadow-xs ${className}`}>
      <iframe
        title="Business location"
        src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
        className="h-72 w-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 bg-white/80 dark:bg-white/5 px-4 py-3 text-center text-xs font-semibold text-signal hover:bg-signal hover:text-white transition-colors"
      >
        <span>Get Google Maps Directions</span>
        <ArrowRightIcon className="h-3 w-3" />
      </a>
    </div>
  );
}
