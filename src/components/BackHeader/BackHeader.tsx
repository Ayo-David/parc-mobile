import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton/BackButton";
import { useTheme } from "@/theme";

export interface BackHeaderProps {
  title: string;
  /** Optional trailing element, e.g. a "History" link. */
  right?: ReactNode;
  onBack?: () => void;
}

/**
 * Figma "BackHeader" (237:12832 and the other in-app dashboard flows): 38px
 * back tile, 12px gap, 16px bold title. Screens using it hide the native
 * stack header (`<Stack.Screen options={{ headerShown: false }} />`).
 */
export function BackHeader({ title, right, onBack }: BackHeaderProps) {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.text16Bold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
  });
  return (
    <View style={styles.row}>
      <BackButton size="compact" onPress={onBack} />
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}
