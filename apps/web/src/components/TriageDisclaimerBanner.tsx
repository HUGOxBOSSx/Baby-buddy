import { DISCLAIMERS_MX, ETHICAL_GUARDRAILS } from '@baby-buddy/core';
import { PhoneCallIcon } from '@/components/Icons';
import { StatusBadge } from '@/components/StatusBadge';

export function TriageDisclaimerBanner() {
  const disclaimer = DISCLAIMERS_MX.triage_banner;

  return (
    <div className="space-y-4">
      <section
        aria-label={disclaimer.titleMx}
        className="rounded-2xl border border-warm bg-warm-surface p-4 space-y-2"
      >
        <h2 className="text-base font-bold text-warm-text">
          {disclaimer.titleMx}
        </h2>
        <p className="text-sm text-ink-primary">{disclaimer.bodyMx}</p>
      </section>

      <section
        role="alert"
        aria-labelledby="emergencia-911-titulo"
        className="rounded-2xl border-2 border-alert-red bg-alert-surface p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge severity="urgent_red" />
          <span className="text-xs font-semibold text-alert-text">
            Acceso gratuito · Sin suscripción
          </span>
        </div>

        <h2
          id="emergencia-911-titulo"
          className="text-lg font-bold text-ink-primary"
        >
          {disclaimer.emergencyActionLabelMx}
        </h2>

        <p className="text-sm text-ink-primary">
          Si notas dificultad para respirar, labios morados, convulsiones,
          decaimiento extremo o fiebre de 38.0 °C o más en un bebé menor de 3
          meses, comunícate de inmediato con emergencias o acude al hospital más
          cercano.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={`tel:${disclaimer.emergencyNumber}`}
            className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-alert-text px-5 py-3 text-sm font-bold text-alert-on shadow-sm hover:opacity-95"
          >
            <PhoneCallIcon className="h-5 w-5 shrink-0" />
            <span>Llamar al {disclaimer.emergencyNumber}</span>
          </a>
          <p className="text-xs text-ink-secondary">
            Garantía ética: sin anuncios ({String(ETHICAL_GUARDRAILS.adsOnChildScreens)}) ·
            sin paywall en urgencias ({String(ETHICAL_GUARDRAILS.paywallOnEmergencyTriage)}) ·
            sin venta de datos ({String(ETHICAL_GUARDRAILS.dataSellingEnabled)})
          </p>
        </div>
      </section>
    </div>
  );
}
