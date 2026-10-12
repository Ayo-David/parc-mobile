import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

export interface StepDotsProps {
  total: number;
  /** 0-indexed. */
  current: number;
}

/** Figma "StepDots" (register-phone 322:289 and other sign-up-flow headers) — the active step is a wide pill, the rest are small dots. */
export function StepDots({ total, current }: StepDotsProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
    },
    dot: {
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    dotActive: {
      backgroundColor: theme.colors.primary,
    },
  });

  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.dot, { width: index === current ? 20 : 8 }, index === current && styles.dotActive]} />
      ))}
    </View>
  );
}
