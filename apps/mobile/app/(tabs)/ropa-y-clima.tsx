import Feather from '@expo/vector-icons/Feather';
import {
  BASE_LAYER_OPTIONS,
  CLOTHING_MAX_TEMP_C,
  CLOTHING_MIN_TEMP_C,
  DEFAULT_CLOTHING_CONTEXT,
  MID_LAYER_OPTIONS,
  MIN_TOUCH_TARGET_PX,
  OUTER_LAYER_OPTIONS,
  STAGE_SPECS,
  recommendClothing,
  type BaseLayerId,
  type ClothingContextFlags,
  type ClothingEnvironment,
  type MidLayerId,
  type OuterLayerId,
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

const CONTEXT_CHIPS: readonly {
  readonly key: keyof Omit<ClothingContextFlags, 'coldWalls'>;
  readonly label: string;
}[] = [
  { key: 'prematureOrLowWeight', label: 'Prematuro (+1)' },
  { key: 'hasFever', label: 'Fiebre (−1)' },
  { key: 'hasAcOrFan', label: 'Clima / ventilador' },
  { key: 'inCarrierOrStroller', label: 'Portabebé (−1)' },
  { key: 'inCarSeat', label: 'Silla de auto' },
  { key: 'canRollOver', label: 'Ya se voltea' },
] as const;

export default function RopaYClimaScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile, iconsLoaded } =
    useThemeContext();
  const effectiveStage = childProfile ? childProfile.stageId : selectedStage;

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
          Motor de −5 °C a 50 °C (100 % offline) · Etapa:{' '}
          {STAGE_SPECS[effectiveStage].label}
        </Text>
      </View>

      <GuideDisclaimerHeader metadata={CLOTHING_ENGINE_METADATA} />

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

      {/* Tarjeta 1: Hero Status Deck */}
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
            <Text className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
              {rec.effectiveTempC} °C
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              {environment === 'cuarto' && context.coldWalls
                ? `${rec.tempC} °C − 1.5 °C muros`
                : 'Sin ajuste'}
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
            <Text className="text-2xl font-bold" style={{ color: palette.textPrimary }}>
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

        <SelectedLayersPreview
          base={baseLayer}
          mid={midLayer}
          outer={outerLayer}
        />

        <View className="gap-1">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textPrimary }}>
            Capas sugeridas (incluye opciones sin saco)
          </Text>
          {rec.layersMx.map((layer) => (
            <Text key={layer} className="text-sm" style={{ color: palette.textPrimary }}>
              • {layer}
            </Text>
          ))}
        </View>

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

      {/* Tarjeta 2: Controles */}
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
                onPress={() => setEnvironment(env)}
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
          <Pressable
            onPress={() => toggleFlag('coldWalls')}
            className="rounded-xl border px-4 py-2 flex-row items-center justify-between"
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
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Muros fríos / pared exterior
            </Text>
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              −1.5 °C
            </Text>
          </Pressable>
        ) : null}

        <View className="gap-2">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
            1. Capa base
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BASE_LAYER_OPTIONS.map((opt) => {
              const selected = baseLayer === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setBaseLayer(opt.id)}
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
                    {opt.labelMx}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
            2. Capa media
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MID_LAYER_OPTIONS.map((opt) => {
              const selected = midLayer === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setMidLayer(opt.id)}
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
                    {opt.labelMx}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
            3. Cobija, manta o saco
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {OUTER_LAYER_OPTIONS.map((opt) => {
              const selected = outerLayer === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setOuterLayer(opt.id)}
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
                    {opt.labelMx}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
            Contexto adicional
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CONTEXT_CHIPS.map((chip) => {
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
                      color: active ? palette.onBrandPrimary : palette.textPrimary,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
