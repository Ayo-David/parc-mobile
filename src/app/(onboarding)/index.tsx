import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useOnboardingStatus } from "@/features/onboarding/useOnboardingStatus";
import { useOnboardingStepRouter } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

/**
 * Redirect-only entry point for the (onboarding) group: the root layout
 * only decides *whether* to show this group, not which step within it —
 * this screen reads the already-fetched onboarding status and routes to
 * the server-declared current step.
 */
export default function OnboardingIndexScreen() {
  const { theme } = useTheme();
  const status = useOnboardingStatus(true);
  const goToStep = useOnboardingStepRouter();

  useEffect(() => {
    if (status.data) {
      goToStep(status.data.current_step);
    }
    // goToStep is a fresh function identity every render; only status.data should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.data]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}
