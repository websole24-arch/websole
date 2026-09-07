import { MailIcon, PhoneIcon, PinIcon, ClockIcon } from './Icon';

export default function BusinessContactCard({ className = '' }) {
  const email = import.meta.env.VITE_BUSINESS_EMAIL || '';
  const phone = import.meta.env.VITE_BUSINESS_PHONE || '';
  const address = import.meta.env.VITE_BUSINESS_ADDRESS || '';
  const hours = import.meta.env.VITE_BUSINESS_HOURS || '';

  const rows = [
    address && { icon: PinIcon, label: 'Web_Sole Office', value: address },
    email && { icon: MailIcon, label: 'Email Inquiries', value: email, href: `mailto:${email}` },
    phone && { icon: PhoneIcon, label: 'Direct Line', value: phone, href: `tel:${phone.replace(/[^\d+]/g, '')}` },
    hours && { icon: ClockIcon, label: 'Operating Hours', value: hours },
  ].filter(Boolean);

  return (
    <div className={`rounded-3xl glass-card p-6 sm:p-7 shadow-xs ${className}`}>
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 text-signal text-xs">
          <PinIcon className="h-3.5 w-3.5" />
        </span>
        Direct Contact
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/20 p-5 text-center text-xs text-muted-light">
          Contact details coming soon.
        </p>
      ) : (
        <dl className="mt-5 space-y-4">
          {rows.map(({ icon: RowIcon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/5 text-signal">
                <RowIcon className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-muted-light">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">
                  {href ? (
                    <a href={href} className="hover:text-signal transition-colors">{value}</a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
