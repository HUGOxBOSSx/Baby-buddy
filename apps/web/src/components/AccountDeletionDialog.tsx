'use client';

import { useId, useRef, useState } from 'react';
import { TrashIcon } from '@/components/Icons';
import { useAppState } from '@/components/ThemeProvider';

export function AccountDeletionDialog() {
  const { snapshotSummary, deleteAccountAndData } = useAppState();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const reasonInputId = useId();
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setErrorMessage(null);
    dialogRef.current?.showModal();
  };

  const handleCancel = () => {
    setErrorMessage(null);
    dialogRef.current?.close();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteAccountAndData(reason);
      setReason('');
      dialogRef.current?.close();
    } catch {
      setErrorMessage(
        'No se pudieron eliminar los datos locales. Intenta nuevamente.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-alert-text px-5 py-3 text-sm font-bold text-alert-on transition-opacity hover:opacity-95"
      >
        <TrashIcon className="h-5 w-5 shrink-0" />
        <span>Eliminar cuenta y datos locales</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border-interactive bg-bg-card p-6 text-ink-primary shadow-2xl"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-alert-text">
              Confirmación permanente en este dispositivo
            </p>
            <h2 id={titleId} className="text-xl font-bold text-ink-primary">
              Eliminar cuenta y datos locales
            </h2>
          </div>

          <p className="text-sm text-ink-secondary">
            Esta acción borrará de forma inmediata tus datos locales de Baby
            Buddy MX (preferencias de tema, etapa activa, perfil de ejemplo y
            aceptación del aviso inicial). Otros datos externos del navegador no
            se modifican.
          </p>

          <div className="rounded-xl border border-border-interactive bg-bg-elevated p-4 text-sm space-y-2">
            <p className="font-semibold text-ink-primary">
              Resumen almacenado actualmente ({snapshotSummary.itemCount}{' '}
              elementos):
            </p>
            <ul className="space-y-1 text-xs text-ink-secondary">
              <li>
                Perfil infantil local:{' '}
                <strong className="text-ink-primary">
                  {snapshotSummary.hasActiveProfile ? 'Activo' : 'Sin perfil'}
                </strong>
              </li>
              <li>
                Aviso educativo aceptado:{' '}
                <strong className="text-ink-primary">
                  {snapshotSummary.onboardingAccepted ? 'Sí' : 'No'}
                </strong>
              </li>
            </ul>
            {snapshotSummary.keys.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted space-y-0.5">
                {snapshotSummary.keys.map((key) => (
                  <li key={key} className="break-all font-mono">
                    {key}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={reasonInputId}
              className="block text-sm font-semibold text-ink-primary"
            >
              Motivo de eliminación (opcional)
            </label>
            <input
              id={reasonInputId}
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej. Limpiar dispositivo compartido"
              className="min-h-12 w-full rounded-xl border border-border-interactive bg-bg-primary px-4 py-2 text-sm text-ink-primary placeholder:text-ink-muted"
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-sm font-semibold text-alert-text">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isDeleting}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-5 py-3 text-sm font-semibold text-ink-primary hover:bg-bg-primary disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-alert-text px-5 py-3 text-sm font-bold text-alert-on hover:opacity-95 disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4 shrink-0" />
              <span>
                {isDeleting
                  ? 'Eliminando...'
                  : 'Confirmar eliminación definitiva'}
              </span>
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
