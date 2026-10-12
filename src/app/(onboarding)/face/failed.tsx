import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button/Button";
import { StatusScreenLayout } from "@/components/StatusScreenLayout/StatusScreenLayout";
import { useTheme } from "@/theme";

const TIPS = ["Move to a well-lit spot, facing a light source", "Remove sunglasses, hats, or face coverings", "Hold your phone at eye level, arm's length away"];

/**
 * Figma "Liveness 06 — Verification Failed" (node 426:217,
 * missing-mobile.md §2.1). Figma's copy claims a specific attempt count
 * ("You have 2 attempts left today") that no confirmed backend field
 * actually tracks — omitted here rather than fabricated, per this app's
 * established rule against inventing numbers the API doesn't return.
 */
export default function LivenessFailedScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      gap: theme.spacing.sm,
      marginBottom: theme.semanticSpacing.section,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "flex-start",
    },
    bullet: {
      width: theme.spacing.xs,
      height: theme.spacing.xs,
      borderRadius: theme.radii.xs,
      backgroundColor: theme.colors.textPrimary,
      marginTop: theme.spacing.sm,
    },
    tipText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    caption: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <StatusScreenLayout
      icon="close-circle"
      tone="error"
      title="We couldn't verify your face"
      body="This can happen with low lighting, glare, or if your whole face wasn't visible."
      footer={
        <>
          <Button label="Try again" onPress={() => router.replace("/(onboarding)/face/capture")} />
          <Text style={styles.caption}>Still having trouble? Contact support and we&apos;ll help you get verified.</Text>
        </>
      }
    >
      <View style={styles.card}>
        {TIPS.map((tip) => (
          <View style={styles.row} key={tip}>
            <View style={styles.bullet} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </StatusScreenLayout>
  );
}
