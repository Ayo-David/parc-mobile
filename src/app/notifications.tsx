import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/errors";
import { useNotifications } from "@/api/queries/useNotifications";
import type { NotificationClassification, NotificationItem } from "@/api/schemas";
import { BackHeader } from "@/components/BackHeader/BackHeader";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ErrorState } from "@/components/ErrorState/ErrorState";
import { ScreenContainer } from "@/components/ScreenContainer/ScreenContainer";
import { useTheme } from "@/theme";
import { relativeTime } from "@/utils/relativeTime";

type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Figma "Notifications" feed (233:8401): tinted 44px icon tiles, bold title,
 * relative time, body, magenta unread dot. Backed by GET /v1/notifications
 * (PUSH/IN_APP only — see notificationItemSchema). There is no mark-as-read
 * endpoint, so the unread dot reflects the server's `read_at` as-is. The gear
 * opens notification preferences.
 */
export default function NotificationsFeedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const feed = useNotifications();

  const tints: Record<NotificationClassification, { icon: IconName; background: string; color: string }> = {
    FINANCIAL: { icon: "swap-horizontal", background: theme.components.status.info.backgroundColor, color: theme.colors.info },
    CONTRACTUAL: { icon: "document-text-outline", background: theme.colors.secondarySubtle, color: theme.colors.secondary },
    KYC: { icon: "shield-checkmark-outline", background: theme.components.status.success.backgroundColor, color: theme.colors.success },
    SECURITY: { icon: "lock-closed-outline", background: theme.components.status.warning.backgroundColor, color: theme.colors.warningStrong },
    COMPLAINT: { icon: "chatbubble-ellipses-outline", background: theme.components.status.warning.backgroundColor, color: theme.colors.warningStrong },
    NON_FINANCIAL: { icon: "notifications-outline", background: theme.colors.primarySubtle, color: theme.colors.textPrimary },
  };

  const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md + 1, paddingVertical: theme.spacing.md + 1, borderBottomWidth: theme.borderWidth.hairline, borderBottomColor: theme.colors.primarySubtle },
    unreadDot: { position: "absolute", left: -theme.spacing.xs, top: theme.spacing.xxxl - 1, width: theme.spacing.sm - 2, height: theme.spacing.sm - 2, borderRadius: theme.radii.full, backgroundColor: theme.colors.secondary },
    tile: { width: theme.control.backButton, height: theme.control.backButton, borderRadius: theme.radii.input + 1, alignItems: "center", justifyContent: "center" },
    text: { flex: 1 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm },
    title: { ...theme.typography.text13p5SemiBold, color: theme.colors.textPrimary, flex: 1 },
    time: { ...theme.typography.text11Regular, color: theme.colors.textDisabled },
    body: { ...theme.typography.text12Regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs - 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    settingsButton: { padding: theme.spacing.xs },
  });

  function renderItem({ item }: { item: NotificationItem }) {
    const tint = tints[item.classification];
    const isUnread = item.read_at === null;
    return (
      <View style={styles.row} accessible accessibilityLabel={`${isUnread ? "Unread. " : ""}${item.subject ?? "Notification"}. ${item.body ?? ""}`}>
        {isUnread ? <View style={styles.unreadDot} /> : null}
        <View style={[styles.tile, { backgroundColor: tint.background }]}>
          <Ionicons name={tint.icon} size={theme.icon.nav} color={tint.color} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.subject ?? "Notification"}
            </Text>
            <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.body}>{item.content_expired ? "This message is no longer available." : (item.body ?? "")}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <BackHeader
        title="Notifications"
        right={
          <Pressable style={styles.settingsButton} onPress={() => router.push("/profile/notifications")} accessibilityRole="button" accessibilityLabel="Notification settings" hitSlop={8}>
            <Ionicons name="settings-outline" size={theme.icon.compact} color={theme.colors.textPrimary} />
          </Pressable>
        }
      />
      {feed.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : feed.isError ? (
        <ErrorState tone={feed.error instanceof ApiError && feed.error.category === "network" ? "network" : "error"} onRetry={() => void feed.refetch()} />
      ) : (
        <FlatList
          data={feed.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} tintColor={theme.colors.primary} />}
          ListEmptyComponent={<EmptyState emoji="🔔" title="No notifications yet" body="Updates about your transfers, savings, loans and account security will appear here." />}
        />
      )}
    </ScreenContainer>
  );
}
