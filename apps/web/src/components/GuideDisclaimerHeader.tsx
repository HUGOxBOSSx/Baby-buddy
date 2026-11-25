import { DISCLAIMERS_MX } from '@baby-buddy/core';
import { ShieldCheckIcon } from '@/components/Icons';

export function GuideDisclaimerHeader() {
  const disclaimer = DISCLAIMERS_MX.guide_header;

  return (
    <section
      aria-label={disclaimer.titleMx}
      className="rounded-2xl border border-brand-primary bg-brand-surface p-4 space-y-2"
    >
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-text" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-brand-text">
            {disclaimer.titleMx}
          </h2>
          <p className="text-sm text-ink-primary">{disclaimer.bodyMx}</p>
          <p className="text-sm font-semibold text-alert-text">
            {disclaimer.emergencyActionLabelMx}
          </p>
        </div>
      </div>
    </section>
  );
}
