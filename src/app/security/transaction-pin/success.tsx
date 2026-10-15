import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTerminalScreen } from "@/navigation/useTerminalScreen";
import { useTheme } from "@/theme";

/** Mirrors the onboarding "PasscodeSuccess" pattern (node 226:2324) for the transaction-PIN setup flow. */
export default function TransactionPinSuccessScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { mode } = useLocalSearchParams<{ mode?: "changed" }>();

  // Leave the whole PIN-setup stack in one step, back to wherever it was
  // opened from (Security, or the payment whose PIN sheet asked for a PIN).
  function finish() {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) {
      parent.goBack();
    } else {
      router.replace("/(tabs)");
    }
  }
  useTerminalScreen(finish);

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
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.content}>
        <Text style={styles.title}>You&apos;re all set!</Text>
        <Text style={styles.subtitle}>{mode === "changed" ? "Your transaction PIN has been changed. Use your new PIN for transfers, bill payments, and loan actions." : "Your transaction PIN has been created. You can now authorize transfers, bill payments, and loan actions."}</Text>
        <Button label="Done" onPress={finish} />
      </View>
    </ScreenContainer>
  );
}
