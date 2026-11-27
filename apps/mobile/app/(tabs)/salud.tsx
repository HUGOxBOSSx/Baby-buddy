import Feather from '@expo/vector-icons/Feather';
import {
  ETHICAL_GUARDRAILS,
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { AccountDeletionSheet } from '../../components/AccountDeletionSheet';
import { ChildProfileEditor } from '../../components/ChildProfileEditor';
import { HealthJournalPanel } from '../../components/HealthJournalPanel';
import { MascotAvatar } from '../../components/MascotAvatar';
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
    themeSchedule,
    setThemeSchedule,
    pendingSyncCount,
    exportFamilyBackup,
    importFamilyBackup,
  } = useThemeContext();
  const [deletionSheetVisible, setDeletionSheetVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [showBackupImport, setShowBackupImport] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

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
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <MascotAvatar variant="salud" size="md" />
          <View className="flex-1 gap-0.5">
            <Text
              className="text-xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              Salud
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Bitácora, vacunas MX y emergencias 911.
            </Text>
          </View>
          <StatusBadge severity="urgent_red" />
        </View>

        <HealthJournalPanel />

      <TriageDisclaimerBanner />

      <ChildProfileEditor />

      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
          Horario automático de Modo nocturno
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Por defecto se activa de {String(themeSchedule.nightStartHour).padStart(2, '0')}
          :00 a {String(themeSchedule.nightEndHour).padStart(2, '0')}:00 h.
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setThemeSchedule({ ...themeSchedule, mode: 'auto' })}
            className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor:
                themeSchedule.mode === 'auto'
                  ? palette.brandPrimary
                  : palette.bgElevated,
              borderColor:
                themeSchedule.mode === 'auto'
                  ? palette.brandPrimary
                  : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color:
                  themeSchedule.mode === 'auto'
                    ? palette.onBrandPrimary
                    : palette.textPrimary,
              }}
            >
              Automático
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              setThemeSchedule({ ...themeSchedule, mode: 'manual' })
            }
            className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor:
                themeSchedule.mode === 'manual'
                  ? palette.brandPrimary
                  : palette.bgElevated,
              borderColor:
                themeSchedule.mode === 'manual'
                  ? palette.brandPrimary
                  : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color:
                  themeSchedule.mode === 'manual'
                    ? palette.onBrandPrimary
                    : palette.textPrimary,
              }}
            >
              Manual
            </Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() =>
              setThemeSchedule({
                ...themeSchedule,
                mode: 'auto',
                nightStartHour: (themeSchedule.nightStartHour + 1) % 24,
              })
            }
            className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Inicio: {String(themeSchedule.nightStartHour).padStart(2, '0')}:00
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              setThemeSchedule({
                ...themeSchedule,
                mode: 'auto',
                nightEndHour: (themeSchedule.nightEndHour + 1) % 24,
              })
            }
            className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Fin: {String(themeSchedule.nightEndHour).padStart(2, '0')}:00
            </Text>
          </Pressable>
        </View>
      </View>

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
            Datos locales y privacidad
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
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Datos guardados solo en este dispositivo. Esta versión no tiene una
            cuenta remota.
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
            accessibilityLabel="Eliminar los datos locales de Baby Buddy MX"
          >
            {iconsLoaded ? (
              <Feather
                name="trash-2"
                size={18}
                color={palette.onAlertRedButton}
              />
            ) : null}
            <Text
              className="text-sm font-bold"
              style={{ color: palette.onAlertRedButton }}
            >
              Eliminar datos de este dispositivo
            </Text>
          </Pressable>

          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              Respaldo familiar (cola offline: {pendingSyncCount})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => {
                  const json = exportFamilyBackup();
                  void Share.share({ message: json });
                }}
                className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.brandSurface,
                  borderColor: palette.brandPrimary,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                  Compartir respaldo
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowBackupImport((v) => !v)}
                className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
                  {showBackupImport ? 'Ocultar' : 'Importar JSON'}
                </Text>
              </Pressable>
            </View>
            {showBackupImport ? (
              <View className="gap-2 pt-1">
                <TextInput
                  value={backupJsonInput}
                  onChangeText={setBackupJsonInput}
                  placeholder="Pega aquí el respaldo JSON..."
                  placeholderTextColor={palette.textMuted}
                  multiline
                  className="rounded-xl border p-2.5 text-xs"
                  style={{
                    minHeight: 72,
                    backgroundColor: palette.bgCard,
                    borderColor: palette.borderInteractive,
                    color: palette.textPrimary,
                  }}
                />
                <Pressable
                  onPress={() => {
                    const res = importFamilyBackup(backupJsonInput);
                    setBackupFeedback(res.messageMx);
                    if (res.ok) setBackupJsonInput('');
                  }}
                  className="rounded-xl px-4 py-2 items-center justify-center"
                  style={{
                    minHeight: MIN_TOUCH_TARGET_PX,
                    backgroundColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                    Fusionar respaldo
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {backupFeedback ? (
              <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
                {backupFeedback}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View
        className="rounded-2xl border p-4 gap-2"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Pressable
          onPress={() => setShowTechInfo((prev) => !prev)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showTechInfo }}
          accessibilityLabel="Información técnica (modo offline)"
          className="flex-row items-center justify-between"
          style={{ minHeight: MIN_TOUCH_TARGET_PX }}
        >
          <Text
            className="text-sm font-bold"
            style={{ color: palette.textPrimary }}
          >
            Información técnica (modo offline)
          </Text>
          <Text
            className="text-xs font-semibold"
            style={{ color: palette.brandText }}
          >
            {showTechInfo ? 'Ocultar' : 'Ver'}
          </Text>
        </Pressable>
        {showTechInfo ? (
          <View className="gap-2 pt-1">
            <Text
              className="text-base font-bold"
              style={{ color: palette.textPrimary }}
            >
              Estado de servicios locales / offline
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
        ) : null}
      </View>

      <View
        className="rounded-2xl border p-4 gap-2"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          100% local · Sin anuncios en pantallas infantiles (
          {ETHICAL_GUARDRAILS.adsOnChildScreens === false ? 'sí' : 'no'}) · 911
          siempre gratis (
          {ETHICAL_GUARDRAILS.paywallOnEmergencyTriage === false ? 'sí' : 'no'})
          · Sin venta de datos (
          {ETHICAL_GUARDRAILS.dataSellingEnabled === false ? 'sí' : 'no'})
        </Text>
      </View>

      <AccountDeletionSheet
        visible={deletionSheetVisible}
        onClose={() => setDeletionSheetVisible(false)}
      />
    </ScrollView>
  );
}
