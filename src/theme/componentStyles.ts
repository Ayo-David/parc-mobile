import { withAlpha } from "./colorUtils";
import { control, elevation, radii as defaultRadii, semanticSpacing } from "./spacing";
import type { ComponentStyles, HexColor, RadiusScale, SemanticColors, StatusTone, ThemeMode } from "./types";

/**
 * Mode-specific one-off literals that don't belong in SemanticColors. Light
 * values are Figma's; dark values are derived (no dark group exists in Figma).
 */
const modeLiterals: Record<
  ThemeMode,
  {
    statusBackground: Record<StatusTone, HexColor>;
    pinDotBorder: HexColor;
    walletGradient: readonly [HexColor, HexColor, HexColor];
    heroDarkGradient: readonly [HexColor, HexColor];
  }
> = {
  light: {
    statusBackground: { success: "#D0F7EE", warning: "#FEF2D8", error: "#FDE8E8", info: "#E8F2FD" },
    pinDotBorder: "#D9D9D9",
    // Figma HomeScreen 226:3106 — #0A0A0A → #1A1A1A → #000000.
    walletGradient: ["#0A0A0A", "#1A1A1A", "#000000"],
    // Figma PasscodeSuccess 226:2328 — linear-gradient(135deg, #000000, #2E2E2E).
    heroDarkGradient: ["#000000", "#2E2E2E"],
  },
  dark: {
    statusBackground: { success: "#0B2A22", warning: "#2E2410", error: "#2E1414", info: "#10213A" },
    pinDotBorder: "#3D3D3D",
    // Lifted off the near-black background so the card still reads as raised.
    walletGradient: ["#262626", "#1C1C1C", "#121212"],
    heroDarkGradient: ["#262626", "#121212"],
  },
};

const shadowBlack: HexColor = "#000000";
const rawWhite: HexColor = "#FFFFFF";

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
export function buildComponentStyles(colors: SemanticColors, radii: RadiusScale = defaultRadii, mode: ThemeMode = "light"): ComponentStyles {
  const literals = modeLiterals[mode];
  const disabledButtonState = { backgroundColor: colors.disabledSurface, textColor: colors.textDisabled, borderColor: colors.disabledBorder, opacity: 1 } as const;

  return {
    buttonHeight: {
      large: control.buttonLarge,
      medium: control.buttonMedium,
      small: control.buttonSmall,
    },
    button: {
      primary: {
        default: { backgroundColor: colors.primary, textColor: colors.onPrimary, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.primaryHover, textColor: colors.onPrimary, borderColor: "transparent", opacity: 1 },
        pressed: { backgroundColor: colors.primaryHover, textColor: colors.onPrimary, borderColor: "transparent", opacity: 0.9 },
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
      success: { backgroundColor: literals.statusBackground.success, textColor: colors.success, borderColor: withAlpha(colors.success, 0.13) },
      warning: { backgroundColor: literals.statusBackground.warning, textColor: colors.warning, borderColor: withAlpha(colors.warning, 0.13) },
      error: { backgroundColor: literals.statusBackground.error, textColor: colors.error, borderColor: withAlpha(colors.error, 0.13) },
      info: { backgroundColor: literals.statusBackground.info, textColor: colors.info, borderColor: withAlpha(colors.info, 0.13) },
    },
    card: {
      backgroundColor: colors.surface,
      radius: radii.card,
      padding: semanticSpacing.card,
      shadow: elevation.sm,
    },
    // Figma HomeScreen 226:3106. Not derived from primary/surfaceInverse:
    // those flip in dark mode, but the card must stay dark under textInverse.
    walletCard: {
      gradientColors: literals.walletGradient,
      gradientLocations: [0.0617, 0.5877, 0.9383],
      gradientStart: { x: 0.26, y: 0.06 },
      gradientEnd: { x: 0.74, y: 0.94 },
      radius: radii.cardLg,
      shadow: { shadowColor: shadowBlack, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 60, elevation: 16 },
    },
    pinPad: {
      dotSize: 16,
      dotBorderWidth: 2.5,
      dotBorderColor: literals.pinDotBorder,
      dotFilledColor: colors.primary,
      keyBackground: colors.primarySubtle,
      keyRadius: radii.pad,
    },
    onMedia: {
      buttonBackground: withAlpha(rawWhite, 0.1),
      buttonBorder: withAlpha(rawWhite, 0.15),
      segmentTrack: withAlpha(rawWhite, 0.07),
      segmentActive: withAlpha(rawWhite, 0.12),
      segmentInactiveText: withAlpha(rawWhite, 0.32),
      ringBackground: withAlpha(rawWhite, 0.05),
      ringBorder: withAlpha(rawWhite, 0.1),
      // Fingerprint glyph stroke (226:2735) — white at 40%.
      ringIcon: withAlpha(rawWhite, 0.4),
      glow: withAlpha(colors.secondary, 0.11),
      ringSize: 136,
      ringIconSize: 62,
      segmentHeight: 33,
      segmentRadius: 9,
      segmentInset: 3,
    },
    successHero: {
      dark: {
        gradient: literals.heroDarkGradient,
        iconColor: colors.secondary,
        innerRing: withAlpha(colors.secondary, 0.12),
        outerRing: withAlpha(colors.secondary, 0.06),
        size: 108,
        iconSize: 42,
      },
      success: {
        gradient: [literals.statusBackground.success, literals.statusBackground.success],
        iconColor: colors.success,
        innerRing: withAlpha(colors.success, 0.15),
        outerRing: withAlpha(colors.success, 0.07),
        size: 112,
        iconSize: 48,
      },
    },
    optionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      selectedBorderColor: colors.primary,
      selectedBackgroundColor: colors.primarySubtle,
      radioBorderColor: literals.pinDotBorder,
      radioSelectedColor: colors.primary,
      // Figma 226:2061 — 21px ring, 2px border.
      radioSize: 21,
      radioDotSize: 11,
    },
  };
}
