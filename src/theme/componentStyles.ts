import { withAlpha } from "./colorUtils";
import { control, elevation, radii as defaultRadii, semanticSpacing } from "./spacing";
import type { ComponentStyles, RadiusScale, SemanticColors } from "./types";

/**
 * Typed style recipes for recurring component patterns identified in Figma
 * (Buttons 20:1648, Forms 20:1823, Feedback 20:2976). These are token
 * dictionaries only — no React Native components are implemented here.
 *
 * IMPORTANT — provisional: the design-system extraction enumerated button
 * and input component node IDs but did not deep-inspect each variant's
 * exact fill/border colors (breadth-over-depth pass). The recipes below
 * are assembled from confirmed semantic tokens using conventional
 * light/outline/ghost button patterns, not values read directly off each
 * button variant layer. Verify against Figma nodes 20:1666–20:1780 and
 * 20:1841–20:1989 before treating these as final; see
 * docs/theme/README.md "Open questions".
 */
export function buildComponentStyles(colors: SemanticColors, radii: RadiusScale = defaultRadii): ComponentStyles {
  const disabledOpacity = 0.4;

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
        disabled: { backgroundColor: colors.primary, textColor: colors.textInverse, borderColor: "transparent", opacity: disabledOpacity },
      },
      secondary: {
        default: { backgroundColor: colors.surface, textColor: colors.primary, borderColor: colors.primary, opacity: 1 },
        hover: { backgroundColor: colors.primarySubtle, textColor: colors.primary, borderColor: colors.primary, opacity: 1 },
        pressed: { backgroundColor: colors.primarySubtle, textColor: colors.primary, borderColor: colors.primary, opacity: 0.9 },
        disabled: { backgroundColor: colors.surface, textColor: colors.primary, borderColor: colors.primary, opacity: disabledOpacity },
      },
      tertiary: {
        default: { backgroundColor: "transparent", textColor: colors.primary, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.primarySubtle, textColor: colors.primary, borderColor: "transparent", opacity: 1 },
        pressed: { backgroundColor: colors.primarySubtle, textColor: colors.primary, borderColor: "transparent", opacity: 0.9 },
        disabled: { backgroundColor: "transparent", textColor: colors.primary, borderColor: "transparent", opacity: disabledOpacity },
      },
      ghost: {
        default: { backgroundColor: "transparent", textColor: colors.textSecondary, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.surfaceAlt, textColor: colors.textSecondary, borderColor: "transparent", opacity: 1 },
        pressed: { backgroundColor: colors.surfaceAlt, textColor: colors.textSecondary, borderColor: "transparent", opacity: 0.9 },
        disabled: { backgroundColor: "transparent", textColor: colors.textSecondary, borderColor: "transparent", opacity: disabledOpacity },
      },
      destructive: {
        default: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 1 },
        hover: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.92 },
        pressed: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: 0.85 },
        disabled: { backgroundColor: colors.error, textColor: colors.textInverse, borderColor: "transparent", opacity: disabledOpacity },
      },
    },
    input: {
      default: { backgroundColor: colors.surface, borderColor: colors.border, textColor: colors.textPrimary, opacity: 1 },
      focus: { backgroundColor: colors.surface, borderColor: colors.borderFocus, textColor: colors.textPrimary, opacity: 1 },
      error: { backgroundColor: colors.surface, borderColor: colors.borderError, textColor: colors.textPrimary, opacity: 1 },
      success: { backgroundColor: colors.surface, borderColor: colors.success, textColor: colors.textPrimary, opacity: 1 },
      disabled: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, textColor: colors.textDisabled, opacity: 0.6 },
    },
    status: {
      success: { backgroundColor: withAlpha(colors.success, 0.12), textColor: colors.success, borderColor: colors.success },
      warning: { backgroundColor: withAlpha(colors.warning, 0.12), textColor: colors.warning, borderColor: colors.warning },
      error: { backgroundColor: withAlpha(colors.error, 0.12), textColor: colors.error, borderColor: colors.error },
      info: { backgroundColor: withAlpha(colors.info, 0.12), textColor: colors.info, borderColor: colors.info },
    },
    card: {
      backgroundColor: colors.surface,
      radius: radii.card,
      padding: semanticSpacing.card,
      shadow: elevation.sm,
    },
  };
}
