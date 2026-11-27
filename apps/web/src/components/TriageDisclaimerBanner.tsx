import { DISCLAIMERS_MX } from '@baby-buddy/core';
import { PhoneCallIcon } from '@/components/Icons';
import { StatusBadge } from '@/components/StatusBadge';

export function TriageDisclaimerBanner() {
  const disclaimer = DISCLAIMERS_MX.triage_banner;

  return (
    <div className="space-y-2">
      <section
        role="alert"
        aria-labelledby="emergencia-911-titulo"
        className="rounded-2xl border-2 border-alert-red bg-alert-surface p-4 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge severity="urgent_red" />
          <span className="text-xs font-semibold text-alert-text">
            Gratis siempre
          </span>
        </div>

        <h2
          id="emergencia-911-titulo"
          className="text-base font-bold text-ink-primary"
        >
          {disclaimer.emergencyActionLabelMx}
        </h2>

        <p className="text-xs leading-relaxed text-ink-primary">
          Dificultad para respirar, labios morados, convulsiones, decaimiento
          extremo o fiebre ≥ 38.0 °C en menor de 3 meses: llama al 911 o acude a
          urgencias de inmediato.
        </p>

        <a
          href={`tel:${disclaimer.emergencyNumber}`}
          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-alert-text px-5 py-2.5 text-sm font-bold text-alert-on shadow-sm hover:opacity-95"
        >
          <PhoneCallIcon className="h-5 w-5 shrink-0" />
          <span>Llamar al {disclaimer.emergencyNumber}</span>
        </a>
      </section>

      <p className="px-1 text-xs text-ink-secondary">{disclaimer.bodyMx}</p>
    </div>
  );
}
