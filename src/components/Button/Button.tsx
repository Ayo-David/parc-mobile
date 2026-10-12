import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme";
import type { ButtonSize, ButtonVariant } from "@/theme";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = "primary", size = "medium", disabled = false, loading = false }: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const recipe = theme.components.button[variant][isDisabled ? "disabled" : "default"];
  const pressedRecipe = theme.components.button[variant].pressed;

  const labelTypography = size === "large" ? theme.typography.buttonLarge : size === "small" ? theme.typography.buttonSmall : theme.typography.button;

  const styles = StyleSheet.create({
    base: {
      height: theme.components.buttonHeight[size],
      borderRadius: theme.radii.button,
      borderWidth: recipe.borderColor === "transparent" ? 0 : theme.borderWidth.thin,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.semanticSpacing.component,
    },
    label: {
      ...labelTypography,
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? pressedRecipe.backgroundColor : recipe.backgroundColor,
          borderColor: recipe.borderColor,
          opacity: recipe.opacity,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={recipe.textColor} /> : <Text style={[styles.label, { color: recipe.textColor }]}>{label}</Text>}
    </Pressable>
  );
}
