import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  evaluateTriageHardGates,
} from '@baby-buddy/core';
import {
  ALL_CLINICAL_GUIDES,
  searchClinicalGuides,
  type GuideKind,
} from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GuideDisclaimerHeader } from '../../components/GuideDisclaimerHeader';
import { PoopColorChart } from '../../components/PoopColorChart';
import { StageSelector } from '../../components/StageSelector';
import { useThemeContext } from '../../components/ThemeProvider';
import { TriageBadge } from '../../components/TriageBadge';

type ViewTab =
  | 'all'
  | 'es_normal'
  | 'problema_solucion'
  | 'primeros_auxilios'
  | 'popo'
  | 'semaforo';

const TABS: readonly { readonly id: ViewTab; readonly label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'es_normal', label: '¿Es normal?' },
  { id: 'problema_solucion', label: 'Soluciones' },
  { id: 'primeros_auxilios', label: 'Auxilios' },
  { id: 'popo', label: 'Popó' },
  { id: 'semaforo', label: 'Semáforo' },
] as const;

export default function GuiasScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile, iconsLoaded } =
    useThemeContext();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ViewTab>('all');
  const [includeOtherAges, setIncludeOtherAges] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const [tempInput, setTempInput] = useState('');
  const [severeBreathing, setSevereBreathing] = useState(false);
  const [blueLips, setBlueLips] = useState(false);
  const [pauses10s, setPauses10s] = useState(false);
  const [noWet8h, setNoWet8h] = useState(false);

  const effectiveStage = childProfile
    ? includeOtherAges
      ? 'all'
      : childProfile.stageId
    : selectedStage;

  const kindFilter: GuideKind | 'all' =
    tab === 'es_normal' ||
    tab === 'problema_solucion' ||
    tab === 'primeros_auxilios'
      ? tab
      : 'all';

  const guides = searchClinicalGuides({
    query,
    stageId: effectiveStage,
    kind: kindFilter,
  });

  const parsedTemp = Number.parseFloat(tempInput);
  const triageRes = evaluateTriageHardGates({
    ageMonths: childProfile ? childProfile.ageMonths : 2,
    tempC:
      tempInput.trim().length > 0 && Number.isFinite(parsedTemp)
        ? parsedTemp
        : undefined,
    severeBreathingDistress: severeBreathing,
    blueLips,
    breathingPausesOver10s: pauses10s,
    noWetDiapers8h: noWet8h,
  });

  const topMetadata = ALL_CLINICAL_GUIDES[0]!.metadata;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
      contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
    >
      <View className="gap-1">
        <Text
          className="text-2xl font-bold"
          style={{ color: palette.textPrimary }}
        >
          Guías y Semáforo 3 AM
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          ¿Es normal?, soluciones rápidas, primeros auxilios y tabla de popó.
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Busca: hipo, fiebre, pujos, berrinche, anís..."
        placeholderTextColor={palette.textMuted}
        className="rounded-2xl border px-4 py-3 text-sm"
        style={{
          minHeight: MIN_TOUCH_TARGET_PX,
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
          color: palette.textPrimary,
        }}
      />

      <View className="flex-row flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              className="rounded-full border px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
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
                  color: active ? palette.onBrandPrimary : palette.textPrimary,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {childProfile ? (
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
            Etapa: {STAGE_SPECS[childProfile.stageId].label}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setIncludeOtherAges((v) => !v)}
              className="rounded-xl border px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                {includeOtherAges ? 'Solo su etapa' : 'Todas las edades'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/salud')}
              className="rounded-xl border px-3 py-2 justify-center"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.bgCard,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                Cambiar bebé
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <StageSelector />
      )}

      {tab === 'semaforo' ? (
        <View
          className="rounded-2xl border p-4 gap-3"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
            Semáforo rápido: ¿debo preocuparme?
          </Text>
          <TriageBadge level={triageRes.level} />

          <TextInput
            value={tempInput}
            onChangeText={setTempInput}
            keyboardType="decimal-pad"
            placeholder="Temperatura en °C (opcional, ej. 38.2)"
            placeholderTextColor={palette.textMuted}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
              color: palette.textPrimary,
            }}
          />

          <View className="flex-row flex-wrap gap-2">
            {[
              {
                label: 'Hunde costillas',
                active: severeBreathing,
                toggle: () => setSevereBreathing((v) => !v),
              },
              {
                label: 'Labios morados',
                active: blueLips,
                toggle: () => setBlueLips((v) => !v),
              },
              {
                label: 'Pausas >10 s',
                active: pauses10s,
                toggle: () => setPauses10s((v) => !v),
              },
              {
                label: '>8 h sin pipí',
                active: noWet8h,
                toggle: () => setNoWet8h((v) => !v),
              },
            ].map((flag) => (
              <Pressable
                key={flag.label}
                onPress={flag.toggle}
                className="rounded-full border px-3 py-2 justify-center"
                style={{
                  minHeight: MIN_TOUCH_TARGET_PX,
                  backgroundColor: flag.active
                    ? palette.alertRedSurface
                    : palette.bgElevated,
                  borderColor: flag.active
                    ? palette.alertRed
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: flag.active
                      ? palette.alertRedText
                      : palette.textPrimary,
                  }}
                >
                  {flag.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            className="rounded-xl border p-3 gap-1"
            style={{
              backgroundColor: palette.bgElevated,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
              {triageRes.nextStepMx}
            </Text>
            {triageRes.triggeredRulesMx.map((r) => (
              <Text key={r} className="text-xs" style={{ color: palette.textSecondary }}>
                • {r}
              </Text>
            ))}
          </View>

          {triageRes.call911Immediately ? (
            <Pressable
              onPress={() => {
                void Linking.openURL('tel:911');
              }}
              className="rounded-xl flex-row items-center justify-center gap-2 px-4 py-3"
              style={{
                minHeight: MIN_TOUCH_TARGET_PX,
                backgroundColor: palette.alertRed,
              }}
            >
              {iconsLoaded ? (
                <Feather name="phone-call" size={18} color={palette.onAlertRedButton} />
              ) : null}
              <Text className="text-sm font-bold" style={{ color: palette.onAlertRedButton }}>
                Llamar al 911 (Gratis)
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : tab === 'popo' ? (
        <PoopColorChart />
      ) : (
        <View className="gap-3">
          {guides.map((guide) => {
            const isExpanded = expandedSlug === guide.slug;
            return (
              <View
                key={guide.slug}
                className="rounded-2xl border p-4 gap-2"
                style={{
                  backgroundColor: palette.bgCard,
                  borderColor: palette.borderInteractive,
                }}
              >
                <TriageBadge level={guide.triageLevel} />
                <Text className="text-base font-bold" style={{ color: palette.textPrimary }}>
                  {guide.titleMx}
                </Text>
                <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
                  {guide.quickAnswerMx}
                </Text>
                <Text className="text-xs" style={{ color: palette.textSecondary }}>
                  {guide.summaryMx}
                </Text>

                <Pressable
                  onPress={() =>
                    setExpandedSlug(isExpanded ? null : guide.slug)
                  }
                  className="rounded-xl border px-3 py-2 self-start justify-center"
                  style={{
                    minHeight: MIN_TOUCH_TARGET_PX,
                    backgroundColor: palette.brandSurface,
                    borderColor: palette.brandPrimary,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                    {isExpanded ? 'Ocultar detalle ▴' : 'Ver Qué SÍ / Qué NO ▾'}
                  </Text>
                </Pressable>

                {isExpanded ? (
                  <View className="gap-2 pt-2 border-t" style={{ borderTopColor: palette.borderInteractive }}>
                    <Text className="text-xs font-bold uppercase" style={{ color: palette.textPrimary }}>
                      Qué SÍ hacer
                    </Text>
                    {guide.doStepsMx.map((s) => (
                      <Text key={s} className="text-xs" style={{ color: palette.textPrimary }}>
                        • {s}
                      </Text>
                    ))}
                    <View
                      className="rounded-xl border p-3 gap-1"
                      style={{
                        backgroundColor: palette.alertRedSurface,
                        borderColor: palette.alertRed,
                      }}
                    >
                      <Text className="text-xs font-bold uppercase" style={{ color: palette.alertRedText }}>
                        Qué NO hacer
                      </Text>
                      {guide.doNotDoMx.map((n) => (
                        <Text key={n} className="text-xs" style={{ color: palette.textPrimary }}>
                          • {n}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <GuideDisclaimerHeader metadata={topMetadata} />
    </ScrollView>
  );
}
