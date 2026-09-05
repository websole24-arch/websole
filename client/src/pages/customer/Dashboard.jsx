import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import StarRating from '../../components/common/StarRating';
import FieldError from '../../components/common/FieldError';
import ProjectPaymentModal from '../../components/project/ProjectPaymentModal';
import ProjectFiles from '../../components/project/ProjectFiles';
import { ChatIcon, CloseIcon, CheckMarkIcon, FolderIcon, CreditCardIcon } from '../../components/common/Icon';
import Reveal from '../../components/common/Reveal';
import { describeApiError } from '../../utils/apiError';

function ReviewSection() {
  const [review, setReview] = useState(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [service, setService] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/reviews/me').then(({ data }) => setReview(data.review)).catch(() => setReview(null));
  }, []);

  const validate = () => {
    const next = {};
    if (!rating) next.rating = 'Pick a star rating';
    if (!comment.trim()) next.comment = 'Share a few words about your experience';
    else if (comment.trim().length < 10) next.comment = 'A bit more detail would help (at least 10 characters)';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await client.post('/reviews', { rating, comment, service });
      setReview(data.review);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (review === undefined) return null;

  return (
    <div className="mt-12 rounded-3xl glass-card p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold text-ink">Your Project Review</h2>

      {review ? (
        <div className="mt-4">
          <StarRating value={review.rating} />
          <p className="mt-3 text-sm text-ink italic leading-relaxed">"{review.comment}"</p>
          <p className="mt-3 text-xs text-muted-light">
            {review.approved
              ? 'Published on the website — thank you for your feedback.'
              : 'Submitted — your review is pending administrator approval.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-light">
            Have you completed a project with us? Share your experience with future clients.
          </p>
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <StarRating value={rating} onChange={setRating} size="h-6 w-6" />
              <FieldError>{errors.rating}</FieldError>
            </div>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Which service was this for? (e.g. Custom Web, UI/UX)"
              className="w-full rounded-xl border border-ink/15 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 text-sm text-ink placeholder:text-muted-light focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What was your experience like working with our engineering team?"
                className="w-full rounded-xl border border-ink/15 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 text-sm text-ink placeholder:text-muted-light focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              />
              <FieldError>{errors.comment}</FieldError>
            </div>
            {submitError && <p className="text-sm text-red-700">{submitError}</p>}
            <button
              disabled={submitting}
              className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Verified Review'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState('');
  const [banner, setBanner] = useState(null); // { tone: 'success'|'neutral'|'error', message }
  const [openFilesId, setOpenFilesId] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState({ stripePaymentsEnabled: true, whatsappPaymentsEnabled: true });
  const [searchParams, setSearchParams] = useSearchParams();

  const loadProjects = () => client.get('/projects').then(({ data }) => data.projects);

  useEffect(() => {
    client
      .get('/settings')
      .then(({ data }) => setPaymentSettings(data.settings))
      .catch(() => {}); // admin-controlled display toggle — fall back to both visible on failure
  }, []);

  useEffect(() => {
    loadProjects()
      .then(async (loaded) => {
        setProjects(loaded);

        // Check if there's a newProjectId query param to open modal automatically
        const newProjId = searchParams.get('newProjectId');
        if (newProjId) {
          const match = loaded.find((p) => p.id === newProjId);
          if (match) setSelectedProjectForPayment(match);
        }

        // Returning from Stripe Checkout — sync this session's payment
        // immediately rather than waiting on the webhook (which won't
        // fire at all in local dev without `stripe listen` running).
        const paymentResult = searchParams.get('payment');
        const sessionId = searchParams.get('session_id');
        if (paymentResult === 'success' && sessionId) {
          try {
            const { data } = await client.get(`/payments/verify/${sessionId}`);
            if (data.paid) {
              setBanner({ tone: 'success', message: 'Payment confirmed — thank you! Your project has been updated.' });
              setProjects(await loadProjects());
            } else {
              setBanner({ tone: 'neutral', message: "Payment is still processing — this can take a minute. We'll update your project as soon as it clears." });
            }
          } catch {
            setBanner({ tone: 'neutral', message: 'Payment received by Stripe — refresh in a moment if your project status hasn\u2019t updated yet.' });
          }
        } else if (paymentResult === 'cancelled') {
          setBanner({ tone: 'neutral', message: 'Payment was cancelled — no charge was made.' });
        }

        if (newProjId || paymentResult) {
          searchParams.delete('newProjectId');
          searchParams.delete('payment');
          searchParams.delete('session_id');
          setSearchParams(searchParams, { replace: true });
        }
      })
      .catch(() => setError('Could not load your projects.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payNow = async (project, type) => {
    setPayingId(project.id);
    setPayError('');
    try {
      const { data } = await client.post('/payments/checkout', { projectId: project.id, type });
      window.location.href = data.url;
    } catch (err) {
      setPayError(describeApiError(err, 'Could not start checkout.'));
      setPayingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Payment & WhatsApp Details Modal */}
      {selectedProjectForPayment && (
        <ProjectPaymentModal
          project={selectedProjectForPayment}
          user={user}
          autoOpenWhatsApp={false}
          onClose={() => setSelectedProjectForPayment(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal font-semibold">
            Client Portal
          </span>
          <h1 className="font-display text-3xl font-bold text-ink mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-light">
            Manage your project milestones, payment settlements, and direct communication.
          </p>
        </div>

        <Link
          to="/pricing"
          className="rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-signal-deep transition-all"
        >
          + Start New Project
        </Link>
      </div>

      {loading && (
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl glass-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {banner && (
        <div
          className={`mt-8 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
            banner.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span>{banner.message}</span>
          <button type="button" onClick={() => setBanner(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {payError && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{payError}</div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="mt-12 rounded-3xl border border-dashed border-ink/20 glass-card p-12 text-center text-muted-light">
          <div className="mb-3 flex justify-center text-muted-light"><FolderIcon className="h-8 w-8" /></div>
          <h3 className="font-display text-lg font-bold text-ink">No active projects yet</h3>
          <p className="text-sm mt-1">Select a service package to initiate your project.</p>
          <Link
            to="/pricing"
            className="mt-6 inline-block rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white"
          >
            Explore Pricing & Packages
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="mt-8 space-y-6">
          {projects.map((p) => {
            const isAwaitingPayment = p.status === 'Awaiting Payment' || p.status === 'Inquiry';
            return (
              <Reveal
                key={p.id}
                className="rounded-3xl glass-card p-6 sm:p-7 transition-all hover:border-signal/30 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-signal font-semibold">
                      Ref: #{p.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink mt-0.5">
                      {p.service?.name || 'Custom Development'}
                    </h2>
                    <p className="text-xs text-muted-light">
                      Package: <span className="font-medium text-ink">{p.package?.name}</span> · {p.country}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                      p.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : isAwaitingPayment
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-signal-soft text-signal'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Milestone Amount Grid */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3 rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-ink/5 dark:border-white/10 text-center">
                  <div>
                    <p className="text-[11px] font-mono text-muted-light uppercase">Total Quote</p>
                    <p className="font-mono text-base font-bold text-ink mt-0.5">
                      {p.currency} {Number(p.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="border-y sm:border-y-0 sm:border-x border-ink/10 py-2 sm:py-0">
                    <p className="text-[11px] font-mono text-emerald-800 uppercase font-semibold">50% Advance</p>
                    <p className="font-mono text-base font-bold text-emerald-600 mt-0.5">
                      {p.currency} {Number(p.advanceAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-muted-light uppercase">50% Remaining</p>
                    <p className="font-mono text-base font-bold text-ink mt-0.5">
                      {p.currency} {Number(p.remainingAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {p.advancePaid ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckMarkIcon className="h-3.5 w-3.5" />
                        <span>Advance paid</span>
                      </span>
                    ) : paymentSettings.stripePaymentsEnabled && (
                      <button
                        type="button"
                        disabled={payingId === p.id}
                        onClick={() => payNow(p, 'advance')}
                        className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-signal-deep transition-all disabled:opacity-60"
                      >
                        <CreditCardIcon className="h-3.5 w-3.5" /> {payingId === p.id ? 'Redirecting…' : 'Pay 50% Advance'}
                      </button>
                    )}

                    {paymentSettings.stripePaymentsEnabled && p.advancePaid && p.status === 'Final Payment' && (
                      <button
                        type="button"
                        disabled={payingId === p.id}
                        onClick={() => payNow(p, 'final')}
                        className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-signal-deep transition-all disabled:opacity-60"
                      >
                        <CreditCardIcon className="h-3.5 w-3.5" /> {payingId === p.id ? 'Redirecting…' : 'Pay Remaining Balance'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setOpenFilesId(openFilesId === p.id ? null : p.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-4 py-2.5 text-xs font-semibold text-ink hover:border-ink/30 transition-all"
                    >
                      <FolderIcon className="h-3.5 w-3.5" /> {openFilesId === p.id ? 'Hide Files' : 'Files'}
                    </button>
                  </div>

                  {paymentSettings.whatsappPaymentsEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedProjectForPayment(p)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all"
                    >
                      <ChatIcon className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  )}
                </div>

                {openFilesId === p.id && (
                  <div className="mt-4">
                    <ProjectFiles projectId={p.id} uploadCategories={['Brief', 'Payment Slip']} canDelete={false} />
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      )}

      {!loading && !error && projects.some((p) => p.status === 'Completed') && <ReviewSection />}
    </div>
  );
}
