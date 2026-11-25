import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export interface AccountDeletionSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
}

export function AccountDeletionSheet({
  visible,
  onClose,
  onDeleted,
}: AccountDeletionSheetProps) {
  const { palette, snapshotSummary, deleteAccountAndData, iconsLoaded } =
    useThemeContext();
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDeletion = async () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountAndData('Solicitud del usuario desde Salud');
      onDeleted?.();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center p-5"
        style={{ backgroundColor: 'rgba(18, 17, 16, 0.72)' }}
        accessibilityViewIsModal
        aria-modal
      >
        <View
          className="w-full max-w-md rounded-2xl border p-5 gap-4"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1">
              {iconsLoaded ? (
                <Feather
                  name="trash-2"
                  size={20}
                  color={palette.alertRedText}
                />
              ) : null}
              <Text
                className="text-lg font-bold flex-1"
                style={{ color: palette.textPrimary }}
              >
                Eliminar datos de este dispositivo
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={deleting}
              className="min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                minWidth: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar confirmación de eliminación"
            >
              {iconsLoaded ? (
                <Feather name="x" size={18} color={palette.textPrimary} />
              ) : (
                <Text
                  className="text-base font-bold"
                  style={{ color: palette.textPrimary }}
                >
                  ×
                </Text>
              )}
            </Pressable>
          </View>

          <Text className="text-sm" style={{ color: palette.textSecondary }}>
            Esta acción borra de forma inmediata todos los datos de Baby Buddy MX
            guardados en este dispositivo. En esta versión no existe una cuenta
            remota ni se envía información a servidores. Los datos de otras
            aplicaciones no se modifican.
          </Text>

          <View
            className="rounded-xl border p-3 gap-1"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color: palette.textPrimary }}
            >
              Resumen a eliminar: {snapshotSummary.itemCount} elementos locales
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Incluye preferencias de tema, etapa activa, aceptación inicial y
              perfil infantil local si fue cargado.
            </Text>
            {snapshotSummary.keys.length > 0 ? (
              <ScrollView style={{ maxHeight: 96 }} className="pt-1">
                {snapshotSummary.keys.map((key) => (
                  <Text
                    key={key}
                    className="text-xs"
                    style={{ color: palette.textMuted }}
                  >
                    • {key}
                  </Text>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => void handleConfirmDeletion()}
              disabled={deleting}
              className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl px-4 py-3 gap-2"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                minWidth: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.alertRedText,
                opacity: deleting ? 0.75 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar eliminación definitiva de datos locales"
              accessibilityState={{ disabled: deleting }}
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
                {deleting
                  ? 'Eliminando datos locales...'
                  : 'Confirmar eliminación definitiva'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={deleting}
              className="min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border px-4 py-3"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                minWidth: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgCard,
                borderColor: palette.borderInteractive,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancelar y conservar datos locales"
            >
              <Text
                className="text-sm font-bold"
                style={{ color: palette.textPrimary }}
              >
                Cancelar y conservar datos
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
