import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/** Mirrors the onboarding "PasscodeSuccess" pattern (node 226:2324) for the transaction-PIN setup flow. */
export default function TransactionPinSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.semanticSpacing.component,
      paddingBottom: theme.semanticSpacing.section,
    },
    title: { ...theme.typography.h2, color: theme.colors.textPrimary, textAlign: "center" },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary, textAlign: "center" },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>Your transaction PIN has been created. You can now authorize transfers, bill payments, and loan actions.</Text>
        <Button label="Done" onPress={() => (router.canDismiss() ? router.dismiss() : router.replace("/(tabs)"))} />
      </View>
    </ScreenContainer>
  );
}
