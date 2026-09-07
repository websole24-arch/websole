import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import GradientText from '../components/common/GradientText';
import AnimatedCounter from '../components/common/AnimatedCounter';
import WhatsAppButton from '../components/common/WhatsAppButton';
import { GemIcon, KeyIcon, BoltIcon, ShieldIcon } from '../components/common/Icon';

const VALUES = [
  {
    title: 'Radical Price Transparency',
    description: 'We believe fair pricing depends on your local economy, not arbitrary currency conversions. We publish all our rates openly.',
    icon: GemIcon,
  },
  {
    title: '100% Client Ownership',
    description: 'No vendor lock-in. You own every line of code, design file, domain registration, and hosting configuration upon completion.',
    icon: KeyIcon,
  },
  {
    title: 'Direct Engineer Access',
    description: 'No layers of account managers. You collaborate directly with the designers and engineers building your digital product.',
    icon: BoltIcon,
  },
  {
    title: 'Milestone Protected Work',
    description: 'A disciplined 50% advance / 50% delivery model ensures commitment on both sides with crystal-clear deliverables.',
    icon: ShieldIcon,
  },
];

const TECHNOLOGIES = [
  { name: 'React / Next.js', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Styling' },
  { name: 'Node.js / Express', category: 'Backend' },
  { name: 'PostgreSQL / Supabase', category: 'Database' },
  { name: 'WordPress / Headless', category: 'CMS' },
  { name: 'Figma', category: 'UI/UX Design' },
  { name: 'Wix Studio', category: 'Rapid Web' },
  { name: 'Stripe / PayPal', category: 'Payments' },
];

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="About Web_Sole"
        title="We engineer digital products with"
        gradientWord="craft & clarity"
        description="A modern web design & engineering studio building bespoke websites, apps, and brand systems for ambitious businesses worldwide."
      />

      {/* Story & Mission Section */}
      <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
        <Reveal className="rounded-3xl glass-card p-8 sm:p-10">
          <span className="font-mono text-xs uppercase tracking-widest text-signal">Our Mission</span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink">
            Bridging international design excellence with local economic fairness.
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-light">
            Founded with a conviction that digital craftsmanship should be accessible globally, Web_Sole eliminates the traditional opacity of agency pricing. Whether you're a startup in Colombo or an enterprise in London, you receive the same world-class standard calibrated to your market.
          </p>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-light">
            We operate as a focused, agile team — eliminating bloated overheads so every dollar of your budget directly fuels design quality and technical robustness.
          </p>
        </Reveal>

        <Reveal delay={100} className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl glass-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-signal">
              <AnimatedCounter target={100} suffix="%" />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink">Code & Asset Ownership</p>
            <p className="mt-1 text-[11px] text-muted-light">Full intellectual property transfer</p>
          </div>

          <div className="rounded-3xl glass-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-coral">
              <AnimatedCounter target={50} prefix="50/" suffix="" />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink">Milestone Model</p>
            <p className="mt-1 text-[11px] text-muted-light">50% advance / 50% upon delivery</p>
          </div>

          <div className="rounded-3xl glass-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-ink">
              <span>0</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink">Hidden Fees</p>
            <p className="mt-1 text-[11px] text-muted-light">Transparent rate cards only</p>
          </div>

          <div className="rounded-3xl glass-card p-6 text-center">
            <div className="font-mono text-3xl sm:text-4xl font-bold text-signal">
              <span>Direct</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink">WhatsApp Access</p>
            <p className="mt-1 text-[11px] text-muted-light">Real-time collaboration</p>
          </div>
        </Reveal>
      </section>

      {/* Core Principles */}
      <section className="mt-24">
        <div className="text-center max-w-xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-signal">Principles</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">
            What guides our <GradientText variant="signal">work</GradientText>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal
              key={v.title}
              delay={i * 80}
              className="rounded-3xl glass-card p-8 transition-all duration-300 hover:shadow-xl hover:border-signal/30 hover:-translate-y-1"
            >
              <div className="mb-4 text-signal"><v.icon className="h-8 w-8" /></div>
              <h3 className="font-display text-xl font-bold text-ink">{v.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-light">{v.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mt-24 rounded-3xl glass-dark p-8 sm:p-12 text-white text-center relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-signal">Tech Stack</span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
            Modern tools built for scale & speed
          </h2>
          <p className="mt-3 text-sm text-white/70">
            We select optimal, maintainable technologies tailored specifically to your business constraints.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {TECHNOLOGIES.map((tech) => (
              <div
                key={tech.name}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-medium text-white backdrop-blur-md"
              >
                <span>{tech.name}</span>
                <span className="ml-2 text-[10px] font-mono text-white/50">{tech.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-20 text-center">
        <Reveal className="rounded-3xl glass-card p-8 sm:p-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Ready to build something <GradientText variant="signal">extraordinary?</GradientText>
          </h2>
          <p className="mt-3 text-muted-light max-w-md mx-auto text-sm">
            Reach out via WhatsApp or view prices for your country.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/pricing"
              className="rounded-xl bg-signal px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-signal-deep transition-all"
            >
              See Pricing
            </Link>
            <WhatsAppButton className="glass-card text-ink" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
