import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { StatCard, SectionCard, Pill, SkeletonStats, ErrorNote, projectStatusTone } from '../ui';
import { ArrowRightIcon } from '../../../components/common/Icon';
import {
  ActivityTrendsChart,
  StatusDonutChart,
  FinancialPipelineCard,
  ServiceBreakdownChart,
} from '../AdminCharts';

const ENDPOINTS = [
  ['services', '/services/admin/all', 'services', 'services'],
  ['packages', '/packages/admin/all', 'packages', 'packages'],
  ['pricing', '/pricing/admin/all', 'pricing', 'pricing'],
  ['projects', '/projects', 'projects', 'projects'],
  ['inquiries', '/inquiries', 'inquiries', 'inquiries'],
  ['users', '/users', 'users', 'customers'],
  ['reviews', '/reviews/admin/all', 'reviews', 'reviews'],
];

export default function OverviewTab({ onNavigate }) {
  const [data, setData] = useState(null);
  const [failedKeys, setFailedKeys] = useState([]);
  const [fatalError, setFatalError] = useState('');

  const load = () => {
    setFatalError('');
    return Promise.allSettled(ENDPOINTS.map(([, url]) => client.get(url))).then((results) => {
      const next = {};
      const failed = [];

      results.forEach((result, i) => {
        const [key, url] = ENDPOINTS[i];
        const dataKey = ENDPOINTS[i][2];
        if (result.status === 'fulfilled') {
          next[key] = result.value.data[dataKey] || [];
        } else {
          console.error(`Overview: ${url} failed —`, result.reason?.response?.status, result.reason?.message);
          next[key] = [];
          failed.push(key);
        }
      });

      if (failed.length === ENDPOINTS.length) {
        setFatalError('Could not load the overview — the server may be unreachable, or your session may have expired. Try refreshing or logging in again.');
      } else {
        setData(next);
        setFailedKeys(failed);
      }
    });
  };

  useEffect(() => { load(); }, []);

  if (fatalError) return <ErrorNote onRetry={load}>{fatalError}</ErrorNote>;
  if (!data) return <SkeletonStats count={7} />;

  const { services, packages, pricing, projects, inquiries, users, reviews } = data;
  const customers = users.filter((u) => u.role === 'customer');
  const pendingReviews = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-8">
      {failedKeys.length > 0 && (
        <ErrorNote onRetry={load}>
          Some sections couldn't load ({failedKeys.join(', ')}) — numbers below may be incomplete.
        </ErrorNote>
      )}

      {/* Top 7 Stat Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Customers" value={customers.length} icon="customers" />
        <StatCard label="Projects" value={projects.length} icon="projects" />
        <StatCard label="Inquiries" value={inquiries.length} icon="inquiries" />
        <StatCard label="Services" value={services.length} icon="services" />
        <StatCard label="Packages" value={packages.length} icon="packages" />
        <StatCard label="Pricing rows" value={pricing.length} icon="pricing" />
        <StatCard label="Reviews pending" value={pendingReviews} icon="reviews" />
      </div>

      {/* Financial Pipeline Progress */}
      <FinancialPipelineCard projects={projects} />

      {/* Charts Row 1: Activity Trends (Line/Area) & Project Status (Donut) */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ActivityTrendsChart projects={projects} inquiries={inquiries} />
        <StatusDonutChart projects={projects} />
      </div>

      {/* Charts Row 2: Service Popularity & Recent Inquiries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceBreakdownChart services={services} projects={projects} />

        <SectionCard
          title="Recent Inquiries"
          action={
            <button
              type="button"
              onClick={() => onNavigate?.('inquiries')}
              className="text-xs font-semibold text-signal hover:underline flex items-center gap-1"
            >
              <span>View all inquiries</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          }
        >
          {inquiries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-light">
              No inquiries received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between border-b border-ink/10 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {i.name}{' '}
                      <span className="font-normal text-muted-light">— {i.service}</span>
                    </p>
                    <p className="text-xs text-muted-light mt-0.5">
                      {i.country || 'International'} · {new Date(i.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-signal-soft px-2.5 py-0.5 text-[11px] font-mono text-signal">
                    {i.status || 'New'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
