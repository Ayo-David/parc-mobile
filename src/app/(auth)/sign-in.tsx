import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/**
 * Figma "Sign In Options" (node 226:1452). Only phone/email + passcode is
 * wired this sprint (PLAN.md Part 8); biometric/passkey sign-in are real
 * design-system options not yet implemented, shown honestly as unavailable
 * rather than omitted or silently faked.
 */
export default function SignInOptionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: "flex-end",
      paddingBottom: theme.semanticSpacing.section,
      gap: theme.semanticSpacing.component,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      marginBottom: theme.semanticSpacing.section,
    },
    unavailableNote: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your Parc account.</Text>
        </View>
        <Button label="Continue with Phone or Email" onPress={() => router.push("/(auth)/login")} />
        <Text style={styles.unavailableNote}>Biometric and passkey sign-in are coming soon.</Text>
      </View>
    </ScreenContainer>
  );
}
