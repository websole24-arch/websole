import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import useAdminCrud from '../useAdminCrud';
import {
  SectionCard, Field, Pill, Loading, ErrorNote, EmptyState,
  inputClass, btnPrimary, btnGhost, btnDanger,
} from '../ui';

function emptyForm(services) {
  return {
    service: services[0]?.id || '', name: '', description: '',
    features: '', isActive: true, order: 0,
  };
}

function toFormState(pkg) {
  return {
    service: pkg.service?.id || pkg.service || '',
    name: pkg.name || '',
    description: pkg.description || '',
    features: (pkg.features || []).join(', '),
    isActive: pkg.isActive,
    order: pkg.order ?? 0,
  };
}

function toPayload(form) {
  return {
    service: form.service,
    name: form.name,
    description: form.description || null,
    features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
    isActive: form.isActive,
    order: Number(form.order) || 0,
  };
}

function PackageForm({ initial, services, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      setError(describeApiError(err, 'Could not save this package.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:grid-cols-2">
      <Field label="Service">
        <select required value={form.service} onChange={set('service')} className={inputClass}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Name">
        <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="Basic / Standard / Premium" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <input value={form.description} onChange={set('description')} className={inputClass} />
      </Field>
      <Field label="Features (comma separated)" className="sm:col-span-2">
        <input value={form.features} onChange={set('features')} className={inputClass} placeholder="Responsive design, Basic SEO, Contact form" />
      </Field>
      <Field label="Order">
        <input type="number" value={form.order} onChange={set('order')} className={inputClass} />
      </Field>
      <Field label="Active">
        <select
          value={form.isActive ? 'true' : 'false'}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
          className={inputClass}
        >
          <option value="true">Active — visible on the site</option>
          <option value="false">Inactive — hidden from customers</option>
        </select>
      </Field>

      {error && <div className="sm:col-span-2"><ErrorNote>{error}</ErrorNote></div>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

export default function PackagesTab() {
  const [packages, setPackages] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('all');

  const {
    error, setError, creating, setCreating, editingId, setEditingId, create, update, remove,
  } = useAdminCrud({
    basePath: '/packages',
    updateMethod: 'put',
    confirmMessage: (pkg) => `Delete "${pkg.name}"? This can't be undone.`,
    deleteErrorMessage: 'Could not delete this package.',
    reload: () => load(),
  });

  const load = () => {
    setError('');
    return Promise.all([
      client.get('/packages/admin/all'),
      client.get('/services/admin/all'),
    ])
      .then(([pkgs, svcs]) => {
        setPackages(pkgs.data.packages);
        setServices(svcs.data.services);
      })
      .catch((err) => setError(describeApiError(err, 'Could not load packages.')));
  };

  useEffect(() => { load(); }, []);

  if (error && !packages) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!packages) return <Loading />;

  if (services.length === 0) {
    return <EmptyState>Add a service first — packages belong to a service.</EmptyState>;
  }

  const visible = serviceFilter === 'all'
    ? packages
    : packages.filter((p) => (p.service?.id || p.service) === serviceFilter);

  return (
    <SectionCard
      title={`Packages (${packages.length})`}
      action={
        <div className="flex items-center gap-2">
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="all">All services</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {!creating && (
            <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
              + New package
            </button>
          )}
        </div>
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      {creating && (
        <div className="mb-4">
          <PackageForm
            initial={emptyForm(services)}
            services={services}
            submitLabel="Create package"
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {packages.length === 0 && !creating && <EmptyState>No packages yet.</EmptyState>}
      {packages.length > 0 && visible.length === 0 && <EmptyState>No packages for this service.</EmptyState>}

      <div className="space-y-3">
        {visible.map((p) =>
          editingId === p.id ? (
            <PackageForm
              key={p.id}
              initial={toFormState(p)}
              services={services}
              submitLabel="Save changes"
              onSubmit={(payload) => update(p.id, payload)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
              <div>
                <p className="font-medium">
                  {p.name} <span className="font-normal text-muted-light">· {p.service?.name}</span>
                </p>
                {p.description && <p className="mt-0.5 text-sm text-muted-light">{p.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={p.isActive ? 'jade' : 'red'}>{p.isActive ? 'Active' : 'Inactive'}</Pill>
                <button type="button" onClick={() => setEditingId(p.id)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(p)} className={`${btnDanger} px-3 py-1.5 text-xs`}>
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </SectionCard>
  );
}
