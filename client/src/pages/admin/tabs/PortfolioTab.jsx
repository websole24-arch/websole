import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import useAdminCrud from '../useAdminCrud';
import {
  SectionCard, Field, Pill, Loading, ErrorNote, EmptyState,
  inputClass, btnPrimary, btnGhost, btnDanger,
} from '../ui';

const emptyForm = {
  title: '', description: '', service: '', country: '',
  imageUrl: '', projectUrl: '', completedOn: '', published: false,
  techStack: '', features: '',
};

function toFormState(row) {
  return {
    title: row.title || '',
    description: row.description || '',
    service: row.service || '',
    country: row.country || '',
    imageUrl: row.imageUrl || '',
    projectUrl: row.projectUrl || '',
    completedOn: row.completedOn ? row.completedOn.slice(0, 10) : '',
    published: row.published,
    techStack: (row.techStack || []).join(', '),
    features: (row.features || []).join('\n'),
  };
}

function toPayload(form) {
  return {
    title: form.title,
    description: form.description,
    service: form.service || null,
    country: form.country || null,
    imageUrl: form.imageUrl || null,
    projectUrl: form.projectUrl || null,
    completedOn: form.completedOn || null,
    published: form.published,
    techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
    features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
  };
}

function ProjectForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const { data } = await client.post('/portfolio/admin/upload-image', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, imageUrl: data.imageUrl }));
    } catch (err) {
      setUploadError(describeApiError(err, 'Upload failed.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      setError(describeApiError(err, 'Could not save this project.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Title">
        <input required value={form.title} onChange={set('title')} className={inputClass} placeholder="Coastal Villa Booking Site" />
      </Field>
      <Field label="Service (optional)">
        <input value={form.service} onChange={set('service')} className={inputClass} placeholder="Custom Website Development" />
      </Field>
      <Field label="Country (optional)">
        <input value={form.country} onChange={set('country')} className={inputClass} placeholder="Sri Lanka" />
      </Field>
      <Field label="Description" className="sm:col-span-2 lg:col-span-3">
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={set('description')}
          className={inputClass}
          placeholder="What was built and what it solved for the client."
        />
      </Field>
      <Field label="Image (optional)">
        <div className="flex items-center gap-2">
          <input value={form.imageUrl} onChange={set('imageUrl')} className={`${inputClass} flex-1`} placeholder="https://… or upload" />
          <label className={`${btnGhost} shrink-0 cursor-pointer px-3 py-1.5 text-xs ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        {form.imageUrl && (
          <img src={form.imageUrl} alt="Preview" className="mt-2 h-20 w-32 rounded-lg object-cover border border-ink/10" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
      </Field>
      <Field label="Project URL (optional)">
        <input value={form.projectUrl} onChange={set('projectUrl')} className={inputClass} placeholder="https://…" />
      </Field>
      <Field label="Completed on (optional)">
        <input type="date" value={form.completedOn} onChange={set('completedOn')} className={inputClass} />
      </Field>
      <Field label="Tech stack (comma-separated, optional)" className="sm:col-span-2 lg:col-span-3">
        <input value={form.techStack} onChange={set('techStack')} className={inputClass} placeholder="Next.js, React, TypeScript" />
      </Field>
      <Field label="Key features (one per line, optional)" className="sm:col-span-2 lg:col-span-3">
        <textarea
          rows={3}
          value={form.features}
          onChange={set('features')}
          className={inputClass}
          placeholder={'Notes sharing and uploading system\nUsed by 500+ users within 2 weeks'}
        />
      </Field>
      <Field label="Visibility">
        <select
          value={form.published ? 'true' : 'false'}
          onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'true' }))}
          className={inputClass}
        >
          <option value="false">Draft — hidden from the site</option>
          <option value="true">Published — visible on Home and Portfolio</option>
        </select>
      </Field>

      {error && <div className="sm:col-span-2 lg:col-span-3"><ErrorNote>{error}</ErrorNote></div>}

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

export default function PortfolioTab() {
  const [projects, setProjects] = useState(null);

  const {
    error, setError, creating, setCreating, editingId, setEditingId, create, update, remove,
  } = useAdminCrud({
    basePath: '/portfolio',
    updateMethod: 'patch',
    confirmMessage: (row) => `Delete "${row.title}"? This can't be undone.`,
    deleteErrorMessage: 'Could not delete this project.',
    reload: () => load(),
  });

  const load = () => {
    setError('');
    return client
      .get('/portfolio/admin/all')
      .then(({ data }) => setProjects(data.projects || []))
      .catch((err) => setError(describeApiError(err, 'Could not load portfolio projects.')));
  };

  useEffect(() => { load(); }, []);

  const togglePublished = async (row) => {
    await client.patch(`/portfolio/${row.id}`, { published: !row.published });
    await load();
  };

  if (error && !projects) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!projects) return <Loading />;

  return (
    <SectionCard
      title={`Portfolio projects (${projects.length})`}
      action={
        !creating && (
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            + New project
          </button>
        )
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      {creating && (
        <div className="mb-4">
          <ProjectForm
            initial={emptyForm}
            submitLabel="Create project"
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {projects.length === 0 && !creating && (
        <EmptyState>No portfolio projects yet — add real, completed work to show on Home and Portfolio.</EmptyState>
      )}

      <div className="space-y-3">
        {projects.map((row) =>
          editingId === row.id ? (
            <ProjectForm
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
                  {row.title}{' '}
                  <span className="font-normal text-muted-light">
                    — {[row.service, row.country].filter(Boolean).join(' · ') || 'no details'}
                  </span>
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-muted-light">{row.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={row.published ? 'jade' : 'brass'}>{row.published ? 'Published' : 'Draft'}</Pill>
                <button type="button" onClick={() => togglePublished(row)} className={`${btnGhost} px-3 py-1.5 text-xs`}>
                  {row.published ? 'Unpublish' : 'Publish'}
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
