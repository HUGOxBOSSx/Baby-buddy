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
      className="rounded-2xl border-2 p-4 gap-3"
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
          <View
            className="rounded-lg border px-2.5 py-1"
            style={{
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: palette.textPrimary }}
            >
              Sin costo ni suscripción
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-1">
        <Text
          className="text-base font-bold"
          style={{ color: palette.textPrimary }}
        >
          {disclaimer.titleMx}
        </Text>
        <Text className="text-sm" style={{ color: palette.textPrimary }}>
          {disclaimer.bodyMx}
        </Text>
        <Text
          className="text-sm font-semibold"
          style={{ color: palette.alertRedText }}
        >
          {disclaimer.emergencyActionLabelMx}
        </Text>
      </View>

      <Pressable
        onPress={handleEmergencyCall}
        className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 gap-2"
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
          className="text-base font-bold"
          style={{ color: palette.onAlertRedButton }}
        >
          Llamar al 911 — Emergencias (Gratis)
        </Text>
      </Pressable>
    </View>
  );
}
