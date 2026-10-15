import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export interface OptionCardProps {
  title: string;
  description?: string;
  /** Leading glyph, rendered as text (Figma uses emoji here, e.g. 226:2055). */
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/** Single-select card with a trailing radio — Figma PEPVerification options (226:2053, 226:2062). */
export function OptionCard({ title, description, emoji, selected, onPress, disabled }: OptionCardProps) {
  const { theme } = useTheme();
  const recipe = theme.components.optionCard;

  const styles = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md + 2,
      padding: theme.spacing.lg + 2,
      borderRadius: theme.radii.option,
      borderWidth: theme.borderWidth.thin,
      borderColor: selected ? recipe.selectedBorderColor : recipe.borderColor,
      backgroundColor: selected ? recipe.selectedBackgroundColor : recipe.backgroundColor,
    },
    emoji: {
      ...theme.typography.emojiLarge,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...theme.typography.text16Bold,
      letterSpacing: 0,
      color: theme.colors.textPrimary,
    },
    description: {
      ...theme.typography.text13Regular,
      color: theme.colors.textMuted,
    },
    radio: {
      width: recipe.radioSize,
      height: recipe.radioSize,
      borderRadius: theme.radii.full,
      borderWidth: theme.borderWidth.otpBox,
      borderColor: selected ? recipe.radioSelectedColor : recipe.radioBorderColor,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: recipe.radioDotSize,
      height: recipe.radioDotSize,
      borderRadius: theme.radii.full,
      backgroundColor: recipe.radioSelectedColor,
    },
  });

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }}>
      {emoji ? (
        <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
          {emoji}
        </Text>
      ) : null}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.radio}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}
