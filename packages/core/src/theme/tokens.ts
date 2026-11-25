export type ThemeMode = 'day' | 'night_3am';

export const MIN_TOUCH_TARGET_PX = 48;
export const MAX_NIGHT_FLOW_TAPS = 3;

export interface ThemePalette {
  readonly mode: ThemeMode;
  readonly bgPrimary: string;
  readonly bgCard: string;
  readonly bgElevated: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly brandPrimary: string;
  readonly brandText: string;
  readonly brandSurface: string;
  readonly onBrandPrimary: string;
  readonly accentWarm: string;
  readonly accentWarmText: string;
  readonly accentWarmSurface: string;
  readonly onAccentWarm: string;
  readonly accentSecondary: string;
  readonly alertRed: string;
  readonly alertRedText: string;
  readonly alertRedSurface: string;
  readonly onAlertRedText: string;
  readonly borderInteractive: string;
  readonly focusRing: string;
}

export const DAY_PALETTE: ThemePalette = {
  mode: 'day',
  bgPrimary: '#FAF8F5',
  bgCard: '#FFFFFF',
  bgElevated: '#F2EEE8',
  textPrimary: '#1F2421',
  textSecondary: '#4A524D',
  textMuted: '#5B635E',
  brandPrimary: '#4A7C6F',
  brandText: '#386055',
  brandSurface: '#EDF4F1',
  onBrandPrimary: '#FFFFFF',
  accentWarm: '#E08A6B',
  accentWarmText: '#9E4728',
  accentWarmSurface: '#FFF4EC',
  onAccentWarm: '#1F2421',
  accentSecondary: '#E08A6B',
  alertRed: '#D64545',
  alertRedText: '#B42D2D',
  alertRedSurface: '#FDECEC',
  onAlertRedText: '#FFFFFF',
  borderInteractive: '#737A75',
  focusRing: '#2B5B4E',
};

export const NIGHT_3AM_PALETTE: ThemePalette = {
  mode: 'night_3am',
  bgPrimary: '#121110',
  bgCard: '#1B1917',
  bgElevated: '#24211E',
  textPrimary: '#F3EDE2',
  textSecondary: '#CFC6B6',
  textMuted: '#A89F91',
  brandPrimary: '#7EB3A3',
  brandText: '#7EB3A3',
  brandSurface: '#1A2C27',
  onBrandPrimary: '#121110',
  accentWarm: '#E8A864',
  accentWarmText: '#E8A864',
  accentWarmSurface: '#382716',
  onAccentWarm: '#121110',
  accentSecondary: '#E59876',
  alertRed: '#F07575',
  alertRedText: '#F07575',
  alertRedSurface: '#471D1D',
  onAlertRedText: '#121110',
  borderInteractive: '#756D65',
  focusRing: '#F2B872',
};

export const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  day: DAY_PALETTE,
  night_3am: NIGHT_3AM_PALETTE,
};

export function getThemePalette(mode: ThemeMode): ThemePalette {
  return THEME_PALETTES[mode];
}
