import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import useAdminCrud from '../useAdminCrud';
import {
  SectionCard, Field, Pill, Loading, ErrorNote, EmptyState,
  inputClass, btnPrimary, btnGhost, btnDanger,
} from '../ui';

const EMPTY = {
  name: '', slug: '', shortDescription: '', description: '',
  examples: '', icon: '', isActive: true, order: 0,
};

function toFormState(service) {
  return {
    name: service.name || '',
    slug: service.slug || '',
    shortDescription: service.shortDescription || '',
    description: service.description || '',
    examples: (service.examples || []).join(', '),
    icon: service.icon || '',
    isActive: service.isActive,
    order: service.order ?? 0,
  };
}

function toPayload(form) {
  return {
    name: form.name,
    slug: form.slug,
    shortDescription: form.shortDescription,
    description: form.description,
    examples: form.examples.split(',').map((s) => s.trim()).filter(Boolean),
    icon: form.icon || null,
    isActive: form.isActive,
    order: Number(form.order) || 0,
  };
}

function ServiceForm({ initial, submitLabel, onSubmit, onCancel }) {
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
      setError(describeApiError(err, 'Could not save this service.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:grid-cols-2">
      <Field label="Name">
        <input required value={form.name} onChange={set('name')} className={inputClass} />
      </Field>
      <Field label="Slug">
        <input required value={form.slug} onChange={set('slug')} className={inputClass} placeholder="custom-website-development" />
      </Field>
      <Field label="Short description" className="sm:col-span-2">
        <input required value={form.shortDescription} onChange={set('shortDescription')} className={inputClass} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea required value={form.description} onChange={set('description')} rows={3} className={inputClass} />
      </Field>
      <Field label="Examples (comma separated)" className="sm:col-span-2">
        <input value={form.examples} onChange={set('examples')} className={inputClass} placeholder="Business websites, Landing pages" />
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

export default function ServicesTab() {
  const [services, setServices] = useState(null);

  const {
    error, setError, creating, setCreating, editingId, setEditingId, create, update, remove,
  } = useAdminCrud({
    basePath: '/services',
    updateMethod: 'put',
    confirmMessage: (service) => `Delete "${service.name}"? This can't be undone.`,
    deleteErrorMessage: 'Could not delete this service.',
    reload: () => load(),
  });

  const load = () => {
    setError('');
    return client.get('/services/admin/all')
      .then(({ data }) => setServices(data.services || []))
      .catch((err) => setError(describeApiError(err, 'Could not load services.')));
  };

  useEffect(() => { load(); }, []);

  if (error && !services) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!services) return <Loading />;

  return (
    <SectionCard
      title={`Services (${services.length})`}
      action={
        !creating && (
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            + New service
          </button>
        )
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      {creating && (
        <div className="mb-4">
          <ServiceForm
            initial={EMPTY}
            submitLabel="Create service"
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {services.length === 0 && !creating && <EmptyState>No services yet.</EmptyState>}

      <div className="space-y-3">
        {services.map((s) =>
          editingId === s.id ? (
            <ServiceForm
              key={s.id}
              initial={toFormState(s)}
              submitLabel="Save changes"
              onSubmit={(payload) => update(s.id, payload)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
              <div>
                <p className="font-medium">
                  {s.name} <span className="font-mono text-xs text-muted-light">/{s.slug}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-light">{s.shortDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={s.isActive ? 'jade' : 'red'}>{s.isActive ? 'Active' : 'Inactive'}</Pill>
                <button type="button" onClick={() => setEditingId(s.id)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(s)} className={`${btnDanger} px-3 py-1.5 text-xs`}>
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
