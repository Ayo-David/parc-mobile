import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { StatusTone } from "@/theme";

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const { theme } = useTheme();
  const recipe = theme.components.status[tone];

  const styles = StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderRadius: theme.radii.full,
      borderWidth: 1,
      borderColor: recipe.borderColor,
      backgroundColor: recipe.backgroundColor,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
    },
    label: {
      ...theme.typography.caption,
      color: recipe.textColor,
    },
  });

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
