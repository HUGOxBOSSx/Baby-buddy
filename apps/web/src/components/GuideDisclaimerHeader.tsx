import { DISCLAIMERS_MX } from '@baby-buddy/core';
import { ShieldCheckIcon } from '@/components/Icons';

export function GuideDisclaimerHeader() {
  const disclaimer = DISCLAIMERS_MX.guide_header;

  return (
    <section
      aria-label={disclaimer.titleMx}
      className="rounded-xl border border-brand-primary bg-brand-surface p-3 space-y-1"
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
        <div className="space-y-0.5">
          <h2 className="text-xs font-bold text-brand-text">
            {disclaimer.titleMx}
          </h2>
          <p className="text-xs text-ink-primary">{disclaimer.bodyMx}</p>
          <p className="text-xs font-semibold text-alert-text">
            {disclaimer.emergencyActionLabelMx}
          </p>
        </div>
      </div>
    </section>
  );
}
