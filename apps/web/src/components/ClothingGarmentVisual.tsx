'use client';

import type {
  BaseLayerId,
  GarmentVisualKind,
  MidLayerId,
  OuterLayerId,
} from '@baby-buddy/core';
import {
  BASE_LAYER_OPTIONS,
  MID_LAYER_OPTIONS,
  OUTER_LAYER_OPTIONS,
} from '@baby-buddy/core';

export function GarmentIcon({
  kind,
  className = 'h-6 w-6 shrink-0',
}: {
  readonly kind: GarmentVisualKind;
  readonly className?: string;
}) {
  switch (kind) {
    case 'none':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M5 7h14l-1.5 7.5a5.5 5.5 0 0 1-11 0L5 7Z" />
          <path d="M5 10h4M15 10h4" />
        </svg>
      );
    case 'sleeveless_bodysuit':
    case 'short_bodysuit':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M8 4h8l2 4-2 1v7l-4 4-4-4V9L6 8l2-4Z" />
        </svg>
      );
    case 'long_bodysuit':
    case 'thermal_base':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M8 4h8l5 5-2 2-3-2v7l-4 4-4-4V9l-3 2-2-2 5-5Z" />
        </svg>
      );
    case 'light_pajama':
    case 'cotton_sleeper':
    case 'fleece_sleeper':
    case 'thermal_sleeper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M8 3h8l4 4-2 2-2-1.5V20h-3v-5h-2v5H8V7.5L6 9 4 7l4-4Z" />
        </svg>
      );
    case 'sweater':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M7 4h10l4 5-2.5 2L16 9v10H8V9L5.5 11 3 9l4-5Z" />
        </svg>
      );
    case 'swaddle_thin':
    case 'swaddle_cotton':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <circle cx="12" cy="5.5" r="2.5" />
          <path d="M7 10c0-1 2-2 5-2s5 1 5 2l-1.5 9.5a3.5 3.5 0 0 1-7 0L7 10Z" />
          <path d="M8 12l8 3M16 12l-8 3" />
        </svg>
      );
    case 'sleep_sack':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M9 4h6l2 4v10a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V8l2-4Z" />
          <path d="M12 8v10" />
        </svg>
      );
    case 'fleece_blanket':
    case 'loose_blanket':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.5" />
          <path d="M4 10h16M8 5v14" />
        </svg>
      );
  }
}

export function SelectedLayersPreview({
  base,
  mid,
  outer,
}: {
  readonly base: BaseLayerId;
  readonly mid: MidLayerId;
  readonly outer: OuterLayerId;
}) {
  const baseOpt =
    BASE_LAYER_OPTIONS.find((o) => o.id === base) ?? BASE_LAYER_OPTIONS[0]!;
  const midOpt =
    MID_LAYER_OPTIONS.find((o) => o.id === mid) ?? MID_LAYER_OPTIONS[0]!;
  const outerOpt =
    OUTER_LAYER_OPTIONS.find((o) => o.id === outer) ?? OUTER_LAYER_OPTIONS[0]!;

  const items = [
    { title: 'Capa base', option: baseOpt },
    { title: 'Capa media', option: midOpt },
    { title: 'Capa exterior', option: outerOpt },
  ] as const;

  return (
    <div
      aria-label="Referencia visual de prendas seleccionadas"
      className="grid gap-2 sm:grid-cols-3"
    >
      {items.map(({ title, option }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-xl border border-border-interactive bg-bg-elevated p-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-primary bg-brand-surface text-brand-text">
            <GarmentIcon kind={option.visualKind} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {title}
            </p>
            <p className="truncate text-xs font-bold text-ink-primary">
              {option.labelMx}
            </p>
            <p className="text-[11px] text-brand-text tabular-nums">
              {option.tog === null ? 'Sin TOG seguro' : `${option.tog} TOG`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
