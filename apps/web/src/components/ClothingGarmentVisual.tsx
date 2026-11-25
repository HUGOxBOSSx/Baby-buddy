'use client';

import type {
  AccessoryId,
  BaseLayerId,
  GarmentVisualKind,
  MidLayerId,
  OuterLayerId,
} from '@baby-buddy/core';
import {
  ACCESSORY_OPTIONS,
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
    case 'hat':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M5 16a7 7 0 0 1 14 0" />
          <rect x="4" y="16" width="16" height="3" rx="1.5" />
        </svg>
      );
    case 'mittens':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M8 18V9a4 4 0 0 1 8 0v4l2 1v4H8Z" />
        </svg>
      );
    case 'socks':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
          <path d="M9 4h6v9l3 3a2.5 2.5 0 0 1-3.5 3.5L9 14V4Z" />
        </svg>
      );
  }
}

export function SelectedLayersPreview({
  base,
  mid,
  outer,
  accessories = [],
}: {
  readonly base: readonly BaseLayerId[];
  readonly mid: readonly MidLayerId[];
  readonly outer: readonly OuterLayerId[];
  readonly accessories?: readonly AccessoryId[];
}) {
  const selected = [
    ...base.map(
      (id) => BASE_LAYER_OPTIONS.find((o) => o.id === id) ?? BASE_LAYER_OPTIONS[0]!,
    ),
    ...mid.map(
      (id) => MID_LAYER_OPTIONS.find((o) => o.id === id) ?? MID_LAYER_OPTIONS[0]!,
    ),
    ...outer.map(
      (id) => OUTER_LAYER_OPTIONS.find((o) => o.id === id) ?? OUTER_LAYER_OPTIONS[0]!,
    ),
    ...accessories.map(
      (id) => ACCESSORY_OPTIONS.find((o) => o.id === id) ?? ACCESSORY_OPTIONS[0]!,
    ),
  ].filter((o) => o.id !== 'ninguna' || base.length === 1);

  return (
    <div
      aria-label="Referencia visual de prendas seleccionadas"
      className="flex flex-wrap gap-2"
    >
      {selected.length === 0 ? (
        <span className="text-xs text-ink-secondary">Sin prendas seleccionadas</span>
      ) : (
        selected.map((option, idx) => (
          <div
            key={`${option.id}-${idx}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-primary bg-brand-surface text-brand-text">
              <GarmentIcon kind={option.visualKind} className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-ink-primary">
              {option.labelMx}
            </span>
            <span className="text-[11px] text-brand-text tabular-nums">
              {option.tog === null ? 'Sin TOG' : `${option.tog}`}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
