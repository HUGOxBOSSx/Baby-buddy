import {
  CHILD_SEX_LABELS_MX,
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  calculateAgeMonthsFromBirthDate,
  formatChildAgeMx,
  getStageForAgeMonths,
  type ChildSex,
} from '@baby-buddy/core';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const SEX_OPTIONS: readonly ChildSex[] = ['niño', 'niña', 'no_especificado'];

function getTodayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function ChildProfileEditor() {
  const {
    palette,
    childProfile,
    childProfiles,
    saveChildProfile,
    addChildProfile,
    selectChildProfile,
  } = useThemeContext();
  const [addingNew, setAddingNew] = useState(false);
  const [nickname, setNickname] = useState(childProfile?.nicknameMx ?? '');
  const [birthDate, setBirthDate] = useState(
    childProfile?.birthDateIso?.slice(0, 10) ?? getTodayYmd(),
  );
  const [sex, setSex] = useState<ChildSex>(
    childProfile?.sex ?? 'no_especificado',
  );
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (addingNew || !childProfile) return;
    setNickname(childProfile.nicknameMx);
    setBirthDate(childProfile.birthDateIso?.slice(0, 10) ?? getTodayYmd());
    setSex(childProfile.sex ?? 'no_especificado');
  }, [addingNew, childProfile]);

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
    const payload = {
      nicknameMx: trimmed,
      birthDateIso: birthDate,
      ageMonths: computedMonths,
      sex,
    };
    const saved = addingNew
      ? await addChildProfile(payload)
      : await saveChildProfile(payload);
    setAddingNew(false);
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
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
          Perfil del bebé
        </Text>
        {childProfiles.length > 0 ? (
          <Pressable
            onPress={() => {
              setAddingNew((prev) => {
                const next = !prev;
                if (next) {
                  setNickname('');
                  setBirthDate(getTodayYmd());
                  setSex('no_especificado');
                  setFeedback('');
                }
                return next;
              });
            }}
            className="rounded-full border px-3 py-1.5 justify-center"
            style={{
              minHeight: 36,
              backgroundColor: palette.brandSurface,
              borderColor: palette.brandPrimary,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {addingNew ? 'Cancelar nuevo' : '+ Agregar bebé'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {childProfiles.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {childProfiles.map((p) => {
              const active = !addingNew && childProfile?.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setAddingNew(false);
                    void selectChildProfile(p.id);
                  }}
                  className="rounded-full border px-3 py-1.5 justify-center"
                  style={{
                    minHeight: 38,
                    backgroundColor: active ? palette.brandPrimary : palette.bgElevated,
                    borderColor: active ? palette.brandPrimary : palette.borderInteractive,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? palette.onBrandPrimary : palette.textPrimary }}
                  >
                    {p.nicknameMx} · {formatChildAgeMx(p.ageMonths)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

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
        <View className="flex-row flex-wrap justify-center gap-2">
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
