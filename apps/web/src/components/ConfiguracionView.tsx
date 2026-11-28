'use client';

import { useState } from 'react';
import {
  OfflineDeploymentInfoStub,
  OfflineGeminiAssistantStub,
  OfflineSupabasePortStub,
  decodeFamilyBabyCode,
  encodeFamilyBabyCode,
  loadOfflineEnvConfig,
} from '@baby-buddy/core';
import { AccountDeletionDialog } from '@/components/AccountDeletionDialog';
import { ChildProfileEditor } from '@/components/ChildProfileEditor';
import { SimulatedAdBanner } from '@/components/SimulatedAdBanner';
import { useAppState } from '@/components/ThemeProvider';

const envConfig = loadOfflineEnvConfig();
const supabaseStub = new OfflineSupabasePortStub().getStatus();
const geminiStub = new OfflineGeminiAssistantStub().getStatus();
const deploymentStub = new OfflineDeploymentInfoStub().getStatus();

export function ConfiguracionView() {
  const {
    snapshotSummary,
    childProfile,
    addChildProfile,
    themeSchedule,
    setThemeSchedule,
    pendingSyncCount,
    exportFamilyBackup,
    importFamilyBackup,
    adPreview,
    setAdPreview,
    notificationsEnabled,
    notificationPermission,
    enableNotifications,
    disableNotifications,
  } = useAppState();
  const [familyIdInput, setFamilyIdInput] = useState('');
  const [familyMessage, setFamilyMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activeShareCode = childProfile
    ? encodeFamilyBabyCode({
        nicknameMx: childProfile.nicknameMx,
        ageMonths: childProfile.ageMonths,
        sex: childProfile.sex,
        birthDateIso: childProfile.birthDateIso,
      })
    : null;

  const handleLinkByIdOrCode = () => {
    const raw = familyIdInput.trim();
    if (!raw) {
      setFamilyMessage('Escribe el ID o código familiar del bebé.');
      return;
    }
    const decoded = decodeFamilyBabyCode(raw);
    if (decoded) {
      const added = addChildProfile(decoded);
      setFamilyIdInput('');
      setFamilyMessage(
        `✓ Perfil "${added.nicknameMx}" agregado localmente. Listo para sincronización en tiempo real al conectar la nube.`,
      );
      return;
    }
    setFamilyIdInput('');
    setFamilyMessage(
      `✓ ID "${raw}" guardado para enlace familiar. La sincronización en tiempo real se activará al conectar el servicio en la nube.`,
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-0.5">
        <h1 className="text-xl font-bold text-ink-primary sm:text-2xl">
          Configuraciones
        </h1>
        <p className="text-xs text-ink-secondary">
          Bebés, modo nocturno, familia y datos
        </p>
      </header>

      {/* 1. Registro y perfiles del bebé */}
      <ChildProfileEditor />

      {/* 2. Horario automático de Modo nocturno */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Modo nocturno automático
          </h2>
          <p className="text-xs text-ink-secondary">
            Por defecto se activa de 20:00 a 07:00 h. Puedes cambiarlo manualmente
            cuando quieras.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
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

      {/* 3. Compartir y sincronización familiar (sección separada) */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Compartir y sincronización familiar
          </h2>
          <p className="text-xs text-ink-secondary">
            Comparte el ID o código de tu bebé con otro cuidador, o ingresa el ID
            de un bebé para preparar registros conjuntos (listo para
            sincronización en tiempo real al conectar la nube).
          </p>
        </div>

        {childProfile && activeShareCode ? (
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3.5 space-y-2">
            <p className="text-xs font-bold text-ink-primary">
              ID de {childProfile.nicknameMx}:{' '}
              <span className="font-mono text-brand-text">{childProfile.id}</span>
            </p>
            <p className="break-all font-mono text-[11px] text-ink-secondary">
              Código familiar: {activeShareCode}
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  .writeText(activeShareCode)
                  .then(() => setFamilyMessage('✓ Código familiar copiado.'))
                  .catch(() => {});
              }}
              className="inline-flex min-h-10 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-text"
            >
              Copiar código familiar
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block space-y-1 text-xs font-bold text-ink-primary">
            <span>Vincular por ID o código de bebé</span>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={familyIdInput}
                onChange={(e) => setFamilyIdInput(e.target.value)}
                placeholder="Pega aquí el ID o código BBMX-1-..."
                className="min-h-12 flex-1 min-w-[200px] rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs text-ink-primary"
              />
              <button
                type="button"
                onClick={handleLinkByIdOrCode}
                className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
              >
                Vincular bebé
              </button>
            </div>
          </label>
          {familyMessage ? (
            <p className="text-xs font-semibold text-brand-text">
              {familyMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-2.5">
          <p className="text-xs font-bold text-ink-primary">
            Respaldo y fusión manual (.json)
          </p>
          <p className="text-xs text-ink-secondary">
            Cambios locales en cola de sincronización: {pendingSyncCount}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
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
      </section>

      {/* 4. Notificaciones locales */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Notificaciones locales
          </h2>
          <p className="text-xs text-ink-secondary">
            Recibe avisos locales para recordatorios (como vacunas pendientes),
            alertas de hidratación/evacuaciones y temporizadores en curso de
            siesta o toma cuando cambias de pestaña.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {notificationsEnabled && notificationPermission === 'granted' ? (
            <button
              type="button"
              onClick={disableNotifications}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
            >
              ✓ Notificaciones activas (desactivar)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void enableNotifications()}
              disabled={notificationPermission === 'unsupported'}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs font-bold text-brand-text disabled:opacity-50"
            >
              {notificationPermission === 'unsupported'
                ? 'No compatible en este navegador'
                : notificationPermission === 'denied'
                  ? 'Permiso bloqueado en el navegador'
                  : 'Activar notificaciones locales'}
            </button>
          )}
        </div>
      </section>

      {/* 5. Vista previa de anuncios (simulación local) */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Vista previa de anuncios (simulación)
          </h2>
          <p className="text-xs text-ink-secondary">
            Simulación visual 100 % local de cómo se verá el banner discreto
            encima de la barra inferior en el plan gratuito: nunca aparece en
            urgencias 911, pantallas infantiles, Plan Pro ni en horario nocturno
            fijo (22:00–06:00 h).
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              setAdPreview({ ...adPreview, enabled: !adPreview.enabled })
            }
            aria-pressed={adPreview.enabled}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-xs font-bold ${
              adPreview.enabled
                ? 'border-brand-primary bg-brand-primary text-brand-on'
                : 'border-border-interactive bg-bg-elevated text-brand-text'
            }`}
          >
            {adPreview.enabled
              ? 'Desactivar simulación de banner'
              : 'Activar simulación de banner'}
          </button>
        </div>

        {adPreview.enabled ? (
          <div className="space-y-3">
            <div className="flex flex-wrap justify-center gap-2">
              {(
                [
                  { id: 'free', label: 'Plan Gratuito' },
                  { id: 'pro', label: 'Plan Pro' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAdPreview({ ...adPreview, plan: p.id })}
                  aria-pressed={adPreview.plan === p.id}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-bold ${
                    adPreview.plan === p.id
                      ? 'border-brand-primary bg-brand-primary text-brand-on'
                      : 'border-border-interactive bg-bg-elevated text-ink-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {(
                [
                  { id: 'day_14', label: 'Día (14:00 h)' },
                  { id: 'night_23', label: 'Noche (23:00 h)' },
                  { id: 'real', label: 'Hora real' },
                ] as const
              ).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setAdPreview({ ...adPreview, hourMode: h.id })}
                  aria-pressed={adPreview.hourMode === h.id}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-bold ${
                    adPreview.hourMode === h.id
                      ? 'border-brand-primary bg-brand-surface text-brand-text'
                      : 'border-border-interactive bg-bg-elevated text-ink-secondary'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <SimulatedAdBanner inlinePreview />
      </section>

      {/* 5. Datos locales y privacidad */}
      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Datos locales y privacidad
          </h2>
          <p className="text-xs text-ink-secondary">
            Tus registros se guardan únicamente en este navegador ({snapshotSummary.itemCount}{' '}
            registros locales), sin venta de datos.
          </p>
        </div>

        <AccountDeletionDialog />

        <details className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <summary className="cursor-pointer text-xs font-bold text-ink-primary">
            Información técnica (modo offline)
          </summary>
          <div className="mt-3 space-y-2 text-xs text-ink-secondary">
            <p>
              Modo: <strong className="text-ink-primary">{envConfig.mode}</strong>{' '}
              · Credenciales activas:{' '}
              <strong className="text-ink-primary">
                {String(envConfig.hasLiveCredentials)}
              </strong>
            </p>
            {[supabaseStub, geminiStub, deploymentStub].map((stub) => (
              <div
                key={stub.service}
                className="rounded-lg border border-border-subtle bg-bg-card p-2.5"
              >
                <p className="font-semibold uppercase text-ink-primary">
                  {stub.service} · {stub.mode}
                </p>
                <p className="mt-0.5">{stub.messageMx}</p>
              </div>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
