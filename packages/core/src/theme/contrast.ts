import type { ThemePalette } from './tokens';

export const WCAG_AA_NORMAL_TEXT_RATIO = 4.5;
export const WCAG_AA_LARGE_OR_UI_RATIO = 3.0;

export interface ContrastCheckResult {
  readonly pairName: string;
  readonly fgHex: string;
  readonly bgHex: string;
  readonly ratio: number;
  readonly minRequired: number;
  readonly passed: boolean;
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function parseHexRgb(hex: string): { r: number; g: number; b: number } {
  if (!HEX_COLOR_REGEX.test(hex)) {
    throw new Error(`Color hexadecimal inválido (se esperaba #RRGGBB): ${hex}`);
  }
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function linearizeChannel(channel255: number): number {
  const srgb = channel255 / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHexRgb(hex);
  const rl = linearizeChannel(r);
  const gl = linearizeChannel(g);
  const bl = linearizeChannel(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkPair(
  pairName: string,
  fgHex: string,
  bgHex: string,
  minRequired: number,
): ContrastCheckResult {
  const ratio = contrastRatio(fgHex, bgHex);
  return {
    pairName,
    fgHex,
    bgHex,
    ratio,
    minRequired,
    passed: ratio >= minRequired,
  };
}

export function evaluatePaletteContrast(
  palette: ThemePalette,
): ContrastCheckResult[] {
  const N = WCAG_AA_NORMAL_TEXT_RATIO;
  const UI = WCAG_AA_LARGE_OR_UI_RATIO;

  const pairs: ContrastCheckResult[] = [
    checkPair('textPrimary on bgPrimary', palette.textPrimary, palette.bgPrimary, N),
    checkPair('textPrimary on bgCard', palette.textPrimary, palette.bgCard, N),
    checkPair('textPrimary on bgElevated', palette.textPrimary, palette.bgElevated, N),
    checkPair('textPrimary on brandSurface', palette.textPrimary, palette.brandSurface, N),
    checkPair('textPrimary on accentWarmSurface', palette.textPrimary, palette.accentWarmSurface, N),
    checkPair('textPrimary on alertRedSurface', palette.textPrimary, palette.alertRedSurface, N),

    checkPair('textSecondary on bgPrimary', palette.textSecondary, palette.bgPrimary, N),
    checkPair('textSecondary on bgCard', palette.textSecondary, palette.bgCard, N),
    checkPair('textSecondary on bgElevated', palette.textSecondary, palette.bgElevated, N),

    checkPair('textMuted on bgPrimary', palette.textMuted, palette.bgPrimary, N),
    checkPair('textMuted on bgCard', palette.textMuted, palette.bgCard, N),
    checkPair('textMuted on bgElevated', palette.textMuted, palette.bgElevated, N),
    checkPair('textMuted on alertRedSurface', palette.textMuted, palette.alertRedSurface, N),

    checkPair('brandText on bgPrimary', palette.brandText, palette.bgPrimary, N),
    checkPair('brandText on bgCard', palette.brandText, palette.bgCard, N),
    checkPair('brandText on brandSurface', palette.brandText, palette.brandSurface, N),
    checkPair('onBrandPrimary on brandPrimary', palette.onBrandPrimary, palette.brandPrimary, N),

    checkPair('accentWarmText on bgPrimary', palette.accentWarmText, palette.bgPrimary, N),
    checkPair('accentWarmText on bgCard', palette.accentWarmText, palette.bgCard, N),
    checkPair('accentWarmText on accentWarmSurface', palette.accentWarmText, palette.accentWarmSurface, N),
    checkPair('onAccentWarm on accentWarm', palette.onAccentWarm, palette.accentWarm, N),

    checkPair('alertRedText on bgPrimary', palette.alertRedText, palette.bgPrimary, N),
    checkPair('alertRedText on bgCard', palette.alertRedText, palette.bgCard, N),
    checkPair('alertRedText on alertRedSurface', palette.alertRedText, palette.alertRedSurface, N),
    checkPair('onAlertRedText on alertRedSurface', palette.onAlertRedText, palette.alertRedSurface, N),
    checkPair('onAlertRedButton on alertRedText', palette.onAlertRedButton, palette.alertRedText, N),

    checkPair('brandPrimary UI on bgPrimary', palette.brandPrimary, palette.bgPrimary, UI),
    checkPair('alertRed UI on bgPrimary', palette.alertRed, palette.bgPrimary, UI),
    checkPair('alertRed UI on alertRedSurface', palette.alertRed, palette.alertRedSurface, UI),
    checkPair('borderInteractive on bgPrimary', palette.borderInteractive, palette.bgPrimary, UI),
    checkPair('borderInteractive on bgCard', palette.borderInteractive, palette.bgCard, UI),
    checkPair('borderInteractive on bgElevated', palette.borderInteractive, palette.bgElevated, UI),
    checkPair('focusRing on bgPrimary', palette.focusRing, palette.bgPrimary, UI),
    checkPair('focusRing on bgCard', palette.focusRing, palette.bgCard, UI),
  ];

  if (palette.mode === 'night_3am') {
    pairs.push(
      checkPair('accentSecondary on bgPrimary', palette.accentSecondary, palette.bgPrimary, N),
      checkPair('accentSecondary on bgCard', palette.accentSecondary, palette.bgCard, N),
    );
  }

  return pairs;
}

export function assertWcagAaPalette(palette: ThemePalette): void {
  const results = evaluatePaletteContrast(palette);
  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    const details = failures
      .map(
        (f) =>
          `${f.pairName} (${f.fgHex} on ${f.bgHex}): ${f.ratio.toFixed(2)}:1 < ${f.minRequired}:1`,
      )
      .join('; ');
    throw new Error(
      `La paleta "${palette.mode}" incumple WCAG 2.2 AA: ${details}`,
    );
  }
}
