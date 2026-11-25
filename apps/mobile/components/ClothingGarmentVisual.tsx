import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
  type BaseLayerId,
  type GarmentVisualKind,
  type MidLayerId,
  type OuterLayerId,
  BASE_LAYER_OPTIONS,
  MID_LAYER_OPTIONS,
  OUTER_LAYER_OPTIONS,
} from '@baby-buddy/core';
import { Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export function getGarmentFeatherName(
  kind: GarmentVisualKind,
): keyof typeof Feather.glyphMap {
  switch (kind) {
    case 'none':
      return 'minus-circle';
    case 'sleeveless_bodysuit':
    case 'short_bodysuit':
    case 'long_bodysuit':
    case 'thermal_base':
      return 'user';
    case 'light_pajama':
    case 'cotton_sleeper':
    case 'fleece_sleeper':
    case 'thermal_sleeper':
    case 'sweater':
      return 'shield';
    case 'swaddle_thin':
    case 'swaddle_cotton':
    case 'sleep_sack':
      return 'moon';
    case 'fleece_blanket':
    case 'loose_blanket':
      return 'layers';
  }
}

export function SelectedLayersPreview({
  base,
  mid,
  outer,
}: {
  readonly base: BaseLayerId;
  readonly mid: MidLayerId;
  readonly outer: OuterLayerId;
}) {
  const { palette, iconsLoaded } = useThemeContext();
  const baseOpt =
    BASE_LAYER_OPTIONS.find((o) => o.id === base) ?? BASE_LAYER_OPTIONS[0];
  const midOpt =
    MID_LAYER_OPTIONS.find((o) => o.id === mid) ?? MID_LAYER_OPTIONS[0];
  const outerOpt =
    OUTER_LAYER_OPTIONS.find((o) => o.id === outer) ?? OUTER_LAYER_OPTIONS[0];

  const items = [
    { title: 'Capa base', option: baseOpt },
    { title: 'Capa media', option: midOpt },
    { title: 'Capa exterior', option: outerOpt },
  ] as const;

  return (
    <View className="gap-2">
      {items.map(({ title, option }) => (
        <View
          key={title}
          className="flex-row items-center gap-3 rounded-xl border p-3"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            {iconsLoaded ? (
              <Feather
                name={getGarmentFeatherName(option.visualKind)}
                size={18}
                color={palette.brandText}
              />
            ) : (
              <Text style={{ color: palette.brandText, fontWeight: '700' }}>
                •
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase" style={{ color: palette.textMuted }}>
              {title}
            </Text>
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              {option.labelMx}
            </Text>
          </View>
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            {option.tog === null ? 'Sin TOG' : `${option.tog} TOG`}
          </Text>
        </View>
      ))}
    </View>
  );
}
