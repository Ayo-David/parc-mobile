import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
}

/** Box size/radius confirmed 2026-09-20 against register-phone (322:340): 22x22, radius 7 (reuses `radii.logo`, same value) — corrects the long-flagged "close-but-not-exact" gap (design-system.md §9), which had it at 24/4. */
export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      minHeight: theme.control.minTouchTarget,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: theme.radii.logo,
      borderWidth: theme.borderWidth.thin,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.xs,
    },
    check: {
      color: theme.colors.onPrimary,
      ...theme.typography.caption,
    },
    label: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <Pressable style={styles.row} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, { borderColor: checked ? theme.colors.primary : theme.colors.border, backgroundColor: checked ? theme.colors.primary : theme.colors.surface }]}>
        {checked ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
