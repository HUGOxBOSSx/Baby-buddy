import Feather from '@expo/vector-icons/Feather';
import {
  ACCESSORY_OPTIONS,
  BASE_LAYER_OPTIONS,
  MID_LAYER_OPTIONS,
  MIN_TOUCH_TARGET_PX,
  OUTER_LAYER_OPTIONS,
  type AccessoryId,
  type BaseLayerId,
  type GarmentVisualKind,
  type MidLayerId,
  type OuterLayerId,
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
    case 'hat':
      return 'sun';
    case 'mittens':
    case 'socks':
      return 'feather';
  }
}

export function SelectedLayersPreview({
  base,
  mid,
  outer,
  accessories = [],
}: {
  readonly base: readonly BaseLayerId[];
  readonly mid: readonly MidLayerId[];
  readonly outer: readonly OuterLayerId[];
  readonly accessories?: readonly AccessoryId[];
}) {
  const { palette, iconsLoaded } = useThemeContext();
  const selected = [
    ...base.map(
      (id) => BASE_LAYER_OPTIONS.find((o) => o.id === id) ?? BASE_LAYER_OPTIONS[0]!,
    ),
    ...mid.map(
      (id) => MID_LAYER_OPTIONS.find((o) => o.id === id) ?? MID_LAYER_OPTIONS[0]!,
    ),
    ...outer.map(
      (id) => OUTER_LAYER_OPTIONS.find((o) => o.id === id) ?? OUTER_LAYER_OPTIONS[0]!,
    ),
    ...accessories.map(
      (id) => ACCESSORY_OPTIONS.find((o) => o.id === id) ?? ACCESSORY_OPTIONS[0]!,
    ),
  ].filter((o) => o.id !== 'ninguna' || base.length === 1);

  return (
    <View className="flex-row flex-wrap gap-2">
      {selected.map((option, idx) => (
        <View
          key={`${option.id}-${idx}`}
          className="flex-row items-center gap-2 rounded-xl border px-3 py-2"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          {iconsLoaded ? (
            <Feather
              name={getGarmentFeatherName(option.visualKind)}
              size={14}
              color={palette.brandText}
            />
          ) : null}
          <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
            {option.labelMx}
          </Text>
          <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
            {option.tog === null ? 'Sin TOG' : `${option.tog}`}
          </Text>
        </View>
      ))}
    </View>
  );
}
