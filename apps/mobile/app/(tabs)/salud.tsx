import { ScrollView, Text, View } from 'react-native';
import { HealthJournalPanel } from '../../components/HealthJournalPanel';
import { MascotAvatar } from '../../components/MascotAvatar';
import { useThemeContext } from '../../components/ThemeProvider';

export default function SaludScreen() {
  const { palette } = useThemeContext();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.bgPrimary }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
    >
      <View className="flex-row items-center gap-3">
        <MascotAvatar variant="salud" size="md" />
        <View className="flex-1 min-w-0 gap-0.5">
          <Text
            className="text-xl font-bold"
            style={{ color: palette.textPrimary }}
          >
            Salud
          </Text>
          <Text className="text-xs" style={{ color: palette.textSecondary }}>
            Temperatura, medicamentos, vacunas, crecimiento, hitos y reporte
          </Text>
        </View>
      </View>

      <HealthJournalPanel />
    </ScrollView>
  );
}
