'use client';

import { useState } from 'react';
import {
  OfflineDeploymentInfoStub,
  OfflineGeminiAssistantStub,
  OfflineSupabasePortStub,
  loadOfflineEnvConfig,
} from '@baby-buddy/core';
import { AccountDeletionDialog } from '@/components/AccountDeletionDialog';
import { TriageDisclaimerBanner } from '@/components/TriageDisclaimerBanner';
import { useAppState } from '@/components/ThemeProvider';

const envConfig = loadOfflineEnvConfig();
const supabaseStub = new OfflineSupabasePortStub().getStatus();
const geminiStub = new OfflineGeminiAssistantStub().getStatus();
const deploymentStub = new OfflineDeploymentInfoStub().getStatus();

export function SaludView() {
  const { snapshotSummary, childProfile, seedDemoData } = useAppState();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-alert-text">
          Orientación de salud y privacidad local
        </p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
          Salud, Emergencias 911 y Tus Datos
        </h1>
      </header>

      <TriageDisclaimerBanner />

      <section
        aria-labelledby="datos-locales-titulo"
        className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="space-y-1">
          <h2
            id="datos-locales-titulo"
            className="text-lg font-bold text-ink-primary"
          >
            Gestión de datos locales y eliminación de cuenta
          </h2>
          <p className="text-sm text-ink-secondary">
            Tus preferencias y datos de demostración se guardan únicamente en el
            almacenamiento local de este navegador. Puedes cargar un perfil demo
            o eliminar por completo todos los registros de Baby Buddy MX.
          </p>
        </div>

        <div className="rounded-xl border border-border-interactive bg-bg-elevated p-4 text-sm space-y-2">
          <p className="font-semibold text-ink-primary">
            Estado actual en este dispositivo: {snapshotSummary.itemCount}{' '}
            registros locales
          </p>
          <p className="text-xs text-ink-secondary">
            Perfil infantil:{' '}
            <strong className="text-ink-primary">
              {childProfile
                ? `${childProfile.nicknameMx} (${childProfile.ageMonths} meses)`
                : 'Sin perfil activo'}
            </strong>
          </p>
          {snapshotSummary.keys.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-ink-muted space-y-0.5">
              {snapshotSummary.keys.map((key) => (
                <li key={key} className="break-all font-mono">
                  {key}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={() => void handleSeedDemo()}
            disabled={isSeeding}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-5 py-3 text-sm font-semibold text-ink-primary hover:bg-brand-surface disabled:opacity-60"
          >
            {isSeeding ? 'Cargando datos...' : 'Cargar datos demo locales'}
          </button>

          <AccountDeletionDialog />
        </div>
      </section>

      <section
        aria-labelledby="estado-offline-titulo"
        className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-3"
      >
        <h2
          id="estado-offline-titulo"
          className="text-base font-bold text-ink-primary"
        >
          Estado de servicios en modo offline
        </h2>
        <p className="text-xs text-ink-secondary">
          Modo de ejecución: <strong className="text-ink-primary">{envConfig.mode}</strong> ·
          Credenciales externas activas:{' '}
          <strong className="text-ink-primary">
            {String(envConfig.hasLiveCredentials)}
          </strong>
        </p>
        <ul className="space-y-2 text-xs text-ink-secondary">
          {[supabaseStub, geminiStub, deploymentStub].map((stub) => (
            <li
              key={stub.service}
              className="rounded-xl border border-border-interactive bg-bg-elevated p-3"
            >
              <p className="font-semibold uppercase text-ink-primary">
                {stub.service} · {stub.mode}
              </p>
              <p className="mt-0.5">{stub.messageMx}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
