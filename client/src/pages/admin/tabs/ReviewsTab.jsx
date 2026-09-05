import { useEffect, useState } from 'react';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import StarRating from '../../../components/common/StarRating';
import {
  SectionCard, Pill, Loading, ErrorNote, EmptyState, btnGhost, btnDanger, inputClass,
} from '../ui';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setError('');
    return client
      .get('/reviews/admin/all')
      .then(({ data }) => setReviews(data.reviews || []))
      .catch((err) => setError(describeApiError(err, 'Could not load reviews.')));
  };

  useEffect(() => { load(); }, []);

  const setApproval = async (id, approved) => {
    setBusyId(id);
    try {
      const { data } = await client.patch(`/reviews/${id}`, { approved });
      setReviews((prev) => prev.map((r) => (r.id === id ? data.review : r)));
    } catch (err) {
      setError(describeApiError(err, 'Could not update that review.'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review) => {
    if (!window.confirm(`Delete ${review.name}'s review? This can't be undone.`)) return;
    setBusyId(review.id);
    try {
      await client.delete(`/reviews/${review.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(describeApiError(err, 'Could not delete this review.'));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !reviews) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!reviews) return <Loading />;
  if (reviews.length === 0) return <EmptyState>No reviews submitted yet.</EmptyState>;

  const visible = reviews.filter((r) => {
    if (statusFilter === 'pending') return !r.approved;
    if (statusFilter === 'approved') return r.approved;
    return true;
  });
  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <SectionCard
      title={`Reviews (${reviews.length})`}
      action={
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="all">All</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="approved">Published</option>
        </select>
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}
      {visible.length === 0 ? (
        <EmptyState>Nothing in this filter.</EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-ink/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.name} <span className="font-normal text-muted-light">— {[r.country, r.service].filter(Boolean).join(' · ') || 'no details given'}</span>
                  </p>
                  <div className="mt-1"><StarRating value={r.rating} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={r.approved ? 'jade' : 'brass'}>{r.approved ? 'Published' : 'Pending'}</Pill>
                  <p className="text-xs text-muted-light">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink">{r.comment}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => setApproval(r.id, !r.approved)}
                  className={`${btnGhost} px-3 py-1.5 text-xs`}
                >
                  {r.approved ? 'Unpublish' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => remove(r)}
                  className={`${btnDanger} px-3 py-1.5 text-xs`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
