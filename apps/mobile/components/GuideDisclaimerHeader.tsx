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
    <View className="pt-2 gap-1" accessibilityRole="text">
      <Text className="text-[11px]" style={{ color: palette.textMuted }}>
        {disclaimer.bodyMx}{' '}
        <Text className="font-semibold" style={{ color: palette.textSecondary }}>
          {disclaimer.emergencyActionLabelMx}
        </Text>
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between py-1"
        style={{ minHeight: MIN_TOUCH_TARGET_PX }}
      >
        <Text className="text-[11px] font-semibold" style={{ color: palette.textMuted }}>
          Fuentes y revisión editorial ({metadata.version})
        </Text>
        <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
          {expanded ? 'Ocultar ▴' : 'Ver ▾'}
        </Text>
      </Pressable>

      {expanded ? (
        <View className="pt-1 gap-0.5">
          <Text className="text-[11px]" style={{ color: palette.textMuted }}>
            Versión: {metadata.version} · Corte editorial: {metadata.reviewed_at}
          </Text>
          <Text className="text-[11px]" style={{ color: palette.textMuted }}>
            Estado de revisión: {metadata.reviewed_by}
          </Text>
          <Text className="text-[11px] font-semibold pt-1" style={{ color: palette.textSecondary }}>
            Fuentes consultadas ({metadata.sources.length}):
          </Text>
          {metadata.sources.map((source) => (
            <Text
              key={`${source.organization}-${source.title}-${source.year}`}
              className="text-[11px]"
              style={{ color: palette.textMuted }}
            >
              • {source.title} — {source.organization} ({source.year})
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
