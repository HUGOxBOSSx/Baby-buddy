import Feather from '@expo/vector-icons/Feather';
import { TRIAGE_LEVEL_SPECS, type TriageLevel } from '@baby-buddy/core';
import { Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export function TriageBadge({ level }: { readonly level: TriageLevel }) {
  const { palette, iconsLoaded } = useThemeContext();
  const spec = TRIAGE_LEVEL_SPECS[level];

  const bg =
    level === 'red_911'
      ? palette.alertRed
      : level === 'orange_urgent'
        ? palette.alertRedSurface
        : level === 'yellow_pediatrician'
          ? palette.accentWarmSurface
          : palette.brandSurface;

  const border =
    level === 'red_911' || level === 'orange_urgent'
      ? palette.alertRed
      : level === 'yellow_pediatrician'
        ? palette.accentWarm
        : palette.brandPrimary;

  const textColor =
    level === 'red_911'
      ? palette.onAlertRedButton
      : level === 'orange_urgent'
        ? palette.alertRedText
        : level === 'yellow_pediatrician'
          ? palette.accentWarmText
          : palette.brandText;

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-1 self-start"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {iconsLoaded ? (
        <Feather name={spec.iconName} size={14} color={textColor} />
      ) : null}
      <Text className="text-xs font-bold" style={{ color: textColor }}>
        {spec.labelMx}
      </Text>
    </View>
  );
}
