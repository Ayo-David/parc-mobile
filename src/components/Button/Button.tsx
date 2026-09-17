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

  const styles = StyleSheet.create({
    base: {
      height: theme.components.buttonHeight[size],
      borderRadius: theme.radii.button,
      borderWidth: recipe.borderColor === "transparent" ? 0 : 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.semanticSpacing.component,
    },
    label: {
      ...theme.typography.button,
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
