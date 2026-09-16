import { applyTenantOverrides, validateTenantThemeOverrides } from "../tenantTheme";
import { defaultTheme } from "../themes/defaultTheme";

describe("validateTenantThemeOverrides", () => {
  it("returns empty results for null/undefined/non-object input", () => {
    expect(validateTenantThemeOverrides(null)).toEqual({ overrides: {}, rejectedKeys: [] });
    expect(validateTenantThemeOverrides(undefined)).toEqual({ overrides: {}, rejectedKeys: [] });
  });

  it("accepts valid allowlisted overrides", () => {
    const { overrides, rejectedKeys } = validateTenantThemeOverrides({
      primary: "#123456",
      secondary: "#ABCDEF",
      buttonRadius: 8,
      logoLightUrl: "https://cdn.example.com/logo.png",
    });

    expect(overrides).toEqual({
      primary: "#123456",
      secondary: "#ABCDEF",
      buttonRadius: 8,
      logoLightUrl: "https://cdn.example.com/logo.png",
    });
    expect(rejectedKeys).toEqual([]);
  });

  it("rejects malformed values per key without throwing", () => {
    const { overrides, rejectedKeys } = validateTenantThemeOverrides({
      primary: "not-a-color",
      buttonRadius: 9999,
      logoLightUrl: "javascript:alert(1)",
    });

    expect(overrides).toEqual({});
    expect(rejectedKeys.sort()).toEqual(["buttonRadius", "logoLightUrl", "primary"]);
  });

  it("drops unknown keys, including prototype-pollution attempts, silently", () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"polluted": true}, "notAllowed": "x"}');
    const { overrides, rejectedKeys } = validateTenantThemeOverrides(malicious);

    expect(overrides).toEqual({});
    expect(rejectedKeys).toEqual([]);
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("applyTenantOverrides", () => {
  it("only changes allowlisted tokens and leaves everything else identical to the base theme", () => {
    const branded = applyTenantOverrides(defaultTheme, { primary: "#123456", buttonRadius: 8 });

    expect(branded.colors.primary).toBe("#123456");
    expect(branded.radii.button).toBe(8);

    // Untouched tokens are preserved exactly, including security/accessibility-relevant ones.
    expect(branded.colors.error).toBe(defaultTheme.colors.error);
    expect(branded.colors.textDisabled).toBe(defaultTheme.colors.textDisabled);
    expect(branded.control).toBe(defaultTheme.control);
    expect(branded.typography).toBe(defaultTheme.typography);
  });

  it("rebuilds component style recipes so branded colors propagate into buttons/cards", () => {
    const branded = applyTenantOverrides(defaultTheme, { primary: "#123456", cardRadius: 6 });

    expect(branded.components.button.primary.default.backgroundColor).toBe("#123456");
    expect(branded.components.card.radius).toBe(6);
  });

  it("is a no-op when given empty overrides", () => {
    const result = applyTenantOverrides(defaultTheme, {});
    expect(result.colors).toEqual(defaultTheme.colors);
    expect(result.radii).toEqual(defaultTheme.radii);
  });
});
