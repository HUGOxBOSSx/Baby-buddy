'use client';

import { useState } from 'react';
import {
  DISCLAIMERS_MX,
  ETHICAL_GUARDRAILS,
  calculateAgeMonthsFromBirthDate,
  decodeFamilyBabyCode,
  formatChildAgeMx,
  type ChildSex,
} from '@baby-buddy/core';
import { PhoneCallIcon } from '@/components/Icons';
import { MascotAvatar } from '@/components/MascotAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppState } from '@/components/ThemeProvider';
import { accountLifecycleAdapter } from '@/lib/localAdapter';

export function OnboardingGate() {
  const {
    acceptOnboardingDisclaimer,
    saveChildProfile,
    seedDemoData,
    lastDeletionResult,
  } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState<'register' | 'join'>('register');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<ChildSex>('no_especificado');
  const [familyCode, setFamilyCode] = useState('');
  const disclaimer = DISCLAIMERS_MX.onboarding_gate;

  const decodedFamily =
    setupMode === 'join' && familyCode.trim().length > 0
      ? decodeFamilyBabyCode(familyCode)
      : null;

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (setupMode === 'register' && nickname.trim().length > 0) {
        const ageMonths =
          birthDate.trim().length > 0
            ? calculateAgeMonthsFromBirthDate(birthDate.trim())
            : 0;
        saveChildProfile({
          nicknameMx: nickname.trim(),
          ageMonths,
          sex,
          ...(birthDate.trim().length > 0
            ? { birthDateIso: birthDate.trim() }
            : {}),
        });
      } else if (setupMode === 'join' && decodedFamily) {
        saveChildProfile(decodedFamily);
      }
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
        <MascotAvatar variant="home" size="md" />
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

      <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink-primary">
            Tu bebé (opcional en este paso)
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSetupMode('register')}
              aria-pressed={setupMode === 'register'}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                setupMode === 'register'
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-card text-ink-primary'
              }`}
            >
              Registrar a mi bebé
            </button>
            <button
              type="button"
              onClick={() => setSetupMode('join')}
              aria-pressed={setupMode === 'join'}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                setupMode === 'join'
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-card text-ink-primary'
              }`}
            >
              Ya lo registró un familiar
            </button>
          </div>
        </div>

        {setupMode === 'register' ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nombre o apodo del bebé"
              className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-xs text-ink-primary"
            />
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              aria-label="Fecha de nacimiento"
              className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-xs text-ink-primary"
            />
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as ChildSex)}
              aria-label="Sexo del bebé"
              className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-xs text-ink-primary"
            >
              <option value="no_especificado">Prefiero no decir</option>
              <option value="niña">Niña</option>
              <option value="niño">Niño</option>
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
              placeholder="Pega el código familiar (ej. BBMX-1-...)"
              className="min-h-11 w-full rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-xs text-ink-primary"
            />
            {familyCode.trim().length > 0 ? (
              decodedFamily ? (
                <p className="text-xs font-semibold text-brand-text">
                  ✓ Bebé detectado: {decodedFamily.nicknameMx} ·{' '}
                  {formatChildAgeMx(decodedFamily.ageMonths ?? 0)}
                </p>
              ) : (
                <p className="text-xs font-semibold text-alert-text">
                  Código no válido. Pide a tu familiar copiarlo desde Salud.
                </p>
              )
            ) : null}
          </div>
        )}
      </div>

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
