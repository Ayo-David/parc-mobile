import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Appearance, Pressable, Text } from "react-native";

import { ThemeProvider } from "../ThemeProvider";
import type { ThemeStorageAdapter } from "../storage";
import { darkTheme } from "../themes/darkTheme";
import { defaultTheme } from "../themes/defaultTheme";
import type { ThemePreference } from "../types";
import { useTheme } from "../useTheme";

const mockUseColorScheme = jest.fn<"light" | "dark" | null, []>(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

function Probe() {
  const { theme, themeMode, themePreference, setThemePreference, isThemeHydrated, tenantRejectedKeys } = useTheme();
  return (
    <>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="background">{theme.colors.background}</Text>
      <Text testID="mode">{themeMode}</Text>
      <Text testID="preference">{themePreference}</Text>
      <Text testID="hydrated">{String(isThemeHydrated)}</Text>
      <Text testID="rejected">{tenantRejectedKeys.join(",")}</Text>
      {(["system", "light", "dark"] as ThemePreference[]).map((value) => (
        <Pressable key={value} testID={`set-${value}`} onPress={() => setThemePreference(value)} />
      ))}
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

describe("ThemeProvider mode resolution", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("follows the device color scheme when the preference is system", () => {
    mockUseColorScheme.mockReturnValue("dark");
    const { rerender } = render(
      <ThemeProvider initialPreference="system">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode").props.children).toBe("dark");
    expect(screen.getByTestId("background").props.children).toBe(darkTheme.colors.background);

    mockUseColorScheme.mockReturnValue("light");
    rerender(
      <ThemeProvider initialPreference="system">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode").props.children).toBe("light");
    expect(screen.getByTestId("background").props.children).toBe(defaultTheme.colors.background);
  });

  it("defaults to system when nothing is persisted", async () => {
    mockUseColorScheme.mockReturnValue("dark");
    render(
      <ThemeProvider storageAdapter={createMemoryStorageAdapter()}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("hydrated").props.children).toBe("false");
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("hydrated").props.children).toBe("true");
    expect(screen.getByTestId("preference").props.children).toBe("system");
    expect(screen.getByTestId("mode").props.children).toBe("dark");
  });

  it("lets an explicit preference override the device scheme, persists it, and syncs native Appearance", async () => {
    const storage = createMemoryStorageAdapter();
    const setColorScheme = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => {});
    render(
      <ThemeProvider storageAdapter={storage}>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(screen.getByTestId("set-dark"));
    expect(screen.getByTestId("mode").props.children).toBe("dark");
    expect(await storage.getItem("parc.theme.preference")).toBe("dark");
    expect(setColorScheme).toHaveBeenLastCalledWith("dark");

    fireEvent.press(screen.getByTestId("set-system"));
    expect(screen.getByTestId("mode").props.children).toBe("light");
    expect(await storage.getItem("parc.theme.preference")).toBe("system");
    expect(setColorScheme).toHaveBeenLastCalledWith("unspecified");
    setColorScheme.mockRestore();
  });

  it("ignores a corrupt persisted value and still hydrates", async () => {
    render(
      <ThemeProvider storageAdapter={createMemoryStorageAdapter({ "parc.theme.preference": "sepia" })}>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("hydrated").props.children).toBe("true");
    expect(screen.getByTestId("preference").props.children).toBe("system");
  });

  it("still hydrates when storage fails", async () => {
    const failing: ThemeStorageAdapter = {
      getItem: () => Promise.reject(new Error("storage unavailable")),
      setItem: () => Promise.resolve(),
    };
    render(
      <ThemeProvider storageAdapter={failing}>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("hydrated").props.children).toBe("true");
  });
});
