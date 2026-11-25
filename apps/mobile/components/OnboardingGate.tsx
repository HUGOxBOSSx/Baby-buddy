import Feather from '@expo/vector-icons/Feather';
import {
  DISCLAIMERS_MX,
  MIN_TOUCH_TARGET_PX,
  calculateAgeMonthsFromBirthDate,
  decodeFamilyBabyCode,
  formatChildAgeMx,
  type ChildSex,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BirthDatePicker } from './BirthDatePicker';
import { MascotAvatar } from './MascotAvatar';
import { StatusBadge } from './StatusBadge';
import { useThemeContext } from './ThemeProvider';
import { accountLifecycleAdapter } from '../lib/localAdapter';

export function OnboardingGate() {
  const {
    mode,
    palette,
    toggleMode,
    acceptOnboardingDisclaimer,
    saveChildProfile,
    lastDeletionResult,
    clearLastDeletionResult,
    iconsLoaded,
  } = useThemeContext();
  const [submitting, setSubmitting] = useState(false);
  const [setupMode, setSetupMode] = useState<'register' | 'join'>('register');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<ChildSex>('no_especificado');
  const [familyCode, setFamilyCode] = useState('');
  const disclaimer = DISCLAIMERS_MX.onboarding_gate;
  const ackLabel = disclaimer.ackButtonLabelMx ?? 'Entiendo y acepto continuar';

  const decodedFamily =
    setupMode === 'join' && familyCode.trim().length > 0
      ? decodeFamilyBabyCode(familyCode)
      : null;

  const handleAccept = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      if (setupMode === 'register' && nickname.trim().length > 0) {
        let ageMonths = 0;
        let validDate: string | undefined;
        if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
          try {
            ageMonths = calculateAgeMonthsFromBirthDate(birthDate.trim());
            validDate = birthDate.trim();
          } catch {
            ageMonths = 0;
          }
        }
        await saveChildProfile({
          nicknameMx: nickname.trim(),
          ageMonths,
          sex,
          ...(validDate ? { birthDateIso: validDate } : {}),
        });
      } else if (setupMode === 'join' && decodedFamily) {
        await saveChildProfile(decodedFamily);
      }
      await acceptOnboardingDisclaimer();
      const storedAcceptance =
        await accountLifecycleAdapter.hasAcceptedOnboardingDisclaimer();
      if (!storedAcceptance) {
        throw new Error('No se confirmó la aceptación en el almacenamiento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencyCall = () => {
    Linking.openURL('tel:911').catch(() => {
      // Sin marcador telefónico disponible en entorno de escritorio/simulador.
    });
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingBottom: 32,
        }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <MascotAvatar variant="home" size="sm" />
          <View className="flex-1 gap-0.5">
            <Text
              numberOfLines={1}
              className="text-xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              Baby Buddy MX
            </Text>
            <Text className="text-sm" style={{ color: palette.textSecondary }}>
              Tu compañero de 0 a 6 años
            </Text>
          </View>

          <Pressable
            onPress={toggleMode}
            className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl border px-3 py-2 gap-2"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: mode === 'night_3am' }}
            accessibilityLabel={
              mode === 'night_3am'
                ? 'Modo nocturno activo. Toca para cambiar a Modo Calma de día'
                : 'Modo Calma activo. Toca para activar Modo nocturno'
            }
          >
            {iconsLoaded ? (
              <Feather
                name={mode === 'night_3am' ? 'sun' : 'moon'}
                size={18}
                color={palette.brandText}
              />
            ) : null}
            <Text
              numberOfLines={1}
              className="text-xs font-bold"
              style={{ color: palette.brandText }}
            >
              {mode === 'night_3am' ? 'Modo Calma' : 'Modo nocturno'}
            </Text>
          </Pressable>
        </View>

        {lastDeletionResult !== null ? (
          <View
            className="rounded-2xl border p-4 gap-2"
            style={{
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
            accessibilityLiveRegion="polite"
            aria-live="polite"
          >
            <Text
              className="text-base font-bold"
              style={{ color: palette.brandText }}
            >
              Datos locales eliminados
            </Text>
            <Text className="text-sm" style={{ color: palette.textPrimary }}>
              Se eliminaron {lastDeletionResult.deletedKeysCount} registros
              locales del dispositivo ({lastDeletionResult.deletedAtIso}).
            </Text>
            <Pressable
              onPress={clearLastDeletionResult}
              className="min-h-[48px] min-w-[48px] self-start items-center justify-center rounded-xl border px-4 py-2"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                minWidth: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgCard,
                borderColor: palette.borderInteractive,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar aviso de eliminación local"
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: palette.textPrimary }}
              >
                Cerrar aviso
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View
          className="rounded-2xl border p-5 gap-3"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: palette.brandText }}
          >
            Aviso informativo obligatorio
          </Text>
          <Text
            className="text-lg font-bold"
            style={{ color: palette.textPrimary }}
          >
            {disclaimer.titleMx}
          </Text>
          <Text
            className="text-base leading-6"
            style={{ color: palette.textSecondary }}
          >
            {disclaimer.bodyMx}
          </Text>
          <Text
            className="text-xs font-medium"
            style={{ color: palette.textMuted }}
          >
            Unidades métricas exclusivas (°C, kg, cm, ml) · Sin anuncios ni
            venta de datos.
          </Text>
        </View>

        <View
          className="rounded-2xl border p-4 gap-3"
          style={{
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
            Tu bebé (opcional en este paso)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setSetupMode('register')}
              className="rounded-full border px-3 py-1.5 justify-center"
              style={{
                minHeight: 38,
                backgroundColor:
                  setupMode === 'register' ? palette.brandPrimary : palette.bgCard,
                borderColor:
                  setupMode === 'register'
                    ? palette.brandPrimary
                    : palette.borderInteractive,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color:
                    setupMode === 'register'
                      ? palette.onBrandPrimary
                      : palette.textPrimary,
                }}
              >
                Registrar a mi bebé
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSetupMode('join')}
              className="rounded-full border px-3 py-1.5 justify-center"
              style={{
                minHeight: 38,
                backgroundColor:
                  setupMode === 'join' ? palette.brandPrimary : palette.bgCard,
                borderColor:
                  setupMode === 'join'
                    ? palette.brandPrimary
                    : palette.borderInteractive,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color:
                    setupMode === 'join'
                      ? palette.onBrandPrimary
                      : palette.textPrimary,
                }}
              >
                Ya lo registró un familiar
              </Text>
            </Pressable>
          </View>

          {setupMode === 'register' ? (
            <View className="gap-2">
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Nombre o apodo del bebé"
                placeholderTextColor={palette.textMuted}
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              <BirthDatePicker value={birthDate} onChange={setBirthDate} />
              <View className="flex-row gap-2">
                {(['no_especificado', 'niña', 'niño'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSex(s)}
                    className="flex-1 rounded-xl border py-2 items-center justify-center"
                    style={{
                      minHeight: 40,
                      backgroundColor:
                        sex === s ? palette.brandSurface : palette.bgCard,
                      borderColor:
                        sex === s
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: sex === s ? palette.brandText : palette.textPrimary,
                      }}
                    >
                      {s === 'no_especificado'
                        ? 'Omitir'
                        : s === 'niña'
                          ? 'Niña'
                          : 'Niño'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View className="gap-2">
              <TextInput
                value={familyCode}
                onChangeText={setFamilyCode}
                placeholder="Pega el código familiar (BBMX-1-...)"
                placeholderTextColor={palette.textMuted}
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                  color: palette.textPrimary,
                }}
              />
              {familyCode.trim().length > 0 ? (
                decodedFamily ? (
                  <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
                    ✓ Bebé detectado: {decodedFamily.nicknameMx} ·{' '}
                    {formatChildAgeMx(decodedFamily.ageMonths ?? 0)}
                  </Text>
                ) : (
                  <Text className="text-xs font-semibold" style={{ color: palette.alertRedText }}>
                    Código no válido. Pide a tu familiar copiarlo desde Salud.
                  </Text>
                )
              ) : null}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => void handleAccept()}
          disabled={submitting}
          className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-2xl px-5 py-4 gap-2"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            minWidth: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.brandPrimary,
            opacity: submitting ? 0.75 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={ackLabel}
          accessibilityState={{ disabled: submitting }}
        >
          {iconsLoaded ? (
            <Feather name="check" size={20} color={palette.onBrandPrimary} />
          ) : null}
          <Text
            className="text-base font-bold"
            style={{ color: palette.onBrandPrimary }}
          >
            {submitting ? 'Guardando aceptación...' : ackLabel}
          </Text>
        </Pressable>

        <View
          className="rounded-2xl border-2 p-4 gap-3"
          style={{
            backgroundColor: palette.alertRedSurface,
            borderColor: palette.alertRed,
          }}
          accessibilityRole="alert"
        >
          <StatusBadge severity="urgent_red" />
          <Text
            className="text-sm font-semibold"
            style={{ color: palette.textPrimary }}
          >
            {disclaimer.emergencyActionLabelMx}
          </Text>
          <Pressable
            onPress={handleEmergencyCall}
            className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 gap-2"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              minWidth: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.alertRedText,
            }}
            accessibilityRole="button"
            accessibilityLabel="Llamar al 911 por emergencia médica sin costo"
          >
            {iconsLoaded ? (
              <Feather name="phone" size={18} color={palette.onAlertRedButton} />
            ) : null}
            <Text
              className="text-sm font-bold"
              style={{ color: palette.onAlertRedButton }}
            >
              Emergencias 911 (Acceso gratuito)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
