import Feather from '@expo/vector-icons/Feather';
import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  evaluateTriageHardGates,
  type StageId,
  type TriageLevel,
} from '@baby-buddy/core';
import {
  ALL_CLINICAL_GUIDES,
  GUIDE_CATEGORIES_MX,
  searchClinicalGuides,
  type NormalityFilter,
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

type ViewTab = NormalityFilter | 'popo';

const TABS: readonly { readonly id: ViewTab; readonly label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'es_normal', label: 'Es normal' },
  { id: 'no_es_normal', label: 'No es normal' },
  { id: 'primeros_auxilios', label: 'Auxilios' },
  { id: 'popo', label: 'Tabla popó' },
] as const;

const COLOR_FILTERS: readonly {
  readonly id: TriageLevel | 'all';
  readonly label: string;
}[] = [
  { id: 'all', label: 'Todos' },
  { id: 'green_home', label: 'Verde' },
  { id: 'yellow_pediatrician', label: 'Amarillo' },
  { id: 'orange_urgent', label: 'Naranja' },
  { id: 'red_911', label: 'Rojo' },
] as const;

const TRIAGE_GROUP_ORDER: readonly TriageLevel[] = [
  'red_911',
  'orange_urgent',
  'yellow_pediatrician',
  'green_home',
];

export default function GuiasScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile, iconsLoaded } =
    useThemeContext();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ViewTab>('all');
  const [triageFilter, setTriageFilter] = useState<TriageLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<StageId | 'all'>('all');
  const [includeOtherAges, setIncludeOtherAges] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const [tempInput, setTempInput] = useState('');
  const [severeBreathing, setSevereBreathing] = useState(false);
  const [blueLips, setBlueLips] = useState(false);
  const [pauses10s, setPauses10s] = useState(false);
  const [noWet8h, setNoWet8h] = useState(false);

  const effectiveStage = childProfile
    ? includeOtherAges
      ? stageFilter
      : childProfile.stageId
    : selectedStage;

  const guides = searchClinicalGuides({
    query,
    stageId: effectiveStage,
    normality: tab === 'popo' ? 'all' : tab,
    triageLevel: triageFilter,
    categoryMx: categoryFilter,
  });

  const groupedGuides = TRIAGE_GROUP_ORDER.map((level) => ({
    level,
    items: guides.filter((g) => g.triageLevel === level),
  })).filter((group) => group.items.length > 0);

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
          ¿Es normal?
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Orientación por síntomas, etapa, primeros auxilios y tabla de popó.
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

      {tab !== 'popo' ? (
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-1.5">
            {COLOR_FILTERS.map((c) => {
              const active = triageFilter === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setTriageFilter(c.id)}
                  className="rounded-full border px-3 py-1.5 justify-center"
                  style={{
                    minHeight: 38,
                    backgroundColor: active
                      ? palette.brandPrimary
                      : palette.bgCard,
                    borderColor: active
                      ? palette.brandPrimary
                      : palette.borderInteractive,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: active
                        ? palette.onBrandPrimary
                        : palette.textPrimary,
                    }}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1.5">
              {(['all', ...GUIDE_CATEGORIES_MX] as const).map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategoryFilter(cat)}
                    className="rounded-full border px-3 py-1.5 justify-center"
                    style={{
                      minHeight: 36,
                      backgroundColor: active
                        ? palette.brandSurface
                        : palette.bgCard,
                      borderColor: active
                        ? palette.brandPrimary
                        : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: active ? palette.brandText : palette.textSecondary,
                      }}
                    >
                      {cat === 'all' ? 'Todos los temas' : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {childProfile ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
              {includeOtherAges
                ? 'Mostrando todas las edades'
                : `Etapa: ${STAGE_SPECS[childProfile.stageId].label}`}
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
        {includeOtherAges ? <StageSelector /> : null}
        </View>
      ) : (
        <StageSelector />
      )}

      {tab === 'no_es_normal' ? (
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
      ) : null}

      {tab === 'popo' ? (
        <PoopColorChart />
      ) : (
        <View className="gap-4">
          {groupedGuides.map((group) => (
            <View key={group.level} className="gap-3">
              <View
                className="flex-row items-center justify-between border-b pb-2"
                style={{ borderBottomColor: palette.borderInteractive }}
              >
                <TriageBadge level={group.level} />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: palette.textSecondary }}
                >
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'guía' : 'guías'}
                </Text>
              </View>
              {group.items.map((guide) => {
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
                    <View className="flex-row items-center justify-between gap-2 flex-wrap">
                      <Text
                        className="text-base font-bold flex-1"
                        style={{ color: palette.textPrimary }}
                      >
                        {guide.titleMx}
                      </Text>
                      <Text
                        className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          color: palette.brandText,
                          backgroundColor: palette.bgElevated,
                          borderColor: palette.borderInteractive,
                        }}
                      >
                        {guide.categoryMx}
                      </Text>
                    </View>
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
                      className="rounded-xl border px-3 py-2 self-start flex-row items-center gap-2"
                      style={{
                        minHeight: MIN_TOUCH_TARGET_PX,
                        backgroundColor: palette.brandSurface,
                        borderColor: palette.brandPrimary,
                      }}
                    >
                      <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                        {isExpanded
                          ? 'Ocultar detalle ▴'
                          : 'Qué SÍ hacer y qué NO hacer'}
                      </Text>
                      {!isExpanded ? (
                        <Text
                          className="text-lg font-bold"
                          style={{ color: palette.brandText }}
                        >
                          →
                        </Text>
                      ) : null}
                    </Pressable>

                    {isExpanded ? (
                      <View className="gap-2 pt-2 border-t" style={{ borderTopColor: palette.borderInteractive }}>
                        <View
                          className="rounded-xl border p-3 gap-1"
                          style={{
                            backgroundColor: palette.brandSurface,
                            borderColor: palette.brandPrimary,
                          }}
                        >
                          <Text className="text-xs font-bold uppercase" style={{ color: palette.brandText }}>
                            Qué SÍ hacer
                          </Text>
                          {guide.doStepsMx.map((s) => (
                            <Text key={s} className="text-xs" style={{ color: palette.textPrimary }}>
                              • {s}
                            </Text>
                          ))}
                        </View>
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
          ))}
        </View>
      )}

      <GuideDisclaimerHeader metadata={topMetadata} />
    </ScrollView>
  );
}
