import { buildComponentStyles } from "../componentStyles";
import { borderWidth, elevation, icon, control, motion, radii, semanticSpacing, spacing } from "../spacing";
import { lightColors } from "../tokens";
import { typography } from "../typography";
import type { ParcTheme } from "../types";

export const defaultTheme: ParcTheme = {
  mode: "light",
  colors: lightColors,
  typography,
  spacing,
  semanticSpacing,
  radii,
  elevation,
  icon,
  control,
  borderWidth,
  motion,
  components: buildComponentStyles(lightColors),
};
