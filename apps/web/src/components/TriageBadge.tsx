'use client';

import { TRIAGE_LEVEL_SPECS, type TriageLevel } from '@baby-buddy/core';

export function TriageBadge({
  level,
}: {
  readonly level: TriageLevel;
}) {
  const spec = TRIAGE_LEVEL_SPECS[level];

  const styleClass =
    level === 'red_911'
      ? 'border-alert-red bg-alert-red text-alert-on'
      : level === 'orange_urgent'
        ? 'border-alert-red bg-alert-surface text-alert-text'
        : level === 'yellow_pediatrician'
          ? 'border-warm bg-warm-surface text-warm-text'
          : 'border-brand-primary bg-brand-surface text-brand-text';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${styleClass}`}
    >
      {spec.iconName === 'alert-octagon' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden="true">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : spec.iconName === 'alert-triangle' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )}
      <span>{spec.labelMx}</span>
    </span>
  );
}
