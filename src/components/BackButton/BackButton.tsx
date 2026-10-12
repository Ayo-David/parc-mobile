import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/theme";

export interface BackButtonProps {
  onPress?: () => void;
  /** "onMedia" is for screens with a full-bleed dark/camera background (Figma Liveness 02–07) where a plain surface chip would be invisible. */
  tone?: "surface" | "onMedia";
  /** "compact" is the 38px in-app BackHeader tile (237:12833). */
  size?: "default" | "compact";
}

/**
 * Figma's rounded-square back chip (nodes 425:107, 426:51, 426:206, and
 * every other new gap-closure screen — none of this app's existing
 * onboarding screens rendered one, since `Stack` headers are hidden
 * app-wide). Shared here since Phase 3 (PLAN.md Part 11) reintroduces it
 * on nearly every new screen. Geometry follows the onboarding BackButton
 * (226:1471): 44px tile, #F5F5F5 primary-subtle fill, 18px left arrow.
 */
export function BackButton({ onPress, tone = "surface", size = "default" }: BackButtonProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    button: {
      width: size === "compact" ? theme.control.backButtonCompact : theme.control.backButton,
      height: size === "compact" ? theme.control.backButtonCompact : theme.control.backButton,
      borderRadius: size === "compact" ? theme.radii.md : theme.radii.button,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tone === "onMedia" ? theme.colors.overlayOnMedia : theme.colors.primarySubtle,
    },
  });

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onPress ?? (() => router.back())} style={styles.button}>
      <Ionicons name="arrow-back" size={theme.icon.nav} color={tone === "onMedia" ? theme.colors.textInverse : theme.colors.textPrimary} />
    </Pressable>
  );
}
