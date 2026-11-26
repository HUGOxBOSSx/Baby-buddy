import {
  MIN_TOUCH_TARGET_PX,
  type FabricDiagramKind,
  type GarmentTogGuide,
} from '@baby-buddy/core';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

function FabricCrossSectionVisual({
  kind,
}: {
  readonly kind: FabricDiagramKind;
}) {
  const { palette } = useThemeContext();

  switch (kind) {
    case 'single_cotton':
      return (
        <View className="gap-1.5 py-2">
          <View
            className="h-3.5 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            1 capa delgada y respirable
          </Text>
        </View>
      );
    case 'double_cotton':
      return (
        <View className="gap-1.5 py-2">
          <View
            className="h-3 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <View
            className="h-3 w-full rounded-full border"
            style={{
              backgroundColor: palette.bgCard,
              borderColor: palette.brandPrimary,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Doble capa de algodón (sin relleno)
          </Text>
        </View>
      );
    case 'waffle_thermal':
      return (
        <View className="gap-1.5 py-2">
          <View
            className="h-6 w-full rounded-lg border flex-row items-center justify-around px-1"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <View
                key={idx}
                className="h-3.5 w-3.5 rounded-sm border"
                style={{ borderColor: palette.brandPrimary }}
              />
            ))}
          </View>
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Tejido waffle (cuadritos que retienen calor)
          </Text>
        </View>
      );
    case 'brushed_fleece':
      return (
        <View className="gap-1 py-2">
          <View
            className="h-3 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <View
            className="h-2.5 w-full rounded-full border border-dashed"
            style={{
              backgroundColor: palette.bgCard,
              borderColor: palette.brandText,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Exterior liso + interior suavizado/peludito
          </Text>
        </View>
      );
    case 'padded_quilt':
      return (
        <View className="gap-1 py-2">
          <View
            className="h-2.5 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <View
            className="h-3.5 w-full rounded-md border border-dashed"
            style={{
              backgroundColor: palette.bgCard,
              borderColor: palette.brandText,
            }}
          />
          <View
            className="h-2.5 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Exterior + relleno/borrego + forro interior
          </Text>
        </View>
      );
    case 'heavy_winter_fill':
      return (
        <View className="gap-1 py-2">
          <View
            className="h-2.5 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandPrimary,
              borderColor: palette.brandPrimary,
            }}
          />
          <View
            className="h-5 w-full rounded-md border border-dashed"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <View
            className="h-2.5 w-full rounded-full border"
            style={{
              backgroundColor: palette.brandPrimary,
              borderColor: palette.brandPrimary,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Relleno grueso de invierno o borrega densa
          </Text>
        </View>
      );
    case 'plush_minky_polar':
      return (
        <View className="gap-1.5 py-2">
          <View
            className="h-5 w-full rounded-full border-2 border-dotted"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          />
          <Text className="text-[11px] text-center" style={{ color: palette.textSecondary }}>
            Textura peluche / minky / polar (100% poliéster)
          </Text>
        </View>
      );
  }
}

export function GarmentTogGuideModal({
  guide,
  onClose,
}: {
  readonly guide: GarmentTogGuide | null;
  readonly onClose: () => void;
}) {
  const { palette } = useThemeContext();

  if (!guide) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="max-h-[85%] rounded-t-3xl border-t p-5 gap-3"
          style={{
            backgroundColor: palette.bgCard,
            borderTopColor: palette.borderInteractive,
          }}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <View
                className="self-start rounded-full border px-2.5 py-0.5"
                style={{
                  backgroundColor: palette.brandSurface,
                  borderColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                  +{guide.togValue} TOG
                </Text>
              </View>
              <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                {guide.titleMx}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar guía"
              className="rounded-xl border items-center justify-center px-3"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                minWidth: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-grow-0" contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            <View
              className="rounded-2xl border p-3 gap-2"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
                  Nivel de abrigo
                </Text>
                <Text className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                  {guide.warmthLevel}/5
                </Text>
              </View>
              <View className="flex-row gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <View
                    key={step}
                    className="flex-1 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        step <= guide.warmthLevel
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                    }}
                  />
                ))}
              </View>
              <FabricCrossSectionVisual kind={guide.diagramKind} />
              <Text className="text-xs" style={{ color: palette.textSecondary }}>
                {guide.visualCaptionMx}
              </Text>
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
                1. Qué buscar en la etiqueta
              </Text>
              {guide.labelCluesMx.map((item) => (
                <Text key={item} className="text-sm leading-5" style={{ color: palette.textPrimary }}>
                  • {item}
                </Text>
              ))}
            </View>

            <View className="gap-1">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
                2. Tacto y vista
              </Text>
              {guide.touchAndLookMx.map((item) => (
                <Text key={item} className="text-sm leading-5" style={{ color: palette.textPrimary }}>
                  • {item}
                </Text>
              ))}
            </View>

            <View
              className="rounded-xl border px-3 py-2"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
                Diferencia rápida: {guide.compareMx}
              </Text>
            </View>

            {guide.safetyTipMx ? (
              <View
                className="rounded-xl border px-3 py-2"
                style={{
                  backgroundColor: palette.accentWarmSurface,
                  borderColor: palette.accentWarm,
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: palette.accentWarmText }}>
                  Seguridad: {guide.safetyTipMx}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="rounded-xl items-center justify-center px-4 py-3"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.brandPrimary,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.onBrandPrimary }}>
              Entendido
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
