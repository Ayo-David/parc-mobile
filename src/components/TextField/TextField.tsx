import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { useTheme } from "@/theme";
import type { InputState } from "@/theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  state?: Exclude<InputState, "disabled">;
}

export function TextField({ state = "default", editable = true, ...inputProps }: TextFieldProps) {
  const { theme } = useTheme();
  const recipe = theme.components.input[editable ? state : "disabled"];

  const styles = StyleSheet.create({
    input: {
      height: theme.control.input,
      borderRadius: theme.radii.input,
      borderWidth: 1,
      borderColor: recipe.borderColor,
      backgroundColor: recipe.backgroundColor,
      color: recipe.textColor,
      paddingHorizontal: theme.semanticSpacing.form,
      opacity: recipe.opacity,
      ...theme.typography.bodyMedium,
    },
  });

  return <TextInput style={styles.input} editable={editable} placeholderTextColor={theme.colors.textMuted} {...inputProps} />;
}
