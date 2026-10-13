import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackHeader } from "@/components/BackHeader/BackHeader";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const ROWS: { label: string; icon: ComponentProps<typeof Ionicons>["name"]; href: Href }[] = [
  { label: "Change Transaction PIN", icon: "key-outline", href: "/security/transaction-pin/change" },
  { label: "Login Activity", icon: "pulse-outline", href: "/profile/security/sessions" },
  { label: "Linked Devices", icon: "phone-portrait-outline", href: "/profile/security/devices" },
];

/**
 * Figma "Security & Privacy" (233:8637). Rows are the real features:
 * Change Transaction PIN (POST /v1/security/transaction-pin/rotate), Login
 * Activity and Linked Devices (session/device revoke). Figma's other rows
 * aren't backed yet and are shown honestly rather than as working toggles:
 * Biometric Login is labelled "Coming soon" (no biometric sign-in exists in
 * the app yet). Two-Factor Auth (tenant-controlled policy, no customer
 * toggle) and Change Login Passcode (no authenticated change endpoint —
 * only the signed-out recovery flow) are omitted.
 */
export default function SecurityHomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    content: { paddingBottom: theme.semanticSpacing.section },
    toggleRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md + 2, paddingVertical: theme.spacing.lg, borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.primarySubtle },
    toggleText: { flex: 1 },
    title: { ...theme.typography.text14Bold, color: theme.colors.textPrimary },
    subtitle: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs / 2 },
    soonPill: { backgroundColor: theme.colors.primarySubtle, borderRadius: theme.radii.full, paddingHorizontal: theme.spacing.sm + 2, paddingVertical: theme.spacing.xs },
    soonText: { ...theme.typography.text11Bold, color: theme.colors.textMuted },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md + 2, paddingVertical: theme.spacing.md + 2, borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.primarySubtle },
    rowIcon: { width: theme.control.buttonSmall, height: theme.control.buttonSmall, borderRadius: theme.radii.md, backgroundColor: theme.colors.primarySubtle, alignItems: "center", justifyContent: "center" },
    rowLabel: { ...theme.typography.text14Bold, color: theme.colors.textPrimary, flex: 1 },
  });

  return (
    <ScreenContainer>
      <BackHeader title="Security & Privacy" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleRow} accessible accessibilityLabel="Biometric Login, coming soon">
          <View style={styles.toggleText}>
            <Text style={styles.title}>Biometric Login</Text>
            <Text style={styles.subtitle}>Use fingerprint or face to log in</Text>
          </View>
          <View style={styles.soonPill}>
            <Text style={styles.soonText}>Coming soon</Text>
          </View>
        </View>
        {ROWS.map((row) => (
          <Pressable key={row.label} style={styles.row} onPress={() => router.push(row.href)} accessibilityRole="button">
            <View style={styles.rowIcon}>
              <Ionicons name={row.icon} size={theme.icon.nav} color={theme.colors.textPrimary} />
            </View>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={theme.icon.inline + 2} color={theme.colors.textDisabled} />
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
