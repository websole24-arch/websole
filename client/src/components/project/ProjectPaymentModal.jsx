import { useEffect, useState } from 'react';
import { ChatIcon, CheckIcon, CloseIcon, CheckMarkIcon, CopyIcon, CreditCardIcon } from '../common/Icon';

export default function ProjectPaymentModal({ project, user, onClose, autoOpenWhatsApp = true }) {
  const [copied, setCopied] = useState(false);
  const [hasTriggeredWA, setHasTriggeredWA] = useState(false);

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';

  const projectRef = project?.id ? `#${project.id.slice(0, 8).toUpperCase()}` : 'NEW-PROJECT';
  const serviceName = project?.service?.name || project?.service || 'Custom Development';
  const packageName = project?.package?.name || project?.package || 'Standard Package';
  const currency = project?.currency || 'USD';
  const totalAmount = Number(project?.totalAmount || 0).toLocaleString();
  const advanceAmount = Number(project?.advanceAmount || 0).toLocaleString();
  const remainingAmount = Number(project?.remainingAmount || 0).toLocaleString();
  const clientName = user?.name || project?.customer?.name || 'Client';
  const clientEmail = user?.email || project?.customer?.email || '';
  const country = project?.country || 'International';

  const waLines = [
    `*NEW PROJECT & PAYMENT CONFIRMATION*`,
    ``,
    `*Project Ref:* ${projectRef}`,
    `*Service:* ${serviceName}`,
    `*Package Tier:* ${packageName}`,
    `*Country:* ${country}`,
    ``,
    `*Financial Breakdown:*`,
    `• Total Amount: ${currency} ${totalAmount}`,
    `• 50% Advance Required: ${currency} ${advanceAmount}`,
    `• Remaining Balance: ${currency} ${remainingAmount}`,
    ``,
    `*Client Details:*`,
    `• Name: ${clientName}`,
    `• Email: ${clientEmail}`,
    ``,
    `Hello Studio, I have created this project and would like to confirm the 50% advance payment details to begin!`,
  ];

  const waText = encodeURIComponent(waLines.join('\n'));
  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  // Auto-open WhatsApp on mount once if enabled
  useEffect(() => {
    if (autoOpenWhatsApp && !hasTriggeredWA && waHref) {
      setHasTriggeredWA(true);
      const timer = setTimeout(() => {
        window.open(waHref, '_blank', 'noopener,noreferrer');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [autoOpenWhatsApp, hasTriggeredWA, waHref]);

  const copyRef = () => {
    navigator.clipboard.writeText(projectRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card bg-white dark:bg-white/5 p-6 sm:p-8 shadow-2xl border border-signal/30 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-ink/70 hover:text-ink transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Header with Success badge */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 text-2xl mb-3 shadow-inner">
            <CheckMarkIcon className="h-6 w-6" />
          </div>
          <span className="inline-block rounded-full bg-signal-soft px-3 py-1 font-mono text-xs font-semibold text-signal uppercase tracking-wider">
            Project Initialized & Saved
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">
            Payment & Milestone Details
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-light">
            Your project is registered. Settle the 50% deposit to commence sprint development.
          </p>
        </div>

        {/* Project & Price Summary Box */}
        <div className="mt-6 rounded-2xl bg-paper p-5 border border-ink/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-light">Selected Package</p>
              <p className="font-display font-bold text-base text-ink">
                {serviceName} <span className="font-normal text-muted-light">— {packageName}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-light">Project Reference</p>
              <button
                type="button"
                onClick={copyRef}
                title="Click to copy"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-signal bg-signal-soft px-2.5 py-1 rounded-lg hover:bg-signal hover:text-white transition-colors"
              >
                <span>{projectRef}</span>
                {copied ? (
                  <>
                    <CheckMarkIcon className="h-3 w-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* Payment Milestone Split */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white dark:bg-white/5 p-3 border border-ink/5">
              <p className="text-[11px] font-mono text-muted-light uppercase">Total Price</p>
              <p className="font-mono text-lg font-bold text-ink mt-0.5">
                {currency} {totalAmount}
              </p>
              <p className="text-[10px] text-muted-light">Fixed rate</p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
              <p className="text-[11px] font-mono text-emerald-800 uppercase font-semibold">50% Advance Due Now</p>
              <p className="font-mono text-xl font-bold text-emerald-600 mt-0.5">
                {currency} {advanceAmount}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">To start development</p>
            </div>

            <div className="rounded-xl bg-white dark:bg-white/5 p-3 border border-ink/5">
              <p className="text-[11px] font-mono text-muted-light uppercase">50% Remaining</p>
              <p className="font-mono text-lg font-bold text-ink mt-0.5">
                {currency} {remainingAmount}
              </p>
              <p className="text-[10px] text-muted-light">Due at final delivery</p>
            </div>
          </div>
        </div>

        {/* Bank & Payment Instructions */}
        <div className="mt-5 rounded-2xl bg-white/70 dark:bg-white/5 p-5 border border-ink/10 dark:border-white/10 text-xs text-ink/80 space-y-3">
          <p className="font-display font-semibold text-sm text-ink flex items-center gap-1.5">
            <CreditCardIcon className="h-4 w-4" /> Payment Instructions
          </p>
          <p className="text-muted-light leading-relaxed">
            Please transfer the 50% advance of <strong className="text-ink">{currency} {advanceAmount}</strong> and include your project reference <strong className="font-mono text-signal">{projectRef}</strong> in the payment description.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl bg-black/5 p-3 font-mono text-[11px]">
            <div>
              <span className="text-muted-light">Payment Method:</span>
              <p className="font-bold text-ink">Bank Transfer / Card / PayPal</p>
            </div>
            <div>
              <span className="text-muted-light">Reference Note:</span>
              <p className="font-bold text-signal">{projectRef} - {clientName}</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Action */}
        <div className="mt-6 space-y-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-98"
          >
            <ChatIcon className="h-5 w-5" />
            <span>Confirm Payment & Requirements on WhatsApp</span>
          </a>

          <div className="flex items-center justify-between text-xs text-muted-light pt-2">
            <span>Opening WhatsApp with your project quote…</span>
            <button
              type="button"
              onClick={onClose}
              className="text-signal hover:underline font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
