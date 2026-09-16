import { fontFamilies } from "./primitives";
import type { Typography } from "./types";

/**
 * Type scale extracted from Figma node 20:369 ("Typography") and the
 * canonical "Design Tokens" section (20:3663). Letter-spacing values use
 * the em figures from the Design Tokens summary, which the source file
 * treats as authoritative over the px figures shown on individual samples.
 */
export const typography: Typography = {
  display: {
    fontFamily: fontFamilies.sans,
    fontWeight: "800",
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -0.035 * 48,
  },
  h1: {
    fontFamily: fontFamilies.sans,
    fontWeight: "700",
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: -0.02 * 32,
  },
  h2: {
    fontFamily: fontFamilies.sans,
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: -0.015 * 28,
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.01 * 24,
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.005 * 20,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontWeight: "400",
    fontSize: 18,
    lineHeight: 21.6,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 19.2,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 16.8,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 16.8,
    letterSpacing: 0.01 * 14,
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: -0.01 * 16,
  },
  // Figma's amount-xl token specifies JetBrains Mono; fontFamilies.mono
  // currently resolves to the same system-font fallback as fontFamilies.sans
  // (see primitives.ts) until the font gap and the mono-vs-sans contradiction
  // noted in docs/theme/README.md are resolved.
  amountXl: {
    fontFamily: fontFamilies.mono,
    fontWeight: "700",
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.02 * 40,
  },
};
