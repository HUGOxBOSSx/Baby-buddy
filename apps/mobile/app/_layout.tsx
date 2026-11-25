import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingGate } from '../components/OnboardingGate';
import { ThemeProvider, useThemeContext } from '../components/ThemeProvider';

function RootNavigatorContent() {
  const { mode, palette, onboardingAccepted, statusAnnouncement } =
    useThemeContext();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bgPrimary }}>
      <StatusBar style={mode === 'night_3am' ? 'light' : 'dark'} />

      <View
        style={styles.srOnly}
        accessibilityLiveRegion="polite"
        aria-live="polite"
        pointerEvents="none"
      >
        <Text>{statusAnnouncement}</Text>
      </View>

      <View
        style={{
          flex: 1,
          ...(Platform.OS === 'web' && !onboardingAccepted
            ? { display: 'none' }
            : null),
        }}
        pointerEvents={onboardingAccepted ? 'auto' : 'none'}
        aria-hidden={!onboardingAccepted}
        importantForAccessibility={
          onboardingAccepted ? 'auto' : 'no-hide-descendants'
        }
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bgPrimary },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>

      {!onboardingAccepted ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { zIndex: 50, elevation: 50, backgroundColor: palette.bgPrimary },
          ]}
        >
          <OnboardingGate />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigatorContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
