import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import useAdminCrud from '../useAdminCrud';
import {
  SectionCard, Field, Pill, Loading, ErrorNote, EmptyState,
  inputClass, btnPrimary, btnGhost, btnDanger,
} from '../ui';

const EMPTY = { label: '', href: '', isActive: true, order: 0 };

function toFormState(tool) {
  return {
    label: tool.label || '',
    href: tool.href || '',
    isActive: tool.isActive,
    order: tool.order ?? 0,
  };
}

function toPayload(form) {
  return {
    label: form.label,
    href: form.href,
    isActive: form.isActive,
    order: Number(form.order) || 0,
  };
}

function FreeToolForm({ initial, submitLabel, onSubmit, onCancel }) {
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
      setError(describeApiError(err, 'Could not save this link.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:grid-cols-2">
      <Field label="Label">
        <input
          required
          value={form.label}
          onChange={set('label')}
          className={inputClass}
          placeholder="Meta Tag & SEO Generator"
        />
      </Field>
      <Field label="Link (page path or full URL)">
        <input
          required
          value={form.href}
          onChange={set('href')}
          className={inputClass}
          placeholder="/tools"
        />
      </Field>
      <Field label="Order">
        <input type="number" value={form.order} onChange={set('order')} className={inputClass} />
      </Field>
      <Field label="Visibility">
        <select
          value={form.isActive ? 'true' : 'false'}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
          className={inputClass}
        >
          <option value="true">Active — visible in the Footer</option>
          <option value="false">Inactive — hidden from the Footer</option>
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

export default function FreeToolsTab() {
  const [tools, setTools] = useState(null);

  const {
    error, setError, creating, setCreating, editingId, setEditingId, create, update, remove,
  } = useAdminCrud({
    basePath: '/free-tools',
    updateMethod: 'patch',
    confirmMessage: (row) => `Delete "${row.label}"? This can't be undone.`,
    deleteErrorMessage: 'Could not delete this link.',
    reload: () => load(),
  });

  const load = () => {
    setError('');
    return client
      .get('/free-tools/admin/all')
      .then(({ data }) => setTools(data.tools || []))
      .catch((err) => setError(describeApiError(err, 'Could not load Free Tools links.')));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (row) => {
    await client.patch(`/free-tools/${row.id}`, { isActive: !row.isActive });
    await load();
  };

  if (error && !tools) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!tools) return <Loading />;

  return (
    <SectionCard
      title={`Free Tools footer links (${tools.length})`}
      action={
        !creating && (
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            + New link
          </button>
        )
      }
    >
      <p className="mb-4 text-sm text-muted-light">
        Controls the "Free Tools" column in the site Footer, shown on every page. Lower order
        numbers appear first. Link can be an internal path (e.g. <code>/tools</code>) or a full
        external URL.
      </p>

      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      {creating && (
        <div className="mb-4">
          <FreeToolForm
            initial={EMPTY}
            submitLabel="Create link"
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {tools.length === 0 && !creating && (
        <EmptyState>No Free Tools links yet — the Footer's Free Tools column will be empty.</EmptyState>
      )}

      <div className="space-y-3">
        {tools.map((row) =>
          editingId === row.id ? (
            <FreeToolForm
              key={row.id}
              initial={toFormState(row)}
              submitLabel="Save changes"
              onSubmit={(payload) => update(row.id, payload)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
              <div>
                <p className="font-medium">
                  {row.label}{' '}
                  <span className="font-mono text-xs text-muted-light">#{row.order}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-light">{row.href}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={row.isActive ? 'jade' : 'brass'}>{row.isActive ? 'Active' : 'Inactive'}</Pill>
                <button type="button" onClick={() => toggleActive(row)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" onClick={() => setEditingId(row.id)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(row)} className={`${btnDanger} px-3 py-1.5 text-xs`}>
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
