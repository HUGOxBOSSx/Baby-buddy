import {
  MIN_TOUCH_TARGET_PX,
  STAGE_ORDER,
  STAGE_SPECS,
} from '@baby-buddy/core';
import { Pressable, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export function StageSelector({ compact = false }: { readonly compact?: boolean } = {}) {
  const { palette, selectedStage, setSelectedStage } = useThemeContext();

  return (
    <View className="gap-1.5">
      {!compact ? (
        <Text
          className="text-sm font-semibold"
          style={{ color: palette.textSecondary }}
        >
          Etapa de tu hija o hijo (0 a 6 años)
        </Text>
      ) : null}
      <View className="flex-row flex-wrap justify-center gap-1.5">
        {STAGE_ORDER.map((stageId) => {
          const spec = STAGE_SPECS[stageId];
          const isSelected = selectedStage === stageId;

          return (
            <Pressable
              key={stageId}
              onPress={() => setSelectedStage(stageId)}
              hitSlop={compact ? 6 : undefined}
              className={
                compact
                  ? 'items-center justify-center rounded-lg border px-3 py-1'
                  : 'min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border px-4 py-2'
              }
              style={{
                ...(compact
                  ? { height: 34 }
                  : { minHeight: MIN_TOUCH_TARGET_PX, minWidth: MIN_TOUCH_TARGET_PX }),
                backgroundColor: isSelected
                  ? palette.brandPrimary
                  : palette.bgCard,
                borderColor: isSelected
                  ? palette.brandPrimary
                  : palette.borderInteractive,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              aria-selected={isSelected}
              accessibilityLabel={`Seleccionar etapa ${spec.label}`}
            >
              <Text
                className={compact ? 'text-xs font-bold' : 'text-sm font-bold'}
                style={{
                  color: isSelected
                    ? palette.onBrandPrimary
                    : palette.textPrimary,
                }}
              >
                {spec.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
