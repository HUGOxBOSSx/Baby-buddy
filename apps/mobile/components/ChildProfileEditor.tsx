import {
  CHILD_SEX_LABELS_MX,
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  getStageForAgeMonths,
  type ChildSex,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const SEX_OPTIONS: readonly ChildSex[] = ['niño', 'niña', 'no_especificado'];

export function ChildProfileEditor() {
  const { palette, childProfile, saveChildProfile } = useThemeContext();
  const [nickname, setNickname] = useState(childProfile?.nicknameMx ?? '');
  const [ageMonths, setAgeMonths] = useState(
    String(childProfile?.ageMonths ?? 2),
  );
  const [sex, setSex] = useState<ChildSex>(
    childProfile?.sex ?? 'no_especificado',
  );
  const [feedback, setFeedback] = useState('');

  const parsedAge = Number.parseInt(ageMonths, 10);
  const previewStage =
    Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 72
      ? STAGE_SPECS[getStageForAgeMonths(parsedAge)].label
      : 'Edad fuera de rango (0 a 72 meses)';

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFeedback('Escribe el nombre o apodo de tu bebé.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 72) {
      setFeedback('La edad debe estar entre 0 y 72 meses.');
      return;
    }
    const saved = await saveChildProfile({
      nicknameMx: trimmed,
      ageMonths: parsedAge,
      sex,
    });
    setFeedback(
      `Guardado: ${saved.nicknameMx} (${STAGE_SPECS[saved.stageId].label}).`,
    );
  };

  return (
    <View
      className="rounded-2xl border p-4 gap-3"
      style={{
        backgroundColor: palette.bgCard,
        borderColor: palette.borderInteractive,
      }}
    >
      <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
        Datos del bebé (etapa automática)
      </Text>
      <Text className="text-xs" style={{ color: palette.textSecondary }}>
        Al guardar, la app calcula la etapa en automático, oculta las demás
        etapas y muestra su resumen arriba.
      </Text>

      <View className="gap-1">
        <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
          Nombre o apodo
        </Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="Ej. Mateo o Sofía"
          placeholderTextColor={palette.textMuted}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
            color: palette.textPrimary,
          }}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
          Edad en meses (0 a 72)
        </Text>
        <TextInput
          value={ageMonths}
          onChangeText={setAgeMonths}
          keyboardType="number-pad"
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
            color: palette.textPrimary,
          }}
        />
        <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
          Etapa automática: {previewStage}
        </Text>
      </View>

      <View className="gap-1.5">
        <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
          Sexo
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SEX_OPTIONS.map((opt) => {
            const selected = sex === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setSex(opt)}
                className="rounded-xl border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: selected
                    ? palette.brandPrimary
                    : palette.bgElevated,
                  borderColor: selected
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: selected ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {CHILD_SEX_LABELS_MX[opt]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => void handleSave()}
        className="rounded-xl items-center justify-center px-4 py-3"
        style={{
          minHeight: MIN_TOUCH_TARGET_PX,
          backgroundColor: palette.brandPrimary,
        }}
      >
        <Text className="text-sm font-bold" style={{ color: palette.onBrandPrimary }}>
          Guardar datos del bebé
        </Text>
      </Pressable>

      {feedback ? (
        <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}
