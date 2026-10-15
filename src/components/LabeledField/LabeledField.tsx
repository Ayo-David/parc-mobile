import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export interface LabeledFieldProps {
  label: string;
  children: ReactNode;
  helperText?: string;
  /** Right-aligned under the input, e.g. a "0/11" character counter (Figma 226:1866). */
  trailingHelper?: string;
}

/** Figma form "Field"/"Select" wrapper (226:1753, 226:1968): 13px semibold label, 6px gap, optional muted helper line. */
export function LabeledField({ label, children, helperText, trailingHelper }: LabeledFieldProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    root: {
      gap: theme.spacing.xs + 2,
    },
    label: {
      ...theme.typography.text13SemiBold,
      color: theme.colors.textSecondary,
    },
    helper: {
      ...theme.typography.text13Regular,
      color: theme.colors.textMuted,
    },
    trailing: {
      ...theme.typography.caption,
      color: theme.colors.textDisabled,
      textAlign: "right",
    },
  });

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {trailingHelper ? <Text style={styles.trailing}>{trailingHelper}</Text> : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}
