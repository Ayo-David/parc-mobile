import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "@/api/queries/useProfile";
import { useAuth } from "@/auth/useAuth";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useTheme } from "@/theme";

const MENU_ITEMS = [
  { label: "Security", icon: "shield-checkmark-outline" as const, href: "/profile/security" as const },
  { label: "Manage Beneficiaries", icon: "people-outline" as const, href: "/beneficiaries" as const },
  { label: "Account Limits", icon: "speedometer-outline" as const, href: "/profile/limits" as const },
  { label: "Notifications", icon: "notifications-outline" as const, href: "/profile/notifications" as const },
  { label: "Refer & Earn", icon: "gift-outline" as const, href: "/profile/referral" as const },
  { label: "Help & Support", icon: "help-circle-outline" as const, href: "/profile/support" as const },
];

/**
 * Figma "Profile/Me" tab. `GET /v1/profile` is fully typed and real.
 * "Log out" now confirms via a bottom sheet first (Figma "Account 01 —
 * Logout Confirmation", node 436:542, missing-mobile.md §8/§9) instead of
 * logging out on a single tap. "Close Account" is a new danger-zone link
 * to the real screen (see `profile/close-account.tsx`).
 */
export default function MeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { logout } = useAuth();
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

  const styles = StyleSheet.create({
    header: { paddingTop: theme.semanticSpacing.section, marginBottom: theme.semanticSpacing.section, alignItems: "center", gap: theme.spacing.xs },
    name: { ...theme.typography.text22ExtraBold, color: theme.colors.textPrimary },
    contact: { ...theme.typography.text12Regular, color: theme.colors.textSecondary },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.semanticSpacing.form,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      padding: theme.semanticSpacing.card,
      marginBottom: theme.semanticSpacing.form,
      ...theme.elevation.sm,
    },
    menuLabel: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, flex: 1 },
    logout: { ...theme.typography.text14Bold, color: theme.colors.error, textAlign: "center", marginTop: theme.semanticSpacing.section },
    closeAccount: { ...theme.typography.text12Regular, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.semanticSpacing.form },
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

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          {profile.data?.masked_phone_number ? <Text style={styles.contact}>{profile.data.masked_phone_number}</Text> : null}
          {profile.data?.masked_email ? <Text style={styles.contact}>{profile.data.masked_email}</Text> : null}
          {profile.data?.kyc_tier !== undefined ? <StatusBadge tone="info" label={`KYC Tier ${profile.data.kyc_tier}`} /> : null}
        </View>

        {MENU_ITEMS.map((item) => (
          <Pressable key={item.href} style={styles.menuItem} onPress={() => router.push(item.href)}>
            <Ionicons name={item.icon} size={theme.icon.default} color={theme.colors.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textMuted} />
          </Pressable>
        ))}

        <Pressable onPress={() => setIsLogoutSheetVisible(true)}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/profile/close-account")}>
          <Text style={styles.closeAccount}>Close account</Text>
        </Pressable>
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
