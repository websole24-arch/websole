import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import GradientText from '../components/common/GradientText';
import AdvancePaymentNotice from '../components/common/AdvancePaymentNotice';
import WhatsAppButton from '../components/common/WhatsAppButton';

const STEPS = [
  {
    step: '01',
    title: 'Discovery & Requirements',
    timeframe: '1 – 3 Days',
    summary: 'We align on project goals, target audience, brand assets, and technical specifications.',
    clientRole: 'Provide brief, logo assets, reference sites, and functional wishlists.',
    studioRole: 'Conduct discovery analysis, define project scope, and confirm fixed country pricing.',
    icon: '🎯',
  },
  {
    step: '02',
    title: 'Quotation & 50% Milestone Deposit',
    timeframe: 'Instant upon agreement',
    summary: 'Clear written agreement and 50% initial payment to book development sprint.',
    clientRole: 'Review project agreement and submit 50% deposit.',
    studioRole: 'Issue official invoice, set up client portal access, and initialize project repository.',
    icon: '💳',
  },
  {
    step: '03',
    title: 'Interactive Design & Development',
    timeframe: '1 – 3 Weeks',
    summary: 'We design high-fidelity prototypes and build production-ready, responsive code.',
    clientRole: 'Review interactive staging previews and provide consolidated feedback.',
    studioRole: 'Sprint-based engineering, cross-device testing, SEO optimization, and live demo deployment.',
    icon: '⚡',
  },
  {
    step: '04',
    title: 'Revisions & Quality Assurance',
    timeframe: '3 – 5 Days',
    summary: 'Fine-tuning design elements, copy adjustments, performance audits, and bug fixes.',
    clientRole: 'Final sign-off on design, features, forms, and mobile usability.',
    studioRole: 'Apply revisions, run lighthouse speed audits, security checks, and payment integrations.',
    icon: '🔍',
  },
  {
    step: '05',
    title: 'Final Settlement & Complete Handover',
    timeframe: '1 Day',
    summary: 'Remaining 50% balance cleared, domain linked, and full code & asset rights transferred.',
    clientRole: 'Submit remaining balance and take custody of credentials.',
    studioRole: 'Live domain launch, transfer GitHub repo/Figma files, and provide 30-day post-launch support.',
    icon: '🚀',
  },
];

export default function Process() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Our Workflow"
        title="A structured, transparent"
        gradientWord="delivery process"
        description="From initial discovery to final deployment, here is exactly how your project moves through our studio with total clarity."
      />

      <AdvancePaymentNotice className="mx-auto max-w-3xl mb-16" />

      {/* Timeline Section */}
      <div className="relative mt-8 space-y-8">
        {/* Visual timeline connector line for desktop */}
        <div className="absolute left-8 top-12 bottom-12 hidden md:block w-0.5 bg-gradient-to-b from-signal via-purple-400 to-coral opacity-30" />

        {STEPS.map((s, i) => (
          <Reveal
            key={s.step}
            delay={i * 90}
            className="relative flex flex-col md:flex-row gap-6 md:gap-10 rounded-3xl glass-card p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:border-signal/30"
          >
            {/* Step badge / icon */}
            <div className="flex md:flex-col items-center gap-3 shrink-0">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-signal to-indigo-600 text-2xl shadow-md text-white">
                {s.icon}
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-signal bg-signal-soft px-2.5 py-1 rounded-full">
                Step {s.step}
              </span>
            </div>

            {/* Step details */}
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">{s.title}</h2>
                <span className="rounded-full border border-ink/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 font-mono text-xs text-muted-light">
                  {s.timeframe}
                </span>
              </div>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-light">{s.summary}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 rounded-2xl bg-white/60 dark:bg-white/5 p-4 border border-ink/5 dark:border-white/10 text-xs">
                <div>
                  <span className="font-mono uppercase font-bold text-ink/70">Your Input:</span>
                  <p className="mt-1 text-muted-light">{s.clientRole}</p>
                </div>
                <div>
                  <span className="font-mono uppercase font-bold text-signal">Our Deliverable:</span>
                  <p className="mt-1 text-muted-light">{s.studioRole}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Bottom CTA Card */}
      <section className="mt-20">
        <Reveal className="rounded-3xl glass-dark p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Ready to start Step 01?
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Submit an inquiry or check local pricing to get your project moving today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/pricing"
                className="rounded-xl bg-signal px-6 py-3 text-sm font-semibold text-white hover:bg-signal-deep transition-all shadow-md"
              >
                View Pricing
              </Link>
              <WhatsAppButton className="bg-white/10 text-white hover:bg-white/20 border border-white/20" />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
