import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { SectionCard, Pill, Loading, ErrorNote, btnGhost } from '../ui';

const PAYMENT_METHODS = [
  {
    key: 'stripePaymentsEnabled',
    label: 'Card payments (Stripe)',
    description: 'The "Pay 50% Advance" / "Pay Remaining Balance" buttons on the customer dashboard.',
  },
  {
    key: 'whatsappPaymentsEnabled',
    label: 'WhatsApp / manual payment',
    description: 'The "Chat on WhatsApp" button customers use to arrange bank transfer or other manual payment.',
  },
];

export default function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  const load = () =>
    client
      .get('/settings')
      .then(({ data }) => setSettings(data.settings))
      .catch((err) => setError(describeApiError(err, 'Could not load settings.')));

  useEffect(() => { load(); }, []);

  const toggle = async (key) => {
    setSavingKey(key);
    setError('');
    const next = !settings[key];
    try {
      const { data } = await client.patch('/settings', { [key]: next });
      setSettings(data.settings);
    } catch (err) {
      setError(describeApiError(err, 'Could not update that setting.'));
    } finally {
      setSavingKey(null);
    }
  };

  if (error && !settings) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!settings) return <Loading rows={2} />;

  const bothOff = !settings.stripePaymentsEnabled && !settings.whatsappPaymentsEnabled;

  return (
    <SectionCard title="Payment options">
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {bothOff && (
        <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          Both payment methods are hidden — customers currently have no way to pay for a project from their dashboard.
        </p>
      )}

      <ul className="space-y-3">
        {PAYMENT_METHODS.map(({ key, label, description }) => (
          <li key={key} className="flex items-start justify-between gap-4 rounded-xl border border-ink/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-0.5 text-xs text-muted-light">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Pill tone={settings[key] ? 'jade' : 'brass'}>{settings[key] ? 'Visible' : 'Hidden'}</Pill>
              <button
                type="button"
                disabled={savingKey === key}
                onClick={() => toggle(key)}
                className={`${btnGhost} px-3 py-1.5 text-xs disabled:opacity-50`}
              >
                {savingKey === key ? 'Saving…' : settings[key] ? 'Hide' : 'Show'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
