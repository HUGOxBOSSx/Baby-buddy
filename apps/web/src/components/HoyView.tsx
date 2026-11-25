'use client';

import Link from 'next/link';
import {
  STAGE_SPECS,
  formatMeasurement,
} from '@baby-buddy/core';
import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import {
  BookOpenIcon,
  HeartPulseIcon,
  PhoneCallIcon,
  ShirtIcon,
} from '@/components/Icons';
import { StageSelector } from '@/components/StageSelector';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppState } from '@/components/ThemeProvider';

export function HoyView() {
  const { activeStageId, childProfile, themeMode } = useAppState();
  const stageSpec = STAGE_SPECS[activeStageId];
  const overview = STAGE_OVERVIEWS[activeStageId];
  const formattedMetric = formatMeasurement(overview.sampleMetric);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          Hoy · {themeMode === 'night_3am' ? 'Modo 3:00 AM activo' : 'Modo Día Calma'}
        </p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
          Resumen diario
        </h1>
      </header>

      {childProfile ? (
        <section
          aria-label="Perfil infantil local"
          className="rounded-2xl border border-brand-primary bg-brand-surface p-4 space-y-1"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Perfil local guardado en este dispositivo
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink-primary">
              {childProfile.nicknameMx} · {childProfile.ageMonths}{' '}
              {childProfile.ageMonths === 1 ? 'mes' : 'meses'}
            </h2>
            <span className="rounded-full border border-brand-primary bg-bg-card px-3 py-1 text-xs font-semibold text-brand-text">
              Etapa: {STAGE_SPECS[childProfile.stageId].label}
            </span>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="selector-etapa-titulo" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="selector-etapa-titulo"
            className="text-lg font-bold text-ink-primary"
          >
            {childProfile ? 'Etapa automática de tu bebé' : 'Etapa activa'}
          </h2>
          {childProfile ? (
            <Link
              href="/salud#perfil-bebe"
              className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs font-bold text-brand-text hover:bg-brand-surface"
            >
              Cambiar datos del bebé
            </Link>
          ) : null}
        </div>
        {childProfile ? (
          <p className="text-sm text-ink-secondary">
            Mostrando únicamente la información de{' '}
            <strong className="text-ink-primary">{stageSpec.label}</strong> según
            la edad de {childProfile.nicknameMx}.
          </p>
        ) : (
          <StageSelector />
        )}
      </section>

      <section
        aria-labelledby="resumen-etapa-titulo"
        className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge severity="normal" />
          <span className="rounded-xl border border-border-interactive bg-bg-elevated px-3 py-1.5 text-sm font-bold text-ink-primary">
            Referencia métrica: {formattedMetric}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            {stageSpec.label}
          </p>
          <h2
            id="resumen-etapa-titulo"
            className="text-xl font-bold text-ink-primary"
          >
            {overview.headlineMx}
          </h2>
          <p className="text-sm text-ink-secondary">{stageSpec.focusSummaryMx}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-ink-primary">
            Puntos de orientación para hoy
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-primary">
            {overview.orientationPointsMx.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <ClinicalMetadataBlock metadata={overview.metadata} />
      </section>

      <section aria-labelledby="accesos-rapidos-titulo" className="space-y-3">
        <h2
          id="accesos-rapidos-titulo"
          className="text-lg font-bold text-ink-primary"
        >
          Accesos rápidos (hasta en 3 toques de madrugada)
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/salud"
            className="flex min-h-12 min-w-12 items-center gap-3 rounded-2xl border-2 border-alert-red bg-alert-surface p-4 font-bold text-alert-text hover:opacity-95"
          >
            <PhoneCallIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Urgencias 911 y Salud</p>
              <p className="text-xs font-normal text-ink-primary">
                Señales de alerta roja sin costo
              </p>
            </div>
          </Link>

          <Link
            href="/guias"
            className="flex min-h-12 min-w-12 items-center gap-3 rounded-2xl border border-border-interactive bg-bg-card p-4 font-semibold text-ink-primary hover:bg-bg-elevated"
          >
            <BookOpenIcon className="h-5 w-5 shrink-0 text-brand-text" />
            <div>
              <p className="text-sm font-bold">Guías educativas</p>
              <p className="text-xs font-normal text-ink-secondary">
                Fiebre en °C, rozadura y mamila
              </p>
            </div>
          </Link>

          <Link
            href="/ropa-y-clima"
            className="flex min-h-12 min-w-12 items-center gap-3 rounded-2xl border border-border-interactive bg-bg-card p-4 font-semibold text-ink-primary hover:bg-bg-elevated"
          >
            <ShirtIcon className="h-5 w-5 shrink-0 text-warm-text" />
            <div>
              <p className="text-sm font-bold">Ropa y Clima</p>
              <p className="text-xs font-normal text-ink-secondary">
                Pañalero y mameluco por °C
              </p>
            </div>
          </Link>
        </div>

        <div className="rounded-xl border border-border-interactive bg-bg-elevated p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <HeartPulseIcon className="h-5 w-5 shrink-0 text-alert-text" />
            <span>
              ¿Señales de alarma o fiebre &gt;= 38.0 °C en menor de 3 meses?
            </span>
          </div>
          <Link
            href="/salud"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-alert-text px-4 py-2 text-sm font-bold text-alert-on hover:opacity-95"
          >
            Ir a Salud y 911
          </Link>
        </div>
      </section>
    </div>
  );
}
