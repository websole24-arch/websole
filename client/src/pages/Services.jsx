import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import ServiceIcon from '../components/common/ServiceIcon';
import GradientText from '../components/common/GradientText';
import WhatsAppButton from '../components/common/WhatsAppButton';
import useTilt from '../hooks/useTilt';
import { ArrowRightIcon, CheckMarkIcon } from '../components/common/Icon';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/services')
      .then(({ data }) => setServices(data.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Our Services"
        title="Specialized digital craft"
        gradientWord="for every scale"
        description="Whether you need a bespoke web application, a conversion-focused UI redesign, or a fast WordPress site, our studio delivers production-grade solutions."
      />

      {loading && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl glass-card" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal
              key={s.slug || s.id}
              delay={i * 80}
              className="group relative flex flex-col justify-between rounded-3xl glass-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-signal/15 hover:border-signal/40 hover:-translate-y-1.5 overflow-hidden"
            >
              {/* Subtle hover background accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-signal/10 blur-2xl group-hover:bg-signal/20 transition-all duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/10 text-signal shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-signal group-hover:text-white">
                    <ServiceIcon slug={s.slug} icon={s.icon} className="h-7 w-7" />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-dark group-hover:text-signal transition-colors">
                    0{i + 1}
                  </span>
                </div>

                <h2 className="mt-6 font-display text-2xl font-bold text-ink group-hover:text-signal transition-colors">
                  {s.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-light">
                  {s.description || s.shortDescription}
                </p>

                {s.examples?.length > 0 && (
                  <div className="mt-6 border-t border-ink/5 pt-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-light mb-2">
                      Deliverables Include:
                    </p>
                    <ul className="space-y-1.5 text-xs text-ink/80">
                      {s.examples.slice(0, 3).map((ex) => (
                        <li key={ex} className="flex items-center gap-1.5">
                          <CheckMarkIcon className="text-signal h-3 w-3" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between pt-4 border-t border-ink/10">
                <Link
                  to={`/${s.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal hover:underline"
                >
                  <span>Service Details</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
                <Link
                  to={`/pricing#${s.slug}`}
                  className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-medium text-ink hover:bg-signal hover:text-white transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {/* Bottom Consultation Banner */}
      <section className="mt-20">
        <Reveal className="rounded-3xl glass-dark p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Need a custom scope or blended service?
            </h3>
            <p className="mt-3 text-sm text-white/70">
              We often combine UI/UX design with custom full-stack development. Message us on WhatsApp to discuss a tailored scope.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <WhatsAppButton className="bg-signal text-white hover:bg-signal-deep" />
              <Link
                to="/contact"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Start Inquiry
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
