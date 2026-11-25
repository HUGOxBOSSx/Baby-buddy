'use client';

import { useState } from 'react';
import {
  OfflineDeploymentInfoStub,
  OfflineGeminiAssistantStub,
  OfflineSupabasePortStub,
  loadOfflineEnvConfig,
} from '@baby-buddy/core';
import { AccountDeletionDialog } from '@/components/AccountDeletionDialog';
import { ChildProfileEditor } from '@/components/ChildProfileEditor';
import { HealthJournalPanel } from '@/components/HealthJournalPanel';
import { MascotAvatar } from '@/components/MascotAvatar';
import { useAppState } from '@/components/ThemeProvider';

const envConfig = loadOfflineEnvConfig();
const supabaseStub = new OfflineSupabasePortStub().getStatus();
const geminiStub = new OfflineGeminiAssistantStub().getStatus();
const deploymentStub = new OfflineDeploymentInfoStub().getStatus();

export function SaludView() {
  const {
    snapshotSummary,
    childProfile,
    seedDemoData,
    themeSchedule,
    setThemeSchedule,
  } = useAppState();
  const [isSeeding, setIsSeeding] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);

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
      <div className="flex items-center gap-3">
        <MascotAvatar variant="salud" size="md" />
        <p className="text-xs text-ink-secondary">
          Bitácora clínica local, Cartilla MX y datos de tu bebé en un solo lugar.
        </p>
      </div>
      <HealthJournalPanel />
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-alert-text">
          Orientación de salud y privacidad local
        </p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
          Salud, Emergencias 911 y Tus Datos
        </h1>
      </header>

      <ChildProfileEditor />

      <section
        aria-labelledby="horario-nocturno-titulo"
        className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="space-y-1">
          <h2
            id="horario-nocturno-titulo"
            className="text-lg font-bold text-ink-primary"
          >
            Horario automático de Modo 3:00 AM
          </h2>
          <p className="text-sm text-ink-secondary">
            Por defecto el Modo 3:00 AM se activa automáticamente de 20:00 a
            07:00 h. Puedes ajustar las horas o cambiarlo manualmente en
            cualquier momento.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setThemeSchedule({ ...themeSchedule, mode: 'auto' })
            }
            aria-pressed={themeSchedule.mode === 'auto'}
            className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold ${
              themeSchedule.mode === 'auto'
                ? 'border-brand-primary bg-brand-primary text-brand-on'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            Automático por horario
          </button>
          <button
            type="button"
            onClick={() =>
              setThemeSchedule({ ...themeSchedule, mode: 'manual' })
            }
            aria-pressed={themeSchedule.mode === 'manual'}
            className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold ${
              themeSchedule.mode === 'manual'
                ? 'border-brand-primary bg-brand-primary text-brand-on'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            Manual
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-semibold text-ink-primary">
            <span>Inicio de modo noche</span>
            <select
              value={themeSchedule.nightStartHour}
              onChange={(e) =>
                setThemeSchedule({
                  ...themeSchedule,
                  mode: 'auto',
                  nightStartHour: Number.parseInt(e.target.value, 10),
                })
              }
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            >
              {hours.map((h) => (
                <option key={`start-${h}`} value={h}>
                  {String(h).padStart(2, '0')}:00 h
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-semibold text-ink-primary">
            <span>Fin de modo noche</span>
            <select
              value={themeSchedule.nightEndHour}
              onChange={(e) =>
                setThemeSchedule({
                  ...themeSchedule,
                  mode: 'auto',
                  nightEndHour: Number.parseInt(e.target.value, 10),
                })
              }
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            >
              {hours.map((h) => (
                <option key={`end-${h}`} value={h}>
                  {String(h).padStart(2, '0')}:00 h
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        aria-labelledby="datos-locales-titulo"
        className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="space-y-1">
          <h2
            id="datos-locales-titulo"
            className="text-lg font-bold text-ink-primary"
          >
            Datos locales y privacidad
          </h2>
          <p className="text-sm text-ink-secondary">
            Tus preferencias y datos de demostración se guardan únicamente en el
            almacenamiento local de este navegador. Puedes cargar un perfil demo
            o eliminar por completo todos los registros locales de Baby Buddy MX.
            En esta versión no existe una cuenta remota.
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
