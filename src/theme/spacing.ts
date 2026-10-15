import { borderWidths, controlHeights, iconSizes, motionTokens, radiusScale, spacingScale } from "./primitives";
import type { BorderWidths, Elevation, IconSizes, MotionTokens, RadiusScale, SemanticSpacing, SpacingScale } from "./types";

export const spacing: SpacingScale = spacingScale;

/**
 * Named spacing roles from the Figma "Design Tokens" section
 * (--space-screen-x, --space-section, --space-card, --space-component,
 * --space-form, --space-list).
 */
export const semanticSpacing: SemanticSpacing = {
  screenX: 20,
  section: 40,
  card: 20,
  component: 16,
  form: 12,
  list: 12,
  authActions: 11,
  keypadX: 18,
};

export const radii: RadiusScale = radiusScale;

export const icon: IconSizes = iconSizes;

export const control = controlHeights;

export const borderWidth: BorderWidths = borderWidths;

export const motion: MotionTokens = motionTokens;

/**
 * React Native has no CSS box-shadow, so each Figma shadow token is
 * translated into RN's iOS shadow* properties plus an approximate Android
 * `elevation`. Elevation is a heuristic ramp (not derived pixel-for-pixel
 * from the CSS blur/opacity) since the two models aren't equivalent —
 * treat elevation as "close enough," not exact parity with the Figma spec.
 */
export const elevation: Elevation = {
  xs: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 32,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.13,
    shadowRadius: 48,
    elevation: 12,
  },
  // Figma specifies a negative-Y (upward) shadow for bottom sheets, which
  // iOS renders correctly via a negative shadowOffset.height; Android's
  // elevation model has no directional shadow, so it reuses the "lg" ramp.
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 16,
  },
};
