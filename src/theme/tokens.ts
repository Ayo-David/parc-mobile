import { blackScale, magentaScale, rawNeutrals, rawStatusColors } from "./primitives";
import type { SemanticColors } from "./types";

/**
 * Semantic color tokens mapped from Figma's "Design Tokens" section
 * (20:3663), cross-checked against "Color System" (20:144). No Figma
 * Variables (native variable/mode bindings) exist in the source file —
 * every value below is a literal hex pulled from layer fills and token
 * labels. There is no dark-mode color group in Figma; `darkColors` below
 * is derived from these, not extracted from a design.
 */
export const lightColors: SemanticColors = {
  primary: blackScale[950],
  primaryHover: "#1A1A1A",
  primarySubtle: blackScale[50],
  onPrimary: rawNeutrals.white,
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
  mediaBackground: blackScale[950],
  overlayOnMedia: "rgba(255, 255, 255, 0.1)",
};

/**
 * Dark-mode semantic colors. Figma has no dark-mode group, so this palette
 * is derived from the light one rather than extracted: the neutral ramp is
 * inverted (black `primary` becomes white, with `onPrimary` flipping to
 * black), surfaces step up from a near-black background, and status
 * accents keep their hue. `textInverse` stays white because nearly every
 * consumer places it on an always-dark surface (`surfaceInverse`, the
 * wallet gradient, magenta/error fills), not on `primary`.
 */
export const darkColors: SemanticColors = {
  primary: rawNeutrals.white,
  primaryHover: blackScale[100],
  primarySubtle: "#1F1F1F",
  onPrimary: blackScale[950],
  secondary: magentaScale[500],
  secondarySubtle: "#2A0D27",
  background: blackScale[900],
  surface: "#141414",
  surfaceAlt: "#1A1A1A",
  textPrimary: blackScale[50],
  textSecondary: "#C2C2C2",
  textMuted: "#8C8C8C",
  textTertiary: "#A3A3A3",
  textDisabled: "#525252",
  textInverse: rawNeutrals.white,
  border: "#2A2A2A",
  borderSubtle: "#333333",
  divider: "#1F1F1F",
  borderFocus: rawNeutrals.white,
  borderError: rawStatusColors.error,
  success: rawStatusColors.success,
  successStrong: "#5FE3BF",
  warning: rawStatusColors.warning,
  warningStrong: "#F8C46A",
  warningMuted: "#D9A74E",
  error: rawStatusColors.error,
  info: rawStatusColors.info,
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(0, 0, 0, 0.75)",
  disabledSurface: "#1F1F1F",
  disabledBorder: "#2A2A2A",
  surfaceInverse: "#1F1F1F",
  mediaBackground: blackScale[950],
  overlayOnMedia: "rgba(255, 255, 255, 0.1)",
};
