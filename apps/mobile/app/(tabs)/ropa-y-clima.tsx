import Feather from '@expo/vector-icons/Feather';
import {
  ACCESSORY_OPTIONS,
  BASE_LAYER_OPTIONS,
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  DEFAULT_CLOTHING_CONTEXT,
  MID_LAYER_OPTIONS,
  MIN_TOUCH_TARGET_PX,
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
} from '@baby-buddy/core';
import { CLOTHING_ENGINE_METADATA } from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SelectedLayersPreview } from '../../components/ClothingGarmentVisual';
import { GuideDisclaimerHeader } from '../../components/GuideDisclaimerHeader';
import { StageSelector } from '../../components/StageSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';

const TEMP_PRESETS = [0, 16, 21, 28, 38] as const;

const HEALTH_OPTIONS: readonly {
  readonly id: BabyHealthStatus;
  readonly label: string;
}[] = [
  { id: 'termino_sano', label: 'Bebé a término / sano' },
  { id: 'prematuro', label: 'Prematuro (+1)' },
  { id: 'fiebre', label: 'Fiebre (−1)' },
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
  { id: 'portabebe', label: 'Portabebé (−1)' },
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

export default function RopaYClimaScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile, iconsLoaded } =
    useThemeContext();
  const effectiveStage = childProfile ? childProfile.stageId : selectedStage;

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
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  };

  const handleDetectWeather = async () => {
    if (detectingWeather) {
      return;
    }
    setDetectingWeather(true);
    setWeatherNote('Consultando clima exterior...');
    try {
      let lat: number | null = null;
      let lon: number | null = null;
      let cityLabel = '';

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
          lat = ipWho.latitude;
          lon = ipWho.longitude;
          cityLabel = ipWho.city ?? '';
        }
      } catch {
        // Fallback to geojs below.
      }

      if (lat === null || lon === null) {
        const geo = await fetchJsonWithTimeout<{
          latitude?: string;
          longitude?: string;
          city?: string;
        }>('https://get.geojs.io/v1/ip/geo.json', 5000);
        const pLat = Number.parseFloat(geo.latitude ?? '');
        const pLon = Number.parseFloat(geo.longitude ?? '');
        if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
          lat = pLat;
          lon = pLon;
          cityLabel = geo.city ?? '';
        }
      }

      if (lat === null || lon === null) {
        setWeatherNote('No se pudo obtener ubicación; ajusta °C afuera manualmente.');
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,rain,weather_code`,
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
          `Clima${cityLabel ? ` en ${cityLabel}` : ''}: ${clamped} °C.`,
        );
      } else {
        setWeatherNote('No se pudo leer la temperatura; usa el control manual.');
      }
    } catch {
      setWeatherNote('Sin conexión para clima exterior; usa el control manual.');
    } finally {
      setDetectingWeather(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
    >
      <View className="gap-1">
        <Text
          className="text-2xl font-bold"
          style={{ color: palette.textPrimary }}
        >
          ¿Cuánta ropa le pongo?
        </Text>
        <Text className="text-sm" style={{ color: palette.textSecondary }}>
          Etapa: {STAGE_SPECS[effectiveStage].label} · −5 °C a 50 °C
        </Text>
      </View>

      {childProfile ? (
        <Pressable
          onPress={() => router.push('/(tabs)/salud')}
          className="self-start rounded-xl border px-3 py-2 justify-center"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            Cambiar datos del bebé
          </Text>
        </Pressable>
      ) : (
        <StageSelector />
      )}

      {/* Franja compacta de clima exterior siempre visible arriba */}
      <View
        className="rounded-2xl border px-3 py-2 gap-1"
        style={{
          backgroundColor: palette.bgElevated,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text className="text-xs font-semibold flex-1" style={{ color: palette.textSecondary }}>
            Exterior:{' '}
            {outdoorTempC !== undefined
              ? `${outdoorTempC} °C · ${
                  WEATHER_CONDITIONS.find((w) => w.id === context.weatherCondition)?.label
                } · ${context.isWindy ? 'Viento' : 'Sin viento'}`
              : 'Sin detectar (manual)'}
          </Text>
          <Pressable
            onPress={() => void handleDetectWeather()}
            disabled={detectingWeather}
            className="rounded-xl border px-3 py-1.5 justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {detectingWeather ? 'Detectando...' : 'Detectar clima'}
            </Text>
          </Pressable>
        </View>
        {weatherNote ? (
          <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
            {weatherNote}
          </Text>
        ) : null}
      </View>

      {/* 1. Hasta arriba fuera del desplegable: Temperatura y Entorno */}
      <View
        className="rounded-3xl border p-4 gap-4"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row gap-2">
          {(['cuarto', 'exterior'] as const).map((env) => {
            const active = environment === env;
            return (
              <Pressable
                key={env}
                onPress={() => {
                  setEnvironment(env);
                  if (env === 'exterior' && outdoorTempC !== undefined) {
                    setTempC(outdoorTempC);
                  }
                }}
                className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: active
                    ? palette.brandPrimary
                    : palette.bgElevated,
                  borderColor: active
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {env === 'cuarto' ? 'Cuarto' : 'Exterior'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <Pressable
            onPress={() =>
              setTempC((t) => Math.max(CLOTHING_MIN_TEMP_C, t - 1))
            }
            className="rounded-xl border px-4 py-2 justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
              −1 °C
            </Text>
          </Pressable>
          <Text className="text-2xl font-bold" style={{ color: palette.brandText }}>
            {tempC} °C
          </Text>
          <Pressable
            onPress={() =>
              setTempC((t) => Math.min(CLOTHING_MAX_TEMP_C, t + 1))
            }
            className="rounded-xl border px-4 py-2 justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
              +1 °C
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {TEMP_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setTempC(preset)}
              className="rounded-xl border px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor:
                  tempC === preset ? palette.brandSurface : palette.bgElevated,
                borderColor:
                  tempC === preset
                    ? palette.brandPrimary
                    : palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                {preset} °C
              </Text>
            </Pressable>
          ))}
        </View>

        {environment === 'cuarto' ? (
          <View className="gap-2">
            <Pressable
              onPress={() => toggleFlag('coldWalls')}
              className="rounded-xl border px-4 py-2 flex-row items-center justify-between gap-2"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: context.coldWalls
                  ? palette.brandSurface
                  : palette.bgElevated,
                borderColor: context.coldWalls
                  ? palette.brandPrimary
                  : palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold flex-1" style={{ color: palette.textPrimary }}>
                Pared que da a la calle o ventana
              </Text>
              <Text className="text-xs font-bold text-right flex-shrink" style={{ color: palette.brandText }}>
                {context.coldWalls ? rec.wallEffectLabelMx : 'Desactivado'}
              </Text>
            </Pressable>
            {context.coldWalls ? (
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Text className="text-xs font-semibold flex-1" style={{ color: palette.textSecondary }}>
                  Temp. afuera: {outdoorTempC !== undefined ? `${outdoorTempC} °C` : 'Auto'}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() =>
                      setOutdoorTempC((v) =>
                        Math.max(CLOTHING_MIN_TEMP_C, (v ?? tempC) - 1),
                      )
                    }
                    className="rounded-xl border px-3 py-1.5 justify-center"
                    style={{
                      minHeight: MIN_TOUCH_TARGET_PX,
                      backgroundColor: palette.bgElevated,
                      borderColor: palette.borderInteractive,
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                      −1 °C
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setOutdoorTempC((v) =>
                        Math.min(CLOTHING_MAX_TEMP_C, (v ?? tempC) + 1),
                      )
                    }
                    className="rounded-xl border px-3 py-1.5 justify-center"
                    style={{
                      minHeight: MIN_TOUCH_TARGET_PX,
                      backgroundColor: palette.bgElevated,
                      borderColor: palette.borderInteractive,
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                      +1 °C
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* 2. Menú desplegable colapsable (cerrado por defecto) */}
      <View
        className="rounded-3xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
            Ropa configurada {customLayers === null ? '(óptimo)' : '(personalizada)'}
          </Text>
          <View className="flex-row gap-2">
            {customLayers !== null ? (
              <Pressable
                onPress={() => setCustomLayers(null)}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                  Óptimo
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setDrawerOpen((v) => !v)}
              className="rounded-xl border px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.brandSurface,
                borderColor: palette.brandPrimary,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                {drawerOpen ? 'Ocultar ▴' : 'Configurar ▾'}
              </Text>
            </Pressable>
          </View>
        </View>

        <SelectedLayersPreview
          base={activeLayers.base}
          mid={activeLayers.mid}
          outer={activeLayers.outer}
          accessories={activeLayers.accessories}
        />

        {drawerOpen ? (
          <View className="gap-4 pt-2 border-t" style={{ borderTopColor: palette.borderInteractive }}>
            <View className="gap-2">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                Estado del bebé
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {HEALTH_OPTIONS.map((opt) => {
                  const selected = context.babyHealthStatus === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        setContext((prev) => ({
                          ...prev,
                          babyHealthStatus: opt.id,
                          prematureOrLowWeight: opt.id === 'prematuro',
                          hasFever: opt.id === 'fiebre',
                        }))
                      }
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: selected
                          ? palette.brandPrimary
                          : palette.bgElevated,
                        borderColor: selected
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{
                          color: selected
                            ? palette.onBrandPrimary
                            : palette.textPrimary,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {environment === 'cuarto' ? (
              <>
                <View className="gap-2">
                  <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                    Dónde está el bebé
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {INDOOR_LOCATIONS.map((loc) => {
                      const selected = context.indoorLocation === loc.id;
                      return (
                        <Pressable
                          key={loc.id}
                          onPress={() =>
                            setContext((prev) => ({
                              ...prev,
                              indoorLocation: loc.id,
                            }))
                          }
                          className="rounded-full border px-3 py-2 justify-center"
                          style={{
                            minHeight: MIN_TOUCH_TARGET_PX,
                            backgroundColor: selected
                              ? palette.brandPrimary
                              : palette.bgElevated,
                            borderColor: selected
                              ? palette.brandPrimary
                              : palette.borderInteractive,
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: selected
                                ? palette.onBrandPrimary
                                : palette.textPrimary,
                            }}
                          >
                            {loc.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                    Extras de interior
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {INDOOR_EXTRAS.map((chip) => {
                      const active = context[chip.key];
                      return (
                        <Pressable
                          key={chip.key}
                          onPress={() => toggleFlag(chip.key)}
                          className="rounded-full border px-3 py-2 justify-center"
                          style={{
                            minHeight: MIN_TOUCH_TARGET_PX,
                            backgroundColor: active
                              ? palette.brandPrimary
                              : palette.bgElevated,
                            borderColor: active
                              ? palette.brandPrimary
                              : palette.borderInteractive,
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: active
                                ? palette.onBrandPrimary
                                : palette.textPrimary,
                            }}
                          >
                            {chip.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View className="gap-2">
                  <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                    Cómo van en el paseo
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {OUTDOOR_TRANSPORTS.map((tr) => {
                      const selected = context.outdoorTransport === tr.id;
                      return (
                        <Pressable
                          key={tr.id}
                          onPress={() =>
                            setContext((prev) => ({
                              ...prev,
                              outdoorTransport: tr.id,
                            }))
                          }
                          className="rounded-full border px-3 py-2 justify-center"
                          style={{
                            minHeight: MIN_TOUCH_TARGET_PX,
                            backgroundColor: selected
                              ? palette.brandPrimary
                              : palette.bgElevated,
                            borderColor: selected
                              ? palette.brandPrimary
                              : palette.borderInteractive,
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: selected
                                ? palette.onBrandPrimary
                                : palette.textPrimary,
                            }}
                          >
                            {tr.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                    Condiciones del exterior
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {WEATHER_CONDITIONS.map((w) => {
                      const selected = context.weatherCondition === w.id;
                      return (
                        <Pressable
                          key={w.id}
                          onPress={() =>
                            setContext((prev) => ({
                              ...prev,
                              weatherCondition: w.id,
                            }))
                          }
                          className="rounded-full border px-3 py-2 justify-center"
                          style={{
                            minHeight: MIN_TOUCH_TARGET_PX,
                            backgroundColor: selected
                              ? palette.brandPrimary
                              : palette.bgElevated,
                            borderColor: selected
                              ? palette.brandPrimary
                              : palette.borderInteractive,
                          }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: selected
                                ? palette.onBrandPrimary
                                : palette.textPrimary,
                            }}
                          >
                            {w.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => toggleFlag('isWindy')}
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: context.isWindy
                          ? palette.brandPrimary
                          : palette.bgElevated,
                        borderColor: context.isWindy
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: context.isWindy
                            ? palette.onBrandPrimary
                            : palette.textPrimary,
                        }}
                      >
                        Con viento
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                1. Capa base (multi-selección)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {BASE_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.base.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        setCustomLayers({
                          ...activeLayers,
                          base: toggleMulti<BaseLayerId>(
                            activeLayers.base,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: selected
                          ? palette.brandSurface
                          : palette.bgElevated,
                        borderColor: selected
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
                        {opt.labelMx}{' '}
                        <Text style={{ color: palette.textMuted }}>
                          {opt.tog === null ? '' : opt.tog === 0 ? '(0 TOG)' : `(+${opt.tog} TOG)`}
                        </Text>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                2. Capa media (multi-selección)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MID_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.mid.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        setCustomLayers({
                          ...activeLayers,
                          mid: toggleMulti<MidLayerId>(
                            activeLayers.mid,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: selected
                          ? palette.brandSurface
                          : palette.bgElevated,
                        borderColor: selected
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
                        {opt.labelMx}{' '}
                        <Text style={{ color: palette.textMuted }}>
                          {opt.tog === null ? '' : opt.tog === 0 ? '(0 TOG)' : `(+${opt.tog} TOG)`}
                        </Text>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                3. Cobija, manta o saco (multi-selección)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {OUTER_LAYER_OPTIONS.map((opt) => {
                  const selected = activeLayers.outer.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        setCustomLayers({
                          ...activeLayers,
                          outer: toggleMulti<OuterLayerId>(
                            activeLayers.outer,
                            opt.id,
                            'ninguna',
                          ),
                        })
                      }
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: selected
                          ? palette.brandSurface
                          : palette.bgElevated,
                        borderColor: selected
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
                        {opt.labelMx}{' '}
                        <Text style={{ color: palette.textMuted }}>
                          {opt.tog === null ? '' : opt.tog === 0 ? '(0 TOG)' : `(+${opt.tog} TOG)`}
                        </Text>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                4. Accesorios (gorro, guantes, calcetines)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ACCESSORY_OPTIONS.map((opt) => {
                  const currentAcc = activeLayers.accessories ?? [];
                  const selected = currentAcc.includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        setCustomLayers({
                          ...activeLayers,
                          accessories: toggleMulti<AccessoryId>(
                            currentAcc,
                            opt.id,
                          ),
                        })
                      }
                      className="rounded-full border px-3 py-2 justify-center"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: selected
                          ? palette.brandSurface
                          : palette.bgElevated,
                        borderColor: selected
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
                        {opt.labelMx}{' '}
                        <Text style={{ color: palette.textMuted }}>
                          {opt.tog === null ? '' : opt.tog === 0 ? '(0 TOG)' : `(+${opt.tog} TOG)`}
                        </Text>
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. Justo debajo: Resumen / Hero Status Deck */}
      <View
        className="rounded-3xl border p-4 gap-4"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row gap-2">
          <View
            className="flex-1 rounded-2xl border p-3 gap-1"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-[11px] font-bold uppercase" style={{ color: palette.textMuted }}>
              Temp. efectiva
            </Text>
            <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
              {rec.effectiveTempC} °C
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              {rec.wallEffectLabelMx}
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl border p-3 gap-1"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-[11px] font-bold uppercase" style={{ color: palette.textMuted }}>
              Abrigo actual
            </Text>
            <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
              {rec.currentTog === null ? 'Inseguro' : `${rec.currentTog} TOG`}
            </Text>
            <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
              Meta: {rec.recommendedTogRange.min}–{rec.recommendedTogRange.max}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
            Confort térmico
          </Text>
          <StatusBadge severity={rec.severity} />
        </View>

        <View className="flex-row gap-1.5">
          {[
            { id: 'cold', label: 'Frío' },
            { id: 'optimal', label: 'Óptimo' },
            {
              id: 'overheat',
              label: rec.looseBlanketAlert ? 'Inseguro' : 'Calor',
            },
          ].map((seg) => {
            const active =
              rec.comfortZone === seg.id ||
              (seg.id === 'overheat' && rec.comfortZone === 'unsafe_sleep');
            return (
              <View
                key={seg.id}
                className="flex-1 rounded-xl border py-2 items-center"
                style={{
                  backgroundColor: active
                    ? seg.id === 'overheat'
                      ? palette.alertRedSurface
                      : palette.brandPrimary
                    : palette.bgElevated,
                  borderColor: active
                    ? seg.id === 'overheat'
                      ? palette.alertRed
                      : palette.brandPrimary
                    : palette.borderInteractive,
                  opacity: active ? 1 : 0.55,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active
                      ? seg.id === 'overheat'
                        ? palette.alertRedText
                        : palette.onBrandPrimary
                      : palette.textMuted,
                  }}
                >
                  {seg.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View
          className="rounded-2xl border p-3 gap-1"
          style={{
            backgroundColor: rec.looseBlanketAlert
              ? palette.alertRedSurface
              : palette.bgElevated,
            borderColor: rec.looseBlanketAlert
              ? palette.alertRed
              : palette.borderInteractive,
          }}
        >
          <Text
            className="text-sm font-bold"
            style={{
              color: rec.looseBlanketAlert
                ? palette.alertRedText
                : palette.textPrimary,
            }}
          >
            {rec.looseBlanketAlert
              ? 'Alerta de sueño inseguro (<12 meses)'
              : rec.headlineMx}
          </Text>
          <Text className="text-xs leading-5" style={{ color: palette.textPrimary }}>
            {rec.togDeltaMx}
          </Text>
        </View>

        {rec.actionsMx.length > 0 ? (
          <View className="gap-1">
            <Text className="text-xs font-bold uppercase" style={{ color: palette.textPrimary }}>
              Qué hacer
            </Text>
            {rec.actionsMx.map((action) => (
              <Text key={action} className="text-xs leading-5" style={{ color: palette.textSecondary }}>
                • {action}
              </Text>
            ))}
          </View>
        ) : null}

        {rec.doNotDoMx.length > 0 ? (
          <View
            className="rounded-xl border p-3 gap-1"
            style={{
              backgroundColor: palette.alertRedSurface,
              borderColor: palette.alertRed,
            }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: palette.alertRedText }}>
              Qué NO hacer
            </Text>
            {rec.doNotDoMx.map((item) => (
              <Text key={item} className="text-xs" style={{ color: palette.textPrimary }}>
                • {item}
              </Text>
            ))}
          </View>
        ) : null}

        <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
          {rec.touchCheckMx}
        </Text>

        {rec.emergency911Visible ? (
          <Pressable
            onPress={() => {
              void Linking.openURL('tel:911');
            }}
            className="rounded-xl flex-row items-center justify-center gap-2 px-4 py-3"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.alertRed,
            }}
          >
            {iconsLoaded ? (
              <Feather name="phone-call" size={18} color={palette.onAlertRedButton} />
            ) : null}
            <Text className="text-sm font-bold" style={{ color: palette.onAlertRedButton }}>
              Llamar al 911 (Gratis)
            </Text>
          </Pressable>
        ) : null}
      </View>

      <GuideDisclaimerHeader metadata={CLOTHING_ENGINE_METADATA} />
    </ScrollView>
  );
}
