import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../api/client';
import { useCountry } from '../context/CountryContext';
import PriceExplorer from '../components/home/PriceExplorer';
import RecentProjects from '../components/home/RecentProjects';
import ServiceCard from '../components/home/ServiceCard';
import Reviews from '../components/home/Reviews';
import WhatsAppButton from '../components/common/WhatsAppButton';
import AdvancePaymentNotice from '../components/common/AdvancePaymentNotice';
import Reveal from '../components/common/Reveal';
import AnimatedCounter from '../components/common/AnimatedCounter';
import GradientText from '../components/common/GradientText';
import RotatingText from '../components/common/RotatingText';
import AnimatedText from '../components/common/AnimatedText';
import {
  CheckIcon,
  PinIcon,
  ArrowRightIcon,
  TargetIcon,
  CreditCardIcon,
  BoltIcon,
  SearchIcon,
  RocketIcon,
  GlobeIcon,
  ChatIcon,
  ChartLineIcon,
  ShieldIcon,
} from '../components/common/Icon';

const PROCESS_STEPS = [
  { title: 'Inquiry & Requirements', body: 'Share your vision, brand assets, and choose your preferred package or service.' },
  { title: 'Quotation & 50% Advance', body: 'Honest upfront price in your currency. Work kicks off immediately upon deposit.' },
  { title: 'Design & Build Sprints', body: 'Follow live progress through your interactive client dashboard.' },
  { title: 'Revisions & Fine-tuning', body: 'Review interactive prototypes and request modifications until satisfied.' },
  { title: 'Final Handover', body: 'Remaining milestone settled, full source code and domains transferred.' },
];

// Moved here from the standalone /process page (see App.jsx) — the full,
// step-by-step breakdown now lives under the reviews section as an
// auto-sliding row instead of a separate destination page.
const DETAILED_PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discovery & Requirements',
    timeframe: '1 – 3 Days',
    summary: 'We align on project goals, target audience, brand assets, and technical specifications.',
    clientRole: 'Provide brief, logo assets, reference sites, and functional wishlists.',
    studioRole: 'Conduct discovery analysis, define project scope, and confirm fixed country pricing.',
    icon: TargetIcon,
  },
  {
    step: '02',
    title: 'Quotation & 50% Milestone Deposit',
    timeframe: 'Instant upon agreement',
    summary: 'Clear written agreement and 50% initial payment to book development sprint.',
    clientRole: 'Review project agreement and submit 50% deposit.',
    studioRole: 'Issue official invoice, set up client portal access, and initialize project repository.',
    icon: CreditCardIcon,
  },
  {
    step: '03',
    title: 'Interactive Design & Development',
    timeframe: '1 – 3 Weeks',
    summary: 'We design high-fidelity prototypes and build production-ready, responsive code.',
    clientRole: 'Review interactive staging previews and provide consolidated feedback.',
    studioRole: 'Sprint-based engineering, cross-device testing, SEO optimization, and live demo deployment.',
    icon: BoltIcon,
  },
  {
    step: '04',
    title: 'Revisions & Quality Assurance',
    timeframe: '3 – 5 Days',
    summary: 'Fine-tuning design elements, copy adjustments, performance audits, and bug fixes.',
    clientRole: 'Final sign-off on design, features, forms, and mobile usability.',
    studioRole: 'Apply revisions, run lighthouse speed audits, security checks, and payment integrations.',
    icon: SearchIcon,
  },
  {
    step: '05',
    title: 'Final Settlement & Complete Handover',
    timeframe: '1 Day',
    summary: 'Remaining 50% balance cleared, domain linked, and full code & asset rights transferred.',
    clientRole: 'Submit remaining balance and take custody of credentials.',
    studioRole: 'Live domain launch, transfer GitHub repo/Figma files, and provide 30-day post-launch support.',
    icon: RocketIcon,
  },
];

const VALUE_PROPS = [
  {
    title: 'Priced for Your Local Market',
    body: 'Fair regional rates instead of blind currency conversions. Explore transparent rates for any country anytime.',
    icon: GlobeIcon,
  },
  {
    title: 'Direct WhatsApp Communication',
    body: 'Skip rigid ticketing queues. Talk straight with your lead designer and developer on WhatsApp.',
    icon: ChatIcon,
  },
  {
    title: 'Live Interactive Dashboard',
    body: 'Track milestones, view payment confirmations, download assets, and monitor project status in real-time.',
    icon: ChartLineIcon,
  },
  {
    title: 'Protected 50% Milestone Policy',
    body: '50% deposit to commence work, and the remaining 50% only when the project is reviewed and ready for launch.',
    icon: ShieldIcon,
  },
];

export default function Home() {
  const { country, detecting } = useCountry();
  const [services, setServices] = useState([]);
  const location = useLocation();

  useEffect(() => {
    client.get('/services').then(({ data }) => setServices(data.services || [])).catch(() => {});
  }, []);

  // Needed because this is a client-side route change, not a full page
  // load — the browser only auto-scrolls to a URL hash on the latter.
  // Covers both the Navbar's Process link (arriving from another page)
  // and the redirect from the old /process URL (see App.jsx). Retried a
  // couple of times over the following second, not just once: images and
  // fetched sections further down the page (RecentProjects, PriceExplorer)
  // can still be loading in and shifting layout, which would otherwise
  // leave a single early scroll landing short of the target.
  useEffect(() => {
    if (!location.hash) return;
    const scrollToHash = () => {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const raf = requestAnimationFrame(scrollToHash);
    const t1 = setTimeout(scrollToHash, 400);
    const t2 = setTimeout(scrollToHash, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.hash]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/4 -z-10 h-72 w-72 rounded-full bg-signal/15 blur-3xl animate-float-slow" />
        <div className="absolute top-40 right-1/4 -z-10 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />

        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <Reveal variant="fade-up">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-wider uppercase text-signal shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
                  International Design Studio
                </span>
                {!detecting && country && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal-soft/80 border border-signal/20 text-xs font-medium text-signal animate-fade-in">
                    <PinIcon className="h-3 w-3" />
                    Viewing prices for {country}
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.08]">
                Websites & design, <br className="hidden sm:inline" />
                priced{' '}
                <RotatingText
                  words={['transparently', 'honestly', 'fairly', 'locally']}
                  gradient="rainbow"
                  interval={2600}
                />{' '}
                for your country.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-light">
                Custom web applications, UI/UX design, WordPress, and branding — calibrated with honest local pricing, dedicated support, and milestone-backed delivery.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/pricing"
                  className="rounded-xl bg-signal px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-signal/25 transition-all duration-200 hover:bg-signal-deep hover:shadow-xl hover:shadow-signal/35 active:scale-95"
                >
                  Explore Rates for {country || 'Your Region'}
                </Link>
                <Link
                  to="/contact"
                  className="rounded-xl glass-card px-7 py-3.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-signal/40 hover:text-signal active:scale-95 shadow-xs"
                >
                  Start a Project
                </Link>
              </div>

              {/* Animated Statistics */}
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-ink/10 pt-8">
                <div className="rounded-2xl p-2">
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-ink flex items-baseline">
                    <AnimatedCounter target={services.length || 5} />
                    <span className="text-signal">+</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-light">Core Services</p>
                </div>
                <div className="rounded-2xl p-2">
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-ink">
                    <span>50</span><span className="text-signal">%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-light">Milestone Deposit</p>
                </div>
                <div className="rounded-2xl p-2">
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-ink flex items-baseline">
                    <AnimatedCounter target={100} />
                    <span className="text-signal">%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-light">Price Transparency</p>
                </div>
                <div className="rounded-2xl p-2">
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-ink flex items-baseline">
                    <span>24</span><span className="text-xs text-signal font-sans ml-0.5">/7</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-light">Direct Chat</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <PriceExplorer />
          </Reveal>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal" />
              What We Build
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Comprehensive <GradientText variant="signal">Design & Development</GradientText>
            </h2>
          </div>
          <Link to="/services" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-signal hover:underline">
            <span>Browse All Services</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ServiceCard key={s.slug || s.id} service={s} index={i} />
          ))}
          {services.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-ink/15 glass-card p-8 text-center text-sm text-muted-light">
              Services are being updated — check back shortly.
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="relative border-y border-ink/10 bg-gradient-to-b from-white/40 to-paper/60 dark:from-transparent dark:to-paper/60 backdrop-blur-xs py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal" />
              Workflow
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              How a project <GradientText variant="signal">comes to life</GradientText>
            </h2>
            <p className="mt-3 text-muted-light">
              A predictable, milestone-driven workflow designed to keep you in control at every stage.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal
                key={step.title}
                delay={i * 80}
                className="group relative flex flex-col justify-between rounded-2xl glass-card p-6 transition-all duration-300 hover:shadow-lg hover:border-signal/40 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal-soft font-mono text-xs font-bold text-signal">
                      0{i + 1}
                    </span>
                    {i < PROCESS_STEPS.length - 1 && (
                      <span className="hidden lg:block text-ink/20"><ArrowRightIcon className="h-3.5 w-3.5" /></span>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink group-hover:text-signal transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-light">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a href="#process-details" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-signal hover:underline">
              <span>View Detailed Process Guide</span>
              <ArrowRightIcon className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Recent Projects Showcase */}
      <RecentProjects />

      {/* Value Props Section */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            Our Guarantee
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Why companies <GradientText variant="signal">choose Web_Sole</GradientText>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {VALUE_PROPS.map((v, i) => (
            <Reveal
              key={v.title}
              delay={i * 80}
              className="flex gap-5 rounded-3xl glass-card p-8 transition-all duration-300 hover:shadow-xl hover:border-signal/30 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-signal/10 text-signal shadow-xs">
                <v.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-light">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <Reviews />

      {/* Detailed Process Timeline — moved here from the standalone
          /process page (see App.jsx). Static grid, same shape as the
          Value Props section below (no sliding/auto-scroll). */}
      <section id="process-details" className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            Our Workflow
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            A structured, transparent <GradientText variant="signal">delivery process</GradientText>
          </h2>
          <p className="mt-3 text-muted-light">
            From initial discovery to final deployment, here is exactly how your project moves through our studio with total clarity.
          </p>
        </div>

        <AdvancePaymentNotice className="mx-auto max-w-3xl mt-8" />

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {DETAILED_PROCESS_STEPS.map((s, i) => (
            <Reveal
              key={s.step}
              delay={i * 80}
              className="flex gap-5 rounded-3xl glass-card p-8 transition-all duration-300 hover:shadow-xl hover:border-signal/30 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-signal/10 text-signal shadow-xs">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  <span className="text-signal">Step {s.step} · </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-light">{s.summary}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <Reveal className="relative overflow-hidden rounded-3xl border border-signal/20 bg-gradient-to-br from-signal/10 via-white to-coral/10 dark:from-signal/15 dark:via-paper dark:to-coral/15 p-8 sm:p-16 text-center shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-signal/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-coral/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full glass-pill text-xs font-mono uppercase tracking-widest text-signal mb-4">
              Get Started Today
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink">
              Ready to elevate your <br className="hidden sm:inline" />
              <GradientText variant="rainbow">digital presence?</GradientText>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-light leading-relaxed">
              Explore your country's fixed pricing, select a package, or talk directly with us on WhatsApp for a custom quotation.
            </p>

            <AdvancePaymentNotice className="mt-6 text-left" />

            <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
              <Link
                to="/pricing"
                className="rounded-xl bg-signal px-8 py-3.5 font-semibold text-white shadow-lg shadow-signal/25 transition-all hover:bg-signal-deep hover:shadow-xl active:scale-95"
              >
                View Country Pricing
              </Link>
              <WhatsAppButton className="glass-card shadow-sm hover:border-signal/40" />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
