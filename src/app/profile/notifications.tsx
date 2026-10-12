import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { useNotificationPreferences } from "@/api/queries/useNotificationPreferences";
import { queryClient } from "@/api/queryClient";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";

const CHANNELS: Array<{ key: "push_enabled" | "sms_enabled" | "email_enabled" | "in_app_enabled"; label: string }> = [
  { key: "push_enabled", label: "Push" },
  { key: "sms_enabled", label: "SMS" },
  { key: "email_enabled", label: "Email" },
  { key: "in_app_enabled", label: "In-app" },
];

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Figma "Notifications" preferences screen. `GET /v1/notification-preferences`
 * documents no response schema (PLAN.md "Real blockers") — this assumes each
 * entry mirrors the fully-typed `PUT .../:category` request body
 * (`category`, `push_enabled`, `sms_enabled`, `email_enabled`,
 * `in_app_enabled`), since that's the only confirmed shape for this
 * resource anywhere in the contract. Push-token registration itself isn't
 * wired here — it needs `expo-notifications`, a new native dependency not
 * yet installed in this app.
 */
export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const preferences = useNotificationPreferences();
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(entry: Record<string, unknown>, channel: (typeof CHANNELS)[number]["key"], nextValue: boolean) {
    const category = typeof entry.category === "string" ? entry.category : null;
    if (!category) return;
    setPendingCategory(category);
    setError(null);
    try {
      await api.updateNotificationPreference({
        category,
        pushEnabled: channel === "push_enabled" ? nextValue : asBoolean(entry.push_enabled, true),
        smsEnabled: channel === "sms_enabled" ? nextValue : asBoolean(entry.sms_enabled, true),
        emailEnabled: channel === "email_enabled" ? nextValue : asBoolean(entry.email_enabled, true),
        inAppEnabled: channel === "in_app_enabled" ? nextValue : asBoolean(entry.in_app_enabled, true),
      });
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    } catch (updateError) {
      setError(updateError instanceof ApiError ? updateError.message : "Something went wrong. Please try again.");
    } finally {
      setPendingCategory(null);
    }
  }

  const styles = StyleSheet.create({
    content: { paddingTop: theme.semanticSpacing.section, gap: theme.semanticSpacing.form, paddingBottom: theme.semanticSpacing.section },
    primingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.secondarySubtle,
      borderRadius: theme.radii.card,
      padding: theme.semanticSpacing.form,
    },
    primingText: { ...theme.typography.label, color: theme.colors.textPrimary, flex: 1 },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.card, padding: theme.semanticSpacing.card, gap: theme.semanticSpacing.component, ...theme.elevation.sm },
    categoryLabel: { ...theme.typography.h4, color: theme.colors.textPrimary },
    channelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    channelLabel: { ...theme.typography.bodyMedium, color: theme.colors.textSecondary },
    emptyText: { ...theme.typography.bodyMedium, color: theme.colors.textMuted },
    error: { ...theme.typography.bodySmall, color: theme.colors.error },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (preferences.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const entries = preferences.data ?? [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.primingBanner} onPress={() => router.push("/profile/notification-priming")}>
          <Ionicons name="notifications-outline" size={theme.icon.default} color={theme.colors.secondary} />
          <Text style={styles.primingText}>Turn on push notifications</Text>
          <Ionicons name="chevron-forward" size={theme.icon.compact} color={theme.colors.textMuted} />
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No notification categories found.</Text>
        ) : (
          entries.map((entry, index) => {
            const category = typeof entry.category === "string" ? entry.category : `Category ${index + 1}`;
            const isPending = pendingCategory === category;
            return (
              <View key={category} style={styles.card}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {CHANNELS.map((channel) => (
                  <View key={channel.key} style={styles.channelRow}>
                    <Text style={styles.channelLabel}>{channel.label}</Text>
                    <Switch
                      value={asBoolean(entry[channel.key], true)}
                      disabled={isPending}
                      onValueChange={(next) => handleToggle(entry, channel.key, next)}
                      trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                    />
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
