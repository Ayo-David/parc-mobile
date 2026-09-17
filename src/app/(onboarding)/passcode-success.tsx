import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useAdvanceOnboarding } from "@/features/onboarding/navigation";
import { useTheme } from "@/theme";

/** Figma "PasscodeSuccess" (node 226:2324). */
export default function PasscodeSuccessScreen() {
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
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>Your passcode has been created.</Text>
        <Button label="Continue" onPress={() => void advanceOnboarding()} />
      </View>
    </ScreenContainer>
  );
}
