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
  readonly compact?: boolean;
}

export function StageSelector({
  selectedStage,
  onSelectStage,
  includeAllOption = false,
  onSelectAll,
  label = 'Selecciona la etapa de desarrollo',
  compact = false,
}: StageSelectorProps) {
  const { activeStageId, setActiveStageId } = useAppState();
  const current = selectedStage ?? activeStageId;

  const pillSizeClass = compact
    ? 'min-h-9 min-w-9 rounded-lg px-2.5 py-1 text-xs'
    : 'min-h-12 min-w-12 rounded-xl px-4 py-2 text-sm';

  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap justify-center gap-1.5"
    >
      {includeAllOption && onSelectAll ? (
        <button
          type="button"
          onClick={onSelectAll}
          aria-pressed={current === 'all'}
          className={`inline-flex items-center justify-center border font-semibold transition-colors ${pillSizeClass} ${
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
            className={`inline-flex items-center justify-center gap-1.5 border font-semibold transition-colors ${pillSizeClass} ${
              isPressed
                ? 'border-brand-primary bg-brand-primary text-brand-on'
                : 'border-border-interactive bg-bg-card text-ink-primary hover:bg-bg-elevated'
            }`}
          >
            <span>{spec.shortLabel}</span>
            {!compact ? (
              <span className="hidden sm:inline text-xs font-normal opacity-90">
                ({spec.label})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
