'use client';

import { useState, type FormEvent } from 'react';
import {
  CHILD_SEX_LABELS_MX,
  STAGE_SPECS,
  calculateAgeMonthsFromBirthDate,
  encodeFamilyBabyCode,
  formatChildAgeMx,
  getStageForAgeMonths,
  type ChildSex,
} from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

const SEX_OPTIONS: readonly ChildSex[] = ['niño', 'niña', 'no_especificado'];

function getTodayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ChildProfileEditor() {
  const { childProfile, saveChildProfile } = useAppState();
  const todayYmd = getTodayYmd();
  const [nickname, setNickname] = useState(childProfile?.nicknameMx ?? '');
  const [birthDate, setBirthDate] = useState(
    childProfile?.birthDateIso?.slice(0, 10) ?? todayYmd,
  );
  const [sex, setSex] = useState<ChildSex>(
    childProfile?.sex ?? 'no_especificado',
  );
  const [feedback, setFeedback] = useState('');

  let previewText = 'Fecha fuera de rango (0 a 6 años)';
  let computedMonths: number | null = null;
  try {
    computedMonths = calculateAgeMonthsFromBirthDate(birthDate);
    previewText = `${formatChildAgeMx(computedMonths)} · ${STAGE_SPECS[getStageForAgeMonths(computedMonths)].label}`;
  } catch {
    computedMonths = null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFeedback('Escribe el nombre o apodo de tu bebé.');
      return;
    }
    if (computedMonths === null) {
      setFeedback('Elige una fecha de nacimiento válida (0 a 6 años).');
      return;
    }
    const saved = saveChildProfile({
      nicknameMx: trimmed,
      birthDateIso: birthDate,
      ageMonths: computedMonths,
      sex,
    });
    setFeedback(
      `Guardado: ${saved.nicknameMx} (${formatChildAgeMx(saved.ageMonths)} · ${STAGE_SPECS[saved.stageId].label}).`,
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
          Datos del bebé (etapa automática por fecha de nacimiento)
        </h2>
        <p className="text-sm text-ink-secondary">
          Al guardar su fecha de nacimiento, su edad y etapa se actualizan en
          automático y se ocultan las demás etapas.
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
            <span>Fecha de nacimiento</span>
            <input
              type="date"
              max={todayYmd}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            />
            <span className="block text-xs font-normal text-brand-text">
              {previewText}
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

      {childProfile ? (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2">
          <p className="text-xs font-bold text-ink-primary">
            Compartir código con familiar
          </p>
          <p className="text-[11px] text-ink-secondary">
            Comparte este código para que otro familiar cargue los datos de{' '}
            {childProfile.nicknameMx} en su dispositivo:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border-interactive bg-bg-card px-2.5 py-1.5 text-xs text-ink-primary">
              {encodeFamilyBabyCode(childProfile)}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  encodeFamilyBabyCode(childProfile),
                );
              }}
              className="inline-flex min-h-10 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-text"
            >
              Copiar código
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
