import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

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
      width: theme.icon.default,
      height: theme.icon.default,
      borderRadius: theme.radii.xs,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.xs,
    },
    check: {
      color: theme.colors.textInverse,
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
