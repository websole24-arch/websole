import { useEffect, useMemo, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { COUNTRY_OPTIONS, CURRENCIES, findCountry } from '../../../data/countries';
import useAdminCrud from '../useAdminCrud';
import {
  SectionCard, Field, Pill, Loading, ErrorNote, EmptyState,
  inputClass, btnPrimary, btnGhost, btnDanger,
} from '../ui';

function emptyForm(services) {
  return {
    country: '', countryCode: '', currency: '',
    service: services[0]?.id || '', package: '', price: '', active: true,
  };
}

function toFormState(row) {
  return {
    country: row.country || '',
    countryCode: row.countryCode || '',
    currency: row.currency || '',
    service: row.service?.id || row.service || '',
    package: row.package?.id || row.package || '',
    price: String(row.price ?? ''),
    active: row.active,
  };
}

function toPayload(form) {
  return {
    country: form.country,
    countryCode: form.countryCode || null,
    currency: form.currency,
    service: form.service,
    package: form.package,
    price: Number(form.price),
    active: form.active,
  };
}

function PricingForm({ initial, services, packages, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Picking a country pre-fills its usual code + currency — still a
  // separate, editable field afterward (e.g. quoting a country in USD
  // instead of its local currency is a legitimate business call, not a
  // mistake this should block).
  const setCountry = (e) => {
    const match = findCountry(e.target.value);
    setForm((f) => ({
      ...f,
      country: e.target.value,
      countryCode: match?.code ?? f.countryCode,
      currency: match?.currency || f.currency,
    }));
  };

  const packageOptions = useMemo(
    () => packages.filter((p) => (p.service?.id || p.service) === form.service),
    [packages, form.service]
  );

  useEffect(() => {
    if (packageOptions.length && !packageOptions.some((p) => p.id === form.package)) {
      setForm((f) => ({ ...f, package: packageOptions[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.service]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      setError(describeApiError(err, 'Could not save this pricing row.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Country">
        <select required value={form.country} onChange={setCountry} className={inputClass}>
          <option value="" disabled>Select a country…</option>
          {COUNTRY_OPTIONS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Country code (optional)">
        <select value={form.countryCode} onChange={set('countryCode')} className={inputClass}>
          <option value="">— none —</option>
          {COUNTRY_OPTIONS.filter((c) => c.code).map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Currency">
        <select required value={form.currency} onChange={set('currency')} className={inputClass}>
          <option value="" disabled>Select a currency…</option>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Service">
        <select required value={form.service} onChange={set('service')} className={inputClass}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Package">
        <select required value={form.package} onChange={set('package')} className={inputClass}>
          {packageOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {packageOptions.length === 0 && (
          <p className="mt-1 text-xs text-muted-light">This service has no packages yet.</p>
        )}
      </Field>
      <Field label="Price">
        <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} className={inputClass} />
      </Field>
      <Field label="Active">
        <select
          value={form.active ? 'true' : 'false'}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'true' }))}
          className={inputClass}
        >
          <option value="true">Active — used for quotes</option>
          <option value="false">Inactive — hidden, falls back to International</option>
        </select>
      </Field>

      {error && <div className="sm:col-span-2 lg:col-span-3"><ErrorNote>{error}</ErrorNote></div>}

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={saving || packageOptions.length === 0} className={btnPrimary}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}

export default function PricingTab() {
  const [pricing, setPricing] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [countryFilter, setCountryFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const {
    error, setError, creating, setCreating, editingId, setEditingId, create, update, remove,
  } = useAdminCrud({
    basePath: '/pricing',
    updateMethod: 'put',
    confirmMessage: (row) => `Delete the ${row.country} / ${row.package?.name} rate? This can't be undone.`,
    deleteErrorMessage: 'Could not delete this pricing row.',
    reload: () => load(),
  });

  const load = () => {
    setError('');
    return Promise.all([
      client.get('/pricing/admin/all'),
      client.get('/services/admin/all'),
      client.get('/packages/admin/all'),
    ])
      .then(([p, s, pk]) => {
        setPricing(p.data.pricing);
        setServices(s.data.services);
        setPackages(pk.data.packages);
      })
      .catch((err) => setError(describeApiError(err, 'Could not load pricing.')));
  };

  useEffect(() => { load(); }, []);

  if (error && !pricing) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!pricing) return <Loading />;

  if (services.length === 0) {
    return <EmptyState>Add a service and package first — pricing rows belong to a service + package.</EmptyState>;
  }

  const countries = [...new Set(pricing.map((p) => p.country))].sort();
  const visible = pricing
    .filter((p) => countryFilter === 'all' || p.country === countryFilter)
    .filter((p) => serviceFilter === 'all' || (p.service?.id || p.service) === serviceFilter);

  return (
    <SectionCard
      title={`Pricing rows (${pricing.length})`}
      action={
        <div className="flex items-center gap-2">
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="all">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="all">All services</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {!creating && (
            <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
              + New rate
            </button>
          )}
        </div>
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      {creating && (
        <div className="mb-4">
          <PricingForm
            initial={emptyForm(services)}
            services={services}
            packages={packages}
            submitLabel="Create rate"
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {pricing.length === 0 && !creating && <EmptyState>No pricing rows yet.</EmptyState>}

      <div className="space-y-3">
        {visible.map((row) =>
          editingId === row.id ? (
            <PricingForm
              key={row.id}
              initial={toFormState(row)}
              services={services}
              packages={packages}
              submitLabel="Save changes"
              onSubmit={(payload) => update(row.id, payload)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
              <div>
                <p className="font-medium">
                  {row.country} <span className="font-normal text-muted-light">· {row.service?.name} · {row.package?.name}</span>
                </p>
                <p className="mt-0.5 font-mono text-sm text-muted-light">
                  {row.currency} {Number(row.price).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={row.active ? 'jade' : 'red'}>{row.active ? 'Active' : 'Inactive'}</Pill>
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
