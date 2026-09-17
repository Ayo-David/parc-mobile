# Parc Mobile Theme

Source of truth for the `src/theme/` design-system foundation: where its values came from, how to use it, and what's still open. See `PLAN.md` at the repo root for the full implementation plan this theme feeds into.

## Usage

```tsx
import { ThemeProvider, useTheme } from "@/theme";

function Root() {
  return (
    <ThemeProvider tenantBranding={bootstrapResponse.branding}>
      <App />
    </ThemeProvider>
  );
}

function Balance() {
  const { theme } = useTheme();
  return <Text style={theme.typography.amountXl}>...</Text>;
}
```

Never import `theme/tokens.ts`, `theme/primitives.ts`, `theme/spacing.ts`, or `theme/typography.ts` directly outside `src/theme/` — always go through `useTheme()`. This is enforced by `parc-mobile/.clauderules`.

## Source

Figma file `9auGumDGNDtTwJ5XOgDr8K` ("parc_logo"), node `20:21` ("Complete Fintech Design System"), extracted via the Figma MCP (`get_metadata` + targeted `get_design_context`/`get_screenshot` on its child sections) and cross-checked against its own "Design Tokens" CSS-variable section as the canonical source. No Figma Variables (native variable/mode bindings) exist anywhere in the file — every value below is a literal read off a layer fill or a token-summary text label, not a bound design token.

## Token audit

| Figma token/style | Local token | Value | Mode | Status | Notes |
|---|---|---|---|---|---|
| `--color-primary` | `colors.primary` | `#000000` | light (only mode) | Mapped | |
| `--color-primary-hover` | `colors.primaryHover` | `#1A1A1A` | light | Mapped | |
| `--color-primary-subtle` | `colors.primarySubtle` | `#F5F5F5` | light | Mapped | |
| `--color-secondary` | `colors.secondary` | `#E615CA` | light | Mapped | |
| `--color-secondary-subtle` | `colors.secondarySubtle` | `#FDF0FC` | light | Mapped | |
| `--color-bg` | `colors.background` | `#F7F7F7` | light | Mapped | |
| `--color-surface` | `colors.surface` | `#FFFFFF` | light | Mapped | |
| Surface Alt (Color System section) | `colors.surfaceAlt` | `#FAFAFA` | light | Mapped | Not in the canonical Design Tokens box; taken from the Color System section swatch. |
| `--color-text-primary` | `colors.textPrimary` | `#0A0A0A` | light | Mapped | |
| `--color-text-secondary` | `colors.textSecondary` | `#4A4A4A` | light | Mapped | |
| `--color-text-muted` | `colors.textMuted` | `#8C8C8C` | light | Mapped | |
| `--color-text-disabled` | `colors.textDisabled` | `#C2C2C2` | light | Mapped | |
| (none — inverse text not separately tokened in Figma) | `colors.textInverse` | `#FFFFFF` | light | Requires confirmation | Inferred (white-on-dark-surface text), not an explicit Figma token. |
| `--color-border` | `colors.border` | `#EBEBEB` | light | Mapped | |
| Divider (Color System section) | `colors.divider` | `#F2F2F2` | light | Mapped with renamed semantics | Distinct from Border in Figma; confirm both are intentionally different, not a stale duplicate. |
| Border Focus (Color System section) | `colors.borderFocus` | `#000000` | light | Mapped | |
| Border Error (Color System section) | `colors.borderError` | `#E84040` | light | Mapped | Equals `colors.error`. |
| `--color-success` | `colors.success` | `#00C896` | light | Mapped | |
| `--color-warning` | `colors.warning` | `#F5A623` | light | Mapped | |
| `--color-error` | `colors.error` | `#E84040` | light | Mapped | |
| `--color-info` | `colors.info` | `#4A90E2` | light | Mapped | |
| (none) | `colors.overlay` | `rgba(10,10,10,0.4)` | light | Missing in Figma | Provisional — no explicit overlay/scrim swatch exists in the file. |
| (none) | `colors.scrim` | `rgba(10,10,10,0.6)` | light | Missing in Figma | Same as above. |
| (none — no dark-mode group exists) | `themes/darkTheme.ts` | identical to light | — | Missing in Figma | Architecturally wired (mode-aware context, `useColorScheme`) but currently an identity fallback; do not treat as a real dark theme. |
| Display / H1–H4 / Body L/M/S / Caption / Label / Button / Amount-XL | `typography.*` | see `typography.ts` | light | Mapped | Letter-spacing uses the em figures from the Design Tokens summary (treated as authoritative over the px figures shown on individual type samples, which don't always convert 1:1). |
| `amount-xl` font family | `typography.amountXl.fontFamily` | Plus Jakarta Sans | — | **Resolved** | Figma's own token spec originally said JetBrains Mono; a separate design note in the same file said amounts should move to Plus Jakarta Sans. **Confirmed decision: Plus Jakarta Sans, not Mono, for all amounts and data.** `fontFamilies.mono` has been removed from `primitives.ts`. |
| Font files (Plus Jakarta Sans, all weights) | `primitives.ts` `fontFamilies.sans` | — | — | Missing locally | No `.ttf`/`.otf` file exists in this repo yet (no `assets/fonts/`, no `expo-font` `useFonts` call). Resolves to the OS system font until the real files are added — get them and wire `expo-font` before shipping. |
| `--space-*` (screen-x/section/card/component/form/list) | `semanticSpacing.*` | 20/40/20/16/12/12 | — | Mapped | |
| 4px base spacing scale | `spacing.*` | 0/4/8/12/16/20/24/32/40 | — | Mapped | |
| `radius-xs/sm/md/input/button/card/sheet/full` | `radii.*` | 4/8/12/12/14/20/28/9999 | — | Mapped | |
| `radius-lg` (16px), `radius-xl` (20px) | — (not encoded) | — | — | Deprecated / ambiguous | Appear in the "Spacing & Shape" showcase section but are absent from the canonical Design Tokens list; `radius-xl` duplicates `radius-card`'s 20px. Deliberately not added as separate tokens — confirm with design if a real distinction is intended. |
| `shadow-xs/sm/md/lg/xl/sheet` | `elevation.*` | see `spacing.ts` | — | Mapped with renamed semantics | React Native has no CSS `box-shadow`; each was translated into `shadowColor/Offset/Opacity/Radius` plus a heuristic Android `elevation` ramp (1/2/4/8/12/16) that is *not* a pixel-exact conversion of the CSS blur/opacity — treat as "close enough." The sheet shadow's negative-Y offset is preserved for iOS; Android has no directional shadow model so it reuses the "lg" ramp. |
| `--duration-fast/base/slow`, `--ease-in-out`, `--ease-spring` | `motion.*` | 140/220/340ms, cubic-bezier arrays | — | Mapped | Bonus tokens (not explicitly requested) kept because the source file defines them; not yet consumed by any component. |
| Icon compact/default/large | `icon.*` | 20/24/28 | — | Mapped | |
| Button Large/Medium/Small, icon button, input, OTP box | `control.*` | 60/52/40/48/56/56/52×60 | — | Mapped | |
| (none) | `control.minTouchTarget` | 44 | — | N/A | Accessibility floor (WCAG/HIG), not a Figma value, not tenant-overridable. |
| `ParcButton` variants/states (node `20:1648` section) | `componentStyles.button.*` | see `componentStyles.ts` | — | Requires confirmation | Assembled from confirmed semantic tokens using conventional solid-primary/outlined-secondary/ghost patterns — the button node IDs were enumerated but not deep-pixel-inspected. Verify against Figma nodes `20:1666`–`20:1780` before treating as final. |
| `TextInput`/`PhoneInput`/etc. states (node `20:1823` section) | `componentStyles.input.*` | see `componentStyles.ts` | — | Requires confirmation | Same caveat; verify against nodes `20:1841`–`20:1989`. |
| `Alert`/status colors (node `20:2976` section) | `componentStyles.status.*` | `withAlpha(color, 0.12)` washes | — | Missing in Figma (background), Mapped (foreground/border) | Subtle status backgrounds are derived programmatically, not read from an explicit Figma swatch. |

## Resolved decisions (superseding earlier open questions)

- **Amount font:** Plus Jakarta Sans, not JetBrains Mono. Applied in `typography.ts`; `fontFamilies.mono` removed from `primitives.ts`.
- **Theme persistence:** `@react-native-async-storage/async-storage` is approved and will back `ThemeStorageAdapter` (see `PLAN.md` MOB-00) — not wired yet, `storage.ts` still defaults to a no-op adapter until that lands.

## Still open

- Real Plus Jakarta Sans font files (all weights used: Regular/SemiBold/Bold/ExtraBold) need to be sourced and added under `assets/fonts/`, then wired via `expo-font`'s `useFonts`.
- Button/input component-style recipes in `componentStyles.ts` are provisional — verify against Figma nodes `20:1666`–`20:1780` (buttons) and `20:1841`–`20:1989` (inputs) before treating as final.
- `overlay`/`scrim` colors and status-tone "subtle" backgrounds are derived via `withAlpha()`, not read from Figma — fine as a default, but not a verified design value.
- `radius-lg`/`radius-xl` ambiguity (see token audit) — confirm with design whether a real distinction from `radius-card` is intended before adding them as tokens.
- Dark mode has no source design at all — `themes/darkTheme.ts` is an identity fallback to light. Do not add dark-specific values without a real Figma dark-mode pass.
