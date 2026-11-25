import { DISCLAIMERS_MX } from '@baby-buddy/core';
import type { ClinicalMetadata } from '@baby-buddy/content';
import { Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export interface GuideDisclaimerHeaderProps {
  readonly metadata: ClinicalMetadata;
}

export function GuideDisclaimerHeader({
  metadata,
}: GuideDisclaimerHeaderProps) {
  const { palette } = useThemeContext();
  const disclaimer = DISCLAIMERS_MX.guide_header;

  return (
    <View
      className="rounded-2xl border p-4 gap-3"
      style={{
        backgroundColor: palette.brandSurface,
        borderColor: palette.brandPrimary,
      }}
      accessibilityRole="text"
    >
      <View className="gap-1">
        <Text
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: palette.brandText }}
        >
          Orientación educativa · Nivel 2
        </Text>
        <Text
          className="text-base font-bold"
          style={{ color: palette.textPrimary }}
        >
          {disclaimer.titleMx}
        </Text>
        <Text className="text-sm" style={{ color: palette.textSecondary }}>
          {disclaimer.bodyMx}
        </Text>
        <Text
          className="text-sm font-semibold"
          style={{ color: palette.alertRedText }}
        >
          {disclaimer.emergencyActionLabelMx}
        </Text>
      </View>

      <View
        className="rounded-xl border p-3 gap-1"
        style={{
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text
          className="text-xs font-bold"
          style={{ color: palette.textPrimary }}
        >
          Metadatos clínicos visibles
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Versión: {metadata.version} · Revisado: {metadata.reviewed_at}
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Revisión: {metadata.reviewed_by}
        </Text>
        <View className="pt-1 gap-1">
          <Text
            className="text-xs font-semibold"
            style={{ color: palette.brandText }}
          >
            Fuentes consultadas ({metadata.sources.length}):
          </Text>
          {metadata.sources.map((source) => (
            <Text
              key={`${source.organization}-${source.title}-${source.year}`}
              className="text-xs"
              style={{ color: palette.textSecondary }}
            >
              • {source.title} — {source.organization} ({source.year})
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
