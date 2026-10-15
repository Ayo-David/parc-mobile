import { Ionicons } from "@expo/vector-icons";
import { Fragment, type ReactNode } from "react";
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
  /**
   * Content placed between the dots and the keypad. With `fill`, it takes
   * the remaining height and is centred — Figma Passcode (226:1590) puts the
   * "Never share your passcode" chip there, with the keypad pinned low.
   */
  accessory?: ReactNode;
  /** Grow to fill the parent, pinning the keypad to the bottom. */
  fill?: boolean;
}

const KEYS: { digit: string; letters?: string }[][] = [
  [{ digit: "1" }, { digit: "2", letters: "ABC" }, { digit: "3", letters: "DEF" }],
  [
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
  ],
  [
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
  ],
];

/**
 * Shared numeric entry widget for both the 6-digit login passcode and the
 * 4-digit transaction PIN (PLAN.md Part 1 decision: one reusable component,
 * used full-screen here and inside a bottom-sheet for transaction
 * authorization). Rewritten 2026-09-20 against Figma's real "PINDots"/
 * "NumPad" specimens (226:1583-226:1642) — square-ish rounded keys with
 * letter subtitles and a filled-square dot indicator, not the previous
 * circular-key/circular-dot placeholder guess.
 */
export function PinPad({ length, value, onChange, renderAuxiliaryKey, onAuxiliaryKeyPress, disabled, accessory, fill }: PinPadProps) {
  const { theme } = useTheme();
  const recipe = theme.components.pinPad;

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
      gap: theme.spacing.md + 2,
      marginBottom: fill ? 0 : theme.semanticSpacing.section,
    },
    root: {
      flex: fill ? 1 : undefined,
    },
    accessory: {
      flex: fill ? 1 : undefined,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.semanticSpacing.component,
    },
    dot: {
      width: recipe.dotSize,
      height: recipe.dotSize,
      borderRadius: theme.radii.sm,
      borderWidth: recipe.dotBorderWidth,
      borderColor: recipe.dotBorderColor,
    },
    dotFilled: {
      backgroundColor: recipe.dotFilledColor,
      borderColor: recipe.dotFilledColor,
    },
    keypad: {
      gap: theme.spacing.sm + 2,
    },
    keyRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.sm + 2,
    },
    key: {
      flex: 1,
      height: 70,
      borderRadius: recipe.keyRadius,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: recipe.keyBackground,
    },
    keyEmpty: {
      flex: 1,
      height: 70,
      backgroundColor: "transparent",
    },
    keyDelete: {
      flex: 1,
      height: 70,
      alignItems: "center",
      justifyContent: "center",
    },
    keyPressed: {
      opacity: 0.7,
    },
    keyLabel: {
      ...theme.typography.padButton,
      color: theme.colors.textPrimary,
    },
    keyLetters: {
      ...theme.typography.text8MediumWide,
      textTransform: "uppercase",
      color: theme.colors.textDisabled,
      marginTop: 1,
    },
  });

  return (
    <View style={styles.root}>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, index) => (
          <View key={index} style={[styles.dot, index < value.length && styles.dotFilled]} />
        ))}
      </View>
      {accessory || fill ? <View style={styles.accessory}>{accessory}</View> : null}
      <View style={styles.keypad}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map(({ digit, letters }) => (
              <Pressable
                key={digit}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${digit}`}
                onPress={() => handleDigit(digit)}
                disabled={disabled}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Text style={styles.keyLabel}>{digit}</Text>
                {/* Keys without letters keep an empty letter line (Figma 226:1600) so every digit shares one baseline. */}
                <Text style={styles.keyLetters} importantForAccessibility="no" accessibilityElementsHidden>
                  {letters ?? " "}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.keyRow}>
          {renderAuxiliaryKey ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Auxiliary action"
              onPress={onAuxiliaryKeyPress}
              disabled={disabled || !onAuxiliaryKeyPress}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <Fragment>{renderAuxiliaryKey()}</Fragment>
            </Pressable>
          ) : (
            <View style={styles.keyEmpty} />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Digit 0"
            onPress={() => handleDigit("0")}
            disabled={disabled}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyLabel}>0</Text>
            <Text style={styles.keyLetters} importantForAccessibility="no" accessibilityElementsHidden>
              {" "}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete"
            onPress={handleDelete}
            disabled={disabled || value.length === 0}
            style={styles.keyDelete}
          >
            <Ionicons name="backspace-outline" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
