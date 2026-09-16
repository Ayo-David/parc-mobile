import { act, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ThemeProvider } from "../ThemeProvider";
import type { ThemeStorageAdapter } from "../storage";
import { defaultTheme } from "../themes/defaultTheme";
import { useTheme } from "../useTheme";

function Probe() {
  const { theme, themeMode, tenantRejectedKeys } = useTheme();
  return (
    <>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="mode">{themeMode}</Text>
      <Text testID="rejected">{tenantRejectedKeys.join(",")}</Text>
    </>
  );
}

function createMemoryStorageAdapter(initial: Record<string, string> = {}): ThemeStorageAdapter {
  const store = new Map(Object.entries(initial));
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
  };
}

describe("useTheme", () => {
  it("throws when used outside a ThemeProvider", () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => render(<Probe />)).toThrow("useTheme must be used within a ThemeProvider");
    console.error = originalError;
  });
});

describe("ThemeProvider", () => {
  it("provides the default theme when no tenant branding or persisted preference is given", () => {
    render(
      <ThemeProvider initialPreference="light">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("primary").props.children).toBe(defaultTheme.colors.primary);
    expect(screen.getByTestId("mode").props.children).toBe("light");
    expect(screen.getByTestId("rejected").props.children).toBe("");
  });

  it("applies valid tenant branding and reports rejected keys separately", () => {
    render(
      <ThemeProvider initialPreference="light" tenantBranding={{ primary: "#123456", secondary: "not-a-color" }}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("primary").props.children).toBe("#123456");
    expect(screen.getByTestId("rejected").props.children).toBe("secondary");
  });

  it("falls back to the default theme entirely when tenant branding is empty or invalid", () => {
    render(
      <ThemeProvider initialPreference="light" tenantBranding={{ primary: "invalid" }}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("primary").props.children).toBe(defaultTheme.colors.primary);
  });

  it("hydrates a persisted theme preference from the injected storage adapter", async () => {
    const storage = createMemoryStorageAdapter({ "parc.theme.preference": "dark" });

    render(
      <ThemeProvider storageAdapter={storage}>
        <Probe />
      </ThemeProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("mode").props.children).toBe("dark");
  });
});
