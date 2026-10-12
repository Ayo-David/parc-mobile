import { fontFamilies } from "./primitives";
import type { Typography } from "./types";

/**
 * Type scale reconciled 2026-09-19 (see design-system.md §3.1/§3.2) from
 * three disagreeing Figma sources, in priority order:
 *   1. Bound Figma Variables read off production frames via get_variable_defs
 *      (226:1407) — literal values the file actually binds, not a summary
 *      or a sample. Used for h2, button, bodyMedium, bodySmall, caption,
 *      label (all confirmed bound this pass).
 *   2. The live rendered type specimens (node 20:369) — used wherever no
 *      bound variable was found (h1, h3, h4, bodyLarge, buttonLarge/Small):
 *      uniform 1.2 line-height ratio, uniform -0.01em letter-spacing
 *      (buttons use a 1.5 ratio per their own sizing specimens 20:1687-94).
 *   3. The "Design Tokens" summary box (20:3663) — no longer used; it
 *      disagreed with both of the above, including on letter-spacing sign.
 * `fontFamily` is the exact per-weight loaded font name (see
 * primitives.ts) — React Native selects between separately-loaded static
 * TTFs by family name, not by a numeric `fontWeight` on a shared family.
 */
export const typography: Typography = {
  display: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -0.035 * 48,
  },
  h1: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: -0.01 * 32,
  },
  // Bound Figma Variable `Alias/typography/h2`: 28/34/-0.24 — supersedes
  // both the summary box (33.6/-0.42) and the uniform-specimen guess.
  h2: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.24,
  },
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.01 * 24,
  },
  h4: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.01 * 20,
  },
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 18,
    lineHeight: 21.6,
    letterSpacing: -0.01 * 18,
  },
  // Bound Figma Variable `Alias/typography/body-md`: 16/23.5/0.
  bodyMedium: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 23.5,
    letterSpacing: 0,
  },
  // Bound Figma Variable `Alias/typography/body-sm`: 14/19/0.
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  // Bound Figma Variable `Alias/typography/caption`: 12/18/0.
  caption: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // Bound Figma Variable `Alias/typography/label`: 14/20/+0.16.
  label: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.16,
  },
  // Bound Figma Variable `Alias/typography/button`: 16/22/-0.16.
  button: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  // No bound variable found for the Large/Small button sizes — using the
  // sizing specimens' 1.5 ratio (20:1687-94), not bound-variable-confirmed.
  buttonLarge: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: -0.01 * 18,
  },
  buttonSmall: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.01 * 14,
  },
  // Plus Jakarta Sans is authoritative for financial amounts and data
  // (confirmed decision superseding the amount-xl token's original
  // JetBrains Mono spec in Figma). See docs/theme/README.md.
  amountXl: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.02 * 40,
  },
  // Bound Figma Variable `Alias/typography/display2`: 44/48/-1.54 — the
  // GetStarted hero headline (226:1430), distinct from `display` (48px).
  display2: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.54,
  },
  // Bound Figma Variable `Alias/typography/display3`: 36/40/0 — SignIn's
  // "Welcome back." headline (226:1479).
  display3: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 0,
  },
  // Bound Figma Variable `Alias/typography/body-mdd`: 15/22.5/0.
  text15Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 22.5,
    letterSpacing: 0,
  },
  // SignIn's "OR SIGN IN WITH" divider label (226:1486).
  text12SemiBoldWide: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.48,
  },
  // SignIn's "New to Parc? Create account" footer (226:1513).
  text14Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
  },
  text14Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
  },
  // Bound Figma Variable `Alias/typography/pad-button`: 26/39/-0.16.
  padButton: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 26,
    lineHeight: 39,
    letterSpacing: -0.16,
  },
  // Bound Figma Variable `Alias/typography/body-bd`: 14/19/0.
  text14BoldCompact: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  text30ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 30,
    lineHeight: 34.5,
    letterSpacing: -0.84,
  },
  text16Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  text13Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
  text15RegularMono: {
    fontFamily: fontFamilies.mono,
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 22.5,
    letterSpacing: 0.75,
  },
  text8MediumWide: {
    fontFamily: fontFamilies.medium,
    fontWeight: "500",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 0.64,
  },

  // --- Dashboard-density scale (Figma HomeScreen 226:2865) ---
  // Every value below is a literal from that frame's `get_design_context`
  // pull, not a bound Figma Variable (unlike h2/button/body-*/caption/label
  // above) — these are one-off sizes on individual text layers. Per
  // .clauderules they still get named tokens rather than inline literals.
  text10Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0,
  },
  text10p5Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 10.5,
    lineHeight: 15.75,
    letterSpacing: 0,
  },
  text10p5Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 10.5,
    lineHeight: 15.75,
    letterSpacing: 0,
  },
  // "PARC MFB" label — uppercase applied via textTransform at the call site.
  text10p5SemiBoldWide: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 10.5,
    lineHeight: 15.75,
    letterSpacing: 0.63,
  },
  text11Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 11,
    lineHeight: 16.5,
    letterSpacing: 0,
  },
  // GetStarted's security/speed badges (226:1439, 226:1444).
  text11SemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 16.5,
    letterSpacing: 0,
  },
  text11Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 16.5,
    letterSpacing: 0,
  },
  text11p5Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 11.5,
    lineHeight: 17.25,
    letterSpacing: 0,
  },
  text11p5SemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 11.5,
    lineHeight: 13.8,
    letterSpacing: 0,
  },
  text12Medium: {
    fontFamily: fontFamilies.medium,
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // Payments screen (232:7330 subtitle, 232:7399 beneficiary bank name).
  text12Regular: {
    fontFamily: fontFamilies.regular,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // Payments screen (232:7317 "History" label, 232:7344 bill-category chip labels, 232:7403 "Send" button label).
  text12Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // Loan screen "Active Loan" label (236:11502); Savings screen "Total in Savings"/"Target Savings"/"Fixed Deposits" column labels (239:14648, 239:14656, 239:14664).
  text12SemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // "PARC WALLET" label — uppercase applied via textTransform at the call site.
  text12BoldWide: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.72,
  },
  text13Medium: {
    fontFamily: fontFamilies.medium,
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
  },
  text13SemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
  },
  text13Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
  },
  // Savings screen goal-card "% of goal" figure (239:14698); fixed-deposit-card title (239:14792).
  text13ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
  },
  // JetBrains Mono restored 2026-09-20 (design-system.md §8) — confirmed
  // live in the Figma production frame, not just the `digit-bd`/`amount-rg`
  // bound variables.
  text13ExtraBoldMono: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
  },
  text13p5SemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontWeight: "600",
    fontSize: 13.5,
    lineHeight: 20.25,
    letterSpacing: 0,
  },
  text14ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
  },
  // JetBrains Mono restored — see text13ExtraBoldMono note above.
  text14BoldMono: {
    fontFamily: fontFamilies.mono,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
  },
  text15Bold: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 22.5,
    letterSpacing: 0,
  },
  // Payments screen beneficiary-avatar initials (232:7392).
  text15ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 15,
    lineHeight: 22.5,
    letterSpacing: 0,
  },
  // Payments screen "Send Money" hero-card title (232:7327).
  text16ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
  },
  // JetBrains Mono restored — see text13ExtraBoldMono note above.
  text15BoldMono: {
    fontFamily: fontFamilies.mono,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 22.5,
    letterSpacing: 0.6,
  },
  text18ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: -0.36,
  },
  // Tab-root page headings — "Payments" (232:7308), "Loans" (236:11467-ish), "Savings" (239:...).
  text22ExtraBold: {
    fontFamily: fontFamilies.extraBold,
    fontWeight: "800",
    fontSize: 22,
    lineHeight: 33,
    letterSpacing: -0.44,
  },
  // Loan screen "Outstanding" amount (236:11517) — JetBrains Mono, see text13ExtraBoldMono note above.
  text20ExtraBoldMono: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0,
  },
  // Savings screen fixed-deposit "Principal" figure (239:14807) — JetBrains Mono.
  text16ExtraBoldMono: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  // Savings screen "Total in Savings" hero figure (239:14651) — JetBrains Mono.
  text28ExtraBoldMono: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: -0.56,
  },
  // Add Money screen's account-number figure (228:3786) — JetBrains Mono, wide positive tracking (for readability of a number meant to be copied), distinct from text28ExtraBoldMono's negative tracking.
  text28ExtraBoldMonoWide: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: 1.12,
  },
  // JetBrains Mono restored — see text13ExtraBoldMono note above.
  text30ExtraBoldMono: {
    fontFamily: fontFamilies.monoExtraBold,
    fontWeight: "800",
    fontSize: 30,
    lineHeight: 45,
    letterSpacing: -0.9,
  },
};
