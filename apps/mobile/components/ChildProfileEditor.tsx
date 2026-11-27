import {
  CHILD_SEX_LABELS_MX,
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  calculateAgeMonthsFromBirthDate,
  formatChildAgeMx,
  getStageForAgeMonths,
  type ChildSex,
} from '@baby-buddy/core';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const SEX_OPTIONS: readonly ChildSex[] = ['niño', 'niña', 'no_especificado'];

function getTodayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function ChildProfileEditor() {
  const { palette, childProfile, saveChildProfile } = useThemeContext();
  const [nickname, setNickname] = useState(childProfile?.nicknameMx ?? '');
  const [birthDate, setBirthDate] = useState(
    childProfile?.birthDateIso?.slice(0, 10) ?? getTodayYmd(),
  );
  const [sex, setSex] = useState<ChildSex>(
    childProfile?.sex ?? 'no_especificado',
  );
  const [feedback, setFeedback] = useState('');

  let previewText = 'Usa formato AAAA-MM-DD (0 a 6 años)';
  let computedMonths: number | null = null;
  try {
    computedMonths = calculateAgeMonthsFromBirthDate(birthDate);
    previewText = `${formatChildAgeMx(computedMonths)} · ${STAGE_SPECS[getStageForAgeMonths(computedMonths)].label}`;
  } catch {
    computedMonths = null;
  }

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setFeedback('Escribe el nombre o apodo de tu bebé.');
      return;
    }
    if (computedMonths === null) {
      setFeedback('Fecha inválida. Usa AAAA-MM-DD (0 a 6 años).');
      return;
    }
    const saved = await saveChildProfile({
      nicknameMx: trimmed,
      birthDateIso: birthDate,
      ageMonths: computedMonths,
      sex,
    });
    setFeedback(
      `Guardado: ${saved.nicknameMx} (${formatChildAgeMx(saved.ageMonths)}).`,
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
      <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
        Perfil del bebé
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
          Fecha de nacimiento (AAAA-MM-DD)
        </Text>
        <TextInput
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="2026-08-15"
          placeholderTextColor={palette.textMuted}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
            color: palette.textPrimary,
          }}
        />
        <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
          {previewText}
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
