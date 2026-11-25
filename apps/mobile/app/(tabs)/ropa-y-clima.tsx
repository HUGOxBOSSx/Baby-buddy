import { STAGE_SPECS } from '@baby-buddy/core';
import {
  M1_CLOTHING_SCAFFOLDS,
  STAGE_OVERVIEWS,
} from '@baby-buddy/content';
import { ScrollView, Text, View } from 'react-native';
import { GuideDisclaimerHeader } from '../../components/GuideDisclaimerHeader';
import { StageSelector } from '../../components/StageSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';

export default function RopaYClimaScreen() {
  const { palette, selectedStage } = useThemeContext();
  const topMetadata = M1_CLOTHING_SCAFFOLDS[0].metadata;

  const orderedClothing = [...M1_CLOTHING_SCAFFOLDS].sort((a, b) => {
    if (a.stage === selectedStage && b.stage !== selectedStage) {
      return -1;
    }
    if (b.stage === selectedStage && a.stage !== selectedStage) {
      return 1;
    }
    return 0;
  });

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
          Ropa y Clima (Vista preliminar M1)
        </Text>
        <Text className="text-sm" style={{ color: palette.textSecondary }}>
          Orientación estática de vestimenta por temperatura ambiente en °C con
          prendas de uso cotidiano en México.
        </Text>
      </View>

      <GuideDisclaimerHeader metadata={topMetadata} />

      <StageSelector />

      {selectedStage === '3-6a' ? (
        <View
          className="rounded-2xl border p-4 gap-2"
          style={{
            backgroundColor: palette.brandSurface,
            borderColor: palette.brandPrimary,
          }}
        >
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <Text
              className="text-sm font-bold"
              style={{ color: palette.brandText }}
            >
              {STAGE_SPECS['3-6a'].label} · Etapa activa
            </Text>
            <StatusBadge severity="normal" />
          </View>
          <Text className="text-sm" style={{ color: palette.textPrimary }}>
            Para preescolar (3 a 6 años), utiliza ropa cómoda por capas acorde
            a los °C de tu entorno y consulta las referencias térmicas base
            mostradas abajo.
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            {STAGE_OVERVIEWS['3-6a'].orientationPointsMx[0]}
          </Text>
        </View>
      ) : null}

      <View className="gap-4">
        {orderedClothing.map((item) => {
          const isCurrentStage = item.stage === selectedStage;
          return (
            <View
              key={item.id}
              className="rounded-2xl border p-4 gap-3"
              style={{
                backgroundColor: palette.bgCard,
                borderColor: isCurrentStage
                  ? palette.brandPrimary
                  : palette.borderInteractive,
              }}
            >
              <View className="flex-row items-center justify-between flex-wrap gap-2">
                <View className="gap-0.5">
                  <Text
                    className="text-xs font-bold uppercase"
                    style={{ color: palette.brandText }}
                  >
                    {STAGE_SPECS[item.stage].label}
                    {isCurrentStage ? ' · Etapa activa' : ''}
                  </Text>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: palette.textPrimary }}
                  >
                    Ambiente: {item.ambientTempRangeC}
                  </Text>
                </View>
                <StatusBadge severity="normal" />
              </View>

              <View
                className="rounded-xl border p-3 gap-1"
                style={{
                  backgroundColor: palette.bgElevated,
                  borderColor: palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold uppercase"
                  style={{ color: palette.textPrimary }}
                >
                  Prendas sugeridas
                </Text>
                {item.garmentsMx.map((garment) => (
                  <Text
                    key={garment}
                    className="text-sm"
                    style={{ color: palette.textPrimary }}
                  >
                    • {garment}
                  </Text>
                ))}
              </View>

              <Text
                className="text-sm leading-5"
                style={{ color: palette.textSecondary }}
              >
                {item.guidanceMx}
              </Text>

              <View
                className="border-t pt-3 gap-1"
                style={{ borderTopColor: palette.borderInteractive }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: palette.textMuted }}
                >
                  Versión: {item.metadata.version} · Revisado:{' '}
                  {item.metadata.reviewed_at}
                </Text>
                <Text className="text-xs" style={{ color: palette.textMuted }}>
                  Revisión: {item.metadata.reviewed_by}
                </Text>
                {item.metadata.sources.map((source) => (
                  <Text
                    key={`${item.id}-${source.organization}-${source.title}`}
                    className="text-xs"
                    style={{ color: palette.textSecondary }}
                  >
                    Fuente: {source.title} — {source.organization} ({source.year})
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
