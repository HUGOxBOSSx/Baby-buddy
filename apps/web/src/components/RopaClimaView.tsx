'use client';

import { useState } from 'react';
import { STAGE_SPECS, type StageId } from '@baby-buddy/core';
import { M1_CLOTHING_SCAFFOLDS } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import { ShirtIcon } from '@/components/Icons';
import { StageSelector } from '@/components/StageSelector';

export function RopaClimaView() {
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');

  const filteredItems =
    stageFilter === 'all'
      ? M1_CLOTHING_SCAFFOLDS
      : M1_CLOTHING_SCAFFOLDS.filter((item) => item.stage === stageFilter);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          Vestimenta infantil en °C
        </p>
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
          Ropa y Clima (orientación estática)
        </h1>
      </header>

      <section
        aria-label="Alcance de Ropa y Clima en Hito 2"
        className="rounded-2xl border border-warm bg-warm-surface p-4 space-y-1.5"
      >
        <h2 className="text-base font-bold text-warm-text">
          Tarjetas estáticas de referencia por temperatura en °C
        </h2>
        <p className="text-sm text-ink-primary">
          Esta sección muestra recomendaciones orientativas con prendas comunes
          en México (como pañalero y mameluco). La consulta automática del clima
          y el cálculo dinámico de capas o índice TOG se incorporarán en un hito
          futuro; aquí no se realizan llamadas de red ni cálculos automáticos.
        </p>
      </section>

      <section aria-labelledby="filtro-ropa-titulo" className="space-y-3">
        <h2
          id="filtro-ropa-titulo"
          className="text-base font-bold text-ink-primary"
        >
          Filtrar por etapa
        </h2>
        <StageSelector
          selectedStage={stageFilter}
          onSelectStage={(stage) => setStageFilter(stage)}
          includeAllOption
          onSelectAll={() => setStageFilter('all')}
          label="Filtrar orientación de ropa por etapa"
        />
      </section>

      {filteredItems.length === 0 ? (
        <section
          role="status"
          className="rounded-2xl border border-border-interactive bg-bg-card p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-ink-primary">
            Sin tarjetas de vestimenta para{' '}
            {STAGE_SPECS[stageFilter as StageId].label} en este catálogo inicial
          </h2>
          <p className="text-sm text-ink-secondary">
            El catálogo base incluye ejemplos estáticos para 0–3m, 3–12m y
            1–3a. Puedes ver todas las tarjetas disponibles a continuación.
          </p>
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-brand-on hover:opacity-95"
          >
            Ver todas las tarjetas ({M1_CLOTHING_SCAFFOLDS.length})
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-surface px-3 py-1 text-sm font-bold text-brand-text">
                  <ShirtIcon className="h-4 w-4 shrink-0" />
                  <span>{item.ambientTempRangeC}</span>
                </span>
                <span className="rounded-full border border-border-interactive bg-bg-elevated px-3 py-1 text-xs font-semibold text-ink-primary">
                  Etapa: {STAGE_SPECS[item.stage].label}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-ink-primary">
                  Prendas sugeridas ({item.ambientTempRangeC})
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
                  {item.garmentsMx.map((garment) => (
                    <li key={garment}>{garment}</li>
                  ))}
                </ul>
              </div>

              <p className="text-sm leading-relaxed text-ink-secondary">
                {item.guidanceMx}
              </p>

              <ClinicalMetadataBlock metadata={item.metadata} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
