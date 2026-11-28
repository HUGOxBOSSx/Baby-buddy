import Feather from '@expo/vector-icons/Feather';
import {
  DISCLAIMERS_MX,
  MIN_TOUCH_TARGET_PX,
} from '@baby-buddy/core';
import { Linking, Pressable, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export function TriageDisclaimerBanner() {
  const { palette, iconsLoaded } = useThemeContext();
  const disclaimer = DISCLAIMERS_MX.triage_banner;

  const handleEmergencyCall = () => {
    Linking.openURL('tel:911').catch(() => {
      // Fallback silencioso en web/simuladores sin marcador telefónico.
    });
  };

  return (
    <View
      className="rounded-2xl border-2 p-4 gap-2.5"
      style={{
        backgroundColor: palette.alertRedSurface,
        borderColor: palette.alertRed,
      }}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      aria-live="assertive"
    >
      <Text className="text-xs" style={{ color: palette.textPrimary }}>
        {disclaimer.bodyMx}
      </Text>

      <Pressable
        onPress={handleEmergencyCall}
        className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-2.5 gap-2"
        style={{
          minHeight: MIN_TOUCH_TARGET_PX,
          minWidth: MIN_TOUCH_TARGET_PX,
          backgroundColor: palette.alertRedText,
        }}
        accessibilityRole="button"
        accessibilityLabel="Llamar al 911 en caso de emergencia médica"
      >
        {iconsLoaded ? (
          <Feather name="phone" size={18} color={palette.onAlertRedButton} />
        ) : null}
        <Text
          className="text-sm font-bold"
          style={{ color: palette.onAlertRedButton }}
        >
          Llamar al 911
        </Text>
      </Pressable>
    </View>
  );
}
