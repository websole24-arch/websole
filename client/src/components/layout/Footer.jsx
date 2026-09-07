import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../../api/client';
import WhatsAppButton from '../common/WhatsAppButton';
import GradientText from '../common/GradientText';
import { ArrowRightIcon } from '../common/Icon';

const serviceLinks = [
  { to: '/custom-website-development', label: 'Custom Web Apps' },
  { to: '/ui-ux-design', label: 'UI/UX Design' },
  { to: '/wordpress-development', label: 'WordPress Solutions' },
  { to: '/wix-development', label: 'Wix Development' },
  { to: '/graphic-design', label: 'Brand & Graphic Design' },
];

// Shown immediately, and kept as the fallback if the API call fails (e.g.
// the Supabase project is paused — see README's "Known limitations"). The
// Footer's Free Tools column should never come up empty for a real
// visitor just because of a transient fetch failure. Editable going
// forward from the admin dashboard's Free Tools tab.
const DEFAULT_FREE_TOOLS_LINKS = [
  { to: '/tools', label: 'Meta Tag & SEO Generator' },
  { to: '/tools', label: 'Color Contrast Checker' },
  { to: '/tools', label: '50% Milestone Calculator' },
  { to: '/tools', label: 'Aspect Ratio Tool' },
  { to: '/tools', label: 'All Free Tools Hub' },
];

const companyLinks = [
  { to: '/about', label: 'About Studio' },
  { to: '/#process-details', label: 'Our Process' },
  { to: '/pricing', label: 'Country Pricing' },
  { to: '/portfolio', label: 'Featured Work' },
  { to: '/blog', label: 'Insights & Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Get in Touch' },
];

const legalLinks = [
  { to: '/terms', label: 'Terms of Service' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund-policy', label: 'Refund & Delivery Policy' },
];

function LinkColumn({ title, items }) {
  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink/70">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((l, index) => {
          const isExternal = /^https?:\/\//i.test(l.to);
          const linkClassName =
            'group inline-flex items-center text-sm text-muted-light transition-all duration-200 hover:text-signal hover:translate-x-1';
          const arrow = (
            <span className="opacity-0 -ml-2 mr-1 flex items-center transition-all duration-200 group-hover:opacity-100 group-hover:ml-0 text-signal">
              <ArrowRightIcon className="h-3 w-3" />
            </span>
          );
          return (
            <li key={`${l.to}-${index}`}>
              {isExternal ? (
                <a href={l.to} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                  {arrow}
                  {l.label}
                </a>
              ) : (
                <Link to={l.to} className={linkClassName}>
                  {arrow}
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [freeToolsLinks, setFreeToolsLinks] = useState(DEFAULT_FREE_TOOLS_LINKS);

  useEffect(() => {
    client
      .get('/free-tools')
      .then(({ data }) => {
        if (data.tools.length > 0) {
          setFreeToolsLinks(data.tools.map((t) => ({ to: t.href, label: t.label })));
        }
      })
      // Network hiccup or an empty admin-managed list either way — keep
      // showing the default links rather than an empty Footer column.
      .catch(() => {});
  }, []);

  return (
    <footer className="relative mt-20 border-t border-ink/10 bg-white/40 dark:bg-paper/60 backdrop-blur-md overflow-hidden">
      {/* Top gradient accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-signal via-purple-500 to-coral opacity-80" />

      {/* Decorative background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-signal/5 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#12141C] to-slate-800 text-white shadow-sm">
                <span className="font-display font-bold text-sm tracking-tight text-white">W</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">
                websole<span className="text-signal">.</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-light">
              Crafting premium digital experiences, web apps, and design systems for clients worldwide — transparently priced for your country.
            </p>
            <div className="pt-2">
              <WhatsAppButton className="glass-card text-ink hover:border-signal/40 shadow-sm" />
            </div>
          </div>

          <LinkColumn title="Services" items={serviceLinks} />
          <LinkColumn title="Free Tools" items={freeToolsLinks} />
          <LinkColumn title="Company" items={companyLinks} />
          <LinkColumn title="Policies" items={legalLinks} />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ink/10 pt-8 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">© {new Date().getFullYear()} Studio Inc. All rights reserved.</span>
          </div>
          <p className="text-muted-light">
            Country-adapted honest pricing model with 50% milestone payments.
          </p>
        </div>
      </div>
    </footer>
  );
}
