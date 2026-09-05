import { useEffect, useState } from 'react';
import { SRI_LANKA, INTERNATIONAL } from '../../context/CountryContext';
import client from '../../api/client';
import Reveal from '../common/Reveal';

// The pricing model only has two tiers now — Sri Lanka and International —
// so this compares those two directly rather than a longer country list.
const TIERS = [SRI_LANKA, INTERNATIONAL];

export default function RateCompare() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      TIERS.map((country) =>
        client
          .get('/pricing', { params: { country } })
          .then(({ data }) => {
            // Skip Sri Lanka if it has no rate of its own yet — showing it
            // next to International with an identical (fallback) number
            // would just be confusing, not informative.
            if (data.usedFallback && country === SRI_LANKA) return null;
            const basic = (data.pricing || [])
              .slice()
              .sort((a, b) => a.price - b.price)
              .find((p) => p.package?.name === 'Basic') || data.pricing[0];
            return basic ? { country, currency: basic.currency, price: basic.price } : null;
          })
          .catch(() => null)
      )
    ).then((results) => setRows(results.filter(Boolean))).finally(() => setLoading(false));
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
      {loading &&
        [0, 1].map((i) => <div key={i} className="h-24 animate-pulse bg-paper" />)}
      {!loading &&
        rows.map((r, i) => (
          <Reveal key={r.country} delay={i * 70} className="bg-paper px-5 py-5">
            <p className="text-sm text-muted-light">{r.country}</p>
            <p className="mt-1.5 font-mono text-xl tabular-nums text-ink">
              {r.currency} {r.price.toLocaleString()}
            </p>
          </Reveal>
        ))}
    </div>
  );
}
