import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  formatMeasurement,
} from '@baby-buddy/core';
import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DailyLogPanel } from '../../components/DailyLogPanel';
import { MascotAvatar } from '../../components/MascotAvatar';
import { StageSelector } from '../../components/StageSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';

export default function HoyScreen() {
  const router = useRouter();
  const {
    mode,
    palette,
    selectedStage,
    childProfile,
  } = useThemeContext();

  const stageSpec = STAGE_SPECS[selectedStage];
  const overview = STAGE_OVERVIEWS[selectedStage];
  const formattedMetric = formatMeasurement(overview.sampleMetric);
  const isNight = mode === 'night_3am';

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bgPrimary }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
      >
        <View className="flex-row items-center gap-3">
          <MascotAvatar variant="home" size="lg" />
          <View className="flex-1 gap-1">
            <Text
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: palette.brandText }}
            >
              {isNight
                ? 'Modo nocturno activo · Baja luminosidad'
                : 'Modo Calma activo · Orientación diaria'}
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              Registro diario
            </Text>
          </View>
        </View>

        <DailyLogPanel />

        {childProfile ? (
          <View
            className="rounded-2xl border p-4 gap-2"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
              Etapa automática: {stageSpec.label}
            </Text>
            <Text className="text-sm" style={{ color: palette.textPrimary }}>
              Mostrando solo el contenido para {childProfile.nicknameMx}. Si
              deseas cambiar de etapa, actualiza sus datos en Salud.
            </Text>
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
          </View>
        ) : (
          <StageSelector />
        )}

        <View
          className="rounded-2xl border p-4 gap-3"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <View className="gap-0.5 flex-1">
              <Text
                className="text-xs font-bold uppercase"
                style={{ color: palette.brandText }}
              >
                {stageSpec.label}
              </Text>
              <Text
                className="text-lg font-bold"
                style={{ color: palette.textPrimary }}
              >
                {overview.headlineMx}
              </Text>
            </View>
            <StatusBadge severity="normal" />
          </View>

          <Text className="text-sm" style={{ color: palette.textSecondary }}>
            {stageSpec.focusSummaryMx}
          </Text>

          <View
            className="rounded-xl border p-3 flex-row items-center justify-between gap-3"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <View className="flex-1 gap-0.5">
              <Text
                className="text-xs font-semibold"
                style={{ color: palette.brandText }}
              >
                Referencia métrica de ejemplo
              </Text>
              <Text
                className="text-xs"
                style={{ color: palette.textSecondary }}
              >
                Escala oficial en °C, kg, cm y ml
              </Text>
            </View>
            <Text
              className="text-xl font-bold"
              style={{ color: palette.brandText }}
            >
              {formattedMetric}
            </Text>
          </View>

          <View className="gap-2 pt-1">
            <Text
              className="text-sm font-bold"
              style={{ color: palette.textPrimary }}
            >
              Puntos clave de orientación
            </Text>
            {overview.orientationPointsMx.map((point) => (
              <Text
                key={point}
                className="text-sm leading-5"
                style={{ color: palette.textSecondary }}
              >
                • {point}
              </Text>
            ))}
          </View>

          <Text className="text-xs" style={{ color: palette.textMuted }}>
            Versión {overview.metadata.version} · Corte editorial{' '}
            {overview.metadata.reviewed_at}
          </Text>
        </View>

        {childProfile !== null ? (
          <View
            className="rounded-2xl border p-4 gap-1"
            style={{
              backgroundColor: palette.accentWarmSurface,
              borderColor: palette.accentWarm,
            }}
          >
            <Text
              className="text-xs font-bold uppercase"
              style={{ color: palette.accentWarmText }}
            >
              Perfil local guardado
            </Text>
            <Text
              className="text-base font-bold"
              style={{ color: palette.textPrimary }}
            >
              {childProfile.nicknameMx} ({childProfile.ageMonths} meses ·{' '}
              {STAGE_SPECS[childProfile.stageId].shortLabel})
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Almacenado únicamente en este dispositivo. Puedes eliminarlo en la
              pestaña Salud.
            </Text>
          </View>
        ) : null}
      </ScrollView>

    </View>
  );
}
