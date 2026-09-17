import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

/** Figma "GetStarted" (node 226:1408) — the true landing screen. */
export default function GetStartedScreen() {
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
      ...theme.typography.display,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textSecondary,
      marginBottom: theme.semanticSpacing.section,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Parc</Text>
          <Text style={styles.subtitle}>Banking built for how you actually live.</Text>
        </View>
        <Button label="Get Started" onPress={() => router.push("/(auth)/register-phone")} />
        <Button label="I already have an account" variant="ghost" onPress={() => router.push("/(auth)/sign-in")} />
      </View>
    </ScreenContainer>
  );
}
