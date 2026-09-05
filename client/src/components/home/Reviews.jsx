import { useEffect, useState } from 'react';
import client from '../../api/client';
import Reveal from '../common/Reveal';
import StarRating from '../common/StarRating';
import GradientText from '../common/GradientText';

export default function Reviews() {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    client.get('/reviews').then(({ data }) => setReviews(data.reviews || [])).catch(() => setReviews([]));
  }, []);

  if (reviews === null) return null;

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            Verified Feedback
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            What our <GradientText variant="signal">clients say</GradientText>
          </h2>
          <p className="mt-3 max-w-xl text-muted-light">
            Direct reviews from business owners whose projects we've designed, built, and launched.
          </p>
        </div>

        {average && (
          <div className="flex items-center gap-3 rounded-2xl glass-card px-5 py-3 shadow-xs">
            <StarRating value={Math.round(Number(average))} size="h-5 w-5" />
            <div className="border-l border-ink/10 pl-3">
              <span className="font-mono text-base font-bold text-ink">{average}</span>
              <span className="text-xs text-muted-light ml-1.5">({reviews.length} reviews)</span>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-ink/15 glass-card p-12 text-center text-sm text-muted-light">
          No reviews published yet — verified clients can submit a review once their project completes.
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => {
            const initials = (r.name || 'C')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Reveal
                key={r.id}
                delay={i * 80}
                className="relative flex flex-col justify-between rounded-3xl glass-card p-7 transition-all duration-300 hover:shadow-xl hover:border-signal/30 hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle quotation mark background watermark */}
                <div className="absolute top-4 right-4 text-ink/5 font-display text-7xl select-none pointer-events-none">
                  “
                </div>

                <div className="relative z-10">
                  <StarRating value={r.rating} />
                  <p className="mt-4 text-sm leading-relaxed text-ink/90 italic">
                    "{r.comment}"
                  </p>
                </div>

                <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-ink/10 pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-signal to-indigo-600 font-display text-sm font-semibold text-white shadow-xs">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-display font-medium text-sm text-ink truncate">{r.name}</p>
                    <p className="text-xs text-muted-light truncate">
                      {[r.country, r.service].filter(Boolean).join(' · ') || 'Verified Client'}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
