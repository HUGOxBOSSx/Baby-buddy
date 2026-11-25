import { DISCLAIMERS_MX, MIN_TOUCH_TARGET_PX } from '@baby-buddy/core';
import type { ClinicalMetadata } from '@baby-buddy/content';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export interface GuideDisclaimerHeaderProps {
  readonly metadata: ClinicalMetadata;
}

export function GuideDisclaimerHeader({
  metadata,
}: GuideDisclaimerHeaderProps) {
  const { palette } = useThemeContext();
  const disclaimer = DISCLAIMERS_MX.guide_header;
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      className="rounded-2xl border p-3 gap-2"
      style={{
        backgroundColor: palette.brandSurface,
        borderColor: palette.brandPrimary,
      }}
      accessibilityRole="text"
    >
      <Text className="text-xs font-semibold" style={{ color: palette.textSecondary }}>
        {disclaimer.bodyMx}{' '}
        <Text className="font-bold" style={{ color: palette.alertRedText }}>
          {disclaimer.emergencyActionLabelMx}
        </Text>
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="rounded-xl border px-3 py-2 flex-row items-center justify-between"
        style={{
          minHeight: MIN_TOUCH_TARGET_PX,
          backgroundColor: palette.bgCard,
          borderColor: palette.borderInteractive,
        }}
      >
        <Text className="text-xs font-bold" style={{ color: palette.textMuted }}>
          Fuentes y revisión editorial ({metadata.version})
        </Text>
        <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
          {expanded ? 'Ocultar ▴' : 'Ver ▾'}
        </Text>
      </Pressable>

      {expanded ? (
        <View
          className="rounded-xl border p-3 gap-1"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Versión: {metadata.version} · Corte editorial: {metadata.reviewed_at}
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Estado de revisión: {metadata.reviewed_by}
          </Text>
          <Text className="text-xs font-semibold pt-1" style={{ color: palette.brandText }}>
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
      ) : null}
    </View>
  );
}
