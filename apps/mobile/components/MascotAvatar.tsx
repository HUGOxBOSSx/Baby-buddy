import { Image, View, type ImageSourcePropType } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export type MascotVariant = 'home' | 'clima' | 'salud' | 'es_normal';

const MASCOT_SOURCES: Record<MascotVariant, ImageSourcePropType> = {
  home: require('../assets/mascot/mascot-home.png') as ImageSourcePropType,
  clima: require('../assets/mascot/mascot-clima.jpg') as ImageSourcePropType,
  salud: require('../assets/mascot/mascot-salud.jpg') as ImageSourcePropType,
  es_normal: require('../assets/mascot/mascot-es-normal.jpg') as ImageSourcePropType,
};

const SIZE_PX = {
  sm: 36,
  md: 64,
  lg: 80,
} as const;

export interface MascotAvatarProps {
  readonly variant: MascotVariant;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function MascotAvatar({ variant, size = 'md' }: MascotAvatarProps) {
  const { palette } = useThemeContext();
  const dim = SIZE_PX[size];

  return (
    <View
      className="overflow-hidden rounded-2xl border p-0.5 items-center justify-center"
      style={{
        width: dim,
        height: dim,
        backgroundColor: palette.bgElevated,
        borderColor: palette.borderInteractive,
      }}
    >
      <Image
        source={MASCOT_SOURCES[variant]}
        style={{ width: dim - 4, height: dim - 4 }}
        resizeMode="contain"
      />
    </View>
  );
}
