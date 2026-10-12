// Subpath imports (not the package root) so Metro only bundles the weights
// actually used — importing from the root index registers every weight's
// .ttf (including unused Italic variants and 300Light) as an asset.
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
// Restored 2026-09-20 (design-system.md §8) — the wallet dashboard's money
// figures (balance, account number, transaction amounts) are JetBrains Mono
// in the live Figma production frames, not Plus Jakarta Sans; only the
// `amount-xl` documentation token had switched to Sans. Using expo-font's
// generic `useFonts` now that two families are loaded (not either package's
// own re-exported hook, which only knows about its own family).
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono/700Bold";
import { JetBrainsMono_800ExtraBold } from "@expo-google-fonts/jetbrains-mono/800ExtraBold";
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Linking, Platform } from "react-native";

import { useBootstrap } from "@/api/queries/useBootstrap";
import { useProfile } from "@/api/queries/useProfile";
import { ApiError } from "@/api/errors";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/Button/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { useOnboardingStatus } from "@/features/onboarding/useOnboardingStatus";
import { reportError } from "@/observability/reportError";
import { initSentry } from "@/observability/sentry";
import { useSessionStore } from "@/state/stores/sessionStore";
import { ThemeProvider, asyncStorageThemeAdapter } from "@/theme";

initSentry();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider storageAdapter={asyncStorageThemeAdapter}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppGate />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppGate() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
  });
  const bootstrap = useBootstrap();
  const auth = useAuth();
  const onboarding = useOnboardingStatus(auth.isAuthenticated);
  const profile = useProfile();
  const sessionExpired = useSessionStore((state) => state.sessionExpired);
  const setSessionExpired = useSessionStore((state) => state.setSessionExpired);
  // A font-load failure shouldn't block the app — RN falls back to the OS
  // system font for an unresolved fontFamily name, so treat "settled"
  // (loaded or errored) as ready rather than hanging on the splash screen.
  const fontsSettled = fontsLoaded || !!fontError;
  const isReady = fontsSettled && auth.isHydrated && !bootstrap.isLoading && (!auth.isAuthenticated || !onboarding.isLoading);

  useEffect(() => {
    if (fontError) {
      reportError(fontError, { context: "app-font-load" });
    }
  }, [fontError]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  if (bootstrap.isError) {
    const isUpgradeRequired = bootstrap.error instanceof ApiError && bootstrap.error.status === 426;
    return isUpgradeRequired ? (
      <StatusScreenLayout
        icon="cloud-download-outline"
        tone="error"
        title="Update required"
        body="This version of Parc is no longer supported. Please update the app from the store to keep using your account."
        showBackButton={false}
        footer={<Button label="Update now" onPress={() => void Linking.openURL(Platform.OS === "android" ? "https://play.google.com/store/apps/details?id=com.parc.mobile" : "https://apps.apple.com/search?term=Parc")} />}
      />
    ) : (
      <StatusScreenLayout
        icon="alert-circle-outline"
        tone="error"
        title="Something went wrong"
        body="We couldn't reach Parc right now. Check your connection and try again."
        showBackButton={false}
        footer={<Button label="Retry" onPress={() => bootstrap.refetch()} />}
      />
    );
  }

  if (bootstrap.data?.maintenance) {
    return (
      <StatusScreenLayout
        icon="construct-outline"
        tone="error"
        title="Under maintenance"
        body="Parc is temporarily unavailable while we make improvements. Please check back shortly."
        showBackButton={false}
        footer={null}
      />
    );
  }

  if (auth.isAuthenticated && onboarding.isError) {
    return (
      <StatusScreenLayout
        icon="alert-circle-outline"
        tone="error"
        title="Something went wrong"
        body="We couldn't load your account right now. Check your connection and try again."
        showBackButton={false}
        footer={<Button label="Retry" onPress={() => onboarding.refetch()} />}
      />
    );
  }

  if (!auth.isAuthenticated && sessionExpired) {
    return (
      <StatusScreenLayout
        icon="time-outline"
        tone="error"
        title="Session expired"
        body="For your security, you've been signed out after a period of inactivity. Please sign in again to continue."
        showBackButton={false}
        footer={<Button label="Sign in again" onPress={() => setSessionExpired(false)} />}
      />
    );
  }

  // Onboarding status is the server-declared source of truth for whether a
  // signed-in customer should land in the (onboarding) chain or (tabs) —
  // never inferred client-side (mobile-flow-map.md "Resume ordered progress").
  // `null` = no onboarding session exists for this customer (see useOnboardingStatus).
  const isOnboardingComplete = !auth.isAuthenticated || onboarding.data === null || onboarding.data?.status === "COMPLETED";
  const isRestricted = auth.isAuthenticated && isOnboardingComplete && profile.data?.status === "RESTRICTED";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!auth.isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={auth.isAuthenticated && !isOnboardingComplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={auth.isAuthenticated && isOnboardingComplete}>
        <Stack.Protected guard={!isRestricted}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={isRestricted}>
          <Stack.Screen name="account-restricted" />
        </Stack.Protected>
        {/* Reachable regardless of restriction status — a restricted customer must still be able to view history and reach Support. */}
        <Stack.Screen name="transactions" options={{ headerShown: true, title: "Transactions" }} />
        <Stack.Screen name="statement" options={{ headerShown: true, title: "Statement" }} />
        <Stack.Screen name="add-money" options={{ headerShown: true, title: "Add Money" }} />
        <Stack.Screen name="transfers" />
        <Stack.Screen name="bills" />
        <Stack.Screen name="loans" />
        <Stack.Screen name="security" />
        <Stack.Screen name="savings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="beneficiaries" />
        <Stack.Screen name="disputes" />
      </Stack.Protected>
    </Stack>
  );
}
