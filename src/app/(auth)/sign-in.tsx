import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/BackButton/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme, withAlpha } from "@/theme";

const parcWordmark = require("../../../assets/images/parc-wordmark.png");

/**
 * Figma "SignIn" (node 226:1452). Only phone/email + passcode is wired
 * this sprint (PLAN.md Part 8); biometric/passkey sign-in are real
 * design-system options not yet implemented — shown matching Figma
 * (visually enabled, per the reference) but honestly surfaced as
 * "coming soon" on tap rather than silently faking biometric auth.
 */
export default function SignInOptionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: theme.spacing.lg,
    },
    wordmark: {
      width: 48,
      height: 19,
    },
    headerSpacer: {
      width: theme.control.backButton,
    },
    body: {
      flex: 1,
      paddingTop: theme.spacing.xxl + theme.spacing.xs,
    },
    headline: {
      ...theme.typography.display3,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.text15Regular,
      color: theme.colors.textMuted,
      // Figma: 90px heading block (2×40 lines + pb6) then a 51px paragraph block with pb28.
      marginTop: theme.spacing.sm + theme.spacing.xs / 2,
      marginBottom: theme.spacing.xxl + theme.spacing.xs,
    },
    biometricCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.lg,
      backgroundColor: theme.colors.surfaceInverse,
      borderRadius: theme.radii.card,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    biometricIcon: {
      width: 46,
      height: 46,
      borderRadius: theme.radii.avatar + 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withAlpha(theme.colors.secondary, 0.15),
    },
    biometricTextBlock: {
      flex: 1,
    },
    biometricTitle: {
      ...theme.typography.text15Bold,
      color: theme.colors.textInverse,
    },
    biometricSubtitle: {
      ...theme.typography.caption,
      color: withAlpha(theme.colors.textInverse, 0.42),
      marginTop: 2,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerLabel: {
      ...theme.typography.text12SemiBoldWide,
      textTransform: "uppercase",
      color: theme.colors.textDisabled,
    },
    optionsList: {
      gap: theme.spacing.sm + 2,
      paddingTop: theme.spacing.lg,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borderWidth.thin,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md + 1,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: theme.radii.button,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySubtle,
    },
    optionTextBlock: {
      flex: 1,
    },
    optionTitle: {
      ...theme.typography.text15Bold,
      color: theme.colors.textPrimary,
    },
    optionSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    footer: {
      alignItems: "center",
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.semanticSpacing.section + theme.spacing.xs,
    },
    footerText: {
      ...theme.typography.text14Regular,
      color: theme.colors.textMuted,
    },
    footerLink: {
      ...theme.typography.text14Bold,
      color: theme.colors.secondary,
    },
  });

  function handleBiometricPress() {
    Alert.alert("Coming soon", "Biometric and passkey sign-in are coming soon.");
  }

  return (
    <ScreenContainer variant="auth">
      <View style={styles.header}>
        <BackButton />
        <Image source={parcWordmark} style={styles.wordmark} resizeMode="contain" />
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.body}>
        <Text style={styles.headline}>Welcome{"\n"}back.</Text>
        <Text style={styles.subtitle}>Sign in to your Parc account</Text>

        <Pressable style={styles.biometricCard} onPress={handleBiometricPress} accessibilityRole="button">
          <View style={styles.biometricIcon}>
            <Ionicons name="finger-print" size={21} color={theme.colors.secondary} />
          </View>
          <View style={styles.biometricTextBlock}>
            <Text style={styles.biometricTitle}>Use Biometric</Text>
            <Text style={styles.biometricSubtitle}>Face ID or fingerprint — fastest way in</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={withAlpha(theme.colors.textInverse, 0.5)} />
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.optionsList}>
          <Pressable style={styles.optionRow} onPress={() => router.push("/(auth)/login")} accessibilityRole="button">
            <View style={styles.optionIcon}>
              <Ionicons name="call-outline" size={19} color={theme.colors.textPrimary} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Phone Number</Text>
              <Text style={styles.optionSubtitle}>Enter your registered number</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable style={styles.optionRow} onPress={() => router.push("/(auth)/login")} accessibilityRole="button">
            <View style={styles.optionIcon}>
              <Ionicons name="mail-outline" size={19} color={theme.colors.textPrimary} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionTitle}>Email Address</Text>
              <Text style={styles.optionSubtitle}>Enter your registered email</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          New to Parc? <Text style={styles.footerLink} onPress={() => router.push("/(auth)/register-phone")}>Create account</Text>
        </Text>
      </View>
    </ScreenContainer>
  );
}
