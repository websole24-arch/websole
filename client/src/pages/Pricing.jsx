import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountry } from '../context/CountryContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import PageHeader from '../components/common/PageHeader';
import AdvancePaymentNotice from '../components/common/AdvancePaymentNotice';
import ServiceIcon from '../components/common/ServiceIcon';
import { CheckIcon } from '../components/common/Icon';
import Reveal from '../components/common/Reveal';
import ProjectPaymentModal from '../components/project/ProjectPaymentModal';

export default function Pricing() {
  const { country } = useCountry();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [startingId, setStartingId] = useState(null);
  const [startError, setStartError] = useState('');
  const [createdProject, setCreatedProject] = useState(null);

  const [pricingError, setPricingError] = useState('');

  useEffect(() => {
    setPricingError('');
    client
      .get('/pricing', { params: { country } })
      .then(({ data }) => {
        setPricing(data.pricing || []);
        setUsedFallback(data.usedFallback);
      })
      .catch((err) => {
        // Was a silent no-op — a real server error and "no pricing rows
        // yet" both rendered as the same empty "coming soon" state,
        // with nothing in the console to tell them apart.
        console.error('Failed to load pricing:', err);
        setPricingError(err.response?.data?.message || 'Could not load pricing right now.');
      });
  }, [country]);

  const startProject = async (entry) => {
    // If not logged in, persist selection and redirect to register.
    // localStorage, not sessionStorage: a brand-new registrant has to
    // click a confirmation link from their email client before they get
    // a session (see VerifyCallback.jsx) — that link is very often
    // opened in a different tab/window than the one they registered in,
    // and sessionStorage doesn't follow across tabs. localStorage does,
    // so the selection survives the round trip. Nothing sensitive lives
    // here (a service/package id, country, and a price), so there's no
    // added exposure from the longer-lived, cross-tab storage.
    if (!user) {
      const pendingSelection = {
        serviceId: entry.service?.id,
        serviceName: entry.service?.name,
        packageId: entry.package?.id,
        packageName: entry.package?.name,
        country,
        currency: entry.currency,
        price: entry.price,
      };
      localStorage.setItem('pending_project_selection', JSON.stringify(pendingSelection));
      navigate('/register', { state: { from: '/pricing', hasPendingProject: true } });
      return;
    }

    // Logged in user: create project immediately and show Payment & WhatsApp modal
    setStartError('');
    setStartingId(entry.id);
    try {
      const { data } = await client.post('/projects', {
        service: entry.service?.id,
        package: entry.package?.id,
        country,
      });
      // Store created project to open modal
      setCreatedProject(data.project);
    } catch (err) {
      setStartError(err.response?.data?.message || 'Could not start project. Please try again.');
    } finally {
      setStartingId(null);
    }
  };

  const byService = pricing.reduce((acc, p) => {
    const key = p.service?.name || 'Other';
    if (!acc[key]) acc[key] = { slug: p.service?.slug, entries: [] };
    acc[key].entries.push(p);
    return acc;
  }, {});
  const services = Object.entries(byService);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
      {/* Payment & WhatsApp Confirmation Modal */}
      {createdProject && (
        <ProjectPaymentModal
          project={createdProject}
          user={user}
          autoOpenWhatsApp={true}
          onClose={() => {
            setCreatedProject(null);
            navigate('/dashboard');
          }}
        />
      )}

      <PageHeader
        badge="Transparent Pricing"
        title="Rates tailored for"
        gradientWord={country}
        titleSuffix=""
        description={
          usedFallback
            ? `Standard international rate card applied for ${country}. Fixed prices with no surprises.`
            : `Dedicated local market pricing calibrated for ${country}. Fixed prices with no hidden fees.`
        }
      />

      {services.length > 1 && (
        <nav aria-label="Jump to service pricing" className="mt-4 flex flex-wrap justify-center gap-2">
          {services.map(([name, { slug }]) => (
            <a
              key={name}
              href={`#${slug || name}`}
              className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 text-xs font-medium text-ink/80 transition-all hover:border-signal/40 hover:text-signal hover:shadow-xs"
            >
              <ServiceIcon slug={slug} className="h-3.5 w-3.5" />
              <span>{name}</span>
            </a>
          ))}
        </nav>
      )}

      <AdvancePaymentNotice className="mx-auto mt-8 max-w-2xl" />
      {startError && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center text-sm text-red-600 max-w-xl mx-auto">
          {startError}
        </div>
      )}

      {services.map(([serviceName, { slug, entries }]) => {
        const sorted = entries.slice().sort((a, b) => a.price - b.price);
        const recommendedId = sorted.length >= 3 ? sorted[1].id : null;

        return (
          <div key={serviceName} id={slug || serviceName} className="mt-20 scroll-mt-28">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal/10 text-signal">
                <ServiceIcon slug={slug} className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">{serviceName}</h2>
                <p className="text-xs text-muted-light">Choose the tier that fits your scope</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3 items-stretch">
              {sorted.map((p) => {
                const isRecommended = p.id === recommendedId;
                return (
                  <Reveal
                    key={p.id}
                    className={
                      isRecommended
                        ? 'relative flex flex-col justify-between rounded-3xl border-2 border-signal bg-white dark:bg-white/5 p-7 shadow-xl shadow-signal/15 sm:-translate-y-2'
                        : 'relative flex flex-col justify-between rounded-3xl glass-card p-7 transition-all duration-300 hover:shadow-xl hover:border-signal/30'
                    }
                  >
                    {isRecommended && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-signal px-4 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-white shadow-md">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-widest text-signal">
                        {p.package?.name || 'Package'}
                      </span>
                      <h3 className="mt-1 font-display text-xl font-bold text-ink">{p.package?.name}</h3>

                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                          {p.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-muted-light">{p.currency}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-light">Fixed one-time milestone project</p>

                      <div className="mt-6 border-t border-ink/10 pt-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-light mb-3">
                          What's included:
                        </p>
                        <ul className="space-y-2.5 text-sm text-ink/85">
                          {p.package?.features?.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                              <span className="text-xs leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startProject(p)}
                      disabled={startingId === p.id}
                      className={
                        isRecommended
                          ? 'mt-8 w-full rounded-xl bg-signal py-3 text-sm font-semibold text-white shadow-md hover:bg-signal-deep active:scale-95 transition-all disabled:opacity-60'
                          : 'mt-8 w-full rounded-xl border border-ink/15 py-3 text-sm font-semibold text-ink hover:border-signal hover:text-signal active:scale-95 transition-all disabled:opacity-60'
                      }
                    >
                      {startingId === p.id ? 'Saving Project…' : user ? 'Start & View Payment Details' : 'Create Account & Start'}
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        );
      })}

      {pricing.length === 0 && (
        <div className="mt-16 rounded-3xl border border-dashed border-ink/20 glass-card p-12 text-center text-sm text-muted-light">
          {pricingError || 'Pricing details coming soon.'}
        </div>
      )}
    </div>
  );
}
