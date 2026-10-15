import { readableTextOn } from "../colorUtils";
import { darkTheme } from "../themes/darkTheme";
import { defaultTheme } from "../themes/defaultTheme";

describe("darkTheme", () => {
  it("is a distinct palette, not a copy of the light theme", () => {
    expect(darkTheme.mode).toBe("dark");
    expect(darkTheme.colors.background).not.toBe(defaultTheme.colors.background);
    expect(darkTheme.colors.textPrimary).not.toBe(defaultTheme.colors.textPrimary);
    expect(darkTheme.components.status.success.backgroundColor).not.toBe(defaultTheme.components.status.success.backgroundColor);
  });

  it.each([
    ["light", defaultTheme],
    ["dark", darkTheme],
  ] as const)("pairs primary with a legible onPrimary in %s mode", (_mode, theme) => {
    expect(theme.colors.onPrimary).toBe(readableTextOn(theme.colors.primary));
    expect(theme.components.button.primary.default.textColor).toBe(theme.colors.onPrimary);
  });

  it("keeps the wallet card dark in both modes so textInverse stays readable on it", () => {
    for (const theme of [defaultTheme, darkTheme]) {
      for (const stop of theme.components.walletCard.gradientColors) {
        expect(readableTextOn(stop)).toBe("#FFFFFF");
      }
    }
  });

  it("keeps always-dark media chrome black in both modes", () => {
    expect(darkTheme.colors.mediaBackground).toBe(defaultTheme.colors.mediaBackground);
  });
});
