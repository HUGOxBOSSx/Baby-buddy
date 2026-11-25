'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ACCESSORY_OPTIONS,
  BASE_LAYER_OPTIONS,
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  DEFAULT_CLOTHING_CONTEXT,
  MID_LAYER_OPTIONS,
  OUTER_LAYER_OPTIONS,
  STAGE_SPECS,
  getDefaultOptimalLayers,
  recommendClothing,
  type AccessoryId,
  type BabyHealthStatus,
  type BaseLayerId,
  type ClothingContextFlags,
  type ClothingEnvironment,
  type IndoorLocation,
  type MidLayerId,
  type OutdoorTransport,
  type OutdoorWeatherCondition,
  type OuterLayerId,
  type SelectedLayersInput,
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

const HEALTH_OPTIONS: readonly {
  readonly id: BabyHealthStatus;
  readonly label: string;
}[] = [
  { id: 'termino_sano', label: 'Bebé a término / sano' },
  { id: 'prematuro', label: 'Prematuro (+1 capa)' },
  { id: 'fiebre', label: 'Fiebre (−1 capa)' },
] as const;

const INDOOR_LOCATIONS: readonly {
  readonly id: IndoorLocation;
  readonly label: string;
}[] = [
  { id: 'cuna', label: 'Cuna / moisés' },
  { id: 'cama_colecho', label: 'Cama / colecho (−1)' },
  { id: 'despierto_casa', label: 'Despierto en casa' },
  { id: 'ninguno', label: 'Ninguno' },
] as const;

const OUTDOOR_TRANSPORTS: readonly {
  readonly id: OutdoorTransport;
  readonly label: string;
}[] = [
  { id: 'ninguno', label: 'Ninguno / en brazos' },
  { id: 'portabebe', label: 'Portabebé / fular (−1)' },
  { id: 'carriola', label: 'Carriola' },
  { id: 'silla_auto', label: 'Silla de auto' },
] as const;

const INDOOR_EXTRAS: readonly {
  readonly key: 'hasAcOrFan' | 'canRollOver';
  readonly label: string;
}[] = [
  { key: 'hasAcOrFan', label: 'Clima / ventilador' },
  { key: 'canRollOver', label: 'Ya se voltea' },
] as const;

const WEATHER_CONDITIONS: readonly {
  readonly id: OutdoorWeatherCondition;
  readonly label: string;
}[] = [
  { id: 'soleado', label: 'Soleado' },
  { id: 'nublado', label: 'Nublado' },
  { id: 'lluvia', label: 'Lluvia' },
] as const;

function toggleMulti<T extends string>(
  list: readonly T[],
  id: T,
  noneId?: T,
): T[] {
  if (noneId && id === noneId) {
    return [noneId];
  }
  const withoutNone = noneId ? list.filter((x) => x !== noneId) : [...list];
  if (withoutNone.includes(id)) {
    const next = withoutNone.filter((x) => x !== id);
    return next.length === 0 && noneId ? [noneId] : next;
  }
  return [...withoutNone, id];
}

export function RopaClimaView() {
  const { activeStageId, childProfile } = useAppState();
  const [manualStage, setManualStage] = useState<StageId>(activeStageId);
  const effectiveStage = childProfile ? childProfile.stageId : manualStage;

  const [tempC, setTempC] = useState<number>(21);
  const [outdoorTempC, setOutdoorTempC] = useState<number | undefined>(undefined);
  const [weatherNote, setWeatherNote] = useState<string>('');
  const [detectingWeather, setDetectingWeather] = useState(false);
  const [environment, setEnvironment] =
    useState<ClothingEnvironment>('cuarto');
  const [context, setContext] = useState<ClothingContextFlags>(
    DEFAULT_CLOTHING_CONTEXT,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customLayers, setCustomLayers] = useState<SelectedLayersInput | null>(
    null,
  );

  const activeLayers =
    customLayers ??
    getDefaultOptimalLayers({
      tempC,
      outdoorTempC,
      environment,
      stageId: effectiveStage,
      context,
    });

  const rec = recommendClothing({
    tempC,
    outdoorTempC,
    environment,
    stageId: effectiveStage,
    context,
    selectedLayers: activeLayers,
  });

  const toggleFlag = (key: keyof ClothingContextFlags) => {
    setContext((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchJsonWithTimeout = async <T,>(
    url: string,
    timeoutMs = 6000,
  ): Promise<T> => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      window.clearTimeout(timer);
    }
  };

  const resolveIpLocation = async (): Promise<{
    lat: number;
    lon: number;
    city?: string;
  } | null> => {
    try {
      const ipWho = await fetchJsonWithTimeout<{
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
      }>('https://ipwho.is/', 5000);
      if (
        ipWho.success !== false &&
        typeof ipWho.latitude === 'number' &&
        typeof ipWho.longitude === 'number'
      ) {
        return { lat: ipWho.latitude, lon: ipWho.longitude, city: ipWho.city };
      }
    } catch {
      // Fallback to geojs below.
    }
    try {
      const geo = await fetchJsonWithTimeout<{
        latitude?: string;
        longitude?: string;
        city?: string;
      }>('https://get.geojs.io/v1/ip/geo.json', 5000);
      const lat = Number.parseFloat(geo.latitude ?? '');
      const lon = Number.parseFloat(geo.longitude ?? '');
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon, city: geo.city };
      }
    } catch {
      // Both IP providers failed.
    }
    return null;
  };

  const handleDetectWeather = async () => {
    if (detectingWeather) return;
    setDetectingWeather(true);
    setWeatherNote('Consultando clima exterior...');

    try {
      let coords: { lat: number; lon: number; label: string } | null = null;

      if (
        typeof window !== 'undefined' &&
        window.isSecureContext &&
        typeof navigator !== 'undefined' &&
        navigator.geolocation
      ) {
        coords = await new Promise<{
          lat: number;
          lon: number;
          label: string;
        } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                label: 'GPS',
              }),
            () => resolve(null),
            { timeout: 6000, maximumAge: 300_000 },
          );
        });
      }

      if (!coords) {
        const ipLoc = await resolveIpLocation();
        if (ipLoc) {
          coords = {
            lat: ipLoc.lat,
            lon: ipLoc.lon,
            label: ipLoc.city ? `red (${ipLoc.city})` : 'red',
          };
        }
      }

      if (!coords) {
        setWeatherNote(
          'No se pudo detectar ubicación (sin conexión o tiempo agotado); ajusta °C afuera manualmente.',
        );
        return;
      }

      const data = await fetchJsonWithTimeout<{
        current?: {
          temperature_2m?: number;
          wind_speed_10m?: number;
          rain?: number;
          weather_code?: number;
        };
      }>(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,wind_speed_10m,rain,weather_code`,
        6000,
      );

      const t = data.current?.temperature_2m;
      if (typeof t === 'number' && Number.isFinite(t)) {
        const clamped = Math.min(
          CLOTHING_MAX_TEMP_C,
          Math.max(CLOTHING_MIN_TEMP_C, Math.round(t)),
        );
        const wind = (data.current?.wind_speed_10m ?? 0) >= 18;
        const rain = (data.current?.rain ?? 0) > 0;
        const code = data.current?.weather_code ?? 0;
        const cond: OutdoorWeatherCondition =
          rain || code >= 51 ? 'lluvia' : code >= 2 ? 'nublado' : 'soleado';
        setOutdoorTempC(clamped);
        setContext((prev) => ({
          ...prev,
          weatherCondition: cond,
          isWindy: wind,
        }));
        if (environment === 'exterior') {
          setTempC(clamped);
        }
        setWeatherNote(
          `Clima exterior por ${coords.label}: ${clamped} °C (Open-Meteo).`,
        );
      } else {
        setWeatherNote(
          'No se pudo leer la temperatura exterior; usa el control manual.',
        );
      }
    } catch {
      setWeatherNote(
        'No se pudo detectar el clima (sin conexión o tiempo agotado); ajusta °C manualmente.',
      );
    } finally {
      setDetectingWeather(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1.5">
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
          </strong>{' '}
          · Rango −5 °C a 50 °C.
        </p>
      </header>

      {childProfile ? null : (
        <StageSelector
          selectedStage={manualStage}
          onSelectStage={setManualStage}
          label="Etapa para calcular vestimenta"
        />
      )}

      {/* Franja compacta de clima exterior siempre visible arriba */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs">
        <span className="font-semibold text-ink-secondary tabular-nums">
          Clima exterior:{' '}
          <strong className="text-ink-primary">
            {outdoorTempC !== undefined
              ? `${outdoorTempC} °C · ${
                  WEATHER_CONDITIONS.find((w) => w.id === context.weatherCondition)?.label
                } · ${context.isWindy ? 'Con viento' : 'Sin viento'}`
              : 'Sin detectar (manual)'}
          </strong>
        </span>
        <button
          type="button"
          onClick={handleDetectWeather}
          className="inline-flex min-h-12 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-text"
        >
          Detectar clima
        </button>
      </div>
      {weatherNote ? (
        <p className="text-xs text-ink-secondary px-1">{weatherNote}</p>
      ) : null}

      {/* 1. Hasta arriba fuera del desplegable: Temperatura y Entorno */}
      <section
        aria-label="Selector de temperatura y entorno"
        className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-2">
          {(['cuarto', 'exterior'] as const).map((env) => {
            const active = environment === env;
            return (
              <button
                key={env}
                type="button"
                onClick={() => {
                  setEnvironment(env);
                  if (env === 'exterior' && outdoorTempC !== undefined) {
                    setTempC(outdoorTempC);
                  }
                }}
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
          <div className="space-y-2 rounded-2xl border border-border-interactive bg-bg-elevated p-3">
            <button
              type="button"
              onClick={() => toggleFlag('coldWalls')}
              aria-pressed={context.coldWalls}
              className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold ${
                context.coldWalls
                  ? 'border-brand-primary bg-brand-surface text-brand-text'
                  : 'border-border-interactive bg-bg-card text-ink-primary'
              }`}
            >
              <div className="space-y-0.5">
                <span className="block">
                  Cuna pegada a pared que da a la calle o ventana
                </span>
                <span className="block text-[11px] font-normal text-ink-secondary">
                  Las paredes que dan al exterior transmiten frío o calor según
                  la diferencia de temperatura con afuera.
                </span>
              </div>
              <span className="shrink-0 tabular-nums">
                {context.coldWalls ? rec.wallEffectLabelMx : 'Desactivado'}
              </span>
            </button>

            {context.coldWalls ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-secondary">
                    Afuera:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOutdoorTempC((v) =>
                        Math.max(CLOTHING_MIN_TEMP_C, (v ?? tempC) - 1),
                      )
                    }
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-card px-2 text-xs font-bold"
                  >
                    −1
                  </button>
                  <span className="text-xs font-bold text-ink-primary tabular-nums">
                    {outdoorTempC !== undefined ? `${outdoorTempC} °C` : 'Auto'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOutdoorTempC((v) =>
                        Math.min(CLOTHING_MAX_TEMP_C, (v ?? tempC) + 1),
                      )
                    }
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border-interactive bg-bg-card px-2 text-xs font-bold"
                  >
                    +1
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDetectWeather}
                  className="inline-flex min-h-12 items-center rounded-xl border border-brand-primary bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-text"
                >
                  Detectar clima exterior
                </button>
              </div>
            ) : null}
            {weatherNote ? (
              <p className="text-xs text-ink-secondary">{weatherNote}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* 2. Menú desplegable colapsable (arriba del resumen, cerrado por defecto) */}
      <section
        aria-label="Configurar ropa y contexto"
        className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-ink-primary">
              Ropa configurada {customLayers === null ? '(óptimo por defecto)' : '(personalizada)'}
            </p>
            <p className="text-xs text-ink-secondary">
              {drawerOpen
                ? 'Elige una o varias prendas por capa y accesorios.'
                : 'Despliega para personalizar estado del bebé, contexto o prendas.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {customLayers !== null ? (
              <button
                type="button"
                onClick={() => setCustomLayers(null)}
                className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs font-bold text-brand-text"
              >
                Restaurar óptimo
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              className="inline-flex min-h-12 items-center rounded-xl border border-brand-primary bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text"
            >
              {drawerOpen ? 'Ocultar configuración ▴' : 'Configurar ropa y contexto ▾'}
            </button>
          </div>
        </div>

        <SelectedLayersPreview
          base={activeLayers.base}
          mid={activeLayers.mid}
          outer={activeLayers.outer}
          accessories={activeLayers.accessories}
        />

        {drawerOpen ? (
          <div className="space-y-5 border-t border-border-interactive pt-4">
            {/* Primero arriba al desplegar: Estado del bebé + chips de contexto */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                Estado del bebé (elige una opción)
              </p>
              <div className="flex flex-wrap gap-2">
                {HEALTH_OPTIONS.map((opt) => {
                  const selected = context.babyHealthStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setContext((prev) => ({
                          ...prev,
                          babyHealthStatus: opt.id,
                          prematureOrLowWeight: opt.id === 'prematuro',
                          hasFever: opt.id === 'fiebre',
                        }))
                      }
                      aria-pressed={selected}
                      className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-bold ${
                        selected
                          ? 'border-brand-primary bg-brand-primary text-brand-on'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {environment === 'cuarto' ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                    Dónde está el bebé
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INDOOR_LOCATIONS.map((loc) => {
                      const selected = context.indoorLocation === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() =>
                            setContext((prev) => ({
                              ...prev,
                              indoorLocation: loc.id,
                            }))
                          }
                          aria-pressed={selected}
                          className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
                            selected
                              ? 'border-brand-primary bg-brand-primary text-brand-on'
                              : 'border-border-interactive bg-bg-elevated text-ink-primary'
                          }`}
                        >
                          {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                    Extras de interior
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INDOOR_EXTRAS.map((chip) => {
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                    Cómo van en el paseo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OUTDOOR_TRANSPORTS.map((tr) => {
                      const selected = context.outdoorTransport === tr.id;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() =>
                            setContext((prev) => ({
                              ...prev,
                              outdoorTransport: tr.id,
                            }))
                          }
                          aria-pressed={selected}
                          className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
                            selected
                              ? 'border-brand-primary bg-brand-primary text-brand-on'
                              : 'border-border-interactive bg-bg-elevated text-ink-primary'
                          }`}
                        >
                          {tr.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                    Condiciones del exterior
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEATHER_CONDITIONS.map((w) => {
                      const selected = context.weatherCondition === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() =>
                            setContext((prev) => ({
                              ...prev,
                              weatherCondition: w.id,
                            }))
                          }
                          aria-pressed={selected}
                          className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
                            selected
                              ? 'border-brand-primary bg-brand-primary text-brand-on'
                              : 'border-border-interactive bg-bg-elevated text-ink-primary'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => toggleFlag('isWindy')}
                      aria-pressed={context.isWindy}
                      className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
                        context.isWindy
                          ? 'border-brand-primary bg-brand-primary text-brand-on'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      Con viento
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Multi-selección por capa */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                1. Capa base (puedes elegir varias)
              </p>
              <div className="flex flex-wrap gap-2">
                {BASE_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.base.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCustomLayers({
                          ...activeLayers,
                          base: toggleMulti<BaseLayerId>(
                            activeLayers.base,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                        selected
                          ? 'border-brand-primary bg-brand-surface text-brand-text'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                      <span>{opt.labelMx}</span>
                      <span className="text-[11px] opacity-75 tabular-nums">
                        {opt.tog === null ? '' : opt.tog === 0 ? '0 TOG' : `+${opt.tog} TOG`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                2. Capa media (puedes elegir varias, ej. mameluco + chamarra)
              </p>
              <div className="flex flex-wrap gap-2">
                {MID_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.mid.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCustomLayers({
                          ...activeLayers,
                          mid: toggleMulti<MidLayerId>(
                            activeLayers.mid,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                        selected
                          ? 'border-brand-primary bg-brand-surface text-brand-text'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                      <span>{opt.labelMx}</span>
                      <span className="text-[11px] opacity-75 tabular-nums">
                        {opt.tog === null ? '' : opt.tog === 0 ? '0 TOG' : `+${opt.tog} TOG`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                3. Cobija, manta o saco (puedes combinar)
              </p>
              <div className="flex flex-wrap gap-2">
                {OUTER_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.outer.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCustomLayers({
                          ...activeLayers,
                          outer: toggleMulti<OuterLayerId>(
                            activeLayers.outer,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                        selected
                          ? 'border-brand-primary bg-brand-surface text-brand-text'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                      <span>{opt.labelMx}</span>
                      <span className="text-[11px] opacity-75 tabular-nums">
                        {opt.tog === null ? '' : opt.tog === 0 ? '0 TOG' : `+${opt.tog} TOG`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
                4. Accesorios (gorro, guantes, calcetines)
              </p>
              <div className="flex flex-wrap gap-2">
                {ACCESSORY_OPTIONS.map((opt) => {
                  const currentAcc = activeLayers.accessories ?? [];
                  const selected = currentAcc.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCustomLayers({
                          ...activeLayers,
                          accessories: toggleMulti<AccessoryId>(
                            currentAcc,
                            opt.id,
                          ),
                        })
                      }
                      aria-pressed={selected}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                        selected
                          ? 'border-brand-primary bg-brand-surface text-brand-text'
                          : 'border-border-interactive bg-bg-elevated text-ink-primary'
                      }`}
                    >
                      <GarmentIcon kind={opt.visualKind} className="h-4 w-4" />
                      <span>{opt.labelMx}</span>
                      <span className="text-[11px] opacity-75 tabular-nums">
                        {opt.tog === null ? '' : opt.tog === 0 ? '0 TOG' : `+${opt.tog} TOG`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 3. Justo debajo del desplegable: Resumen / Hero Status Deck */}
      <section
        aria-label="Resumen de vestimenta y seguridad térmica"
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
              {rec.wallEffectLabelMx}
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

        <div
          className={`rounded-2xl border p-4 space-y-1 ${
            rec.looseBlanketAlert
              ? 'border-2 border-alert-red bg-alert-surface'
              : 'border-border-interactive bg-bg-elevated'
          }`}
        >
          <p
            className={`text-sm font-bold ${
              rec.looseBlanketAlert ? 'text-alert-text' : 'text-ink-primary'
            }`}
          >
            {rec.looseBlanketAlert
              ? 'Alerta de sueño inseguro en menores de 12 meses'
              : rec.headlineMx}
          </p>
          <p className="text-sm text-ink-primary">{rec.togDeltaMx}</p>
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

      <ClinicalMetadataBlock metadata={CLOTHING_ENGINE_METADATA} />
    </div>
  );
}
