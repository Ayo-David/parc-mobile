import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useState, type ComponentProps } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "@/api/queries/useProfile";
import { useWalletFundingDetails } from "@/api/queries/useWalletFundingDetails";
import { useAuth } from "@/auth/useAuth";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme, withAlpha } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type Tint = "neutral" | "magenta" | "info" | "success" | "warning";

// Figma "MeScreen" menu (233:7677–233:7730): tinted 42px icon tiles. Manage
// Beneficiaries and Appearance are real features Figma doesn't list, added in the same style.
const MENU_ITEMS: { label: string; icon: IconName; tint: Tint; href: Href }[] = [
  { label: "Edit Profile", icon: "person-outline", tint: "neutral", href: "/profile/edit" },
  { label: "Refer & Earn", icon: "gift-outline", tint: "magenta", href: "/profile/referral" },
  { label: "Notifications", icon: "notifications-outline", tint: "info", href: "/profile/notifications" },
  { label: "Security & Privacy", icon: "shield-checkmark-outline", tint: "success", href: "/profile/security" },
  { label: "Appearance", icon: "contrast-outline", tint: "neutral", href: "/profile/appearance" },
  { label: "Manage Beneficiaries", icon: "people-outline", tint: "neutral", href: "/beneficiaries" },
  { label: "Help & Support", icon: "help-circle-outline", tint: "warning", href: "/profile/support" },
];

/**
 * Figma "Me" tab (233:7605). Everything shown is real: name and masked
 * contacts from GET /v1/profile, the virtual account from GET
 * /v1/wallet/funding-details (tap to copy). Figma's "✓ Verified" badge and
 * "Parc Premium · KYC Level 3" claim aren't backed by any field the live
 * profile returns (no kyc_tier/verification status), so the dark card
 * instead leads to the real Account Limits screen and shows the KYC level
 * only when the server provides one. Figma's "₦5,000" referral pill is
 * omitted for the same reason. Sign Out confirms via a bottom sheet
 * (Figma "Account 01 — Logout Confirmation", 436:542).
 */
export default function MeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const funding = useWalletFundingDetails();
  const { logout } = useAuth();
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const tints: Record<Tint, { background: string; color: string }> = {
    neutral: { background: theme.colors.primarySubtle, color: theme.colors.textPrimary },
    magenta: { background: theme.colors.secondarySubtle, color: theme.colors.secondary },
    info: { background: theme.components.status.info.backgroundColor, color: theme.colors.info },
    success: { background: theme.components.status.success.backgroundColor, color: theme.colors.success },
    warning: { background: theme.components.status.warning.backgroundColor, color: theme.colors.warningStrong },
  };

  const styles = StyleSheet.create({
    content: { paddingTop: theme.spacing.sm, paddingBottom: theme.semanticSpacing.section },
    header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md + 2, paddingTop: theme.spacing.lg + 2, paddingBottom: theme.spacing.md + 2 },
    avatar: {
      width: theme.control.iconButtonXl,
      height: theme.control.iconButtonXl,
      borderRadius: theme.radii.card + 2,
      backgroundColor: theme.colors.surfaceInverse,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { ...theme.typography.text22ExtraBold, color: theme.colors.textInverse },
    identity: { flex: 1 },
    name: { ...theme.typography.text16ExtraBold, color: theme.colors.textPrimary },
    contact: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs / 2 },
    settingsButton: {
      width: theme.control.backButtonCompact,
      height: theme.control.backButtonCompact,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.primarySubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    limitsCard: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md + 1, borderRadius: theme.radii.lg },
    limitsIcon: { width: theme.control.buttonSmall, height: theme.control.buttonSmall, borderRadius: theme.radii.md, backgroundColor: theme.colors.secondary, alignItems: "center", justifyContent: "center" },
    limitsText: { flex: 1 },
    limitsTitle: { ...theme.typography.text13ExtraBold, color: theme.colors.textInverse },
    limitsBody: { ...theme.typography.text11p5Regular, color: withAlpha(theme.colors.textInverse, 0.45), marginTop: theme.spacing.xs / 2 },
    limitsPill: { borderWidth: theme.borderWidth.hairline, borderColor: withAlpha(theme.colors.textInverse, 0.1), borderRadius: theme.radii.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    limitsPillText: { ...theme.typography.text11Bold, color: withAlpha(theme.colors.textInverse, 0.35) },
    accountRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginTop: theme.semanticSpacing.card, backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.lg, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md + 1 },
    accountText: { ...theme.typography.text13Regular, color: theme.colors.textMuted, flex: 1 },
    accountNumber: { ...theme.typography.text13Bold, color: theme.colors.textPrimary },
    menu: { gap: theme.spacing.xs, marginTop: theme.semanticSpacing.card },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md + 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: theme.borderWidth.hairline,
      borderColor: theme.colors.divider,
      padding: theme.spacing.md + 2,
    },
    menuIcon: { width: theme.control.buttonSmall + 2, height: theme.control.buttonSmall + 2, borderRadius: theme.radii.md, alignItems: "center", justifyContent: "center" },
    menuLabel: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, flex: 1 },
    signOutGap: { marginTop: theme.spacing.sm },
    signOutLabel: { color: theme.colors.error },
    footer: { alignItems: "center", gap: theme.spacing.sm, paddingTop: theme.spacing.xxl },
    version: { ...theme.typography.text11p5Regular, color: theme.colors.textDisabled },
    closeAccount: { ...theme.typography.text12Regular, color: theme.colors.textMuted },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    sheetTitle: { ...theme.typography.text18ExtraBold, color: theme.colors.textPrimary, textAlign: "center", marginBottom: theme.spacing.sm },
    sheetBody: { ...theme.typography.text13Regular, color: theme.colors.textSecondary, textAlign: "center", marginBottom: theme.semanticSpacing.component },
    sheetActions: { gap: theme.semanticSpacing.form },
  });

  if (profile.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const fullName = [profile.data?.first_name, profile.data?.last_name].filter(Boolean).join(" ") || "Your account";
  const initials =
    [profile.data?.first_name, profile.data?.last_name]
      .filter((part): part is string => !!part)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?";
  const kycTier = profile.data?.kyc_tier;
  const appVersion = Constants.expoConfig?.version;

  async function copyAccountNumber() {
    if (!funding.data) return;
    await Clipboard.setStringAsync(funding.data.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={2}>
              {fullName}
            </Text>
            {profile.data?.masked_phone_number ? <Text style={styles.contact}>{profile.data.masked_phone_number}</Text> : null}
            {profile.data?.masked_email ? <Text style={styles.contact}>{profile.data.masked_email}</Text> : null}
          </View>
          <Pressable style={styles.settingsButton} onPress={() => router.push("/profile/security")} accessibilityRole="button" accessibilityLabel="Security settings">
            <Ionicons name="settings-outline" size={theme.icon.nav - 1} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/profile/limits")} accessibilityRole="button" accessibilityLabel="Account limits">
          <LinearGradient colors={[theme.colors.mediaBackground, theme.colors.surfaceInverse]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.limitsCard}>
            <View style={styles.limitsIcon}>
              <Ionicons name="star-outline" size={theme.icon.compact} color={theme.colors.textInverse} />
            </View>
            <View style={styles.limitsText}>
              <Text style={styles.limitsTitle}>{kycTier !== undefined ? `KYC Level ${kycTier}` : "Account limits"}</Text>
              <Text style={styles.limitsBody}>See how much you can send and receive</Text>
            </View>
            <View style={styles.limitsPill}>
              <Text style={styles.limitsPillText}>View</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {funding.data ? (
          <Pressable style={styles.accountRow} onPress={() => void copyAccountNumber()} accessibilityRole="button" accessibilityLabel="Copy virtual account number">
            <Text style={styles.accountText} numberOfLines={1}>
              {copied ? (
                "Account number copied"
              ) : (
                <>
                  Virtual Account: <Text style={styles.accountNumber}>{funding.data.account_number}</Text> · {funding.data.bank_name}
                </>
              )}
            </Text>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={theme.icon.inline + 2} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable key={item.label} style={styles.menuItem} onPress={() => router.push(item.href)} accessibilityRole="button">
              <View style={[styles.menuIcon, { backgroundColor: tints[item.tint].background }]}>
                <Ionicons name={item.icon} size={theme.icon.nav} color={tints[item.tint].color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={theme.icon.inline + 2} color={theme.colors.textDisabled} />
            </Pressable>
          ))}
          <Pressable style={[styles.menuItem, styles.signOutGap]} onPress={() => setIsLogoutSheetVisible(true)} accessibilityRole="button">
            <View style={[styles.menuIcon, { backgroundColor: theme.components.status.error.backgroundColor }]}>
              <Ionicons name="log-out-outline" size={theme.icon.nav} color={theme.colors.error} />
            </View>
            <Text style={[styles.menuLabel, styles.signOutLabel]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={theme.icon.inline + 2} color={theme.colors.textDisabled} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          {appVersion ? <Text style={styles.version}>Parc v{appVersion}</Text> : null}
          <Pressable onPress={() => router.push("/profile/close-account")} accessibilityRole="button">
            <Text style={styles.closeAccount}>Close account</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet visible={isLogoutSheetVisible} onClose={() => setIsLogoutSheetVisible(false)}>
        <Text style={styles.sheetTitle}>Log out of Parc?</Text>
        <Text style={styles.sheetBody}>You&apos;ll need to sign in again with your passcode or biometrics to access your account.</Text>
        <View style={styles.sheetActions}>
          <Button label="Log out" onPress={() => void logout()} />
          <Button label="Cancel" variant="tertiary" onPress={() => setIsLogoutSheetVisible(false)} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}
