import type { HexColor } from "./types";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isValidHexColor(value: unknown): value is HexColor {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

/**
 * Expands a 3-digit hex to 6 digits; passes 6/8-digit hex through unchanged.
 */
function normalizeHex(hex: HexColor): string {
  const body = hex.slice(1);
  if (body.length === 3) {
    return body
      .split("")
      .map((channel) => channel + channel)
      .join("");
  }
  return body.slice(0, 6);
}

/**
 * Derives an rgba() wash from a semantic hex color at the given alpha.
 * Used for provisional subtle/status backgrounds that Figma did not
 * define explicitly (see docs/theme/README.md "Open questions").
 */
export function withAlpha(hex: HexColor, alpha: number): string {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}
