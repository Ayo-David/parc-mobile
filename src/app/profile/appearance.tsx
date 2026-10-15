import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme, type ThemePreference } from "@/theme";

const OPTIONS: { value: ThemePreference; label: string; body: string; icon: ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "system", label: "System", body: "Match your phone's light or dark setting", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", body: "Always use the light theme", icon: "sunny-outline" },
  { value: "dark", label: "Dark", body: "Always use the dark theme", icon: "moon-outline" },
];

/**
 * Theme preference. Applies on tap (no save step) and persists through
 * ThemeProvider's storage adapter; "System" follows the OS setting live.
 */
export default function AppearanceScreen() {
  const { theme, themePreference, setThemePreference } = useTheme();

  const styles = StyleSheet.create({
    content: { paddingTop: theme.spacing.sm, paddingBottom: theme.semanticSpacing.section, gap: theme.semanticSpacing.form },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      borderRadius: theme.radii.lg,
      borderWidth: theme.borderWidth.thin,
      padding: theme.semanticSpacing.form,
    },
    optionSelected: { backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary },
    optionUnselected: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    optionIcon: { width: theme.control.buttonSmall, height: theme.control.buttonSmall, borderRadius: theme.radii.md, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" },
    optionText: { flex: 1 },
    optionLabel: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    optionBody: { ...theme.typography.text11p5Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
    radioOuter: { width: theme.spacing.xl, height: theme.spacing.xl, borderRadius: theme.radii.full, borderWidth: theme.borderWidth.otpBox, alignItems: "center", justifyContent: "center" },
    radioInner: { width: theme.spacing.sm, height: theme.spacing.sm, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary },
  });

  return (
    <ScreenContainer>
      <BackHeader title="Appearance" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const isSelected = option.value === themePreference;
          return (
            <Pressable
              key={option.value}
              testID={`appearance-option-${option.value}`}
              style={[styles.option, isSelected ? styles.optionSelected : styles.optionUnselected]}
              onPress={() => setThemePreference(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.label}. ${option.body}`}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon} size={theme.icon.nav} color={theme.colors.textPrimary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionBody}>{option.body}</Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: isSelected ? theme.colors.primary : theme.colors.border }]}>{isSelected ? <View style={styles.radioInner} /> : null}</View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}
