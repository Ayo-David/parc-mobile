import { buildComponentStyles } from "./componentStyles";
import { isValidHexColor, readableTextOn } from "./colorUtils";
import type { HexColor, ParcTheme, TenantThemeOverrides, UnvalidatedTenantThemeInput } from "./types";

const MIN_RADIUS = 0;
const MAX_RADIUS = 64;
const MAX_URL_LENGTH = 2048;

export interface TenantThemeValidationResult {
  overrides: TenantThemeOverrides;
  rejectedKeys: string[];
}

function isPlausibleHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL_LENGTH) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isPlausibleRadius(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= MIN_RADIUS && value <= MAX_RADIUS;
}

const COLOR_KEYS = ["primary", "primaryHover", "primarySubtle", "secondary", "secondarySubtle", "surface", "surfaceAlt"] as const;
const RADIUS_KEYS = ["buttonRadius", "cardRadius"] as const;
const URL_KEYS = ["logoLightUrl", "logoDarkUrl"] as const;

/**
 * Validates untrusted tenant branding input (e.g. from a bootstrap API
 * response) against an explicit allowlist. Builds a brand-new plain object
 * key by key rather than spreading the input, so unknown/extra keys
 * (including `__proto__`/`constructor`/`prototype`) are silently dropped
 * rather than merged — this function cannot be used to pollute a
 * prototype or inject arbitrary style properties. Any key present in the
 * input but failing its type/format/range check is reported in
 * `rejectedKeys` and excluded from `overrides`, so a malformed remote
 * config degrades gracefully to platform defaults for that property
 * instead of breaking rendering.
 */
export function validateTenantThemeOverrides(input: UnvalidatedTenantThemeInput | null | undefined): TenantThemeValidationResult {
  const overrides: TenantThemeOverrides = {};
  const rejectedKeys: string[] = [];

  if (input === null || input === undefined || typeof input !== "object") {
    return { overrides, rejectedKeys };
  }

  for (const key of COLOR_KEYS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (isValidHexColor(value)) {
      overrides[key] = value as HexColor;
    } else {
      rejectedKeys.push(key);
    }
  }

  for (const key of RADIUS_KEYS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (isPlausibleRadius(value)) {
      overrides[key] = value;
    } else {
      rejectedKeys.push(key);
    }
  }

  for (const key of URL_KEYS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (isPlausibleHttpsUrl(value)) {
      overrides[key] = value;
    } else {
      rejectedKeys.push(key);
    }
  }

  return { overrides, rejectedKeys };
}

/**
 * Deterministically applies validated tenant overrides on top of a base
 * theme (defaultTheme or darkTheme). Only the fields declared on
 * TenantThemeOverrides can change — status colors, text colors, spacing,
 * typography, control heights, and every other token are always taken
 * from the base theme, so a tenant can never weaken an accessibility or
 * security-relevant token even if `overrides` somehow contained one.
 * Component style recipes are rebuilt from the merged colors so branded
 * buttons/status chips/cards reflect the tenant's palette correctly.
 *
 * Tenant colors are authored against the light theme, so on a dark base
 * only `secondary` (the brand accent) is applied: a tenant's dark `primary`
 * would vanish against a dark background, and its pastel subtle/surface
 * colors would turn dark-mode surfaces light. `onPrimary` is re-derived
 * whenever `primary` changes so button labels stay legible.
 */
export function applyTenantOverrides(baseTheme: ParcTheme, overrides: TenantThemeOverrides): ParcTheme {
  const isLight = baseTheme.mode === "light";
  const primary = isLight ? overrides.primary : undefined;
  const colors = {
    ...baseTheme.colors,
    ...(primary !== undefined && { primary, onPrimary: readableTextOn(primary) }),
    ...(isLight && overrides.primaryHover !== undefined && { primaryHover: overrides.primaryHover }),
    ...(isLight && overrides.primarySubtle !== undefined && { primarySubtle: overrides.primarySubtle }),
    ...(overrides.secondary !== undefined && { secondary: overrides.secondary }),
    ...(isLight && overrides.secondarySubtle !== undefined && { secondarySubtle: overrides.secondarySubtle }),
    ...(isLight && overrides.surface !== undefined && { surface: overrides.surface }),
    ...(isLight && overrides.surfaceAlt !== undefined && { surfaceAlt: overrides.surfaceAlt }),
  };

  const radii = {
    ...baseTheme.radii,
    ...(overrides.buttonRadius !== undefined && { button: overrides.buttonRadius }),
    ...(overrides.cardRadius !== undefined && { card: overrides.cardRadius }),
  };

  const branding =
    overrides.logoLightUrl !== undefined || overrides.logoDarkUrl !== undefined
      ? {
          ...baseTheme.branding,
          ...(overrides.logoLightUrl !== undefined && { logoLightUrl: overrides.logoLightUrl }),
          ...(overrides.logoDarkUrl !== undefined && { logoDarkUrl: overrides.logoDarkUrl }),
        }
      : baseTheme.branding;

  return {
    ...baseTheme,
    colors,
    radii,
    components: buildComponentStyles(colors, radii, baseTheme.mode),
    branding,
  };
}
