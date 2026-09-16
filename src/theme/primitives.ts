import { Platform } from "react-native";
import type { ColorScale10, ColorScale11, HexColor } from "./types";

/**
 * Raw palette ramps extracted from Figma file 9auGumDGNDtTwJ5XOgDr8K,
 * node 20:21 ("Complete Fintech Design System" > Color System).
 * Endpoints (50 and 950/900) were explicitly labeled in Figma; the
 * intermediate stops were inferred assuming an even Tailwind-style scale.
 * Do not consume these directly in product code — use tokens.ts (semantic
 * colors) or themes/defaultTheme.ts instead.
 */
export const blackScale: ColorScale11 = {
  50: "#F5F5F5",
  100: "#E8E8E8",
  200: "#D1D1D1",
  300: "#ABABAB",
  400: "#757575",
  500: "#4A4A4A",
  600: "#2E2E2E",
  700: "#1F1F1F",
  800: "#141414",
  900: "#0A0A0A",
  950: "#000000",
};

export const magentaScale: ColorScale10 = {
  50: "#FDF0FC",
  100: "#FAD5F8",
  200: "#F5A8EF",
  300: "#F070E0",
  400: "#EB3ED3",
  500: "#E615CA",
  600: "#C400AF",
  700: "#A20091",
  800: "#820075",
  900: "#5C005A",
};

export const rawStatusColors = {
  success: "#00C896" as HexColor,
  warning: "#F5A623" as HexColor,
  error: "#E84040" as HexColor,
  info: "#4A90E2" as HexColor,
};

export const rawNeutrals = {
  white: "#FFFFFF" as HexColor,
  black: "#000000" as HexColor,
};

/**
 * 4px-based spacing scale from the Figma "Spacing & Shape" section.
 */
export const spacingScale = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radiusScale = {
  xs: 4,
  sm: 8,
  md: 12,
  input: 12,
  button: 14,
  card: 20,
  sheet: 28,
  full: 9999,
} as const;

export const iconSizes = {
  compact: 20,
  default: 24,
  large: 28,
} as const;

export const controlHeights = {
  buttonLarge: 60,
  buttonMedium: 52,
  buttonSmall: 40,
  iconButton: 48,
  iconButtonLarge: 56,
  input: 56,
  otpBoxWidth: 52,
  otpBoxHeight: 60,
  // WCAG/HIG accessibility floor. Not a Figma value and not tenant-overridable.
  minTouchTarget: 44,
} as const;

export const motionTokens = {
  durationFast: 140,
  durationBase: 220,
  durationSlow: 340,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  easeSpring: [0.34, 1.56, 0.64, 1] as const,
} as const;

/**
 * Font family gap: Figma specifies "Plus Jakarta Sans" (all UI text) and
 * "JetBrains Mono" (financial amounts, per the amount-xl token — though a
 * separate design note in the same file says amounts should also move to
 * Plus Jakarta Sans; see docs/theme/README.md "Open questions"). Neither
 * font's .ttf/.otf files exist in this repository yet (no assets/fonts
 * directory, no expo-font useFonts call). Until the real files are added
 * and loaded, every family below resolves to the platform system font so
 * the app renders correctly; swap these two constants once fonts land.
 */
const systemFont = Platform.select({ ios: "System", android: "sans-serif", default: "System" }) as string;

export const fontFamilies = {
  sans: systemFont,
  mono: systemFont,
};
