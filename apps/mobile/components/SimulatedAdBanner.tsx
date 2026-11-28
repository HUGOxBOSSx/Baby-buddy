import { isAdBannerAllowed } from '@baby-buddy/core';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const SAMPLE_ADS = [
  {
    sponsor: 'Patrocinador · Ejemplo',
    text: 'Pañales ecológicos hipoalergénicos · Envío en México',
  },
  {
    sponsor: 'Patrocinador · Ejemplo',
    text: 'Saco de dormir de algodón 1.0 TOG · 0–24 meses',
  },
] as const;

export function SimulatedAdBanner({
  inlinePreview = false,
  floatingBottomOffset,
}: {
  readonly inlinePreview?: boolean;
  readonly floatingBottomOffset?: number;
}) {
  const { palette, adPreview, setAdPreview } = useThemeContext();
  const [sampleIndex, setSampleIndex] = useState(0);

  if (!adPreview.enabled) {
    if (!inlinePreview) return null;
    return (
      <View
        className="rounded-xl border px-3 py-2.5 items-center justify-center"
        style={{
          backgroundColor: palette.bgElevated,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-xs text-center" style={{ color: palette.textSecondary }}>
          Simulación desactivada. Actívala arriba para ver el banner encima de la barra inferior.
        </Text>
      </View>
    );
  }

  const localHour =
    adPreview.hourMode === 'day_14'
      ? 14
      : adPreview.hourMode === 'night_23'
        ? 23
        : new Date().getHours();

  const allowed = isAdBannerAllowed({
    plan: adPreview.plan,
    surface: 'daily_log',
    localHour,
  });

  if (!allowed) {
    if (!inlinePreview) return null;
    const reason =
      adPreview.plan === 'pro'
        ? 'Oculto automáticamente en Plan Pro.'
        : 'Oculto automáticamente por horario nocturno fijo (22:00–06:00 h).';
    return (
      <View
        className="rounded-xl border px-3 py-2.5 items-center justify-center"
        style={{
          backgroundColor: palette.brandSurface,
          borderColor: palette.brandPrimary,
        }}
      >
        <Text className="text-xs font-semibold text-center" style={{ color: palette.brandText }}>
          {reason}
        </Text>
      </View>
    );
  }

  const ad = SAMPLE_ADS[sampleIndex % SAMPLE_ADS.length] ?? SAMPLE_ADS[0];

  const card = (
    <View
      className="rounded-xl border px-3 py-1.5 flex-row items-center justify-between gap-2"
      style={{
        backgroundColor: palette.bgElevated,
        borderColor: palette.borderInteractive,
      }}
    >
      <View className="flex-1 min-w-0">
        <Text
          numberOfLines={1}
          className="text-[10px] font-bold uppercase"
          style={{ color: palette.brandText }}
        >
          {ad.sponsor} · Simulación
        </Text>
        <Text
          numberOfLines={1}
          className="text-xs font-medium"
          style={{ color: palette.textPrimary }}
        >
          {ad.text}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={() => setSampleIndex((i) => (i + 1) % SAMPLE_ADS.length)}
          hitSlop={6}
          className="rounded-lg border px-2 py-1"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
            Otro
          </Text>
        </Pressable>
        {!inlinePreview ? (
          <Pressable
            onPress={() => setAdPreview({ ...adPreview, enabled: false })}
            hitSlop={6}
            className="rounded-lg border px-2 py-1"
            style={{
              backgroundColor: palette.bgCard,
              borderColor: palette.borderInteractive,
            }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: palette.textSecondary }}>
              Ocultar
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (floatingBottomOffset !== undefined) {
    return (
      <View
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: floatingBottomOffset + 4,
          zIndex: 30,
        }}
      >
        {card}
      </View>
    );
  }

  return card;
}
