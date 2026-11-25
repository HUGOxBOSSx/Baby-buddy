'use client';

import {
  STAGE_SPECS,
  formatMeasurement,
} from '@baby-buddy/core';
import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import { DailyLogPanel } from '@/components/DailyLogPanel';
import { MascotAvatar } from '@/components/MascotAvatar';
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
      <header className="flex items-center gap-3">
        <MascotAvatar variant="home" size="lg" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Hoy · {themeMode === 'night_3am' ? 'Modo nocturno activo' : 'Modo Día Calma'}
          </p>
          <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
            Registro diario
          </h1>
        </div>
      </header>

      <DailyLogPanel />

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
    </div>
  );
}
