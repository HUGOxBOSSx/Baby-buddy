import { POOP_COLOR_CHART } from '@baby-buddy/content';
import { Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';
import { TriageBadge } from './TriageBadge';

export function PoopColorChart() {
  const { palette } = useThemeContext();

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-lg font-bold" style={{ color: palette.textPrimary }}>
          Tabla visual de colores de popó
        </Text>
        <Text className="text-xs" style={{ color: palette.textSecondary }}>
          Guía rápida para distinguir colores esperados de señales de alerta.
        </Text>
      </View>

      {POOP_COLOR_CHART.map((item) => (
        <View
          key={item.id}
          className="rounded-2xl border p-4 gap-2"
          style={{
            backgroundColor: palette.bgCard,
            borderColor: palette.borderInteractive,
          }}
        >
          <Text className="text-sm font-bold" style={{ color: palette.textPrimary }}>
            {item.colorNameMx}
          </Text>
          <TriageBadge level={item.triageLevel} />
          <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
            Edad típica: {item.typicalAgeMx}
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            {item.meaningMx}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
            Qué hacer: {item.actionMx}
          </Text>
        </View>
      ))}
    </View>
  );
}
