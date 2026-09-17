import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export interface PinPadProps {
  length: number;
  value: string;
  onChange: (next: string) => void;
  /** Shown as the rightmost key in place of a digit, e.g. a biometric icon. Omit for none. */
  renderAuxiliaryKey?: () => React.ReactNode;
  onAuxiliaryKeyPress?: () => void;
  disabled?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

/**
 * Shared numeric entry widget for both the 6-digit login passcode and the
 * 4-digit transaction PIN (PLAN.md Part 1 decision: one reusable component,
 * used full-screen here and inside a bottom-sheet for transaction
 * authorization). Figma didn't specify exact PIN-dot sizing/spacing, so the
 * dot diameter/gap below are provisional theme-token choices, not read
 * directly off a design value.
 */
export function PinPad({ length, value, onChange, renderAuxiliaryKey, onAuxiliaryKeyPress, disabled }: PinPadProps) {
  const { theme } = useTheme();

  function handleDigit(digit: string) {
    if (disabled || value.length >= length) return;
    onChange(value + digit);
  }

  function handleDelete() {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  const styles = StyleSheet.create({
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.semanticSpacing.section,
    },
    dot: {
      width: theme.spacing.md,
      height: theme.spacing.md,
      borderRadius: theme.radii.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dotFilled: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    keypad: {
      gap: theme.semanticSpacing.form,
    },
    keyRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.semanticSpacing.form,
    },
    key: {
      width: theme.control.iconButtonLarge,
      height: theme.control.iconButtonLarge,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
    },
    keyPressed: {
      backgroundColor: theme.colors.primarySubtle,
    },
    keyLabel: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
    },
  });

  return (
    <View>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, index) => (
          <View key={index} style={[styles.dot, index < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((digit) => (
              <Pressable
                key={digit}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${digit}`}
                onPress={() => handleDigit(digit)}
                disabled={disabled}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Text style={styles.keyLabel}>{digit}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.keyRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Auxiliary action"
            onPress={onAuxiliaryKeyPress}
            disabled={disabled || !onAuxiliaryKeyPress}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            {renderAuxiliaryKey ? <Fragment>{renderAuxiliaryKey()}</Fragment> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Digit 0"
            onPress={() => handleDigit("0")}
            disabled={disabled}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyLabel}>0</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete"
            onPress={handleDelete}
            disabled={disabled || value.length === 0}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyLabel}>⌫</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
