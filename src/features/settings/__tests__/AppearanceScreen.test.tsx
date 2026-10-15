import { act, fireEvent, render, screen } from "@testing-library/react-native";

import AppearanceScreen from "@/app/profile/appearance";
import { ThemeProvider, darkTheme, type ThemeStorageAdapter } from "@/theme";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return { SafeAreaView: View };
});

function createMemoryStorageAdapter(): ThemeStorageAdapter & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
  };
}

async function renderScreen(storage: ThemeStorageAdapter) {
  render(
    <ThemeProvider storageAdapter={storage}>
      <AppearanceScreen />
    </ThemeProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
}

describe("AppearanceScreen", () => {
  it("marks System as selected by default", async () => {
    await renderScreen(createMemoryStorageAdapter());

    expect(screen.getByTestId("appearance-option-system").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByTestId("appearance-option-dark").props.accessibilityState).toEqual({ checked: false });
  });

  it("applies and persists a choice immediately on tap", async () => {
    const storage = createMemoryStorageAdapter();
    await renderScreen(storage);

    fireEvent.press(screen.getByTestId("appearance-option-dark"));

    expect(screen.getByTestId("appearance-option-dark").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByTestId("appearance-option-system").props.accessibilityState).toEqual({ checked: false });
    expect(storage.store.get("parc.theme.preference")).toBe("dark");
    expect(screen.getByTestId("appearance-option-dark")).toHaveStyle({ borderColor: darkTheme.colors.primary });
  });
});
