import {
  MIN_TOUCH_TARGET_PX,
  STAGE_SPECS,
  type TriageLevel,
} from '@baby-buddy/core';
import {
  ALL_CLINICAL_GUIDES,
  GUIDE_CATEGORIES_MX,
  getClinicalGuideBySlug,
  getRelatedGuideLinks,
  searchClinicalGuides,
} from '@baby-buddy/content';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GuideDisclaimerHeader } from '../../components/GuideDisclaimerHeader';
import { MascotAvatar } from '../../components/MascotAvatar';
import { PoopColorChart } from '../../components/PoopColorChart';
import { StageSelector } from '../../components/StageSelector';
import { useThemeContext } from '../../components/ThemeProvider';
import { TriageBadge } from '../../components/TriageBadge';
import { TriageDisclaimerBanner } from '../../components/TriageDisclaimerBanner';

type ViewTab = 'es_normal' | 'no_es_normal' | 'urgencia' | 'popo';
type SubFilter = TriageLevel;

const TABS: readonly { readonly id: ViewTab; readonly label: string }[] = [
  { id: 'es_normal', label: 'Es normal' },
  { id: 'no_es_normal', label: 'No es normal' },
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'popo', label: 'Popó' },
] as const;

const SUB_FILTERS: readonly {
  readonly id: SubFilter;
  readonly label: string;
}[] = [
  { id: 'green_home', label: 'Verde' },
  { id: 'yellow_pediatrician', label: 'Amarillo' },
  { id: 'orange_urgent', label: 'Consulta hoy' },
  { id: 'red_911', label: 'Urgencia 911' },
] as const;

const TRIAGE_GROUP_ORDER: readonly TriageLevel[] = [
  'red_911',
  'orange_urgent',
  'yellow_pediatrician',
  'green_home',
];

export default function GuiasScreen() {
  const router = useRouter();
  const { palette, selectedStage, childProfile, childProfiles, selectChildProfile } =
    useThemeContext();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ViewTab>('es_normal');
  const [subFilter, setSubFilter] = useState<SubFilter>('green_home');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [includeOtherAges, setIncludeOtherAges] = useState(false);
  const [babyPickerOpen, setBabyPickerOpen] = useState(false);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const openGuide = (slug: string) => {
    setFocusedSlug(slug);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const focusedGuide = focusedSlug
    ? getClinicalGuideBySlug(focusedSlug)
    : undefined;

  const effectiveStage = childProfile
    ? includeOtherAges
      ? selectedStage
      : childProfile.stageId
    : selectedStage;

  const normalityParam = tab === 'popo' ? 'all' : tab;

  const level1Pool = searchClinicalGuides({
    stageId: effectiveStage,
    normality: normalityParam,
  });

  const availableSubFilters = SUB_FILTERS.filter((opt) =>
    level1Pool.some((g) => g.triageLevel === opt.id),
  );

  const effectiveSubFilter: SubFilter = availableSubFilters.some(
    (opt) => opt.id === subFilter,
  )
    ? subFilter
    : (availableSubFilters[0]?.id ?? 'green_home');

  const level2Pool = searchClinicalGuides({
    stageId: effectiveStage,
    normality: normalityParam,
    triageLevel: effectiveSubFilter,
  });

  const availableCategories = GUIDE_CATEGORIES_MX.filter((cat) =>
    level2Pool.some((g) => g.categoryMx === cat),
  );

  const effectiveCategory: string =
    categoryFilter === 'all' || availableCategories.includes(categoryFilter)
      ? categoryFilter
      : 'all';

  const guides = searchClinicalGuides({
    query,
    stageId: effectiveStage,
    normality: normalityParam,
    triageLevel: effectiveSubFilter,
    categoryMx: effectiveCategory,
  });

  const groupedGuides = TRIAGE_GROUP_ORDER.map((level) => ({
    level,
    items: guides.filter((g) => g.triageLevel === level),
  })).filter((group) => group.items.length > 0);

  const topMetadata = ALL_CLINICAL_GUIDES[0]!.metadata;

  if (focusedGuide) {
    const relatedLinks = getRelatedGuideLinks(focusedGuide.slug);
    return (
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        style={{ backgroundColor: palette.bgPrimary }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
      >
        <Pressable
          onPress={() => {
            setFocusedSlug(null);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }}
          className="rounded-xl border px-4 py-2 self-start justify-center"
          style={{
            minHeight: MIN_TOUCH_TARGET_PX,
            backgroundColor: palette.bgElevated,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            ← Volver a ¿Es normal?
          </Text>
        </Pressable>

        <View
          className="rounded-2xl border p-4 gap-3"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <View className="flex-row items-center justify-between gap-2 flex-wrap">
            <TriageBadge level={focusedGuide.triageLevel} />
            <Text
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                color: palette.brandText,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              {focusedGuide.categoryMx}
            </Text>
          </View>

          <Text className="text-xl font-bold" style={{ color: palette.textPrimary }}>
            {focusedGuide.titleMx}
          </Text>
          <Text className="text-sm font-semibold" style={{ color: palette.brandText }}>
            {focusedGuide.quickAnswerMx}
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            {focusedGuide.summaryMx}
          </Text>

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
            {focusedGuide.doStepsMx.map((s) => (
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
            {focusedGuide.doNotDoMx.map((n) => (
              <Text key={n} className="text-xs" style={{ color: palette.textPrimary }}>
                • {n}
              </Text>
            ))}
          </View>

          <View
            className="rounded-xl border p-3 gap-1"
            style={{
              backgroundColor: palette.accentWarmSurface,
              borderColor: palette.accentWarm,
            }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: palette.accentWarmText }}>
              Cuándo llamar al pediatra o acudir a urgencias
            </Text>
            {focusedGuide.redFlagsMx.map((flag) => (
              <Text key={flag} className="text-xs" style={{ color: palette.textPrimary }}>
                • {flag}
              </Text>
            ))}
          </View>

          {relatedLinks.length > 0 ? (
            <View className="gap-2 pt-1">
              <Text className="text-xs font-bold uppercase" style={{ color: palette.textSecondary }}>
                Guías relacionadas
              </Text>
              {relatedLinks.map((rel) => {
                const bg =
                  rel.tone === 'normal_green'
                    ? palette.brandSurface
                    : rel.tone === 'not_normal_yellow'
                      ? palette.accentWarmSurface
                      : palette.alertRedSurface;
                const border =
                  rel.tone === 'normal_green'
                    ? palette.brandPrimary
                    : rel.tone === 'not_normal_yellow'
                      ? palette.accentWarm
                      : palette.alertRed;
                const text =
                  rel.tone === 'normal_green'
                    ? palette.brandText
                    : rel.tone === 'not_normal_yellow'
                      ? palette.accentWarmText
                      : palette.alertRedText;
                return (
                  <Pressable
                    key={rel.slug}
                    onPress={() => openGuide(rel.slug)}
                    className="rounded-xl border px-3 py-2 flex-row items-center justify-between gap-2"
                    style={{
                      minHeight: MIN_TOUCH_TARGET_PX,
                      backgroundColor: bg,
                      borderColor: border,
                    }}
                  >
                    <Text className="text-xs font-bold flex-1" style={{ color: text }}>
                      {rel.prefixMx} {rel.titleMx}
                    </Text>
                    <Text className="text-base font-bold" style={{ color: text }}>
                      →
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <GuideDisclaimerHeader metadata={focusedGuide.metadata} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
      contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <MascotAvatar variant="es_normal" size="md" />
          <View className="flex-1 min-w-0 gap-0.5">
            <Text
              className="text-xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              ¿Es normal?
            </Text>
            <Text className="text-xs" style={{ color: palette.textSecondary }}>
              Guías por etapa, síntomas y emergencias 911
            </Text>
          </View>
        </View>
        {childProfiles.length > 1 ? (
          <Pressable
            onPress={() => setBabyPickerOpen((v) => !v)}
            hitSlop={8}
            className="rounded-full border px-3 py-1.5 flex-row items-center gap-1"
            style={{
              height: 36,
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {childProfile ? childProfile.nicknameMx : 'Bebés'} {babyPickerOpen ? '▲' : '▼'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(tabs)/configuracion')}
            hitSlop={8}
            className="rounded-full border px-3 py-1.5 justify-center"
            style={{
              height: 36,
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
              {childProfile ? 'Cambiar bebé' : 'Configurar bebé'}
            </Text>
          </Pressable>
        )}
      </View>

      {babyPickerOpen && childProfiles.length > 1 ? (
        <View
          className="rounded-2xl border p-3 flex-row flex-wrap items-center justify-center gap-2"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          {childProfiles.map((p) => {
            const active = childProfile?.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  void selectChildProfile(p.id);
                  setBabyPickerOpen(false);
                }}
                className="rounded-full border px-3 py-1.5"
                style={{
                  backgroundColor: active ? palette.brandPrimary : palette.bgElevated,
                  borderColor: active ? palette.brandPrimary : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? palette.onBrandPrimary : palette.textPrimary }}
                >
                  {p.nicknameMx} ({STAGE_SPECS[p.stageId].shortLabel})
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => router.push('/(tabs)/configuracion')}>
            <Text className="text-xs font-bold underline" style={{ color: palette.brandText }}>
              Administrar
            </Text>
          </Pressable>
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
            <Pressable
              onPress={() => setIncludeOtherAges((v) => !v)}
              hitSlop={8}
              className="rounded-lg border px-2.5 py-1 justify-center"
              style={{
                height: 32,
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
            >
              <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
                {includeOtherAges ? 'Solo su etapa' : 'Todas las edades'}
              </Text>
            </Pressable>
          </View>
          {includeOtherAges ? <StageSelector compact /> : null}
        </View>
      ) : (
        <StageSelector compact />
      )}

      <View
        className="rounded-2xl border p-3 gap-2.5"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <View className="gap-1.5">
          <Text
            className="text-[11px] font-bold uppercase"
            style={{ color: palette.textSecondary }}
          >
            1. Tipo
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {TABS.map((t) => {
                const active = tab === t.id;
                const isUrgencia = t.id === 'urgencia';
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTab(t.id)}
                    hitSlop={6}
                    className="rounded-full border px-3 py-1 justify-center"
                    style={{
                      minHeight: 34,
                      backgroundColor: isUrgencia
                        ? palette.alertRedSurface
                        : active
                          ? palette.brandPrimary
                          : palette.bgCard,
                      borderColor: isUrgencia
                        ? palette.alertRed
                        : active
                          ? palette.brandPrimary
                          : palette.borderInteractive,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: isUrgencia
                          ? palette.alertRedText
                          : active
                            ? palette.onBrandPrimary
                            : palette.textPrimary,
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {tab !== 'popo' && availableSubFilters.length > 1 ? (
          <View
            className="border-t pt-2.5 gap-1.5"
            style={{ borderTopColor: palette.borderInteractive }}
          >
            <Text
              className="text-[11px] font-bold uppercase"
              style={{ color: palette.textSecondary }}
            >
              2. Nivel de atención
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                {availableSubFilters.map((c) => {
                  const active = effectiveSubFilter === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setSubFilter(c.id)}
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
            </ScrollView>
          </View>
        ) : null}

        {tab !== 'popo' && availableCategories.length > 0 ? (
          <View
            className="border-t pt-2.5 gap-1.5"
            style={{ borderTopColor: palette.borderInteractive }}
          >
            <Text
              className="text-[11px] font-bold uppercase"
              style={{ color: palette.textSecondary }}
            >
              3. Tema
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                <Pressable
                  onPress={() => setCategoryFilter('all')}
                  className="rounded-full border px-3 py-1.5 justify-center"
                  style={{
                    minHeight: 36,
                    backgroundColor:
                      effectiveCategory === 'all'
                        ? palette.brandSurface
                        : palette.bgCard,
                    borderColor:
                      effectiveCategory === 'all'
                        ? palette.brandPrimary
                        : palette.borderInteractive,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        effectiveCategory === 'all'
                          ? palette.brandText
                          : palette.textSecondary,
                    }}
                  >
                    Todos
                  </Text>
                </Pressable>
                {availableCategories.map((cat) => {
                  const active = effectiveCategory === cat;
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
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar: fiebre, hipo, popó, berrinche..."
        placeholderTextColor={palette.textMuted}
        className="rounded-2xl border px-4 py-3 text-sm"
        style={{
          minHeight: MIN_TOUCH_TARGET_PX,
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
          color: palette.textPrimary,
        }}
      />


      {tab === 'urgencia' ? (
        <View
          className="rounded-2xl border p-4 gap-2"
          style={{
            backgroundColor: palette.alertRedSurface,
            borderColor: palette.alertRed,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: palette.alertRedText }}>
            Rojo: 911 / atención inmediata · Naranja: atención o consulta hoy
          </Text>
          <Pressable
            onPress={() => {
              void Linking.openURL('tel:911');
            }}
            className="rounded-xl items-center justify-center px-4 py-3"
            style={{
              minHeight: MIN_TOUCH_TARGET_PX,
              backgroundColor: palette.alertRed,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: palette.onAlertRedButton }}>
              Llamar al 911 (Gratis)
            </Text>
          </Pressable>
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
              {group.items.map((guide) => (
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
                    <Text numberOfLines={2} className="text-xs" style={{ color: palette.textSecondary }}>
                      {guide.summaryMx}
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        onPress={() => openGuide(guide.slug)}
                        className="rounded-xl border px-3 py-2 self-start flex-row items-center gap-2"
                        style={{
                          minHeight: MIN_TOUCH_TARGET_PX,
                          backgroundColor: palette.brandSurface,
                          borderColor: palette.brandPrimary,
                        }}
                      >
                        <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
                          Qué SÍ hacer y qué NO hacer
                        </Text>
                        <Text
                          className="text-lg font-bold"
                          style={{ color: palette.brandText }}
                        >
                          →
                        </Text>
                      </Pressable>

                      {getRelatedGuideLinks(guide.slug, effectiveStage).map((rel) => {
                        const bg =
                          rel.tone === 'normal_green'
                            ? palette.brandSurface
                            : rel.tone === 'not_normal_yellow'
                              ? palette.accentWarmSurface
                              : palette.alertRedSurface;
                        const border =
                          rel.tone === 'normal_green'
                            ? palette.brandPrimary
                            : rel.tone === 'not_normal_yellow'
                              ? palette.accentWarm
                              : palette.alertRed;
                        const text =
                          rel.tone === 'normal_green'
                            ? palette.brandText
                            : rel.tone === 'not_normal_yellow'
                              ? palette.accentWarmText
                              : palette.alertRedText;
                        return (
                          <Pressable
                            key={rel.slug}
                            onPress={() => openGuide(rel.slug)}
                            className="w-full rounded-xl border px-3 py-2 flex-row items-center justify-between gap-2"
                            style={{
                              minHeight: MIN_TOUCH_TARGET_PX,
                              backgroundColor: bg,
                              borderColor: border,
                            }}
                          >
                            <Text className="text-xs font-bold flex-1" style={{ color: text }}>
                              {rel.prefixMx} {rel.titleMx}
                            </Text>
                            <Text className="text-base font-bold" style={{ color: text }}>
                              →
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <GuideDisclaimerHeader metadata={topMetadata} />
      <TriageDisclaimerBanner />
    </ScrollView>
  );
}
