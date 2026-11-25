'use client';

import { useState } from 'react';
import { STAGE_SPECS, type StageId } from '@baby-buddy/core';
import { M1_GUIDE_SCAFFOLDS } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import { GuideDisclaimerHeader } from '@/components/GuideDisclaimerHeader';
import { StageSelector } from '@/components/StageSelector';
import { StatusBadge } from '@/components/StatusBadge';

export function GuiasView() {
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');

  const filteredGuides =
    stageFilter === 'all'
      ? M1_GUIDE_SCAFFOLDS
      : M1_GUIDE_SCAFFOLDS.filter((guide) => guide.stage === stageFilter);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          Guías clínicas de referencia
        </p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
          Guías educativas por etapa
        </h1>
      </header>

      <GuideDisclaimerHeader />

      <section aria-labelledby="filtro-guias-titulo" className="space-y-3">
        <h2
          id="filtro-guias-titulo"
          className="text-base font-bold text-ink-primary"
        >
          Filtrar por etapa
        </h2>
        <StageSelector
          selectedStage={stageFilter}
          onSelectStage={(stage) => setStageFilter(stage)}
          includeAllOption
          onSelectAll={() => setStageFilter('all')}
          label="Filtrar guías por etapa"
        />
      </section>

      {filteredGuides.length === 0 ? (
        <section
          role="status"
          className="rounded-2xl border border-border-interactive bg-bg-card p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-ink-primary">
            Sin guías específicas para {STAGE_SPECS[stageFilter as StageId].label} en
            el catálogo inicial
          </h2>
          <p className="text-sm text-ink-secondary">
            El catálogo del Hito 1–2 incluye guías base para 0–3m, 3–12m y
            1–3a. Las guías específicas de 3 a 6 años se agregarán en una
            actualización posterior.
          </p>
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-brand-on hover:opacity-95"
          >
            Ver todas las guías ({M1_GUIDE_SCAFFOLDS.length})
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map((guide) => (
            <article
              key={guide.id}
              className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge severity={guide.severity} />
                <span className="rounded-full border border-border-interactive bg-bg-elevated px-3 py-1 text-xs font-semibold text-brand-text">
                  Etapa: {STAGE_SPECS[guide.stage].label}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-ink-primary">
                  {guide.titleMx}
                </h2>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {guide.summaryMx}
                </p>
              </div>

              <div className="rounded-xl border border-alert-red bg-alert-surface p-4 space-y-2">
                <h3 className="text-sm font-bold text-alert-text">
                  Señales de alerta para consultar al pediatra o llamar al 911
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
                  {guide.redFlagsMx.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>

              <ClinicalMetadataBlock metadata={guide.metadata} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
