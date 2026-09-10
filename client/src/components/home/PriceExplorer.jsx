import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCountry } from '../../context/CountryContext';
import client from '../../api/client';
import useTilt from '../../hooks/useTilt';
import { PinIcon, CheckIcon } from '../common/Icon';
import GradientText from '../common/GradientText';

export default function PriceExplorer() {
  const { country } = useCountry();
  const [services, setServices] = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const tilt = useTilt(3);

  useEffect(() => {
    client
      .get('/services')
      .then(({ data }) => {
        setServices(data.services || []);
        setActiveService((prev) => prev || data.services?.[0]?.id || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    client
      .get('/pricing', { params: { country } })
      .then(({ data }) => {
        setPricing(data.pricing || []);
        setUsedFallback(data.usedFallback);
      })
      .catch(() => setPricing([]))
      .finally(() => setLoading(false));
  }, [country]);

  const rows = useMemo(
    () =>
      (pricing || [])
        .filter((p) => p.service?.id === activeService)
        .slice()
        .sort((a, b) => a.price - b.price),
    [pricing, activeService]
  );

  const activeSlug = services.find((s) => s.id === activeService)?.slug;

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="tilt relative rounded-3xl border border-white/15 bg-[#12141C] p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
    >
      {/* Decorative ambient glowing orb in dark card */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/25 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-coral/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-signal">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
            Live Price Calculator
          </span>
          <p className="text-xs text-white/50 mt-0.5">Rates tailored to your local market</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-xs text-white backdrop-blur-md">
          <PinIcon className="h-3 w-3 text-coral" />
          {country}
        </span>
      </div>

      {/* Service selection pills */}
      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveService(s.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeService === s.id
                ? 'bg-gradient-to-r from-signal to-indigo-600 text-white shadow-md shadow-signal/30 scale-105'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Pricing list */}
      <div className="relative z-10 mt-6 space-y-3">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
          ))}

        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            Pricing details coming soon.
          </div>
        )}

        {!loading &&
          rows.map((p, idx) => {
            const isFeatured = idx === 1 || rows.length === 1;
            return (
              <Link
                key={p.id}
                to={`/pricing${activeSlug ? `#${activeSlug}` : ''}`}
                className={`flex items-center justify-between rounded-2xl p-4 transition-all duration-200 ${
                  isFeatured
                    ? 'border border-signal/40 bg-gradient-to-r from-signal/15 to-white/5 shadow-inner hover:border-signal/70'
                    : 'border border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{p.package?.name}</span>
                    {isFeatured && (
                      <span className="rounded-full bg-signal/30 px-2 py-0.5 text-[10px] font-mono text-signal uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">Fixed price · 50% advance</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg sm:text-xl font-bold tracking-tight text-white">
                    <span className="text-xs font-normal text-white/60 mr-1">{p.currency}</span>
                    {p.price.toLocaleString()}
                  </div>
                </div>
              </Link>
            );
          })}
      </div>

      <p className="relative z-10 mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
        {usedFallback
          ? `Showing standard international pricing tier for ${country}.`
          : `Dedicated regional rate applied for ${country}.`}
      </p>
    </div>
  );
}
