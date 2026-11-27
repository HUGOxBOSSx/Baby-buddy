import Feather from '@expo/vector-icons/Feather';
import {
  DISCLAIMERS_MX,
  ETHICAL_GUARDRAILS,
  MIN_TOUCH_TARGET_PX,
} from '@baby-buddy/core';
import { Linking, Pressable, Text, View } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { useThemeContext } from './ThemeProvider';

export function TriageDisclaimerBanner() {
  const { palette, iconsLoaded } = useThemeContext();
  const disclaimer = DISCLAIMERS_MX.triage_banner;
  const noPaywallConfirmed = ETHICAL_GUARDRAILS.paywallOnEmergencyTriage === false;

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
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <StatusBadge severity="urgent_red" />
        {noPaywallConfirmed ? (
          <Text
            className="text-xs font-bold"
            style={{ color: palette.alertRedText }}
          >
            Gratis siempre
          </Text>
        ) : null}
      </View>

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
        accessibilityLabel="Llamar al 911 en caso de emergencia médica, acceso gratuito sin suscripción"
      >
        {iconsLoaded ? (
          <Feather name="phone" size={18} color={palette.onAlertRedButton} />
        ) : null}
        <Text
          className="text-sm font-bold"
          style={{ color: palette.onAlertRedButton }}
        >
          Llamar al 911 (Gratis)
        </Text>
      </Pressable>
    </View>
  );
}
