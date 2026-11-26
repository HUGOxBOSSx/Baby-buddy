'use client';

import { useEffect } from 'react';
import type { FabricDiagramKind, GarmentTogGuide } from '@baby-buddy/core';

function FabricCrossSectionSvg({
  kind,
}: {
  readonly kind: FabricDiagramKind;
}) {
  switch (kind) {
    case 'single_cotton':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="26" width="200" height="14" rx="7" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="2" />
          <text x="120" y="56" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            1 capa delgada y respirable
          </text>
        </svg>
      );
    case 'double_cotton':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="18" width="200" height="12" rx="6" fill="currentColor" opacity="0.24" stroke="currentColor" strokeWidth="1.8" />
          <rect x="20" y="33" width="200" height="12" rx="6" fill="currentColor" opacity="0.14" stroke="currentColor" strokeWidth="1.8" />
          <text x="120" y="59" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Doble capa de algodón (sin relleno)
          </text>
        </svg>
      );
    case 'waffle_thermal':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="18" width="200" height="24" rx="6" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.8" />
          <path d="M36 18v24M56 18v24M76 18v24M96 18v24M116 18v24M136 18v24M156 18v24M176 18v24M196 18v24M20 30h200" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
          <text x="120" y="58" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Tejido waffle (cuadritos que retienen calor)
          </text>
        </svg>
      );
    case 'brushed_fleece':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="18" width="200" height="11" rx="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M26 32q6 8 12 0t12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12 0" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.75" />
          <text x="120" y="58" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Exterior liso + interior suavizado/peludito
          </text>
        </svg>
      );
    case 'padded_quilt':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="14" width="200" height="8" rx="4" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.5" />
          <rect x="20" y="23" width="200" height="14" rx="4" fill="currentColor" opacity="0.1" stroke="currentColor" strokeDasharray="4 3" strokeWidth="1.5" />
          <rect x="20" y="38" width="200" height="8" rx="4" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1.5" />
          <text x="120" y="60" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Exterior + relleno/borrego + forro interior
          </text>
        </svg>
      );
    case 'heavy_winter_fill':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <rect x="20" y="11" width="200" height="9" rx="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6" />
          <rect x="20" y="21" width="200" height="18" rx="4" fill="currentColor" opacity="0.16" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.6" />
          <rect x="20" y="40" width="200" height="9" rx="4" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.6" />
          <text x="120" y="62" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Relleno grueso de invierno o borrega densa
          </text>
        </svg>
      );
    case 'plush_minky_polar':
      return (
        <svg viewBox="0 0 240 68" className="h-16 w-full" aria-hidden="true">
          <path d="M24 22q8-7 16 0t16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.8" />
          <rect x="20" y="25" width="200" height="14" rx="7" fill="currentColor" opacity="0.24" stroke="currentColor" strokeWidth="1.8" />
          <text x="120" y="58" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.8">
            Textura peluche / minky / polar (100% poliéster)
          </text>
        </svg>
      );
  }
}

export function GarmentTogGuideModal({
  guide,
  onClose,
}: {
  readonly guide: GarmentTogGuide;
  readonly onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="garment-tog-guide-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-interactive bg-bg-card p-5 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-full border border-brand-primary bg-brand-surface px-2.5 py-0.5 text-xs font-bold text-brand-text tabular-nums">
              +{guide.togValue} TOG
            </span>
            <h2
              id="garment-tog-guide-title"
              className="text-lg font-bold text-ink-primary"
            >
              {guide.titleMx}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-3 text-sm font-bold text-ink-primary hover:bg-brand-surface"
          >
            ✕
          </button>
        </div>

        <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-3 space-y-2 text-brand-text">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-secondary">
            <span>Nivel de abrigo</span>
            <span className="tabular-nums">{guide.warmthLevel}/5</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full ${
                  step <= guide.warmthLevel
                    ? 'bg-brand-primary'
                    : 'bg-border-interactive/40'
                }`}
              />
            ))}
          </div>
          <FabricCrossSectionSvg kind={guide.diagramKind} />
          <p className="text-xs text-ink-secondary">{guide.visualCaptionMx}</p>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-text">
            1. Qué buscar en la etiqueta
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {guide.labelCluesMx.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-text">
            2. Tacto y vista
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {guide.touchAndLookMx.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs font-semibold text-ink-secondary">
          Diferencia rápida: {guide.compareMx}
        </p>

        {guide.safetyTipMx ? (
          <p className="rounded-xl border border-alert-amber bg-alert-amber-surface px-3 py-2 text-xs font-semibold text-alert-amber-text">
            Seguridad: {guide.safetyTipMx}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-brand-on"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
