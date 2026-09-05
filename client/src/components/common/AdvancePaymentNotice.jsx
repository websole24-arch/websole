import { ShieldIcon } from './Icon';

export default function AdvancePaymentNotice({ className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl glass-card border border-signal/20 p-4 shadow-2xs ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal text-sm">
        <ShieldIcon className="h-4 w-4" />
      </span>
      <div className="text-xs leading-relaxed text-muted-light">
        <span className="font-semibold text-ink">Project Payment Policy:</span> A 50% milestone advance is required to begin design & development. The remaining 50% is due only upon staging review and delivery.
      </div>
    </div>
  );
}
