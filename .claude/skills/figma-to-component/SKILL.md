---
name: figma-to-component
description: Converts a given Figma node into a clean, reusable, multi-tenant-safe React Native component for the Parc mobile app, following the project's theme guardrails and avoiding duplicate one-off styles.
---

# Figma -> Parc Component Playbook

Use this whenever you're given a new Figma node/URL and asked to turn it into a React Native component or screen for parc-mobile.

## 1. Read before you build
1. Call get_metadata on the node first if it might be large (previous Parc Figma nodes have returned 150KB-350KB dumps) -- page through any saved file rather than requesting get_design_context on an oversized parent node directly.
2. Load the figma-design-to-code skill before any get_design_context call (mandatory).
3. Prefer get_screenshot for a cheap visual pass before spending a get_design_context call; only fetch full design context for the specific leaf screen/component you're about to build.

## 2. Check for an existing match before creating anything new
1. Search parc-mobile/src/components/ and parc-mobile/src/features/*/components/ for an existing component that already covers this pattern (by visual shape, not just name -- Figma layer names in this file are inconsistent, e.g. "AuthBtn" vs "ParcButton" for the same concept).
2. Search parc-mobile/src/theme/componentStyles.ts for an existing typed recipe (button variant, input state, status tone, card) that already matches.
3. If a close match exists, extend it (new variant/prop) rather than duplicating the component.

## 3. Map every visual value to a token -- never inline
1. Colors -> theme.colors.* (never a literal hex). If the Figma value doesn't match an existing semantic token, that's a signal to ask whether it's a genuinely new semantic token or a Figma inconsistency (this file has had real internal naming/labeling inconsistencies before -- e.g. "Cable & TV" vs "TV" vs "TV Subscription" for the same screen, or the amount-font contradiction between Plus Jakarta Sans and JetBrains Mono, resolved in favor of Plus Jakarta Sans -- confirm the canonical answer before hardcoding it into a component).
2. Spacing/sizing -> theme.spacing.* / theme.semanticSpacing.* / theme.control.* / theme.icon.*.
3. Radii -> theme.radii.*. Shadows -> theme.elevation.*.
4. Typography -> a named theme.typography.* style, never raw fontSize/fontWeight.
5. If a needed token doesn't exist yet, add it to the appropriate src/theme/*.ts file first (cite the Figma node id in a comment), then consume it. Do not inline the raw value "temporarily."
6. This project's .clauderules enforces all of the above outside src/theme/ -- treat it as a hard constraint, not a suggestion.

## 4. Build for multi-tenant safety
1. Never hardcode a specific tenant's brand color, logo, or copy inside a component. If branding needs to vary, it must already be flowing through theme.colors.primary/secondary/branding.* -- components read theme, they don't special-case a tenant.
2. Never special-case a tenant by ID/slug inside UI code. Tenant differences are theme differences, not branching logic.

## 5. Structure
1. One component = one purpose. A screen composes existing shared components (Button, Input, Card, StatusBadge, BottomSheet, PinPad, etc.) from src/components/; it does not redefine their visuals inline.
2. Server-driven or authoritative data (fees, balances, eligibility, limits) is never computed in the component -- it's passed in as already-resolved props from a query hook. Components render; they don't calculate money.
3. Strict TypeScript: no any; props typed explicitly; reuse existing shared prop types from src/theme/types.ts (ButtonVariant, InputState, StatusTone, etc.) instead of re-declaring string unions.

## 6. When the Figma source is incomplete
Some flows only have a partial set of screens (e.g. no success/receipt, no error/empty/loading states, no token-reveal screen). When that happens:
1. Look for an existing analogous, already-complete screen in the same file (e.g. another product's Success screen, another list's Empty state) and mirror its layout and copy tone rather than inventing new visual language.
2. Compose the missing state from the existing Feedback-section components already documented in docs/theme/README.md's token audit (SuccessState `20:3202`, ErrorState `20:3224`, EmptyState `20:3145`, LoadingSpinner `20:3166`, SkeletonTransactionRow `20:3172`-`20:3188`) rather than designing a new pattern from scratch.
3. State explicitly, in your output, which gap you filled and which existing component/screen you mirrored -- never silently invent and never silently guess.

## 7. Before calling it done
1. No literal hex/spacing/typography values outside src/theme/ (grep-check per .clauderules).
2. Component renders correctly under both a default-theme and a tenant-override-theme (spot check by temporarily passing a tenantBranding override, then remove it -- don't leave test branding wired into the provider).
3. If the Figma source had a naming inconsistency, a missing state, or a catalog that might actually need to be dynamic rather than fixed, note it explicitly in your output rather than silently guessing -- these have come up repeatedly in this file (see docs/theme/README.md "Still open" for prior examples) and are worth flagging to product/design.
