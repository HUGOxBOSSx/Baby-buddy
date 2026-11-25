import { DISCLAIMERS_MX } from '@baby-buddy/core';

export function GuideDisclaimerHeader() {
  const disclaimer = DISCLAIMERS_MX.guide_header;

  return (
    <section
      aria-label={disclaimer.titleMx}
      className="text-xs text-ink-secondary space-y-0.5"
    >
      <p>
        {disclaimer.bodyMx}{' '}
        <span className="font-semibold text-ink-primary">
          {disclaimer.emergencyActionLabelMx}
        </span>
      </p>
    </section>
  );
}
