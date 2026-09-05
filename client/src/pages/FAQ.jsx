import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import WhatsAppButton from '../components/common/WhatsAppButton';
import GradientText from '../components/common/GradientText';

const FAQS = [
  {
    category: 'Pricing',
    q: 'How does country-specific pricing work?',
    a: 'We establish distinct pricing tiers tailored to regional purchasing power rather than simply converting from USD. When you visit our website, we detect your country (or let you choose it) and display fixed, transparent prices for every package without hidden extras.',
  },
  {
    category: 'Payments',
    q: 'Why do you require a 50% advance payment?',
    a: 'The 50% advance secures your dedicated development sprint and covers initial infrastructure, design mockups, and engineering setup. The remaining 50% balance is only invoiced once the final project is demonstrated on our staging server and approved by you.',
  },
  {
    category: 'Payments',
    q: 'What payment methods do you accept?',
    a: 'We accept international credit/debit cards via Stripe, PayPal, and direct bank wire transfers. For clients in Sri Lanka and select regions, direct local bank deposits are also supported.',
  },
  {
    category: 'Process',
    q: 'How long does a standard website project take?',
    a: 'Standard portfolio or business websites typically take 1 to 2 weeks. Custom web applications, e-commerce stores, or complex SaaS platforms usually take between 3 to 6 weeks depending on requirements and review speed.',
  },
  {
    category: 'Process',
    q: 'How many rounds of revisions do I get?',
    a: 'Our packages include iterative reviews throughout the design and staging phases. Standard packages include up to 3 comprehensive revision rounds before sign-off, ensuring the finished result matches your vision.',
  },
  {
    category: 'Technical',
    q: 'Do I get full ownership of the code and assets?',
    a: 'Yes, 100%. Once final settlement is complete, we transfer full repository rights, Figma source files, domain configurations, and credentials to you. You are never locked into our studio.',
  },
  {
    category: 'Technical',
    q: 'Will my website be mobile-responsive and SEO-optimized?',
    a: 'All our websites are built mobile-first, ensuring high performance across phones, tablets, and desktops. We implement semantic HTML, meta tags, OpenGraph previews, fast asset compression, and clean schemas for optimal search engine ranking.',
  },
  {
    category: 'Technical',
    q: 'Do you provide maintenance and post-launch support?',
    a: 'Every project comes with 30 days of complimentary post-launch bug fixing and support. We also offer monthly retainer plans for continuous feature development, security updates, and content management.',
  },
];

const CATEGORIES = ['All', 'Pricing', 'Payments', 'Process', 'Technical'];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndices, setOpenIndices] = useState([0, 1]); // first two open by default

  const toggleAccordion = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFaqs = FAQS.filter(
    (faq) => activeCategory === 'All' || faq.category === activeCategory
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="FAQ"
        title="Frequently asked"
        gradientWord="questions"
        description="Everything you need to know about our country-adapted pricing, 50% milestone model, and development process."
      />

      {/* Category filter pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-signal text-white shadow-md shadow-signal/25 scale-105'
                : 'glass-card text-ink/80 hover:bg-white dark:hover:bg-white/10 hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion list */}
      <div className="mt-10 space-y-4">
        {filteredFaqs.map((f, i) => {
          const isOpen = openIndices.includes(i);
          return (
            <Reveal
              key={f.q}
              delay={i * 50}
              className={`rounded-2xl glass-card transition-all duration-300 overflow-hidden ${
                isOpen ? 'border-signal/30 shadow-md' : 'hover:border-signal/20'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(i)}
                className="flex w-full items-center justify-between p-6 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-base sm:text-lg font-semibold text-ink pr-4">
                  {f.q}
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-ink transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-signal text-white' : ''
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm sm:text-base leading-relaxed text-muted-light border-t border-ink/5 animate-slide-down">
                  {f.a}
                </div>
              )}
            </Reveal>
          );
        })}
      </div>

      {/* Support CTA */}
      <section className="mt-16 rounded-3xl glass-card p-8 text-center sm:p-10 border border-signal/20">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Have a unique question?
        </h3>
        <p className="mt-2 text-sm text-muted-light max-w-md mx-auto">
          We're always available on WhatsApp to discuss your project requirements directly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <WhatsAppButton className="bg-signal text-white hover:bg-signal-deep" />
          <Link
            to="/contact"
            className="rounded-xl border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:bg-black/5 transition-colors"
          >
            Send Inquiry Form
          </Link>
        </div>
      </section>
    </div>
  );
}
