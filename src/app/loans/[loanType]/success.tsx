import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useLoanApplicationDraftStore } from "@/features/loans/loanApplicationDraftStore";
import { useTheme } from "@/theme";

/**
 * Figma "Loan Approved!" success pattern. No status/decision schema exists
 * anywhere in the Lending contract (PLAN.md "Real blockers") — this
 * intentionally does not claim a decision the backend hasn't documented a
 * way to report; it only confirms submission.
 */
export default function LoanApplicationSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const resetDraft = useLoanApplicationDraftStore((state) => state.reset);

  function handleDone() {
    resetDraft();
    router.replace("/(tabs)/loans");
  }

  const styles = StyleSheet.create({
    content: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.semanticSpacing.component, paddingBottom: theme.semanticSpacing.section },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary, textAlign: "center" },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, textAlign: "center" },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Application submitted</Text>
        <Text style={styles.subtitle}>We'll let you know as soon as a decision is ready.</Text>
        <Button label="Done" onPress={handleDone} />
      </View>
    </ScreenContainer>
  );
}
