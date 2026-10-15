import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { useTheme } from "@/theme";
import type { InputState } from "@/theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  state?: Exclude<InputState, "disabled">;
  /** "figure": wide-tracked 20px digits for ID-number entry (Figma NIN input 226:1863). */
  textVariant?: "default" | "figure";
}

export function TextField({ state = "default", textVariant = "default", editable = true, ...inputProps }: TextFieldProps) {
  const { theme } = useTheme();
  const recipe = theme.components.input[editable ? state : "disabled"];

  const styles = StyleSheet.create({
    input: {
      height: theme.control.input,
      borderRadius: theme.radii.input,
      borderWidth: theme.borderWidth.thin,
      borderColor: recipe.borderColor,
      backgroundColor: recipe.backgroundColor,
      color: recipe.textColor,
      paddingHorizontal: theme.semanticSpacing.form,
      opacity: recipe.opacity,
      ...(textVariant === "figure" ? theme.typography.text20RegularWide : theme.typography.bodyMedium),
    },
  });

  return <TextInput style={styles.input} editable={editable} placeholderTextColor={theme.colors.textMuted} {...inputProps} />;
}
