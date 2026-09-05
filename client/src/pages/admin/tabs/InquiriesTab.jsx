import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { SectionCard, Loading, ErrorNote, EmptyState } from '../ui';

export default function InquiriesTab() {
  const [inquiries, setInquiries] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    return client
      .get('/inquiries')
      .then(({ data }) => setInquiries(data.inquiries || []))
      .catch((err) => setError(describeApiError(err, 'Could not load inquiries.')));
  };

  useEffect(() => { load(); }, []);

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!inquiries) return <Loading />;
  if (inquiries.length === 0) return <EmptyState>No inquiries yet.</EmptyState>;

  return (
    <SectionCard title={`Inquiries (${inquiries.length})`}>
      <p className="mb-4 text-sm text-muted-light">
        Read-only for now — reply by email or WhatsApp. Converting an inquiry
        into a project isn't wired up yet (see TODO.md).
      </p>
      <div className="space-y-3">
        {inquiries.map((i) => (
          <div key={i.id} className="rounded-xl border border-ink/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-muted-light">{i.email}{i.whatsapp ? ` · ${i.whatsapp}` : ''}</p>
              </div>
              <p className="text-xs text-muted-light">{new Date(i.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
              <p><span className="text-muted-light">Service:</span> {i.service}</p>
              <p><span className="text-muted-light">Country:</span> {i.country || '—'}</p>
              {i.budget && <p><span className="text-muted-light">Budget:</span> {i.budget}</p>}
              {i.preferredDeadline && <p><span className="text-muted-light">Deadline:</span> {i.preferredDeadline}</p>}
            </div>
            <p className="mt-3 text-sm text-ink">{i.description}</p>
            {i.referenceWebsite && (
              <a href={i.referenceWebsite} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-signal hover:underline">
                Reference: {i.referenceWebsite}
              </a>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
