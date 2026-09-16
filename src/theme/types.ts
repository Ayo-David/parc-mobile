import type { TextStyle } from "react-native";

export type HexColor = `#${string}`;

export type ColorScale11 = {
  50: HexColor;
  100: HexColor;
  200: HexColor;
  300: HexColor;
  400: HexColor;
  500: HexColor;
  600: HexColor;
  700: HexColor;
  800: HexColor;
  900: HexColor;
  950: HexColor;
};

export type ColorScale10 = Omit<ColorScale11, 950>;

export interface SemanticColors {
  primary: HexColor;
  primaryHover: HexColor;
  primarySubtle: HexColor;
  secondary: HexColor;
  secondarySubtle: HexColor;
  background: HexColor;
  surface: HexColor;
  surfaceAlt: HexColor;
  textPrimary: HexColor;
  textSecondary: HexColor;
  textMuted: HexColor;
  textDisabled: HexColor;
  textInverse: HexColor;
  border: HexColor;
  divider: HexColor;
  borderFocus: HexColor;
  borderError: HexColor;
  success: HexColor;
  warning: HexColor;
  error: HexColor;
  info: HexColor;
  overlay: string;
  scrim: string;
}

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: TextStyle["fontWeight"];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface Typography {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  bodyLarge: TypographyStyle;
  bodyMedium: TypographyStyle;
  bodySmall: TypographyStyle;
  caption: TypographyStyle;
  label: TypographyStyle;
  button: TypographyStyle;
  amountXl: TypographyStyle;
}

export interface SpacingScale {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
}

export interface SemanticSpacing {
  screenX: number;
  section: number;
  card: number;
  component: number;
  form: number;
  list: number;
}

export interface RadiusScale {
  xs: number;
  sm: number;
  md: number;
  input: number;
  button: number;
  card: number;
  sheet: number;
  full: number;
}

export interface ShadowStyle {
  shadowColor: HexColor;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Elevation {
  xs: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
  sheet: ShadowStyle;
}

export interface IconSizes {
  compact: number;
  default: number;
  large: number;
}

export interface ControlHeights {
  buttonLarge: number;
  buttonMedium: number;
  buttonSmall: number;
  iconButton: number;
  iconButtonLarge: number;
  input: number;
  otpBoxWidth: number;
  otpBoxHeight: number;
  minTouchTarget: number;
}

export interface MotionTokens {
  durationFast: number;
  durationBase: number;
  durationSlow: number;
  easeInOut: readonly [number, number, number, number];
  easeSpring: readonly [number, number, number, number];
}

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "destructive";
export type ButtonSize = "large" | "medium" | "small";
export type InteractionState = "default" | "hover" | "pressed" | "disabled";
export type InputState = "default" | "focus" | "error" | "success" | "disabled";
export type StatusTone = "success" | "warning" | "error" | "info";

export interface ButtonStyleRecipe {
  backgroundColor: HexColor | "transparent";
  textColor: HexColor;
  borderColor: HexColor | "transparent";
  opacity: number;
}

export interface InputStyleRecipe {
  backgroundColor: HexColor;
  borderColor: HexColor;
  textColor: HexColor;
  opacity: number;
}

export interface StatusStyleRecipe {
  backgroundColor: string;
  textColor: HexColor;
  borderColor: HexColor;
}

export interface ComponentStyles {
  button: Record<ButtonVariant, Record<InteractionState, ButtonStyleRecipe>>;
  buttonHeight: Record<ButtonSize, number>;
  input: Record<InputState, InputStyleRecipe>;
  status: Record<StatusTone, StatusStyleRecipe>;
  card: {
    backgroundColor: HexColor;
    radius: number;
    padding: number;
    shadow: ShadowStyle;
  };
}

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export interface ThemeBranding {
  logoLightUrl?: string;
  logoDarkUrl?: string;
}

export interface ParcTheme {
  mode: ThemeMode;
  colors: SemanticColors;
  typography: Typography;
  spacing: SpacingScale;
  semanticSpacing: SemanticSpacing;
  radii: RadiusScale;
  elevation: Elevation;
  icon: IconSizes;
  control: ControlHeights;
  motion: MotionTokens;
  components: ComponentStyles;
  /** Undefined means "use the bundled default Parc logo asset." */
  branding?: ThemeBranding;
}

/**
 * Properties a tenant is permitted to override. Anything not listed here
 * (status colors, disabled colors, touch targets, spacing, typography scale)
 * is intentionally excluded and cannot be changed by tenant configuration.
 */
export interface TenantThemeOverrides {
  primary?: HexColor;
  primaryHover?: HexColor;
  primarySubtle?: HexColor;
  secondary?: HexColor;
  secondarySubtle?: HexColor;
  surface?: HexColor;
  surfaceAlt?: HexColor;
  buttonRadius?: number;
  cardRadius?: number;
  logoLightUrl?: string;
  logoDarkUrl?: string;
}

/**
 * Shape of tenant branding as it may arrive from a remote/bootstrap API:
 * untrusted, partially populated, and not yet validated.
 */
export type UnvalidatedTenantThemeInput = Partial<Record<keyof TenantThemeOverrides, unknown>>;
