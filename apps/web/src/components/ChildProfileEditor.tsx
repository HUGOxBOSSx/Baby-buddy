'use client';

import { useState, type FormEvent } from 'react';
import {
  CHILD_SEX_LABELS_MX,
  STAGE_SPECS,
  getStageForAgeMonths,
  type ChildSex,
} from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

const SEX_OPTIONS: readonly ChildSex[] = ['niño', 'niña', 'no_especificado'];

export function ChildProfileEditor() {
  const { childProfile, saveChildProfile } = useAppState();
  const [nickname, setNickname] = useState(childProfile?.nicknameMx ?? '');
  const [ageMonths, setAgeMonths] = useState(
    String(childProfile?.ageMonths ?? 2),
  );
  const [sex, setSex] = useState<ChildSex>(
    childProfile?.sex ?? 'no_especificado',
  );
  const [feedback, setFeedback] = useState('');

  const parsedAge = Number.parseInt(ageMonths, 10);
  const previewStage =
    Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 72
      ? STAGE_SPECS[getStageForAgeMonths(parsedAge)].label
      : 'Edad fuera de rango (0 a 72 meses)';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFeedback('Escribe el nombre o apodo de tu bebé.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 72) {
      setFeedback('La edad debe estar entre 0 y 72 meses.');
      return;
    }
    const saved = saveChildProfile({
      nicknameMx: trimmed,
      ageMonths: parsedAge,
      sex,
    });
    setFeedback(
      `Guardado: ${saved.nicknameMx} (${STAGE_SPECS[saved.stageId].label}). La app ya muestra solo su etapa.`,
    );
  };

  return (
    <section
      id="perfil-bebe"
      aria-labelledby="perfil-bebe-titulo"
      className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
    >
      <div className="space-y-1">
        <h2
          id="perfil-bebe-titulo"
          className="text-lg font-bold text-ink-primary"
        >
          Datos del bebé (etapa automática)
        </h2>
        <p className="text-sm text-ink-secondary">
          Al guardar estos datos, la app calcula la etapa en automático, oculta
          las demás etapas y muestra su resumen en la barra superior.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-semibold text-ink-primary">
            <span>Nombre o apodo</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej. Mateo o Sofía"
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold text-ink-primary">
            <span>Edad en meses (0 a 72)</span>
            <input
              type="number"
              min={0}
              max={72}
              value={ageMonths}
              onChange={(e) => setAgeMonths(e.target.value)}
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            />
            <span className="block text-xs font-normal text-brand-text">
              Etapa automática: {previewStage}
            </span>
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink-primary">Sexo</legend>
          <div className="flex flex-wrap gap-2">
            {SEX_OPTIONS.map((option) => {
              const selected = sex === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSex(option)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold ${
                    selected
                      ? 'border-brand-primary bg-brand-primary text-brand-on'
                      : 'border-border-interactive bg-bg-elevated text-ink-primary'
                  }`}
                >
                  {CHILD_SEX_LABELS_MX[option]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-brand-on hover:opacity-95"
        >
          Guardar datos del bebé
        </button>

        {feedback ? (
          <p role="status" className="text-sm font-semibold text-brand-text">
            {feedback}
          </p>
        ) : null}
      </form>
    </section>
  );
}
