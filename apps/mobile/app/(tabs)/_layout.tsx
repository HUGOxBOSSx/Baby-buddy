import Feather from '@expo/vector-icons/Feather';
import { MIN_TOUCH_TARGET_PX } from '@baby-buddy/core';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../components/ThemeProvider';

function HeaderModeToggle() {
  const { mode, palette, toggleMode, iconsLoaded } = useThemeContext();
  const isNight = mode === 'night_3am';

  return (
    <Pressable
      onPress={toggleMode}
      className="min-h-[48px] min-w-[48px] mr-3 flex-row items-center justify-center rounded-xl border px-3 py-2 gap-1.5"
      style={{
        minHeight: MIN_TOUCH_TARGET_PX,
        minWidth: MIN_TOUCH_TARGET_PX,
        backgroundColor: isNight ? palette.bgElevated : palette.brandSurface,
        borderColor: palette.borderInteractive,
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: isNight }}
      accessibilityLabel={
        isNight
          ? 'Modo 3:00 AM activo. Toca para cambiar a Modo Calma de día'
          : 'Modo Calma activo. Toca para activar Modo 3:00 AM'
      }
    >
      {iconsLoaded ? (
        <Feather
          name={isNight ? 'sun' : 'moon'}
          size={16}
          color={palette.brandText}
        />
      ) : null}
      <Text className="text-xs font-bold" style={{ color: palette.brandText }}>
        {isNight ? 'Modo Calma' : 'Modo 3:00 AM'}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { palette, iconsLoaded } = useThemeContext();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.bgCard,
        },
        headerShadowVisible: false,
        headerTintColor: palette.textPrimary,
        headerTitleStyle: {
          color: palette.textPrimary,
          fontWeight: '700',
        },
        headerRight: () => <HeaderModeToggle />,
        tabBarActiveTintColor: palette.brandText,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.bgCard,
          borderTopColor: palette.borderInteractive,
          borderTopWidth: 1,
          minHeight: 64,
          height: 64 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
        },
        tabBarItemStyle: {
          minHeight: MIN_TOUCH_TARGET_PX,
          minWidth: MIN_TOUCH_TARGET_PX,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        sceneStyle: {
          backgroundColor: palette.bgPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarLabel: 'Hoy',
          tabBarAccessibilityLabel: 'Pestaña Hoy',
          tabBarIcon: ({ color, size }) =>
            iconsLoaded ? (
              <Feather name="home" size={size} color={color} />
            ) : (
              <View className="w-5 h-5 items-center justify-center">
                <Text style={{ color, fontWeight: '700' }}>•</Text>
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="guias"
        options={{
          title: 'Guías',
          tabBarLabel: 'Guías',
          tabBarAccessibilityLabel: 'Pestaña Guías clínicas',
          tabBarIcon: ({ color, size }) =>
            iconsLoaded ? (
              <Feather name="book-open" size={size} color={color} />
            ) : (
              <View className="w-5 h-5 items-center justify-center">
                <Text style={{ color, fontWeight: '700' }}>•</Text>
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="ropa-y-clima"
        options={{
          title: 'Ropa y Clima',
          tabBarLabel: 'Ropa y Clima',
          tabBarAccessibilityLabel: 'Pestaña Ropa y Clima',
          tabBarIcon: ({ color, size }) =>
            iconsLoaded ? (
              <Feather name="cloud" size={size} color={color} />
            ) : (
              <View className="w-5 h-5 items-center justify-center">
                <Text style={{ color, fontWeight: '700' }}>•</Text>
              </View>
            ),
        }}
      />
      <Tabs.Screen
        name="salud"
        options={{
          title: 'Salud',
          tabBarLabel: 'Salud',
          tabBarAccessibilityLabel: 'Pestaña Salud y emergencias 911',
          tabBarIcon: ({ color, size }) =>
            iconsLoaded ? (
              <Feather name="heart" size={size} color={color} />
            ) : (
              <View className="w-5 h-5 items-center justify-center">
                <Text style={{ color, fontWeight: '700' }}>•</Text>
              </View>
            ),
        }}
      />
    </Tabs>
  );
}
