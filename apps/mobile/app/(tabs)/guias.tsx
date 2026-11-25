import { MIN_TOUCH_TARGET_PX, STAGE_SPECS } from '@baby-buddy/core';
import { M1_GUIDE_SCAFFOLDS } from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GuideDisclaimerHeader } from '../../components/GuideDisclaimerHeader';
import { StageSelector } from '../../components/StageSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';

export default function GuiasScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile } = useThemeContext();
  const topMetadata = M1_GUIDE_SCAFFOLDS[0].metadata;

  const effectiveStage = childProfile ? childProfile.stageId : selectedStage;
  const orderedGuides = childProfile
    ? M1_GUIDE_SCAFFOLDS.filter((g) => g.stage === effectiveStage)
    : [...M1_GUIDE_SCAFFOLDS].sort((a, b) => {
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
          Guías de orientación infantil
        </Text>
        <Text className="text-sm" style={{ color: palette.textSecondary }}>
          Contenido educativo de Hito 1 con fuentes clínicas y señales claras de
          alarma.
        </Text>
      </View>

      <GuideDisclaimerHeader metadata={topMetadata} />

      {childProfile ? (
        <View
          className="rounded-2xl border p-4 gap-2"
          style={{
            backgroundColor: palette.brandSurface,
            borderColor: palette.brandPrimary,
          }}
        >
          <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
            Guías para {STAGE_SPECS[effectiveStage].label}
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

      <View className="gap-4">
        {orderedGuides.map((guide) => {
          const isCurrentStage = guide.stage === selectedStage;
          return (
            <View
              key={guide.id}
              className="rounded-2xl border p-4 gap-3"
              style={{
                backgroundColor: palette.bgCard,
                borderColor: isCurrentStage
                  ? palette.brandPrimary
                  : palette.borderInteractive,
              }}
            >
              <View className="flex-row items-center justify-between flex-wrap gap-2">
                <Text
                  className="text-xs font-bold uppercase"
                  style={{ color: palette.brandText }}
                >
                  {STAGE_SPECS[guide.stage].label}
                  {isCurrentStage ? ' · Etapa activa' : ''}
                </Text>
                <StatusBadge severity={guide.severity} showDescription />
              </View>

              <Text
                className="text-lg font-bold"
                style={{ color: palette.textPrimary }}
              >
                {guide.titleMx}
              </Text>

              <Text
                className="text-sm leading-5"
                style={{ color: palette.textSecondary }}
              >
                {guide.summaryMx}
              </Text>

              <View
                className="rounded-xl border p-3 gap-1.5"
                style={{
                  backgroundColor:
                    guide.severity === 'urgent_red'
                      ? palette.alertRedSurface
                      : palette.bgElevated,
                  borderColor:
                    guide.severity === 'urgent_red'
                      ? palette.alertRed
                      : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold uppercase"
                  style={{
                    color:
                      guide.severity === 'urgent_red'
                        ? palette.alertRedText
                        : palette.textPrimary,
                  }}
                >
                  Señales de alerta para vigilar
                </Text>
                {guide.redFlagsMx.map((flag) => (
                  <Text
                    key={flag}
                    className="text-sm leading-5"
                    style={{ color: palette.textPrimary }}
                  >
                    • {flag}
                  </Text>
                ))}
              </View>

              <View
                className="border-t pt-3 gap-1"
                style={{ borderTopColor: palette.borderInteractive }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: palette.textMuted }}
                >
                  Versión: {guide.metadata.version} · Corte editorial:{' '}
                  {guide.metadata.reviewed_at}
                </Text>
                <Text className="text-xs" style={{ color: palette.textMuted }}>
                  Estado de revisión: {guide.metadata.reviewed_by}
                </Text>
                {guide.metadata.sources.map((source) => (
                  <Text
                    key={`${guide.id}-${source.organization}-${source.title}`}
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
