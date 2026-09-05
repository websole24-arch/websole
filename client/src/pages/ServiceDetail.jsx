import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Reveal from '../components/common/Reveal';
import ServiceIcon from '../components/common/ServiceIcon';
import GradientText from '../components/common/GradientText';
import WhatsAppButton from '../components/common/WhatsAppButton';
import AdvancePaymentNotice from '../components/common/AdvancePaymentNotice';
import { CheckMarkIcon } from '../components/common/Icon';

export default function ServiceDetail({ slug }) {
  const [service, setService] = useState(null);
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    setStatus('loading');
    client
      .get(`/services/${slug}`)
      .then(({ data }) => {
        setService(data.service);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-signal/20 border-t-signal" />
        <p className="mt-4 font-mono text-sm text-muted-light">Loading service specification…</p>
      </div>
    );
  }

  if (status === 'error' || !service) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="rounded-3xl glass-card p-10">
          <h1 className="font-display text-2xl font-bold text-ink">Service not found</h1>
          <p className="mt-3 text-sm text-muted-light">
            This service isn't available right now.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-block rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
      {/* Breadcrumbs */}
      <nav className="pt-8 text-xs font-mono text-muted-light flex items-center gap-2">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-ink">Services</Link>
        <span>/</span>
        <span className="text-signal font-semibold">{service.name}</span>
      </nav>

      {/* Hero Section */}
      <section className="mt-8 rounded-3xl glass-card p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-signal/15 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-signal to-indigo-600 text-white shadow-lg shadow-signal/25">
            <ServiceIcon slug={service.slug} className="h-10 w-10" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-signal-soft px-3 py-1 text-xs font-mono font-semibold text-signal uppercase tracking-wider">
              Service Overview
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
              {service.name}
            </h1>
          </div>
        </div>

        <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-light">
          {service.description || service.shortDescription}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6">
          <Link
            to={`/pricing#${service.slug}`}
            className="rounded-xl bg-signal px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-signal-deep transition-all"
          >
            Check Country Rates
          </Link>
          <WhatsAppButton service={service.name} className="glass-card text-ink hover:border-signal/40" />
        </div>
      </section>

      {/* Deliverables & Examples */}
      {service.examples?.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink">
            What's included in <GradientText variant="signal">{service.name}</GradientText>
          </h2>
          <p className="mt-2 text-sm text-muted-light">
            Core deliverables and capabilities provided across our service tiers.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {service.examples.map((ex, i) => (
              <Reveal
                key={ex}
                delay={i * 60}
                className="flex items-start gap-3.5 rounded-2xl glass-card p-5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-soft text-signal text-xs font-bold mt-0.5">
                  <CheckMarkIcon className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium text-ink leading-relaxed">{ex}</span>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Advance Notice Banner */}
      <div className="mt-12">
        <AdvancePaymentNotice />
      </div>

      {/* Bottom CTA Card */}
      <section className="mt-12 text-center rounded-3xl glass-dark p-8 sm:p-12 text-white">
        <h3 className="font-display text-2xl font-bold text-white">
          Ready to begin your {service.name} project?
        </h3>
        <p className="mt-2 text-sm text-white/70 max-w-md mx-auto">
          View transparent fixed rates for your location and initiate your project in minutes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to={`/pricing#${service.slug}`}
            className="rounded-xl bg-signal px-6 py-3 text-sm font-semibold text-white hover:bg-signal-deep transition-all shadow-md"
          >
            Explore Pricing
          </Link>
          <Link
            to="/contact"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Submit Inquiry
          </Link>
        </div>
      </section>
    </div>
  );
}
