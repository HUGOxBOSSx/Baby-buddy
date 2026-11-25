'use client';

import Link from 'next/link';
import { useState } from 'react';
import { STAGE_SPECS, type StageId } from '@baby-buddy/core';
import { searchClinicalGuides, type GuideKind } from '@baby-buddy/content';
import { PoopColorChart } from '@/components/PoopColorChart';
import { QuickTriageChecker } from '@/components/QuickTriageChecker';
import { StageSelector } from '@/components/StageSelector';
import { useAppState } from '@/components/ThemeProvider';
import { TriageBadge } from '@/components/TriageBadge';

type ViewTab =
  | 'all'
  | 'es_normal'
  | 'problema_solucion'
  | 'primeros_auxilios'
  | 'popo'
  | 'semaforo';

const TABS: readonly { readonly id: ViewTab; readonly label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'es_normal', label: '¿Es normal?' },
  { id: 'problema_solucion', label: 'Soluciones' },
  { id: 'primeros_auxilios', label: 'Auxilios' },
  { id: 'popo', label: 'Tabla popó' },
  { id: 'semaforo', label: 'Semáforo 3 AM' },
] as const;

export function GuiasView() {
  const { childProfile } = useAppState();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ViewTab>('all');
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');
  const [includeOtherAges, setIncludeOtherAges] = useState(false);

  const effectiveStage: StageId | 'all' =
    childProfile && !includeOtherAges ? childProfile.stageId : stageFilter;

  const kindFilter: GuideKind | 'all' =
    tab === 'es_normal' ||
    tab === 'problema_solucion' ||
    tab === 'primeros_auxilios'
      ? tab
      : 'all';

  const guides = searchClinicalGuides({
    query,
    stageId: effectiveStage,
    kind: kindFilter,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          Buscador 3:00 AM · ¿Es normal? · Problemas y Soluciones
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
            Guías y Semáforo de Triaje
          </h1>
          {childProfile ? (
            <Link
              href="/salud#perfil-bebe"
              className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs font-bold text-brand-text hover:bg-brand-surface"
            >
              Cambiar datos del bebé
            </Link>
          ) : null}
        </div>
      </header>

      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Buscar en guías</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca: hipo, fiebre, pujos, berrinche, anís, atragantamiento..."
            className="block min-h-12 w-full rounded-2xl border border-border-interactive bg-bg-card px-4 py-3 text-sm text-ink-primary shadow-sm"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`inline-flex min-h-12 items-center rounded-full border px-4 py-2 text-xs font-bold ${
                  active
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {childProfile ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
            <span>
              Mostrando etapa automática:{' '}
              <strong className="text-ink-primary">
                {STAGE_SPECS[childProfile.stageId].label}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setIncludeOtherAges((v) => !v)}
              aria-pressed={includeOtherAges}
              className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-3 py-1.5 font-semibold text-brand-text"
            >
              {includeOtherAges
                ? 'Solo etapa de mi bebé'
                : 'Incluir todas las edades'}
            </button>
          </div>
        ) : (
          <StageSelector
            selectedStage={stageFilter}
            onSelectStage={(stage) => setStageFilter(stage)}
            includeAllOption
            onSelectAll={() => setStageFilter('all')}
            label="Filtrar guías por etapa"
          />
        )}
      </div>

      {tab === 'semaforo' ? (
        <QuickTriageChecker />
      ) : tab === 'popo' ? (
        <PoopColorChart />
      ) : guides.length === 0 ? (
        <section
          role="status"
          className="rounded-2xl border border-border-interactive bg-bg-card p-6 space-y-3"
        >
          <h2 className="text-lg font-bold text-ink-primary">
            Sin resultados para &ldquo;{query}&rdquo;
          </h2>
          <p className="text-sm text-ink-secondary">
            Prueba otra palabra (ej. fiebre, cólicos, popó, berrinche) o abre
            el Semáforo 3 AM.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTab('all');
            }}
            className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-brand-on"
          >
            Limpiar búsqueda
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {guides.map((guide) => (
            <article
              key={guide.slug}
              className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TriageBadge level={guide.triageLevel} />
                <span className="rounded-full border border-border-interactive bg-bg-elevated px-3 py-1 text-xs font-semibold text-brand-text">
                  {guide.categoryMx}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-ink-primary">
                  {guide.titleMx}
                </h2>
                <p className="text-sm font-semibold text-brand-text">
                  {guide.quickAnswerMx}
                </p>
                <p className="text-sm text-ink-secondary">{guide.summaryMx}</p>
              </div>

              <Link
                href={`/guias/${guide.slug}`}
                className="inline-flex min-h-12 items-center rounded-xl border border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text hover:opacity-90"
              >
                Ver guía completa (Qué SÍ / Qué NO hacer) →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
