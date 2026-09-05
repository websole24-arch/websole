import { useState, useMemo } from 'react';
import { TrendUpIcon, RefreshIcon, MoneyIcon, ChartBarIcon } from '../../components/common/Icon';

// Color palette for charts matching design tokens
const COLORS = {
  signal: '#22C55E',
  signalSoft: '#DCFCE7',
  coral: '#3352FF',
  coralSoft: '#EBEEFF',
  jade: '#2F6F62',
  jadeSoft: '#E6F3F0',
  brass: '#B98A2E',
  purple: '#8B5CF6',
  slate: '#64748B',
  ink: '#12141C',
};

const STATUS_COLORS = {
  'Inquiry': '#64748B',
  'Awaiting Payment': '#B98A2E',
  'Payment Confirmed': '#2F6F62',
  'Project Started': '#22C55E',
  'Design': '#8B5CF6',
  'Development': '#0284C7',
  'Review': '#EC4899',
  'Revision': '#F59E0B',
  'Final Payment': '#B98A2E',
  'Final Delivery': '#10B981',
  'Completed': '#059669',
  'Closed': '#94A3B8',
};

/**
 * 1. Activity Trends Chart (SVG Area & Bar Chart)
 * Shows inquiries and projects over the last 6 months.
 */
export function ActivityTrendsChart({ projects = [], inquiries = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mode, setMode] = useState('combined'); // 'combined', 'projects', 'inquiries'

  // Generate monthly buckets for the last 6 months
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      months.push({ key: monthKey, label: monthLabel, projects: 0, inquiries: 0 });
    }

    // Populate from real project dates
    projects.forEach((p) => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const found = months.find((m) => m.key === key);
        if (found) found.projects += 1;
      }
    });

    // Populate from real inquiry dates
    inquiries.forEach((inq) => {
      if (inq.createdAt) {
        const d = new Date(inq.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const found = months.find((m) => m.key === key);
        if (found) found.inquiries += 1;
      }
    });

    // If both are mostly empty (e.g. early development stage), add baseline 1s for visual clarity
    const totalCount = months.reduce((acc, m) => acc + m.projects + m.inquiries, 0);
    if (totalCount === 0) {
      months[months.length - 1].inquiries = 1;
    }

    return months;
  }, [projects, inquiries]);

  const maxVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.projects, d.inquiries, d.projects + d.inquiries)),
    4
  );

  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const pointsProjects = monthlyData.map((d, i) => {
    const x = paddingX + (i / (monthlyData.length - 1)) * usableWidth;
    const y = chartHeight - paddingY - (d.projects / maxVal) * usableHeight;
    return { x, y, val: d.projects, label: d.label };
  });

  const pointsInquiries = monthlyData.map((d, i) => {
    const x = paddingX + (i / (monthlyData.length - 1)) * usableWidth;
    const y = chartHeight - paddingY - (d.inquiries / maxVal) * usableHeight;
    return { x, y, val: d.inquiries, label: d.label };
  });

  const makePath = (points) => {
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpX1 = prev.x + (p.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (p.x - prev.x) / 2;
      const cpY2 = p.y;
      return `${acc} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p.x},${p.y}`;
    }, '');
  };

  const projectPath = makePath(pointsProjects);
  const inquiryPath = makePath(pointsInquiries);
  const areaProjectPath = `${projectPath} L ${pointsProjects[pointsProjects.length - 1].x},${chartHeight - paddingY} L ${pointsProjects[0].x},${chartHeight - paddingY} Z`;
  const areaInquiryPath = `${inquiryPath} L ${pointsInquiries[pointsInquiries.length - 1].x},${chartHeight - paddingY} L ${pointsInquiries[0].x},${chartHeight - paddingY} Z`;

  return (
    <div className="rounded-3xl glass-card border border-ink/10 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 text-signal text-xs">
              <TrendUpIcon className="h-3.5 w-3.5" />
            </span>
            Activity Trends (Last 6 Months)
          </h3>
          <p className="text-xs text-muted-light mt-0.5">
            Client leads, consultations & project originations
          </p>
        </div>

        {/* Legend / Toggles */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-signal shadow-xs" />
            <span className="text-ink">Projects ({projects.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-coral shadow-xs" />
            <span className="text-ink">Inquiries ({inquiries.length})</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-6 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 overflow-visible"
        >
          <defs>
            <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.signal} stopOpacity="0.25" />
              <stop offset="100%" stopColor={COLORS.signal} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.coral} stopOpacity="0.2" />
              <stop offset="100%" stopColor={COLORS.coral} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + ratio * usableHeight;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={areaInquiryPath} fill="url(#coralGrad)" />
          <path d={areaProjectPath} fill="url(#signalGrad)" />

          {/* Line Strokes */}
          <path
            d={inquiryPath}
            fill="none"
            stroke={COLORS.coral}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={projectPath}
            fill="none"
            stroke={COLORS.signal}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {pointsInquiries.map((p, i) => (
            <circle
              key={`inq-${i}`}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 5 : 3.5}
              fill="#FFFFFF"
              stroke={COLORS.coral}
              strokeWidth="2.5"
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}

          {pointsProjects.map((p, i) => (
            <circle
              key={`proj-${i}`}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 5 : 3.5}
              fill="#FFFFFF"
              stroke={COLORS.signal}
              strokeWidth="2.5"
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}

          {/* X Axis Labels */}
          {monthlyData.map((d, i) => {
            const x = paddingX + (i / (monthlyData.length - 1)) * usableWidth;
            return (
              <text
                key={d.key}
                x={x}
                y={chartHeight - 4}
                textAnchor="middle"
                className="text-[11px] font-mono fill-slate-400 select-none"
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Interactive Tooltip */}
        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl glass-dark px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md"
            style={{
              left: `${(pointsProjects[hoverIndex].x / chartWidth) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-mono text-[10px] text-white/60 mb-1">
              {monthlyData[hoverIndex].label}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-signal font-semibold">
                ● {monthlyData[hoverIndex].projects} Projects
              </span>
              <span className="text-coral font-semibold">
                ● {monthlyData[hoverIndex].inquiries} Inquiries
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Status Donut & Progress Chart
 * Visual breakdown of projects across lifecycle stages.
 */
export function StatusDonutChart({ projects = [] }) {
  const counts = useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
  }, [projects]);

  const total = projects.length;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="rounded-3xl glass-card border border-ink/10 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-jade/10 text-jade text-xs">
                <RefreshIcon className="h-3.5 w-3.5" />
              </span>
              Project Status Distribution
            </h3>
            <p className="text-xs text-muted-light mt-0.5">
              Live lifecycle stage breakdown
            </p>
          </div>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-signal-soft text-signal">
            {total} Total
          </span>
        </div>

        {total === 0 ? (
          <div className="py-12 text-center text-sm text-muted-light">
            No projects registered yet.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-6">
            {/* Donut graphic */}
            <div className="relative mx-auto flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="16"
                />
                {entries.map(([status, count]) => {
                  const percent = count / total;
                  const strokeDasharray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedPercent * circumference;
                  accumulatedPercent += percent;
                  const color = STATUS_COLORS[status] || COLORS.signal;

                  return (
                    <circle
                      key={status}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-2xl font-bold text-ink">{total}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-light">
                  Projects
                </span>
              </div>
            </div>

            {/* Status bars list */}
            <div className="space-y-2.5">
              {entries.map(([status, count]) => {
                const percent = Math.round((count / total) * 100);
                const color = STATUS_COLORS[status] || COLORS.signal;

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-ink truncate max-w-[140px]">
                          {status}
                        </span>
                      </div>
                      <span className="font-mono text-muted-light">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Financial & Revenue Pipeline Chart
 * Visualizes total contract value, advance deposits collected, and pending milestones.
 */
export function FinancialPipelineCard({ projects = [] }) {
  const { totalPipeline, advanceCollected, remainingBalance, currency } = useMemo(() => {
    let total = 0;
    let advance = 0;
    let remaining = 0;
    let curr = 'USD';

    projects.forEach((p) => {
      if (p.currency) curr = p.currency;
      const amt = Number(p.totalAmount) || 0;
      const adv = Number(p.advanceAmount) || amt * 0.5;
      const rem = Number(p.remainingAmount) || amt * 0.5;

      total += amt;
      // If status past awaiting payment, advance is collected
      if (['Payment Confirmed', 'Project Started', 'Design', 'Development', 'Review', 'Revision', 'Final Payment', 'Final Delivery', 'Completed'].includes(p.status)) {
        advance += adv;
      }
      if (p.status === 'Completed') {
        remaining += rem;
      }
    });

    return {
      totalPipeline: total,
      advanceCollected: advance,
      remainingBalance: total - advance,
      currency: curr,
    };
  }, [projects]);

  const advancePercent = totalPipeline > 0 ? Math.round((advanceCollected / totalPipeline) * 100) : 50;

  return (
    <div className="rounded-3xl glass-card border border-ink/10 p-6 sm:p-7 shadow-xs">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 text-xs">
              <MoneyIcon className="h-3.5 w-3.5" />
            </span>
            Financial Pipeline
          </h3>
          <p className="text-xs text-muted-light mt-0.5">
            50% milestone collection overview
          </p>
        </div>
        <span className="font-mono text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
          Active Value
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 border border-ink/5 dark:border-white/10">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-light">
            Total Contract Value
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-ink">
            {currency} {totalPipeline.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-muted-light">Across {projects.length} projects</p>
        </div>

        <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-800">
            Advance Deposits Confirmed
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-600">
            {currency} {advanceCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">{advancePercent}% of pipeline collected</p>
        </div>

        <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber-800">
            Pending Balance at Handover
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-amber-600">
            {currency} {remainingBalance.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-amber-700">Due upon completion</p>
        </div>
      </div>

      {/* Progress visual bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs font-mono text-muted-light mb-1.5">
          <span>Deposit Progress</span>
          <span>{advancePercent}% Cleared</span>
        </div>
        <div className="h-3 w-full rounded-full bg-black/5 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
            style={{ width: `${advancePercent}%` }}
            title="Collected Advance"
          />
          <div
            className="h-full bg-amber-400/80 transition-all duration-700"
            style={{ width: `${100 - advancePercent}%` }}
            title="Pending Final Balance"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Service Breakdown Bar Chart
 * Shows demand distribution per service type.
 */
export function ServiceBreakdownChart({ services = [], projects = [] }) {
  const serviceStats = useMemo(() => {
    return services.map((s) => {
      const count = projects.filter(
        (p) => p.serviceRef?.id === s.id || p.service === s.name || p.service === s.id
      ).length;
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        count,
      };
    }).sort((a, b) => b.count - a.count);
  }, [services, projects]);

  const maxCount = Math.max(...serviceStats.map((s) => s.count), 1);

  return (
    <div className="rounded-3xl glass-card border border-ink/10 p-6 sm:p-7 shadow-xs">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 text-signal text-xs">
              <ChartBarIcon className="h-3.5 w-3.5" />
            </span>
            Service Popularity
          </h3>
          <p className="text-xs text-muted-light mt-0.5">
            Project volume across service offerings
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {serviceStats.map((s, i) => {
          const percent = Math.round((s.count / maxCount) * 100);
          return (
            <div key={s.id || s.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-ink">{s.name}</span>
                <span className="font-mono text-muted-light">
                  {s.count} project{s.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-signal to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.max(percent, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
