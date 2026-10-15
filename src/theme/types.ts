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
  /** Text/icon color on a solid `primary` fill (buttons, selected chips, checked boxes). White in light mode, black in dark mode where `primary` inverts to white. Never use `textInverse` on a `primary` fill — it doesn't flip. */
  onPrimary: HexColor;
  secondary: HexColor;
  secondarySubtle: HexColor;
  background: HexColor;
  surface: HexColor;
  surfaceAlt: HexColor;
  textPrimary: HexColor;
  textSecondary: HexColor;
  textMuted: HexColor;
  /** A third body-text gray (`#6B6B6B`) confirmed 2026-09-20 on the sign-up flow's register-phone subtitle (322:302) — between `textSecondary` (#4A4A4A) and `textMuted` (#8C8C8C), not a rounding of either. */
  textTertiary: HexColor;
  textDisabled: HexColor;
  textInverse: HexColor;
  border: HexColor;
  /** Confirmed 2026-09-20 on a live production input (PhoneEmailLogin 226:1546) — distinct from both `border` (#EBEBEB) and `divider` (#F2F2F2), not a duplicate. Used for text input borders specifically. */
  borderSubtle: HexColor;
  divider: HexColor;
  borderFocus: HexColor;
  borderError: HexColor;
  success: HexColor;
  /** Darker success-green for text directly on a `success`-tinted background (e.g. a "verified" banner) — confirmed 2026-09-20 on reset-passcode's identity-verified banner (226:2624). Distinct from `success` itself, which is the accent/icon color. */
  successStrong: HexColor;
  warning: HexColor;
  /** Title text on a warning-tinted background (Figma degraded-section banner, 440:182). */
  warningStrong: HexColor;
  /** Body text on a warning-tinted background (440:183). */
  warningMuted: HexColor;
  error: HexColor;
  info: HexColor;
  overlay: string;
  scrim: string;
  /** Dedicated disabled-button surface (Figma "Button Components" > Disabled State/Disabled Secondary — both variants render identically). Not derived via opacity. */
  disabledSurface: HexColor;
  disabledBorder: HexColor;
  /** Dark card surface that carries `textInverse` content (savings hero, tier card, avatar tiles). Near-black in light mode; a raised dark gray in dark mode so it still reads as a card against `background`. */
  surfaceInverse: HexColor;
  /** Full-bleed always-dark chrome for camera/scanner and the GetStarted hero (Figma Liveness 02–04, nodes 426:55/426:71/426:112; GetStarted 226:1408) — content-driven, so it's black in both modes. */
  mediaBackground: HexColor;
  /** Translucent chip background for a control placed over `mediaBackground` (e.g. the liveness capture back button, nodes 426:51/426:90/426:206). */
  overlayOnMedia: string;
}

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: TextStyle["fontWeight"];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** ["tabular-nums"] on amount/data figures so digits align in columns. */
  fontVariant?: TextStyle["fontVariant"];
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
  buttonLarge: TypographyStyle;
  buttonSmall: TypographyStyle;
  amountXl: TypographyStyle;
  /** Bound Figma Variable `Alias/typography/display2` (44/800/48/-1.54) — the GetStarted-style full-bleed hero headline, distinct from `display` (48px, used elsewhere). Confirmed live on GetStarted (226:1430). */
  display2: TypographyStyle;
  /** Bound Figma Variable `Alias/typography/display3` (36/800/40/0) — SignIn's "Welcome back." headline (226:1479). */
  display3: TypographyStyle;
  /** Bound Figma Variable `Alias/typography/body-mdd` (15/400/22.5/0). */
  text15Regular: TypographyStyle;
  text12SemiBoldWide: TypographyStyle;
  text14Regular: TypographyStyle;
  text14Bold: TypographyStyle;
  /** Bound Figma Variable `Alias/typography/pad-button` (26/400/39/-0.16) — PIN-pad numeric key digit (226:1599 etc.). Plus Jakarta Sans, not mono. */
  padButton: TypographyStyle;
  /** Bound Figma Variable `Alias/typography/body-bd` (14/700/19/0) — ForgotPasscode's option-row titles (226:2570 etc.). Distinct from `text14Bold` (21px line-height, used on SignIn/PhoneEmailLogin footers). */
  text14BoldCompact: TypographyStyle;
  /** register-phone's "What's your phone number?" headline (322:299) — 30px, distinct from both `display` (48px) and `display2` (44px). */
  text30ExtraBold: TypographyStyle;
  /** The AuthBtn label weight used on register-phone (322:349) — Bold, not the SemiBold `button` token used on other AuthBtn instances (GetStarted/PhoneEmailLogin). */
  text16Bold: TypographyStyle;
  text13Regular: TypographyStyle;
  /** Referral-code input placeholder (322:332) — Plus Jakarta Sans with tabular figures, for a code-like value. */
  text15RegularFigure: TypographyStyle;
  /** PIN-pad key letter subtitle ("ABC"/"DEF"/…, 226:1605 etc.) — 8px, uppercase applied via textTransform at the call site. */
  text8MediumWide: TypographyStyle;
  // Dashboard-density scale, added for the wallet Home screen (Figma
  // "Parc Dashboard" 326:968 > HomeScreen 226:2865) — finer-grained than
  // the marketing/onboarding scale above, and named by literal size+weight
  // since none of it maps onto the existing named steps. See
  // design-system.md §8. Named `*Figure` styles are money/data figures:
  // Plus Jakarta Sans with tabular numerals — never JetBrains Mono
  // (PLAN.md THEME-02), even though Figma's frames specify it.
  text10Bold: TypographyStyle;
  text10p5Regular: TypographyStyle;
  text10p5Bold: TypographyStyle;
  text10p5SemiBoldWide: TypographyStyle;
  text11Regular: TypographyStyle;
  text11SemiBold: TypographyStyle;
  text11Bold: TypographyStyle;
  text11p5Regular: TypographyStyle;
  text11p5SemiBold: TypographyStyle;
  text12Medium: TypographyStyle;
  /** Payments screen subtitle/beneficiary-bank text (232:7330, 232:7399). */
  text12Regular: TypographyStyle;
  /** Payments screen "History"/chip/"Send" button labels (232:7317, 232:7344, 232:7403). */
  text12Bold: TypographyStyle;
  /** Loan screen "Active Loan" label (236:11502); Savings screen hero-card column labels (239:14648, 239:14656, 239:14664). */
  text12SemiBold: TypographyStyle;
  text12BoldWide: TypographyStyle;
  text13Medium: TypographyStyle;
  text13SemiBold: TypographyStyle;
  text13Bold: TypographyStyle;
  /** Savings screen goal-card "% of goal" figure (239:14698); fixed-deposit-card title (239:14792). */
  text13ExtraBold: TypographyStyle;
  text13ExtraBoldFigure: TypographyStyle;
  text13p5SemiBold: TypographyStyle;
  text14ExtraBold: TypographyStyle;
  text14BoldFigure: TypographyStyle;
  text15Bold: TypographyStyle;
  /** Payments screen beneficiary-avatar initials (232:7392). */
  text15ExtraBold: TypographyStyle;
  /** Payments screen "Send Money" hero-card title (232:7327). */
  text16ExtraBold: TypographyStyle;
  text15BoldFigure: TypographyStyle;
  text18ExtraBold: TypographyStyle;
  /** Tab-root page headings — "Payments"/"Loans"/"Savings" (232:7308 and siblings). */
  text22ExtraBold: TypographyStyle;
  /** Loan screen "Outstanding" amount (236:11517). */
  text20ExtraBoldFigure: TypographyStyle;
  /** Savings screen fixed-deposit "Principal" figure (239:14807). */
  text16ExtraBoldFigure: TypographyStyle;
  /** Savings screen "Total in Savings" hero figure (239:14651). */
  text28ExtraBoldFigure: TypographyStyle;
  /** Add Money screen's account-number figure (228:3786). */
  text28ExtraBoldFigureWide: TypographyStyle;
  text30ExtraBoldFigure: TypographyStyle;
  /** Option labels on the Source of Income Yes/No toggle (226:2137) and success-card rows (226:2349). */
  text14Medium: TypographyStyle;
  /** Success-screen headline — "You're all set!" / "Identity Verified!" (226:2336, 226:2752). */
  text28ExtraBold: TypographyStyle;
  /** Uppercase eyebrow on the success-screen card — "YOU CAN LOGIN WITH" / "NEXT UP" (226:2343). */
  text11BoldWide: TypographyStyle;
  /** Headline on the dark biometric/face screens (226:2724, 226:1914). */
  text19Bold: TypographyStyle;
  /** NIN entry digits (226:1863, bound `amount-rg`) — Plus Jakarta Sans per the no-JetBrains-Mono decision. */
  text20RegularWide: TypographyStyle;
  /** Emoji glyphs on PEP option cards (226:2055). */
  emojiLarge: TypographyStyle;
  /** Emoji glyphs on success-screen card rows (226:2347, 226:2763). */
  emojiMedium: TypographyStyle;
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
  /** Vertical gap between stacked AuthBtn actions on the dark auth screens (Figma 226:1445, 226:1514 footer). */
  authActions: number;
  /** Full-screen NumPad side inset from the screen edge (Figma 226:1596 px14 + 226:1597 px4). */
  keypadX: number;
}

export interface RadiusScale {
  xs: number;
  sm: number;
  md: number;
  input: number;
  button: number;
  /** Resolves the "radius-lg ambiguity" design-system.md previously flagged as unresolved — confirmed 2026-09-20 via bound variable `Alias/borderradius/lg` and live usage on GetStarted's `AuthBtn` (226:1446). Distinct from `card` (20px), not a duplicate. */
  lg: number;
  card: number;
  sheet: number;
  full: number;
  /** Small logo mark corner (Figma HomeScreen 226:2865, "Image (Parc)" 22x22). */
  logo: number;
  /** Small chip/icon buttons — eye-toggle, copy button (226:3127, 226:3144). */
  chip: number;
  /** 40px circular icon buttons — bell, avatar, loan-teaser icon (226:2898, 226:2903, 226:2988). */
  avatar: number;
  /** 52px quick-action buttons and the loan-teaser card (226:2911, 226:2987). */
  quickAction: number;
  /** The wallet balance card's own corner radius, larger than the standard `card` (226:3106). */
  cardLg: number;
  /** Bound Figma Variable `Alias/borderradius/pad` (17px) — the PIN-pad numeric key radius (226:1598 etc.), distinct from `button`/`card`. */
  pad: number;
  /** Selectable option card (PEP 226:2053) — 18px. */
  option: number;
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
  /** Glyphs inline with caption/body text (hint chips, text links). */
  inline: number;
  /** Back-button arrow glyph (Figma 226:1472). */
  nav: number;
  compact: number;
  default: number;
  large: number;
}

export interface BorderWidths {
  /** Heavy underline under hero amount inputs (Figma 237:12845). */
  strong: number;
  /** Plain 1px border — the dark auth screens' translucent pill badges (226:1435). */
  hairline: number;
  thin: number;
  /** OTP box border (226:2399 etc.) — confirmed 2px, distinct from the app-wide 1.5px `thin` convention. */
  otpBox: number;
}

export interface ControlHeights {
  /** Rounded-square back chip (Figma BackButton 226:1471) — 44, distinct from the 48 generic iconButton. */
  backButton: number;
  /** In-app BackHeader tile (Figma 237:12833) — 38, smaller than the onboarding back chip. */
  backButtonCompact: number;
  buttonLarge: number;
  buttonMedium: number;
  buttonSmall: number;
  /** Figma's "AuthBtn" pattern (226:1446) — the full-bleed dark auth-flow screens' own button height, distinct from the standard Button component's 3 sizes. */
  authButton: number;
  iconButton: number;
  iconButtonLarge: number;
  iconButtonXl: number;
  input: number;
  /** Hero icon tile above onboarding headings (226:1847) — 52px. */
  iconTile: number;
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
  /** rgba() at the Figma-confirmed 13% alpha, not a solid hex — see componentStyles.ts. */
  borderColor: string;
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
  /**
   * The wallet balance card's dark gradient (Figma HomeScreen 226:3106):
   * `linear-gradient(150.78deg, #0A0A0A 6.17%, #1A1A1A 58.77%, #000000 93.83%)`.
   * `start`/`end` are an approximation of the CSS angle as an
   * expo-linear-gradient vector — not pixel-exact, same "close enough"
   * caveat as elevation's Android conversion.
   */
  walletCard: {
    gradientColors: readonly [HexColor, HexColor, HexColor];
    gradientLocations: readonly [number, number, number];
    gradientStart: { x: number; y: number };
    gradientEnd: { x: number; y: number };
    radius: number;
    shadow: ShadowStyle;
  };
  /** Figma "PINDots"/"NumPad" (226:1583-226:1642) — confirmed 2026-09-20. `dotBorderColor` (#D9D9D9) is a genuine one-off not matching any SemanticColors entry, kept here rather than added as a general-purpose color token. */
  pinPad: {
    dotSize: number;
    dotBorderWidth: number;
    dotBorderColor: HexColor;
    dotFilledColor: HexColor;
    keyBackground: HexColor;
    keyRadius: number;
  };
  /**
   * White-alpha surfaces on the full-bleed dark onboarding screens
   * (Biometric 226:2690, FaceVerification 226:1878). Mode-independent:
   * these screens are dark in both themes.
   */
  onMedia: {
    buttonBackground: string;
    buttonBorder: string;
    segmentTrack: string;
    segmentActive: string;
    segmentInactiveText: string;
    ringBackground: string;
    ringBorder: string;
    ringIcon: string;
    glow: string;
    /** Scan-target ring (226:2733) and its glyph (226:2735). */
    ringSize: number;
    ringIconSize: number;
    /** Fingerprint/Face ID segmented control (226:2715). */
    segmentHeight: number;
    segmentRadius: number;
    segmentInset: number;
  };
  /** Ringed hero badge on onboarding success screens — dark (PasscodeSuccess 226:2328) and success (FaceVerified 226:2745). */
  successHero: Record<
    "dark" | "success",
    { gradient: readonly [string, string]; iconColor: string; innerRing: string; outerRing: string; size: number; iconSize: number }
  >;
  /** Selectable option card + radio (PEP 226:2053, Income toggle 226:2135). */
  optionCard: {
    backgroundColor: HexColor;
    borderColor: HexColor;
    selectedBorderColor: HexColor;
    selectedBackgroundColor: HexColor;
    radioBorderColor: HexColor;
    radioSelectedColor: HexColor;
    radioSize: number;
    radioDotSize: number;
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
  borderWidth: BorderWidths;
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
