import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  decodeFamilyBabyCode,
  encodeFamilyBabyCode,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { AccountDeletionSheet } from '../../components/AccountDeletionSheet';
import { ChildProfileEditor } from '../../components/ChildProfileEditor';
import { SimulatedAdBanner } from '../../components/SimulatedAdBanner';
import { useThemeContext } from '../../components/ThemeProvider';
import { isUnsupportedInCurrentExpoRuntime } from '../../lib/notifications';
import {
  CURRENT_APP_VERSION,
  DEFAULT_RELEASES_URL,
  checkForApkUpdate,
  type UpdateCheckResult,
} from '../../lib/updates';
import {
  offlineDeploymentStub,
  offlineEnvConfig,
  offlineGeminiStub,
  offlineSupabaseStub,
} from '../../lib/localAdapter';

export default function ConfiguracionScreen() {
  const {
    palette,
    snapshotSummary,
    childProfile,
    addChildProfile,
    themeSchedule,
    setThemeSchedule,
    pendingSyncCount,
    exportFamilyBackup,
    importFamilyBackup,
    adPreview,
    setAdPreview,
    notificationsEnabled,
    enableNotifications,
    disableNotifications,
  } = useThemeContext();
  const [deletionSheetVisible, setDeletionSheetVisible] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [familyIdInput, setFamilyIdInput] = useState('');
  const [familyMessage, setFamilyMessage] = useState<string | null>(null);
  const [showBackupImport, setShowBackupImport] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);

  const supabaseHealth = offlineSupabaseStub.getStatus();
  const geminiHealth = offlineGeminiStub.getStatus();
  const deploymentHealth = offlineDeploymentStub.getStatus();

  const activeShareCode = childProfile
    ? encodeFamilyBabyCode({
        nicknameMx: childProfile.nicknameMx,
        ageMonths: childProfile.ageMonths,
        sex: childProfile.sex,
        birthDateIso: childProfile.birthDateIso,
      })
    : null;

  const handleLinkByIdOrCode = async () => {
    const raw = familyIdInput.trim();
    if (!raw) {
      setFamilyMessage('Escribe el ID o código familiar del bebé.');
      return;
    }
    const decoded = decodeFamilyBabyCode(raw);
    if (decoded) {
      const added = await addChildProfile(decoded);
      setFamilyIdInput('');
      setFamilyMessage(
        `✓ Perfil "${added.nicknameMx}" agregado. Listo para sincronización en tiempo real al conectar la nube.`,
      );
      return;
    }
    setFamilyIdInput('');
    setFamilyMessage(
      `✓ ID "${raw}" guardado para enlace familiar. La sincronización en tiempo real se activará al conectar la nube.`,
    );
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
    >
      <View className="gap-0.5">
        <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
          Configuraciones
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Bebés, modo nocturno, familia y datos
        </Text>
      </View>

      {/* 1. Registro y perfiles del bebé */}
      <ChildProfileEditor />

      {/* 2. Modo nocturno automático */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Modo nocturno automático
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
                themeSchedule.mode === 'auto' ? palette.brandPrimary : palette.bgElevated,
              borderColor:
                themeSchedule.mode === 'auto' ? palette.brandPrimary : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color:
                  themeSchedule.mode === 'auto' ? palette.onBrandPrimary : palette.textPrimary,
              }}
            >
              Automático
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setThemeSchedule({ ...themeSchedule, mode: 'manual' })}
            className="flex-1 rounded-xl border px-3 py-2 items-center justify-center"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor:
                themeSchedule.mode === 'manual' ? palette.brandPrimary : palette.bgElevated,
              borderColor:
                themeSchedule.mode === 'manual' ? palette.brandPrimary : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color:
                  themeSchedule.mode === 'manual' ? palette.onBrandPrimary : palette.textPrimary,
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

      {/* 3. Compartir y sincronización familiar */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Compartir y sincronización familiar
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Comparte el ID o código de tu bebé o vincula uno existente (listo para
          sincronización en tiempo real al conectar la nube).
        </Text>

        {childProfile && activeShareCode ? (
          <View
            className="rounded-xl border p-3 gap-1.5"
            style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
              ID de {childProfile.nicknameMx}: {childProfile.id}
            </Text>
            <Text className="text-[11px]" style={{ color: palette.textSecondary }}>
              Código: {activeShareCode}
            </Text>
            <Pressable
              onPress={() => {
                void Share.share({
                  message: `Código familiar Baby Buddy MX (${childProfile.nicknameMx}): ${activeShareCode}`,
                });
              }}
              className="rounded-xl border px-3 py-2 items-center justify-center"
              style={{
                minHeight: 40,
                backgroundColor: palette.brandSurface,
                borderColor: palette.brandPrimary,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                Compartir ID / código
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <TextInput
            value={familyIdInput}
            onChangeText={setFamilyIdInput}
            placeholder="ID o código BBMX-1-..."
            placeholderTextColor={palette.textMuted}
            className="flex-1 rounded-xl border px-3 py-2 text-xs"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
              color: palette.textPrimary,
            }}
          />
          <Pressable
            onPress={() => void handleLinkByIdOrCode()}
            className="rounded-xl px-4 py-2 justify-center"
            style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
              Vincular
            </Text>
          </Pressable>
        </View>
        {familyMessage ? (
          <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
            {familyMessage}
          </Text>
        ) : null}

        <View
          className="rounded-xl border p-3 gap-2"
          style={{ backgroundColor: palette.bgElevated, borderColor: palette.borderInteractive }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
            Respaldo manual .json (cola offline: {pendingSyncCount})
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
                style={{ minHeight: MIN_TOUCH_TARGET_PX, backgroundColor: palette.brandPrimary }}
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

      {/* 4. Notificaciones locales */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Notificaciones locales
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Envía avisos locales para recordatorios (como vacunas pendientes con
          acceso directo), alertas de hidratación/evacuaciones y registro en
          curso de siesta o toma al salir de la app. En Expo Go el aviso
          muestra el tiempo al salir; un cronómetro segundo a segundo en
          pantalla bloqueada requiere build nativo.
        </Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          {isUnsupportedInCurrentExpoRuntime() ? (
            <View
              className="rounded-xl border px-4 py-2.5 items-center justify-center"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold text-center" style={{ color: palette.textSecondary }}>
                Requiere build nativo en Android (limitación de Expo Go)
              </Text>
              <Text className="text-[11px] text-center mt-0.5" style={{ color: palette.textMuted }}>
                Expo Go para Android deshabilitó expo-notifications desde SDK 53. Al generar tu build nativo (APK / Development Build) se activan automáticamente.
              </Text>
            </View>
          ) : notificationsEnabled ? (
            <Pressable
              onPress={disableNotifications}
              className="rounded-xl border px-4 py-2 items-center justify-center"
              style={{
                minHeight: 42,
                backgroundColor: palette.brandPrimary,
                borderColor: palette.brandPrimary,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                ✓ Notificaciones activas (desactivar)
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void enableNotifications()}
              className="rounded-xl border px-4 py-2 items-center justify-center"
              style={{
                minHeight: 42,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                Activar notificaciones locales
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 5. Vista previa de anuncios (simulación local) */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Vista previa de anuncios (simulación)
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Simulación visual 100 % local del banner discreto encima de la barra
          inferior: nunca aparece en urgencias 911, pantallas infantiles, Plan Pro
          ni en horario nocturno fijo (22:00–06:00 h).
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2">
          <Pressable
            onPress={() =>
              setAdPreview({ ...adPreview, enabled: !adPreview.enabled })
            }
            className="rounded-xl border px-4 py-2 items-center justify-center"
            style={{
              minHeight: 42,
              backgroundColor: adPreview.enabled
                ? palette.brandPrimary
                : palette.bgElevated,
              borderColor: adPreview.enabled
                ? palette.brandPrimary
                : palette.borderInteractive,
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{
                color: adPreview.enabled
                  ? palette.onBrandPrimary
                  : palette.brandText,
              }}
            >
              {adPreview.enabled
                ? 'Desactivar simulación de banner'
                : 'Activar simulación de banner'}
            </Text>
          </Pressable>
        </View>

        {adPreview.enabled ? (
          <View className="gap-2">
            <View className="flex-row flex-wrap justify-center gap-2">
              {(
                [
                  { id: 'free', label: 'Plan Gratuito' },
                  { id: 'pro', label: 'Plan Pro' },
                ] as const
              ).map((p) => {
                const active = adPreview.plan === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setAdPreview({ ...adPreview, plan: p.id })}
                    className="rounded-full border px-3 py-1.5"
                    style={{
                      backgroundColor: active
                        ? palette.brandPrimary
                        : palette.bgElevated,
                      borderColor: active
                        ? palette.brandPrimary
                        : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: active
                          ? palette.onBrandPrimary
                          : palette.textPrimary,
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row flex-wrap justify-center gap-2">
              {(
                [
                  { id: 'day_14', label: 'Día (14:00 h)' },
                  { id: 'night_23', label: 'Noche (23:00 h)' },
                  { id: 'real', label: 'Hora real' },
                ] as const
              ).map((h) => {
                const active = adPreview.hourMode === h.id;
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => setAdPreview({ ...adPreview, hourMode: h.id })}
                    className="rounded-full border px-3 py-1.5"
                    style={{
                      backgroundColor: active
                        ? palette.brandSurface
                        : palette.bgElevated,
                      borderColor: active
                        ? palette.brandPrimary
                        : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: active
                          ? palette.brandText
                          : palette.textSecondary,
                      }}
                    >
                      {h.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <SimulatedAdBanner inlinePreview />
      </View>

      {/* 5. Datos locales y privacidad */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Datos locales y privacidad
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Registros guardados localmente: {snapshotSummary.itemCount}
          {childProfile
            ? ` · Activo: ${childProfile.nicknameMx} (${STAGE_SPECS[childProfile.stageId].shortLabel})`
            : ''}
        </Text>

        <Pressable
          onPress={() => setDeletionSheetVisible(true)}
          className="min-h-[48px] flex-row items-center justify-center rounded-xl px-4 py-3"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.alertRedText,
          }}
        >
          <Text className="text-sm font-bold" style={{ color: palette.onAlertRedButton }}>
            Eliminar datos de este dispositivo
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowTechInfo((prev) => !prev)}
          className="flex-row items-center justify-between pt-1"
          style={{ minHeight: MIN_TOUCH_TARGET_PX }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
            Información técnica (modo offline)
          </Text>
          <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
            {showTechInfo ? 'Ocultar' : 'Ver'}
          </Text>
        </Pressable>
        {showTechInfo ? (
          <View className="gap-1.5">
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Entorno: {offlineEnvConfig.mode} · Credenciales en vivo:{' '}
              {offlineEnvConfig.hasLiveCredentials ? 'Sí' : 'No (100% local)'}
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              • Supabase ({supabaseHealth.mode}): {supabaseHealth.messageMx}
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              • Asistente ({geminiHealth.mode}): {geminiHealth.messageMx}
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              • Despliegue ({deploymentHealth.mode}): {deploymentHealth.messageMx}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 7. Versión y actualizaciones (APK) */}
      <View
        className="rounded-2xl border p-4 gap-3"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
            Versión y actualizaciones
          </Text>
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            v{CURRENT_APP_VERSION}
          </Text>
        </View>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Verifica si hay una nueva APK disponible para actualizar conservando
          todos tus registros locales.
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2">
          <Pressable
            onPress={() => {
              if (checkingUpdate) return;
              setCheckingUpdate(true);
              void checkForApkUpdate()
                .then((res) => setUpdateResult(res))
                .finally(() => setCheckingUpdate(false));
            }}
            disabled={checkingUpdate}
            className="rounded-xl border px-4 py-2 items-center justify-center"
            style={{
              minHeight: 42,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {checkingUpdate ? 'Buscando...' : 'Buscar actualizaciones'}
            </Text>
          </Pressable>
        </View>

        {updateResult ? (
          <View
            className="rounded-xl border p-3 gap-2"
            style={{
              backgroundColor:
                updateResult.status === 'update_available'
                  ? palette.brandSurface
                  : palette.bgElevated,
              borderColor:
                updateResult.status === 'update_available'
                  ? palette.brandPrimary
                  : palette.borderInteractive,
            }}
          >
            {updateResult.status === 'update_available' ? (
              <>
                <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                  Nueva versión disponible: v{updateResult.latestVersion}
                </Text>
                {updateResult.notesMx ? (
                  <Text className="text-xs" style={{ color: palette.textSecondary }}>
                    {updateResult.notesMx}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    void Linking.openURL(
                      updateResult.apkUrl ?? updateResult.releasesUrl,
                    );
                  }}
                  className="rounded-xl px-4 py-2.5 items-center justify-center"
                  style={{
                    minHeight: MIN_TOUCH_TARGET_PX,
                    backgroundColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.onBrandPrimary }}>
                    Descargar actualización (APK)
                  </Text>
                </Pressable>
              </>
            ) : updateResult.status === 'up_to_date' ? (
              <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
                ✓ Tienes la última versión instalada (v{updateResult.currentVersion}).
              </Text>
            ) : (
              <>
                <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
                  {updateResult.messageMx}
                </Text>
                <Pressable
                  onPress={() => {
                    void Linking.openURL(DEFAULT_RELEASES_URL);
                  }}
                  className="rounded-xl border px-3 py-2 items-center justify-center"
                  style={{
                    minHeight: 40,
                    backgroundColor: palette.bgCard,
                    borderColor: palette.borderInteractive,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                    Abrir Releases en navegador
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}
      </View>

      <AccountDeletionSheet
        visible={deletionSheetVisible}
        onClose={() => setDeletionSheetVisible(false)}
      />
    </ScrollView>
  );
}
