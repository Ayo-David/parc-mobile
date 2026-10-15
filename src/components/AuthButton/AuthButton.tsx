import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme";

export interface AuthButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /**
   * - "primary": Figma "AuthBtn" (226:1761) — black when active, #EBEBEB
   *   when inactive, always light label text (not the standard `Button`
   *   disabled recipe).
   * - "outline": the secondary 54px action under it (226:1763).
   * - "onMedia": translucent white on the full-bleed dark screens (226:2728).
   */
  variant?: "primary" | "outline" | "onMedia";
}

/** The 56px full-width action used across the sign-up/onboarding frames. */
export function AuthButton({ label, onPress, disabled = false, loading = false, variant = "primary" }: AuthButtonProps) {
  const { theme } = useTheme();
  const isInactive = disabled || loading;

  const surface = {
    primary: {
      backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
      borderColor: "transparent",
      textColor: disabled ? theme.colors.textInverse : theme.colors.onPrimary,
    },
    outline: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.borderSubtle,
      textColor: theme.colors.textTertiary,
    },
    onMedia: {
      backgroundColor: theme.components.onMedia.buttonBackground,
      borderColor: theme.components.onMedia.buttonBorder,
      textColor: theme.colors.textInverse,
    },
  }[variant];

  const styles = StyleSheet.create({
    button: {
      height: variant === "outline" ? theme.control.input : theme.control.authButton,
      borderRadius: theme.radii.lg,
      borderWidth: variant === "primary" ? 0 : theme.borderWidth.thin,
      borderColor: surface.borderColor,
      backgroundColor: surface.backgroundColor,
      alignItems: "center",
      justifyContent: "center",
      opacity: variant !== "primary" && disabled ? 0.5 : 1,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      ...(variant === "outline" ? theme.typography.bodyMedium : theme.typography.button),
      color: surface.textColor,
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={surface.textColor} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}
