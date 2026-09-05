import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { SectionCard, Pill, Loading, ErrorNote, EmptyState, projectStatusTone, inputClass } from '../ui';
import ProjectFiles from '../../../components/project/ProjectFiles';

const STATUSES = [
  'Inquiry', 'Awaiting Payment', 'Payment Confirmed', 'Project Started',
  'Design', 'Development', 'Review', 'Revision', 'Final Payment',
  'Final Delivery', 'Completed', 'Closed',
];

function StatusSelect({ project, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = async (status) => {
    if (status === project.status) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await client.patch(`/projects/${project.id}/status`, { status });
      onChanged(data.project);
    } catch (err) {
      setError(describeApiError(err, 'Could not update status.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={project.status}
        onChange={(e) => update(e.target.value)}
        disabled={saving}
        className={`${inputClass} w-auto`}
        aria-label={`Status for project ${project.id}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ProjectsTab() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [openFilesId, setOpenFilesId] = useState(null);

  const load = () => {
    setError('');
    return client
      .get('/projects')
      .then(({ data }) => setProjects(data.projects || []))
      .catch((err) => setError(describeApiError(err, 'Could not load projects.')));
  };

  useEffect(() => { load(); }, []);

  const handleChanged = (updated) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!projects) return <Loading />;
  if (projects.length === 0) return <EmptyState>No projects yet — they appear once a customer starts one from Pricing.</EmptyState>;

  const visible = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  return (
    <SectionCard
      title={`Projects (${projects.length})`}
      action={
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      }
    >
      <div className="space-y-3">
        {visible.map((p) => (
          <div key={p.id} className="rounded-xl border border-ink/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{p.service?.name} <span className="font-normal text-muted-light">· {p.package?.name}</span></p>
                <p className="mt-0.5 text-sm text-muted-light">
                  {p.customer?.name} ({p.customer?.email}) · {p.country}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={p.advancePaid ? 'jade' : 'brass'}>{p.advancePaid ? 'Advance paid' : 'Advance unpaid'}</Pill>
                <Pill tone={projectStatusTone(p.status)}>{p.status}</Pill>
                <StatusSelect project={p} onChanged={handleChanged} />
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <p>Total: <span className="font-mono">{p.currency} {p.totalAmount.toLocaleString()}</span></p>
              <p>Advance: <span className="font-mono">{p.currency} {p.advanceAmount.toLocaleString()}</span></p>
              <p>Remaining: <span className="font-mono">{p.currency} {p.remainingAmount.toLocaleString()}</span></p>
            </div>
            {p.requirements && (
              <p className="mt-3 rounded-lg bg-ink/[0.03] p-3 text-sm text-muted-light">{p.requirements}</p>
            )}
            <button
              type="button"
              onClick={() => setOpenFilesId(openFilesId === p.id ? null : p.id)}
              className="mt-3 text-xs font-semibold text-signal hover:underline"
            >
              {openFilesId === p.id ? 'Hide files' : 'Manage files'}
            </button>
            {openFilesId === p.id && (
              <div className="mt-3">
                <ProjectFiles projectId={p.id} canDelete />
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-muted-light">No projects with that status.</p>}
      </div>
    </SectionCard>
  );
}
