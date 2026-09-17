import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useBootstrap } from "@/api/queries/useBootstrap";
import { ApiError } from "@/api/errors";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/Button/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useOnboardingStatus } from "@/features/onboarding/useOnboardingStatus";
import { initSentry } from "@/observability/sentry";
import { ThemeProvider, asyncStorageThemeAdapter, useTheme } from "@/theme";

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
  const bootstrap = useBootstrap();
  const auth = useAuth();
  const onboarding = useOnboardingStatus(auth.isAuthenticated);
  const isReady = auth.isHydrated && !bootstrap.isLoading && (!auth.isAuthenticated || !onboarding.isLoading);

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
    return (
      <GateMessage
        title={isUpgradeRequired ? "Update required" : "Something went wrong"}
        message={isUpgradeRequired ? "Please update Parc from the app store to continue." : "We couldn't reach Parc right now. Check your connection and try again."}
        onRetry={isUpgradeRequired ? undefined : () => bootstrap.refetch()}
      />
    );
  }

  if (bootstrap.data?.maintenance) {
    return <GateMessage title="Under maintenance" message="Parc is temporarily unavailable while we make improvements. Please check back shortly." />;
  }

  // Onboarding status is the server-declared source of truth for whether a
  // signed-in customer should land in the (onboarding) chain or (tabs) —
  // never inferred client-side (mobile-flow-map.md "Resume ordered progress").
  const isOnboardingComplete = !auth.isAuthenticated || onboarding.data?.status === "COMPLETED";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!auth.isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={auth.isAuthenticated && !isOnboardingComplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={auth.isAuthenticated && isOnboardingComplete}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transactions" options={{ headerShown: true, title: "Transactions" }} />
        <Stack.Screen name="statement" options={{ headerShown: true, title: "Statement" }} />
        <Stack.Screen name="transfers" />
        <Stack.Screen name="bills" />
        <Stack.Screen name="loans" />
        <Stack.Screen name="security" />
        <Stack.Screen name="savings" />
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}

function GateMessage({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    message: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
      </View>
    </ScreenContainer>
  );
}
