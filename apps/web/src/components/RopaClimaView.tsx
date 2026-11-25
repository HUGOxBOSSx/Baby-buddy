'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BASE_LAYER_OPTIONS,
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  DEFAULT_CLOTHING_CONTEXT,
  MID_LAYER_OPTIONS,
  OUTER_LAYER_OPTIONS,
  STAGE_SPECS,
  recommendClothing,
  type BaseLayerId,
  type ClothingContextFlags,
  type ClothingEnvironment,
  type MidLayerId,
  type OuterLayerId,
  type StageId,
} from '@baby-buddy/core';
import { CLOTHING_ENGINE_METADATA } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import {
  GarmentIcon,
  SelectedLayersPreview,
} from '@/components/ClothingGarmentVisual';
import { PhoneCallIcon } from '@/components/Icons';
import { StageSelector } from '@/components/StageSelector';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppState } from '@/components/ThemeProvider';

const TEMP_PRESETS = [0, 16, 21, 28, 38] as const;

const CONTEXT_CHIPS: readonly {
  readonly key: keyof Omit<ClothingContextFlags, 'coldWalls'>;
  readonly label: string;
}[] = [
  { key: 'prematureOrLowWeight', label: 'Prematuro (+1 capa)' },
  { key: 'hasFever', label: 'Fiebre (−1 capa)' },
  { key: 'hasAcOrFan', label: 'Clima / ventilador' },
  { key: 'inCarrierOrStroller', label: 'Portabebé / carriola (−1)' },
  { key: 'inCarSeat', label: 'Silla de auto' },
  { key: 'canRollOver', label: 'Ya se voltea' },
] as const;

export function RopaClimaView() {
  const { activeStageId, childProfile } = useAppState();
  const [manualStage, setManualStage] = useState<StageId>(activeStageId);
  const effectiveStage = childProfile ? childProfile.stageId : manualStage;

  const [tempC, setTempC] = useState<number>(21);
  const [environment, setEnvironment] =
    useState<ClothingEnvironment>('cuarto');
  const [context, setContext] = useState<ClothingContextFlags>(
    DEFAULT_CLOTHING_CONTEXT,
  );
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>('panalero_larga');
  const [midLayer, setMidLayer] = useState<MidLayerId>('mameluco_algodon');
  const [outerLayer, setOuterLayer] = useState<OuterLayerId>('saco_10');

  const rec = recommendClothing({
    tempC,
    environment,
    stageId: effectiveStage,
    context,
    selectedLayers: {
      base: baseLayer,
      mid: midLayer,
      outer: outerLayer,
    },
  });

  const toggleFlag = (key: keyof ClothingContextFlags) => {
    setContext((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          Motor de decisión (−5 °C a 50 °C) · 100 % offline
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
            ¿Cuánta ropa le pongo?
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
        <p className="text-sm text-ink-secondary">
          Etapa activa:{' '}
          <strong className="text-ink-primary">
            {STAGE_SPECS[effectiveStage].label}
          </strong>
          . Incluye opciones cotidianas sin saco TOG y protocolos de calor o
          frío extremo.
        </p>
      </header>

      {childProfile ? null : (
        <StageSelector
          selectedStage={manualStage}
          onSelectStage={setManualStage}
          label="Etapa para calcular vestimenta"
        />
      )}

      {/* Tarjeta 1: Hero Status Deck */}
      <section
        aria-label="Resultado de vestimenta y seguridad térmica"
        className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-5 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-1">
            <p className="text-xs font-semibold uppercase text-ink-muted">
              Temperatura efectiva ({environment === 'cuarto' ? 'cuarto' : 'exterior'})
            </p>
            <p className="text-3xl font-bold text-ink-primary tabular-nums">
              {rec.effectiveTempC} °C
            </p>
            <p className="text-xs text-ink-secondary tabular-nums">
              {environment === 'cuarto' && context.coldWalls
                ? `${rec.tempC} °C − 1.5 °C por muros fríos`
                : 'Sin ajuste por muros fríos'}
            </p>
          </div>

          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-1">
            <p className="text-xs font-semibold uppercase text-ink-muted">
              Abrigo actual vs. recomendado
            </p>
            <p className="text-3xl font-bold text-ink-primary tabular-nums">
              {rec.currentTog === null ? 'Inseguro' : `${rec.currentTog} TOG`}
            </p>
            <p className="text-xs text-brand-text font-semibold tabular-nums">
              Recomendado: {rec.recommendedTogRange.min} –{' '}
              {rec.recommendedTogRange.max} TOG
            </p>
          </div>
        </div>

        {/* Barra de confort térmico de 3 zonas */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
              Zona de confort térmico
            </span>
            <StatusBadge severity={rec.severity} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
            <div
              className={`rounded-xl border px-2 py-2 ${
                rec.comfortZone === 'cold'
                  ? 'border-brand-primary bg-brand-surface text-brand-text'
                  : 'border-border-interactive bg-bg-elevated text-ink-muted opacity-50'
              }`}
            >
              Puede tener frío
            </div>
            <div
              className={`rounded-xl border px-2 py-2 ${
                rec.comfortZone === 'optimal'
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-elevated text-ink-muted opacity-50'
              }`}
            >
              Abrigo óptimo
            </div>
            <div
              className={`rounded-xl border px-2 py-2 ${
                rec.comfortZone === 'overheat' ||
                rec.comfortZone === 'unsafe_sleep'
                  ? 'border-alert-red bg-alert-surface text-alert-text'
                  : 'border-border-interactive bg-bg-elevated text-ink-muted opacity-50'
              }`}
            >
              {rec.looseBlanketAlert ? 'Sueño inseguro' : 'Sobrecalentamiento'}
            </div>
          </div>
        </div>

        {rec.looseBlanketAlert ? (
          <div
            role="alert"
            className="rounded-2xl border-2 border-alert-red bg-alert-surface p-4 space-y-1"
          >
            <p className="text-sm font-bold text-alert-text">
              Alerta de sueño inseguro en menores de 12 meses
            </p>
            <p className="text-sm text-ink-primary">{rec.togDeltaMx}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border-interactive bg-bg-elevated p-4 space-y-1">
            <p className="text-sm font-bold text-ink-primary">{rec.headlineMx}</p>
            <p className="text-sm text-ink-secondary">{rec.togDeltaMx}</p>
          </div>
        )}

        <SelectedLayersPreview
          base={baseLayer}
          mid={midLayer}
          outer={outerLayer}
        />

        <div className="space-y-2">
          <h2 className="text-sm font-bold text-ink-primary">
            Recomendación por capas (incluye opciones sin saco)
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {rec.layersMx.map((layer) => (
              <li key={layer}>{layer}</li>
            ))}
          </ul>
        </div>

        {rec.actionsMx.length > 0 ? (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-ink-primary">Qué hacer</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-secondary">
              {rec.actionsMx.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {rec.doNotDoMx.length > 0 ? (
          <div className="rounded-2xl border border-alert-red bg-alert-surface p-4 space-y-1.5">
            <h2 className="text-sm font-bold text-alert-text">Qué NO hacer</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
              {rec.doNotDoMx.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="rounded-xl border border-warm bg-warm-surface px-4 py-3 text-xs font-semibold text-ink-primary">
          Verificación táctil: {rec.touchCheckMx}
        </p>

        {rec.emergency911Visible ? (
          <a
            href="tel:911"
            className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-2xl bg-alert-red px-5 py-3 text-sm font-bold text-alert-on hover:opacity-95"
          >
            <PhoneCallIcon className="h-5 w-5 shrink-0" />
            <span>Llamar al 911 si observas signos de alarma (Gratis)</span>
          </a>
        ) : null}
      </section>

      {/* Tarjeta 2: Controles interactivos */}
      <section
        aria-label="Controles de temperatura y simulador de prendas"
        className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-5 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-2">
          {(['cuarto', 'exterior'] as const).map((env) => {
            const active = environment === env;
            return (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                aria-pressed={active}
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-2 text-sm font-bold ${
                  active
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                {env === 'cuarto' ? 'Cuarto (dormir / casa)' : 'Exterior (paseo)'}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="temp-slider"
              className="text-sm font-bold text-ink-primary"
            >
              Temperatura en °C (−5 °C a 50 °C)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setTempC((t) => Math.max(CLOTHING_MIN_TEMP_C, t - 1))
                }
                aria-label="Bajar 1 grado Celsius"
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-3 text-base font-bold text-ink-primary"
              >
                −1 °C
              </button>
              <span className="min-w-[4.5rem] text-center text-lg font-bold text-brand-text tabular-nums">
                {tempC} °C
              </span>
              <button
                type="button"
                onClick={() =>
                  setTempC((t) => Math.min(CLOTHING_MAX_TEMP_C, t + 1))
                }
                aria-label="Subir 1 grado Celsius"
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-elevated px-3 text-base font-bold text-ink-primary"
              >
                +1 °C
              </button>
            </div>
          </div>

          <input
            id="temp-slider"
            type="range"
            min={CLOTHING_MIN_TEMP_C}
            max={CLOTHING_MAX_TEMP_C}
            step={1}
            value={tempC}
            onChange={(e) => setTempC(Number.parseInt(e.target.value, 10))}
            className="w-full accent-brand-primary"
          />

          <div className="flex flex-wrap gap-2">
            {TEMP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTempC(preset)}
                className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-bold tabular-nums ${
                  tempC === preset
                    ? 'border-brand-primary bg-brand-surface text-brand-text'
                    : 'border-border-interactive bg-bg-elevated text-ink-secondary'
                }`}
              >
                {preset} °C
              </button>
            ))}
          </div>
        </div>

        {environment === 'cuarto' ? (
          <button
            type="button"
            onClick={() => toggleFlag('coldWalls')}
            aria-pressed={context.coldWalls}
            className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
              context.coldWalls
                ? 'border-brand-primary bg-brand-surface text-brand-text'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            <span>Muros fríos o cuna cerca de pared exterior</span>
            <span className="text-xs font-bold tabular-nums">−1.5 °C</span>
          </button>
        ) : null}

        {/* Simulador de 3 capas con referencias visuales */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
              1. Capa base
            </p>
            <div className="flex flex-wrap gap-2">
              {BASE_LAYER_OPTIONS.map((opt) => {
                const selected = baseLayer === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBaseLayer(opt.id)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                      selected
                        ? 'border-brand-primary bg-brand-surface text-brand-text'
                        : 'border-border-interactive bg-bg-elevated text-ink-primary'
                    }`}
                  >
                    <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                    <span>{opt.labelMx}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
              2. Capa media
            </p>
            <div className="flex flex-wrap gap-2">
              {MID_LAYER_OPTIONS.map((opt) => {
                const selected = midLayer === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMidLayer(opt.id)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                      selected
                        ? 'border-brand-primary bg-brand-surface text-brand-text'
                        : 'border-border-interactive bg-bg-elevated text-ink-primary'
                    }`}
                  >
                    <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                    <span>{opt.labelMx}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
              3. Cobija, manta o saco exterior
            </p>
            <div className="flex flex-wrap gap-2">
              {OUTER_LAYER_OPTIONS.map((opt) => {
                const selected = outerLayer === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOuterLayer(opt.id)}
                    aria-pressed={selected}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                      selected
                        ? 'border-brand-primary bg-brand-surface text-brand-text'
                        : 'border-border-interactive bg-bg-elevated text-ink-primary'
                    }`}
                  >
                    <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                    <span>{opt.labelMx}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
            Contexto adicional (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_CHIPS.map((chip) => {
              const active = context[chip.key];
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleFlag(chip.key)}
                  aria-pressed={active}
                  className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
                    active
                      ? 'border-brand-primary bg-brand-primary text-brand-on'
                      : 'border-border-interactive bg-bg-elevated text-ink-primary'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <ClinicalMetadataBlock metadata={CLOTHING_ENGINE_METADATA} />
    </div>
  );
}
