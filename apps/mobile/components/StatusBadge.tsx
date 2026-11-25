import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
  STATUS_SPECS,
  type StatusSeverity,
} from '@baby-buddy/core';
import { Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export interface StatusBadgeProps {
  readonly severity: StatusSeverity;
  readonly showDescription?: boolean;
}

const FALLBACK_SYMBOLS: Record<StatusSeverity, string> = {
  normal: '✓',
  caution: '!',
  urgent_red: '!',
};

export function StatusBadge({
  severity,
  showDescription = false,
}: StatusBadgeProps) {
  const { palette, iconsLoaded } = useThemeContext();
  const spec = STATUS_SPECS[severity];

  const surfaceColor =
    severity === 'urgent_red'
      ? palette.alertRedSurface
      : severity === 'caution'
        ? palette.accentWarmSurface
        : palette.brandSurface;

  const borderColor =
    severity === 'urgent_red'
      ? palette.alertRed
      : severity === 'caution'
        ? palette.accentWarm
        : palette.brandPrimary;

  const fgColor =
    severity === 'urgent_red'
      ? palette.alertRedText
      : severity === 'caution'
        ? palette.accentWarmText
        : palette.brandText;

  return (
    <View
      className="rounded-xl border px-3 py-2 gap-1 self-start"
      style={{
        backgroundColor: surfaceColor,
        borderColor,
      }}
      accessibilityRole="text"
      accessibilityLabel={`${spec.labelMx}. ${spec.descriptionMx}`}
    >
      <View className="flex-row items-center gap-2">
        {iconsLoaded ? (
          <Feather name={spec.iconName} size={18} color={fgColor} />
        ) : (
          <View
            className="items-center justify-center rounded-full border"
            style={{
              width: 20,
              height: 20,
              borderColor: fgColor,
            }}
          >
            <Text
              className="text-xs font-bold leading-none"
              style={{ color: fgColor }}
            >
              {FALLBACK_SYMBOLS[severity]}
            </Text>
          </View>
        )}
        <Text
          className="text-sm font-bold"
          style={{
            color: fgColor,
            minHeight: Math.round(MIN_TOUCH_TARGET_PX / 2),
          }}
        >
          {spec.labelMx}
        </Text>
      </View>

      {showDescription ? (
        <Text className="text-sm" style={{ color: palette.textPrimary }}>
          {spec.descriptionMx}
        </Text>
      ) : null}
    </View>
  );
}
