import { defaultTheme } from "./defaultTheme";
import type { ParcTheme } from "../types";

/**
 * No dark-mode color group exists anywhere in the Figma source file
 * (confirmed via get_variable_defs returning no bound variables/modes on
 * the Color System, Design Tokens, or Button nodes). Rather than invent a
 * dark palette that hasn't been designed, darkTheme currently mirrors
 * defaultTheme exactly — an identity fallback, not a real dark theme.
 *
 * The type is still `mode: "dark"` and the provider/hook machinery below
 * fully supports switching to it, so once Figma defines dark-mode tokens
 * this file becomes a one-place swap with no consumer changes required.
 * Until then, ThemeProvider intentionally ignores the OS color scheme and
 * always resolves to defaultTheme — see ThemeProvider.tsx.
 */
export const darkTheme: ParcTheme = {
  ...defaultTheme,
  mode: "dark",
};
