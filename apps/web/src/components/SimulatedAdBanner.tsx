'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { isAdBannerAllowed, type AppSurface } from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

const SAMPLE_ADS = [
  {
    sponsor: 'Patrocinador · Ejemplo',
    text: 'Pañales ecológicos hipoalergénicos · Envío en México',
  },
  {
    sponsor: 'Patrocinador · Ejemplo',
    text: 'Saco de dormir de algodón 1.0 TOG · 0–24 meses',
  },
] as const;

function resolveSurface(pathname: string): AppSurface {
  if (pathname.startsWith('/ropa-y-clima')) return 'clothing';
  if (pathname.startsWith('/salud')) return 'health_journal';
  if (pathname.startsWith('/guias')) return 'guides_basic';
  return 'daily_log';
}

export function SimulatedAdBanner({
  inlinePreview = false,
}: {
  readonly inlinePreview?: boolean;
}) {
  const pathname = usePathname() ?? '/';
  const { adPreview, setAdPreview } = useAppState();
  const [sampleIndex, setSampleIndex] = useState(0);

  if (!adPreview.enabled) {
    if (!inlinePreview) return null;
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-center text-xs text-ink-secondary">
        Simulación desactivada. Actívala arriba para ver el banner encima de la
        barra inferior.
      </div>
    );
  }

  const localHour =
    adPreview.hourMode === 'day_14'
      ? 14
      : adPreview.hourMode === 'night_23'
        ? 23
        : new Date().getHours();

  const surface = inlinePreview ? 'daily_log' : resolveSurface(pathname);
  const allowed = isAdBannerAllowed({
    plan: adPreview.plan,
    surface,
    localHour,
  });

  if (!allowed) {
    if (!inlinePreview) return null;
    const reason =
      adPreview.plan === 'pro'
        ? 'Oculto automáticamente en Plan Pro.'
        : 'Oculto automáticamente por horario nocturno fijo (22:00–06:00 h).';
    return (
      <div className="rounded-xl border border-brand-primary bg-brand-surface px-3 py-2.5 text-center text-xs font-semibold text-brand-text">
        {reason}
      </div>
    );
  }

  const ad = SAMPLE_ADS[sampleIndex % SAMPLE_ADS.length] ?? SAMPLE_ADS[0];

  return (
    <aside
      aria-label="Simulación de anuncio discreto"
      className={
        inlinePreview
          ? 'rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2'
          : 'mb-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-1.5'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-text">
            {ad.sponsor} · Simulación
          </p>
          <p className="truncate text-xs font-medium text-ink-primary">
            {ad.text}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSampleIndex((i) => (i + 1) % SAMPLE_ADS.length)}
            className="rounded-lg border border-border-interactive bg-bg-card px-2 py-1 text-[11px] font-semibold text-ink-secondary hover:bg-brand-surface"
          >
            Otro
          </button>
          {!inlinePreview ? (
            <button
              type="button"
              onClick={() => setAdPreview({ ...adPreview, enabled: false })}
              className="rounded-lg border border-border-interactive bg-bg-card px-2 py-1 text-[11px] font-semibold text-ink-secondary hover:text-alert-text"
            >
              Ocultar
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
