import Feather from '@expo/vector-icons/Feather';
import {
  ETHICAL_GUARDRAILS,
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AccountDeletionSheet } from '../../components/AccountDeletionSheet';
import { StatusBadge } from '../../components/StatusBadge';
import { useThemeContext } from '../../components/ThemeProvider';
import { TriageDisclaimerBanner } from '../../components/TriageDisclaimerBanner';
import {
  offlineDeploymentStub,
  offlineEnvConfig,
  offlineGeminiStub,
  offlineSupabaseStub,
} from '../../lib/localAdapter';

export default function SaludScreen() {
  const {
    palette,
    snapshotSummary,
    childProfile,
    seedDemoData,
    iconsLoaded,
  } = useThemeContext();
  const [deletionSheetVisible, setDeletionSheetVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const supabaseHealth = offlineSupabaseStub.getStatus();
  const geminiHealth = offlineGeminiStub.getStatus();
  const deploymentHealth = offlineDeploymentStub.getStatus();

  const handleSeedDemo = async () => {
    if (seeding) {
      return;
    }
    setSeeding(true);
    try {
      await seedDemoData();
    } finally {
      setSeeding(false);
    }
  };

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
          Salud, Emergencias y Privacidad
        </Text>
        <Text className="text-sm" style={{ color: palette.textSecondary }}>
          Orientación de urgencias 911 sin suscripción y control total de tus
          datos locales.
        </Text>
      </View>

      <TriageDisclaimerBanner />

      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text
            className="text-lg font-bold"
            style={{ color: palette.textPrimary }}
          >
            Datos locales y cuenta (Apple 5.1.1(v))
          </Text>
          <StatusBadge
            severity={snapshotSummary.hasActiveProfile ? 'normal' : 'caution'}
          />
        </View>

        <View
          className="rounded-xl border p-3 gap-1"
          style={{
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: palette.textPrimary }}
          >
            Registros guardados localmente: {snapshotSummary.itemCount}
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Aviso inicial aceptado:{' '}
            {snapshotSummary.onboardingAccepted ? 'Sí' : 'No'} · Perfil demo
            activo: {snapshotSummary.hasActiveProfile ? 'Sí' : 'No'}
          </Text>
          {childProfile !== null ? (
            <Text className="text-xs" style={{ color: palette.brandText }}>
              Perfil activo: {childProfile.nicknameMx} ·{' '}
              {childProfile.ageMonths} meses (
              {STAGE_SPECS[childProfile.stageId].label})
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <Pressable
            onPress={() => void handleSeedDemo()}
            disabled={seeding}
            className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 gap-2"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.brandPrimary,
              opacity: seeding ? 0.75 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Cargar perfil demo local en este dispositivo"
            accessibilityState={{ disabled: seeding }}
          >
            {iconsLoaded ? (
              <Feather
                name="shield"
                size={18}
                color={palette.onBrandPrimary}
              />
            ) : null}
            <Text
              className="text-sm font-bold"
              style={{ color: palette.onBrandPrimary }}
            >
              {seeding
                ? 'Guardando perfil demo...'
                : 'Cargar perfil demo local'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setDeletionSheetVisible(true)}
            className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 gap-2"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.alertRedText,
            }}
            accessibilityRole="button"
            accessibilityLabel="Eliminar cuenta y datos locales"
          >
            {iconsLoaded ? (
              <Feather
                name="trash-2"
                size={18}
                color={palette.onAlertRedText}
              />
            ) : null}
            <Text
              className="text-sm font-bold"
              style={{ color: palette.onAlertRedText }}
            >
              Eliminar cuenta y datos locales
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        className="rounded-2xl border p-4 gap-2"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text
          className="text-base font-bold"
          style={{ color: palette.textPrimary }}
        >
          Estado de servicios locales / offline (Hito 1)
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Modo de entorno: {offlineEnvConfig.mode} · Credenciales en vivo:{' '}
          {offlineEnvConfig.hasLiveCredentials ? 'Sí' : 'No (100% local)'}
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          • Supabase ({supabaseHealth.mode}): {supabaseHealth.messageMx}
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          • Asistente IA ({geminiHealth.mode}): {geminiHealth.messageMx}
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          • Despliegue ({deploymentHealth.mode}): {deploymentHealth.messageMx}
        </Text>
      </View>

      <View
        className="rounded-2xl border p-4 gap-2"
        style={{
          backgroundColor: palette.brandSurface,
          borderColor: palette.brandPrimary,
        }}
      >
        <Text
          className="text-sm font-bold"
          style={{ color: palette.brandText }}
        >
          Compromisos éticos verificados
        </Text>
        <Text className="text-xs" style={{ color: palette.textPrimary }}>
          • Sin anuncios en pantallas infantiles:{' '}
          {ETHICAL_GUARDRAILS.adsOnChildScreens === false ? 'Cumplido' : 'No'}
        </Text>
        <Text className="text-xs" style={{ color: palette.textPrimary }}>
          • Sin paywall en 911 ni alertas rojas:{' '}
          {ETHICAL_GUARDRAILS.paywallOnEmergencyTriage === false
            ? 'Cumplido'
            : 'No'}
        </Text>
        <Text className="text-xs" style={{ color: palette.textPrimary }}>
          • Sin venta de datos:{' '}
          {ETHICAL_GUARDRAILS.dataSellingEnabled === false ? 'Cumplido' : 'No'}
        </Text>
      </View>

      <AccountDeletionSheet
        visible={deletionSheetVisible}
        onClose={() => setDeletionSheetVisible(false)}
      />
    </ScrollView>
  );
}
