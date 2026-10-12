import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme, withAlpha } from "@/theme";

const parcLogo = require("../../../assets/images/parc-logo.png");

/**
 * Figma "GetStarted" (node 226:1408) — full-bleed black hero screen, a
 * one-off "content-driven dark chrome" treatment (same category as the
 * Liveness camera screens' `surfaceInverse`/`overlayOnMedia`), not the
 * app's light theme. Icons are Ionicons (documented placeholder iconset,
 * design-system.md §9) in place of Figma's raw emoji glyphs, per request.
 */
export default function GetStartedScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 0,
    },
    logoRow: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
      paddingBottom: theme.spacing.xxxl + theme.spacing.xs,
    },
    logo: {
      width: 68,
      height: 68,
      borderRadius: theme.radii.card,
    },
    body: {
      flex: 1,
      paddingHorizontal: theme.spacing.xxl + theme.spacing.xs,
    },
    headline: {
      ...theme.typography.display2,
      color: theme.colors.textInverse,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.textMuted,
      width: 280,
      marginTop: theme.spacing.lg,
    },
    badgeRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xxl,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: theme.spacing.sm - 2,
      borderRadius: theme.radii.full,
      backgroundColor: withAlpha(theme.colors.textInverse, 0.05),
      borderWidth: theme.borderWidth.hairline,
      borderColor: withAlpha(theme.colors.textInverse, 0.1),
    },
    badgeLabel: {
      ...theme.typography.text11SemiBold,
      color: theme.colors.textMuted,
    },
    footer: {
      paddingHorizontal: theme.spacing.xxl,
      paddingBottom: theme.spacing.huge + theme.spacing.xs,
      gap: theme.semanticSpacing.authActions,
    },
    authButton: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      // Figma's rgba(247,247,247,0.14) — 247,247,247 is exactly colors.background.
      backgroundColor: withAlpha(theme.colors.background, 0.14),
    },
    authButtonOutline: {
      height: theme.control.authButton,
      borderRadius: theme.radii.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.borderWidth.thin,
      borderColor: withAlpha(theme.colors.textInverse, 0.22),
    },
    authButtonLabel: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
    legal: {
      ...theme.typography.text11Regular,
      color: withAlpha(theme.colors.textInverse, 0.15),
      textAlign: "center",
      paddingTop: theme.spacing.xs,
    },
  });

  return (
    <ScreenContainer style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.logoRow}>
        <Image source={parcLogo} style={styles.logo} />
      </View>
      <View style={styles.body}>
        <Text style={styles.headline}>Your money.{"\n"}Intelligently{"\n"}managed.</Text>
        <Text style={styles.subtitle}>The smarter financial operating system for everyday Nigerians.</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
            <Text style={styles.badgeLabel}>Bank-grade security</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="flash" size={12} color={theme.colors.textMuted} />
            <Text style={styles.badgeLabel}>Instant transfers</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.authButton} onPress={() => router.push("/(auth)/register-phone")} accessibilityRole="button">
          <Text style={styles.authButtonLabel}>Create Account</Text>
        </Pressable>
        <Pressable style={styles.authButtonOutline} onPress={() => router.push("/(auth)/sign-in")} accessibilityRole="button">
          <Text style={styles.authButtonLabel}>I already have an account</Text>
        </Pressable>
        <Text style={styles.legal}>Parc Technologies · CBN Licensed · v2.4.0</Text>
      </View>
    </ScreenContainer>
  );
}
