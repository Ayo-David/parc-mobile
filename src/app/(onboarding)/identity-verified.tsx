import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

/**
 * Figma "FaceVerified" / "Identity Verified" (node 226:2741) — a purely
 * client-side transitional confirmation after IDENTITY + FACE_VERIFICATION;
 * there is no corresponding server OnboardingStep for it, so "Continue"
 * refetches status to find the real next step (ADDRESS).
 */
export default function IdentityVerifiedScreen() {
  const { theme } = useTheme();
  const advanceOnboarding = useAdvanceOnboarding();

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.section,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Identity verified!</Text>
        <Text style={styles.subtitle}>Just a few more details to finish setting up your account.</Text>
        <Button label="Continue" onPress={() => void advanceOnboarding()} />
      </View>
    </ScreenContainer>
  );
}
