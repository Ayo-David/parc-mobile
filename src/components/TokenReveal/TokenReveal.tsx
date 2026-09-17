import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

/**
 * Prepaid electricity token display (PLAN.md Part 2, "token-reveal" state
 * composed from the design system's existing large-numeral treatment).
 * `BillReceipt.token` is confirmed real (payment contract, PLAN.md Part 4)
 * — no longer a probed/guessed field.
 */
export function TokenReveal({ token }: { token: string }) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.primarySubtle,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    token: {
      ...theme.typography.h1,
      color: theme.colors.primary,
      letterSpacing: 2,
    },
    hint: {
      ...theme.typography.caption,
      color: copied ? theme.colors.success : theme.colors.textMuted,
    },
  });

  return (
    <Pressable style={styles.card} onPress={handleCopy}>
      <Text style={styles.label}>Your token</Text>
      <Text style={styles.token}>{token}</Text>
      <View>
        <Text style={styles.hint}>{copied ? "Copied!" : "Tap to copy"}</Text>
      </View>
    </Pressable>
  );
}
