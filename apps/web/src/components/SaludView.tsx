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
    pendingSyncCount,
    exportFamilyBackup,
    importFamilyBackup,
  } = useAppState();
  const [isSeeding, setIsSeeding] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

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
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <MascotAvatar variant="salud" size="md" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-alert-text">
            Bitácora, vacunas y emergencias 911
          </p>
          <h1 className="text-xl font-bold text-ink-primary sm:text-2xl">
            Salud
          </h1>
        </div>
      </header>

      <HealthJournalPanel />

      <details
        open={!childProfile}
        className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5"
      >
        <summary className="cursor-pointer text-sm font-bold text-ink-primary">
          Perfil del bebé y código familiar
        </summary>
        <div className="mt-4">
          <ChildProfileEditor />
        </div>
      </details>

      <details className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-bold text-ink-primary">
          Horario automático de Modo nocturno
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-xs text-ink-secondary">
            Por defecto se activa de 20:00 a 07:00 h. Puedes cambiarlo manualmente
            cuando quieras.
          </p>

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
        </div>
      </details>

      <details className="rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-bold text-ink-primary">
          Datos locales y privacidad ({snapshotSummary.itemCount} registros)
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-xs text-ink-secondary">
            Tus registros se guardan únicamente en este navegador, sin cuentas
            remotas ni venta de datos.
          </p>

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

        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-2.5">
          <p className="text-xs font-bold text-ink-primary">
            Respaldo y fusión familiar (offline-first)
          </p>
          <p className="text-xs text-ink-secondary">
            Cambios locales en cola de sincronización: {pendingSyncCount}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const json = exportFamilyBackup();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `baby-buddy-mx-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setBackupMessage('✓ Respaldo descargado.');
              }}
              className="inline-flex min-h-11 items-center rounded-xl border border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text"
            >
              Descargar respaldo (.json)
            </button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border-interactive bg-bg-card px-4 py-2 text-xs font-bold text-ink-primary hover:bg-brand-surface">
              <span>Importar / fusionar (.json)</span>
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void file.text().then((text) => {
                    const res = importFamilyBackup(text);
                    setBackupMessage(res.messageMx);
                  });
                }}
              />
            </label>
          </div>
          {backupMessage ? (
            <p className="text-xs font-semibold text-brand-text">
              {backupMessage}
            </p>
          ) : null}
        </div>
        </div>
      </details>

      <details className="rounded-2xl border border-border-interactive bg-bg-card p-5">
        <summary className="cursor-pointer text-sm font-bold text-ink-primary">
          Información técnica (modo offline)
        </summary>
        <div className="mt-3 space-y-3">
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
        </div>
      </details>
    </div>
  );
}
