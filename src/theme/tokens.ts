import { blackScale, magentaScale, rawNeutrals, rawStatusColors } from "./primitives";
import type { SemanticColors } from "./types";

/**
 * Semantic color tokens mapped from Figma's "Design Tokens" section
 * (20:3663), cross-checked against "Color System" (20:144). No Figma
 * Variables (native variable/mode bindings) exist in the source file —
 * every value below is a literal hex pulled from layer fills and token
 * labels. There is no dark-mode color group in Figma; see
 * themes/darkTheme.ts for how that gap is handled.
 */
export const lightColors: SemanticColors = {
  primary: blackScale[950],
  primaryHover: "#1A1A1A",
  primarySubtle: blackScale[50],
  secondary: magentaScale[500],
  secondarySubtle: magentaScale[50],
  background: "#F7F7F7",
  surface: rawNeutrals.white,
  surfaceAlt: "#FAFAFA",
  textPrimary: blackScale[900],
  textSecondary: blackScale[500],
  textMuted: "#8C8C8C",
  textTertiary: "#6B6B6B",
  textDisabled: "#C2C2C2",
  textInverse: rawNeutrals.white,
  border: "#EBEBEB",
  borderSubtle: "#E2E2E2",
  divider: "#F2F2F2",
  borderFocus: blackScale[950],
  borderError: rawStatusColors.error,
  success: rawStatusColors.success,
  successStrong: "#00604A",
  warning: rawStatusColors.warning,
  warningStrong: "#8A5A06",
  warningMuted: "#926821",
  error: rawStatusColors.error,
  info: rawStatusColors.info,
  overlay: "rgba(10, 10, 10, 0.4)",
  scrim: "rgba(10, 10, 10, 0.6)",
  disabledSurface: "#F0F0F0",
  disabledBorder: "#E0E0E0",
  surfaceInverse: blackScale[900],
  overlayOnMedia: "rgba(255, 255, 255, 0.1)",
};
