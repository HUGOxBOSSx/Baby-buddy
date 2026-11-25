import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  formatMeasurement,
} from '@baby-buddy/core';
import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StageSelector } from '../../components/StageSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';

export default function HoyScreen() {
  const router = useRouter();
  const {
    mode,
    palette,
    toggleMode,
    selectedStage,
    childProfile,
    iconsLoaded,
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
        <View className="gap-1">
          <Text
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: palette.brandText }}
          >
            {isNight
              ? 'Modo 3:00 AM activo · Baja luminosidad'
              : 'Modo Calma activo · Orientación diaria'}
          </Text>
          <Text
            className="text-2xl font-bold"
            style={{ color: palette.textPrimary }}
          >
            Resumen diario
          </Text>
        </View>

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

      <View
        className="border-t px-4 py-3 gap-2"
        style={{
          backgroundColor: palette.bgCard,
          borderTopColor: palette.borderInteractive,
        }}
      >
        <Text
          className="text-xs font-bold"
          style={{ color: palette.textSecondary }}
        >
          Accesos rápidos 3:00 AM (1 toque)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={toggleMode}
            className="min-h-[48px] min-w-[48px] flex-1 flex-row items-center justify-center rounded-xl border px-3 py-2 gap-1.5"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.brandPrimary,
              borderColor: palette.brandPrimary,
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isNight
                ? 'Cambiar a Modo Calma de día'
                : 'Cambiar a Modo 3:00 AM'
            }
          >
            {iconsLoaded ? (
              <Feather
                name={isNight ? 'sun' : 'moon'}
                size={16}
                color={palette.onBrandPrimary}
              />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: palette.onBrandPrimary }}
            >
              {isNight ? 'Modo Calma' : 'Modo 3:00 AM'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/guias')}
            className="min-h-[48px] min-w-[48px] flex-1 flex-row items-center justify-center rounded-xl border px-3 py-2 gap-1.5"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
            accessibilityRole="button"
            accessibilityLabel="Ir a Guías clínicas"
          >
            {iconsLoaded ? (
              <Feather name="book-open" size={16} color={palette.textPrimary} />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: palette.textPrimary }}
            >
              Guías
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/ropa-y-clima')}
            className="min-h-[48px] min-w-[48px] flex-1 flex-row items-center justify-center rounded-xl border px-3 py-2 gap-1.5"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
            accessibilityRole="button"
            accessibilityLabel="Ir a Ropa y Clima"
          >
            {iconsLoaded ? (
              <Feather name="cloud" size={16} color={palette.textPrimary} />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: palette.textPrimary }}
            >
              Ropa
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/salud')}
            className="min-h-[48px] min-w-[48px] flex-1 flex-row items-center justify-center rounded-xl px-3 py-2 gap-1.5"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.alertRedText,
            }}
            accessibilityRole="button"
            accessibilityLabel="Ir a Salud y urgencias 911"
          >
            {iconsLoaded ? (
              <Feather name="heart" size={16} color={palette.onAlertRedButton} />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: palette.onAlertRedButton }}
            >
              Salud · 911
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
