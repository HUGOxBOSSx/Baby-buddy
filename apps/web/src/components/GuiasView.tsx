'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  STAGE_SPECS,
  type StageId,
  type TriageLevel,
} from '@baby-buddy/core';
import {
  GUIDE_CATEGORIES_MX,
  askEditorialAssistantMx,
  getRelatedGuideLinks,
  searchClinicalGuides,
  type ClinicalGuideEntry,
  type EditorialAssistantReply,
} from '@baby-buddy/content';
import { MascotAvatar } from '@/components/MascotAvatar';
import { PoopColorChart } from '@/components/PoopColorChart';
import { StageSelector } from '@/components/StageSelector';
import { useAppState } from '@/components/ThemeProvider';
import { TriageBadge } from '@/components/TriageBadge';

type ViewTab = 'es_normal' | 'no_es_normal' | 'urgencia' | 'popo';
type SubFilter = TriageLevel;

const TABS: readonly { readonly id: ViewTab; readonly label: string }[] = [
  { id: 'es_normal', label: 'Es normal' },
  { id: 'no_es_normal', label: 'No es normal' },
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'popo', label: 'Popó' },
] as const;

const SUB_FILTERS: readonly {
  readonly id: SubFilter;
  readonly label: string;
}[] = [
  { id: 'green_home', label: 'Verde' },
  { id: 'yellow_pediatrician', label: 'Amarillo' },
  { id: 'orange_urgent', label: 'Consulta hoy' },
  { id: 'red_911', label: 'Urgencia 911' },
] as const;

const TRIAGE_GROUP_ORDER: readonly TriageLevel[] = [
  'red_911',
  'orange_urgent',
  'yellow_pediatrician',
  'green_home',
];

export function GuiasView() {
  const { childProfile, activeStageId } = useAppState();
  const [query, setQuery] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantReply, setAssistantReply] =
    useState<EditorialAssistantReply | null>(null);
  const [tab, setTab] = useState<ViewTab>('es_normal');
  const [subFilter, setSubFilter] = useState<SubFilter>('green_home');
  const [categoryFilter, setCategoryFilter] = useState<string>('Recién nacido');
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');
  const [includeOtherAges, setIncludeOtherAges] = useState(false);

  const effectiveStage: StageId | 'all' =
    childProfile && !includeOtherAges ? childProfile.stageId : stageFilter;

  const normalityParam = tab === 'popo' ? 'all' : tab;

  const level1Pool = searchClinicalGuides({
    stageId: effectiveStage,
    normality: normalityParam,
  });

  const availableSubFilters = SUB_FILTERS.filter((opt) =>
    level1Pool.some((g) => g.triageLevel === opt.id),
  );

  const effectiveSubFilter: SubFilter = availableSubFilters.some(
    (opt) => opt.id === subFilter,
  )
    ? subFilter
    : (availableSubFilters[0]?.id ?? 'green_home');

  const level2Pool = searchClinicalGuides({
    stageId: effectiveStage,
    normality: normalityParam,
    triageLevel: effectiveSubFilter,
  });

  const availableCategories = GUIDE_CATEGORIES_MX.filter((cat) =>
    level2Pool.some((g) => g.categoryMx === cat),
  );

  const effectiveCategory: string = availableCategories.includes(categoryFilter)
    ? categoryFilter
    : (availableCategories[0] ?? 'all');

  const guides = searchClinicalGuides({
    query,
    stageId: effectiveStage,
    normality: normalityParam,
    triageLevel: effectiveSubFilter,
    categoryMx: effectiveCategory,
  });

  const groupedGuides = TRIAGE_GROUP_ORDER.map((level) => ({
    level,
    items: guides.filter((g) => g.triageLevel === level),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <MascotAvatar variant="es_normal" size="md" />
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Guías por etapa y síntomas
          </p>
          <h1 className="text-xl font-bold text-ink-primary sm:text-2xl">
            ¿Es normal?
          </h1>
        </div>
      </header>

      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Buscar en guías</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: fiebre, hipo, popó, berrinche..."
            className="block min-h-12 w-full rounded-2xl border border-border-interactive bg-bg-card px-4 py-3 text-sm text-ink-primary shadow-sm"
          />
        </label>

        {/* Asistente editorial acotado al corpus (Hito 6 offline) */}
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-2.5">
          <button
            type="button"
            onClick={() => setAssistantOpen((v) => !v)}
            aria-expanded={assistantOpen}
            className="flex w-full items-center justify-between text-left text-xs font-bold text-brand-text"
          >
            <span>Asistente editorial (solo guías verificadas)</span>
            <span>{assistantOpen ? 'Ocultar' : 'Preguntar'}</span>
          </button>
          {assistantOpen ? (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ej. Mi bebé tiene hipo o fiebre..."
                  className="min-h-12 flex-1 min-w-[180px] rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs text-ink-primary"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAssistantReply(
                      askEditorialAssistantMx({
                        queryMx: assistantInput,
                        ageMonths: childProfile?.ageMonths ?? 2,
                        stageId: childProfile?.stageId ?? activeStageId,
                      }),
                    )
                  }
                  className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
                >
                  Consultar
                </button>
              </div>
              {assistantReply ? (
                <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2">
                  <TriageBadge level={assistantReply.triageLevel} />
                  <p className="text-sm font-bold text-ink-primary">
                    {assistantReply.headlineMx}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {assistantReply.answerMx}
                  </p>
                  {assistantReply.actionStepsMx.length > 0 ? (
                    <ul className="list-disc pl-4 text-xs text-ink-primary space-y-0.5">
                      {assistantReply.actionStepsMx.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  ) : null}
                  {assistantReply.isEmergency911 ? (
                    <a
                      href="tel:911"
                      className="inline-flex min-h-12 items-center rounded-xl bg-alert-text px-4 py-2 text-xs font-bold text-alert-on"
                    >
                      Llamar al 911 (Gratis)
                    </a>
                  ) : null}
                  {assistantReply.citations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assistantReply.citations.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/guias/${c.slug}`}
                          className="inline-flex min-h-9 items-center rounded-full border border-brand-primary bg-brand-surface px-3 py-1 text-[11px] font-bold text-brand-text"
                        >
                          {c.titleMx} →
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-[11px] text-ink-muted">
                    {assistantReply.disclaimerMx}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              const isUrgencia = t.id === 'urgencia';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap ${
                    isUrgencia
                      ? active
                        ? 'border-alert-red bg-alert-surface text-alert-text ring-2 ring-alert-red'
                        : 'border-alert-red bg-alert-surface text-alert-text'
                      : active
                        ? 'border-brand-primary bg-brand-primary text-brand-on'
                        : 'border-border-interactive bg-bg-card text-ink-primary'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab !== 'popo' && availableSubFilters.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por nivel de atención">
              {availableSubFilters.map((c) => {
                const active = effectiveSubFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSubFilter(c.id)}
                    aria-pressed={active}
                    className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      active
                        ? 'border-brand-primary bg-brand-primary text-brand-on'
                        : 'border-border-interactive bg-bg-card text-ink-primary'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {tab !== 'popo' && availableCategories.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por tema">
              {availableCategories.map((cat) => {
                const active = effectiveCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                      active
                        ? 'border-brand-primary bg-brand-surface text-brand-text'
                        : 'border-border-interactive bg-bg-card text-ink-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {childProfile ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
              <span>
                {includeOtherAges ? (
                  'Mostrando todas las edades'
                ) : (
                  <>
                    Mostrando etapa automática:{' '}
                    <strong className="text-ink-primary">
                      {STAGE_SPECS[childProfile.stageId].label}
                    </strong>
                  </>
                )}
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
            {includeOtherAges ? (
              <StageSelector
                selectedStage={stageFilter}
                onSelectStage={(stage) => setStageFilter(stage)}
                includeAllOption
                onSelectAll={() => setStageFilter('all')}
                label="Filtrar guías por edad"
              />
            ) : null}
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

      {tab === 'urgencia' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-alert-red bg-alert-surface p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-alert-text">
              Rojo: 911 / atención inmediata · Naranja: atención o consulta hoy
            </p>
            <p className="text-xs text-ink-primary">
              Ante cualquier señal roja o duda grave, no esperes.
            </p>
          </div>
          <a
            href="tel:911"
            className="inline-flex min-h-12 items-center rounded-xl bg-alert-red px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            Llamar al 911 (Gratis)
          </a>
        </div>
      ) : null}

      {tab === 'popo' ? (
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
            Prueba otra palabra (ej. fiebre, cólicos, popó, berrinche) o limpia
            los filtros activos.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTab('es_normal');
              setSubFilter('green_home');
              setCategoryFilter('Recién nacido');
            }}
            className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-brand-on"
          >
            Limpiar filtros
          </button>
        </section>
      ) : (
        <div className="space-y-6">
          {groupedGuides.map((group) => (
            <section key={group.level} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
                <TriageBadge level={group.level} />
                <span className="text-xs font-semibold text-ink-secondary">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'guía' : 'guías'}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((guide: ClinicalGuideEntry) => (
                  <article
                    key={guide.slug}
                    className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-ink-primary">
                        {guide.titleMx}
                      </h2>
                      <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-0.5 text-xs font-semibold text-brand-text">
                        {guide.categoryMx}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-brand-text">
                        {guide.quickAnswerMx}
                      </p>
                      <p className="line-clamp-2 text-xs text-ink-secondary">
                        {guide.summaryMx}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/guias/${guide.slug}`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text hover:opacity-90"
                      >
                        <span>Qué SÍ hacer y qué NO hacer</span>
                        <span aria-hidden="true" className="text-xl leading-none">
                          →
                        </span>
                      </Link>
                      {getRelatedGuideLinks(guide.slug, effectiveStage).map((rel) => {
                        const toneCls =
                          rel.tone === 'normal_green'
                            ? 'border-brand-primary bg-brand-surface text-brand-text'
                            : rel.tone === 'not_normal_yellow'
                              ? 'border-warm bg-warm-surface text-warm-text'
                              : 'border-alert-red bg-alert-surface text-alert-text';
                        return (
                          <Link
                            key={rel.slug}
                            href={`/guias/${rel.slug}`}
                            className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold hover:opacity-90 ${toneCls}`}
                          >
                            <span>
                              {rel.prefixMx} {rel.titleMx}
                            </span>
                            <span aria-hidden="true" className="text-lg leading-none">
                              →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
