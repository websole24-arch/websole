import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { SectionCard, Loading, ErrorNote, EmptyState } from '../ui';

export default function InquiriesTab({ onReviewed }) {
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

  // Only fires the first time a given inquiry is opened — the highlight
  // and sidebar count both stay put until the admin actually clicks it.
  const markViewed = (inquiry) => {
    if (inquiry.viewedAt) return;
    setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? { ...i, viewedAt: new Date().toISOString() } : i)));
    client
      .patch(`/inquiries/${inquiry.id}/view`)
      .then(() => onReviewed?.())
      .catch(() => {}); // read-tracking is best-effort — a failed PATCH shouldn't block the page
  };

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!inquiries) return <Loading />;
  if (inquiries.length === 0) return <EmptyState>No inquiries yet.</EmptyState>;

  return (
    <SectionCard title={`Inquiries (${inquiries.length})`}>
      <div className="space-y-3">
        {inquiries.map((i) => {
          const isUnread = !i.viewedAt;
          return (
            <div
              key={i.id}
              onClick={() => markViewed(i)}
              className={`rounded-xl border p-4 transition-colors ${
                isUnread
                  ? 'cursor-pointer border-signal/30 bg-signal/10 backdrop-blur-sm supports-[backdrop-filter]:bg-signal/5'
                  : 'border-ink/10'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-signal-deep" />}
                  <p className="font-medium">{i.name}</p>
                </div>
                <p className="text-xs text-muted-light">{new Date(i.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted-light">{i.email}{i.whatsapp ? ` · ${i.whatsapp}` : ''}</p>
              <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <p><span className="text-muted-light">Service:</span> {i.service}</p>
                <p><span className="text-muted-light">Country:</span> {i.country || '—'}</p>
                {i.budget && <p><span className="text-muted-light">Budget:</span> {i.budget}</p>}
                {i.preferredDeadline && <p><span className="text-muted-light">Deadline:</span> {i.preferredDeadline}</p>}
              </div>
              <p className="mt-3 text-sm text-ink">{i.description}</p>
              {i.referenceWebsite && (
                <a
                  href={i.referenceWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-block text-sm text-signal hover:underline"
                >
                  Reference: {i.referenceWebsite}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
