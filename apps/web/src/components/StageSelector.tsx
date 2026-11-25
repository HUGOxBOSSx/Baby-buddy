'use client';

import {
  STAGE_ORDER,
  STAGE_SPECS,
  type StageId,
} from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

interface StageSelectorProps {
  readonly selectedStage?: StageId | 'all';
  readonly onSelectStage?: (stage: StageId) => void;
  readonly includeAllOption?: boolean;
  readonly onSelectAll?: () => void;
  readonly label?: string;
}

export function StageSelector({
  selectedStage,
  onSelectStage,
  includeAllOption = false,
  onSelectAll,
  label = 'Selecciona la etapa de desarrollo',
}: StageSelectorProps) {
  const { activeStageId, setActiveStageId } = useAppState();
  const current = selectedStage ?? activeStageId;

  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {includeAllOption && onSelectAll ? (
        <button
          type="button"
          onClick={onSelectAll}
          aria-pressed={current === 'all'}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
            current === 'all'
              ? 'border-brand-primary bg-brand-primary text-brand-on'
              : 'border-border-interactive bg-bg-card text-ink-primary hover:bg-bg-elevated'
          }`}
        >
          Todas
        </button>
      ) : null}

      {STAGE_ORDER.map((id) => {
        const spec = STAGE_SPECS[id];
        const isPressed = current === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (onSelectStage) {
                onSelectStage(id);
              } else {
                setActiveStageId(id);
              }
            }}
            aria-pressed={isPressed}
            aria-label={spec.label}
            className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              isPressed
                ? 'border-brand-primary bg-brand-primary text-brand-on'
                : 'border-border-interactive bg-bg-card text-ink-primary hover:bg-bg-elevated'
            }`}
          >
            <span>{spec.shortLabel}</span>
            <span className="hidden sm:inline text-xs font-normal opacity-90">
              ({spec.label})
            </span>
          </button>
        );
      })}
    </div>
  );
}
