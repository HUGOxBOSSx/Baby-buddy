import { describe, expect, it } from 'vitest';
import {
  assertWcagAaPalette,
  contrastRatio,
  DAY_PALETTE,
  evaluatePaletteContrast,
  NIGHT_3AM_PALETTE,
  parseHexRgb,
  relativeLuminance,
  STATUS_SPECS,
  WCAG_AA_LARGE_OR_UI_RATIO,
  WCAG_AA_NORMAL_TEXT_RATIO,
} from '../index';

describe('Design System WCAG 2.2 AA & Status Indicators', () => {
  it('computes exact WCAG relative luminance and contrast ratio bounds', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBe(1);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(parseHexRgb('#4A7C6F')).toEqual({ r: 74, g: 124, b: 111 });
    expect(() => parseHexRgb('#FFF')).toThrow();
    expect(() => parseHexRgb('red')).toThrow();
  });

  it('preserves exact mandated Day Mode and 3:00 AM Mode hex tokens', () => {
    expect(DAY_PALETTE.bgPrimary).toBe('#FAF8F5');
    expect(DAY_PALETTE.bgCard).toBe('#FFFFFF');
    expect(DAY_PALETTE.brandPrimary).toBe('#4A7C6F');
    expect(DAY_PALETTE.accentWarm).toBe('#E08A6B');
    expect(DAY_PALETTE.alertRed).toBe('#D64545');

    expect(NIGHT_3AM_PALETTE.bgPrimary).toBe('#121110');
    expect(NIGHT_3AM_PALETTE.textPrimary).toBe('#F3EDE2');
  });

  it('passes all WCAG 2.2 AA checks for both DAY_PALETTE and NIGHT_3AM_PALETTE', () => {
    expect(() => assertWcagAaPalette(DAY_PALETTE)).not.toThrow();
    expect(() => assertWcagAaPalette(NIGHT_3AM_PALETTE)).not.toThrow();

    const dayResults = evaluatePaletteContrast(DAY_PALETTE);
    const nightResults = evaluatePaletteContrast(NIGHT_3AM_PALETTE);
    expect(dayResults.length).toBeGreaterThanOrEqual(33);
    expect(nightResults.length).toBeGreaterThanOrEqual(35);
    expect(dayResults.every((r) => r.passed)).toBe(true);
    expect(nightResults.every((r) => r.passed)).toBe(true);

    expect(
      dayResults.some((r) => r.pairName === 'textMuted on alertRedSurface'),
    ).toBe(true);
    expect(
      nightResults.some((r) => r.pairName === 'textMuted on alertRedSurface'),
    ).toBe(true);
    expect(
      nightResults.some((r) => r.pairName === 'accentSecondary on bgPrimary'),
    ).toBe(true);
    expect(
      nightResults.some((r) => r.pairName === 'accentSecondary on bgCard'),
    ).toBe(true);
  });

  it('verifies brand vs AA-paired text contrast boundaries in Day Mode', () => {
    expect(contrastRatio('#4A7C6F', '#FAF8F5')).toBeLessThan(
      WCAG_AA_NORMAL_TEXT_RATIO,
    );
    expect(contrastRatio('#4A7C6F', '#FAF8F5')).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE_OR_UI_RATIO,
    );
    expect(contrastRatio('#E08A6B', '#FFFFFF')).toBeLessThan(
      WCAG_AA_LARGE_OR_UI_RATIO,
    );
    expect(contrastRatio('#D64545', '#FFFFFF')).toBeLessThan(
      WCAG_AA_NORMAL_TEXT_RATIO,
    );
    expect(contrastRatio('#D64545', '#FFFFFF')).toBeGreaterThanOrEqual(
      WCAG_AA_LARGE_OR_UI_RATIO,
    );

    expect(contrastRatio('#386055', '#FAF8F5')).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_RATIO,
    );
    expect(contrastRatio('#9E4728', '#FFFFFF')).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_RATIO,
    );
    expect(contrastRatio('#B42D2D', '#FFFFFF')).toBeGreaterThanOrEqual(
      WCAG_AA_NORMAL_TEXT_RATIO,
    );
  });

  it('throws descriptive error when a palette violates WCAG AA', () => {
    const brokenPalette = {
      ...DAY_PALETTE,
      textPrimary: '#999999',
    };
    expect(() => assertWcagAaPalette(brokenPalette)).toThrow(/WCAG 2.2 AA/);
  });

  it('separates alert text and button foreground tokens for AA contrast', () => {
    expect(NIGHT_3AM_PALETTE.onAlertRedText).toBe('#F3EDE2');
    expect(NIGHT_3AM_PALETTE.onAlertRedButton).toBe('#121110');
    expect(
      contrastRatio(
        NIGHT_3AM_PALETTE.onAlertRedText,
        NIGHT_3AM_PALETTE.alertRedSurface,
      ),
    ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_RATIO);
    expect(
      contrastRatio(
        NIGHT_3AM_PALETTE.onAlertRedButton,
        NIGHT_3AM_PALETTE.alertRedText,
      ),
    ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT_RATIO);
  });

  it('pairs every StatusSeverity with an icon, Mexican Spanish label, and no paywall', () => {
    for (const severity of ['normal', 'caution', 'urgent_red'] as const) {
      const spec = STATUS_SPECS[severity];
      expect(spec.iconName.length).toBeGreaterThan(0);
      expect(spec.labelMx.length).toBeGreaterThan(0);
      expect(spec.descriptionMx.length).toBeGreaterThan(0);
      expect(spec.paywallProtected).toBe(false);
    }
    expect(STATUS_SPECS.urgent_red.labelMx).toContain('911');
  });
});
