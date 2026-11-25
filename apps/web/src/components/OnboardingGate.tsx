'use client';

import { useState } from 'react';
import { DISCLAIMERS_MX, ETHICAL_GUARDRAILS } from '@baby-buddy/core';
import { PhoneCallIcon, ShieldCheckIcon } from '@/components/Icons';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppState } from '@/components/ThemeProvider';
import { accountLifecycleAdapter } from '@/lib/localAdapter';

export function OnboardingGate() {
  const { acceptOnboardingDisclaimer, seedDemoData, lastDeletionResult } =
    useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const disclaimer = DISCLAIMERS_MX.onboarding_gate;

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await acceptOnboardingDisclaimer();
      const storedAcceptance =
        await accountLifecycleAdapter.hasAcceptedOnboardingDisclaimer();
      if (!storedAcceptance) {
        throw new Error('No se confirmó la aceptación en el almacenamiento.');
      }
    } catch {
      setErrorMessage(
        'No se pudo guardar la confirmación en este dispositivo. Intenta de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await seedDemoData();
    } catch {
      setErrorMessage(
        'No se pudieron cargar los datos demo locales. Intenta de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      data-onboarding-gate="true"
      aria-labelledby="onboarding-titulo"
      className="mx-auto max-w-2xl rounded-2xl border border-border-interactive bg-bg-card p-6 shadow-sm space-y-5"
    >
      {lastDeletionResult ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-brand-primary bg-brand-surface p-4 text-sm font-medium text-brand-text"
        >
          Datos locales eliminados ({lastDeletionResult.deletedKeysCount}{' '}
          registros borrados de este dispositivo). Puedes comenzar de nuevo cuando
          lo desees.
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="mt-1 h-6 w-6 shrink-0 text-brand-text" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Baby Buddy MX · De 0 a 6 años
          </p>
          <h1
            id="onboarding-titulo"
            className="text-2xl font-bold text-ink-primary"
          >
            {disclaimer.titleMx}
          </h1>
        </div>
      </div>

      <p className="text-base leading-relaxed text-ink-secondary">
        {disclaimer.bodyMx}
      </p>

      <div
        role="alert"
        className="rounded-xl border-2 border-alert-red bg-alert-surface p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge severity="urgent_red" />
          <span className="text-xs font-semibold text-alert-text">
            Disponible siempre sin costo ni registro
          </span>
        </div>
        <p className="text-sm font-semibold text-ink-primary">
          {disclaimer.emergencyActionLabelMx}
        </p>
        <a
          href={`tel:${disclaimer.emergencyNumber}`}
          className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-alert-text px-5 py-3 text-sm font-bold text-alert-on hover:opacity-95"
        >
          <PhoneCallIcon className="h-5 w-5 shrink-0" />
          <span>Emergencias {disclaimer.emergencyNumber}</span>
        </a>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm font-semibold text-alert-text">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void handleAccept()}
          disabled={isSubmitting}
          className="inline-flex min-h-12 min-w-12 flex-1 items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-base font-bold text-brand-on transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {disclaimer.ackButtonLabelMx ?? 'Entiendo y acepto continuar'}
        </button>

        <button
          type="button"
          onClick={() => void handleSeedDemo()}
          disabled={isSubmitting}
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-5 py-3 text-sm font-semibold text-ink-primary transition-colors hover:bg-brand-surface disabled:opacity-60"
        >
          Cargar datos demo locales
        </button>
      </div>

      <p className="text-xs text-ink-muted">
        Modo offline local · Sin anuncios (
        {String(ETHICAL_GUARDRAILS.adsOnChildScreens)}) · Sin paywall en 911 (
        {String(ETHICAL_GUARDRAILS.paywallOnEmergencyTriage)}) · Sin venta de datos (
        {String(ETHICAL_GUARDRAILS.dataSellingEnabled)})
      </p>
    </section>
  );
}
