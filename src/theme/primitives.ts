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

/** All outlined form/button elements (buttons, inputs, checkboxes, radios) use a consistent 1.5px border in Figma — not RN's implicit 1px default. */
export const borderWidths = {
  hairline: 1,
  thin: 1.5,
  // Hero amount-input underline (Figma 237:12845).
  strong: 2.5,
  otpBox: 2,
} as const;

export const radiusScale = {
  xs: 4,
  sm: 8,
  md: 12,
  // Confirmed 2026-09-20 on a live production input (226:1546) — the
  // documentation-page Form Components specimen this was originally
  // extracted from (12px) understated it; production screens use 14px.
  input: 14,
  button: 14,
  lg: 16,
  card: 20,
  sheet: 28,
  full: 9999,
  // Added for the wallet Home screen (Figma 226:2865) — see types.ts RadiusScale.
  logo: 7,
  chip: 10,
  avatar: 13,
  quickAction: 18,
  cardLg: 24,
  pad: 17,
} as const;

export const iconSizes = {
  // Inline glyphs beside 12–14px text in the onboarding/auth frames (e.g. the passcode hint chip and biometric link, Figma 226:1555).
  inline: 14,
  // Back-button arrow (Figma 226:1472).
  nav: 18,
  compact: 20,
  default: 24,
  large: 28,
} as const;

export const controlHeights = {
  // Figma BackButton (226:1471, reused on every light auth frame).
  backButton: 44,
  // In-app BackHeader (Figma 237:12833, Personal Loan and other dashboard flows).
  backButtonCompact: 38,
  buttonLarge: 60,
  buttonMedium: 52,
  buttonSmall: 40,
  authButton: 56,
  iconButton: 48,
  iconButtonLarge: 56,
  // The circular status-icon badge on Liveness/result screens (Figma nodes 425:56, 426:158, 426:219, 426:268 and their siblings in later gap-closure phases).
  iconButtonXl: 64,
  input: 56,
  // Corrected 2026-09-20 against a live production OTP screen (226:2398-404).
  otpBoxWidth: 44,
  otpBoxHeight: 56,
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
 * Real Plus Jakarta Sans, loaded via `@expo-google-fonts/plus-jakarta-sans`
 * (`useFonts` call in `app/_layout.tsx`). React Native's custom-font model
 * requires referencing the exact loaded family name per weight — a single
 * "sans" family name plus a numeric `fontWeight` cannot select between
 * separately-loaded static TTFs (this fails silently on Android in
 * particular). `typography.ts` picks the matching weight constant below per
 * style; there is no single generic `fontFamilies.sans` anymore.
 *
 * These string literals must match the font-loading keys passed to
 * `useFonts` in `app/_layout.tsx` exactly (they're RN's runtime font-family
 * lookup keys, not display names) — if a font fails to load or hasn't
 * finished loading yet, RN falls back to the OS system font for that text
 * automatically, so this is safe to reference immediately.
 */
export const fontFamilies = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
};
