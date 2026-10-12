import { withAlpha } from "./colorUtils";
import { control, elevation, radii as defaultRadii, semanticSpacing } from "./spacing";
import type { ComponentStyles, RadiusScale, SemanticColors } from "./types";

/**
 * Typed style recipes for recurring component patterns identified in Figma
 * (Buttons 20:1648, Forms 20:1823, Feedback 20:2976). These are token
 * dictionaries only — no React Native components are implemented here.
 *
 * Verified against a live re-read of the Figma file (button variants
 * 20:1666-20:1780, form states 20:1841-20:1989, alerts 20:2994-20:3057) —
 * see design-system.md. Confirmed against the real component specimens,
 * not conventional light/outline/ghost assumptions:
 * - Secondary is a solid magenta button (not an outlined black one).
 * - Tertiary is outlined (border colors.border) with primary text (not
 *   borderless).
 * - Ghost uses textPrimary, not textSecondary.
 * - Disabled buttons use one dedicated gray treatment across every
 *   variant (colors.disabledSurface/disabledBorder + textDisabled), not
 *   variant-color-at-reduced-opacity — Figma's "Disabled State" and
 *   "Disabled Secondary" specimens render identically.
 * - Status alert backgrounds are literal pastel hexes, not a derived
 *   12%-alpha wash of the tone color; alert borders are the tone color at
 *   13% alpha.
 */
export function buildComponentStyles(colors: SemanticColors, radii: RadiusScale = defaultRadii): ComponentStyles {
  const disabledButtonState = { backgroundColor: colors.disabledSurface, textColor: colors.textDisabled, borderColor: colors.disabledBorder, opacity: 1 } as const;

  return {
    buttonHeight: {
      large: control.buttonLarge,
      medium: control.buttonMedium,
      small: control.buttonSmall,
    },
    button: {
      primary: {
        default: { backgroundColor: colors.primary, textColor: colors.textInverse, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.primaryHover, textColor: colors.textInverse, borderColor: "transparent", opacity: 1 },
        pressed: { backgroundColor: colors.primaryHover, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.9 },
        disabled: disabledButtonState,
      },
      secondary: {
        default: { backgroundColor: colors.secondary, textColor: colors.textInverse, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.secondary, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.92 },
        pressed: { backgroundColor: colors.secondary, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.85 },
        disabled: disabledButtonState,
      },
      tertiary: {
        default: { backgroundColor: "transparent", textColor: colors.textPrimary, borderColor: colors.border, opacity: 1 },
        hover: { backgroundColor: colors.primarySubtle, textColor: colors.textPrimary, borderColor: colors.border, opacity: 1 },
        pressed: { backgroundColor: colors.primarySubtle, textColor: colors.textPrimary, borderColor: colors.border, opacity: 0.9 },
        disabled: disabledButtonState,
      },
      ghost: {
        default: { backgroundColor: "transparent", textColor: colors.textPrimary, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.surfaceAlt, textColor: colors.textPrimary, borderColor: "transparent", opacity: 1 },
        pressed: { backgroundColor: colors.surfaceAlt, textColor: colors.textPrimary, borderColor: "transparent", opacity: 0.9 },
        disabled: disabledButtonState,
      },
      destructive: {
        default: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.92 },
        pressed: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.85 },
        disabled: disabledButtonState,
      },
    },
    input: {
      // default/focus backgroundColor+borderColor confirmed 2026-09-20 on a
      // live production input (PhoneEmailLogin 226:1546) — the Form
      // Components documentation specimen this was originally checked
      // against (colors.surface/colors.border) doesn't match what real
      // screens render.
      default: { backgroundColor: colors.background, borderColor: colors.borderSubtle, textColor: colors.textPrimary, opacity: 1 },
      focus: { backgroundColor: colors.background, borderColor: colors.borderFocus, textColor: colors.textPrimary, opacity: 1 },
      error: { backgroundColor: colors.surface, borderColor: colors.borderError, textColor: colors.textPrimary, opacity: 1 },
      success: { backgroundColor: colors.surface, borderColor: colors.success, textColor: colors.textPrimary, opacity: 1 },
      disabled: { backgroundColor: colors.background, borderColor: colors.border, textColor: colors.textDisabled, opacity: 1 },
    },
    status: {
      success: { backgroundColor: "#D0F7EE", textColor: colors.success, borderColor: withAlpha(colors.success, 0.13) },
      warning: { backgroundColor: "#FEF2D8", textColor: colors.warning, borderColor: withAlpha(colors.warning, 0.13) },
      error: { backgroundColor: "#FDE8E8", textColor: colors.error, borderColor: withAlpha(colors.error, 0.13) },
      info: { backgroundColor: "#E8F2FD", textColor: colors.info, borderColor: withAlpha(colors.info, 0.13) },
    },
    card: {
      backgroundColor: colors.surface,
      radius: radii.card,
      padding: semanticSpacing.card,
      shadow: elevation.sm,
    },
    // Figma HomeScreen 226:3106 — reuses existing dark-scale tokens for the
    // 3 gradient stops rather than new literals (surfaceInverse=#0A0A0A,
    // primaryHover=#1A1A1A, primary=#000000 already match exactly).
    walletCard: {
      gradientColors: [colors.surfaceInverse, colors.primaryHover, colors.primary],
      gradientLocations: [0.0617, 0.5877, 0.9383],
      gradientStart: { x: 0.26, y: 0.06 },
      gradientEnd: { x: 0.74, y: 0.94 },
      radius: radii.cardLg,
      shadow: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 60, elevation: 16 },
    },
    pinPad: {
      dotSize: 16,
      dotBorderWidth: 2.5,
      dotBorderColor: "#D9D9D9",
      dotFilledColor: colors.primary,
      keyBackground: colors.primarySubtle,
      keyRadius: radii.pad,
    },
  };
}
