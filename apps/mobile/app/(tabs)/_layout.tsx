import Feather from '@expo/vector-icons/Feather';
import {
  CHILD_SEX_LABELS_MX,
  MIN_TOUCH_TARGET_PX,
  formatChildAgeMx,
} from '@baby-buddy/core';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MascotAvatar } from '../../components/MascotAvatar';
import { useThemeContext } from '../../components/ThemeProvider';

function HeaderModeToggle() {
  const { mode, palette, toggleMode, iconsLoaded } = useThemeContext();
  const isNight = mode === 'night_3am';

  return (
    <Pressable
      onPress={toggleMode}
      className="min-h-[48px] min-w-[48px] flex-row items-center justify-center rounded-xl border px-2.5 py-1.5 gap-1.5"
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
          ? 'Modo nocturno activo. Toca para cambiar a Modo Calma de día'
          : 'Modo Calma activo. Toca para activar Modo nocturno'
      }
    >
      {iconsLoaded ? (
        <Feather
          name={isNight ? 'sun' : 'moon'}
          size={16}
          color={palette.brandText}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className="text-xs font-bold"
        style={{ color: palette.brandText }}
      >
        {isNight ? 'Día' : 'Nocturno'}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { palette, iconsLoaded, childProfile } = useThemeContext();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 6);
  const babyHeader = childProfile
    ? `${childProfile.nicknameMx} · ${formatChildAgeMx(childProfile.ageMonths)} · ${CHILD_SEX_LABELS_MX[childProfile.sex ?? 'no_especificado']}`
    : null;

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
          fontSize: 15,
        },
        header: () => (
          <View
            style={{
              paddingTop: insets.top + 6,
              paddingBottom: 8,
              paddingHorizontal: 12,
              backgroundColor: palette.bgCard,
              borderBottomWidth: 1,
              borderBottomColor: palette.borderInteractive,
              gap: 6,
            }}
          >
            <View className="flex-row items-center justify-between gap-2.5">
              <MascotAvatar variant="home" size="sm" />
              <Text
                numberOfLines={1}
                className="flex-1 min-w-0 text-sm font-bold"
                style={{ color: palette.textPrimary }}
              >
                {babyHeader ?? 'Baby Buddy MX'}
              </Text>
              <HeaderModeToggle />
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/salud')}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              className="w-full flex-row items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5"
              style={{
                backgroundColor: palette.bgElevated,
                borderColor: palette.borderInteractive,
              }}
              accessibilityRole="button"
              accessibilityLabel={
                childProfile
                  ? 'Cambiar datos del bebé'
                  : 'Configurar datos del bebé'
              }
            >
              {iconsLoaded ? (
                <Feather name="edit-2" size={12} color={palette.brandText} />
              ) : null}
              <Text
                numberOfLines={1}
                className="text-[11px] font-bold"
                style={{ color: palette.brandText }}
              >
                {childProfile
                  ? 'Cambiar datos del bebé'
                  : 'Configurar datos del bebé'}
              </Text>
            </Pressable>
          </View>
        ),
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
          fontSize: 11,
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
          title: 'Registro diario',
          tabBarLabel: 'Registro',
          tabBarAccessibilityLabel: 'Pestaña Registro diario',
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
      <Tabs.Screen
        name="guias"
        options={{
          title: '¿Es normal?',
          tabBarLabel: '¿Es normal?',
          tabBarAccessibilityLabel: 'Pestaña ¿Es normal?',
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
    </Tabs>
  );
}
