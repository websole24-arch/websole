import AdminIcon from '../../components/admin/AdminIcon';

export const inputClass =
  'w-full rounded-lg border border-ink/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-muted-dark focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal';

export const btnPrimary =
  'rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhost =
  'rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50';

export const btnDanger =
  'rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50';

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-muted-light">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Shared title + subtitle + action row used at the top of each dashboard
// page (see AdminDashboard.jsx).
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-light">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-3xl glass-card border border-ink/10 p-6 sm:p-7 shadow-xs">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          {title && <h3 className="font-display text-lg font-bold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className={title || action ? 'mt-5' : ''}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl glass-card border border-ink/10 p-5 shadow-xs transition-all duration-200 hover:border-signal/30 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-2xl font-bold text-ink">{value}</p>
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-signal-soft text-signal">
            <AdminIcon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-1 text-xs font-medium text-muted-light">{label}</p>
    </div>
  );
}

export function Pill({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-ink/5 text-ink',
    signal: 'bg-signal-soft text-signal',
    jade: 'bg-jade/10 text-jade',
    brass: 'bg-brass/10 text-brass',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Rough grouping for the project workflow's 12 statuses — early / active /
// done — just for at-a-glance colour, not a business-logic distinction.
export function projectStatusTone(status) {
  if (['Completed', 'Payment Confirmed'].includes(status)) return 'jade';
  if (['Inquiry', 'Awaiting Payment', 'Final Payment'].includes(status)) return 'brass';
  if (status === 'Closed') return 'neutral';
  return 'signal';
}

// `onRetry` is optional — pass the tab's `load` function to add a retry
// button for a failed fetch. Mutation errors (save/delete) generally don't
// pass one, since resubmitting the form is the actual retry there.
export function ErrorNote({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      <span className="flex items-center gap-2">
        <AdminIcon name="alert" className="h-4 w-4 shrink-0" strokeWidth={2} />
        {children}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:border-red-400"
        >
          <AdminIcon name="retry" className="h-3.5 w-3.5" strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center text-sm text-muted-light">
      {children}
    </div>
  );
}

// Generic pulsing block list — used as the loading state for card/list-style
// tabs. Kept as a named `Loading` export for backward compatibility with
// existing tabs.
export function Loading({ rows = 4 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border border-ink/10 bg-ink/[0.04]" />
      ))}
    </div>
  );
}

// Loading state for the Overview tab's stat-card grid.
export function SkeletonStats({ count = 7 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[74px] animate-pulse rounded-2xl border border-ink/10 bg-ink/[0.04]" />
      ))}
    </div>
  );
}

// Loading state for table-style tabs (Customers).
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg bg-ink/[0.04]" />
      ))}
    </div>
  );
}
