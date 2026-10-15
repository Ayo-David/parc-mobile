import { buildComponentStyles } from "../componentStyles";
import { borderWidth, elevation, icon, control, motion, radii, semanticSpacing, spacing } from "../spacing";
import { darkColors } from "../tokens";
import { typography } from "../typography";
import type { ParcTheme } from "../types";

/**
 * Dark mode. Figma has no dark-mode color group, so `darkColors` is derived
 * from the light palette (see tokens.ts). Everything except color is shared
 * with defaultTheme.
 */
export const darkTheme: ParcTheme = {
  mode: "dark",
  colors: darkColors,
  typography,
  spacing,
  semanticSpacing,
  radii,
  elevation,
  icon,
  control,
  borderWidth,
  motion,
  components: buildComponentStyles(darkColors, radii, "dark"),
};
