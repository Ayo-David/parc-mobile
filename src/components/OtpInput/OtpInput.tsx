import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "@/theme";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

/**
 * Figma "OTPBoxes" pattern, used for both phone and email OTP entry. Uses a
 * single visually-hidden TextInput to drive the native numeric keyboard,
 * with the visible boxes purely reflecting `value` — avoids per-box focus
 * management.
 */
export function OtpInput({ length = 6, value, onChange, autoFocus = false, hasError = false, disabled = false }: OtpInputProps) {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    box: {
      width: theme.control.otpBoxWidth,
      height: theme.control.otpBoxHeight,
      borderRadius: theme.radii.input,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    digit: {
      ...theme.typography.h3,
      color: theme.colors.textPrimary,
    },
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
  });

  return (
    <Pressable onPress={() => inputRef.current?.focus()} disabled={disabled}>
      <View style={styles.row}>
        {Array.from({ length }).map((_, index) => {
          const digit = value[index];
          const isActive = index === value.length;
          const borderColor = hasError ? theme.colors.borderError : isActive ? theme.colors.borderFocus : theme.colors.border;
          return (
            <View key={index} style={[styles.box, { borderColor }]}>
              <Text style={styles.digit}>{digit ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, length))}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        editable={!disabled}
        maxLength={length}
        accessibilityLabel="One-time passcode"
      />
    </Pressable>
  );
}
