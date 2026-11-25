import assert from 'node:assert/strict';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function parseHexRgb(hex) {
  assert.match(hex, HEX_COLOR_RE, `Expected #RRGGBB hex color, got "${hex}"`);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function linearizeChannel(channel255) {
  const srgb = channel255 / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const [r, g, b] = parseHexRgb(hex);
  const R = linearizeChannel(r);
  const G = linearizeChannel(g);
  const B = linearizeChannel(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function calcContrast(hexA, hexB) {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function assertContrastAtLeast(fgHex, bgHex, minRatio, label = '') {
  const ratio = calcContrast(fgHex, bgHex);
  assert.ok(
    ratio >= minRatio,
    `WCAG contrast failure${label ? ` (${label})` : ''}: ${fgHex} on ${bgHex} = ${ratio.toFixed(4)}:1 < ${minRatio}:1`,
  );
  return ratio;
}
