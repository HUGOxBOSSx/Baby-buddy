import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { ScrollView, Text, View } from 'react-native';
import { DailyLogPanel } from '../../components/DailyLogPanel';
import { MascotAvatar } from '../../components/MascotAvatar';
import { StageSelector } from '../../components/StageSelector';
import { useThemeContext } from '../../components/ThemeProvider';

export default function HoyScreen() {
  const {
    mode,
    palette,
    selectedStage,
    childProfile,
  } = useThemeContext();

  const isNight = mode === 'night_3am';

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bgPrimary }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
      >
        <View
          className="flex-row items-center gap-3"
          accessibilityHint={STAGE_OVERVIEWS[selectedStage].headlineMx}
        >
          <MascotAvatar variant="home" size="lg" />
          <View className="flex-1 gap-1">
            <Text
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: palette.brandText }}
            >
              {isNight
                ? 'Modo nocturno activo · Baja luminosidad'
                : 'Modo Calma activo · Orientación diaria'}
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{ color: palette.textPrimary }}
            >
              Registro diario
            </Text>
          </View>
        </View>

        <DailyLogPanel />

        {childProfile ? null : <StageSelector />}
      </ScrollView>
    </View>
  );
}
