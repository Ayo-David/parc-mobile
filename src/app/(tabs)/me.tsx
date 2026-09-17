import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useProfile } from "@/api/queries/useProfile";
import { useAuth } from "@/auth/useAuth";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useTheme } from "@/theme";

const MENU_ITEMS = [
  { label: "Security", icon: "shield-checkmark-outline" as const, href: "/profile/security" as const },
  { label: "Notifications", icon: "notifications-outline" as const, href: "/profile/notifications" as const },
  { label: "Refer & Earn", icon: "gift-outline" as const, href: "/profile/referral" as const },
  { label: "Help & Support", icon: "help-circle-outline" as const, href: "/profile/support" as const },
];

/** Figma "Profile/Me" tab. `GET /v1/profile` is fully typed and real. */
export default function MeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const { logout } = useAuth();

  const styles = StyleSheet.create({
    header: { paddingTop: theme.semanticSpacing.section, marginBottom: theme.semanticSpacing.section, alignItems: "center", gap: theme.spacing.xs },
    name: { ...theme.typography.h3, color: theme.colors.textPrimary },
    contact: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.semanticSpacing.form,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.card,
      marginBottom: theme.semanticSpacing.form,
      ...theme.elevation.sm,
    },
    menuLabel: { ...theme.typography.bodyMedium, color: theme.colors.textPrimary, flex: 1 },
    logout: { ...theme.typography.bodyMedium, color: theme.colors.error, textAlign: "center", marginTop: theme.semanticSpacing.section },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (profile.isLoading) {
    return (
      <ScreenContainer hasFloatingTabBar>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const fullName = [profile.data?.first_name, profile.data?.last_name].filter(Boolean).join(" ") || "Your account";

  return (
    <ScreenContainer hasFloatingTabBar>
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

        <Pressable onPress={() => void logout()}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
